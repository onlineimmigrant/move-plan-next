/**
 * TemplateHeadingSection Modal Types
 * 
 * Centralized type definitions for Template Heading Section editing
 */

export interface TitleStyle {
  font?: string;
  color?: string;
  is_gradient?: boolean;
  gradient?: {
    from: string;
    via?: string;
    to: string;
  };
  size?: {
    desktop: string;
    mobile: string;
  };
  alignment?: 'left' | 'center' | 'right';
  weight?: string;
}

export interface DescriptionStyle {
  font?: string;
  color?: string;
  size?: {
    desktop: string;
    mobile: string;
  };
  weight?: string;
}

export interface ImageStyle {
  position?: string;
  firstPosition?: boolean;
}

export interface BackgroundStyle {
  color?: string;
  is_gradient?: boolean;
  gradient?: {
    from: string;
    via?: string;
    to: string;
  };
}

export interface ButtonStyle {
  text?: string;
  url?: string;
  urlPage?: string;
  isTextLink?: boolean;
  color?: string;
  gradient?: {
    from: string;
    via?: string;
    to: string;
  };
}

export interface HeadingFormData {
  name: string;
  name_part_2?: string;
  name_part_3?: string;
  description_text: string;
  button_text?: string;
  url_page?: string;
  url?: string;
  image?: string;
  image_first?: boolean;
  is_included_templatesection?: boolean;
  background_color?: string;
  is_gradient?: boolean;
  gradient?: {
    from: string;
    via?: string;
    to: string;
  } | null;
  text_style_variant?: 'default' | 'apple' | 'codedharmony';
  is_text_link?: boolean;
  title_alignment?: 'left' | 'center' | 'right';
  title_style?: TitleStyle;
  description_style?: DescriptionStyle;
  image_style?: ImageStyle;
  background_style?: BackgroundStyle;
  button_style?: ButtonStyle;
}

export interface HeadingFormProps {
  formData: HeadingFormData;
  onChange: (field: keyof HeadingFormData, value: any) => void;
}

// Text style variants matching TemplateHeadingSection.tsx
export const TEXT_VARIANTS = {
  default: {
    h1: 'text-3xl sm:text-5xl lg:text-7xl font-normal text-gray-800',
    description: 'text-lg font-light text-gray-700',
    button: 'bg-gradient-to-r from-emerald-400 to-teal-500',
    linkColor: 'text-emerald-600 hover:text-emerald-500'
  },
  apple: {
    h1: 'text-4xl sm:text-6xl lg:text-7xl font-light text-gray-900',
    description: 'text-lg font-light text-gray-600',
    button: 'bg-gradient-to-r from-sky-500 to-blue-500',
    linkColor: 'text-sky-600 hover:text-sky-500'
  },
  codedharmony: {
    h1: 'text-3xl sm:text-5xl lg:text-6xl font-thin text-gray-900 tracking-tight leading-none',
    description: 'text-lg sm:text-xl text-gray-500 font-light leading-relaxed',
    button: 'bg-gradient-to-r from-indigo-500 to-purple-500',
    linkColor: 'text-indigo-600 hover:text-indigo-500'
  }
} as const;
