import React from 'react';

/**
 * Skeleton Loading Component for Post Page
 * Matches the structure of the actual post page for smooth loading experience
 */
export const PostPageSkeleton: React.FC = () => {
  return (
    <div className="px-4 sm:pt-4 sm:pb-16 bg-white animate-pulse">
      <div className="grid lg:grid-cols-8 gap-x-4">
        {/* Left Sidebar - TOC Skeleton */}
        <aside className="hidden lg:block lg:col-span-2 space-y-8 pb-8 sm:px-4">
          <div className="mt-16 sticky top-32 pr-4 lg:border-r lg:border-gray-100">
            {/* TOC Title */}
            <div className="h-4 w-32 bg-gray-200 rounded mb-4"></div>
            
            {/* TOC Items */}
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => (
                <div key={i}>
                  <div className="h-8 bg-gray-200 rounded-lg" style={{ width: `${80 - i * 5}%` }}></div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content Skeleton */}
        <section className="py-16 lg:col-span-4">
          {/* Subsection */}
          <div className="h-3 w-24 bg-gray-200 rounded mb-2"></div>
          
          {/* Title */}
          <div className="h-10 w-3/4 bg-gray-200 rounded mb-4"></div>
          
          {/* Meta info */}
          <div className="flex gap-4 mb-6">
            <div className="h-4 w-24 bg-gray-200 rounded"></div>
            <div className="h-4 w-32 bg-gray-200 rounded"></div>
          </div>
          
          {/* Description */}
          <div className="space-y-3 mb-12">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>

          {/* Content paragraphs */}
          <div className="space-y-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-3">
                {/* Heading */}
                {i > 0 && <div className="h-7 w-2/3 bg-gray-200 rounded mt-8 mb-4"></div>}
                
                {/* Paragraph lines */}
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-4/5"></div>
              </div>
            ))}
          </div>
        </section>

        {/* Right Sidebar Skeleton */}
        <aside className="hidden lg:block lg:col-span-2"></aside>
      </div>
    </div>
  );
};

/**
 * Compact Skeleton for Small Loading States
 */
export const CompactSkeleton: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="animate-pulse space-y-4 w-full max-w-lg px-4">
        <div className="h-8 w-3/4 bg-gray-200 rounded mx-auto"></div>
        <div className="h-4 w-1/2 bg-gray-200 rounded mx-auto"></div>
        <div className="space-y-3 mt-8">
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6 mx-auto"></div>
          <div className="h-4 bg-gray-200 rounded w-4/5 mx-auto"></div>
        </div>
      </div>
    </div>
  );
};
