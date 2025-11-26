import React, { createContext, useState, useEffect, useContext, useRef, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from './AuthContext';

const FollowContext = createContext();

export const FollowProvider = ({ children }) => {
  const { currentUser } = useAuth();
  // Structure: { userId: { username, profilePicture, playerID } }
  const [following, setFollowing] = useState({});
  const [followers, setFollowers] = useState({});
  const followersUnsubscribeRef = useRef(null);

  const storageKey = (base) => {
    return currentUser?.uid ? `${base}_${currentUser.uid}` : base;
  };

  // Load data from storage when auth user changes
  useEffect(() => {
    loadFollowData();
    startFollowersListener();
    return () => {
      if (followersUnsubscribeRef.current) {
        followersUnsubscribeRef.current();
        followersUnsubscribeRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.uid]);

  const loadFollowData = async () => {
    try {
      if (!currentUser?.uid) {
        setFollowing({});
        setFollowers({});
        return;
      }
      const savedFollowing =
        (await AsyncStorage.getItem(storageKey('following'))) ||
        (await AsyncStorage.getItem('following')); // legacy key
      const savedFollowers =
        (await AsyncStorage.getItem(storageKey('followers'))) ||
        (await AsyncStorage.getItem('followers')); // legacy key

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
      await AsyncStorage.setItem(storageKey('following'), JSON.stringify(newFollowing));
    } catch (error) {
      console.error('Failed to save following:', error);
    }
  };

  const saveFollowers = async (newFollowers) => {
    try {
      await AsyncStorage.setItem(storageKey('followers'), JSON.stringify(newFollowers));
    } catch (error) {
      console.error('Failed to save followers:', error);
    }
  };

  // Keep current user's followers list in sync with Firestore
  const startFollowersListener = () => {
    if (!currentUser?.uid) {
      setFollowers({});
      return;
    }

    if (followersUnsubscribeRef.current) {
      followersUnsubscribeRef.current();
      followersUnsubscribeRef.current = null;
    }

    const followersRef = collection(db, 'users', currentUser.uid, 'followers');
    followersUnsubscribeRef.current = onSnapshot(
      followersRef,
      (snapshot) => {
        const nextFollowers = {};
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() || {};
          nextFollowers[docSnap.id] = {
            username: data.username || 'Player',
            profilePicture: data.profilePicture || null,
            playerID: data.playerID || null,
          };
        });
        setFollowers(nextFollowers);
        saveFollowers(nextFollowers);
      },
      (error) => {
        console.error('Failed to listen to followers', error);
      }
    );
  };

  // Note: Follower counts are automatically updated by Cloud Functions
  // when follower documents are added/removed in the subcollection

  const upsertFollowerRecord = async (targetUserId) => {
    if (!currentUser?.uid) return;
    try {
      const followerProfile = currentUser.profile || {};
      const followerData = {
        id: currentUser.uid,
        username:
          followerProfile.username ||
          currentUser.displayName ||
          currentUser.email ||
          'Player',
        profilePicture:
          followerProfile.profilePicture ||
          currentUser.photoURL ||
          null,
        playerID: followerProfile.playerID || null,
        createdAt: serverTimestamp(),
      };
      const followerDoc = doc(db, 'users', targetUserId, 'followers', currentUser.uid);
      await setDoc(followerDoc, followerData, { merge: true });
    } catch (error) {
      console.error('Failed to upsert follower record', error);
    }
  };

  const removeFollowerRecord = async (targetUserId) => {
    if (!currentUser?.uid) return;
    try {
      const followerDoc = doc(db, 'users', targetUserId, 'followers', currentUser.uid);
      await deleteDoc(followerDoc);
    } catch (error) {
      console.error('Failed to remove follower record', error);
    }
  };

  const followUser = async (userId, username, profilePicture, playerID) => {
    if (!userId || !currentUser || userId === currentUser.uid) return;
    const existingKey = findFollowingKey(userId, playerID, username);
    if (existingKey) return;
    setFollowing(prev => {
      if (prev[userId]) return prev;
      const newFollowing = {
        ...prev,
        [userId]: { username, profilePicture, playerID },
      };
      saveFollowing(newFollowing);
      return newFollowing;
    });

    // Cloud Function will automatically update counts when follower record is created
    await upsertFollowerRecord(userId);
  };

  const unfollowUser = async (userId, playerID, username) => {
    if (!userId || !currentUser) return;
    const targetKey = findFollowingKey(userId, playerID, username);
    if (!targetKey) return;
    setFollowing(prev => {
      if (!prev[targetKey]) return prev;
      const newFollowing = { ...prev };
      delete newFollowing[targetKey];
      saveFollowing(newFollowing);
      return newFollowing;
    });

    // Cloud Function will automatically update counts when follower record is removed
    await removeFollowerRecord(targetKey);
  };

  const isFollowing = (userId, playerID, username) => {
    return findFollowingKey(userId, playerID, username) !== null;
  };

  const findFollowingKey = (userId, playerID, username) => {
    if (following[userId]) return userId;
    if (playerID) {
      const matchId = Object.keys(following).find(
        (id) => following[id]?.playerID && following[id].playerID === playerID
      );
      if (matchId) return matchId;
    }
    if (username) {
      const lower = username.toLowerCase();
      const matchId = Object.keys(following).find(
        (id) => (following[id]?.username || '').toLowerCase() === lower
      );
      if (matchId) return matchId;
    }
    return null;
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
    // Counts are tracked on user documents; return 0 to avoid local double-counting overlays.
    return 0;
  };

  const refreshFollowers = useCallback(async () => {
    if (!currentUser?.uid) {
      setFollowers({});
      return;
    }
    try {
      const snapshot = await getDocs(collection(db, 'users', currentUser.uid, 'followers'));
      const nextFollowers = {};
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() || {};
        nextFollowers[docSnap.id] = {
          username: data.username || 'Player',
          profilePicture: data.profilePicture || null,
          playerID: data.playerID || null,
        };
      });
      setFollowers(nextFollowers);
      saveFollowers(nextFollowers);
    } catch (error) {
      console.error('Failed to refresh followers', error);
    }
  }, [currentUser?.uid]);

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
      refreshFollowers,
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
