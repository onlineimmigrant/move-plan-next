/**
 * TemplateHeadingSection Modal Types
 * 
 * Updated for new JSONB structure
 */

export interface HeadingFormData {
  // Content fields
  title: string;
  description: string;
  button_text?: string;
  button_url?: string;
  button_is_text_link: boolean;
  image?: string;
  
  // Style fields
  background_color: string;
  title_color?: string;
  title_size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  title_font: 'sans' | 'serif' | 'mono' | 'display';
  title_weight: 'light' | 'normal' | 'medium' | 'semibold' | 'bold';
  description_color?: string;
  description_size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  description_font: 'sans' | 'serif' | 'mono';
  description_weight: 'light' | 'normal' | 'medium' | 'semibold';
  button_color?: string;
  button_text_color: string;
  alignment: 'left' | 'center' | 'right';
  image_first: boolean;
  image_style: 'default' | 'contained' | 'full_width' | 'circle';
  gradient_enabled: boolean;
  gradient_config?: any;
  
  // Meta fields
  url_page?: string;
  
  // Translation fields
  title_translation?: Record<string, string>;
  description_translation?: Record<string, string>;
  button_text_translation?: Record<string, string>;
}

export interface HeadingFormProps {
  formData: HeadingFormData;
  onChange: (field: keyof HeadingFormData, value: any) => void;
}
