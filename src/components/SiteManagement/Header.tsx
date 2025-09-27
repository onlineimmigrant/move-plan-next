import React, { useState, useRef, forwardRef, useImperativeHandle, useMemo } from 'react';
import { MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { organizationTypes } from './types';

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
    <div className="border-b border-gray-200/60 fixed top-0 z-30 backdrop-blur-xl bg-white/95 shadow-sm 
                    w-4/5 right-0 
                    xl:w-3/4 xl:right-0 xl:left-1/4">
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        {/* Title and Description */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-4 sm:space-y-0 mb-6">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 tracking-tight">
              Site Management
            </h1>
            <p className="text-gray-600 mt-1 text-sm">
              Create and manage your organization sites • {totalOrganizations} {totalOrganizations === 1 ? 'organization' : 'organizations'}
            </p>
          </div>

          {/* Search */}
          <div className="w-full sm:w-80">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
              </div>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search organizations... (Cmd+F)"
                value={searchQuery}
                onChange={handleSearchChange}
                className="block w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white transition-all duration-200"
              />
            </div>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          {/* Filter Tabs - Scrollable */}
          <div className="flex-1 min-w-0 mr-4 relative">
            <div className="flex items-center space-x-1 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 pb-1">
              <div className="flex items-center space-x-1 min-w-max pr-4">
                {filterOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => onFilterChange?.(option.value)}
                className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                  activeFilter === option.value
                    ? 'bg-sky-100 text-sky-700 ring-1 ring-sky-200'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {option.label}
                {option.count > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs bg-gray-200 text-gray-700">
                    {option.count}
                  </span>
                )}
                </button>
                ))}
              </div>
            </div>
            {/* Scroll hint gradient */}
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white/95 to-transparent pointer-events-none"></div>
          </div>

          {/* Sort and Create */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <FunnelIcon className="h-4 w-4 text-gray-400" />
              <select
                value={activeSort}
                onChange={(e) => onSortChange?.(e.target.value)}
                className="text-sm border-0 bg-transparent text-gray-600 focus:ring-0 focus:outline-none cursor-pointer"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    Sort by {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            {canCreateMore && (
              <button
                onClick={onCreateNew}
                className="inline-flex items-center px-4 py-2 bg-sky-600 text-white text-sm font-medium rounded-lg hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 transition-colors duration-200"
              >
                Create Site
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

export default Header;
