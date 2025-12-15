/**
 * useHeadingStyle Hook
 * Generates style classes and colors for heading sections
 * Memoized for performance
 */

import { useMemo } from 'react';
import { getColorValue } from '@/components/Shared/ColorPaletteDropdown';
import { FONT_FAMILIES, TITLE_SIZES, DESC_SIZES, FONT_WEIGHTS, ALIGNMENTS } from '@/constants/headingStyleConstants';

interface HeadingStyle {
  title: {
    size: keyof typeof TITLE_SIZES;
    font: keyof typeof FONT_FAMILIES;
    weight: keyof typeof FONT_WEIGHTS;
    color?: string;
  };
  description: {
    size: keyof typeof DESC_SIZES;
    font: keyof typeof FONT_FAMILIES;
    weight: keyof typeof FONT_WEIGHTS;
    color?: string;
  };
  button: {
    color?: string;
    text_color?: string;
  };
  alignment: keyof typeof ALIGNMENTS;
}

interface UseHeadingStyleReturn {
  titleClasses: string;
  descClasses: string;
  titleColor: string;
  descColor: string;
  buttonColor: string;
  buttonTextColor: string;
  alignmentClass: string;
}

export function useHeadingStyle(style: HeadingStyle): UseHeadingStyleReturn {
  const titleClasses = useMemo(() => {
    return [
      TITLE_SIZES[style.title.size],
      FONT_FAMILIES[style.title.font],
      FONT_WEIGHTS[style.title.weight],
      'tracking-tight leading-tight',
    ].join(' ');
  }, [style.title.size, style.title.font, style.title.weight]);

  const descClasses = useMemo(() => {
    return [
      DESC_SIZES[style.description.size],
      FONT_FAMILIES[style.description.font],
      FONT_WEIGHTS[style.description.weight],
      'leading-8',
    ].join(' ');
  }, [style.description.size, style.description.font, style.description.weight]);

  const titleColor = useMemo(() => {
    return style.title.color ? getColorValue(style.title.color) : 'rgb(31 41 55)'; // gray-800 default
  }, [style.title.color]);

  const descColor = useMemo(() => {
    return style.description.color ? getColorValue(style.description.color) : 'rgb(55 65 81)'; // gray-700 default
  }, [style.description.color]);

  const buttonColor = useMemo(() => {
    return style.button.color ? getColorValue(style.button.color) : 'rgb(16 185 129)'; // emerald-500 default
  }, [style.button.color]);

  const buttonTextColor = useMemo(() => {
    return style.button.text_color ? getColorValue(style.button.text_color) : 'white';
  }, [style.button.text_color]);

  const alignmentClass = useMemo(() => {
    return ALIGNMENTS[style.alignment];
  }, [style.alignment]);

  return {
    titleClasses,
    descClasses,
    titleColor,
    descColor,
    buttonColor,
    buttonTextColor,
    alignmentClass,
  };
}
