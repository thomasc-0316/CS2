import React, { createContext, useState, useEffect, useContext } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithCredential
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';

const AuthContext = createContext();

const generatePlayerID = () => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${timestamp}${random}`;
};

const toLower = (value = '') => value.toString().trim().toLowerCase();

// Create Firestore user document if it does not exist
const createUserProfileDocument = async (user, overrides = {}) => {
  if (!user?.uid) return null;

  const userDocRef = doc(db, 'users', user.uid);
  const existingDoc = await getDoc(userDocRef);

  if (!existingDoc.exists()) {
    const username =
      overrides.username ||
      user.displayName ||
      user.email?.split('@')[0] ||
      'player';

    const profileData = {
      id: user.uid,
      username,
      usernameLower: toLower(username),
      email: overrides.email || user.email || '',
      displayName: overrides.displayName || user.displayName || username,
      playerID: overrides.playerID || generatePlayerID(),
      bio: '',
      profilePicture: overrides.profilePicture ?? user.photoURL ?? null,
      pronouns: '',
      followers: 0,
      following: 0,
      totalLineups: 0,
      totalUpvotes: 0,
      isVerified: false,
      isBanned: false,
      role: 'user',
      settings: {
        notifications: true,
        privateProfile: false,
        language: 'en'
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastActive: serverTimestamp(),
      ...overrides
    };

    await setDoc(userDocRef, profileData);
    return { id: user.uid, ...profileData };
  }

  return { id: existingDoc.id, ...existingDoc.data() };
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sign up with email and password
  const signup = async (email, password, username, displayName) => {
    try {
      // 1. Create Firebase Auth account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const playerID = generatePlayerID();

      // 2. Update display name in Auth
      await updateProfile(user, {
        displayName: displayName || username
      });

      // 3. Create Firestore user document
      await createUserProfileDocument(user, {
        username,
        displayName: displayName || username,
        email,
        playerID
      });

      return user;
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  // Login with email and password
  const login = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  // Login with Google ID token (Firebase credential)
  const loginWithGoogle = async (idToken) => {
    try {
      if (!idToken) {
        throw new Error('Missing Google ID token');
      }

      const credential = GoogleAuthProvider.credential(idToken);
      const userCredential = await signInWithCredential(auth, credential);
      const user = userCredential.user;

      await createUserProfileDocument(user, {
        email: user.email,
        displayName: user.displayName || user.email?.split('@')[0],
        username: user.displayName || user.email?.split('@')[0],
        profilePicture: user.photoURL || null
      });

      return user;
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    }
  };

  // Update user profile in Firestore (and Auth display name) then refresh local state
  const updateUserProfile = async (updates = {}) => {
    if (!auth.currentUser) {
      throw new Error('No authenticated user');
    }

    const uid = auth.currentUser.uid;
    const safeUpdates = {
      ...updates,
      ...(updates.username ? { usernameLower: toLower(updates.username) } : {}),
      updatedAt: serverTimestamp(),
    };

    await setDoc(doc(db, 'users', uid), safeUpdates, { merge: true });

    if (updates.displayName || updates.username) {
      await updateProfile(auth.currentUser, {
        displayName: updates.displayName || updates.username
      });
    }

    const freshProfile = await getUserProfile(uid);
    setCurrentUser((prev) =>
      prev
        ? {
            ...prev,
            profile: freshProfile
          }
        : prev
    );

    return freshProfile;
  };

  // Logout
  const logout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null); // ensure UI immediately reflects logout
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  // Get full user profile from Firestore
  const getUserProfile = async (uid) => {
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  };

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setCurrentUser(null);
        setLoading(false);
        return;
      }

      try {
        // User is logged in, fetch their profile
        let profile = await getUserProfile(user.uid);

        // Ensure a Firestore profile exists (covers first-time Google sign-in)
        if (!profile) {
          profile = await createUserProfileDocument(user);
        }

        setCurrentUser({
          ...user,
          profile: profile
        });
      } catch (error) {
        console.error('Auth bootstrap error:', error);
        setCurrentUser(null);
        try {
          await signOut(auth);
        } catch (_) {
          // ignore sign-out errors here
        }
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    signup,
    login,
    loginWithGoogle,
    logout,
    loading,
    getUserProfile,
    updateUserProfile,
    signUpWithEmail: signup,
    signInWithEmail: login,
    signOutUser: logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
