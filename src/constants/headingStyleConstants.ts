/**
 * Heading Style Constants
 * Centralized style mappings for TemplateHeadingSection
 * Extracted from TemplateHeadingSection.tsx for better maintainability
 */

// Font family mappings
export const FONT_FAMILIES = {
  sans: 'font-sans',
  serif: 'font-serif',
  mono: 'font-mono',
  display: 'font-display',
} as const;

// Font size mappings for titles
export const TITLE_SIZES = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
  '2xl': 'text-2xl',
  '3xl': 'text-3xl sm:text-4xl lg:text-5xl',
  '4xl': 'text-4xl sm:text-5xl lg:text-6xl',
} as const;

// Font size mappings for descriptions
export const DESC_SIZES = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
  '2xl': 'text-2xl',
  '3xl': 'text-3xl',
  '4xl': 'text-4xl',
} as const;

// Font weight mappings
export const FONT_WEIGHTS = {
  light: 'font-light',
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
} as const;

// Text alignment mappings
export const ALIGNMENTS = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
} as const;

// Type exports for type safety
export type FontFamily = keyof typeof FONT_FAMILIES;
export type TitleSize = keyof typeof TITLE_SIZES;
export type DescSize = keyof typeof DESC_SIZES;
export type FontWeight = keyof typeof FONT_WEIGHTS;
export type Alignment = keyof typeof ALIGNMENTS;
