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
  return (
    <div className="space-y-4">
      <div className="border rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Global Cookie Categories</h3>
        <p className="text-sm text-gray-600 mb-4">
          These are the global cookie categories available to all organizations. They are read-only here.
        </p>
        
        {value && value.length > 0 ? (
          <div className="space-y-3">
            {value.map((category) => (
              <div key={category.id} className="bg-gray-50 p-3 rounded border">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{category.name}</h4>
                    <p className="text-sm text-gray-600">{category.description}</p>
                  </div>
                  <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                    ID: {category.id}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No cookie categories available.</p>
            <p className="text-xs mt-1">Cookie categories will be loaded from the database.</p>
          </div>
        )}
        
        {error && (
          <div className="mt-3 text-sm text-red-600">
            Error: {error}
          </div>
        )}
      </div>
    </div>
  );
};
