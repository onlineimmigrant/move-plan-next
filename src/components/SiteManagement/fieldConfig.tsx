import React from 'react';
import { TextField, TextAreaField, SelectField, CheckboxField } from './FormField';
import { ColorSelect } from './ColorSelect';
import { ImageUploadField } from './ImageUploadField';
import { MultiLanguageSelect, SingleLanguageSelect } from './LanguageSelect';
import { OrganizationTypeSelect } from './OrganizationTypeSelect';
import { TranslationsField } from './TranslationsField';
import { Settings, organizationTypes } from './types';

interface SectionConfig {
  title: string;
  key: string;
  fields: FieldConfig[];
}

interface BaseFieldConfig {
  name: keyof Settings;
  label: string;
  type: 'text' | 'email' | 'tel' | 'url' | 'textarea' | 'select' | 'checkbox' | 'color' | 'image' | 'multi-language' | 'single-language' | 'organization-type' | 'translations';
  placeholder?: string;
  span?: 'full' | 'half';
}

interface TextFieldConfig extends BaseFieldConfig {
  type: 'text' | 'email' | 'tel' | 'url';
}

interface TextAreaFieldConfig extends BaseFieldConfig {
  type: 'textarea';
  rows?: number;
}

interface SelectFieldConfig extends BaseFieldConfig {
  type: 'select';
  options: Array<{ name: string; value: string }>;
}

interface CheckboxFieldConfig extends BaseFieldConfig {
  type: 'checkbox';
}

interface ColorFieldConfig extends BaseFieldConfig {
  type: 'color';
}

interface ImageFieldConfig extends BaseFieldConfig {
  type: 'image';
  field: 'image' | 'favicon' | 'hero_image';
}

interface MultiLanguageFieldConfig extends BaseFieldConfig {
  type: 'multi-language';
}

interface SingleLanguageFieldConfig extends BaseFieldConfig {
  type: 'single-language';
  supportedLanguagesField: keyof Settings; // Field name that contains supported languages
}

interface OrganizationTypeFieldConfig extends BaseFieldConfig {
  type: 'organization-type';
}

interface TranslationsFieldConfig extends BaseFieldConfig {
  type: 'translations';
}

export type FieldConfig = TextFieldConfig | TextAreaFieldConfig | SelectFieldConfig | CheckboxFieldConfig | ColorFieldConfig | ImageFieldConfig | MultiLanguageFieldConfig | SingleLanguageFieldConfig | OrganizationTypeFieldConfig | TranslationsFieldConfig;

export const menuWidthOptions = [
  { name: 'Small', value: 'sm' },
  { name: 'Large', value: 'lg' },
  { name: 'Extra Large', value: 'xl' },
  { name: '2X Large', value: '2xl' },
  { name: '3X Large', value: '3xl' },
  { name: '4X Large', value: '4xl' },
  { name: '5X Large', value: '5xl' },
  { name: '7X Large', value: '7xl' },
  { name: 'Full Width', value: 'full' }
];

export const headerStyleOptions = [
  { name: 'Default', value: 'default' },
  { name: 'Minimal', value: 'minimal' },
  { name: 'Centered', value: 'centered' },
  { name: 'Sidebar', value: 'sidebar' }
];

export const textSizeOptions = [
  { name: 'Extra Small', value: 'text-xs' },
  { name: 'Small', value: 'text-sm' },
  { name: 'Base', value: 'text-base' },
  { name: 'Large', value: 'text-lg' },
  { name: 'Extra Large', value: 'text-xl' },
  { name: '2XL', value: 'text-2xl' },
  { name: '3XL', value: 'text-3xl' },
  { name: '4XL', value: 'text-4xl' },
  { name: '5XL', value: 'text-5xl' },
  { name: '6XL', value: 'text-6xl' }
];

export const textWeightOptions = [
  { name: 'Light', value: 'light' },
  { name: 'Normal', value: 'normal' },
  { name: 'Medium', value: 'medium' },
  { name: 'Semibold', value: 'semibold' },
  { name: 'Bold', value: 'bold' }
];

export const alignmentOptions = [
  { name: 'Left', value: 'left' },
  { name: 'Center', value: 'center' },
  { name: 'Right', value: 'right' }
];

export const blockWidthOptions = [
  { name: 'Full Width', value: 'full' },
  { name: '1/2 Width', value: '1/2' },
  { name: '1/3 Width', value: '1/3' },
  { name: '2/3 Width', value: '2/3' },
  { name: '1/4 Width', value: '1/4' },
  { name: '3/4 Width', value: '3/4' }
];

export const animationOptions = [
  { name: 'None', value: 'none' },
  { name: 'Fade In', value: 'fadeIn' },
  { name: 'Slide Up', value: 'slideUp' },
  { name: 'Slide Down', value: 'slideDown' },
  { name: 'Slide Left', value: 'slideLeft' },
  { name: 'Slide Right', value: 'slideRight' }
];

export const sectionsConfig: SectionConfig[] = [
  {
    title: 'Basic Information',
    key: 'basic',
    fields: [
      { name: 'name', label: 'Organization Name', type: 'text', placeholder: 'Enter organization name' },
      { name: 'site', label: 'Site Title', type: 'text', placeholder: 'Enter your site title' },
      { name: 'base_url', label: 'Base URL (Vercel Address)', type: 'url', placeholder: 'https://your-site.vercel.app'},
      { name: 'base_url_local', label: 'Local URL', type: 'url', placeholder: 'http://localhost:3100'},
      { name: 'type', label: 'Organization Type', type: 'organization-type' },
    ]
  },
  {
    title: 'Layout & Design',
    key: 'layout',
    fields: [
      { name: 'font_family', label: 'Font Family', type: 'text', placeholder: 'e.g., SF Pro Display, Inter, Arial' },
      { name: 'header_style', label: 'Header Style', type: 'select', options: headerStyleOptions },
            { name: 'menu_width', label: 'Menu Width', type: 'select', options: menuWidthOptions },
      { name: 'primary_color', label: 'Primary Color', type: 'color' },
      { name: 'secondary_color', label: 'Secondary Color', type: 'color' },
      { name: 'footer_color', label: 'Footer Color', type: 'color' },


    ]
  },
  {
    title: 'Images',
    key: 'images',
    fields: [
      { name: 'image', label: 'Logo', type: 'image', field: 'image' },
      { name: 'favicon', label: 'Favicon', type: 'image', field: 'favicon' }
    ]
  },
  {
    title: 'Hero Section',
    key: 'hero',
    fields: [
      // Basic Information & Image
      { name: 'hero_image', label: 'Hero Image', type: 'image', field: 'hero_image', span: 'full'  },
      { name: 'is_image_full_page', label: 'Full Page Image', type: 'checkbox' },
      { name: 'image_first', label: 'Image First (on mobile)', type: 'checkbox' },
      
      // Content - Title
      { name: 'h1_title', label: 'Hero Title', type: 'text', placeholder: 'Enter your main headline', span: 'full' },
      { name: 'h1_title_translation', label: 'Hero Title Translations', type: 'translations', span: 'full' },
      { name: 'is_seo_title', label: 'Use as SEO Title', type: 'checkbox' },
      
      // Content - Description  
      { name: 'p_description', label: 'Hero Description', type: 'textarea', rows: 3, placeholder: 'Enter hero description', span: 'full' },
      { name: 'p_description_translation', label: 'Hero Description Translations', type: 'translations', span: 'full' },
      
      // Typography & Font
      { name: 'hero_font_family', label: 'Font Family', type: 'text', placeholder: 'Custom font family' },
      { name: 'title_alighnement', label: 'Title Alignment', type: 'select', options: alignmentOptions },
      
      // Typography - Title Sizing
      { name: 'h1_text_size', label: 'Title Size (Desktop)', type: 'select', options: textSizeOptions },
      { name: 'h1_text_size_mobile', label: 'Title Size (Mobile)', type: 'select', options: textSizeOptions },
      
      // Typography - Description Sizing
      { name: 'p_description_size', label: 'Description Size (Desktop)', type: 'select', options: textSizeOptions },
      { name: 'p_description_size_mobile', label: 'Description Size (Mobile)', type: 'select', options: textSizeOptions },
      { name: 'p_description_weight', label: 'Description Weight', type: 'select', options: textWeightOptions },
      
      // Colors - Title
      { name: 'h1_text_color', label: 'Title Color', type: 'color' },
      { name: 'is_h1_gradient_text', label: 'Use Gradient Text', type: 'checkbox' },
      { name: 'h1_text_color_gradient_from', label: 'Title Gradient From', type: 'color' },
      { name: 'h1_text_color_gradient_to', label: 'Title Gradient To', type: 'color' },
      { name: 'h1_text_color_gradient_via', label: 'Title Gradient Via', type: 'color' },
      
      // Colors - Description
      { name: 'p_description_color', label: 'Description Color', type: 'color' },
      
      // Layout & Structure
      { name: 'title_block_width', label: 'Content Width', type: 'select', options: blockWidthOptions },
      { name: 'title_block_columns', label: 'Content Columns', type: 'select', options: [
        { name: '1 Column', value: '1' },
        { name: '2 Columns', value: '2' },
        { name: '3 Columns', value: '3' }
      ]},
      
      // Background
      { name: 'background_color', label: 'Background Color', type: 'color' },
      { name: 'is_bg_gradient', label: 'Use Background Gradient', type: 'checkbox' },
      { name: 'background_color_gradient_from', label: 'Background Gradient From', type: 'color' },
      { name: 'background_color_gradient_to', label: 'Background Gradient To', type: 'color' },
      { name: 'background_color_gradient_via', label: 'Background Gradient Via', type: 'color' },
      
      // Interactive Elements - Buttons
      { name: 'button_main_get_started', label: 'Main Button Text', type: 'text', placeholder: 'Get Started' },
      { name: 'button_explore', label: 'Secondary Button Text', type: 'text', placeholder: 'Explore' },
      
      // Advanced Options
      { name: 'animation_element', label: 'Animation Element', type: 'text', placeholder: 'CSS animation class or element' }
    ]
  },
  {
    title: 'SEO & Analytics',
    key: 'seo',
    fields: [
      { name: 'seo_title', label: 'SEO Title', type: 'text', placeholder: 'Page title for search engines' },
      { name: 'seo_description', label: 'SEO Description', type: 'textarea', rows: 2, placeholder: 'Meta description for search engines' },
      { name: 'seo_keywords', label: 'SEO Keywords', type: 'textarea', rows: 1, placeholder: 'keyword1, keyword2, keyword3' },
      { name: 'google_tag', label: 'Google Tag Manager ID', type: 'text', placeholder: 'GTM-XXXXXXX' },
                  { name: 'google_analytics_id', label: 'Google Analytics ID', type: 'text', placeholder: 'GA-XXXXXXXXX-X' },
    ]
  },
  {
    title: 'Language & Localization',
    key: 'language',
    fields: [
      { name: 'supported_locales', label: 'Supported Languages', type: 'multi-language' },
      { name: 'language', label: 'Default Language', type: 'single-language', supportedLanguagesField: 'supported_locales' },
      { name: 'with_language_switch', label: 'Enable Language Switcher', type: 'checkbox' },
    ]
  },
  {
    title: 'Contact Information',
    key: 'contact',
    fields: [
      { name: 'contact_email', label: 'Contact Email', type: 'email', placeholder: 'contact@yoursite.com' },
      { name: 'contact_phone', label: 'Contact Phone', type: 'tel', placeholder: '+1 (555) 123-4567' }
    ]
  }
];

interface RenderFieldProps {
  field: FieldConfig;
  value: any;
  onChange: (name: string, value: any) => void;
  onImageUpload?: (field: 'image' | 'favicon' | 'hero_image') => void;
  uploadingImages?: Set<string>;
  allSettings?: any; // For accessing other field values (like supported languages)
}

export const renderField = ({ 
  field, 
  value, 
  onChange, 
  onImageUpload, 
  uploadingImages,
  allSettings 
}: RenderFieldProps): React.ReactElement | null => {
  const handleChange = (name: string, newValue: any) => {
    onChange(name, newValue);
  };

  const getDisplayValue = () => {
    return value;
  };

  switch (field.type) {
    case 'text':
    case 'email':
    case 'tel':
    case 'url':
      return (
        <TextField
          label={field.label}
          name={field.name}
          value={getDisplayValue()}
          onChange={handleChange}
          type={field.type}
          placeholder={field.placeholder}
        />
      );
    
    case 'textarea':
      return (
        <TextAreaField
          label={field.label}
          name={field.name}
          value={value}
          onChange={handleChange}
          rows={(field as TextAreaFieldConfig).rows}
          placeholder={field.placeholder}
        />
      );
    
    case 'select':
      return (
        <SelectField
          label={field.label}
          name={field.name}
          value={value}
          onChange={handleChange}
          options={(field as SelectFieldConfig).options}
        />
      );
    
    case 'checkbox':
      return (
        <CheckboxField
          label={field.label}
          name={field.name}
          value={value}
          checked={Boolean(value)}
          onChange={handleChange}
        />
      );
    
    case 'color':
      return (
        <ColorSelect
          label={field.label}
          name={field.name}
          value={value || '#6b7280'}
          onChange={handleChange}
        />
      );
    
    case 'image':
      if (!onImageUpload || !uploadingImages) return null;
      return (
        <ImageUploadField
          label={field.label}
          field={(field as ImageFieldConfig).field}
          value={value}
          onChange={onChange}
          onImageUpload={onImageUpload}
          uploadingImages={uploadingImages}
        />
      );
    
    case 'multi-language':
      return (
        <MultiLanguageSelect
          label={field.label}
          name={field.name}
          value={Array.isArray(value) ? value : (value ? [value] : ['en'])}
          onChange={handleChange}
        />
      );
    
    case 'single-language':
      const supportedLanguagesField = (field as SingleLanguageFieldConfig).supportedLanguagesField;
      const supportedLanguages = allSettings?.[supportedLanguagesField] || ['en'];
      return (
        <SingleLanguageSelect
          label={field.label}
          name={field.name}
          value={value || 'en'}
          supportedLanguages={Array.isArray(supportedLanguages) ? supportedLanguages : ['en']}
          onChange={handleChange}
        />
      );
    
    case 'organization-type':
      return (
        <OrganizationTypeSelect
          label={field.label}
          name={field.name}
          value={value || 'services'}
          onChange={handleChange}
        />
      );
    
    case 'translations':
      return (
        <TranslationsField
          field={field}
          value={value || {}}
          onChange={handleChange}
        />
      );
    
    default:
      return null;
  }
};
