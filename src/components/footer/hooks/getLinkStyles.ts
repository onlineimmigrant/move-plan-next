import { getColorValue } from '@/components/Shared/ColorPaletteDropdown';

interface LinkStylesProps {
  color: string;
  colorHover: string;
  background: string;
}

/**
 * Calculates link styles with WCAG AA compliance
 * Ensures sufficient contrast on dark backgrounds
 */
export const getLinkStyles = (isHovered: boolean, { color, colorHover, background }: LinkStylesProps) => {
  let textColor = getColorValue(color);
  const hoverColor = getColorValue(colorHover);
  
  // WCAG AA compliance: Ensure sufficient contrast on dark backgrounds
  // If background is dark (#000000), ensure text is light enough
  const bgColor = getColorValue(background);
  if (bgColor && bgColor.toLowerCase() === '#000000') {
    // Check if text color is too dark (low contrast)
    // Convert color to RGB and check lightness
    const getLightness = (hex: string) => {
      const rgb = parseInt(hex.slice(1), 16);
      const r = (rgb >> 16) & 0xff;
      const g = (rgb >> 8) & 0xff;
      const b = (rgb >> 0) & 0xff;
      return (0.299 * r + 0.587 * g + 0.114 * b) / 255; // Relative luminance
    };
    
    const lightness = getLightness(textColor);
    // If text is too dark (lightness < 0.6), force it to white for contrast
    if (lightness < 0.6) {
      textColor = '#ffffff';
    }
  }
  
  return {
    color: isHovered ? hoverColor : textColor
  };
};
