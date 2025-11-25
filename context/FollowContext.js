import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  collection,
  deleteDoc,
  doc,
  increment,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
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

    await upsertFollowerRecord(userId);
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

    await removeFollowerRecord(userId);
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
