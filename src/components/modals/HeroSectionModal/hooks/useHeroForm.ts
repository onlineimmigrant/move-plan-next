/**
 * useHeroForm Hook
 * 
 * Manages Hero Section form data state and initialization
 */

import { useState, useEffect, useMemo } from 'react';
import { HeroFormData } from '../types';
import { getColorValue } from '@/components/Shared/ColorPaletteDropdown';

const DEFAULT_FORM_DATA: HeroFormData = {
  title: '',
  description: '',
  button: 'Get Started',
  image: '',
  title_style: {
    color: 'gray-800',
    size: { desktop: 'text-7xl', mobile: 'text-5xl' },
    alignment: 'center',
    blockWidth: '2xl',
    blockColumns: 1
  },
  description_style: {
    color: 'gray-600',
    size: { desktop: 'text-2xl', mobile: 'text-lg' },
    weight: 'normal'
  },
  image_style: {
    position: 'right',
    fullPage: false,
    width: 400,
    height: 300
  },
  background_style: {
    color: 'white'
  },
  button_style: {
    aboveDescription: false,
    isVideo: false,
    url: '/products'
  },
  animation_element: '',
};

export function useHeroForm(editingSection: any) {
  const [formData, setFormData] = useState<HeroFormData>(DEFAULT_FORM_DATA);

  // Initialize form data from editing section
  useEffect(() => {
    if (editingSection) {
      const titleStyle = (editingSection as any).title_style || {
        color: (editingSection as any).h1_text_color || 'gray-800',
        is_gradient: (editingSection as any).title_style?.is_gradient || (editingSection as any).is_h1_gradient || false,
        size: {
          desktop: (editingSection as any).h1_text_size || 'text-7xl',
          mobile: (editingSection as any).h1_text_size_mobile || 'text-5xl'
        },
        alignment: (editingSection as any).title_alighnement || 'center',
        blockWidth: (editingSection as any).title_block_width || '2xl',
        blockColumns: (editingSection as any).title_block_columns || 1,
        gradient: (editingSection as any).title_style?.gradient || ((editingSection as any).is_h1_gradient ? {
          from: (editingSection as any).h1_text_color_gradient_from || 'gray-700',
          via: (editingSection as any).h1_text_color_gradient_via || 'gray-700',
          to: (editingSection as any).h1_text_color_gradient_to || 'indigo-200'
        } : undefined)
      };

      const descriptionStyle = (editingSection as any).description_style || {
        color: (editingSection as any).p_description_color || 'gray-600',
        size: {
          desktop: (editingSection as any).p_description_size || 'text-2xl',
          mobile: (editingSection as any).p_description_size_mobile || 'text-lg'
        },
        weight: (editingSection as any).p_description_weight || 'normal'
      };

      const imageStyle = (editingSection as any).image_style || {
        position: (editingSection as any).image_position || ((editingSection as any).is_image_full_page ? 'full' : ((editingSection as any).image_first ? 'left' : 'right')),
        fullPage: (editingSection as any).is_image_full_page || false,
        width: (editingSection as any).image_style?.width || 400,
        height: (editingSection as any).image_style?.height || 300
      };

      const backgroundStyle = (editingSection as any).background_style || {
        color: (editingSection as any).background_color || 'white',
        is_gradient: (editingSection as any).background_style?.is_gradient || (editingSection as any).is_bg_gradient || false,
        gradient: (editingSection as any).background_style?.gradient || ((editingSection as any).is_bg_gradient ? {
          from: (editingSection as any).background_color_gradient_from || 'sky-50',
          via: (editingSection as any).background_color_gradient_via || 'transparent',
          to: (editingSection as any).background_color_gradient_to || ''
        } : undefined),
        seo_title: (editingSection as any).background_style?.seo_title || (editingSection as any).seo_title || '',
        column: (editingSection as any).background_style?.column || (editingSection as any).column || 1
      };

      const buttonStyle = (editingSection as any).button_style || {
        aboveDescription: (editingSection as any).button_main_above_description || false,
        isVideo: (editingSection as any).button_main_is_for_video || false,
        url: (editingSection as any).button_url || '/products',
        color: (editingSection as any).button_style?.color,
        gradient: (editingSection as any).button_style?.gradient
      };

      setFormData({
        title: (editingSection as any).title || (editingSection as any).h1_title || '',
        description: (editingSection as any).description || (editingSection as any).p_description || '',
        button: (editingSection as any).button || (editingSection as any).button_main_get_started || 'Get Started',
        image: (editingSection as any).image || '',
        // Video background fields
        is_video: (editingSection as any).is_video || false,
        video_url: (editingSection as any).video_url || undefined,
        video_player: (editingSection as any).video_player || undefined,
        video_thumbnail: (editingSection as any).video_thumbnail || undefined,
        title_style: titleStyle,
        description_style: descriptionStyle,
        image_style: imageStyle,
        background_style: backgroundStyle,
        button_style: buttonStyle,
        title_translation: (editingSection as any).title_translation || (editingSection as any).h1_title_translation || {},
        description_translation: (editingSection as any).description_translation || (editingSection as any).p_description_translation || {},
        button_translation: (editingSection as any).button_translation || {},
        animation_element: (editingSection as any).animation_element || '',
      });
    }
  }, [editingSection]);

  // Listen for real-time updates
  useEffect(() => {
    const handleHeroSectionUpdate = (event: CustomEvent) => {
      const updatedData = event.detail;
      setFormData(prevData => ({
        ...prevData,
        title: updatedData.title || prevData.title,
        description: updatedData.description || prevData.description,
        button: updatedData.button || prevData.button,
        image: updatedData.image || prevData.image,
        animation_element: updatedData.animation_element !== undefined ? updatedData.animation_element : prevData.animation_element,
        // Video background fields
        is_video: updatedData.is_video !== undefined ? updatedData.is_video : prevData.is_video,
        video_url: updatedData.video_url !== undefined ? updatedData.video_url : prevData.video_url,
        video_player: updatedData.video_player !== undefined ? updatedData.video_player : prevData.video_player,
        video_thumbnail: updatedData.video_thumbnail !== undefined ? updatedData.video_thumbnail : prevData.video_thumbnail,
        title_style: updatedData.title_style || prevData.title_style,
        description_style: updatedData.description_style || prevData.description_style,
        image_style: updatedData.image_style || prevData.image_style,
        background_style: updatedData.background_style || prevData.background_style,
        button_style: updatedData.button_style || prevData.button_style,
        title_translation: updatedData.title_translation || prevData.title_translation,
        description_translation: updatedData.description_translation || prevData.description_translation,
        button_translation: updatedData.button_translation || prevData.button_translation,
      }));
    };

    window.addEventListener('hero-section-updated', handleHeroSectionUpdate as EventListener);
    return () => {
      window.removeEventListener('hero-section-updated', handleHeroSectionUpdate as EventListener);
    };
  }, []);

  const updateField = (field: keyof HeroFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData(DEFAULT_FORM_DATA);
  };

  // Computed styles for preview
  const computedStyles = useMemo(() => {
    const bgStyle = formData.background_style;
    const titleStyle = formData.title_style;
    const buttonStyle = formData.button_style;

    return {
      backgroundClass: bgStyle.is_gradient && bgStyle.gradient
        ? 'bg-transparent hover:bg-sky-50'
        : `bg-${bgStyle.color || 'transparent'} hover:bg-sky-50`,
      
      backgroundStyle: bgStyle.is_gradient && bgStyle.gradient
        ? {
            backgroundImage: `linear-gradient(135deg, ${
              getColorValue(bgStyle.gradient.from?.replace('from-', '') || 'blue-50')
            }, ${
              getColorValue(bgStyle.gradient.via?.replace('via-', '') || 'white')
            }, ${
              getColorValue(bgStyle.gradient.to?.replace('to-', '') || 'purple-50')
            })`
          }
        : {},
      
      titleColorClass: titleStyle.is_gradient && titleStyle.gradient
        ? 'text-transparent'
        : `text-${titleStyle.color || 'gray-700'}`,
      
      titleGradientStyle: titleStyle.is_gradient && titleStyle.gradient
        ? {
            backgroundImage: `linear-gradient(90deg, ${
              getColorValue(titleStyle.gradient.from?.replace('from-', '') || 'blue-600')
            }, ${
              getColorValue(titleStyle.gradient.via?.replace('via-', '') || 'purple-600')
            }, ${
              getColorValue(titleStyle.gradient.to?.replace('to-', '') || 'pink-600')
            })`,
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }
        : {},
      
      buttonBackgroundClass: buttonStyle.gradient
        ? `bg-gradient-to-r from-${buttonStyle.gradient.from || 'gray-700'} via-${buttonStyle.gradient.via || 'gray-700'} to-${buttonStyle.gradient.to || 'gray-900'}`
        : `bg-${buttonStyle.color || 'gray-700'}`,
      
      titleTextSize: (() => {
        const size = titleStyle.size || { desktop: 'text-7xl', mobile: 'text-5xl' };
        return `sm:${size.mobile} md:${size.desktop} lg:${size.desktop} ${size.mobile}`;
      })(),
    };
  }, [formData]);

  return {
    formData,
    updateField,
    resetForm,
    setFormData,
    computedStyles,
  };
}
