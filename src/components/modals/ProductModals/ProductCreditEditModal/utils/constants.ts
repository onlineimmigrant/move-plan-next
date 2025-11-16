/**
 * Constants for ProductCreditEditModal
 */

/**
 * API endpoints for product operations
 */
export const API_ENDPOINTS = {
  LIST_PRODUCTS: '/api/products/list',
  MANAGE_PRODUCTS: '/api/products',
} as const;

/**
 * Modal sizing configuration
 */
export const MODAL_SIZES = {
  mobile: {
    height: '90vh',
    width: '100%',
  },
  desktop: {
    default: {
      width: 1120,
      height: 900,
    },
    min: {
      width: 800,
      height: 700,
    },
  },
} as const;

/**
 * Product filter tabs
 */
export const FILTER_TABS = ['all', 'active', 'archived'] as const;

/**
 * Sort options
 */
export const SORT_OPTIONS = ['name', 'created', 'updated'] as const;

/**
 * Form field limits
 */
export const FIELD_LIMITS = {
  productName: 500,
  description: 5000,
  taxCode: 50,
} as const;

/**
 * Debounce delays (ms)
 */
export const DEBOUNCE_DELAYS = {
  search: 300,
  taxCodeSearch: 200,
} as const;

/**
 * Z-index layering
 */
export const Z_INDEX = {
  backdrop: 10000,
  modal: 10001,
  dropdown: 10002,
  toast: 10003,
} as const;

/**
 * Maximum tax code results to display
 */
export const MAX_TAX_CODE_RESULTS = 50;

/**
 * Default form data
 */
export const DEFAULT_FORM_DATA = {
  product_name: '',
  is_displayed: true,
  product_description: '',
  links_to_image: '',
  attributes: '',
  product_tax_code: '',
} as const;
