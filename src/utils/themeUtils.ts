/**
 * Theme Utilities for Dynamic Color System
 * 
 * This utility provides functions for calculating color shade variants
 * and generating CSS custom properties for the theme system.
 */

export interface ShadeVariants {
  base: number;
  hover: number;
  active: number;
  light: number;
  lighter: number;
  disabled: number;
  border: number;
}

/**
 * Calculates all shade variants from a base shade
 * @param baseShade - The base shade (e.g., 500, 600, 700)
 * @returns Object with all calculated shade variants
 */
export function calculateShadeVariants(baseShade: number): ShadeVariants {
  return {
    base: baseShade,
    hover: Math.min(baseShade + 100, 900), // Darker on hover
    active: Math.min(baseShade + 200, 900), // Even darker when active
    light: Math.max(baseShade - 450, 50), // Much lighter variant
    lighter: Math.max(baseShade - 500, 50), // Lightest variant
    disabled: Math.max(baseShade - 300, 100), // Lighter for disabled state
    border: Math.max(baseShade - 200, 200), // Slightly lighter for borders
  };
}

/**
 * Validates if a shade is within the valid Tailwind range
 * @param shade - The shade to validate
 * @returns true if valid, false otherwise
 */
export function isValidShade(shade: number): boolean {
  const validShades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];
  return validShades.includes(shade);
}

/**
 * Gets the closest valid Tailwind shade
 * @param shade - The shade to normalize
 * @returns The closest valid shade
 */
export function normalizeShade(shade: number): number {
  const validShades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];
  return validShades.reduce((prev, curr) => 
    Math.abs(curr - shade) < Math.abs(prev - shade) ? curr : prev
  );
}

/**
 * Generates CSS custom property name
 * @param prefix - The prefix (e.g., 'primary', 'secondary')
 * @param variant - The variant (e.g., 'base', 'hover', 'light')
 * @returns CSS custom property name
 */
export function getCSSVarName(prefix: 'primary' | 'secondary', variant: keyof ShadeVariants): string {
  return `--color-${prefix}-${variant}`;
}

/**
 * Generates a Tailwind color class string
 * @param color - The color family (e.g., 'sky', 'blue')
 * @param shade - The shade (e.g., 500, 600)
 * @returns Tailwind color class (e.g., 'sky-500')
 */
export function getTailwindColorClass(color: string, shade: number): string {
  return `${color}-${shade}`;
}

/**
 * Generates all CSS custom properties for a color with its variants
 * @param prefix - The prefix ('primary' or 'secondary')
 * @param color - The color family
 * @param baseShade - The base shade
 * @returns Object mapping CSS var names to Tailwind color classes
 */
export function generateColorCSSVars(
  prefix: 'primary' | 'secondary',
  color: string,
  baseShade: number
): Record<string, string> {
  const variants = calculateShadeVariants(baseShade);
  const cssVars: Record<string, string> = {};

  Object.entries(variants).forEach(([variant, shade]) => {
    const varName = getCSSVarName(prefix, variant as keyof ShadeVariants);
    const colorClass = getTailwindColorClass(color, shade);
    cssVars[varName] = colorClass;
  });

  return cssVars;
}

/**
 * Example usage and color presets for different business types
 */
export const COLOR_PRESETS = {
  corporate: {
    primary_color: 'blue',
    primary_shade: 600,
    secondary_color: 'slate',
    secondary_shade: 500,
    description: 'Professional and trustworthy',
  },
  healthcare: {
    primary_color: 'teal',
    primary_shade: 500,
    secondary_color: 'cyan',
    secondary_shade: 400,
    description: 'Calm and caring',
  },
  finance: {
    primary_color: 'emerald',
    primary_shade: 600,
    secondary_color: 'gray',
    secondary_shade: 600,
    description: 'Stable and secure',
  },
  creative: {
    primary_color: 'purple',
    primary_shade: 500,
    secondary_color: 'pink',
    secondary_shade: 400,
    description: 'Bold and artistic',
  },
  tech: {
    primary_color: 'indigo',
    primary_shade: 600,
    secondary_color: 'slate',
    secondary_shade: 500,
    description: 'Modern and innovative',
  },
  ecommerce: {
    primary_color: 'orange',
    primary_shade: 500,
    secondary_color: 'amber',
    secondary_shade: 400,
    description: 'Energetic and inviting',
  },
  default: {
    primary_color: 'sky',
    primary_shade: 600,
    secondary_color: 'gray',
    secondary_shade: 500,
    description: 'Clean and versatile',
  },
} as const;

/**
 * Available Tailwind color families
 */
export const AVAILABLE_COLORS = [
  'slate', 'gray', 'zinc', 'neutral', 'stone',
  'red', 'orange', 'amber', 'yellow', 'lime',
  'green', 'emerald', 'teal', 'cyan', 'sky',
  'blue', 'indigo', 'violet', 'purple', 'fuchsia',
  'pink', 'rose'
] as const;

/**
 * Available Tailwind shades
 */
export const AVAILABLE_SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900] as const;
