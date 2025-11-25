import React, { createContext, useState, useEffect, useContext } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { db } from '../firebaseConfig';

const ProfileContext = createContext();

export const ProfileProvider = ({ children }) => {
  const [profile, setProfile] = useState({
    username: 'Player',
    playerID: null,
    bio: '',
    pronouns: '',
    links: '',
    profilePicture: null,
  });
  const { currentUser } = useAuth();

  // Generate unique player ID
  const generatePlayerID = () => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${timestamp}${random}`;
  };

  // Load profile from Firestore when user is available
  useEffect(() => {
    if (!currentUser?.uid) {
      setProfile({
        username: 'Player',
        playerID: null,
        bio: '',
        pronouns: '',
        links: '',
        profilePicture: null,
      });
      return;
    }

    loadProfile(currentUser);
  }, [currentUser]);

  const loadProfile = async (user) => {
    try {
      const docRef = doc(db, 'users', user.uid);
      const snapshot = await getDoc(docRef);
      const fallbackUsername = user.email?.split('@')[0] || 'Player';

      if (snapshot.exists()) {
        const data = snapshot.data() || {};
        const nextProfile = {
          username: data.username || fallbackUsername,
          playerID: data.playerID || generatePlayerID(),
          bio: data.bio || '',
          pronouns: data.pronouns || '',
          links: data.links || '',
          profilePicture: data.profilePicture || null,
          followers: data.followers || 0,
          following: data.following || 0,
        };

        if (!data.playerID) {
          await setDoc(docRef, { playerID: nextProfile.playerID }, { merge: true });
        }

        setProfile(nextProfile);
        return;
      }

      // Legacy/missing doc: create a minimal profile once
      const newProfile = {
        username: fallbackUsername,
        playerID: generatePlayerID(),
        bio: '',
        pronouns: '',
        links: '',
        profilePicture: null,
        followers: 0,
        following: 0,
      };

      await setDoc(
        docRef,
        {
          id: user.uid,
          email: user.email || '',
          username: newProfile.username,
          playerID: newProfile.playerID,
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
            language: 'en',
          },
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastActive: serverTimestamp(),
        },
        { merge: true }
      );

      setProfile(newProfile);
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

  const updateProfile = (updates) => {
    setProfile((prev) => ({ ...prev, ...updates }));
  };

  return (
    <ProfileContext.Provider value={{ profile, updateProfile }}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within ProfileProvider');
  }
  return context;
};
