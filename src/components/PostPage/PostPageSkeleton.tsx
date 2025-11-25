import React from 'react';

/**
 * Post type variants for skeleton loading states
 */
type SkeletonVariant = 'default' | 'minimal' | 'landing' | 'doc_set';

interface PostPageSkeletonProps {
  /**
   * Skeleton variant matching post type
   * @default 'default'
   */
  variant?: SkeletonVariant;
}

/**
 * Skeleton Loading Component for Post Page
 * 
 * Provides loading state placeholders that match the structure of actual post layouts.
 * Supports multiple variants for different post types (default, minimal, landing, doc_set).
 * 
 * @component
 * @param {PostPageSkeletonProps} props - Component props
 * @param {SkeletonVariant} props.variant - Post type variant (default, minimal, landing, doc_set)
 * 
 * @example
 * // Default skeleton with TOC and full layout
 * <PostPageSkeleton />
 * 
 * @example
 * // Minimal skeleton without TOC
 * <PostPageSkeleton variant="minimal" />
 * 
 * @example
 * // Landing page skeleton
 * <PostPageSkeleton variant="landing" />
 * 
 * @performance Memoized to prevent unnecessary re-renders during loading states
 */
const PostPageSkeletonComponent: React.FC<PostPageSkeletonProps> = ({ variant = 'default' }) => {
  // Minimal variant - no TOC, simplified layout
  if (variant === 'minimal') {
    return (
      <div className="px-4 sm:pt-4 sm:pb-16 bg-white animate-pulse">
        <div className="max-w-4xl mx-auto">
          {/* Title */}
          <div className="h-10 w-3/4 bg-gray-200 rounded mb-4"></div>
          
          {/* Description */}
          <div className="space-y-3 mb-12">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>

          {/* Content */}
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-4/5"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Landing variant - full-width hero-style layout
  if (variant === 'landing') {
    return (
      <div className="bg-white animate-pulse">
        {/* Hero Section */}
        <div className="w-full h-96 bg-gray-200 mb-8"></div>
        
        {/* Content Sections */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="space-y-16">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-4">
                <div className="h-8 w-2/3 bg-gray-200 rounded"></div>
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-4/5"></div>
                  </div>
                  <div className="h-48 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Doc set variant - emphasizes navigation structure
  if (variant === 'doc_set') {
    return (
      <div className="px-4 sm:pt-4 sm:pb-16 bg-white animate-pulse">
        <div className="grid lg:grid-cols-8 gap-x-4">
          {/* Left Sidebar - Doc Set Navigation */}
          <aside className="hidden lg:block lg:col-span-2 space-y-8 pb-8 sm:px-4">
            <div className="mt-16 sticky top-32 pr-4 lg:border-r lg:border-gray-100">
              {/* Search bar */}
              <div className="h-10 w-full bg-gray-200 rounded-lg mb-6"></div>
              
              {/* Doc Set Items */}
              <div className="space-y-2">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="space-y-1">
                    <div className="h-8 bg-gray-200 rounded-lg" style={{ width: `${85 - i * 3}%`, marginLeft: i % 3 === 0 ? '0' : '1rem' }}></div>
                    {i % 3 === 0 && (
                      <div className="h-6 bg-gray-200 rounded ml-4" style={{ width: '70%' }}></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <section className="py-16 lg:col-span-4">
            <div className="h-3 w-24 bg-gray-200 rounded mb-2"></div>
            <div className="h-10 w-3/4 bg-gray-200 rounded mb-4"></div>
            
            <div className="space-y-6 mt-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-3">
                  {i > 0 && <div className="h-7 w-2/3 bg-gray-200 rounded mt-8 mb-4"></div>}
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-4/5"></div>
                </div>
              ))}
            </div>

            {/* Prev/Next Navigation */}
            <div className="flex justify-between mt-12">
              <div className="h-10 w-32 bg-gray-200 rounded"></div>
              <div className="h-10 w-32 bg-gray-200 rounded"></div>
            </div>
          </section>

          {/* Right Sidebar */}
          <aside className="hidden lg:block lg:col-span-2"></aside>
        </div>
      </div>
    );
  }

  // Default variant - full layout with TOC
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

PostPageSkeletonComponent.displayName = 'PostPageSkeleton';

export const PostPageSkeleton = React.memo(PostPageSkeletonComponent);

/**
 * Compact Skeleton for Small Loading States
 * 
 * Minimal loading indicator for inline or embedded contexts.
 * Centers content and displays simplified placeholder.
 * 
 * @component
 * @example
 * <CompactSkeleton />
 * 
 * @performance Lightweight alternative to full PostPageSkeleton
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
