// src/components/features/AdvancedSearchInput.tsx
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useThemeColors } from '@/hooks/useThemeColors';

interface AdvancedSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  suggestions?: string[];
  placeholder?: string;
}

export default function AdvancedSearchInput({
  value,
  onChange,
  onClear,
  suggestions = [],
  placeholder = 'Search features...',
}: AdvancedSearchInputProps) {
  const themeColors = useThemeColors();
  const [localQuery, setLocalQuery] = useState(value);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const debounceTimerRef = useRef<NodeJS.Timeout>();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('features_recent_searches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse recent searches');
      }
    }
  }, []);

  // Sync local query with prop
  useEffect(() => {
    setLocalQuery(value);
  }, [value]);

  // Keyboard shortcuts and autocomplete navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or / to focus search
      if (((e.metaKey || e.ctrlKey) && e.key === 'k') || e.key === '/') {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      // Arrow navigation in autocomplete
      if (showAutocomplete && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
        e.preventDefault();
        const filteredRecent = localQuery
          ? recentSearches.filter(search => search.toLowerCase().includes(localQuery.toLowerCase()))
          : recentSearches;
        const filteredSuggestions = suggestions.filter(suggestion => 
          suggestion.toLowerCase().includes(localQuery.toLowerCase())
        ).slice(0, 5);
        const totalItems = filteredRecent.length + filteredSuggestions.length;
        
        if (totalItems === 0) return;
        
        if (e.key === 'ArrowDown') {
          setActiveIndex(prev => prev < totalItems - 1 ? prev + 1 : prev);
        } else {
          setActiveIndex(prev => prev > -1 ? prev - 1 : -1);
        }
      }

      // Enter to select suggestion
      if (showAutocomplete && e.key === 'Enter' && activeIndex >= 0) {
        e.preventDefault();
        const filteredRecent = localQuery
          ? recentSearches.filter(search => search.toLowerCase().includes(localQuery.toLowerCase()))
          : recentSearches;
        const filteredSuggestions = suggestions.filter(suggestion =>
          suggestion.toLowerCase().includes(localQuery.toLowerCase())
        ).slice(0, 5);
        
        if (activeIndex < filteredRecent.length) {
          // Selected from recent searches
          handleSearchChange(filteredRecent[activeIndex]);
        } else {
          // Selected from suggestions
          const suggestionIndex = activeIndex - filteredRecent.length;
          if (filteredSuggestions[suggestionIndex]) {
            handleSearchChange(filteredSuggestions[suggestionIndex]);
          }
        }
        setShowAutocomplete(false);
      }

      // Escape to close autocomplete
      if (e.key === 'Escape') {
        setShowAutocomplete(false);
        setActiveIndex(-1);
        searchInputRef.current?.blur();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showAutocomplete, localQuery, suggestions, recentSearches, activeIndex]);

  // Debounced search handler
  const handleSearchChange = useCallback((newValue: string) => {
    setLocalQuery(newValue);
    
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = setTimeout(() => {
      onChange(newValue);
      
      // Save to recent searches when user actually searches (not empty and different from last)
      if (newValue.trim() && !recentSearches.includes(newValue.trim()) && newValue.length > 2) {
        const updated = [newValue.trim(), ...recentSearches.slice(0, 4)];
        setRecentSearches(updated);
        localStorage.setItem('features_recent_searches', JSON.stringify(updated));
      }
    }, 50);
  }, [onChange, recentSearches]);

  // Clear search
  const handleClearSearch = useCallback(() => {
    setLocalQuery('');
    onChange('');
    onClear();
    setShowAutocomplete(false);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
  }, [onChange, onClear]);

  // Highlight matching text
  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, index) => 
      index % 2 === 1 ? (
        <mark key={index} className="bg-transparent font-semibold" style={{ color: themeColors.cssVars.primary.base }}>
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const filteredRecent = localQuery
    ? recentSearches.filter(search => search.toLowerCase().includes(localQuery.toLowerCase()))
    : recentSearches;
  
  const filteredSuggestions = suggestions.filter(suggestion =>
    suggestion.toLowerCase().includes(localQuery.toLowerCase())
  ).slice(0, 5);

  return (
    <div className="relative max-w-2xl mx-auto">
      <div className="relative">
        {/* Search Icon */}
        <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
          <MagnifyingGlassIcon 
            className="h-5 w-5 text-gray-400 transition-all duration-200"
            style={{
              color: localQuery ? themeColors.cssVars.primary.base : undefined,
              transform: localQuery ? 'scale(1.1)' : 'scale(1)',
            }}
          />
        </span>
        
        {/* Search Input */}
        <input
          ref={searchInputRef}
          type="text"
          role="search"
          aria-label="Search features"
          aria-controls="search-autocomplete"
          aria-expanded={showAutocomplete}
          aria-activedescendant={activeIndex >= 0 ? `search-suggestion-${activeIndex}` : undefined}
          placeholder={placeholder}
          value={localQuery}
          onChange={(e) => {
            handleSearchChange(e.target.value);
            setShowAutocomplete(true);
            setActiveIndex(-1);
          }}
          onFocus={(e) => {
            setShowAutocomplete(true);
            setActiveIndex(-1);
            e.currentTarget.style.boxShadow = `0 0 0 3px ${themeColors.cssVars.primary.base}20`;
          }}
          onBlur={(e) => {
            e.currentTarget.style.boxShadow = '';
            setTimeout(() => {
              setShowAutocomplete(false);
              setActiveIndex(-1);
            }, 200);
          }}
          className="w-full pl-12 pr-24 py-3.5 text-base border bg-white border-gray-100 rounded-xl focus:outline-none focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500"
        />
        
        {/* Right Side Icons */}
        <div className="absolute inset-y-0 right-0 flex items-center gap-2 pr-4">
          {/* Clear Button */}
          {localQuery && (
            <button
              onClick={handleClearSearch}
              className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Clear search"
            >
              <XMarkIcon className="h-4 w-4 text-gray-500" />
            </button>
          )}
          
          {/* Keyboard Shortcut Hint */}
          <span className="hidden xl:flex items-center gap-0.5 px-2.5 py-1 text-xs text-gray-500 font-medium bg-gray-100 rounded-md">
            <kbd>⌘</kbd><kbd>K</kbd>
          </span>
        </div>
        
        {/* Autocomplete Dropdown */}
        {showAutocomplete && localQuery && (filteredRecent.length > 0 || filteredSuggestions.length > 0) && (
          <div 
            id="search-autocomplete"
            role="listbox"
            className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-64 overflow-y-auto"
          >
            {/* Recent Searches */}
            {filteredRecent.length > 0 && (
              <div className="p-3 border-b border-gray-100">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Recent Searches</div>
                {filteredRecent.slice(0, 3).map((search, index) => (
                  <button
                    key={search}
                    id={`search-suggestion-${index}`}
                    onClick={() => {
                      handleSearchChange(search);
                      setShowAutocomplete(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded-md transition-colors ${
                      activeIndex === index ? 'bg-gray-100 font-medium' : 'text-gray-700'
                    }`}
                    style={{
                      backgroundColor: activeIndex === index ? `${themeColors.cssVars.primary.lighter}80` : undefined,
                      color: activeIndex === index ? themeColors.cssVars.primary.base : undefined,
                    }}
                  >
                    {highlightMatch(search, localQuery)}
                  </button>
                ))}
              </div>
            )}
            
            {/* Search Suggestions */}
            {filteredSuggestions.length > 0 && (
              <div className="p-3">
                {filteredSuggestions.map((suggestion, index) => {
                  const actualIndex = filteredRecent.length + index;
                  return (
                    <button
                      key={`suggestion-${index}-${suggestion}`}
                      id={`search-suggestion-${actualIndex}`}
                      onClick={() => {
                        handleSearchChange(suggestion);
                        setShowAutocomplete(false);
                      }}
                      className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 rounded-md transition-colors ${
                        activeIndex === actualIndex ? 'font-medium' : 'text-gray-700'
                      }`}
                      style={{
                        backgroundColor: activeIndex === actualIndex ? `${themeColors.cssVars.primary.lighter}80` : undefined,
                        color: activeIndex === actualIndex ? themeColors.cssVars.primary.base : undefined,
                      }}
                    >
                      {highlightMatch(suggestion, localQuery)}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
