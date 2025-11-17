import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FavoritesContext = createContext();

export const FavoritesProvider = ({ children }) => {
  const [favoriteLineups, setFavoriteLineups] = useState(new Set());

  // Load favorites from storage on app start
  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const saved = await AsyncStorage.getItem('favoriteLineups');
      if (saved) {
        setFavoriteLineups(new Set(JSON.parse(saved)));
      }
    } catch (error) {
      console.error('Failed to load favorites:', error);
    }
  };

  const saveFavorites = async (newFavorites) => {
    try {
      await AsyncStorage.setItem('favoriteLineups', JSON.stringify([...newFavorites]));
    } catch (error) {
      console.error('Failed to save favorites:', error);
    }
  };

  const toggleFavorite = (lineupId) => {
    setFavoriteLineups(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(lineupId)) {
        newFavorites.delete(lineupId);
      } else {
        newFavorites.add(lineupId);
      }
      saveFavorites(newFavorites);
      return newFavorites;
    });
  };

  const isFavorite = (lineupId) => {
    return favoriteLineups.has(lineupId);
  };

  const getFavorites = () => {
    return Array.from(favoriteLineups);
  };

  return (
    <FavoritesContext.Provider value={{ toggleFavorite, isFavorite, getFavorites }}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within FavoritesProvider');
  }
  return context;
};