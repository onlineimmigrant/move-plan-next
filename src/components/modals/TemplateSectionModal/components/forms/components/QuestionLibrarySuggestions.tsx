/**
 * QuestionLibrarySuggestions - Autocomplete dropdown showing library questions as user types
 */

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import type { QuestionLibraryItem } from '../types';
import { 
  MagnifyingGlassIcon, 
  BookmarkIcon,
  HashtagIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

interface QuestionLibrarySuggestionsProps {
  formId?: string | null;
  searchQuery: string;
  isVisible: boolean;
  selectedIndex: number;
  menuRef: React.RefObject<HTMLDivElement>;
  onSelectQuestion: (question: QuestionLibraryItem) => void;
  onClose: () => void;
  onSuggestionsCountChange?: (count: number) => void;
  onAvailableCountChange?: (count: number) => void;
  existingQuestionLibraryIds?: Set<string>; // IDs of library questions already in this form
}

export function QuestionLibrarySuggestions({
  formId,
  searchQuery,
  isVisible,
  selectedIndex,
  menuRef,
  onSelectQuestion,
  onClose,
  onSuggestionsCountChange,
  onAvailableCountChange,
  existingQuestionLibraryIds = new Set(),
}: QuestionLibrarySuggestionsProps) {
  const [suggestions, setSuggestions] = useState<QuestionLibraryItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch suggestions when search query changes
  const fetchSuggestions = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({ search: query });
      if (formId) {
        params.append('formId', formId);
      }
      const response = await fetch(`/api/question-library?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        const limitedSuggestions = data.questions?.slice(0, 5) || []; // Limit to top 5
        setSuggestions(limitedSuggestions);
        onSuggestionsCountChange?.(limitedSuggestions.length);
        
        // Count available (non-disabled) suggestions
        const availableCount = limitedSuggestions.filter(
          (q: QuestionLibraryItem) => !existingQuestionLibraryIds.has(q.id)
        ).length;
        onAvailableCountChange?.(availableCount);
      }
    } catch (error) {
      console.error('Error fetching question suggestions:', error);
      setSuggestions([]);
      onSuggestionsCountChange?.(0);
      onAvailableCountChange?.(0);
    } finally {
      setLoading(false);
    }
  }, [onSuggestionsCountChange, onAvailableCountChange, existingQuestionLibraryIds, formId]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchSuggestions(searchQuery);
    }, 300); // Debounce 300ms

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, fetchSuggestions]);

  if (!isVisible || suggestions.length === 0) {
    return null;
  }

  return (
    <div
      ref={menuRef}
      className="absolute z-50 mt-2 w-full max-w-2xl bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden"
      style={{ top: '100%', left: 0 }}
    >
      {/* Header */}
      <div className="px-4 py-2 bg-purple-50 border-b border-purple-100 flex items-center gap-2">
        <BookmarkIcon className="w-4 h-4 text-purple-600" />
        <span className="text-xs font-semibold text-purple-900 uppercase tracking-wide">
          Question Library Suggestions
        </span>
        <span className="ml-auto text-xs text-purple-600">
          {suggestions.length} found
        </span>
      </div>

      {/* Suggestions List */}
      <div className="max-h-80 overflow-y-auto">
        {loading && suggestions.length === 0 ? (
          <div className="px-4 py-8 text-center text-gray-400">
            <MagnifyingGlassIcon className="w-8 h-8 mx-auto mb-2 animate-pulse" />
            <p className="text-sm">Searching library...</p>
          </div>
        ) : (
          suggestions.map((question, index) => {
            const isAlreadyUsed = existingQuestionLibraryIds.has(question.id);
            
            return (
              <button
                key={question.id}
                type="button"
                onClick={() => !isAlreadyUsed && onSelectQuestion(question)}
                disabled={isAlreadyUsed}
                className={`w-full px-4 py-3 text-left transition-colors border-b border-gray-100 last:border-b-0 ${
                  isAlreadyUsed 
                    ? 'opacity-50 cursor-not-allowed bg-gray-50' 
                    : 'hover:bg-purple-50 cursor-pointer'
                } ${
                  index === selectedIndex && !isAlreadyUsed ? 'bg-purple-50' : ''
                }`}
              >
              <div className="flex items-start gap-3">
                {/* Question Type Icon */}
                <div className="flex-shrink-0 mt-1">
                  <div className="w-8 h-8 rounded bg-purple-100 flex items-center justify-center">
                    <span className="text-xs font-semibold text-purple-700 uppercase">
                      {question.type === 'text' && '📝'}
                      {question.type === 'email' && '📧'}
                      {question.type === 'tel' && '📞'}
                      {question.type === 'number' && '🔢'}
                      {question.type === 'date' && '📅'}
                      {question.type === 'yesno' && '✓✗'}
                      {question.type === 'multiple' && '⚪'}
                      {question.type === 'checkbox' && '☑'}
                      {question.type === 'dropdown' && '▼'}
                      {question.type === 'rating' && '⭐'}
                      {question.type === 'textarea' && '📄'}
                      {question.type === 'file' && '📎'}
                    </span>
                  </div>
                </div>

                {/* Question Details */}
                <div className="flex-1 min-w-0">
                  {/* Label */}
                  <div className="font-medium text-gray-900 mb-1 line-clamp-1">
                    {question.label}
                  </div>

                  {/* Description (if exists) */}
                  {question.description && (
                    <div className="text-sm text-gray-500 mb-2 line-clamp-2">
                      {question.description}
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    {/* Category */}
                    {question.category && (
                      <span className="flex items-center gap-1">
                        <HashtagIcon className="w-3 h-3" />
                        {question.category}
                      </span>
                    )}

                    {/* Already Used Warning OR Usage Count */}
                    {isAlreadyUsed ? (
                      <span className="flex items-center gap-1 text-orange-600 font-medium">
                        ⚠️ Already used in this form
                      </span>
                    ) : (
                      question.usage_count !== undefined && question.usage_count > 0 && (
                        <span className="flex items-center gap-1">
                          <ChartBarIcon className="w-3 h-3" />
                          Used {question.usage_count}× in forms
                        </span>
                      )
                    )}

                    {/* Tags */}
                    {!isAlreadyUsed && question.tags && question.tags.length > 0 && (
                      <span className="flex items-center gap-1">
                        {question.tags.slice(0, 2).map((tag, i) => (
                          <span key={i} className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">
                            {tag}
                          </span>
                        ))}
                      </span>
                    )}
                  </div>
                </div>

                {/* Type Badge */}
                <div className="flex-shrink-0">
                  <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                    isAlreadyUsed 
                      ? 'bg-gray-200 text-gray-500' 
                      : 'bg-purple-100 text-purple-700'
                  }`}>
                    {question.type}
                  </span>
                </div>
              </div>
            </button>
            );
          })
        )}
      </div>

      {/* Footer Hint */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-xs">↑↓</kbd> Navigate
          {' · '}
          <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-xs">Enter</kbd> Select
          {' · '}
          <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-xs">Esc</kbd> Close
        </p>
      </div>
    </div>
  );
}
