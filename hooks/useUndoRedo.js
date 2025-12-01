// hooks/useUndoRedo.js
import { useState, useCallback, useRef } from 'react';

/**
 * Undo/Redo hook for form state management
 * Tracks history of form changes and allows undo/redo
 * 
 * @param {Object} initialState - Initial form state
 * @param {number} maxHistory - Maximum history length (default: 50)
 * @returns {Object} - { state, setState, undo, redo, canUndo, canRedo, clearHistory }
 */
export const useUndoRedo = (initialState, maxHistory = 50) => {
  const [state, setStateInternal] = useState(initialState);
  const [history, setHistory] = useState([initialState]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const isUndoRedoRef = useRef(false);

  // Set state with history tracking
  const setState = useCallback((newState) => {
    // If this is an undo/redo operation, don't add to history
    if (isUndoRedoRef.current) {
      setStateInternal(newState);
      return;
    }

    setStateInternal(newState);

    setHistory((prev) => {
      // Remove any "future" history after current index
      const newHistory = prev.slice(0, currentIndex + 1);
      
      // Add new state
      newHistory.push(newState);
      
      // Limit history size
      if (newHistory.length > maxHistory) {
        newHistory.shift();
        setCurrentIndex(maxHistory - 1);
      } else {
        setCurrentIndex(newHistory.length - 1);
      }
      
      return newHistory;
    });
  }, [currentIndex, maxHistory]);

  // Undo to previous state
  const undo = useCallback(() => {
    if (currentIndex > 0) {
      isUndoRedoRef.current = true;
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      setStateInternal(history[newIndex]);
      
      // Reset flag after state update
      setTimeout(() => {
        isUndoRedoRef.current = false;
      }, 0);
    }
  }, [currentIndex, history]);

  // Redo to next state
  const redo = useCallback(() => {
    if (currentIndex < history.length - 1) {
      isUndoRedoRef.current = true;
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      setStateInternal(history[newIndex]);
      
      // Reset flag after state update
      setTimeout(() => {
        isUndoRedoRef.current = false;
      }, 0);
    }
  }, [currentIndex, history]);

  // Check if can undo
  const canUndo = currentIndex > 0;

  // Check if can redo
  const canRedo = currentIndex < history.length - 1;

  // Clear history
  const clearHistory = useCallback(() => {
    setHistory([state]);
    setCurrentIndex(0);
  }, [state]);

  return {
    state,
    setState,
    undo,
    redo,
    canUndo,
    canRedo,
    clearHistory,
  };
};