/**
 * Grid layout constants for pricing modal responsive design
 */
export const PRICING_GRID_CLASSES = {
  container: 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 max-w-4xl xl:max-w-5xl mx-auto mb-20',
  skeletonCount: 3,
} as const;

/**
 * Modal styling constants with glassmorphism design
 */
export const PRICING_MODAL_STYLES = {
  backdrop: 'fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity',
  container: 'fixed inset-0 z-50',
  modal: 'relative h-full w-full flex',
  content: 'relative bg-white/50 dark:bg-gray-900/50 backdrop-blur-2xl w-full h-full overflow-hidden flex flex-col border-r border-l border-white/20 dark:border-gray-700/20',
  header: 'relative bg-white/30 dark:bg-gray-800/30 backdrop-blur-md px-6 py-6 sm:px-8 sm:py-8 flex-shrink-0 border-b border-white/10 dark:border-gray-700/20',
  closeButton: 'absolute top-3 right-3 sm:top-4 sm:right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-2 rounded-full hover:bg-white/30 dark:hover:bg-gray-700/30',
  body: 'flex-1 bg-white/20 dark:bg-gray-900/20 backdrop-blur-sm px-6 py-6 sm:px-8 sm:py-8 overflow-y-auto',
} as const;

/**
 * Toggle button styling constants with glassmorphism
 */
export const TOGGLE_STYLES = {
  container: 'relative bg-white/40 dark:bg-gray-800/40 backdrop-blur-md p-0.5 rounded-full border border-white/30 dark:border-gray-600/30 shadow-lg',
  button: {
    active: 'relative z-10 px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ease-out text-gray-700 dark:text-gray-200 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm shadow-md border border-white/40 dark:border-gray-600/40',
    inactive: 'relative z-10 px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ease-out text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-white/20 dark:hover:bg-gray-700/20',
  },
} as const;

/**
 * Discount badge styling with primary color scheme
 */
export const DISCOUNT_BADGE_STYLES = {
  base: 'ml-2 px-2 py-0.5 rounded-full text-xs font-semibold',
} as const;

/**
 * Product tab button styling (matching Tickets/Meetings modals)
 */
export const PRODUCT_TAB_STYLES = {
  container: 'flex gap-3 overflow-x-auto scrollbar-hide px-4 sm:px-0',
  button: {
    base: 'inline-flex items-center gap-2 px-5 py-2 rounded-full font-medium text-sm transition-all duration-300 shadow-sm flex-shrink-0',
  },
} as const;

/**
 * Title and text styling constants
 */
export const TEXT_STYLES = {
  title: 'text-3xl sm:text-4xl lg:text-4xl font-extralight tracking-tight mb-3 sm:mb-4 text-gray-700 leading-tight',
  description: 'hidden sm:block text-base sm:text-lg font-light text-gray-500 leading-relaxed mb-6 max-w-2xl mx-auto',
  errorTitle: 'text-lg font-medium text-gray-900 mb-2',
  errorDescription: 'text-sm text-gray-500',
} as const;
