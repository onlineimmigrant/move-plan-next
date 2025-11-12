/**
 * LoadingState Component
 * 
 * Loading indicator for modal content
 */

'use client';

import React from 'react';

export interface LoadingStateProps {
  /** Loading message */
  message?: string;
  
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  
  /** Custom className */
  className?: string;
  
  /** Show as inline (horizontal layout) */
  inline?: boolean;
}

const sizeStyles = {
  sm: {
    spinner: 'w-6 h-6 border-2',
    text: 'text-sm',
  },
  md: {
    spinner: 'w-8 h-8 border-4',
    text: 'text-base',
  },
  lg: {
    spinner: 'w-12 h-12 border-4',
    text: 'text-lg',
  },
};

/**
 * Loading State Component
 * 
 * Displays a spinner with optional message
 */
export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
  size = 'md',
  className = '',
  inline = false,
}) => {
  const styles = sizeStyles[size];

  return (
    <div
      className={`
        flex items-center gap-3
        ${inline ? 'flex-row' : 'flex-col'}
        ${className}
      `.trim()}
    >
      <div
        className={`
          ${styles.spinner}
          border-blue-500 border-t-transparent
          rounded-full animate-spin
        `.trim()}
        role="status"
        aria-label="Loading"
      />
      {message && (
        <p
          className={`${styles.text} text-gray-600 dark:text-gray-400`}
          style={{
            fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
          }}
        >
          {message}
        </p>
      )}
    </div>
  );
};
