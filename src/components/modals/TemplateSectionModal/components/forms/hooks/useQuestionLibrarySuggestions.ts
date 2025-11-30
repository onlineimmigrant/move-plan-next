/**
 * useQuestionLibrarySuggestions - Hook for managing question library autocomplete
 */

'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import type { QuestionLibraryItem, Question } from '../types';

interface UseQuestionLibrarySuggestionsOptions {
  onSelectLibraryQuestion: (libraryQuestion: QuestionLibraryItem, questionId: string) => void;
}

export function useQuestionLibrarySuggestions({
  onSelectLibraryQuestion,
}: UseQuestionLibrarySuggestionsOptions) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [suggestionsCount, setSuggestionsCount] = useState(0);
  const [availableSuggestionsCount, setAvailableSuggestionsCount] = useState(0); // Non-disabled count
  const suggestionsMenuRef = useRef<HTMLDivElement>(null);

  // Handle input change - show suggestions when user types
  const handleInputChange = useCallback((questionId: string, value: string) => {
    setActiveQuestionId(questionId);
    setSearchQuery(value);
    
    // Show suggestions if there's at least 2 characters
    if (value.trim().length >= 2) {
      setShowSuggestions(true);
      setSelectedIndex(0);
    } else {
      setShowSuggestions(false);
    }
  }, []);

  // Handle keyboard navigation in suggestions
  const handleSuggestionsKeyDown = useCallback((
    e: React.KeyboardEvent,
    questionId: string
  ) => {
    if (!showSuggestions || suggestionsCount === 0) return false;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % suggestionsCount);
        return true;
      
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + suggestionsCount) % suggestionsCount);
        return true;
      
      case 'Escape':
        e.preventDefault();
        closeSuggestions();
        return true;
      
      default:
        return false;
    }
  }, [showSuggestions, suggestionsCount]);

  // Select a library question
  const selectLibraryQuestion = useCallback((
    libraryQuestion: QuestionLibraryItem,
    questionId: string
  ) => {
    onSelectLibraryQuestion(libraryQuestion, questionId);
    closeSuggestions();
  }, [onSelectLibraryQuestion]);

  // Close suggestions
  const closeSuggestions = useCallback(() => {
    setShowSuggestions(false);
    setSearchQuery('');
    setSelectedIndex(0);
    setActiveQuestionId(null);
  }, []);

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        suggestionsMenuRef.current &&
        !suggestionsMenuRef.current.contains(event.target as Node)
      ) {
        closeSuggestions();
      }
    }

    if (showSuggestions) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showSuggestions, closeSuggestions]);

  return {
    showSuggestions,
    activeQuestionId,
    searchQuery,
    selectedIndex,
    suggestionsCount,
    availableSuggestionsCount,
    suggestionsMenuRef,
    handleInputChange,
    handleSuggestionsKeyDown,
    selectLibraryQuestion,
    closeSuggestions,
    setSuggestionsCount,
    setAvailableSuggestionsCount,
  };
}
