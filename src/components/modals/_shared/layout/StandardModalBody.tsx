/**
 * StandardModalBody Component
 * 
 * Scrollable content area with loading, error, and empty states
 */

'use client';

import React from 'react';
import { StandardModalBodyProps } from '../types';
import { MODAL_SPACING } from '../utils/modalConstants';

/**
 * Standard Modal Body
 * 
 * Provides:
 * - Scrollable content area
 * - Optional padding control
 * - Loading state
 * - Error state
 * - Empty state
 */
export const StandardModalBody: React.FC<StandardModalBodyProps> = ({
  children,
  noPadding = false,
  scrollable = true,
  className = '',
  loading = false,
  error = null,
  isEmpty = false,
  loadingComponent,
  errorComponent,
  emptyComponent,
}) => {
  const padding = noPadding ? '0' : MODAL_SPACING.bodyPadding;

  // Loading state
  if (loading) {
    return (
      <div className="flex-1 flex flex-col bg-white/20 dark:bg-gray-900/20 min-h-0 overflow-hidden">
        <div className="flex-1 flex items-center justify-center" style={{ padding }}>
          {loadingComponent || (
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p
                className="text-sm text-gray-600 dark:text-gray-400"
                style={{
                  fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
                }}
              >
                Loading...
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex-1 flex flex-col bg-white/20 dark:bg-gray-900/20 min-h-0 overflow-hidden">
        <div className="flex-1 flex items-center justify-center" style={{ padding }}>
          {errorComponent || (
            <div className="flex flex-col items-center gap-3 text-center max-w-md">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-red-600 dark:text-red-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <h3
                  className="text-lg font-semibold text-gray-900 dark:text-white mb-2"
                  style={{
                    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
                  }}
                >
                  Error
                </h3>
                <p
                  className="text-sm text-gray-600 dark:text-gray-400"
                  style={{
                    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
                  }}
                >
                  {error}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Empty state
  if (isEmpty) {
    return (
      <div className="flex-1 flex flex-col bg-white/20 dark:bg-gray-900/20 min-h-0 overflow-hidden">
        <div className="flex-1 flex items-center justify-center" style={{ padding }}>
          {emptyComponent || (
            <div className="flex flex-col items-center gap-3 text-center max-w-md">
              <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-gray-400 dark:text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
              </div>
              <div>
                <h3
                  className="text-lg font-semibold text-gray-900 dark:text-white mb-2"
                  style={{
                    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
                  }}
                >
                  No Data
                </h3>
                <p
                  className="text-sm text-gray-600 dark:text-gray-400"
                  style={{
                    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
                  }}
                >
                  There is nothing to display.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Normal content
  return (
    <div className="flex-1 flex flex-col bg-white/20 dark:bg-gray-900/20 min-h-0 overflow-hidden">
      <div
        className={`flex-1 ${scrollable ? 'overflow-y-auto' : ''} ${className}`}
        style={{ padding }}
      >
        {children}
      </div>
    </div>
  );
};
