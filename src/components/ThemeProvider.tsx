'use client';

import { useEffect } from 'react';
import { useSettings } from '@/context/SettingsContext';
import { calculateShadeVariants, getCSSVarName } from '@/utils/themeUtils';
import { getColorValue } from '@/components/Shared/ColorPaletteDropdown';

/**
 * ThemeProvider Component
 * 
 * Injects CSS custom properties based on organization's primary and secondary colors.
 * This component should be placed at the root of the application to ensure
 * theme colors are available to all components.
 * 
 * CSS Variables Generated:
 * - --color-primary-base: Base primary color
 * - --color-primary-hover: Hover state (base + 100)
 * - --color-primary-active: Active state (base + 200)
 * - --color-primary-light: Light variant (base - 450)
 * - --color-primary-lighter: Lightest variant (base - 500)
 * - --color-primary-disabled: Disabled state (base - 300)
 * - --color-primary-border: Border color (base - 200)
 * 
 * Same variants for secondary color with --color-secondary-* prefix
 * 
 * Usage in components:
 * - className: Use safelist classes like bg-sky-600, text-sky-700, etc.
 * - Inline styles: style={{ backgroundColor: 'var(--color-primary-base)' }}
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { settings } = useSettings();

  useEffect(() => {
    if (!settings) return;

    const root = document.documentElement;

    // Get color configuration with fallbacks
    const primaryColor = settings.primary_color || 'sky';
    const primaryShade = settings.primary_shade || 600;
    const secondaryColor = settings.secondary_color || 'gray';
    const secondaryShade = settings.secondary_shade || 500;

    // Calculate all shade variants
    const primaryVariants = calculateShadeVariants(primaryShade);
    const secondaryVariants = calculateShadeVariants(secondaryShade);

    // Helper function to set CSS custom property with hex value
    const setCSSVar = (varName: string, color: string, shade: number) => {
      try {
        const colorClass = `${color}-${shade}`;
        const hexValue = getColorValue(colorClass);
        if (hexValue) {
          root.style.setProperty(varName, hexValue);
        } else {
          console.warn(`Could not resolve color value for: ${colorClass}`);
        }
      } catch (error) {
        console.error(`Error setting CSS variable ${varName}:`, error);
      }
    };

    // Set primary color variants
    Object.entries(primaryVariants).forEach(([variant, shade]) => {
      const varName = getCSSVarName('primary', variant as keyof typeof primaryVariants);
      setCSSVar(varName, primaryColor, shade);
    });

    // Set secondary color variants
    Object.entries(secondaryVariants).forEach(([variant, shade]) => {
      const varName = getCSSVarName('secondary', variant as keyof typeof secondaryVariants);
      setCSSVar(varName, secondaryColor, shade);
    });

    // Also set the base color and shade as data attributes for use in Tailwind safelist
    root.setAttribute('data-primary-color', primaryColor);
    root.setAttribute('data-primary-shade', String(primaryShade));
    root.setAttribute('data-secondary-color', secondaryColor);
    root.setAttribute('data-secondary-shade', String(secondaryShade));
  }, [settings]);

  return <>{children}</>;
}
