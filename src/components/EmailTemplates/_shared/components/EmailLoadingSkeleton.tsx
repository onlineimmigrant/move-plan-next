/**
 * Email Template Loading Skeleton Component
 * Animated loading placeholder for email template cards
 */

import React from 'react';

interface EmailLoadingSkeletonProps {
  count?: number;
}

export const EmailLoadingSkeleton: React.FC<EmailLoadingSkeletonProps> = ({ count = 3 }) => {
  return (
    <div className="space-y-2 sm:space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 animate-pulse"
        >
          {/* Header */}
          <div className="flex items-start gap-4 mb-4">
            {/* Icon skeleton */}
            <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl bg-gray-200 flex-shrink-0" />

            {/* Subject and badges skeleton */}
            <div className="flex-1 min-w-0">
              <div className="h-5 bg-gray-200 rounded w-2/3 mb-2" />
              <div className="flex gap-2">
                <div className="h-6 w-20 bg-gray-200 rounded-full" />
                <div className="h-6 w-24 bg-gray-200 rounded-full" />
              </div>
            </div>

            {/* Action buttons skeleton */}
            <div className="flex gap-2">
              <div className="h-9 w-9 rounded-lg bg-gray-200" />
              <div className="h-9 w-9 rounded-lg bg-gray-200" />
              <div className="h-9 w-9 rounded-lg bg-gray-200" />
            </div>
          </div>

          {/* Body preview skeleton */}
          <div className="space-y-2 mb-4">
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-4/5" />
          </div>

          {/* Footer skeleton */}
          <div className="flex items-center gap-4 pt-3 border-t border-gray-100">
            <div className="h-4 bg-gray-200 rounded w-32" />
            <div className="h-4 bg-gray-200 rounded w-24" />
          </div>
        </div>
      ))}
    </div>
  );
};
