import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const UpvoteContext = createContext();

export const UpvoteProvider = ({ children }) => {
  const [upvotedLineups, setUpvotedLineups] = useState(new Set());

  // Load upvotes from storage on app start
  useEffect(() => {
    loadUpvotes();
  }, []);

  const loadUpvotes = async () => {
    try {
      const saved = await AsyncStorage.getItem('upvotedLineups');
      if (saved) {
        setUpvotedLineups(new Set(JSON.parse(saved)));
      }
    } catch (error) {
      console.error('Failed to load upvotes:', error);
    }
  };

  const saveUpvotes = async (newUpvotes) => {
    try {
      await AsyncStorage.setItem('upvotedLineups', JSON.stringify([...newUpvotes]));
    } catch (error) {
      console.error('Failed to save upvotes:', error);
    }
  };

  const toggleUpvote = (lineupId) => {
    setUpvotedLineups(prev => {
      const newUpvotes = new Set(prev);
      if (newUpvotes.has(lineupId)) {
        newUpvotes.delete(lineupId);
      } else {
        newUpvotes.add(lineupId);
      }
      saveUpvotes(newUpvotes);
      return newUpvotes;
    });
  };

  const isUpvoted = (lineupId) => {
    return upvotedLineups.has(lineupId);
  };

  const getUpvoteCount = (lineup) => {
    return lineup.upvotes + (upvotedLineups.has(lineup.id) ? 1 : 0);
  };

  return (
    <UpvoteContext.Provider value={{ toggleUpvote, isUpvoted, getUpvoteCount }}>
      {children}
    </UpvoteContext.Provider>
  );
};

export const useUpvotes = () => {
  const context = useContext(UpvoteContext);
  if (!context) {
    throw new Error('useUpvotes must be used within UpvoteProvider');
  }
  return context;
};