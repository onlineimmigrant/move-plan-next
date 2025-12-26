import React from 'react';

/**
 * LoadingSkeleton component displays a placeholder UI while comparison data loads.
 * Provides visual feedback and prevents layout shift.
 */
export const LoadingSkeleton: React.FC = () => {
  return (
    <div className="animate-pulse space-y-6" role="status" aria-label="Loading comparison data">
      {/* Header Skeleton */}
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded-lg w-1/3"></div>
        <div className="h-4 bg-gray-100 rounded w-2/3"></div>
      </div>

      {/* Search Bar Skeleton */}
      <div className="h-14 bg-gray-100 rounded-xl w-full max-w-md ml-auto"></div>

      {/* Pricing Controls Skeleton */}
      <div className="flex justify-between items-center">
        <div className="h-10 bg-gray-100 rounded-lg w-32"></div>
        <div className="h-10 bg-gray-100 rounded-lg w-40"></div>
      </div>

      {/* Table Skeleton */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        {/* Table Header */}
        <div className="bg-gray-50 border-b-2 border-gray-200">
          <div className="flex">
            <div className="flex-1 p-4">
              <div className="h-4 bg-gray-200 rounded w-20"></div>
            </div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex-1 p-4 text-center">
                <div className="h-8 w-8 bg-gray-200 rounded-full mx-auto mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-24 mx-auto"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Table Rows */}
        {[1, 2, 3, 4, 5].map((row) => (
          <div key={row} className="border-b border-gray-100">
            <div className="flex items-center py-4">
              <div className="flex-1 px-4">
                <div className="h-5 bg-gray-100 rounded w-3/4"></div>
              </div>
              {[1, 2, 3].map((col) => (
                <div key={col} className="flex-1 px-4 text-center">
                  <div className="h-6 w-6 bg-gray-100 rounded-full mx-auto"></div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Feature Coverage Chart Skeleton */}
      <div className="mt-8 p-6 bg-gray-50 rounded-lg">
        <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
        <div className="h-64 bg-gray-100 rounded"></div>
      </div>

      <span className="sr-only">Loading comparison data, please wait...</span>
    </div>
  );
};

export default React.memo(LoadingSkeleton);
