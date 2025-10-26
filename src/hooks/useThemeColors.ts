import { useSettings } from '@/context/SettingsContext';
import { calculateShadeVariants, getTailwindColorClass } from '@/utils/themeUtils';

/**
 * Custom hook to access theme colors from settings
 * Provides both Tailwind classes and CSS variable names
 */
export function useThemeColors() {
  const { settings } = useSettings();

  const primaryColor = settings?.primary_color || 'sky';
  const primaryShade = settings?.primary_shade || 600;
  const secondaryColor = settings?.secondary_color || 'gray';
  const secondaryShade = settings?.secondary_shade || 500;

  const primaryVariants = calculateShadeVariants(primaryShade);
  const secondaryVariants = calculateShadeVariants(secondaryShade);

  return {
    // Primary color classes
    primary: {
      bg: getTailwindColorClass(primaryColor, primaryVariants.base),
      bgHover: getTailwindColorClass(primaryColor, primaryVariants.hover),
      bgActive: getTailwindColorClass(primaryColor, primaryVariants.active),
      bgLight: getTailwindColorClass(primaryColor, primaryVariants.light),
      bgLighter: getTailwindColorClass(primaryColor, primaryVariants.lighter),
      bgDisabled: getTailwindColorClass(primaryColor, primaryVariants.disabled),
      text: getTailwindColorClass(primaryColor, primaryVariants.base),
      textHover: getTailwindColorClass(primaryColor, primaryVariants.hover),
      textLight: getTailwindColorClass(primaryColor, primaryVariants.light),
      border: getTailwindColorClass(primaryColor, primaryVariants.border),
      borderHover: getTailwindColorClass(primaryColor, primaryVariants.base),
      ring: getTailwindColorClass(primaryColor, primaryVariants.base),
    },
    // Secondary color classes
    secondary: {
      bg: getTailwindColorClass(secondaryColor, secondaryVariants.base),
      bgHover: getTailwindColorClass(secondaryColor, secondaryVariants.hover),
      bgActive: getTailwindColorClass(secondaryColor, secondaryVariants.active),
      bgLight: getTailwindColorClass(secondaryColor, secondaryVariants.light),
      bgLighter: getTailwindColorClass(secondaryColor, secondaryVariants.lighter),
      bgDisabled: getTailwindColorClass(secondaryColor, secondaryVariants.disabled),
      text: getTailwindColorClass(secondaryColor, secondaryVariants.base),
      textHover: getTailwindColorClass(secondaryColor, secondaryVariants.hover),
      textLight: getTailwindColorClass(secondaryColor, secondaryVariants.light),
      border: getTailwindColorClass(secondaryColor, secondaryVariants.border),
      borderHover: getTailwindColorClass(secondaryColor, secondaryVariants.base),
      ring: getTailwindColorClass(secondaryColor, secondaryVariants.base),
    },
    // CSS variable names for inline styles
    cssVars: {
      primary: {
        base: 'var(--color-primary-base)',
        hover: 'var(--color-primary-hover)',
        active: 'var(--color-primary-active)',
        light: 'var(--color-primary-light)',
        lighter: 'var(--color-primary-lighter)',
        disabled: 'var(--color-primary-disabled)',
        border: 'var(--color-primary-border)',
      },
      secondary: {
        base: 'var(--color-secondary-base)',
        hover: 'var(--color-secondary-hover)',
        active: 'var(--color-secondary-active)',
        light: 'var(--color-secondary-light)',
        lighter: 'var(--color-secondary-lighter)',
        disabled: 'var(--color-secondary-disabled)',
        border: 'var(--color-secondary-border)',
      },
    },
    // Raw color and shade values
    raw: {
      primary: { color: primaryColor, shade: primaryShade, variants: primaryVariants },
      secondary: { color: secondaryColor, shade: secondaryShade, variants: secondaryVariants },
    },
  };
}
