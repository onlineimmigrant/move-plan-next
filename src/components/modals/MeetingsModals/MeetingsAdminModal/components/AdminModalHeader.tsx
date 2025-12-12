import React, { useState, useRef, useEffect } from 'react';
import { CalendarIcon, UsersIcon, PaperAirplaneIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Search, X } from 'lucide-react';
import type { AdminView } from '../hooks';

interface AdminModalHeaderProps {
  currentView: AdminView;
  setCurrentView: (view: AdminView) => void;
  hoveredTab: string | null;
  setHoveredTab: (tab: string | null) => void;
  showTypesModal: () => void;
  showSettingsModal: () => void;
  showInstantMeetingModal?: () => void;
  onClose: () => void;
  activeBookingCount: number;
  fetchActiveBookingCount: () => void;
  primary: {
    base: string;
    hover: string;
  };
  isMobile: boolean;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

/**
 * AdminModalHeader component
 * 
 * Renders the header section of the admin modal including:
 * - Title with calendar icon
 * - Action buttons (Types, Settings) - only in non-booking views
 * - Close button
 * - Tab navigation (Book, Manage) - only in non-booking views
 * 
 * Has separate rendering for mobile and desktop layouts.
 */
export const AdminModalHeader = React.memo<AdminModalHeaderProps>(({
  currentView,
  setCurrentView,
  hoveredTab,
  setHoveredTab,
  showTypesModal,
  showSettingsModal,
  showInstantMeetingModal,
  onClose,
  activeBookingCount,
  fetchActiveBookingCount,
  primary,
  isMobile,
  searchQuery = '',
  onSearchChange,
}) => {
  // Local state for advanced search
  const [localQuery, setLocalQuery] = useState(searchQuery);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout>();

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('meetings_recent_searches');
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
        localStorage.setItem('meetings_recent_searches', JSON.stringify(updated));
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
      if (!showAutocomplete || !searchInputRef.current) return;
      
      const suggestions = recentSearches.filter(search => 
        search.toLowerCase().includes(localQuery.toLowerCase())
      );
      
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
      
      if (e.key === 'Enter' && showAutocomplete && activeIndex >= 0) {
        e.preventDefault();
        if (suggestions[activeIndex]) {
          setLocalQuery(suggestions[activeIndex]);
          onSearchChange?.(suggestions[activeIndex]);
          setShowAutocomplete(false);
          setActiveIndex(-1);
        }
        return;
      }
      
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
  }, [showAutocomplete, activeIndex, localQuery, recentSearches, onSearchChange]);

  // Cleanup debounce timer
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <>
      {/* Header */}
      <div className={`${isMobile ? 'modal-drag-handle' : 'modal-drag-handle cursor-move'} flex items-center justify-between ${isMobile ? 'p-4' : 'p-6'} border-b border-white/10 bg-white/30 dark:bg-gray-800/30 rounded-t-2xl`}>
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Icon */}
          <div
            className={`${isMobile ? 'block' : 'hidden sm:block'} p-2 rounded-lg transition-colors flex-shrink-0`}
            style={{ backgroundColor: `${primary.base}20` }}
          >
            <CalendarIcon
              className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'}`}
              style={{ color: primary.base }}
            />
          </div>
          
          {/* Title - Desktop only */}
          {!isMobile && (
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
              Appointments
            </h2>
          )}
        </div>
        
        {/* Right Side - Search and Close */}
        <div className="flex items-center gap-3 flex-1 justify-end min-w-0">
          {/* Search - Blog Style */}
          {onSearchChange && (
            <div className={`relative ${isMobile ? 'flex-1' : 'flex-1 max-w-sm'} min-w-0`}>
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
                aria-label="Search bookings"
                aria-controls="search-autocomplete"
                aria-expanded={showAutocomplete}
                aria-activedescendant={activeIndex >= 0 ? `search-suggestion-${activeIndex}` : undefined}
                placeholder={isMobile ? "Search..." : "Search bookings..."}
                value={localQuery}
                onChange={(e) => {
                  handleSearchChange(e.target.value);
                  setShowAutocomplete(true);
                  setActiveIndex(-1);
                }}
                onFocus={(e) => {
                  setShowAutocomplete(true);
                  setActiveIndex(-1);
                  e.currentTarget.style.boxShadow = `0 0 0 3px ${primary.base}20`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.boxShadow = '';
                  setTimeout(() => {
                    setShowAutocomplete(false);
                    setActiveIndex(-1);
                  }, 200);
                }}
                className={`w-full pl-12 ${localQuery ? 'pr-10' : isMobile ? 'pr-4' : 'pr-16'} ${isMobile ? 'py-2.5' : 'py-3.5'} text-base border bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 rounded-xl focus:outline-none focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400`}
                style={{
                  '--tw-ring-color': primary.base,
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
                
                {/* Keyboard Shortcut Hint - Desktop only */}
                {!isMobile && !localQuery && (
                  <span className="hidden xl:flex items-center gap-0.5 px-2.5 py-1 text-xs text-gray-500 dark:text-gray-400 font-medium bg-gray-100 dark:bg-gray-700 rounded-md">
                    <kbd>⌘</kbd><kbd>K</kbd>
                  </span>
                )}
              </div>
              
              {/* Autocomplete Dropdown */}
              {showAutocomplete && recentSearches.filter(search => 
                search.toLowerCase().includes(localQuery.toLowerCase())
              ).length > 0 && (
                <div 
                  id="search-autocomplete"
                  role="listbox"
                  className="fixed sm:absolute top-auto sm:top-full left-0 right-0 sm:left-0 sm:right-0 mt-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl z-[100000] max-h-80 overflow-y-auto mx-4 sm:mx-0"
                >
                  {/* Recent Searches */}
                  <div className="p-2">
                    <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide px-3 py-2">Recent</div>
                    {recentSearches.filter(search => 
                      search.toLowerCase().includes(localQuery.toLowerCase())
                    ).map((search, idx) => (
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
                        style={activeIndex === idx ? { backgroundColor: `${primary.base}15` } : {}}
                      >
                        <Search className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                        {search}
                      </button>
                    ))}
                  </div>
                  
                  {/* Search Tips */}
                  {!localQuery && (
                    <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                      <p className="font-medium mb-1">Search tips:</p>
                      <p className="text-xs">Try searching by customer name or meeting type</p>
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

      {/* Tab Navigation */}
      {currentView !== 'booking' && (
        <div className={`flex items-center gap-2 ${isMobile ? 'px-4 py-3' : 'px-6 py-4'} border-b border-white/10 ${isMobile ? 'bg-white/20 dark:bg-gray-900/20' : 'bg-white/20 dark:bg-gray-900/20'}`}>
          <button
            onClick={() => setCurrentView('calendar')}
            onMouseEnter={() => setHoveredTab('create')}
            onMouseLeave={() => setHoveredTab(null)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all duration-300 shadow-sm"
            style={
              currentView === 'calendar'
                ? {
                    background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`,
                    color: 'white',
                    boxShadow: hoveredTab === 'create' 
                      ? `0 4px 12px ${primary.base}40` 
                      : `0 2px 4px ${primary.base}30`
                  }
                : {
                    backgroundColor: 'transparent',
                    color: hoveredTab === 'create' ? primary.hover : primary.base,
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: hoveredTab === 'create' ? `${primary.base}80` : `${primary.base}40`
                  }
            }
          >
            <CalendarIcon className="w-4 h-4" />
            Book
          </button>
          {showInstantMeetingModal && (
            <button
              onClick={showInstantMeetingModal}
              onMouseEnter={() => setHoveredTab('invite')}
              onMouseLeave={() => setHoveredTab(null)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all duration-300 shadow-sm"
              style={{
                backgroundColor: 'transparent',
                color: hoveredTab === 'invite' ? primary.hover : primary.base,
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: hoveredTab === 'invite' ? `${primary.base}80` : `${primary.base}40`
              }}
            >
              <PaperAirplaneIcon className="w-4 h-4" />
              Invite
            </button>
          )}
          <button
            onClick={() => {
              setCurrentView('manage-bookings');
              fetchActiveBookingCount();
            }}
            onMouseEnter={() => setHoveredTab('manage')}
            onMouseLeave={() => setHoveredTab(null)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all duration-300 shadow-sm"
            style={
              currentView === 'manage-bookings'
              ? {
                  background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`,
                  color: 'white',
                  boxShadow: hoveredTab === 'manage' 
                    ? `0 4px 12px ${primary.base}40` 
                    : `0 2px 4px ${primary.base}30`
                }
              : {
                  backgroundColor: 'transparent',
                  color: hoveredTab === 'manage' ? primary.hover : primary.base,
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: hoveredTab === 'manage' ? `${primary.base}80` : `${primary.base}40`
                }
            }
          >
            <UsersIcon className="w-4 h-4" />
            <span>Manage</span>
            {activeBookingCount > 0 && (
              <span 
                className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold rounded-full"
                style={{
                  backgroundColor: currentView === 'manage-bookings' ? 'rgba(255, 255, 255, 0.25)' : primary.base,
                  color: 'white'
                }}
              >
                {activeBookingCount}
              </span>
            )}
          </button>
        </div>
      )}
    </>
  );
});

AdminModalHeader.displayName = 'AdminModalHeader';
