import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

  // Generate unique player ID
  const generatePlayerID = () => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${timestamp}${random}`;
  };

  // Load profile from storage on app start
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const saved = await AsyncStorage.getItem('userProfile');
      if (saved) {
        const savedProfile = JSON.parse(saved);
        // Generate playerID if it doesn't exist
        if (!savedProfile.playerID) {
          savedProfile.playerID = generatePlayerID();
          await AsyncStorage.setItem('userProfile', JSON.stringify(savedProfile));
        }
        setProfile(savedProfile);
      } else {
        // First time user - generate playerID
        const newProfile = {
          username: 'Player',
          playerID: generatePlayerID(),
          bio: '',
          pronouns: '',
          links: '',
          profilePicture: null,
        };
        await AsyncStorage.setItem('userProfile', JSON.stringify(newProfile));
        setProfile(newProfile);
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

  const saveProfile = async (newProfile) => {
    try {
      await AsyncStorage.setItem('userProfile', JSON.stringify(newProfile));
      setProfile(newProfile);
    } catch (error) {
      console.error('Failed to save profile:', error);
    }
  };

  const updateProfile = (updates) => {
    const updatedProfile = { ...profile, ...updates };
    saveProfile(updatedProfile);
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