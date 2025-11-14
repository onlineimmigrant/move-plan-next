// Centralized z-index tokens for UI layers
// Keep stacking contexts consistent across modals/popovers/tooltips

export const Z_INDEX = {
  modalBase: 10000,
  modalConfirm: 10010,
  popover: 10020,
  tooltip: 10030,
} as const;

export type ZIndexKey = keyof typeof Z_INDEX;
