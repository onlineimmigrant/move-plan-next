/**
 * ModalHeader Component
 * 
 * Header with title, icon, product count badge, and close button
 * Includes drag handle for desktop
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { XMarkIcon, CubeIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Search, X } from 'lucide-react';

interface ModalHeaderProps {
  title: string;
  subtitle?: string;
  productCount: number;
  primaryColor: string;
  onClose: () => void;
  selectedProduct?: any;
  onBack?: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  searchSuggestions?: string[];
}

export function ModalHeader({
  title,
  subtitle,
  productCount,
  primaryColor,
  onClose,
  selectedProduct,
  onBack,
  searchQuery = '',
  onSearchChange,
  searchSuggestions = [],
}: ModalHeaderProps) {
  // Local state for search
  const [localQuery, setLocalQuery] = useState(searchQuery);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout>();

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('shop_recent_searches');
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse recent searches:', e);
      }
    }
  }, []);

  // Sync local query with prop
  useEffect(() => {
    setLocalQuery(searchQuery);
  }, [searchQuery]);

  // Debounced search handler
  const handleSearchChange = (value: string) => {
    setLocalQuery(value);
    
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = setTimeout(() => {
      onSearchChange?.(value);
      // Save to recent searches if meaningful query
      if (value.trim() && value.trim().length > 2 && !recentSearches.includes(value.trim())) {
        const updated = [value.trim(), ...recentSearches.slice(0, 4)];
        setRecentSearches(updated);
        localStorage.setItem('shop_recent_searches', JSON.stringify(updated));
      }
    }, 180);
  };

  // Clear search handler
  const handleClearSearch = () => {
    setLocalQuery('');
    onSearchChange?.('');
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showAutocomplete) return;
      
      const suggestions = localQuery ? searchSuggestions.slice(0, 5) : recentSearches.filter(search => search.toLowerCase().includes(localQuery.toLowerCase()));
      
      // Arrow keys to navigate suggestions
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex(prev => (prev + 1) % suggestions.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (activeIndex <= 0) {
          setActiveIndex(suggestions.length - 1);
        } else {
          setActiveIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
        }
        return;
      }
      
      // Enter to select active suggestion
      if (e.key === 'Enter' && showAutocomplete && activeIndex >= 0) {
        e.preventDefault();
        const suggestions = localQuery ? searchSuggestions.slice(0, 5) : recentSearches;
        if (suggestions[activeIndex]) {
          setLocalQuery(suggestions[activeIndex]);
          onSearchChange?.(suggestions[activeIndex]);
          setShowAutocomplete(false);
          setActiveIndex(-1);
        }
        return;
      }
      
      // ESC to close autocomplete or clear search
      if (e.key === 'Escape') {
        if (showAutocomplete) {
          setShowAutocomplete(false);
          setActiveIndex(-1);
        } else if (localQuery) {
          handleClearSearch();
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showAutocomplete, activeIndex, localQuery, searchSuggestions, recentSearches, onSearchChange]);

  // Cleanup debounce timer
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="modal-drag-handle flex-shrink-0 border-b border-gray-200/50 dark:border-gray-700/50 px-4 sm:px-6 py-4 cursor-move">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Back Button (mobile only, when viewing product detail) */}
          {selectedProduct && onBack && (
            <button
              onClick={onBack}
              className="sm:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Back to product list"
            >
              <ArrowLeftIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
          )}
          
          {/* Icon - hidden on mobile */}
          <div
            className="hidden sm:block p-2 rounded-lg transition-colors flex-shrink-0"
            style={{ backgroundColor: `${primaryColor}20` }}
          >
            <CubeIcon
              className="h-6 w-6"
              style={{ color: primaryColor }}
            />
          </div>
          
          {/* Title and Subtitle */}
          <div className="flex-shrink-0">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
              {title}
            </h2>
          </div>
        </div>

        {/* Right Side - Search, Badge and Close */}
        <div className="flex items-center gap-3 flex-1 justify-end min-w-0">
          {/* Search - Blog Style */}
          {onSearchChange && (
            <div className="relative flex-1 max-w-sm min-w-0">
              {/* Search Icon */}
              <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                <Search className={`h-5 w-5 transition-all duration-200 ${
                  localQuery ? 'text-gray-600 dark:text-gray-300 scale-110' : 'text-gray-400'
                }`} />
              </span>
              
              {/* Search Input */}
              <input
                ref={searchInputRef}
                type="text"
                role="search"
                aria-label="Search"
                aria-controls="search-autocomplete"
                aria-expanded={showAutocomplete}
                aria-activedescendant={activeIndex >= 0 ? `search-suggestion-${activeIndex}` : undefined}
                placeholder="Search..."
                value={localQuery}
                onChange={(e) => {
                  handleSearchChange(e.target.value);
                  setShowAutocomplete(true);
                  setActiveIndex(-1);
                }}
                onFocus={(e) => {
                  setShowAutocomplete(true);
                  setActiveIndex(-1);
                  e.currentTarget.style.boxShadow = `0 0 0 3px ${primaryColor}20`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.boxShadow = '';
                  setTimeout(() => {
                    setShowAutocomplete(false);
                    setActiveIndex(-1);
                  }, 200);
                }}
                className="w-full pl-12 pr-24 py-3.5 text-base border bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 rounded-xl focus:outline-none focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                style={{
                  '--tw-ring-color': primaryColor,
                } as React.CSSProperties}
              />
              
              {/* Right Side Icons */}
              <div className="absolute inset-y-0 right-0 flex items-center gap-2 pr-4">
                {/* Clear Button */}
                {localQuery && (
                  <button
                    onClick={handleClearSearch}
                    className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  </button>
                )}
                
                {/* Keyboard Shortcut Hint */}
                <span className="hidden xl:flex items-center gap-0.5 px-2.5 py-1 text-xs text-gray-500 dark:text-gray-400 font-medium bg-gray-100 dark:bg-gray-700 rounded-md">
                  <kbd>⌘</kbd><kbd>K</kbd>
                </span>
              </div>
              
              {/* Autocomplete Dropdown */}
              {showAutocomplete && (searchSuggestions.length > 0 || (localQuery && recentSearches.filter(search => search.toLowerCase().includes(localQuery.toLowerCase())).length > 0)) && (
                <div 
                  id="search-autocomplete"
                  role="listbox"
                  className="fixed sm:absolute top-auto sm:top-full left-0 right-0 sm:left-0 sm:right-0 mt-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl z-[100000] max-h-80 overflow-y-auto mx-4 sm:mx-0"
                >
                  {/* Recent Searches */}
                  {localQuery && recentSearches.filter(search => search.toLowerCase().includes(localQuery.toLowerCase())).length > 0 && (
                    <div className="p-2">
                      <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide px-3 py-2">Recent</div>
                      {recentSearches.filter(search => search.toLowerCase().includes(localQuery.toLowerCase())).map((search, idx) => (
                        <button
                          key={idx}
                          id={`search-suggestion-${idx}`}
                          role="option"
                          aria-selected={activeIndex === idx}
                          onClick={() => {
                            setLocalQuery(search);
                            onSearchChange?.(search);
                            setShowAutocomplete(false);
                            setActiveIndex(-1);
                          }}
                          className={`w-full text-left px-3 py-2.5 rounded-lg text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2 transition-colors ${
                            activeIndex === idx ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                          }`}
                          style={activeIndex === idx ? { backgroundColor: `${primaryColor}15` } : {}}
                        >
                          <Search className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                          {search}
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {/* Autocomplete Suggestions */}
                  {localQuery && searchSuggestions.length > 0 && (
                    <div className="p-2">
                      <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide px-3 py-2">Suggestions</div>
                      {searchSuggestions.slice(0, 5).map((suggestion, idx) => (
                        <button
                          key={idx}
                          id={`search-suggestion-${idx}`}
                          role="option"
                          aria-selected={activeIndex === idx}
                          onClick={() => {
                            setLocalQuery(suggestion);
                            onSearchChange?.(suggestion);
                            setShowAutocomplete(false);
                            setActiveIndex(-1);
                          }}
                          className={`w-full text-left px-3 py-2.5 rounded-lg text-sm text-gray-700 dark:text-gray-300 transition-colors ${
                            activeIndex === idx ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                          }`}
                          style={activeIndex === idx ? { backgroundColor: `${primaryColor}15` } : {}}
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {/* Search Tips */}
                  {!localQuery && (
                    <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                      <p className="font-medium mb-1">Search tips:</p>
                      <p className="text-xs">Try searching by product name or description</p>
                      <p className="text-xs mt-2 text-gray-400 dark:text-gray-500">Use ↑↓ arrows to navigate</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Close Button */}
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0"
            aria-label="Close modal"
          >
            <XMarkIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  );
}
