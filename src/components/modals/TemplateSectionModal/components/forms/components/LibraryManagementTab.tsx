/**
 * LibraryManagementTab - Manage questions in the library from current form
 * Allows toggling visibility and deleting questions from library (preserves in form)
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useThemeColors } from '@/hooks/useThemeColors';
import Button from '@/ui/Button';
import { MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline';
import type { QuestionLibraryItem } from '../types';

interface LibraryManagementTabProps {
  formId?: string | null;
  primaryColor?: string;
  onAddQuestionToForm?: (libraryQuestion: QuestionLibraryItem) => void;
  onCreateNewLibraryQuestion?: () => void;
}

export function LibraryManagementTab({ 
  formId, 
  primaryColor,
  onAddQuestionToForm,
  onCreateNewLibraryQuestion 
}: LibraryManagementTabProps) {
  const themeColors = useThemeColors();
  const primary = themeColors.cssVars.primary;
  
  const [libraryQuestions, setLibraryQuestions] = useState<QuestionLibraryItem[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<QuestionLibraryItem[]>([]);
  const [loading, setLoading] = useState(false); // Changed from true to false - load on demand
  const [initialLoad, setInitialLoad] = useState(false);
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmAddQuestion, setConfirmAddQuestion] = useState<QuestionLibraryItem | null>(null);

  // Lazy load - only fetch when component mounts (user opens Library tab)
  useEffect(() => {
    if (!initialLoad) {
      fetchLibraryQuestions();
      setInitialLoad(true);
    }
  }, [initialLoad]);

  // Filter questions based on search query (debounced for performance)
  useEffect(() => {
    // Debounce the filtering for large libraries
    const debounceTimer = setTimeout(() => {
      if (!searchQuery.trim()) {
        setFilteredQuestions(libraryQuestions);
        return;
      }

      const query = searchQuery.toLowerCase();
      const filtered = libraryQuestions.filter(q => 
        q.label.toLowerCase().includes(query) ||
        q.description?.toLowerCase().includes(query) ||
        q.category?.toLowerCase().includes(query) ||
        q.type.toLowerCase().includes(query) ||
        q.tags?.some(tag => tag.toLowerCase().includes(query))
      );
      setFilteredQuestions(filtered);
    }, 150); // 150ms debounce

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, libraryQuestions]);

  const fetchLibraryQuestions = async () => {
    try {
      setLoading(true);
      
      // Fetch ALL library questions (no formId filter - we want to see everything)
      const response = await fetch('/api/question-library', {
        // Add cache and priority hints for better performance
        next: { revalidate: 60 }, // Cache for 60 seconds
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch library questions');
      }
      
      const data = await response.json();

      if (data.success && data.questions) {
        setLibraryQuestions(data.questions);
      }
    } catch (error) {
      console.error('Error fetching library questions:', error);
      setLibraryQuestions([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const toggleVisibility = async (questionId: string, currentValue: boolean) => {
    try {
      setUpdatingIds(prev => new Set(prev).add(questionId));

      const response = await fetch(`/api/question-library/${questionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visible_for_others: !currentValue }),
      });

      if (!response.ok) {
        throw new Error('Failed to update visibility');
      }

      // Optimistic update - update local state immediately
      setLibraryQuestions(prev =>
        prev.map(q =>
          q.id === questionId ? { ...q, visible_for_others: !currentValue } : q
        )
      );
    } catch (error) {
      console.error('Error updating visibility:', error);
      alert('Failed to update visibility. Please try again.');
      // Revert optimistic update on error
      await fetchLibraryQuestions();
    } finally {
      setUpdatingIds(prev => {
        const next = new Set(prev);
        next.delete(questionId);
        return next;
      });
    }
  };

  const deleteFromLibrary = async (questionId: string, questionLabel: string) => {
    const confirmed = confirm(
      `Remove "${questionLabel}" from the library?\n\n` +
      `This will NOT delete the question from your form, but it will no longer be available for other forms to use.`
    );

    if (!confirmed) return;

    try {
      setDeletingIds(prev => new Set(prev).add(questionId));

      // Optimistic delete - remove from UI immediately
      const originalQuestions = [...libraryQuestions];
      setLibraryQuestions(prev => prev.filter(q => q.id !== questionId));

      const response = await fetch(`/api/question-library/${questionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete from library');
      }
    } catch (error) {
      console.error('Error deleting from library:', error);
      alert('Failed to delete from library. Please try again.');
      // Revert optimistic delete on error
      await fetchLibraryQuestions();
    } finally {
      setDeletingIds(prev => {
        const next = new Set(prev);
        next.delete(questionId);
        return next;
      });
    }
  };

  const handleDoubleClick = (question: QuestionLibraryItem) => {
    if (onAddQuestionToForm) {
      if (!formId) {
        alert('Please create or select a form first before adding questions.');
        return;
      }
      setConfirmAddQuestion(question);
    }
  };

  const confirmAddToForm = () => {
    if (confirmAddQuestion && onAddQuestionToForm) {
      onAddQuestionToForm(confirmAddQuestion);
      setConfirmAddQuestion(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: primary.base }} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto space-y-3 p-3 pb-20">
        {/* Search Bar */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search library..."
            className="w-full pl-10 pr-4 py-2 bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm border border-white/30 dark:border-gray-700/30 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
          />
          {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Results Count */}
      {searchQuery && (
        <div className="text-xs text-gray-500 dark:text-gray-400 px-1">
          {filteredQuestions.length} {filteredQuestions.length === 1 ? 'result' : 'results'}
        </div>
      )}

      {/* Empty State */}
      {filteredQuestions.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <svg
            className="mx-auto h-10 w-10 text-gray-400 mb-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            {searchQuery ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            )}
          </svg>
          <p className="text-sm font-medium">
            {searchQuery ? 'No results found' : 'Library is empty'}
          </p>
          <p className="text-xs mt-1">
            {searchQuery ? 'Try a different search term' : 'Questions added to the library will appear here'}
          </p>
        </div>
      )}

      {/* Question List */}
      {filteredQuestions.length > 0 && (
      <div className="space-y-2">
        {filteredQuestions.map(question => {
          const isUpdating = updatingIds.has(question.id);
          const isDeleting = deletingIds.has(question.id);
          const isVisible = question.visible_for_others ?? true;

          return (
            <div
              key={question.id}
              onDoubleClick={() => handleDoubleClick(question)}
              className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm border border-white/30 dark:border-gray-700/30 rounded-lg p-3 hover:bg-white/60 dark:hover:bg-gray-800/60 transition-all cursor-pointer"
              title={onAddQuestionToForm ? (formId ? "Double-click to add to current form" : "Create or select a form first") : ""}
            >
              <div className="flex items-start justify-between gap-3">
                {/* Question Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-sm text-gray-900 truncate">
                      {question.label}
                    </h4>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                      {question.type}
                    </span>
                    {question.category && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        {question.category}
                      </span>
                    )}
                    <span className="text-xs text-gray-400">
                      Used {question.usage_count || 0}×
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-1.5">
                  {/* Visibility Toggle */}
                  <button
                    onClick={() => toggleVisibility(question.id, isVisible)}
                    disabled={isUpdating || isDeleting}
                    className={`
                      px-2 py-1 rounded text-xs font-medium transition-colors backdrop-blur-sm
                      ${isVisible
                        ? 'bg-green-100/70 text-green-700 hover:bg-green-200/70'
                        : 'bg-gray-100/70 text-gray-700 hover:bg-gray-200/70'
                      }
                      disabled:opacity-50 disabled:cursor-not-allowed
                      flex items-center gap-1
                    `}
                    title={isVisible ? 'Shared' : 'Private'}
                  >
                    {isUpdating ? (
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current" />
                    ) : (
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        {isVisible ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        )}
                      </svg>
                    )}
                    {isVisible ? 'Shared' : 'Private'}
                  </button>

                  {/* Delete Button */}
                  <button
                    onClick={() => deleteFromLibrary(question.id, question.label)}
                    disabled={isUpdating || isDeleting}
                    className="px-2 py-1 bg-red-100/70 text-red-700 hover:bg-red-200/70 backdrop-blur-sm rounded text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    title="Remove from library"
                  >
                    {isDeleting ? (
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current" />
                    ) : (
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                    Remove
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      )}

      {/* Info Footer */}
      {filteredQuestions.length > 0 && (
      <div className="mt-4 p-3 bg-blue-50/60 dark:bg-blue-900/20 backdrop-blur-sm border border-blue-200/60 dark:border-blue-700/30 rounded-lg">
        <div className="text-xs text-blue-800 dark:text-blue-300">
          <p className="font-medium mb-1">💡 Library Management:</p>
          <ul className="space-y-0.5 list-disc list-inside">
            <li><strong>Shared:</strong> Available to all forms in autocomplete</li>
            <li><strong>Private:</strong> Hidden from autocomplete (but still in library)</li>
            <li><strong>Remove:</strong> Permanently deletes from library (preserves in forms using it)</li>
            {onAddQuestionToForm && <li><strong>Double-click:</strong> {formId ? 'Add question to current form' : 'Create a form first to add questions'}</li>}
          </ul>
        </div>
      </div>
      )}
      </div>

      {/* Fixed Footer with Add Question Button */}
      <div className="flex-shrink-0 p-3 border-t border-white/20 dark:border-gray-700/20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md">
        <button
          onClick={onCreateNewLibraryQuestion}
          className="w-full px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/40 dark:border-gray-700/40 hover:bg-white/80 dark:hover:bg-gray-800/80 flex items-center justify-center gap-2 shadow-lg"
          style={{ color: primaryColor || '#8B5CF6' }}
        >
          <PlusIcon className="h-5 w-5" />
          Add Library Question
        </button>
      </div>

      {/* Confirmation Modal for Adding Question to Form */}
      {confirmAddQuestion && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-[110] animate-in fade-in duration-200"
            onClick={() => setConfirmAddQuestion(null)}
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl z-[111] animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Add Question to Form?
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Do you want to add this question to the current form?
              </p>
              <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                  {confirmAddQuestion.label}
                </p>
                {confirmAddQuestion.description && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {confirmAddQuestion.description}
                  </p>
                )}
                <div className="flex gap-2 mt-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300">
                    {confirmAddQuestion.type}
                  </span>
                  {confirmAddQuestion.category && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                      {confirmAddQuestion.category}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setConfirmAddQuestion(null)}
                  className="flex-1 px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmAddToForm}
                  className="flex-1 px-4 py-2 rounded-xl text-white hover:opacity-90 transition-opacity font-medium"
                  style={{ backgroundColor: primaryColor || '#8B5CF6' }}
                >
                  Add to Form
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

