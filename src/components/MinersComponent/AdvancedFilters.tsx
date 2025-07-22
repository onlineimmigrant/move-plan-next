'use client';

import React from 'react';
import Button from '@/ui/Button';
import { FilterState } from './types';

interface AdvancedFiltersProps {
  showFilters: boolean;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  uniqueStatuses: string[];
  uniqueUsers: string[];
  uniqueModels: string[];
}

export default function AdvancedFilters({ 
  showFilters, 
  filters, 
  onFiltersChange, 
  uniqueStatuses, 
  uniqueUsers, 
  uniqueModels 
}: AdvancedFiltersProps) {
  if (!showFilters) return null;

  const clearAllFilters = () => {
    onFiltersChange({
      search: '',
      status: [],
      user: [],
      model: [],
      profit_range: [0, 50],
      power_range: [0, 5000]
    });
  };

  return (
    <>
      <style jsx>{`
        .slider-emerald::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #10b981, #059669);
          cursor: pointer;
          box-shadow: 0 4px 8px rgba(16, 185, 129, 0.3);
        }
        .slider-yellow::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #f59e0b, #d97706);
          cursor: pointer;
          box-shadow: 0 4px 8px rgba(245, 158, 11, 0.3);
        }
        .slider-emerald::-webkit-slider-track,
        .slider-yellow::-webkit-slider-track {
          height: 8px;
          cursor: pointer;
          background: #e5e7eb;
          border-radius: 4px;
        }
      `}</style>
      
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/60 shadow-lg p-6 mt-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Advanced Filters</h3>
          </div>
          <Button
            onClick={clearAllFilters}
            className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Clear All
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Status Filter */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-3">
              <div className="p-1.5 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <label className="text-sm font-semibold text-gray-900">Status</label>
            </div>
            <div className="bg-gray-50/50 rounded-xl p-4 space-y-3">
              {uniqueStatuses.map(status => (
                <label key={status} className="flex items-center group cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={filters.status.includes(status)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          onFiltersChange({ ...filters, status: [...filters.status, status] });
                        } else {
                          onFiltersChange({ ...filters, status: filters.status.filter(s => s !== status) });
                        }
                      }}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded-md border-2 transition-all duration-200 ${
                      filters.status.includes(status)
                        ? 'bg-gradient-to-br from-blue-500 to-blue-600 border-blue-500 shadow-md'
                        : 'border-gray-300 group-hover:border-blue-400'
                    }`}>
                      {filters.status.includes(status) && (
                        <svg className="w-3 h-3 text-white absolute inset-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <span className={`ml-3 text-sm font-medium transition-colors ${
                    status === 'online' 
                      ? 'text-green-700' 
                      : status === 'offline' 
                      ? 'text-red-700' 
                      : 'text-gray-700'
                  } group-hover:text-gray-900 capitalize`}>
                    {status}
                  </span>
                  <div className={`ml-auto w-2 h-2 rounded-full ${
                    status === 'online' 
                      ? 'bg-green-400' 
                      : status === 'offline' 
                      ? 'bg-red-400' 
                      : 'bg-gray-400'
                  }`}></div>
                </label>
              ))}
            </div>
          </div>

          {/* User Filter */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-3">
              <div className="p-1.5 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <label className="text-sm font-semibold text-gray-900">Users</label>
            </div>
            <div className="bg-gray-50/50 rounded-xl p-4 max-h-40 overflow-y-auto space-y-3 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
              {uniqueUsers.map(user => (
                <label key={user} className="flex items-center group cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={filters.user.includes(user)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          onFiltersChange({ ...filters, user: [...filters.user, user] });
                        } else {
                          onFiltersChange({ ...filters, user: filters.user.filter(u => u !== user) });
                        }
                      }}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded-md border-2 transition-all duration-200 ${
                      filters.user.includes(user)
                        ? 'bg-gradient-to-br from-purple-500 to-purple-600 border-purple-500 shadow-md'
                        : 'border-gray-300 group-hover:border-purple-400'
                    }`}>
                      {filters.user.includes(user) && (
                        <svg className="w-3 h-3 text-white absolute inset-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <span className="ml-3 text-sm font-medium text-gray-700 group-hover:text-gray-900 truncate flex-1">
                    {user}
                  </span>
                  <div className="ml-2 w-2 h-2 rounded-full bg-purple-400"></div>
                </label>
              ))}
            </div>
          </div>

          {/* Model Filter */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-3">
              <div className="p-1.5 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg">
                <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <label className="text-sm font-semibold text-gray-900">Models</label>
            </div>
            <div className="bg-gray-50/50 rounded-xl p-4 space-y-3">
              {uniqueModels.map(model => (
                <label key={model} className="flex items-center group cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={filters.model.includes(model)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          onFiltersChange({ ...filters, model: [...filters.model, model] });
                        } else {
                          onFiltersChange({ ...filters, model: filters.model.filter(m => m !== model) });
                        }
                      }}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded-md border-2 transition-all duration-200 ${
                      filters.model.includes(model)
                        ? 'bg-gradient-to-br from-orange-500 to-orange-600 border-orange-500 shadow-md'
                        : 'border-gray-300 group-hover:border-orange-400'
                    }`}>
                      {filters.model.includes(model) && (
                        <svg className="w-3 h-3 text-white absolute inset-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <span className="ml-3 text-sm font-medium text-gray-700 group-hover:text-gray-900">
                    {model}
                  </span>
                  <div className="ml-auto w-2 h-2 rounded-full bg-orange-400"></div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Range Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* Profit Range */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-3">
              <div className="p-1.5 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg">
                <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <label className="text-sm font-semibold text-gray-900">
                Profit Range: 
                <span className="text-emerald-600 font-bold ml-2">
                  ${filters.profit_range[0]} - ${filters.profit_range[1]}
                </span>
              </label>
            </div>
            <div className="bg-gray-50/50 rounded-xl p-4 space-y-4">
              <div className="relative">
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={filters.profit_range[0]}
                  onChange={(e) => onFiltersChange({ 
                    ...filters, 
                    profit_range: [Number(e.target.value), filters.profit_range[1]] 
                  })}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-emerald"
                />
                <div className="text-xs text-gray-500 mt-1">Min: $0</div>
              </div>
              <div className="relative">
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={filters.profit_range[1]}
                  onChange={(e) => onFiltersChange({ 
                    ...filters, 
                    profit_range: [filters.profit_range[0], Number(e.target.value)] 
                  })}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-emerald"
                />
                <div className="text-xs text-gray-500 mt-1">Max: $50</div>
              </div>
            </div>
          </div>

          {/* Power Range */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-3">
              <div className="p-1.5 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg">
                <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <label className="text-sm font-semibold text-gray-900">
                Power Range: 
                <span className="text-yellow-600 font-bold ml-2">
                  {filters.power_range[0]}W - {filters.power_range[1]}W
                </span>
              </label>
            </div>
            <div className="bg-gray-50/50 rounded-xl p-4 space-y-4">
              <div className="relative">
                <input
                  type="range"
                  min="0"
                  max="5000"
                  step="100"
                  value={filters.power_range[0]}
                  onChange={(e) => onFiltersChange({ 
                    ...filters, 
                    power_range: [Number(e.target.value), filters.power_range[1]] 
                  })}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-yellow"
                />
                <div className="text-xs text-gray-500 mt-1">Min: 0W</div>
              </div>
              <div className="relative">
                <input
                  type="range"
                  min="0"
                  max="5000"
                  step="100"
                  value={filters.power_range[1]}
                  onChange={(e) => onFiltersChange({ 
                    ...filters, 
                    power_range: [filters.power_range[0], Number(e.target.value)] 
                  })}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-yellow"
                />
                <div className="text-xs text-gray-500 mt-1">Max: 5000W</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
