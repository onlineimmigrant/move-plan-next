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
  type: 'text' | 'email' | 'tel' | 'url' | 'textarea' | 'select' | 'checkbox' | 'color' | 'animation' | 'image' | 'multi-language' | 'single-language' | 'organization-type' | 'translations' | 'alignment' | 'text-size' | 'text-weight' | 'block-width' | 'columns' | 'menu-items' | 'blog-posts' | 'products';
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

export type FieldConfig = TextFieldConfig | TextAreaFieldConfig | SelectFieldConfig | CheckboxFieldConfig | ColorFieldConfig | AnimationFieldConfig | ImageFieldConfig | MultiLanguageFieldConfig | SingleLanguageFieldConfig | OrganizationTypeFieldConfig | TranslationsFieldConfig | AlignmentFieldConfig | TextSizeFieldConfig | TextWeightFieldConfig | BlockWidthFieldConfig | ColumnsFieldConfig | MenuItemsFieldConfig | BlogPostsFieldConfig | ProductsFieldConfig;

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
    title: 'Basic Information',
    key: 'basic',
    subsections: [
      {
        title: 'Organization Details',
        key: 'organization',
        columns: 2,
        fields: [
          { name: 'name', label: 'Organization Name', type: 'text', placeholder: 'Enter organization name' },
          { name: 'site', label: 'Site Title', type: 'text', placeholder: 'Enter your site title' },
          { name: 'type', label: 'Organization Type', type: 'organization-type' }
        ]
      },
      {
        title: 'URLs',
        key: 'urls',
        columns: 2,
        fields: [
          { name: 'base_url', label: 'Base URL (Vercel Address)', type: 'url', placeholder: 'https://your-site.vercel.app'},
          { name: 'base_url_local', label: 'Local URL', type: 'url', placeholder: 'http://localhost:3100'}
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
        title: 'Typography',
        key: 'typography',
        columns: 1,
        fields: [
          { name: 'font_family', label: 'Font', type: 'text', placeholder: 'e.g., SF Pro Display, Inter, Arial' }
        ]
      },
      {
        title: 'Colors',
        key: 'colors',
        columns: 2,
        fields: [
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
      }
    ]
  },
  {
    title: 'SEO & Languages',
    key: 'seo',
    subsections: [
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
    title: 'Header & Footer',
    key: 'menu',
    subsections: [
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
          { name: 'footer_color', label: 'Footer Color', type: 'color' }
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
      
    case 'animation':
      return (
        <AnimationSelect
          label={field.label}
          name={field.name}
          value={value || ''}
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
      const translationsSupportedLanguagesField = (field as TranslationsFieldConfig).supportedLanguagesField || 'supported_locales';
      const translationsSupportedLanguages = allSettings?.[translationsSupportedLanguagesField] || ['en'];
      
      return (
        <TranslationsField
          field={field}
          value={value || {}}
          onChange={handleChange}
          supportedLanguages={Array.isArray(translationsSupportedLanguages) ? translationsSupportedLanguages : ['en']}
        />
      );
    
    case 'alignment':
      return (
        <AlignmentSelect
          label={field.label}
          name={field.name}
          value={value || 'left'}
          onChange={handleChange}
        />
      );
    
    case 'text-size':
      return (
        <TextSizeSelect
          label={field.label}
          name={field.name}
          value={value || 'text-base'}
          onChange={handleChange}
        />
      );
    
    case 'text-weight':
      return (
        <TextWeightSelect
          label={field.label}
          name={field.name}
          value={value || 'normal'}
          onChange={handleChange}
        />
      );
    
    case 'block-width':
      return (
        <BlockWidthSelect
          label={field.label}
          name={field.name}
          value={value || 'full'}
          onChange={handleChange}
        />
      );
    
    case 'columns':
      return (
        <ColumnsSelect
          label={field.label}
          name={field.name}
          value={value || '1'}
          onChange={handleChange}
        />
      );
    
    case 'menu-items':
      const submenuItems = allSettings?.submenu_items || [];
      return (
        <MenuItemsSelect
          label={field.label}
          name={field.name}
          value={Array.isArray(value) ? value : []}
          submenuItems={Array.isArray(submenuItems) ? submenuItems : []}
          onChange={handleChange}
          onSubmenuChange={(submenuItems) => handleChange('submenu_items', submenuItems)}
        />
      );
    
    case 'blog-posts':
      return (
        <BlogPostsSelect
          label={field.label}
          name={field.name}
          value={Array.isArray(value) ? value : []}
          onChange={handleChange}
        />
      );
    
    case 'products':
      return (
        <ProductSelect
          label={field.label}
          name={field.name}
          value={Array.isArray(value) ? value : []}
          onChange={handleChange}
        />
      );
    
    default:
      return null;
  }
};
