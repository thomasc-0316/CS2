// hooks/useAutoSave.js
import { useState, useEffect, useRef } from 'react';
import { useDrafts } from '../context/DraftsContext';

/**
 * Auto-save hook for PostScreen
 * Automatically saves draft when form data changes
 * 
 * @param {Object} formData - Current form state
 * @param {boolean} enabled - Whether auto-save is enabled
 * @returns {Object} - { saveStatus, lastSaved, forceSave }
 */
export const useAutoSave = (formData, enabled = true) => {
  const { saveDraft } = useDrafts();
  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle', 'saving', 'saved', 'error'
  const [lastSaved, setLastSaved] = useState(null);
  const saveTimeoutRef = useRef(null);
  const previousDataRef = useRef(null);

  // Check if form is empty (don't save empty drafts)
  const isFormEmpty = () => {
    const { title, description, side, site, nadeType, throwInstructions, standImage, aimImage, landImage, thirdPersonImage } = formData;
    
    // Check if all fields are empty
    const hasNoText = !title?.trim() && 
                      !description?.trim() && 
                      !throwInstructions?.trim() &&
                      !side && 
                      !site && 
                      !nadeType;
    
    const hasNoImages = !standImage && !aimImage && !landImage && !thirdPersonImage;
    
    return hasNoText && hasNoImages;
  };

  // Check if form data has changed
  const hasDataChanged = () => {
    if (!previousDataRef.current) return true;
    
    const prev = previousDataRef.current;
    const curr = formData;
    
    return (
      prev.title !== curr.title ||
      prev.description !== curr.description ||
      prev.side !== curr.side ||
      prev.site !== curr.site ||
      prev.nadeType !== curr.nadeType ||
      prev.throwInstructions !== curr.throwInstructions ||
      prev.standImage !== curr.standImage ||
      prev.aimImage !== curr.aimImage ||
      prev.landImage !== curr.landImage ||
      prev.thirdPersonImage !== curr.thirdPersonImage
    );
  };

  // Auto-save function with debounce
  useEffect(() => {
    if (!enabled) return;
    if (isFormEmpty()) return;
    if (!hasDataChanged()) return;

    // Clear previous timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set saving status immediately
    setSaveStatus('saving');

    // Debounce save by 2 seconds
    saveTimeoutRef.current = setTimeout(() => {
      try {
        // Create draft object
        const draftData = {
          ...formData,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        // Save draft
        saveDraft(draftData);

        // Update status
        setSaveStatus('saved');
        setLastSaved(new Date());
        previousDataRef.current = { ...formData };

        // Reset to idle after 2 seconds
        setTimeout(() => {
          setSaveStatus('idle');
        }, 2000);
      } catch (error) {
        console.error('Auto-save error:', error);
        setSaveStatus('error');
        
        // Reset to idle after 3 seconds
        setTimeout(() => {
          setSaveStatus('idle');
        }, 3000);
      }
    }, 2000); // 2 second debounce

    // Cleanup
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [formData, enabled, saveDraft]);

  // Force save function (for manual save)
  const forceSave = () => {
    if (isFormEmpty()) {
      return false;
    }

    try {
      const draftData = {
        ...formData,
        createdAt: previousDataRef.current?.createdAt || Date.now(),
        updatedAt: Date.now(),
      };

      saveDraft(draftData);
      setSaveStatus('saved');
      setLastSaved(new Date());
      previousDataRef.current = { ...formData };

      setTimeout(() => {
        setSaveStatus('idle');
      }, 2000);

      return true;
    } catch (error) {
      console.error('Force save error:', error);
      setSaveStatus('error');
      
      setTimeout(() => {
        setSaveStatus('idle');
      }, 3000);

      return false;
    }
  };

  return {
    saveStatus,
    lastSaved,
    forceSave,
  };
};