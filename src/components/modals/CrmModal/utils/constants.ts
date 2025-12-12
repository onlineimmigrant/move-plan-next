/**
 * Constants for CRM Modal
 */

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
 * Z-index layering
 */
export const Z_INDEX = {
  backdrop: 10000,
  modal: 10001,
  dropdown: 10002,
  toast: 10003,
} as const;
