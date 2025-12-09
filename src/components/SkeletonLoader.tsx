// /components/SkeletonLoader.tsx
'use client';

import { FC } from 'react';

const SkeletonLoader: FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 px-4 sm:px-6 lg:px-8">
      {/* Header Section Skeleton */}
      <div className="w-full max-w-7xl mx-auto py-8">
        <div className="h-12 w-3/4 bg-gray-200 rounded animate-pulse"></div>
        <div className="mt-4 h-6 w-1/2 bg-gray-200 rounded animate-pulse"></div>
      </div>

      {/* Breadcrumbs Skeleton */}
      <div className="w-full max-w-7xl mx-auto py-4">
        <div className="flex space-x-2">
          <div className="h-5 w-20 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-5 w-20 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-5 w-20 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>

      {/* Content Sections Skeleton */}
      <div className="w-full max-w-7xl mx-auto py-8 space-y-8">
        {/* Section 1 */}
        <div className="h-64 w-full bg-gray-200 rounded-lg animate-pulse"></div>
        {/* Section 2 */}
        <div className="h-64 w-full bg-gray-200 rounded-lg animate-pulse"></div>
        {/* Section 3 */}
        <div className="h-64 w-full bg-gray-200 rounded-lg animate-pulse"></div>
      </div>

      {/* Banner Container Skeleton */}
      <div className="w-full max-w-7xl mx-auto py-8">
        <div className="h-32 w-full bg-gray-200 rounded-lg animate-pulse"></div>
      </div>
    </div>
  );
};

export default SkeletonLoader;