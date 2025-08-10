'use client';

import React from 'react';

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
  // Debug logging
  console.log('🍪 CookieCategoriesSelect received value:', value);
  console.log('🍪 CookieCategoriesSelect value type:', typeof value, Array.isArray(value));
  
  return (
    <div className="space-y-4">
      <div className="bg-white/80 backdrop-blur-sm border border-gray-200/60 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-2 h-2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full"></div>
          <h3 className="text-sm font-semibold text-gray-900">Global Cookie Categories</h3>
        </div>
        
        <p className="text-sm text-gray-600 mb-6 leading-relaxed">
          These are the global cookie categories available to all organizations. They are read-only here.
        </p>
        
        {value && value.length > 0 ? (
          <div className="space-y-3">
            {value.map((category, index) => (
              <div 
                key={category.id} 
                className="bg-gradient-to-r from-gray-50/80 to-blue-50/40 backdrop-blur-sm border border-gray-200/50 rounded-lg p-4 hover:shadow-sm transition-all duration-200 group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium text-gray-900 group-hover:text-gray-800 transition-colors">
                        {category.name}
                      </h4>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {category.description}
                    </p>
                  </div>
                  
                  <div className="flex-shrink-0">
                    <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium text-gray-600 bg-gray-100/80 backdrop-blur-sm rounded-full border border-gray-200/60">
                      ID: {category.id}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="max-w-sm mx-auto">
              <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full opacity-60"></div>
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">No Cookie Categories Available</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Cookie categories will be loaded from the database.
              </p>
            </div>
          </div>
        )}
        
        {error && (
          <div className="mt-4 bg-red-50/80 backdrop-blur-sm border border-red-200/60 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-red-500 rounded-full mt-1.5 flex-shrink-0"></div>
              <div>
                <h4 className="text-sm font-medium text-red-800 mb-1">Error Loading Categories</h4>
                <p className="text-sm text-red-700">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
