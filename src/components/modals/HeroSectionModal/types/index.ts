/**
 * HeroSection Modal Types
 * 
 * Centralized type definitions for Hero Section editing
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
  alignment?: string;
  blockWidth?: string;
  blockColumns?: number;
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
  fullPage?: boolean;
  height?: number;
  width?: number;
}

export interface BackgroundStyle {
  color?: string;
  is_gradient?: boolean;
  gradient?: {
    from: string;
    via?: string;
    to: string;
  };
  seo_title?: string;
  column?: number;
}

export interface ButtonStyle {
  aboveDescription?: boolean;
  isVideo?: boolean;
  url?: string;
  color?: string;
  gradient?: {
    from: string;
    via?: string;
    to: string;
  };
}

export interface TranslationFields {
  [languageCode: string]: string;
}

export interface HeroFormData {
  title: string;
  description: string;
  button?: string;
  image?: string | null;
  animation_element?: string;
  title_style: TitleStyle;
  description_style: DescriptionStyle;
  image_style: ImageStyle;
  background_style: BackgroundStyle;
  button_style: ButtonStyle;
  title_translation?: TranslationFields;
  description_translation?: TranslationFields;
  button_translation?: TranslationFields;
}

export interface HeroFormProps {
  formData: HeroFormData;
  onChange: (field: keyof HeroFormData, value: any) => void;
}
