import { getColorValue } from '@/components/Shared/ColorPaletteDropdown';
import { GradientStyle } from '@/types/settings';

/**
 * Convert gradient object to CSS background style
 * Matches Hero component pattern (135deg angle)
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
  // Apply gradient if enabled and gradient object exists
  if (is_gradient && gradient?.from && gradient?.to) {
    // Clean color names (remove Tailwind prefixes)
    const fromColor = getColorValue(gradient.from.replace(/^from-/, ''));
    const toColor = getColorValue(gradient.to.replace(/^to-/, ''));
    
    // 3-color gradient (from → via → to)
    if (gradient.via) {
      const viaColor = getColorValue(gradient.via.replace(/^via-/, ''));
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
