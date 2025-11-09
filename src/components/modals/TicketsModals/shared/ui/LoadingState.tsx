/**
 * Loading State Component
 * 
 * Displays skeleton loaders with glass morphism styling
 * for various loading scenarios in the tickets module.
 */

import React from 'react';

interface LoadingStateProps {
  variant?: 'list' | 'detail' | 'compact';
  count?: number;
  className?: string;
}

/**
 * Skeleton loader for ticket list items
 */
const TicketListSkeleton: React.FC<{ count: number }> = ({ count }) => (
  <>
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        className="p-4 bg-white/40 dark:bg-gray-800/40 backdrop-blur-md rounded-xl border border-white/20 dark:border-gray-700/20 animate-pulse"
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200/80 dark:bg-gray-700/80 rounded w-3/4" />
            <div className="h-3 bg-gray-200/60 dark:bg-gray-700/60 rounded w-1/2" />
          </div>
          <div className="h-6 w-20 bg-gray-200/80 dark:bg-gray-700/80 rounded-full ml-4" />
        </div>

        {/* Content */}
        <div className="space-y-2 mb-3">
          <div className="h-3 bg-gray-200/60 dark:bg-gray-700/60 rounded w-full" />
          <div className="h-3 bg-gray-200/60 dark:bg-gray-700/60 rounded w-5/6" />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-3 w-16 bg-gray-200/60 dark:bg-gray-700/60 rounded" />
            <div className="h-3 w-20 bg-gray-200/60 dark:bg-gray-700/60 rounded" />
          </div>
          <div className="h-3 w-24 bg-gray-200/60 dark:bg-gray-700/60 rounded" />
        </div>
      </div>
    ))}
  </>
);

/**
 * Skeleton loader for ticket detail view
 */
const TicketDetailSkeleton: React.FC = () => (
  <div className="flex-1 flex flex-col">
    {/* Header */}
    <div className="p-4 border-b border-gray-200/50 dark:border-gray-700/50 bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm">
      <div className="animate-pulse space-y-3">
        <div className="h-6 bg-gray-200/80 dark:bg-gray-700/80 rounded w-2/3" />
        <div className="flex items-center gap-3">
          <div className="h-6 w-24 bg-gray-200/80 dark:bg-gray-700/80 rounded-full" />
          <div className="h-6 w-20 bg-gray-200/80 dark:bg-gray-700/80 rounded-full" />
          <div className="h-6 w-28 bg-gray-200/80 dark:bg-gray-700/80 rounded-full" />
        </div>
      </div>
    </div>

    {/* Messages */}
    <div className="flex-1 p-4 space-y-4 overflow-y-auto">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'} animate-pulse`}
        >
          <div className={`max-w-[80%] ${i % 2 === 0 ? 'bg-white/40 dark:bg-gray-800/40' : 'bg-blue-500/20 dark:bg-blue-600/20'} backdrop-blur-sm rounded-2xl p-3 space-y-2`}>
            <div className="h-3 bg-gray-200/80 dark:bg-gray-700/80 rounded w-48" />
            <div className="h-3 bg-gray-200/60 dark:bg-gray-700/60 rounded w-36" />
            <div className="h-2 bg-gray-200/40 dark:bg-gray-700/40 rounded w-20 mt-2" />
          </div>
        </div>
      ))}
    </div>

    {/* Input Area */}
    <div className="p-4 border-t border-gray-200/50 dark:border-gray-700/50 bg-white/30 dark:bg-gray-800/30">
      <div className="animate-pulse">
        <div className="h-20 bg-gray-200/60 dark:bg-gray-700/60 rounded-xl mb-3" />
        <div className="flex justify-end gap-2">
          <div className="h-10 w-24 bg-gray-200/80 dark:bg-gray-700/80 rounded-lg" />
          <div className="h-10 w-28 bg-gray-200/80 dark:bg-gray-700/80 rounded-lg" />
        </div>
      </div>
    </div>
  </div>
);

/**
 * Compact skeleton loader for inline loading states
 */
const CompactSkeleton: React.FC<{ count: number }> = ({ count }) => (
  <div className="space-y-2">
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        className="h-12 bg-white/40 dark:bg-gray-800/40 backdrop-blur-md rounded-lg border border-white/20 dark:border-gray-700/20 animate-pulse"
      />
    ))}
  </div>
);

/**
 * LoadingState Component
 * 
 * Displays skeleton loaders with glass morphism styling.
 * 
 * @example
 * ```tsx
 * {isLoading && <LoadingState variant="list" count={5} />}
 * {isLoadingDetail && <LoadingState variant="detail" />}
 * ```
 */
export const LoadingState: React.FC<LoadingStateProps> = ({
  variant = 'list',
  count = 3,
  className = '',
}) => {
  const renderSkeleton = () => {
    switch (variant) {
      case 'list':
        return <TicketListSkeleton count={count} />;
      case 'detail':
        return <TicketDetailSkeleton />;
      case 'compact':
        return <CompactSkeleton count={count} />;
      default:
        return <TicketListSkeleton count={count} />;
    }
  };

  return <div className={className}>{renderSkeleton()}</div>;
};

/**
 * Inline spinner component for button loading states
 */
export const Spinner: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <svg
      className={`animate-spin ${sizeClasses[size]} ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
};

export default LoadingState;
