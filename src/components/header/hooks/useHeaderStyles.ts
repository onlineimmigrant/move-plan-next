import { useMemo } from 'react';
import { getBackgroundStyle } from '@/utils/gradientHelper';

interface HeaderStyleConfig {
  type?: string;
  background?: string;
  color?: string;
  color_hover?: string;
  menu_width?: string;
  menu_font_size?: string;
  menu_font_weight?: string;
  profile_item_visible?: boolean;
  is_gradient?: boolean;
  gradient?: any;
  logo?: {
    url?: string;
    position?: string;
    size?: string;
  };
}

interface UseHeaderStylesProps {
  headerStyle: HeaderStyleConfig;
  isScrolled: boolean;
}

/**
 * Processes header style configuration
 * Returns computed styles, classes, and logo config
 */
export const useHeaderStyles = ({ headerStyle, isScrolled }: UseHeaderStylesProps) => {
  // Extract individual values
  const headerType = headerStyle.type || 'default';
  const headerBackground = headerStyle.background || 'white';
  const headerColor = headerStyle.color || 'gray-700';
  const headerColorHover = headerStyle.color_hover || 'gray-900';
  const menuWidth = headerStyle.menu_width || '7xl';
  const menuFontSize = headerStyle.menu_font_size || 'base';
  const menuFontWeight = headerStyle.menu_font_weight || 'normal';
  const profileItemVisible = headerStyle.profile_item_visible !== false;
  
  // Logo configuration
  const logoConfig = headerStyle.logo || { url: '/', position: 'left', size: 'md' };
  const logoUrl = logoConfig.url || '/';
  const logoPosition = logoConfig.position || 'left';
  const logoSize = logoConfig.size || 'md';
  
  // Map logo size to Tailwind classes
  const logoHeightClass = logoSize === 'sm' ? 'h-8' : logoSize === 'lg' ? 'h-12' : 'h-10';
  
  // Map menu font size to Tailwind classes
  const menuFontSizeClass = useMemo(() => ({
    'xs': 'text-xs',
    'sm': 'text-sm',
    'base': 'text-base',
    'lg': 'text-lg',
    'xl': 'text-xl',
    '2xl': 'text-2xl'
  }[menuFontSize] || 'text-base'), [menuFontSize]);
  
  // Map menu font weight to Tailwind classes
  const menuFontWeightClass = useMemo(() => ({
    'thin': 'font-thin',
    'normal': 'font-normal',
    'medium': 'font-medium',
    'semibold': 'font-semibold',
    'bold': 'font-bold'
  }[menuFontWeight] || 'font-normal'), [menuFontWeight]);

  // Calculate header background style
  const headerBackgroundStyle = useMemo(() => {
    // For transparent headers, handle special case
    if (headerType === 'transparent' && !isScrolled) {
      return { backgroundColor: 'transparent' };
    }
    
    // For ring_card_mini and mini, use full opacity
    if (headerType === 'ring_card_mini' || headerType === 'mini') {
      return getBackgroundStyle(
        headerStyle.is_gradient,
        headerStyle.gradient,
        headerBackground
      );
    }
    
    // Get gradient or solid color background
    const baseStyle = getBackgroundStyle(
      headerStyle.is_gradient,
      headerStyle.gradient,
      headerBackground
    );
    
    // Add opacity for blur effect
    if (baseStyle.backgroundImage) {
      return baseStyle;
    } else if (baseStyle.backgroundColor) {
      const opacity = isScrolled ? 'f2' : 'cc';
      return {
        backgroundColor: baseStyle.backgroundColor + opacity
      };
    }
    
    return baseStyle;
  }, [headerType, isScrolled, headerStyle.is_gradient, headerStyle.gradient, headerBackground]);

  return {
    headerType,
    headerBackground,
    headerColor,
    headerColorHover,
    menuWidth,
    menuFontSize,
    menuFontWeight,
    profileItemVisible,
    logoConfig,
    logoUrl,
    logoPosition,
    logoSize,
    logoHeightClass,
    menuFontSizeClass,
    menuFontWeightClass,
    headerBackgroundStyle,
  };
};
