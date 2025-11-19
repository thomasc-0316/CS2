import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DraftsContext = createContext();

export const DraftsProvider = ({ children }) => {
  const [drafts, setDrafts] = useState([]);

  // Load drafts from storage on app start
  useEffect(() => {
    loadDrafts();
  }, []);

  const loadDrafts = async () => {
    try {
      const saved = await AsyncStorage.getItem('savedDrafts');
      if (saved) {
        setDrafts(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Failed to load drafts:', error);
    }
  };

  const saveDraftsToStorage = async (newDrafts) => {
    try {
      await AsyncStorage.setItem('savedDrafts', JSON.stringify(newDrafts));
    } catch (error) {
      console.error('Failed to save drafts:', error);
    }
  };

  const saveDraft = (draftData) => {
    const newDraft = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      ...draftData,
    };

    setDrafts(prev => {
      const updated = [newDraft, ...prev];
      saveDraftsToStorage(updated);
      return updated;
    });

    return newDraft.id;
  };

  const updateDraft = (draftId, updatedData) => {
    setDrafts(prev => {
      const updated = prev.map(draft => 
        draft.id === draftId 
          ? { ...draft, ...updatedData, updatedAt: new Date().toISOString() }
          : draft
      );
      saveDraftsToStorage(updated);
      return updated;
    });
  };

  const deleteDraft = (draftId) => {
    setDrafts(prev => {
      const updated = prev.filter(draft => draft.id !== draftId);
      saveDraftsToStorage(updated);
      return updated;
    });
  };

  const getDraft = (draftId) => {
    return drafts.find(draft => draft.id === draftId);
  };

  return (
    <DraftsContext.Provider value={{ drafts, saveDraft, updateDraft, deleteDraft, getDraft }}>
      {children}
    </DraftsContext.Provider>
  );
};

export const useDrafts = () => {
  const context = useContext(DraftsContext);
  if (!context) {
    throw new Error('useDrafts must be used within DraftsProvider');
  }
  return context;
};