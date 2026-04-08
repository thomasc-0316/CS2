// hooks/useAutoSave.js
import { useState, useEffect, useRef } from 'react';
import { useDrafts } from '../context/DraftsContext';

const DEFAULT_DEBOUNCE_MS = 2000;

/**
 * Auto-save hook for PostScreen
 * Automatically saves draft when form data changes
 *
 * @param {Object} formData - Current form state
 * @param {boolean} enabled - Whether auto-save is enabled
 * @param {Object} [options]
 * @param {number} [options.debounceMs=2000] - Debounce delay in ms
 * @returns {Object} - { saveStatus, lastSaved, forceSave }
 */
export const useAutoSave = (formData, enabled = true, options = {}) => {
  const debounceMs = typeof options.debounceMs === 'number' && options.debounceMs > 0
    ? options.debounceMs
    : DEFAULT_DEBOUNCE_MS;
  const { saveDraft } = useDrafts();
  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle', 'saving', 'saved', 'error'
  const [lastSaved, setLastSaved] = useState(null);
  const saveTimeoutRef = useRef(null);
  const statusTimeoutRef = useRef(null);
  const isMountedRef = useRef(true);
  const previousDataRef = useRef(null);

  // Check if form is empty (don't save empty drafts)
  const isFormEmpty = () => {
    const {
      title,
      description,
      side,
      site,
      nadeType,
      throwInstructions,
      standImage,
      aimImage,
      landImage,
      thirdPersonImage,
      moreDetailsImage,
    } = formData;
    
    // Check if all fields are empty
    const hasNoText = !title?.trim() && 
                      !description?.trim() && 
                      !throwInstructions?.trim() &&
                      !side && 
                      !site && 
                      !nadeType;
    
    const hasNoImages =
      !standImage && !aimImage && !landImage && !thirdPersonImage && !moreDetailsImage;
    
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
      prev.thirdPersonImage !== curr.thirdPersonImage ||
      prev.moreDetailsImage !== curr.moreDetailsImage
    );
  };

  // Auto-save function with debounce
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      if (statusTimeoutRef.current) {
        clearTimeout(statusTimeoutRef.current);
      }
    };
  }, []);

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

    // Debounce save (configurable; defaults to 2 s)
    saveTimeoutRef.current = setTimeout(() => {
      const run = async () => {
        try {
          // Create draft object
          const draftData = {
            ...formData,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };

          // Save draft
          await saveDraft(draftData);

          if (!isMountedRef.current) return;

          // Update status
          setSaveStatus('saved');
          setLastSaved(new Date());
          previousDataRef.current = { ...formData };

          // Reset to idle after 2 seconds
          if (statusTimeoutRef.current) {
            clearTimeout(statusTimeoutRef.current);
          }
          statusTimeoutRef.current = setTimeout(() => {
            if (isMountedRef.current) {
              setSaveStatus('idle');
            }
          }, 2000);
        } catch (error) {
          console.error('Auto-save error:', error);
          if (!isMountedRef.current) return;
          setSaveStatus('error');

          // Reset to idle after 3 seconds
          if (statusTimeoutRef.current) {
            clearTimeout(statusTimeoutRef.current);
          }
          statusTimeoutRef.current = setTimeout(() => {
            if (isMountedRef.current) {
              setSaveStatus('idle');
            }
          }, 3000);
        }
      };

      run();
    }, debounceMs);

    // Cleanup
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [formData, enabled, saveDraft, debounceMs]);

  // Force save function (for manual save)
  const forceSave = async () => {
    if (isFormEmpty()) {
      return false;
    }

    try {
      const draftData = {
        ...formData,
        createdAt: previousDataRef.current?.createdAt || Date.now(),
        updatedAt: Date.now(),
      };

      await saveDraft(draftData);
      if (!isMountedRef.current) return false;
      setSaveStatus('saved');
      setLastSaved(new Date());
      previousDataRef.current = { ...formData };

      if (statusTimeoutRef.current) {
        clearTimeout(statusTimeoutRef.current);
      }
      statusTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          setSaveStatus('idle');
        }
      }, 2000);

      return true;
    } catch (error) {
      console.error('Force save error:', error);
      if (!isMountedRef.current) return false;
      setSaveStatus('error');

      if (statusTimeoutRef.current) {
        clearTimeout(statusTimeoutRef.current);
      }
      statusTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          setSaveStatus('idle');
        }
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
