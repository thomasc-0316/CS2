import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FollowContext = createContext();

export const FollowProvider = ({ children }) => {
  // Structure: { userId: { username, profilePicture } }
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

  const followUser = (userId, username, profilePicture) => {
    setFollowing(prev => {
      const newFollowing = {
        ...prev,
        [userId]: { username, profilePicture },
      };
      saveFollowing(newFollowing);
      return newFollowing;
    });
  };

  const unfollowUser = (userId) => {
    setFollowing(prev => {
      const newFollowing = { ...prev };
      delete newFollowing[userId];
      saveFollowing(newFollowing);
      return newFollowing;
    });
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
