/**
 * Pagination and UI constants for account pages
 */

export const PAGINATION = {
  ITEMS_PER_PAGE_DEFAULT: 10,
  ITEMS_PER_PAGE_SMALL: 5,
  ITEMS_PER_PAGE_LARGE: 20,
  MAX_PAGE_BUTTONS: 7,
} as const;

export const TOAST = {
  DURATION_DEFAULT: 3000,
  DURATION_SHORT: 2000,
  DURATION_LONG: 5000,
} as const;

export const DEBOUNCE = {
  SEARCH_DELAY: 300,
  RESIZE_DELAY: 150,
  INPUT_DELAY: 500,
} as const;
