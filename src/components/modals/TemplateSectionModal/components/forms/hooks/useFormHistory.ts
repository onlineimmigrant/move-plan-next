/**
 * useFormHistory - Undo/Redo functionality for form questions
 */

import { useState, useEffect, useCallback } from 'react';
import type { Question } from '../types';

interface UseFormHistoryReturn {
  addToHistory: (questions: Question[]) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  history: Question[][];
  historyIndex: number;
}

export function useFormHistory(
  questions: Question[],
  setQuestions: (questions: Question[]) => void,
  maxHistory = 50
): UseFormHistoryReturn {
  const [history, setHistory] = useState<Question[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const addToHistory = useCallback((newQuestions: Question[]) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(JSON.parse(JSON.stringify(newQuestions)));
      return newHistory.slice(-maxHistory);
    });
    setHistoryIndex(prev => Math.min(prev + 1, maxHistory - 1));
  }, [historyIndex, maxHistory]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      setQuestions(JSON.parse(JSON.stringify(prevState)));
      setHistoryIndex(historyIndex - 1);
    }
  }, [history, historyIndex, setQuestions]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setQuestions(JSON.parse(JSON.stringify(nextState)));
      setHistoryIndex(historyIndex + 1);
    }
  }, [history, historyIndex, setQuestions]);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMeta = navigator.platform.toLowerCase().includes('mac') ? e.metaKey : e.ctrlKey;
      
      if (isMeta && e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        redo();
      } else if (isMeta && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        undo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  return {
    addToHistory,
    undo,
    redo,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
    history,
    historyIndex,
  };
}
