import { useState, useCallback } from 'react';
import { Crop, Filter, TextOverlay, Effect, Clip, Transition, ImageOverlay, ChromaKeySettings } from '../types';

export interface EditorState {
    clips: Clip[];
    transition: Transition;
    textOverlays: TextOverlay[];
    imageOverlays: ImageOverlay[];
    selectedFilter: Filter;
    selectedEffect: Effect;
    crop: Crop;
    volume: number;
    playbackSpeed: number;
}

export const useHistory = (initialState: EditorState) => {
  const [history, setHistory] = useState<EditorState[]>([initialState]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const state = history[currentIndex];

  const setState = useCallback((action: (prevState: EditorState) => EditorState) => {
    const newState = action(state);
    
    // Simple deep-ish compare to prevent adding identical states
    if (JSON.stringify(newState) === JSON.stringify(state)) {
      return;
    }

    const newHistory = history.slice(0, currentIndex + 1);
    newHistory.push(newState);
    setHistory(newHistory);
    setCurrentIndex(newHistory.length - 1);
  }, [history, currentIndex, state]);

  const undo = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  }, [currentIndex]);

  const redo = useCallback(() => {
    if (currentIndex < history.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  }, [currentIndex, history.length]);

  const resetHistory = useCallback((newState: EditorState) => {
      setHistory([newState]);
      setCurrentIndex(0);
  }, []);

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  return { state, setState, undo, redo, canUndo, canRedo, resetHistory };
};