/**
 * AI Loading Skeleton Component
 * Animated loading placeholder for AI model cards
 */

import React from 'react';
import { AILoadingSkeletonProps } from '../types';

export const AILoadingSkeleton: React.FC<AILoadingSkeletonProps> = ({
  count = 3,
  context = 'admin'
}) => {
  return (
    <div className="space-y-2 sm:space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6 animate-pulse"
        >
          {/* Header with avatar and title */}
          <div className="flex items-start gap-4 mb-4">
            {/* Avatar skeleton */}
            <div className="h-12 w-12 rounded-full bg-gray-200 flex-shrink-0" />
            
            {/* Title and subtitle skeleton */}
            <div className="flex-1 min-w-0">
              <div className="h-5 bg-gray-200 rounded w-1/3 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
            
            {/* Action buttons skeleton */}
            <div className="flex gap-2">
              <div className="h-9 w-9 rounded-lg bg-gray-200" />
              <div className="h-9 w-9 rounded-lg bg-gray-200" />
              <div className="h-9 w-9 rounded-lg bg-gray-200" />
            </div>
          </div>
          
          {/* Description skeleton */}
          <div className="space-y-2 mb-4">
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-5/6" />
            <div className="h-4 bg-gray-200 rounded w-4/6" />
          </div>
          
          {/* Tags skeleton */}
          <div className="flex gap-2 flex-wrap mb-4">
            <div className="h-7 w-16 bg-gray-200 rounded-full" />
            <div className="h-7 w-20 bg-gray-200 rounded-full" />
            <div className="h-7 w-14 bg-gray-200 rounded-full" />
          </div>
          
          {/* Footer with model info skeleton */}
          <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
            <div className="h-4 bg-gray-200 rounded w-24" />
            <div className="h-4 bg-gray-200 rounded w-32" />
            <div className="h-4 bg-gray-200 rounded w-20" />
          </div>
        </div>
      ))}
    </div>
  );
};