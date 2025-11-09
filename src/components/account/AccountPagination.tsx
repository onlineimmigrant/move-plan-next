import React from 'react';
import { useThemeColors } from '@/hooks/useThemeColors';

interface PaginationProps {
  currentPage: number;
  totalCount: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

/**
 * Reusable pagination component for account pages
 * Handles page navigation with dynamic theme colors and keyboard navigation
 */
export function AccountPagination({
  currentPage,
  totalCount,
  itemsPerPage,
  onPageChange,
  isLoading = false,
}: PaginationProps) {
  const { cssVars } = useThemeColors();
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  if (totalPages <= 1) return null;

  const handleKeyDown = (e: React.KeyboardEvent, page: number) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onPageChange(page);
    }
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const showEllipsis = totalPages > 7;

    if (!showEllipsis) {
      // Show all pages if 7 or fewer
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show first, last, current, and surrounding pages
      pages.push(1);

      if (currentPage > 3) {
        pages.push('...');
      }

      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push('...');
      }

      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div 
      className="flex items-center justify-between px-4 py-3 sm:px-6 border-t border-gray-200 dark:border-gray-700"
      role="navigation"
      aria-label="Pagination Navigation"
    >
      {/* Mobile view */}
      <div className="flex flex-1 justify-between sm:hidden">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          onKeyDown={(e) => handleKeyDown(e, currentPage - 1)}
          disabled={currentPage === 1 || isLoading}
          className="relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          style={{
            backgroundColor: currentPage === 1 ? 'transparent' : `${cssVars.primary.lighter}40`,
            color: currentPage === 1 ? '#9ca3af' : cssVars.primary.base,
          }}
          aria-label="Go to previous page"
        >
          Previous
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          onKeyDown={(e) => handleKeyDown(e, currentPage + 1)}
          disabled={currentPage === totalPages || isLoading}
          className="relative ml-3 inline-flex items-center px-4 py-2 text-sm font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          style={{
            backgroundColor: currentPage === totalPages ? 'transparent' : `${cssVars.primary.lighter}40`,
            color: currentPage === totalPages ? '#9ca3af' : cssVars.primary.base,
          }}
          aria-label="Go to next page"
        >
          Next
        </button>
      </div>

      {/* Desktop view */}
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Showing{' '}
            <span className="font-medium">{Math.min((currentPage - 1) * itemsPerPage + 1, totalCount)}</span>
            {' '}-{' '}
            <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalCount)}</span>
            {' '}of{' '}
            <span className="font-medium">{totalCount}</span>
            {' '}results
          </p>
        </div>
        <div>
          <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
            {/* Previous button */}
            <button
              onClick={() => onPageChange(currentPage - 1)}
              onKeyDown={(e) => handleKeyDown(e, currentPage - 1)}
              disabled={currentPage === 1 || isLoading}
              className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 focus:z-20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Go to previous page"
            >
              <span className="sr-only">Previous</span>
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
              </svg>
            </button>

            {/* Page numbers */}
            {getPageNumbers().map((page, idx) => {
              if (page === '...') {
                return (
                  <span
                    key={`ellipsis-${idx}`}
                    className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 ring-1 ring-inset ring-gray-300 dark:ring-gray-600"
                  >
                    ...
                  </span>
                );
              }

              const pageNumber = page as number;
              const isActive = pageNumber === currentPage;

              return (
                <button
                  key={pageNumber}
                  onClick={() => onPageChange(pageNumber)}
                  onKeyDown={(e) => handleKeyDown(e, pageNumber)}
                  disabled={isLoading}
                  className="relative inline-flex items-center px-4 py-2 text-sm font-semibold ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 focus:z-20 disabled:cursor-not-allowed transition-colors"
                  style={{
                    backgroundColor: isActive ? cssVars.primary.base : 'transparent',
                    color: isActive ? 'white' : undefined,
                  }}
                  aria-current={isActive ? 'page' : undefined}
                  aria-label={`Go to page ${pageNumber}`}
                >
                  {pageNumber}
                </button>
              );
            })}

            {/* Next button */}
            <button
              onClick={() => onPageChange(currentPage + 1)}
              onKeyDown={(e) => handleKeyDown(e, currentPage + 1)}
              disabled={currentPage === totalPages || isLoading}
              className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 focus:z-20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Go to next page"
            >
              <span className="sr-only">Next</span>
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
              </svg>
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
}
