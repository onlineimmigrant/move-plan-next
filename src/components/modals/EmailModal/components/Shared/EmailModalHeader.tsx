'use client';

import React, { useEffect, useRef, useState } from 'react';
import { X, Search, Mail } from 'lucide-react';

interface EmailModalHeaderProps {
  title: string;
  subtitle?: string;
  primaryColor: string;
  onClose: () => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  onSearchSubmit?: (q: string) => void;
  searchSuggestions?: string[];
}

export default function EmailModalHeader({
  title,
  subtitle,
  primaryColor,
  onClose,
  searchQuery = '',
  onSearchChange,
  onSearchSubmit,
  searchSuggestions = [],
}: EmailModalHeaderProps) {
  const [localQuery, setLocalQuery] = useState(searchQuery);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout>();

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('email_recent_searches');
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse recent searches:', e);
      }
    }
  }, []);

  useEffect(() => {
    setLocalQuery(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      // Support both / and ⌘K
      if (e.key === '/' || (e.key === 'k' && (e.metaKey || e.ctrlKey))) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setShowAutocomplete(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  const commitSearch = (q: string) => {
    onSearchChange?.(q);
    onSearchSubmit?.(q);
    setShowAutocomplete(false);
    setActiveIndex(-1);
    
    // Save to recent searches
    if (q.trim() && q.trim().length > 2 && !recentSearches.includes(q.trim())) {
      const updated = [q.trim(), ...recentSearches.slice(0, 4)];
      setRecentSearches(updated);
      localStorage.setItem('email_recent_searches', JSON.stringify(updated));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setLocalQuery(q);
    setShowAutocomplete(true);
    clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      onSearchChange?.(q);
    }, 180);
  };

  const handleClearSearch = () => {
    setLocalQuery('');
    onSearchChange?.('');
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showAutocomplete) return;
    
    const allSuggestions = localQuery 
      ? [...recentSearches.filter(s => s.toLowerCase().includes(localQuery.toLowerCase())), ...searchSuggestions]
      : recentSearches;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % allSuggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + allSuggestions.length) % allSuggestions.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const q = activeIndex >= 0 ? allSuggestions[activeIndex] : localQuery;
      commitSearch(q);
    }
  };

  return (
    <div className="modal-drag-handle flex-shrink-0 border-b border-gray-200/50 dark:border-gray-700/50 px-4 sm:px-6 py-4 cursor-move">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Icon - visible on mobile */}
          <div
            className="p-2 rounded-lg transition-colors flex-shrink-0 mr-2 sm:mr-0"
            style={{ backgroundColor: `${primaryColor}20` }}
          >
            <Mail
              className="h-6 w-6"
              style={{ color: primaryColor }}
            />
          </div>
          
          {/* Title - hidden on mobile, visible on desktop */}
          <div className="flex-shrink-0 hidden sm:block">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
              {title}
            </h2>
          </div>
        </div>

        {/* Right Side - Search and Close */}
        <div className="flex items-center gap-3 flex-1 justify-end min-w-0">
          {/* Search - Shop/CRM Style */}
          <div className="relative flex-1 max-w-sm min-w-0">
            <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
              <Search className={`h-5 w-5 transition-all duration-200 ${
                localQuery ? 'text-gray-600 dark:text-gray-300 scale-110' : 'text-gray-400'
              }`} />
            </span>
            
            <input
              ref={searchInputRef}
              type="text"
              role="search"
              aria-label="Search emails"
              aria-controls="email-search-autocomplete"
              aria-expanded={showAutocomplete}
              aria-activedescendant={activeIndex >= 0 ? `email-search-suggestion-${activeIndex}` : undefined}
              placeholder="Search..."
              value={localQuery}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
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

            {/* Autocomplete Dropdown - Shop/CRM Style */}
            {showAutocomplete && (recentSearches.length > 0 || searchSuggestions.length > 0) && (
              <div 
                id="email-search-autocomplete"
                role="listbox"
                className="fixed sm:absolute top-auto sm:top-full left-0 right-0 sm:left-0 sm:right-0 mt-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl z-[100000] max-h-80 overflow-y-auto mx-4 sm:mx-0"
              >
                {/* Recent Searches */}
                {recentSearches.filter(search => !localQuery || search.toLowerCase().includes(localQuery.toLowerCase())).length > 0 && (
                  <div className="p-2">
                    <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide px-3 py-2">Recent</div>
                    {recentSearches.filter(search => !localQuery || search.toLowerCase().includes(localQuery.toLowerCase())).map((search, idx) => (
                      <button
                        key={idx}
                        id={`email-search-suggestion-${idx}`}
                        role="option"
                        aria-selected={activeIndex === idx}
                        onClick={() => {
                          setLocalQuery(search);
                          commitSearch(search);
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
                    {searchSuggestions.slice(0, 5).map((suggestion, idx) => {
                      const suggestionIdx = idx + recentSearches.filter(s => !localQuery || s.toLowerCase().includes(localQuery.toLowerCase())).length;
                      return (
                        <button
                          key={idx}
                          id={`email-search-suggestion-${suggestionIdx}`}
                          role="option"
                          aria-selected={activeIndex === suggestionIdx}
                          onClick={() => {
                            setLocalQuery(suggestion);
                            commitSearch(suggestion);
                          }}
                          className={`w-full text-left px-3 py-2.5 rounded-lg text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2 transition-colors ${
                            activeIndex === suggestionIdx ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                          }`}
                          style={activeIndex === suggestionIdx ? { backgroundColor: `${primaryColor}15` } : {}}
                        >
                          <Search className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                          {suggestion}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0"
            aria-label="Close modal"
          >
            <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  );
}
