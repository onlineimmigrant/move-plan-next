import React, { useState } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface HeaderProps {
  canCreateMore: boolean;
  onCreateNew: () => void;
  onTestAuth: () => void;
  onSearch?: (query: string) => void;
}

export default function Header({ canCreateMore, onCreateNew, onTestAuth, onSearch }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearch?.(query);
  };

  return (
    <div className="border-b border-gray-200/60 sticky top-0 z-20 backdrop-blur-xl bg-white/80">
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        {/* Desktop: Title and Search on same line, Mobile: Stacked */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          {/* Left section - Title and description */}
          <div className="flex-1 sm:pr-6">
            <h1 className="text-2xl sm:text-3xl font-light text-gray-900 tracking-tight">
              Site Management
            </h1>
            <p className="text-gray-500 mt-1 font-light">
              Create and manage your organization sites
            </p>
          </div>

          {/* Right section - Search (separate line on mobile, same line on desktop) */}
          <div className="w-full sm:w-auto sm:max-w-sm">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search organizations..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="block w-full pl-9 pr-4 py-2.5 border border-gray-200/60 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-300 bg-gray-50/30 hover:bg-white/70 transition-all duration-200 font-light backdrop-blur-sm"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
