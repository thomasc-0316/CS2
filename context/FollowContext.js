import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, increment, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from './AuthContext';

const FollowContext = createContext();

export const FollowProvider = ({ children }) => {
  const { currentUser } = useAuth();
  // Structure: { userId: { username, profilePicture, playerID } }
  const [following, setFollowing] = useState({});
  const [followers, setFollowers] = useState({});

  // Load data from storage on app start
  useEffect(() => {
    loadFollowData();
  }, []);

  const loadFollowData = async () => {
    try {
      const savedFollowing = await AsyncStorage.getItem('following');
      const savedFollowers = await AsyncStorage.getItem('followers');

      if (savedFollowing) {
        setFollowing(JSON.parse(savedFollowing));
      }
      if (savedFollowers) {
        setFollowers(JSON.parse(savedFollowers));
      }
    } catch (error) {
      console.error('Failed to load follow data:', error);
    }
  };

  const saveFollowing = async (newFollowing) => {
    try {
      await AsyncStorage.setItem('following', JSON.stringify(newFollowing));
    } catch (error) {
      console.error('Failed to save following:', error);
    }
  };

  const saveFollowers = async (newFollowers) => {
    try {
      await AsyncStorage.setItem('followers', JSON.stringify(newFollowers));
    } catch (error) {
      console.error('Failed to save followers:', error);
    }
  };

  const bumpRemoteCounts = async (targetUserId, delta) => {
    if (!currentUser) return;
    try {
      const targetRef = doc(db, 'users', targetUserId);
      await updateDoc(targetRef, {
        followers: increment(delta),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Failed to update target follower count', error);
    }

    try {
      const myRef = doc(db, 'users', currentUser.uid);
      await updateDoc(myRef, {
        following: increment(delta),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Failed to update following count', error);
    }
  };

  const followUser = async (userId, username, profilePicture, playerID) => {
    if (!userId || !currentUser || userId === currentUser.uid || isFollowing(userId)) return;
    setFollowing(prev => {
      if (prev[userId]) return prev;
      const newFollowing = {
        ...prev,
        [userId]: { username, profilePicture, playerID },
      };
      saveFollowing(newFollowing);
      return newFollowing;
    });

    await bumpRemoteCounts(userId, 1);
  };

  const unfollowUser = async (userId) => {
    if (!userId || !currentUser || !isFollowing(userId)) return;
    setFollowing(prev => {
      if (!prev[userId]) return prev;
      const newFollowing = { ...prev };
      delete newFollowing[userId];
      saveFollowing(newFollowing);
      return newFollowing;
    });

    await bumpRemoteCounts(userId, -1);
  };

  const isFollowing = (userId) => {
    return !!following[userId];
  };

  const getFollowing = () => {
    return Object.keys(following).map(userId => ({
      id: userId,
      ...following[userId],
    }));
  };

  const getFollowers = () => {
    return Object.keys(followers).map(userId => ({
      id: userId,
      ...followers[userId],
    }));
  };

  const getFollowingCount = () => {
    return Object.keys(following).length;
  };

  const getFollowersCount = () => {
    return Object.keys(followers).length;
  };

  // Get follower count for a specific user (how many people follow them)
  const getUserFollowerCount = (userId) => {
    // Check if the current user is following this user
    return isFollowing(userId) ? 1 : 0;
  };

  return (
    <FollowContext.Provider value={{
      followUser,
      unfollowUser,
      isFollowing,
      getFollowing,
      getFollowers,
      getFollowingCount,
      getFollowersCount,
      getUserFollowerCount,
    }}>
      {children}
    </FollowContext.Provider>
  );
};

export const useFollow = () => {
  const context = useContext(FollowContext);
  if (!context) {
    throw new Error('useFollow must be used within FollowProvider');
  }
  return context;
};
