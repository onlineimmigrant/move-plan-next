import React, { useState, useRef, forwardRef, useImperativeHandle, useMemo } from 'react';
import { MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { organizationTypes } from './types';
import Button from '@/ui/Button';

interface HeaderProps {
  canCreateMore: boolean;
  onCreateNew: () => void;
  onTestAuth: () => void;
  onSearch?: (query: string) => void;
  onFilterChange?: (filter: string) => void;
  onSortChange?: (sort: string) => void;
  totalOrganizations?: number;
  organizations?: Array<{ type: string }>;
  activeFilter?: string;
  activeSort?: string;
}

const Header = forwardRef<{ focusSearch: () => void }, HeaderProps>(function Header({ 
  canCreateMore, 
  onCreateNew, 
  onTestAuth, 
  onSearch, 
  onFilterChange, 
  onSortChange,
  totalOrganizations = 0,
  organizations = [],
  activeFilter = 'all',
  activeSort = 'name'
}, ref) {
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    focusSearch: () => {
      searchInputRef.current?.focus();
    }
  }));

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearch?.(query);
  };

  // Generate dynamic filter options based on actual organization types
  const filterOptions = useMemo(() => {
    // Count organizations by type
    const typeCounts: Record<string, number> = {};
    organizations.forEach(org => {
      typeCounts[org.type] = (typeCounts[org.type] || 0) + 1;
    });

    // Create filter options starting with "All Organizations"
    const options = [
      { value: 'all', label: 'All Organizations', count: totalOrganizations }
    ];

    // Add options for each type that actually exists
    Object.entries(typeCounts).forEach(([type, count]) => {
      const typeInfo = organizationTypes.find(t => t.value === type);
      if (typeInfo) {
        options.push({
          value: type,
          label: typeInfo.label,
          count
        });
      }
    });

    return options;
  }, [organizations, totalOrganizations]);

  const sortOptions = [
    { value: 'name', label: 'Name' },
    { value: 'type', label: 'Type' },
    { value: 'created', label: 'Created Date' },
    { value: 'updated', label: 'Last Updated' },
  ];

  return (
    <div className="bg-transparent">
      <div className="px-4 sm:px-6 lg:px-8 py-4">
        {/* Title and Search */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2 sm:mb-3">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 relative">
                Site Management
                <span className="absolute -bottom-1 sm:-bottom-2 left-0 w-16 h-1 bg-sky-600 rounded-full" />
              </h1>
              {/* Desktop Create Site Button */}
              {canCreateMore && (
                <Button
                  variant="primary"
                  onClick={onCreateNew}
                  className="hidden sm:flex shadow-xl hover:shadow-2xl hover:shadow-sky-200/50 w-auto transform hover:scale-105 transition-all duration-300 bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-600 hover:to-indigo-600"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Site
                </Button>
              )}
            </div>
            <p className="text-gray-500 text-base font-medium mb-4 sm:mb-0">
              Deploy & Manage
            </p>
            {/* Mobile Create Site Button - Full Width Below Description */}
            {canCreateMore && (
              <Button
                variant="primary"
                onClick={onCreateNew}
                className="sm:hidden shadow-xl hover:shadow-2xl hover:shadow-sky-200/50 w-full transform hover:scale-105 transition-all duration-300 bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-600 hover:to-indigo-600"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Site
              </Button>
            )}
          </div>

          {/* Enhanced Search */}
          <div className="w-full lg:w-[400px]">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 group-focus-within:text-sky-500 transition-colors duration-200" />
              </div>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search organizations... (⌘F)"
                value={searchQuery}
                onChange={handleSearchChange}
                className="block w-full pl-11 pr-4 py-3 border border-gray-200/60 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-400 bg-white/90 backdrop-blur-sm hover:bg-white/95 hover:border-gray-300/60 focus:bg-white transition-all duration-300 shadow-sm hover:shadow-md focus:shadow-lg"
              />
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-sky-500/10 to-indigo-500/10 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </div>
          </div>
        </div>


      </div>
    </div>
  );
});

export default Header;
