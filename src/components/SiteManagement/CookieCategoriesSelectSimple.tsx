'use client';

import React from 'react';
import { EyeIcon } from '@heroicons/react/24/outline';

interface CookieCategory {
  id: number;
  name: string;
  description: string;
  name_translation?: string | null;
  description_translation?: string | null;
}

interface CookieCategoriesSelectProps {
  value: CookieCategory[];
  onChange: (categories: CookieCategory[]) => void;
  error?: string;
}

export const CookieCategoriesSelect: React.FC<CookieCategoriesSelectProps> = ({
  value = [],
  onChange,
  error
}) => {
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="space-y-4">
      <div className="border rounded-xl p-4 bg-white/50">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-medium text-gray-900">Global Cookie Categories</h3>
            <p className="text-xs text-gray-600 mt-1">
              {value.length} global categor{value.length !== 1 ? 'ies' : 'y'} available (read-only)
            </p>
          </div>
        </div>
        
        {value && value.length > 0 ? (
          <div className="space-y-3">
            {value.map((category) => (
              <div 
                key={category.id} 
                className="bg-white/80 backdrop-blur-sm border border-gray-200/60 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="p-1.5 text-gray-400 rounded-lg bg-gray-100">
                      <EyeIcon className="h-4 w-4" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900 truncate">
                          {truncateText(category.name, 25)}
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-600 border border-blue-200">
                          Global
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1 truncate">
                        {truncateText(category.description, 60)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="bg-gray-100 px-2 py-1 rounded-md">
                      ID: {category.id}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-lg mb-3">
              <EyeIcon className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-sm">No cookie categories available.</p>
            <p className="text-xs mt-1 text-gray-400">Categories will be loaded from the global database.</p>
          </div>
        )}
        
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">
              <strong>Error:</strong> {error}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
