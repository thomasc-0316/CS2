// context/DraftsContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DraftsContext = createContext();

const DRAFTS_STORAGE_KEY = '@lineup_drafts';

export function DraftsProvider({ children }) {
  const [drafts, setDrafts] = useState([]);
  const [currentDraftId, setCurrentDraftId] = useState(null); // Track current session draft

  // Load drafts on mount
  useEffect(() => {
    loadDrafts();
  }, []);

  const loadDrafts = async () => {
    try {
      const stored = await AsyncStorage.getItem(DRAFTS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setDrafts(parsed);
      }
    } catch (error) {
      console.error('Failed to load drafts:', error);
    }
  };

  const saveDrafts = async (updatedDrafts) => {
    try {
      await AsyncStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(updatedDrafts));
      setDrafts(updatedDrafts);
    } catch (error) {
      console.error('Failed to save drafts:', error);
      throw error;
    }
  };

  // Create a new draft and set it as current
  const createNewDraft = () => {
    const newDraftId = `draft_${Date.now()}`;
    setCurrentDraftId(newDraftId);
    return newDraftId;
  };

  // Save or update the current draft
  const saveDraft = async (draftData) => {
    try {
      // If no current draft, create one
      let draftId = currentDraftId;
      if (!draftId) {
        draftId = createNewDraft();
      }

      const timestamp = new Date().toISOString();
      const draftToSave = {
        id: draftId,
        ...draftData,
        updatedAt: timestamp,
        createdAt: drafts.find(d => d.id === draftId)?.createdAt || timestamp,
      };

      // Find if draft already exists
      const existingIndex = drafts.findIndex(d => d.id === draftId);
      
      let updatedDrafts;
      if (existingIndex >= 0) {
        // Update existing draft
        updatedDrafts = [...drafts];
        updatedDrafts[existingIndex] = draftToSave;
      } else {
        // Add new draft
        updatedDrafts = [...drafts, draftToSave];
      }

      await saveDrafts(updatedDrafts);
      return draftId;
    } catch (error) {
      console.error('Failed to save draft:', error);
      throw error;
    }
  };

  // Load a draft and set it as current
  const loadDraft = (draftId) => {
    setCurrentDraftId(draftId); // Set as current so auto-save updates it
    return drafts.find(d => d.id === draftId);
  };

  // Delete a draft
  const deleteDraft = async (draftId) => {
    try {
      const updatedDrafts = drafts.filter(d => d.id !== draftId);
      await saveDrafts(updatedDrafts);
      
      // If deleting current draft, clear current ID
      if (draftId === currentDraftId) {
        setCurrentDraftId(null);
      }
    } catch (error) {
      console.error('Failed to delete draft:', error);
      throw error;
    }
  };

  // Clear current draft ID (when starting fresh)
  const clearCurrentDraft = () => {
    setCurrentDraftId(null);
  };

  // Delete a draft after successful post
  const deleteDraftAfterPost = async (draftId) => {
    if (draftId) {
      await deleteDraft(draftId);
      clearCurrentDraft();
    }
  };

  return (
    <DraftsContext.Provider
      value={{
        drafts,
        currentDraftId,
        saveDraft,
        loadDraft,
        deleteDraft,
        createNewDraft,
        clearCurrentDraft,
        deleteDraftAfterPost,
      }}
    >
      {children}
    </DraftsContext.Provider>
  );
}

export function useDrafts() {
  const context = useContext(DraftsContext);
  if (!context) {
    throw new Error('useDrafts must be used within DraftsProvider');
  }
  return context;
}