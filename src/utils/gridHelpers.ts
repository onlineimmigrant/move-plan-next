/**
 * Grid Helper Utilities
 * 
 * Utilities for generating responsive grid classes
 * Supports 1-5 column layouts with mobile-first breakpoints
 */

/**
 * Generate responsive grid classes based on column count
 * 
 * @param columns - Number of columns (1-5)
 * @returns Tailwind CSS grid classes with responsive breakpoints
 * 
 * @example
 * ```ts
 * getResponsiveGridClasses(3)
 * // Returns: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3'
 * ```
 */
export function getResponsiveGridClasses(columns: number): string {
  const gridClasses: Record<number, string> = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    5: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5',
  };
  return gridClasses[columns] || 'grid-cols-1';
}

/**
 * Generate responsive gap classes for grids
 * @param size - Gap size ('sm' | 'md' | 'lg' | 'xl')
 * @returns Tailwind CSS gap classes with responsive breakpoints
 */
export function getResponsiveGapClasses(size: 'sm' | 'md' | 'lg' | 'xl' = 'md'): string {
  const gapClasses = {
    sm: 'gap-x-4 gap-y-6 sm:gap-x-6 sm:gap-y-8',
    md: 'gap-x-6 gap-y-8 sm:gap-x-8 sm:gap-y-10 md:gap-x-10 md:gap-y-12 lg:gap-x-12 lg:gap-y-14 xl:gap-x-14 xl:gap-y-16',
    lg: 'gap-x-8 gap-y-10 sm:gap-x-10 sm:gap-y-12 md:gap-x-12 md:gap-y-14 lg:gap-x-14 lg:gap-y-16 xl:gap-x-16 xl:gap-y-20',
    xl: 'gap-x-10 gap-y-12 sm:gap-x-12 sm:gap-y-14 md:gap-x-14 md:gap-y-16 lg:gap-x-16 lg:gap-y-20 xl:gap-x-20 xl:gap-y-24',
  };
  return gapClasses[size];
}

/**
 * Get grid column count based on viewport width
 * @param columns - Target columns
 * @param isMobile - Is mobile viewport
 * @param isTablet - Is tablet viewport
 * @returns Actual column count for current viewport
 */
export function getActiveColumnCount(columns: number, isMobile: boolean, isTablet: boolean): number {
  if (isMobile) return 1;
  if (isTablet) return Math.min(columns, 2);
  return columns;
}
