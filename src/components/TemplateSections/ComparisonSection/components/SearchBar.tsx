import React, { useRef, useState } from 'react';
import { Search, X } from 'lucide-react';

/**
 * SearchBar component for filtering comparison features.
 * Features CRM-style design with keyboard shortcuts and accessibility.
 */
export interface SearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  showDifferencesOnly: boolean;
  setShowDifferencesOnly: (show: boolean) => void;
  clearSearch: () => void;
  placeholder?: string;
  showFilters?: boolean;
  hideDifferencesToggle?: boolean;
  themeColors?: any;
  onSearchChange?: (value: string) => void;
}

const SearchBarComponent: React.FC<SearchBarProps> = ({
  searchQuery,
  setSearchQuery,
  showDifferencesOnly,
  setShowDifferencesOnly,
  clearSearch,
  placeholder = 'Search features...',
  showFilters = true,
  hideDifferencesToggle = false,
  themeColors,
  onSearchChange,
}) => {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [showAutocomplete, setShowAutocomplete] = useState(false);

  const handleChange = (value: string) => {
    setSearchQuery(value);
    if (onSearchChange) {
      onSearchChange(value);
    }
  };

  return (
    <div className="mb-6 no-print flex justify-start md:justify-end">
      {/* CRM-Style Search */}
      <div className="relative w-full md:w-auto md:min-w-[320px] max-w-md">
        {/* Search Icon */}
        <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
          <Search className={`h-5 w-5 transition-all duration-200 ${
            searchQuery ? 'text-gray-600 dark:text-gray-300 scale-110' : 'text-gray-400'
          }`} />
        </span>
        
        {/* Search Input */}
        <input
          ref={searchInputRef}
          type="text"
          role="search"
          aria-label="Search features"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => {
            handleChange(e.target.value);
            setShowAutocomplete(true);
          }}
          onFocus={(e) => {
            setShowAutocomplete(true);
            if (themeColors?.primary) {
              e.currentTarget.style.boxShadow = `0 0 0 3px ${themeColors.primary}20`;
            }
          }}
          onBlur={(e) => {
            e.currentTarget.style.boxShadow = '';
            setTimeout(() => {
              setShowAutocomplete(false);
            }, 200);
          }}
          className="w-full pl-12 pr-24 py-3.5 text-base border bg-white border-gray-100 rounded-xl focus:outline-none focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400"
          style={{
            '--tw-ring-color': themeColors?.primary || '#3b82f6',
          } as React.CSSProperties}
        />
        
        {/* Right Side Icons */}
        <div className="absolute inset-y-0 right-0 flex items-center gap-2 pr-4">
          {/* Clear Button */}
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Clear search"
            >
              <X className="h-4 w-4 text-gray-500" />
            </button>
          )}
          
          {/* Keyboard Shortcut Hint */}
          <span className="hidden xl:flex items-center gap-0.5 px-2.5 py-1 text-xs text-gray-500 font-medium bg-gray-100 rounded-md">
            <kbd>⌘</kbd><kbd>K</kbd>
          </span>
        </div>
      </div>
    </div>
  );
};

export const SearchBar = React.memo(SearchBarComponent);
