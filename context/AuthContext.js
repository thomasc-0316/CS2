import React, { createContext, useState, useEffect, useContext } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';

const AuthContext = createContext();

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

      // 2. Update display name in Auth
      await updateProfile(user, {
        displayName: displayName || username
      });

      // 3. Create Firestore user document
      await setDoc(doc(db, 'users', user.uid), {
        id: user.uid,
        username: username,
        email: email,
        displayName: displayName || username,
        bio: '',
        profilePicture: null,
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
        lastActive: serverTimestamp()
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

  // Update user profile in Firestore (and Auth display name) then refresh local state
  const updateUserProfile = async (updates = {}) => {
    if (!auth.currentUser) {
      throw new Error('No authenticated user');
    }

    const uid = auth.currentUser.uid;
    const safeUpdates = { ...updates, updatedAt: serverTimestamp() };

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
      if (user) {
        // User is logged in, fetch their profile
        const profile = await getUserProfile(user.uid);
        setCurrentUser({
          ...user,
          profile: profile
        });
      } else {
        // User is logged out
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    signup,
    login,
    logout,
    loading,
    getUserProfile,
    updateUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
