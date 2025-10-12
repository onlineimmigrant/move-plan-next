import React from 'react';
import { TextField, TextAreaField, SelectField, CheckboxField } from './FormField';
import { ColorSelect } from './ColorSelect';
import { AnimationSelect } from './AnimationSelect';
import { ImageUploadField } from './ImageUploadField';
import { MultiLanguageSelect, SingleLanguageSelect } from './LanguageSelect';
import { OrganizationTypeSelect } from './OrganizationTypeSelect';
import { TranslationsField } from './TranslationsField';
import { AlignmentSelect } from './AlignmentSelect';
import { TextSizeSelect } from './TextSizeSelect';
import { TextWeightSelect } from './TextWeightSelect';
import { BlockWidthSelect } from './BlockWidthSelect';
import { ColumnsSelect } from './ColumnsSelect';
import { MenuItemsSelect } from './MenuItemsSelect';
import { BlogPostsSelect } from './BlogPostsSelect';
import { ProductSelect } from './ProductSelect';
import { FeatureSelect } from './FeatureSelect';
import { FAQSelect } from './FAQSelect';
import { BannerSelect } from './BannerSelect';
import { FooterStyleField } from './FooterStyleField';
import { HeaderStyleField } from './HeaderStyleField';
// Cookie Management components
import { CookieCategoriesSelect } from './CookieCategoriesSelect';
import { CookieServicesSelect } from './CookieServicesSelect';
import { CookieConsentRecordsSelect } from './CookieConsentRecordsSelectSimple';
import { CookieConsentSelect } from './CookieConsentSelect';
import { AIAgentsSelect } from './AIAgentsSelect';
import { Settings, organizationTypes } from './types';

interface SubSectionConfig {
  title: string;
  key: string;
  fields: FieldConfig[];
  columns?: number; // Number of columns for grid layout
}

interface SectionConfig {
  title: string;
  key: string;
  fields?: FieldConfig[];
  subsections?: SubSectionConfig[];
  columns?: number; // Number of columns for grid layout
}

interface BaseFieldConfig {
  name: keyof Settings;
  label: string;
  type: 'text' | 'email' | 'tel' | 'url' | 'textarea' | 'select' | 'checkbox' | 'color' | 'animation' | 'image' | 'multi-language' | 'single-language' | 'organization-type' | 'translations' | 'alignment' | 'text-size' | 'text-weight' | 'block-width' | 'columns' | 'menu-items' | 'blog-posts' | 'products' | 'features' | 'faqs' | 'banners' | 'cookie-consent' | 'cookie-categories' | 'cookie-services' | 'cookie-consent-records' | 'ai-agents' | 'footer-style' | 'header-style';
  placeholder?: string;
  span?: 'full' | 'half';
  disabled?: boolean;
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

interface AnimationFieldConfig extends BaseFieldConfig {
  type: 'animation';
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
  supportedLanguagesField?: keyof Settings; // Field name that contains supported languages
}

interface AlignmentFieldConfig extends BaseFieldConfig {
  type: 'alignment';
}

interface TextSizeFieldConfig extends BaseFieldConfig {
  type: 'text-size';
}

interface TextWeightFieldConfig extends BaseFieldConfig {
  type: 'text-weight';
}

interface BlockWidthFieldConfig extends BaseFieldConfig {
  type: 'block-width';
}

interface ColumnsFieldConfig extends BaseFieldConfig {
  type: 'columns';
}

interface MenuItemsFieldConfig extends BaseFieldConfig {
  type: 'menu-items';
}

interface BlogPostsFieldConfig extends BaseFieldConfig {
  type: 'blog-posts';
}

interface ProductsFieldConfig extends BaseFieldConfig {
  type: 'products';
}

interface FeaturesFieldConfig extends BaseFieldConfig {
  type: 'features';
}

interface FAQsFieldConfig extends BaseFieldConfig {
  type: 'faqs';
}

interface BannersFieldConfig extends BaseFieldConfig {
  type: 'banners';
}

interface CookieConsentFieldConfig extends BaseFieldConfig {
  type: 'cookie-consent';
}

interface CookieCategoriesFieldConfig extends BaseFieldConfig {
  type: 'cookie-categories';
}

interface CookieServicesFieldConfig extends BaseFieldConfig {
  type: 'cookie-services';
}

interface CookieConsentRecordsFieldConfig extends BaseFieldConfig {
  type: 'cookie-consent-records';
}

interface AIAgentsFieldConfig extends BaseFieldConfig {
  type: 'ai-agents';
}

interface FooterStyleFieldConfig extends BaseFieldConfig {
  type: 'footer-style';
}

interface HeaderStyleFieldConfig extends BaseFieldConfig {
  type: 'header-style';
}

export type FieldConfig = TextFieldConfig | TextAreaFieldConfig | SelectFieldConfig | CheckboxFieldConfig | ColorFieldConfig | AnimationFieldConfig | ImageFieldConfig | MultiLanguageFieldConfig | SingleLanguageFieldConfig | OrganizationTypeFieldConfig | TranslationsFieldConfig | AlignmentFieldConfig | TextSizeFieldConfig | TextWeightFieldConfig | BlockWidthFieldConfig | ColumnsFieldConfig | MenuItemsFieldConfig | BlogPostsFieldConfig | ProductsFieldConfig | FeaturesFieldConfig | FAQsFieldConfig | BannersFieldConfig | CookieConsentFieldConfig | CookieCategoriesFieldConfig | CookieServicesFieldConfig | CookieConsentRecordsFieldConfig | AIAgentsFieldConfig | FooterStyleFieldConfig | HeaderStyleFieldConfig;

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

export const aiModelOptions = [
  { name: 'Select AI Model', value: '' },
  { name: 'GPT-4', value: 'gpt-4' },
  { name: 'GPT-3.5 Turbo', value: 'gpt-3.5-turbo' },
  { name: 'Claude 3 Opus', value: 'claude-3-opus' },
  { name: 'Claude 3 Sonnet', value: 'claude-3-sonnet' },
  { name: 'Gemini Pro', value: 'gemini-pro' }
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
  { name: '6XL', value: 'text-6xl' },
  { name: '7XL', value: 'text-7xl' }
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
    title: 'General',
    key: 'general',
    subsections: [
      {
        title: 'Organization Details',
        key: 'organization',
        columns: 2,
        fields: [
          { name: 'name', label: 'Organization Name', type: 'text', placeholder: 'Enter organization name' },
          { name: 'site', label: 'Site Title', type: 'text', placeholder: 'Enter your site title' },
          { name: 'type', label: 'Organization Type', type: 'organization-type' },
          { name: 'base_url', label: 'Base URL (Auto-managed by Vercel)', type: 'url', placeholder: 'https://your-site.vercel.app', disabled: true }
          // { name: 'base_url_local', label: 'Local URL', type: 'url', placeholder: 'http://localhost:3100'}
        ]
      },
            {
        title: 'SEO Settings',
        key: 'seo',
        columns: 2,
        fields: [
          { name: 'seo_title', label: 'SEO Title', type: 'text', placeholder: 'Page title for search engines' },
          { name: 'seo_description', label: 'SEO Description', type: 'textarea', rows: 2, placeholder: 'Meta description for search engines' },
          { name: 'seo_keywords', label: 'SEO Keywords', type: 'textarea', rows: 1, placeholder: 'keyword1, keyword2, keyword3' }
        ]
      },
      {
        title: 'Analytics',
        key: 'analytics',
        columns: 2,
        fields: [
          { name: 'google_tag', label: 'Google Tag Manager ID', type: 'text', placeholder: 'GTM-XXXXXXX' },
          { name: 'google_analytics_id', label: 'Google Analytics ID', type: 'text', placeholder: 'GA-XXXXXXXXX-X' }
        ]
      },
      {
        title: 'Language & Localization',
        key: 'language',
        columns: 2,
        fields: [
          { name: 'supported_locales', label: 'Supported Languages', type: 'multi-language' },
          { name: 'language', label: 'Default Language', type: 'single-language', supportedLanguagesField: 'supported_locales' },
          { name: 'with_language_switch', label: 'Enable Language Switcher', type: 'checkbox' }
        ]
      },

      {
        title: 'Contact Information',
        key: 'contact',
        columns: 2,
        fields: [
          { name: 'contact_email', label: 'Contact Email', type: 'email', placeholder: 'contact@yoursite.com' },
          { name: 'contact_phone', label: 'Contact Phone', type: 'tel', placeholder: '+1 (555) 123-4567' }
        ]
      }
    ]
  },
  {
    title: 'Layout & Design',
    key: 'layout',
    subsections: [
      {
        title: 'Typography & Colors',
        key: 'typography',
        columns: 1,
        fields: [
          { name: 'font_family', label: 'Font', type: 'text', placeholder: 'e.g., SF Pro Display, Inter, Arial' },
           { name: 'primary_color', label: 'Primary Color', type: 'color' },
          { name: 'secondary_color', label: 'Secondary Color', type: 'color' }
        ]
      },

      {
        title: 'Images',
        key: 'images',
        columns: 2,
        fields: [
          { name: 'image', label: 'Logo', type: 'image', field: 'image' },
          { name: 'favicon', label: 'Favicon', type: 'image', field: 'favicon' }
        ]
      },

            {
        title: 'Header Settings',
        key: 'header-settings',
        columns: 2,
        fields: [
          { name: 'header_style', label: 'Header Style', type: 'select', options: headerStyleOptions },
          { name: 'menu_width', label: 'Menu Width', type: 'select', options: menuWidthOptions },
          { name: 'menu_items_are_text', label: 'Text-only Menu Items', type: 'checkbox' }
        ]
      },
      {
        title: 'Menu Items',
        key: 'menu-items',
        columns: 1,
        fields: [
          { name: 'menu_items', label: '', type: 'menu-items', span: 'full' }
        ]
      },
      {
        title: 'Footer Settings',
        key: 'footer-settings',
        columns: 1,
        fields: [
          { name: 'footer_style', label: 'Footer Style', type: 'footer-style' }
        ]
      }
    ]
  },
  
  {
    title: 'Hero Section',
    key: 'hero',
    columns: 4, // Increase to 4 columns for better organization
    subsections: [
      {
        title: 'General',
        key: 'general',
        columns: 3, // Change to 3 columns for alignment, width, and columns
        fields: [
          { name: 'title_alighnement', label: 'Alignment', type: 'alignment' },
          { name: 'title_block_width', label: 'Width', type: 'block-width' },
          { name: 'title_block_columns', label: 'Columns', type: 'columns' },
          { name: 'is_seo_title', label: 'Use Title as SEO Title', type: 'checkbox' }
        ]
      },
      {
        title: 'Title',
        key: 'title',
        columns: 2, // Keep 2 columns for most fields, color fields will use 4 via special handling
        fields: [
          { name: 'h1_title', label: 'Hero Title', type: 'text', placeholder: 'Enter your main headline', span: 'full' },
          { name: 'h1_title_translation', label: 'Title Translations', type: 'translations', span: 'full', supportedLanguagesField: 'supported_locales' },
          { name: 'h1_text_size', label: 'Size (Desktop)', type: 'text-size' },
          { name: 'h1_text_size_mobile', label: 'Size (Mobile)', type: 'text-size' },
          { name: 'h1_text_color', label: 'Color', type: 'color' },
          { name: 'is_h1_gradient_text', label: 'Use Gradient', type: 'checkbox' },
          { name: 'h1_text_color_gradient_from', label: 'From', type: 'color' },
          { name: 'h1_text_color_gradient_to', label: 'To', type: 'color' },
          { name: 'h1_text_color_gradient_via', label: 'Via', type: 'color' }
        ]
      },
      {
        title: 'Description',
        key: 'description',
        columns: 2,
        fields: [
          { name: 'p_description', label: 'Description Text', type: 'textarea', rows: 3, placeholder: 'Enter hero description', span: 'full' },
          { name: 'p_description_translation', label: 'Description Translations', type: 'translations', span: 'full', supportedLanguagesField: 'supported_locales' },
          { name: 'p_description_size', label: 'Size (Desktop)', type: 'text-size' },
          { name: 'p_description_size_mobile', label: 'Size (Mobile)', type: 'text-size' },
          { name: 'p_description_weight', label: 'Weight', type: 'text-weight' },
          { name: 'p_description_color', label: 'Color', type: 'color' }
        ]
      },
      {
        title: 'Buttons',
        key: 'buttons',
        fields: [
          { name: 'button_main_get_started', label: 'Main Button Text', type: 'text', placeholder: 'Get Started' },
          { name: 'button_explore', label: 'Secondary Button Text', type: 'text', placeholder: 'Explore' }
        ]
      },
      {
        title: 'Image',
        key: 'image',
        fields: [
          { name: 'hero_image', label: 'Hero Image', type: 'image', field: 'hero_image' },
          { name: 'is_image_full_page', label: 'Full Page Background Image', type: 'checkbox' },
          { name: 'image_first', label: 'Show Image First (on mobile)', type: 'checkbox' }
        ]
      },
      {
        title: 'Background & Animation',
        key: 'background',
        columns: 2,
        fields: [
          { name: 'background_color', label: 'Background Color', type: 'color' },
          { name: 'is_bg_gradient', label: 'Use Gradient', type: 'checkbox' },
          { name: 'background_color_gradient_from', label: 'From', type: 'color' },
          { name: 'background_color_gradient_to', label: 'To', type: 'color' },
          { name: 'background_color_gradient_via', label: 'Via', type: 'color' },
          { 
            name: 'animation_element', 
            label: 'Animation', 
            type: 'animation', span: 'full'
          }
        ]
      }
    ]
  },

  {
    title: 'Content Management',
    key: 'content',
    subsections: [
      {
        title: 'Blog Posts',
        key: 'blog-posts',
        columns: 1,
        fields: [
          { name: 'blog_posts', label: 'Blog Posts', type: 'blog-posts', span: 'full' }
        ]
      },
      {
        title: 'Products',
        key: 'products',
        columns: 1,
        fields: [
          { name: 'products', label: 'Products', type: 'products', span: 'full' }
        ]
      },
      {
        title: 'Features',
        key: 'features',
        columns: 1,
        fields: [
          { name: 'features', label: 'Features', type: 'features', span: 'full' }
        ]
      },
      {
        title: 'FAQs',
        key: 'faqs',
        columns: 1,
        fields: [
          { name: 'faqs', label: 'FAQs', type: 'faqs', span: 'full' }
        ]
      },
      {
        title: 'Banners',
        key: 'banners',
        columns: 1,
        fields: [
          { name: 'banners', label: 'Banners', type: 'banners', span: 'full' }
        ]
      }
    ]
  },

  {
    title: 'Consent Management',
    key: 'consent',
    subsections: [
      {
        title: 'Cookie Categories',
        key: 'cookie-categories',
        columns: 1,
        fields: [
          { name: 'cookie_categories', label: 'Global Cookie Categories', type: 'cookie-categories', span: 'full' }
        ]
      },
      {
        title: 'Cookie Services',
        key: 'cookie-services',
        columns: 1,
        fields: [
          { name: 'cookie_services', label: 'Organization Cookie Services', type: 'cookie-services', span: 'full' }
        ]
      },
      {
        title: 'Consent Records',
        key: 'cookie-consent',
        columns: 1,
        fields: [
          { name: 'cookie_consent_records', label: 'User Consent History', type: 'cookie-consent-records', span: 'full' }
        ]
      }
    ]
  },
  {
    title: 'AI Management',
    key: 'ai-management',
    subsections: [
      {
        title: 'AI Agents',
        key: 'ai-agents',
        columns: 1,
        fields: [
          { name: 'ai_agents', label: 'AI Agents', type: 'ai-agents', span: 'full' }
        ]
      }
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
  readOnly?: boolean;
}

export const renderField = ({ 
  field, 
  value, 
  onChange, 
  onImageUpload, 
  uploadingImages,
  allSettings,
  readOnly = false
}: RenderFieldProps): React.ReactElement | null => {
  const handleChange = (name: string, newValue: any) => {
    console.log('🔧 fieldConfig handleChange called:', { name, newValue, readOnly });
    if (!readOnly) {
      console.log('🔧 fieldConfig calling parent onChange');
      onChange(name, newValue);
      console.log('🔧 fieldConfig parent onChange called');
    } else {
      console.log('🔧 fieldConfig blocked by readOnly');
    }
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
          disabled={field.disabled || readOnly}
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
          disabled={readOnly}
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
          disabled={readOnly}
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
          disabled={readOnly}
        />
      );
    
    case 'color':
      return (
        <div className={readOnly ? 'opacity-60 pointer-events-none' : ''}>
          <ColorSelect
            label={field.label}
            name={field.name}
            value={value || '#6b7280'}
            onChange={handleChange}
          />
        </div>
      );
      
    case 'animation':
      return (
        <div className={readOnly ? 'opacity-60 pointer-events-none' : ''}>
          <AnimationSelect
            label={field.label}
            name={field.name}
            value={value || ''}
            onChange={handleChange}
          />
        </div>
      );
    
    case 'image':
      if (!onImageUpload || !uploadingImages) return null;
      return (
        <div className={readOnly ? 'opacity-60 pointer-events-none' : ''}>
          <ImageUploadField
            label={field.label}
            field={(field as ImageFieldConfig).field}
            value={value}
            onChange={onChange}
            onImageUpload={onImageUpload}
            uploadingImages={uploadingImages}
          />
        </div>
      );
    
    case 'multi-language':
      return (
        <div className={readOnly ? 'opacity-60 pointer-events-none' : ''}>
          <MultiLanguageSelect
            label={field.label}
            name={field.name}
            value={Array.isArray(value) ? value : (value ? [value] : ['en'])}
            onChange={handleChange}
          />
        </div>
      );
    
    case 'single-language':
      const supportedLanguagesField = (field as SingleLanguageFieldConfig).supportedLanguagesField;
      const supportedLanguages = allSettings?.[supportedLanguagesField] || ['en'];
      return (
        <div className={readOnly ? 'opacity-60 pointer-events-none' : ''}>
          <SingleLanguageSelect
            label={field.label}
            name={field.name}
            value={value || 'en'}
            supportedLanguages={Array.isArray(supportedLanguages) ? supportedLanguages : ['en']}
            onChange={handleChange}
          />
        </div>
      );
    
    case 'organization-type':
      // Disable organization type field for platform organizations to prevent losing privileges
      const isPlatformOrg = (value || allSettings?.type) === 'platform';
      return (
        <OrganizationTypeSelect
          label={field.label}
          name={field.name}
          value={value || 'services'}
          onChange={handleChange}
          disabled={isPlatformOrg || readOnly}
        />
      );
    
    case 'translations':
      const translationsSupportedLanguagesField = (field as TranslationsFieldConfig).supportedLanguagesField || 'supported_locales';
      const translationsSupportedLanguages = allSettings?.[translationsSupportedLanguagesField] || ['en'];
      
      return (
        <div className={readOnly ? 'opacity-60 pointer-events-none' : ''}>
          <TranslationsField
            field={field}
            value={value || {}}
            onChange={handleChange}
            supportedLanguages={Array.isArray(translationsSupportedLanguages) ? translationsSupportedLanguages : ['en']}
          />
        </div>
      );
    
    case 'alignment':
      return (
        <div className={readOnly ? 'opacity-60 pointer-events-none' : ''}>
          <AlignmentSelect
            label={field.label}
            name={field.name}
            value={value || 'left'}
            onChange={handleChange}
          />
        </div>
      );
    
    case 'text-size':
      return (
        <div className={readOnly ? 'opacity-60 pointer-events-none' : ''}>
          <TextSizeSelect
            label={field.label}
            name={field.name}
            value={value || 'text-base'}
            onChange={handleChange}
          />
        </div>
      );
    
    case 'text-weight':
      return (
        <div className={readOnly ? 'opacity-60 pointer-events-none' : ''}>
          <TextWeightSelect
            label={field.label}
            name={field.name}
            value={value || 'normal'}
            onChange={handleChange}
          />
        </div>
      );
    
    case 'block-width':
      return (
        <div className={readOnly ? 'opacity-60 pointer-events-none' : ''}>
          <BlockWidthSelect
            label={field.label}
            name={field.name}
            value={value || 'full'}
            onChange={handleChange}
          />
        </div>
      );
    
    case 'columns':
      return (
        <div className={readOnly ? 'opacity-60 pointer-events-none' : ''}>
          <ColumnsSelect
            label={field.label}
            name={field.name}
            value={value || '1'}
            onChange={handleChange}
          />
        </div>
      );
    
    case 'menu-items':
      const submenuItems = allSettings?.submenu_items || [];
      return (
        <div className={readOnly ? 'opacity-60 pointer-events-none' : ''}>
          <MenuItemsSelect
            label={field.label}
            name={field.name}
            value={Array.isArray(value) ? value : []}
            submenuItems={Array.isArray(submenuItems) ? submenuItems : []}
            onChange={handleChange}
            onSubmenuChange={(submenuItems) => handleChange('submenu_items', submenuItems)}
          />
        </div>
      );
    
    case 'blog-posts':
      return (
        <div className={readOnly ? 'opacity-60 pointer-events-none' : ''}>
          <BlogPostsSelect
            label={field.label}
            name={field.name}
            value={Array.isArray(value) ? value : []}
            onChange={handleChange}
          />
        </div>
      );
    
    case 'products':
      return (
        <div className={readOnly ? 'opacity-60 pointer-events-none' : ''}>
          <ProductSelect
            label={field.label}
            name={field.name}
            value={Array.isArray(value) ? value : []}
            onChange={handleChange}
            pricingPlans={Array.isArray(allSettings?.pricing_plans) ? allSettings.pricing_plans : []}
            onPricingPlansChange={(plans) => handleChange('pricing_plans', plans)}
          />
        </div>
      );
    
    case 'features':
      return (
        <div className={readOnly ? 'opacity-60 pointer-events-none' : ''}>
          <FeatureSelect
            label={field.label}
            name={field.name}
            value={Array.isArray(value) ? value : []}
            onChange={handleChange}
          />
        </div>
      );
    
    case 'faqs':
      return (
        <div className={readOnly ? 'opacity-60 pointer-events-none' : ''}>
          <FAQSelect
            label={field.label}
            name={field.name}
            value={Array.isArray(value) ? value : []}
            onChange={handleChange}
          />
        </div>
      );
    
    case 'banners':
      return (
        <div className={readOnly ? 'opacity-60 pointer-events-none' : ''}>
          <BannerSelect
            name={field.name}
            value={Array.isArray(value) ? value : []}
            onChange={(fieldName, banners) => handleChange(fieldName, banners)}
          />
        </div>
      );
    
    case 'cookie-consent':
      return (
        <div className={readOnly ? 'opacity-60 pointer-events-none' : ''}>
          <CookieConsentSelect
            value={Array.isArray(value) ? value : []}
            onChange={(categories) => handleChange(field.name, categories)}
          />
        </div>
      );

    case 'cookie-categories':
      console.log('🍪 Rendering cookie-categories, allSettings:', allSettings);
      return (
        <div className={readOnly ? 'opacity-60 pointer-events-none' : ''}>
          <CookieCategoriesSelect
            value={allSettings?.cookie_categories || []}
            onChange={(categories: any) => handleChange(field.name, categories)}
          />
        </div>
      );

    case 'cookie-services':
      console.log('🍪 Rendering cookie-services, allSettings:', allSettings);
      const cookieServicesCount = Array.isArray(allSettings?.cookie_services) ? allSettings.cookie_services.length : 0;
      console.log('🍪 Cookie services count for passing:', cookieServicesCount);
      return (
        <div className={readOnly ? 'opacity-60 pointer-events-none' : ''}>
          <CookieServicesSelect
            value={allSettings?.cookie_services || []}
            onChange={(services: any) => handleChange(field.name, services)}
            availableCategories={allSettings?.cookie_categories || []}
          />
        </div>
      );

    case 'cookie-consent-records':
      console.log('🍪 Rendering cookie-consent-records, allSettings:', allSettings);
      return (
        <div className={readOnly ? 'opacity-60 pointer-events-none' : ''}>
          <CookieConsentRecordsSelect
            value={allSettings?.cookie_consent_records || []}
            onChange={(records: any) => handleChange(field.name, records)}
          />
        </div>
      );

    case 'ai-agents':
      return (
        <div className={readOnly ? 'opacity-60 pointer-events-none' : ''}>
          <AIAgentsSelect
            value={Array.isArray(allSettings?.ai_agents) ? allSettings.ai_agents : []}
            onChange={(agents: any) => handleChange(field.name, agents)}
            organizationId={allSettings?.organization_id}
            session={allSettings?.session}
          />
        </div>
      );

    case 'footer-style':
      return (
        <div className={readOnly ? 'opacity-60 pointer-events-none' : ''}>
          <FooterStyleField
            label={field.label}
            name={field.name}
            value={value}
            onChange={handleChange}
          />
        </div>
      );

    case 'header-style':
      return (
        <div className={readOnly ? 'opacity-60 pointer-events-none' : ''}>
          <HeaderStyleField
            label={field.label}
            name={field.name}
            value={value}
            onChange={handleChange}
          />
        </div>
      );

    default:
      return null;
  }
};
