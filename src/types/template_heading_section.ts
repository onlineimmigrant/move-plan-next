// /app/types/template_heading_section.ts

// New JSONB structure types
export interface TemplateHeadingSectionContent {
  title: string;
  description?: string;
  image?: string;
  button?: {
    text?: string;
    url?: string;
    is_text_link: boolean;
  };
}

export interface TemplateHeadingSectionTranslations {
  name?: Record<string, string>;
  description?: Record<string, string>;
  button_text?: Record<string, string>;
}

export interface TemplateHeadingSectionStyle {
  background_color: string;
  title: {
    color?: string;
    size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
    font: 'sans' | 'serif' | 'mono' | 'display';
    weight: 'light' | 'normal' | 'medium' | 'semibold' | 'bold';
  };
  description: {
    color?: string;
    size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
    font: 'sans' | 'serif' | 'mono';
    weight: 'light' | 'normal' | 'medium' | 'semibold';
  };
  button: {
    color?: string;
    text_color: string;
  };
  alignment: 'left' | 'center' | 'right';
  image_first: boolean;
  image_style: 'default' | 'contained' | 'full_width' | 'circle';
  gradient?: {
    enabled: boolean;
    config?: any;
  };
}

export interface TemplateHeadingSection {
  id: string;
  comment?: string;
  order?: number;
  url_page: string;
  organization_id: string | null;
  updated_at?: string;
  content: TemplateHeadingSectionContent;
  translations: TemplateHeadingSectionTranslations;
  style: TemplateHeadingSectionStyle;
}