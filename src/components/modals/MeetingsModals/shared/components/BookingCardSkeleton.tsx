import React from 'react';

interface BookingCardSkeletonProps {
  count?: number;
}

export function BookingCardSkeleton({ count = 3 }: BookingCardSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="relative rounded-lg p-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 animate-pulse"
        >
          {/* Title skeleton */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 pr-4">
              <div className="h-5 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/3"></div>
            </div>
            <div className="h-6 w-20 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
          </div>

          {/* Details skeleton */}
          <div className="space-y-2 mb-3">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-gray-300 dark:bg-gray-700 rounded mr-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-2/3"></div>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-gray-300 dark:bg-gray-700 rounded mr-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-gray-300 dark:bg-gray-700 rounded mr-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-5/6"></div>
            </div>
          </div>

          {/* Action buttons skeleton */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="h-9 w-24 bg-gray-300 dark:bg-gray-700 rounded-lg"></div>
            <div className="h-9 w-20 bg-gray-300 dark:bg-gray-700 rounded-lg"></div>
          </div>
        </div>
      ))}
    </>
  );
}
