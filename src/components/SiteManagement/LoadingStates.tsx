import React from 'react';

interface LoadingStatesProps {
  type: 'grid' | 'single' | 'inline';
  message?: string;
}

export default function LoadingStates({ type, message = 'Loading...' }: LoadingStatesProps) {
  if (type === 'grid') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse">
            <div className="flex items-center justify-between mb-4">
              <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              <div className="h-6 w-6 bg-gray-200 rounded"></div>
            </div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="h-8 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'single') {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-sky-600 mr-3"></div>
          <span className="text-gray-700">{message}</span>
        </div>
      </div>
    );
  }

  if (type === 'inline') {
    return (
      <div className="inline-flex items-center">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-sky-600 mr-2"></div>
        <span className="text-gray-600 text-sm">{message}</span>
      </div>
    );
  }

  return null;
}
