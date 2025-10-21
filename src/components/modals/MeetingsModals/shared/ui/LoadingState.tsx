import React from 'react';
import { MEETINGS_THEME } from '../theme';

interface LoadingStateProps {
  message?: string;
  progress?: number; // 0-100
  size?: 'sm' | 'md' | 'lg';
  showProgress?: boolean;
  className?: string;
}

/**
 * Enhanced Loading State Component
 * Provides contextual loading feedback with optional progress indicator
 */
export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
  progress,
  size = 'md',
  showProgress = false,
  className = '',
}) => {
  const sizeClasses = {
    sm: {
      container: 'h-32',
      spinner: 'h-6 w-6',
      text: 'text-sm',
    },
    md: {
      container: 'h-40',
      spinner: 'h-8 w-8',
      text: 'text-base',
    },
    lg: {
      container: 'h-64',
      spinner: 'h-12 w-12',
      text: 'text-lg',
    },
  };

  const classes = sizeClasses[size];

  return (
    <div className={`flex flex-col items-center justify-center ${classes.container} ${className}`}>
      <div className="relative">
        {/* Main spinner */}
        <div
          className={`animate-spin rounded-full border-4 border-gray-200 border-t-blue-500 ${classes.spinner}`}
          style={{ borderTopColor: MEETINGS_THEME.colors.primary[500] }}
        />

        {/* Progress ring overlay */}
        {showProgress && progress !== undefined && (
          <div
            className={`absolute inset-0 rounded-full border-4 border-transparent ${classes.spinner}`}
            style={{
              background: `conic-gradient(${MEETINGS_THEME.colors.primary[500]} ${progress}%, transparent ${progress}%)`,
              mask: 'radial-gradient(farthest-side, transparent calc(100% - 4px), black calc(100% - 4px))',
              WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 4px), black calc(100% - 4px))',
            }}
          />
        )}
      </div>

      {/* Loading message */}
      <div className="mt-4 text-center">
        <p className={`${classes.text} text-gray-600 font-medium`}>
          {message}
        </p>

        {/* Progress text */}
        {showProgress && progress !== undefined && (
          <p className="text-sm text-gray-500 mt-1">
            {progress}%
          </p>
        )}
      </div>
    </div>
  );
};

// Specialized loading states for common scenarios
export const CalendarLoading: React.FC<{ message?: string }> = ({
  message = 'Loading calendar...'
}) => (
  <LoadingState
    message={message}
    size="lg"
    className="min-h-[400px]"
  />
);

export const FormLoading: React.FC<{ message?: string }> = ({
  message = 'Loading form...'
}) => (
  <LoadingState
    message={message}
    size="md"
    className="min-h-[200px]"
  />
);

export const CustomerDataLoading: React.FC = () => (
  <LoadingState
    message="Loading your information..."
    size="md"
    className="min-h-[200px]"
  />
);

export const BookingSubmissionLoading: React.FC<{ progress?: number }> = ({
  progress
}) => (
  <LoadingState
    message="Creating your booking..."
    progress={progress}
    showProgress={!!progress}
    size="md"
  />
);