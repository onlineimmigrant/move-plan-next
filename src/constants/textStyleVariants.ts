/**
 * Text Style Variants for Template Sections
 * 
 * Consistent typography styles used across TemplateSection and TemplateHeadingSection
 * Supports 9 design variants: default, apple, codedharmony, magazine, startup, elegant, brutalist, modern, playful
 */

export type TextStyleVariant = 
  | 'default' 
  | 'apple' 
  | 'codedharmony' 
  | 'magazine' 
  | 'startup' 
  | 'elegant' 
  | 'brutalist' 
  | 'modern' 
  | 'playful';

export interface TextVariantStyles {
  sectionTitle: string;
  sectionDescription: string;
  metricTitle: string;
  metricDescription: string;
}

export const TEXT_VARIANTS: Record<TextStyleVariant, TextVariantStyles> = {
  default: {
    sectionTitle: 'text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-4 md:mb-6 leading-tight tracking-tight',
    sectionDescription: 'text-lg sm:text-xl md:text-2xl font-normal text-gray-600 leading-relaxed',
    metricTitle: 'text-2xl sm:text-3xl font-bold text-gray-900 leading-snug',
    metricDescription: 'text-base sm:text-lg text-gray-700 leading-relaxed'
  },
  apple: {
    sectionTitle: 'text-4xl sm:text-5xl font-light text-gray-900',
    sectionDescription: 'text-lg font-light text-gray-600',
    metricTitle: 'text-2xl font-light text-gray-900',
    metricDescription: 'text-base font-light text-gray-600'
  },
  codedharmony: {
    sectionTitle: 'text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight leading-tight',
    sectionDescription: 'text-xl sm:text-2xl text-gray-600 font-medium leading-relaxed',
    metricTitle: 'text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 tracking-tight',
    metricDescription: 'text-lg sm:text-xl text-gray-700 font-medium leading-relaxed'
  },
  magazine: {
    sectionTitle: 'text-4xl sm:text-5xl lg:text-7xl font-bold uppercase tracking-tight leading-none',
    sectionDescription: 'text-sm sm:text-base uppercase tracking-widest font-medium',
    metricTitle: 'text-lg sm:text-xl font-bold uppercase tracking-wide',
    metricDescription: 'text-sm leading-relaxed'
  },
  startup: {
    sectionTitle: 'text-4xl sm:text-6xl lg:text-7xl font-black',
    sectionDescription: 'text-xl sm:text-2xl font-normal leading-relaxed',
    metricTitle: 'text-2xl sm:text-3xl font-bold',
    metricDescription: 'text-lg leading-relaxed'
  },
  elegant: {
    sectionTitle: 'text-3xl sm:text-4xl lg:text-5xl font-serif font-light italic',
    sectionDescription: 'text-base sm:text-lg font-serif leading-loose',
    metricTitle: 'text-xl sm:text-2xl font-serif font-normal',
    metricDescription: 'text-sm sm:text-base font-serif leading-relaxed'
  },
  brutalist: {
    sectionTitle: 'text-5xl sm:text-6xl lg:text-8xl font-black uppercase leading-none tracking-tighter',
    sectionDescription: 'text-xs sm:text-sm uppercase tracking-wider font-bold',
    metricTitle: 'text-2xl sm:text-3xl font-black uppercase tracking-tight',
    metricDescription: 'text-xs sm:text-sm uppercase tracking-wide font-medium'
  },
  modern: {
    sectionTitle: 'text-3xl sm:text-4xl lg:text-6xl font-extrabold tracking-tight',
    sectionDescription: 'text-lg sm:text-xl font-medium',
    metricTitle: 'text-xl sm:text-2xl font-bold',
    metricDescription: 'text-base font-normal'
  },
  playful: {
    sectionTitle: 'text-4xl sm:text-5xl lg:text-6xl font-black tracking-wide',
    sectionDescription: 'text-lg sm:text-xl font-semibold',
    metricTitle: 'text-2xl sm:text-3xl font-extrabold',
    metricDescription: 'text-base font-medium leading-relaxed'
  }
};

/**
 * Get text variant styles with fallback to default
 */
export function getTextVariant(variant?: TextStyleVariant | string): TextVariantStyles {
  if (!variant || !(variant in TEXT_VARIANTS)) {
    return TEXT_VARIANTS.default;
  }
  return TEXT_VARIANTS[variant as TextStyleVariant];
}
