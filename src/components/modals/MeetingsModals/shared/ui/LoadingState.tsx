import React from 'react';
import { MEETINGS_THEME } from '../theme';
import { useThemeColors } from '@/hooks/useThemeColors';

interface LoadingStateProps {
  message?: string;
  progress?: number; // 0-100
  size?: 'sm' | 'md' | 'lg';
  showProgress?: boolean;
  className?: string;
}

/**
 * Base Skeleton Component
 * Animated loading placeholder
 */
const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div 
    className={`bg-gray-200 rounded ${className}`}
    style={{ 
      backgroundImage: 'linear-gradient(90deg, rgba(229, 231, 235, 0) 0%, rgba(229, 231, 235, 0.5) 50%, rgba(229, 231, 235, 0) 100%)',
      backgroundSize: '200px 100%',
      backgroundRepeat: 'no-repeat',
      animation: 'shimmer 1.5s ease-in-out infinite',
    }} 
  />
);

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
  const themeColors = useThemeColors();
  const primary = themeColors.cssVars.primary;

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
          className={`animate-spin rounded-full border-4 border-gray-200 ${classes.spinner}`}
          style={{ borderTopColor: primary.base }}
        />

        {/* Progress ring overlay */}
        {showProgress && progress !== undefined && (
          <div
            className={`absolute inset-0 rounded-full border-4 border-transparent ${classes.spinner}`}
            style={{
              background: `conic-gradient(${primary.base} ${progress}%, transparent ${progress}%)`,
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

// Specialized skeleton loading states for common scenarios

/**
 * Calendar Skeleton Loader
 * Shows the structure of a calendar while loading
 */
export const CalendarLoading: React.FC<{ message?: string }> = () => {
  const themeColors = useThemeColors();
  const primary = themeColors.cssVars.primary;
  
  return (
    <div className="min-h-[400px] p-6 space-y-4">
      {/* Calendar header skeleton */}
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-10 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-10 w-10" />
        </div>
      </div>
      
      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
      
      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 35 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
      
      {/* Loading indicator */}
      <div className="flex items-center justify-center gap-2 mt-6 text-gray-500 text-sm">
        <div 
          className="h-4 w-4 rounded-full animate-pulse"
          style={{ backgroundColor: primary.base }}
        />
        <span>Loading available dates...</span>
      </div>
    </div>
  );
};

/**
 * Form Skeleton Loader
 * Shows the structure of a form while loading
 */
export const FormLoading: React.FC<{ message?: string }> = () => (
  <div className="min-h-[200px] p-6 space-y-6">
    {/* Form fields */}
    <div className="space-y-4">
      <div>
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div>
        <Skeleton className="h-4 w-32 mb-2" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div>
        <Skeleton className="h-4 w-28 mb-2" />
        <Skeleton className="h-24 w-full" />
      </div>
    </div>
    
    {/* Button */}
    <div className="flex justify-end gap-3">
      <Skeleton className="h-10 w-24" />
      <Skeleton className="h-10 w-32" />
    </div>
  </div>
);

/**
 * Customer Data Skeleton Loader
 * Shows the structure of customer information being loaded
 */
export const CustomerDataLoading: React.FC = () => {
  const themeColors = useThemeColors();
  const primary = themeColors.cssVars.primary;
  
  return (
    <div className="min-h-[200px] p-6 space-y-6">
      {/* Profile info */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-16 w-16 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
      
      {/* Details sections */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
      
      {/* Loading indicator */}
      <div className="flex items-center justify-center gap-2 mt-4 text-gray-500 text-sm">
        <div 
          className="h-4 w-4 rounded-full animate-pulse"
          style={{ backgroundColor: primary.base }}
        />
        <span>Loading your information...</span>
      </div>
    </div>
  );
};

/**
 * Booking Submission Skeleton Loader
 * Shows confirmation card being created
 */
export const BookingSubmissionLoading: React.FC<{ progress?: number }> = ({ progress }) => {
  const themeColors = useThemeColors();
  const primary = themeColors.cssVars.primary;
  
  return (
    <div className="min-h-[300px] p-6 space-y-6">
      {/* Gradient header skeleton */}
      <div 
        className="h-32 rounded-t-xl animate-pulse"
        style={{
          background: `linear-gradient(135deg, ${primary.base}, rgb(147, 51, 234))`,
          opacity: 0.6,
        }}
      />
      
      {/* Content skeleton */}
      <div className="space-y-4 -mt-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
        
        <div className="space-y-3 pt-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-5 w-full" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-5 w-full" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-5 w-full" />
          </div>
        </div>
        
        <Skeleton className="h-10 w-full mt-6" />
      </div>
      
      {/* Progress indicator */}
      <div className="flex flex-col items-center gap-3 mt-6">
        <div className="flex items-center gap-2 text-gray-600 text-sm font-medium">
          <div 
            className="h-4 w-4 rounded-full animate-pulse"
            style={{ backgroundColor: primary.base }}
          />
          <span>Creating your booking...</span>
        </div>
        
        {progress !== undefined && (
          <div className="w-full max-w-xs">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full transition-all duration-300 rounded-full"
                style={{ 
                  width: `${progress}%`,
                  background: `linear-gradient(135deg, ${primary.base}, rgb(147, 51, 234))`
                }}
              />
            </div>
            <p className="text-xs text-gray-500 text-center mt-2">{progress}%</p>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Time Slots Skeleton Loader
 * Shows the structure of time slot selection while loading
 */
export const TimeSlotsLoading: React.FC = () => {
  const themeColors = useThemeColors();
  const primary = themeColors.cssVars.primary;
  
  return (
    <div className="space-y-4 py-3">
      {/* Render skeletons for each time of day */}
      {['☀️ Morning', '🌤️ Afternoon', '🌙 Evening'].map((label, sectionIndex) => (
        <div key={sectionIndex} className="p-3 sm:p-4">
          {/* Section header skeleton */}
          <div className="flex items-center gap-2 mb-3">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-4 w-20" />
          </div>
          
          {/* Time slots grid skeleton with stagger animation */}
          <div className="grid grid-cols-3 xs:grid-cols-4 sm:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2 sm:gap-2.5 md:gap-3">
            {Array.from({ length: sectionIndex === 0 ? 6 : sectionIndex === 1 ? 8 : 4 }).map((_, i) => (
              <Skeleton 
                key={i} 
                className="h-[44px] sm:h-[40px] w-full rounded-lg" 
              />
            ))}
          </div>
        </div>
      ))}
      
      {/* Loading indicator */}
      <div className="flex items-center justify-center gap-2 mt-4 text-gray-500 text-sm">
        <div 
          className="h-4 w-4 rounded-full animate-pulse"
          style={{ backgroundColor: primary.base }}
        />
        <span>Loading available times...</span>
      </div>
    </div>
  );
};