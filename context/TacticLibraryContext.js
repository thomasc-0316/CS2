import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'savedTactics';
const TacticLibraryContext = createContext();

const normalizeTactic = (tactic) => ({
  id: tactic.id,
  title: tactic.title || 'Untitled tactic',
  description: tactic.description || '',
  mapId: tactic.mapId,
  side: (tactic.side || 'T').toUpperCase(),
  lineupIds: Array.isArray(tactic.lineupIds) ? tactic.lineupIds : [],
  tags: tactic.tags || [],
});

export const TacticLibraryProvider = ({ children }) => {
  const [savedTactics, setSavedTactics] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadSavedTactics();
  }, []);

  const loadSavedTactics = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        setSavedTactics(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Failed to load saved tactics', error);
    } finally {
      setLoaded(true);
    }
  };

  const persist = async (payload) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (error) {
      console.error('Failed to persist saved tactics', error);
    }
  };

  const saveTactic = (tactic) => {
    const cleaned = normalizeTactic(tactic);
    setSavedTactics((prev) => {
      const exists = prev.find((item) => item.id === cleaned.id);
      const next = exists
        ? prev.map((item) => (item.id === cleaned.id ? cleaned : item))
        : [...prev, cleaned];
      persist(next);
      return next;
    });
  };

  const removeTactic = (tacticId) => {
    setSavedTactics((prev) => {
      const next = prev.filter((item) => item.id !== tacticId);
      persist(next);
      return next;
    });
  };

  const isSaved = (tacticId) => savedTactics.some((item) => item.id === tacticId);

  const toggleTactic = (tactic) => {
    if (isSaved(tactic.id)) {
      removeTactic(tactic.id);
    } else {
      saveTactic(tactic);
    }
  };

  return (
    <TacticLibraryContext.Provider
      value={{
        savedTactics,
        loaded,
        saveTactic,
        removeTactic,
        toggleTactic,
        isSaved,
        reload: loadSavedTactics,
      }}
    >
      {children}
    </TacticLibraryContext.Provider>
  );
};

export const useTacticLibrary = () => {
  const context = useContext(TacticLibraryContext);
  if (!context) {
    throw new Error('useTacticLibrary must be used within a TacticLibraryProvider');
  }
  return context;
};
