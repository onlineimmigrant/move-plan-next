import { useMemo } from 'react';
import { getBackgroundStyle } from '@/utils/gradientHelper';
import { GradientStyle } from '@/types/settings';

interface UseComponentStylesProps {
  isGradient?: boolean;
  gradient?: GradientStyle | null;
  backgroundColor?: string | null;
  textColor?: string | null;
  themeColors?: Record<string, string>;
}

/**
 * Shared component styling hook for Header and Footer
 * Handles background styles, colors, and theme-based styling
 */
export const useComponentStyles = ({
  isGradient,
  gradient,
  backgroundColor,
  textColor,
  themeColors,
}: UseComponentStylesProps) => {
  // Calculate background style from component settings
  const backgroundStyle = useMemo(() => {
    return getBackgroundStyle(
      isGradient,
      gradient,
      backgroundColor || undefined
    );
  }, [isGradient, gradient, backgroundColor]);

  // Determine text color (use theme color or custom color)
  const computedTextColor = useMemo(() => {
    if (!textColor) return null;
    
    // Check if it's a theme color reference (e.g., "primary", "secondary")
    if (themeColors && textColor in themeColors) {
      return themeColors[textColor];
    }
    
    // Otherwise use the color directly
    return textColor;
  }, [textColor, themeColors]);

  // Style object for component container
  const containerStyle = useMemo(() => {
    return {
      ...backgroundStyle,
      ...(computedTextColor && { color: computedTextColor }),
    };
  }, [backgroundStyle, computedTextColor]);

  return {
    backgroundStyle,
    computedTextColor,
    containerStyle,
  };
};
