import React, { createContext, useState, useEffect, useContext, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const UpvoteContext = createContext();

export const UpvoteProvider = ({ children }) => {
  const [upvotedLineups, setUpvotedLineups] = useState(() => new Set());

  // Load upvotes from storage on app start
  useEffect(() => {
    let cancelled = false;
    const loadUpvotes = async () => {
      try {
        const saved = await AsyncStorage.getItem('upvotedLineups');
        if (cancelled) return;
        if (saved) {
          setUpvotedLineups(new Set(JSON.parse(saved)));
        }
      } catch (error) {
        console.error('Failed to load upvotes:', error);
      }
    };
    loadUpvotes();
    return () => {
      cancelled = true;
    };
  }, []);

  const saveUpvotes = useCallback(async (newUpvotes) => {
    try {
      await AsyncStorage.setItem('upvotedLineups', JSON.stringify([...newUpvotes]));
    } catch (error) {
      console.error('Failed to save upvotes:', error);
    }
  }, []);

  const toggleUpvote = useCallback(
    (lineupId) => {
      setUpvotedLineups((prev) => {
        const newUpvotes = new Set(prev);
        if (newUpvotes.has(lineupId)) {
          newUpvotes.delete(lineupId);
        } else {
          newUpvotes.add(lineupId);
        }
        saveUpvotes(newUpvotes);
        return newUpvotes;
      });
    },
    [saveUpvotes],
  );

  const isUpvoted = useCallback(
    (lineupId) => upvotedLineups.has(lineupId),
    [upvotedLineups],
  );

  // Memoized so identity is stable across renders that don't change the
  // upvote set — fixes the L3 finding where HomeScreen's sort comparator
  // re-ran every render because getUpvoteCount kept changing identity.
  const getUpvoteCount = useCallback(
    (lineup) => (lineup?.upvotes || 0) + (upvotedLineups.has(lineup?.id) ? 1 : 0),
    [upvotedLineups],
  );

  const value = useMemo(
    () => ({ toggleUpvote, isUpvoted, getUpvoteCount }),
    [toggleUpvote, isUpvoted, getUpvoteCount],
  );

  return <UpvoteContext.Provider value={value}>{children}</UpvoteContext.Provider>;
};

export const useUpvotes = () => {
  const context = useContext(UpvoteContext);
  if (!context) {
    throw new Error('useUpvotes must be used within UpvoteProvider');
  }
  return context;
};
