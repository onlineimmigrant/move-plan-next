import React from 'react';

interface ErrorDisplayProps {
  error: string;
  onRetry: () => void;
}

/**
 * ErrorDisplay shows an error message with a retry button.
 * Used when comparison data fails to load.
 */
export const ErrorDisplay = React.memo<ErrorDisplayProps>(({ error, onRetry }) => {
  return (
    <div className="p-8 text-center" role="alert" aria-live="polite">
      <p className="text-red-600 font-semibold">Error loading comparison data</p>
      <p className="text-gray-600 mt-2">{error}</p>
      <button
        onClick={onRetry}
        className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        aria-label="Retry loading comparison data"
      >
        Retry
      </button>
    </div>
  );
});

ErrorDisplay.displayName = 'ErrorDisplay';
