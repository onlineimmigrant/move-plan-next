import { useMemo } from 'react';
import { FooterType } from '@/types/settings';

interface FooterStyleConfig {
  type: FooterType;
  background: string;
  color: string;
  colorHover: string;
  is_gradient: boolean;
  gradient?: any;
}

interface UseFooterStylesProps {
  footerStyle?: any;
}

/**
 * Processes footer style settings
 * Supports both JSONB object and legacy string formats
 */
export const useFooterStyles = ({ footerStyle }: UseFooterStylesProps): FooterStyleConfig => {
  return useMemo(() => {
    if (!footerStyle) {
      return {
        type: 'default' as FooterType,
        background: 'neutral-900',
        color: 'neutral-400',
        colorHover: 'white',
        is_gradient: false,
        gradient: undefined
      };
    }

    // If it's an object (JSONB), use the properties
    if (typeof footerStyle === 'object' && footerStyle !== null) {
      return {
        type: (footerStyle.type || 'default') as FooterType,
        background: footerStyle.background || 'neutral-900',
        color: footerStyle.color || 'neutral-400',
        colorHover: footerStyle.color_hover || 'white',
        is_gradient: footerStyle.is_gradient || false,
        gradient: footerStyle.gradient || undefined
      };
    }

    // Legacy string support - use it as background only
    return {
      type: 'default' as FooterType,
      background: footerStyle,
      color: 'neutral-400',
      colorHover: 'white',
      is_gradient: false,
      gradient: undefined
    };
  }, [footerStyle]);
};
