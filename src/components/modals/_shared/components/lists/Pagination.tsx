/**
 * Pagination Component
 * 
 * Page navigation controls
 */

'use client';

import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

export interface PaginationProps {
  /** Current page (1-indexed) */
  currentPage: number;
  
  /** Total number of pages */
  totalPages: number;
  
  /** Page change handler */
  onPageChange: (page: number) => void;
  
  /** Items per page */
  pageSize?: number;
  
  /** Total items */
  totalItems?: number;
  
  /** Show page size selector */
  showPageSize?: boolean;
  
  /** Page size options */
  pageSizeOptions?: number[];
  
  /** Page size change handler */
  onPageSizeChange?: (size: number) => void;
  
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  
  /** Custom className */
  className?: string;
}

const sizeStyles = {
  sm: 'h-8 px-2 text-xs',
  md: 'h-9 px-3 text-sm',
  lg: 'h-10 px-4 text-base',
};

/**
 * Pagination Component
 * 
 * Navigation controls for paginated data
 */
export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  pageSize = 10,
  totalItems,
  showPageSize = false,
  pageSizeOptions = [10, 25, 50, 100],
  onPageSizeChange,
  size = 'md',
  className = '',
}) => {
  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 7;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      if (currentPage > 3) {
        pages.push('...');
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push('...');
      }

      pages.push(totalPages);
    }

    return pages;
  };

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems || 0);

  return (
    <div className={`flex items-center justify-between gap-4 ${className}`}>
      {/* Info */}
      {totalItems && (
        <div
          className="text-sm text-gray-600 dark:text-gray-400"
          style={{
            fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
          }}
        >
          Showing {startItem} to {endItem} of {totalItems} results
        </div>
      )}

      {/* Page Numbers */}
      <div className="flex items-center gap-1">
        {/* Previous */}
        <button
          onClick={() => canGoPrevious && onPageChange(currentPage - 1)}
          disabled={!canGoPrevious}
          className={`
            ${sizeStyles[size]}
            flex items-center gap-1
            rounded-lg
            bg-white dark:bg-gray-800
            border border-gray-300 dark:border-gray-600
            hover:bg-gray-50 dark:hover:bg-gray-700
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors
          `.trim()}
          style={{
            fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
          }}
        >
          <ChevronLeftIcon className="w-4 h-4" />
          <span>Previous</span>
        </button>

        {/* Page Buttons */}
        {getPageNumbers().map((page, index) =>
          page === '...' ? (
            <span
              key={`ellipsis-${index}`}
              className="px-2 text-gray-400"
              style={{
                fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
              }}
            >
              ...
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page as number)}
              className={`
                ${sizeStyles[size]}
                min-w-[2.5rem]
                rounded-lg
                transition-colors
                ${
                  currentPage === page
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                }
              `.trim()}
              style={{
                fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
              }}
            >
              {page}
            </button>
          )
        )}

        {/* Next */}
        <button
          onClick={() => canGoNext && onPageChange(currentPage + 1)}
          disabled={!canGoNext}
          className={`
            ${sizeStyles[size]}
            flex items-center gap-1
            rounded-lg
            bg-white dark:bg-gray-800
            border border-gray-300 dark:border-gray-600
            hover:bg-gray-50 dark:hover:bg-gray-700
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors
          `.trim()}
          style={{
            fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
          }}
        >
          <span>Next</span>
          <ChevronRightIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Page Size Selector */}
      {showPageSize && onPageSizeChange && (
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className={`
            ${sizeStyles[size]}
            rounded-lg
            bg-white dark:bg-gray-800
            border border-gray-300 dark:border-gray-600
            text-gray-900 dark:text-white
            focus:outline-none focus:ring-2 focus:ring-blue-500
            transition-all
          `.trim()}
          style={{
            fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
          }}
        >
          {pageSizeOptions.map((option) => (
            <option key={option} value={option}>
              {option} per page
            </option>
          ))}
        </select>
      )}
    </div>
  );
};
