import { getColorValue } from '@/components/Shared/ColorPaletteDropdown';
import { GradientStyle } from '@/types/settings';

/**
 * Convert gradient object to CSS background style
 * Matches Hero component pattern (135deg angle)
 * Supports both Tailwind color names and hex color codes
 * 
 * @param is_gradient - Boolean flag to enable gradient
 * @param gradient - Gradient configuration (from, via, to)
 * @param fallbackColor - Solid color fallback if gradient is disabled
 * @returns React.CSSProperties with background styling
 */
export function getBackgroundStyle(
  is_gradient?: boolean,
  gradient?: GradientStyle | null,
  fallbackColor?: string
): React.CSSProperties {
  // Helper function to determine if a color is a hex code
  const isHexColor = (color: string): boolean => /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);

  // Helper function to get color value (hex or Tailwind)
  const getColor = (color: string): string => {
    if (isHexColor(color)) {
      return color;
    }
    return getColorValue(color.replace(/^(from-|via-|to-)/, ''));
  };

  // Apply gradient if enabled and gradient object exists
  if (is_gradient && gradient?.from && gradient?.to) {
    const fromColor = getColor(gradient.from);
    const toColor = getColor(gradient.to);
    
    // 3-color gradient (from → via → to)
    if (gradient.via) {
      const viaColor = getColor(gradient.via);
      return {
        backgroundImage: `linear-gradient(135deg, ${fromColor}, ${viaColor}, ${toColor})`
      };
    }
    
    // 2-color gradient (from → to)
    return {
      backgroundImage: `linear-gradient(135deg, ${fromColor}, ${toColor})`
    };
  }
  
  // Fallback to solid color
  if (fallbackColor) {
    if (isHexColor(fallbackColor)) {
      return { backgroundColor: fallbackColor };
    }
    const colorValue = getColorValue(fallbackColor);
    return colorValue === 'transparent' ? {} : { backgroundColor: colorValue };
  }
  
  return {};
}

/**
 * Get gradient CSS class for Tailwind (optional alternative)
 * Use this if you prefer Tailwind classes over inline styles
 * 
 * @param gradient - Gradient configuration
 * @returns Tailwind gradient class string
 */
export function getGradientClass(gradient?: GradientStyle | null): string {
  if (!gradient?.from || !gradient?.to) return '';
  
  const via = gradient.via ? ` via-${gradient.via}` : '';
  return `bg-gradient-to-br from-${gradient.from}${via} to-${gradient.to}`;
}
