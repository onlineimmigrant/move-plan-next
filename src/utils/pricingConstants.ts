/**
 * Constants for pricing modal configuration
 */

export const PRICING_CONSTANTS = {
  /** Maximum number of features to show before "View more" button */
  MAX_VISIBLE_FEATURES: 7,
  
  /** Default order value for plans without explicit order */
  DEFAULT_PLAN_ORDER: 999,
  
  /** Number of decimal places for price display */
  PRICE_DECIMALS: 2,
  
  /** Default recurring interval count for monthly plans */
  DEFAULT_MONTHLY_INTERVAL: 1,
  
  /** Default recurring interval count for annual plans */
  DEFAULT_ANNUAL_INTERVAL: 12,
} as const;

export const PRICING_MODAL_CLASSES = {
  backdrop: 'fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity',
  container: 'relative h-full w-full flex',
  modal: 'relative bg-white w-full h-full overflow-hidden flex flex-col',
  header: 'relative bg-white px-6 py-6 sm:px-8 sm:py-8 flex-shrink-0 border-b border-gray-100',
  closeButton: 'absolute top-3 right-3 sm:top-4 sm:right-4 text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-50',
  content: 'flex-1 bg-white px-6 py-6 sm:px-8 sm:py-8 overflow-y-auto',
} as const;
