'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FaPlayCircle } from 'react-icons/fa';
import RightArrowDynamic from '@/ui/RightArrowDynamic';
import { 
  PhotoIcon,
  XMarkIcon,
  RectangleGroupIcon,
  ArrowUpCircleIcon,
  ArrowDownCircleIcon,
  PlayCircleIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { useHeroSectionEdit } from './context';
import ColorPaletteDropdown, { getColorValue } from '@/components/Shared/ColorPaletteDropdown';
import ImageGalleryModal from '@/components/modals/ImageGalleryModal';
import Button from '@/ui/Button';
import { cn } from '@/lib/utils';
import { BaseModal } from '../_shared/BaseModal';
import DotGrid from '@/components/AnimateElements/DotGrid';
import LetterGlitch from '@/components/AnimateElements/LetterGlitch';
import MagicBento from '@/components/AnimateElements/MagicBento';
import parse from 'html-react-parser';

// Tooltip Component
const Tooltip = ({ content }: { content: string }) => {
  return (
    <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
      <div className="relative">
        {/* Arrow */}
        <div className="absolute -top-1 left-1/2 -translate-x-1/2">
          <div className="w-2 h-2 bg-white border-l border-t border-gray-200 transform rotate-45" />
        </div>
        {/* Content */}
        <div className="bg-white text-gray-700 text-xs rounded-lg shadow-lg border border-gray-200 px-3 py-2 whitespace-normal w-64">
          {content}
        </div>
      </div>
    </div>
  );
};

interface HeroFormData {
  title: string;
  description: string;
  button?: string;
  image?: string;
  animation_element?: string;
  title_style: {
    font?: string;
    color?: string;
    gradient?: { from: string; via?: string; to: string };
    size?: { desktop: string; mobile: string };
    alignment?: string;
    blockWidth?: string;
    blockColumns?: number;
  };
  description_style: {
    font?: string;
    color?: string;
    size?: { desktop: string; mobile: string };
    weight?: string;
  };
  image_style: {
    position?: string;
    fullPage?: boolean;
  };
  background_style: {
    color?: string;
    gradient?: { from: string; via?: string; to: string };
  };
  button_style: {
    aboveDescription?: boolean;
    isVideo?: boolean;
    url?: string;
    color?: string;
    gradient?: { from: string; via?: string; to: string };
  };
  title_translation?: Record<string, string>;
  description_translation?: Record<string, string>;
  button_translation?: Record<string, string>;
  is_seo_title?: boolean;
  seo_title?: string;
}

export default function HeroSectionEditModal() {
  const { isOpen, editingSection, mode, closeModal, updateSection, deleteSection } = useHeroSectionEdit();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [hasTriedSave, setHasTriedSave] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showTitleColorPicker, setShowTitleColorPicker] = useState(false);
  const [showDescColorPicker, setShowDescColorPicker] = useState(false);
  const [showBgColorPicker, setShowBgColorPicker] = useState(false);
  const [showImageGallery, setShowImageGallery] = useState(false);
  
  const titleColorButtonRef = useRef<HTMLButtonElement>(null);
  const descColorButtonRef = useRef<HTMLButtonElement>(null);
  const bgColorButtonRef = useRef<HTMLButtonElement>(null);
  const titleTextareaRef = useRef<HTMLTextAreaElement>(null);
  const descriptionTextareaRef = useRef<HTMLTextAreaElement>(null);
  const titleResizeRAF = useRef<number | null>(null);
  const descResizeRAF = useRef<number | null>(null);
  
  const [formData, setFormData] = useState<HeroFormData>({
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
      fullPage: false
    },
    background_style: {
      color: 'white'
    },
    button_style: {
      aboveDescription: false,
      isVideo: false,
      url: '/products'
    },
    is_seo_title: false,
    seo_title: '',
    animation_element: '',
  });

  // Computed values for preview (mirroring Hero.tsx)
  const imagePosition = formData.image_style?.position || 'right';
  const shouldShowInlineImage = imagePosition !== 'full';
  const isImageFullPage = imagePosition === 'full';
  const translatedH1Title = formData.title;
  const translatedPDescription = formData.description;

  const backgroundClass = useMemo(() => {
    const bgStyle = formData.background_style || {};
    if (bgStyle.gradient) {
      return `bg-gradient-to-tr from-${bgStyle.gradient.from || 'sky-50'} via-${bgStyle.gradient.via || 'transparent'} to-${bgStyle.gradient.to || ''} hover:bg-sky-50`;
    }
    return `bg-${bgStyle.color || 'transparent'} hover:bg-sky-50`;
  }, [formData.background_style]);

  const textColorClass = useMemo(() => {
    const titleStyle = formData.title_style || {};
    if (titleStyle.gradient) {
      return `bg-gradient-to-r from-${titleStyle.gradient.from || 'gray-700'} via-${titleStyle.gradient.via || 'gray-700'} to-${titleStyle.gradient.to || 'indigo-200'} bg-clip-text text-transparent`;
    }
    return `text-${titleStyle.color || 'gray-700'}`;
  }, [formData.title_style]);

  const GetstartedBackgroundColorClass = useMemo(() => {
    const buttonStyle = formData.button_style || {};
    if (buttonStyle.gradient) {
      return `bg-gradient-to-r from-${buttonStyle.gradient.from || 'gray-700'} via-${buttonStyle.gradient.via || 'gray-700'} to-${buttonStyle.gradient.to || 'gray-900'}`;
    }
    return `bg-${buttonStyle.color || 'gray-700'}`;
  }, [formData.button_style]);

  const h1TextSize = useMemo(() => {
    const titleStyle = formData.title_style || {};
    const size = titleStyle.size || { desktop: 'text-7xl', mobile: 'text-5xl' };
    return `sm:${size.mobile} md:${size.desktop} lg:${size.desktop} ${size.mobile}`;
  }, [formData.title_style]);

  // Initialize form data when editing section changes
  useEffect(() => {
    if (editingSection) {
      // Handle migration from old fields to new JSONB structure
      const titleStyle = (editingSection as any).title_style || {
        color: (editingSection as any).h1_text_color || 'gray-800',
        size: {
          desktop: (editingSection as any).h1_text_size || 'text-7xl',
          mobile: (editingSection as any).h1_text_size_mobile || 'text-5xl'
        },
        alignment: (editingSection as any).title_alighnement || 'center',
        blockWidth: (editingSection as any).title_block_width || '2xl',
        blockColumns: (editingSection as any).title_block_columns || 1,
        gradient: (editingSection as any).is_h1_gradient_text ? {
          from: (editingSection as any).h1_text_color_gradient_from || 'gray-700',
          via: (editingSection as any).h1_text_color_gradient_via || 'gray-700',
          to: (editingSection as any).h1_text_color_gradient_to || 'indigo-200'
        } : undefined
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
        fullPage: (editingSection as any).is_image_full_page || false
      };

      const backgroundStyle = (editingSection as any).background_style || {
        color: (editingSection as any).background_color || 'white',
        gradient: (editingSection as any).is_bg_gradient ? {
          from: (editingSection as any).background_color_gradient_from || 'sky-50',
          via: (editingSection as any).background_color_gradient_via || 'transparent',
          to: (editingSection as any).background_color_gradient_to || ''
        } : undefined
      };

      const buttonStyle = (editingSection as any).button_style || {
        aboveDescription: (editingSection as any).button_main_above_description || false,
        isVideo: (editingSection as any).button_main_is_for_video || false,
        url: (editingSection as any).button_url || '/products'
      };

      setFormData({
        title: (editingSection as any).title || (editingSection as any).h1_title || '',
        description: (editingSection as any).description || (editingSection as any).p_description || '',
        button: (editingSection as any).button || (editingSection as any).button_main_get_started || 'Get Started',
        image: (editingSection as any).image || '',
        title_style: titleStyle,
        description_style: descriptionStyle,
        image_style: imageStyle,
        background_style: backgroundStyle,
        button_style: buttonStyle,
        title_translation: (editingSection as any).title_translation || (editingSection as any).h1_title_translation || {},
        description_translation: (editingSection as any).description_translation || (editingSection as any).p_description_translation || {},
        button_translation: (editingSection as any).button_translation || {},
        is_seo_title: (editingSection as any).is_seo_title || false,
        seo_title: (editingSection as any).seo_title || '',
        animation_element: (editingSection as any).animation_element || '',
      });
    }
  }, [editingSection]);

  // Auto-expand textarea for title
  const handleTitleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData({ ...formData, title: e.target.value });
    // Debounced auto-resize with rAF and max height
    if (titleResizeRAF.current) cancelAnimationFrame(titleResizeRAF.current);
    titleResizeRAF.current = requestAnimationFrame(() => {
      if (!titleTextareaRef.current) return;
      const el = titleTextareaRef.current;
      el.style.height = 'auto';
      el.style.maxHeight = '280px';
      el.style.overflowY = 'auto';
      el.style.height = el.scrollHeight + 'px';
    });
  };

  // Auto-expand textarea
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData({ ...formData, description: e.target.value });
    if (descResizeRAF.current) cancelAnimationFrame(descResizeRAF.current);
    descResizeRAF.current = requestAnimationFrame(() => {
      if (!descriptionTextareaRef.current) return;
      const el = descriptionTextareaRef.current;
      el.style.height = 'auto';
      el.style.maxHeight = '280px';
      el.style.overflowY = 'auto';
      el.style.height = el.scrollHeight + 'px';
    });
  };

  // Reset textarea height when content changes
  useEffect(() => {
    if (titleTextareaRef.current) {
      titleTextareaRef.current.style.height = 'auto';
      titleTextareaRef.current.style.height = titleTextareaRef.current.scrollHeight + 'px';
    }
  }, [formData.title]);

  useEffect(() => {
    if (descriptionTextareaRef.current) {
      descriptionTextareaRef.current.style.height = 'auto';
      descriptionTextareaRef.current.style.height = descriptionTextareaRef.current.scrollHeight + 'px';
    }
  }, [formData.description]);

  // Focus management on open
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      if (titleTextareaRef.current && !formData.title.trim()) {
        titleTextareaRef.current.focus();
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [isOpen]);

  const handleSave = async () => {
    setHasTriedSave(true);
    setSaveError(null);
    if (!formData.title.trim()) {
      return;
    }
    setIsSaving(true);
    try {
      await updateSection(formData);
      closeModal();
    } catch (error: any) {
      console.error('Failed to save:', error);
      setSaveError(error?.message || 'Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsSaving(true);
    try {
      await deleteSection();
      setShowDeleteConfirm(false);
      closeModal();
    } catch (error) {
      console.error('Failed to delete:', error);
      setIsSaving(false);
    }
  };

  const handleImageSelect = (url: string) => {
    setFormData({ ...formData, image: url });
    setShowImageGallery(false);
  };

  // Close pickers when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.dropdown-container') && 
          !target.closest('.color-palette-dropdown')) {
        setShowTitleColorPicker(false);
        setShowDescColorPicker(false);
        setShowBgColorPicker(false);
      }
    };

    if (showTitleColorPicker || showDescColorPicker || showBgColorPicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showTitleColorPicker, showDescColorPicker, showBgColorPicker]);

  if (!isOpen) return null;

  // Resolve colors via palette with contrast fallback
  const resolvedBg = getColorValue(formData.background_style?.color || 'white');
  const resolvedTitle = getColorValue(formData.title_style?.color || 'gray-800');
  const resolvedDesc = getColorValue(formData.description_style?.color || 'gray-600');
  const resolvedTitleGradFrom = getColorValue(formData.title_style?.gradient?.from || 'gray-700');
  const resolvedTitleGradVia = getColorValue(formData.title_style?.gradient?.via || resolvedTitleGradFrom);
  const resolvedTitleGradTo = getColorValue(formData.title_style?.gradient?.to || resolvedTitleGradFrom);
  const safeTitleColor = resolvedTitle === resolvedBg ? '#111827' : resolvedTitle; // gray-900 fallback
  const safeDescColor = resolvedDesc === resolvedBg ? '#374151' : resolvedDesc; // gray-700 fallback

  // Alignment helpers (avoid dynamic Tailwind strings)
  const alignClass = formData.title_style?.alignment === 'left' ? 'text-left' : formData.title_style?.alignment === 'right' ? 'text-right' : 'text-center';
  const justifyClass = formData.title_style?.alignment === 'left' ? 'justify-start' : formData.title_style?.alignment === 'right' ? 'justify-end' : 'justify-center';

  // Background gradient style (mirror live component when enabled)
  const bgGradientFrom = getColorValue(formData.background_style?.gradient?.from || 'transparent');
  const bgGradientVia = getColorValue(formData.background_style?.gradient?.via || 'transparent');
  const bgGradientTo = getColorValue(formData.background_style?.gradient?.to || 'transparent');
  const previewBackgroundStyle = formData.background_style?.gradient
    ? { backgroundImage: `linear-gradient(135deg, ${bgGradientFrom}, ${bgGradientVia}, ${bgGradientTo})` }
    : { backgroundColor: resolvedBg || undefined };

  // Content width mapping similar to max-w-{...}
  const widthMap: Record<string, string> = {
    full: 'max-w-full',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
  };
  const widthClass = widthMap[formData.title_style?.blockWidth || '2xl'] || 'max-w-2xl';

  const gridColsClass = shouldShowInlineImage && formData.title_style?.blockColumns === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-1';
  // Size classes (mirror live)
  const titleSizeClass = `${formData.title_style?.size?.mobile || 'text-5xl'} sm:${formData.title_style?.size?.desktop || 'text-7xl'} md:${formData.title_style?.size?.desktop || 'text-7xl'}`;
  const descSizeClass = `${formData.description_style?.size?.mobile || 'text-lg'} sm:${formData.description_style?.size?.desktop || 'text-2xl'}`;
  const descWeightClass = formData.description_style?.weight === 'bold'
    ? 'font-bold'
    : formData.description_style?.weight === 'semibold'
    ? 'font-semibold'
    : formData.description_style?.weight === 'medium'
    ? 'font-medium'
    : 'font-normal';

  const modalTitle = (
    <div className="flex items-center gap-2.5">
      <span>{mode === 'create' ? 'Create Hero Section' : 'Edit Hero Section'}</span>
      <span className={cn(
        'px-2 py-0.5 text-xs font-medium rounded-md border',
        mode === 'create'
          ? 'bg-sky-100 text-sky-700 border-sky-200'
          : 'bg-amber-100 text-amber-700 border-amber-200'
      )}>
        {mode === 'create' ? 'New' : 'Edit'}
      </span>
    </div>
  );

  return (
    <>
      <BaseModal
        isOpen={isOpen}
        onClose={closeModal}
        title={modalTitle}
        size="xl"
        fullscreen={isFullscreen}
        onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
        showFullscreenButton={true}
        draggable={true}
        resizable={true}
        noPadding={true}
      >
        {/* Fixed Toolbar - Horizontally Scrollable */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6">
          <div className="overflow-x-auto">
            <div className="flex items-center gap-1 py-3 min-w-max">
              {/* Image Gallery */}
              <div className="relative group">
                <button
                  onClick={() => setShowImageGallery(true)}
                  className={cn(
                    'p-2 rounded-lg transition-colors',
                    formData.image
                      ? 'bg-sky-100 text-sky-500 border border-sky-200'
                      : 'text-gray-400 hover:text-sky-500 hover:bg-gray-50 border border-transparent'
                  )}
                  aria-label="Open image gallery"
                >
                  <PhotoIcon className="w-5 h-5" />
                </button>
                <Tooltip content="Add or change hero image" />
              </div>

              <div className="w-px h-6 bg-gray-300 mx-1" />

              {/* Alignment Buttons */}
              <div className="flex items-center gap-1">
                {(['left', 'center', 'right'] as const).map((align) => (
                  <div key={align} className="relative group">
                    <button
                      onClick={() => setFormData({
                        ...formData,
                        title_style: { ...formData.title_style, alignment: align }
                      })}
                      className={cn(
                        'p-2 rounded-lg transition-colors text-xs font-medium min-w-[60px]',
                        formData.title_style?.alignment === align
                          ? 'bg-sky-100 text-sky-700 border border-sky-200'
                          : 'text-gray-600 hover:text-sky-700 hover:bg-gray-50 border border-transparent'
                      )}
                    >
                      {align.charAt(0).toUpperCase() + align.slice(1)}
                    </button>
                  </div>
                ))}
              </div>

              <div className="w-px h-6 bg-gray-300 mx-1" />

              {/* Column Layout (only relevant for left/right with image) */}
              {formData.image && (formData.image_style?.position === 'left' || formData.image_style?.position === 'right') && (
                <div className="flex items-center gap-1">
                  {[1, 2].map((cols) => (
                    <div key={cols} className="relative group">
                      <button
                        onClick={() => setFormData({
                          ...formData,
                          title_style: { ...formData.title_style, blockColumns: cols }
                        })}
                        className={cn(
                          'p-2 rounded-lg transition-colors text-xs font-medium min-w-[50px]',
                          formData.title_style?.blockColumns === cols
                            ? 'bg-sky-100 text-sky-700 border border-sky-200'
                            : 'text-gray-600 hover:text-sky-700 hover:bg-gray-50 border border-transparent'
                        )}
                        aria-label={`Set ${cols} column layout`}
                      >
                        {cols} Col
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="w-px h-6 bg-gray-300 mx-1" />

              {/* Image Position Selector */}
              <div className="relative group">
                <select
                  value={formData.image_style?.position || 'none'}
                  onChange={(e) => setFormData({
                    ...formData,
                    image_style: { ...formData.image_style, position: e.target.value as any }
                  })}
                  className="p-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:border-sky-500 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors"
                  aria-label="Set image position"
                >
                  <option value="none">No Image</option>
                  <option value="left">Image Left</option>
                  <option value="right">Image Right</option>
                  <option value="top">Image Top</option>
                  <option value="bottom">Image Bottom</option>
                  <option value="background">Full Background</option>
                </select>
                <Tooltip content="Image position relative to content" />
              </div>

              <div className="w-px h-6 bg-gray-300 mx-1" />

              {/* Content Width */}
              <div className="relative group">
                <select
                  value={formData.title_style?.blockWidth || '4xl'}
                  onChange={(e) => setFormData({
                    ...formData,
                    title_style: { ...formData.title_style, blockWidth: e.target.value }
                  })}
                  className="p-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:border-sky-500 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors"
                  aria-label="Set content width"
                >
                  <option value="2xl">2xl</option>
                  <option value="3xl">3xl</option>
                  <option value="4xl">4xl</option>
                  <option value="5xl">5xl</option>
                  <option value="6xl">6xl</option>
                  <option value="7xl">7xl</option>
                  <option value="full">Full</option>
                </select>
                <Tooltip content="Content block width" />
              </div>

              <div className="w-px h-6 bg-gray-300 mx-1" />

              {/* Title Size */}
              <div className="relative group">
                <select
                  value={formData.title_style?.size?.desktop || 'text-6xl'}
                  onChange={(e) => setFormData({
                    ...formData,
                    title_style: {
                      ...formData.title_style,
                      size: {
                        desktop: e.target.value,
                        mobile: formData.title_style?.size?.mobile || 'text-4xl'
                      }
                    }
                  })}
                  className="p-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:border-sky-500 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors"
                  aria-label="Set title size"
                >
                  <option value="text-5xl">Title: 5xl</option>
                  <option value="text-6xl">Title: 6xl</option>
                  <option value="text-7xl">Title: 7xl</option>
                  <option value="text-8xl">Title: 8xl</option>
                </select>
                <Tooltip content="Desktop title size" />
              </div>

              {/* Title Size (Mobile) */}
              <div className="relative group">
                <select
                  value={formData.title_style?.size?.mobile || 'text-4xl'}
                  onChange={(e) => setFormData({
                    ...formData,
                    title_style: {
                      ...formData.title_style,
                      size: {
                        desktop: formData.title_style?.size?.desktop || 'text-6xl',
                        mobile: e.target.value
                      }
                    }
                  })}
                  className="p-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:border-sky-500 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors"
                  aria-label="Set mobile title size"
                >
                  <option value="text-3xl">Title Mobile: 3xl</option>
                  <option value="text-4xl">Title Mobile: 4xl</option>
                  <option value="text-5xl">Title Mobile: 5xl</option>
                </select>
                <Tooltip content="Mobile title size" />
              </div>

              <div className="w-px h-6 bg-gray-300 mx-1" />

              {/* Description Size */}
              <div className="relative group">
                <select
                  value={formData.description_style?.size?.desktop || 'text-lg'}
                  onChange={(e) => setFormData({
                    ...formData,
                    description_style: {
                      ...formData.description_style,
                      size: {
                        desktop: e.target.value,
                        mobile: formData.description_style?.size?.mobile || 'text-base'
                      }
                    }
                  })}
                  className="p-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:border-sky-500 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors"
                  aria-label="Set description size"
                >
                  <option value="text-base">Desc: base</option>
                  <option value="text-lg">Desc: lg</option>
                  <option value="text-xl">Desc: xl</option>
                  <option value="text-2xl">Desc: 2xl</option>
                </select>
                <Tooltip content="Desktop description size" />
              </div>

              {/* Description Size (Mobile) */}
              <div className="relative group">
                <select
                  value={formData.description_style?.size?.mobile || 'text-base'}
                  onChange={(e) => setFormData({
                    ...formData,
                    description_style: {
                      ...formData.description_style,
                      size: {
                        desktop: formData.description_style?.size?.desktop || 'text-lg',
                        mobile: e.target.value
                      }
                    }
                  })}
                  className="p-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:border-sky-500 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors"
                  aria-label="Set mobile description size"
                >
                  <option value="text-sm">Desc Mobile: sm</option>
                  <option value="text-base">Desc Mobile: base</option>
                  <option value="text-lg">Desc Mobile: lg</option>
                </select>
                <Tooltip content="Mobile description size" />
              </div>

              {/* Description Weight */}
              <div className="relative group">
                <select
                  value={formData.description_style?.weight || 'font-normal'}
                  onChange={(e) => setFormData({
                    ...formData,
                    description_style: { ...formData.description_style, weight: e.target.value }
                  })}
                  className="p-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:border-sky-500 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors"
                  aria-label="Set description weight"
                >
                  <option value="normal">Desc Weight: normal</option>
                  <option value="medium">Desc Weight: medium</option>
                  <option value="semibold">Desc Weight: semibold</option>
                  <option value="bold">Desc Weight: bold</option>
                </select>
                <Tooltip content="Description font weight" />
              </div>

              <div className="w-px h-6 bg-gray-300 mx-1" />

              {/* SEO Title Toggle */}
              <div className="relative group">
                <button
                  onClick={() => setFormData({ ...formData, is_seo_title: !formData.is_seo_title })}
                  className={cn(
                    'p-2 rounded-lg transition-colors',
                    formData.is_seo_title
                      ? 'bg-sky-100 text-sky-500 border border-sky-200'
                      : 'text-gray-400 hover:text-sky-500 hover:bg-gray-50 border border-transparent'
                  )}
                  aria-label="Toggle SEO title section"
                >
                  <DocumentTextIcon className="w-5 h-5" />
                </button>
                <Tooltip content="Show SEO title section" />
              </div>

              {/* Button Position Toggle */}
              <div className="relative group">
                <button
                  onClick={() => setFormData({
                    ...formData,
                    button_style: { ...formData.button_style, aboveDescription: !formData.button_style?.aboveDescription }
                  })}
                  className={cn(
                    'p-2 rounded-lg transition-colors',
                    formData.button_style?.aboveDescription
                      ? 'bg-sky-100 text-sky-500 border border-sky-200'
                      : 'text-gray-400 hover:text-sky-500 hover:bg-gray-50 border border-transparent'
                  )}
                  aria-label="Toggle button position"
                >
                  {formData.button_style?.aboveDescription ? (
                    <ArrowUpCircleIcon className="w-5 h-5" />
                  ) : (
                    <ArrowDownCircleIcon className="w-5 h-5" />
                  )}
                </button>
                <Tooltip content={formData.button_style?.aboveDescription ? "Button above description" : "Button below description"} />
              </div>

              {/* Video Button Toggle */}
              <div className="relative group">
                <button
                  onClick={() => setFormData({
                    ...formData,
                    button_style: { ...formData.button_style, isVideo: !formData.button_style?.isVideo }
                  })}
                  className={cn(
                    'p-2 rounded-lg transition-colors',
                    formData.button_style?.isVideo
                      ? 'bg-sky-100 text-sky-500 border border-sky-200'
                      : 'text-gray-400 hover:text-sky-500 hover:bg-gray-50 border border-transparent'
                  )}
                  aria-label="Toggle video button mode"
                >
                  <PlayCircleIcon className="w-5 h-5" />
                </button>
                <Tooltip content="Use video play button" />
              </div>

              <div className="w-px h-6 bg-gray-300 mx-1" />

              {/* Button URL Input */}
              <div className="relative group flex items-center">
                <input
                  type="text"
                  value={formData.button_style?.url || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    button_style: { ...formData.button_style, url: e.target.value }
                  })}
                  placeholder="/products"
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 focus:outline-none transition-colors w-40"
                  aria-label="Button URL"
                />
                <Tooltip content="Button URL destination" />
              </div>

              <div className="w-px h-6 bg-gray-300 mx-1" />

              {/* Title Color */}
              <div className="dropdown-container relative group">
                <ColorPaletteDropdown
                  value={formData.title_style?.color || 'text-gray-900'}
                  onChange={(colorClass: string) => {
                    setFormData({
                      ...formData,
                      title_style: { ...formData.title_style, color: colorClass }
                    });
                    setShowTitleColorPicker(false);
                  }}
                  isOpen={showTitleColorPicker}
                  onToggle={() => {
                    setShowTitleColorPicker(!showTitleColorPicker);
                    setShowDescColorPicker(false);
                    setShowBgColorPicker(false);
                  }}
                  onClose={() => setShowTitleColorPicker(false)}
                  buttonRef={titleColorButtonRef}
                  useFixedPosition={true}
                />
                <Tooltip content="Title text color" />
              </div>

              {/* Description Color */}
              <div className="dropdown-container relative group">
                <ColorPaletteDropdown
                  value={formData.description_style?.color || 'text-gray-600'}
                  onChange={(colorClass: string) => {
                    setFormData({
                      ...formData,
                      description_style: { ...formData.description_style, color: colorClass }
                    });
                    setShowDescColorPicker(false);
                  }}
                  isOpen={showDescColorPicker}
                  onToggle={() => {
                    setShowDescColorPicker(!showDescColorPicker);
                    setShowTitleColorPicker(false);
                    setShowBgColorPicker(false);
                  }}
                  onClose={() => setShowDescColorPicker(false)}
                  buttonRef={descColorButtonRef}
                  useFixedPosition={true}
                />
                <Tooltip content="Description text color" />
              </div>

              {/* Background Color */}
              <div className="dropdown-container relative group">
                <ColorPaletteDropdown
                  value={formData.background_style?.color || 'bg-white'}
                  onChange={(colorClass: string) => {
                    setFormData({
                      ...formData,
                      background_style: { ...formData.background_style, color: colorClass }
                    });
                    setShowBgColorPicker(false);
                  }}
                  isOpen={showBgColorPicker}
                  onToggle={() => {
                    setShowBgColorPicker(!showBgColorPicker);
                    setShowTitleColorPicker(false);
                    setShowDescColorPicker(false);
                  }}
                  onClose={() => setShowBgColorPicker(false)}
                  buttonRef={bgColorButtonRef}
                  useFixedPosition={true}
                />
                <Tooltip content="Background color" />
              </div>

              {/* H1 Gradient Toggle */}
              <div className="relative group">
                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={!!formData.title_style?.gradient}
                    onChange={(e) => setFormData({
                      ...formData,
                      title_style: {
                        ...formData.title_style,
                        gradient: e.target.checked ? { from: 'from-blue-600', via: 'via-purple-600', to: 'to-pink-600' } : undefined
                      }
                    })}
                  />
                  H1 Gradient
                </label>
              </div>

              {/* H1 Gradient Colors */}
              <div className="relative group flex items-center gap-2">
                <input
                  type="text"
                  value={formData.title_style?.gradient?.from || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    title_style: {
                      ...formData.title_style,
                      gradient: {
                        ...formData.title_style?.gradient,
                        from: e.target.value,
                        via: formData.title_style?.gradient?.via || 'via-purple-600',
                        to: formData.title_style?.gradient?.to || 'to-pink-600'
                      }
                    }
                  })}
                  placeholder="H1 grad from (e.g., sky-600)"
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 focus:outline-none transition-colors w-40"
                />
                <input
                  type="text"
                  value={formData.title_style?.gradient?.via || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    title_style: {
                      ...formData.title_style,
                      gradient: {
                        ...formData.title_style?.gradient,
                        from: formData.title_style?.gradient?.from || 'from-blue-600',
                        via: e.target.value,
                        to: formData.title_style?.gradient?.to || 'to-pink-600'
                      }
                    }
                  })}
                  placeholder="H1 grad via"
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 focus:outline-none transition-colors w-36"
                />
                <input
                  type="text"
                  value={formData.title_style?.gradient?.to || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    title_style: {
                      ...formData.title_style,
                      gradient: {
                        ...formData.title_style?.gradient,
                        from: formData.title_style?.gradient?.from || 'from-blue-600',
                        via: formData.title_style?.gradient?.via || 'via-purple-600',
                        to: e.target.value
                      }
                    }
                  })}
                  placeholder="H1 grad to"
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 focus:outline-none transition-colors w-36"
                />
              </div>

              <div className="w-px h-6 bg-gray-300 mx-1" />

              {/* Background Gradient Toggle */}
              <div className="relative group">
                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={!!formData.background_style?.gradient}
                    onChange={(e) => setFormData({
                      ...formData,
                      background_style: {
                        ...formData.background_style,
                        gradient: e.target.checked ? { from: 'from-blue-50', via: 'via-white', to: 'to-purple-50' } : undefined
                      }
                    })}
                  />
                  BG Gradient
                </label>
              </div>

              {/* Background Gradient Colors */}
              <div className="relative group flex items-center gap-2">
                <input
                  type="text"
                  value={formData.background_style?.gradient?.from || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    background_style: {
                      ...formData.background_style,
                      gradient: {
                        ...formData.background_style?.gradient,
                        from: e.target.value,
                        via: formData.background_style?.gradient?.via || 'via-white',
                        to: formData.background_style?.gradient?.to || 'to-purple-50'
                      }
                    }
                  })}
                  placeholder="BG grad from (e.g., sky-50)"
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 focus:outline-none transition-colors w-40"
                />
                <input
                  type="text"
                  value={formData.background_style?.gradient?.via || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    background_style: {
                      ...formData.background_style,
                      gradient: {
                        ...formData.background_style?.gradient,
                        from: formData.background_style?.gradient?.from || 'from-blue-50',
                        via: e.target.value,
                        to: formData.background_style?.gradient?.to || 'to-purple-50'
                      }
                    }
                  })}
                  placeholder="BG grad via"
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 focus:outline-none transition-colors w-36"
                />
                <input
                  type="text"
                  value={formData.background_style?.gradient?.to || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    background_style: {
                      ...formData.background_style,
                      gradient: {
                        ...formData.background_style?.gradient,
                        from: formData.background_style?.gradient?.from || 'from-blue-50',
                        via: formData.background_style?.gradient?.via || 'via-white',
                        to: e.target.value
                      }
                    }
                  })}
                  placeholder="BG grad to"
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 focus:outline-none transition-colors w-36"
                />
              </div>

              <div className="w-px h-6 bg-gray-300 mx-1" />

              {/* Animation Element */}
              <div className="relative group">
                <select
                  value={formData.animation_element || ''}
                  onChange={(e) => setFormData({ ...formData, animation_element: e.target.value as any })}
                  className="p-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:border-sky-500 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors"
                  aria-label="Set animation element"
                >
                  <option value="">No animation</option>
                  <option value="DotGrid">DotGrid</option>
                  <option value="LetterGlitch">LetterGlitch</option>
                  <option value="MagicBento">MagicBento</option>
                </select>
                <Tooltip content="Background animation overlay" />
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto px-6">
          {/* Live Preview Area */}
          <div 
            className={cn(
              "rounded-lg pt-16 px-6 lg:px-8 my-6 transition-colors min-h-[70vh] flex items-center relative",
              backgroundClass
            )}
          >
            {/* Optional animation overlays to mirror live component */}
            {formData.animation_element === 'DotGrid' && (
              <div className="absolute inset-0 -z-20">
                <DotGrid
                  dotSize={30}
                  gap={180}
                  baseColor="#f8fafc"
                  activeColor="#f1f5f9"
                  proximity={120}
                  shockRadius={200}
                  shockStrength={4}
                  resistance={700}
                  returnDuration={1.2}
                />
              </div>
            )}
            {formData.animation_element === 'LetterGlitch' && (
              <div className="absolute inset-0 -z-20 letter-glitch-wave">
                <LetterGlitch
                  glitchSpeed={50}
                  centerVignette={true}
                  outerVignette={false}
                  smooth={true}
                  glitchColors={["#0284c7", "#0d9488"]}
                />
              </div>
            )}
            {formData.animation_element === 'MagicBento' && (
              <div className="absolute inset-0 -z-20">
                <MagicBento
                  textAutoHide={true}
                  enableStars={true}
                  enableSpotlight={true}
                  enableBorderGlow={true}
                  enableTilt={true}
                  enableMagnetism={true}
                  clickEffect={true}
                  spotlightRadius={300}
                  particleCount={12}
                  glowColor="132, 0, 255"
                />
              </div>
            )}
            {/* Gradient glow blob when gradient enabled (visual parity with live) */}
            {formData.background_style?.gradient && (
              <div
                className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
                aria-hidden="true"
              >
                <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-white/30 via-white/10 to-transparent opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" />
              </div>
            )}
            {/* Full-page background image */}
            {isImageFullPage && formData.image && (
              <Image
                src={formData.image}
                alt={`Image of ${translatedH1Title}`}
                className="absolute inset-0 -z-10 h-auto w-auto object-contain sm:h-auto sm:w-auto sm:object-contain"
                width={1280}
                height={720}
                priority={true}
              />
            )}

            <div className={`mx-auto max-w-${formData.title_style?.blockWidth || '2xl'} text-${formData.title_style?.alignment || 'center'} items-center grid grid-cols-1 gap-x-12 gap-y-24 sm:grid-cols-${formData.title_style?.blockColumns || 1} relative`}>
              <div className={imagePosition === 'left' && shouldShowInlineImage ? 'order-2' : ''}>
                {formData.is_seo_title && (
                  <div className="hidden sm:mb-8 sm:flex sm:justify-center">
                    <div className="flex items-center relative rounded-full px-3 py-1 text-sm leading-6 text-gray-600 ring-2 ring-gray-900/10 hover:ring-sky-700/20">
                      {formData.seo_title}
                      <Link href="/blog" aria-label={`Explore ${formData.seo_title}`} className="ml-2 flex items-center transition-all duration-300 group font-semibold text-gray-700 hover:text-gray-300">
                        Explore
                        <RightArrowDynamic />
                      </Link>
                    </div>
                  </div>
                )}

                  {/* Main Content Wrapper with Alignment */}
                  <div className={alignClass}>
                    {/* Title - Inline Editing with Textarea */}
                    <textarea
                      ref={titleTextareaRef}
                      value={formData.title}
                      onChange={handleTitleChange}
                      placeholder="Enter hero title... (required)"
                      className={cn(
                        'w-full px-0 py-2 border-0 focus:outline-none focus:ring-0 placeholder:text-gray-300 bg-transparent resize-none overflow-hidden',
                        `${titleSizeClass} font-bold tracking-tight inline hover:text-gray-700`,
                        !formData.title && 'border-b-2 border-red-200'
                      )}
                      style={{
                        color: resolvedTitle,
                        backgroundImage: formData.title_style?.gradient ? `linear-gradient(90deg, ${resolvedTitleGradFrom}, ${resolvedTitleGradVia}, ${resolvedTitleGradTo})` : undefined,
                        WebkitBackgroundClip: formData.title_style?.gradient ? 'text' : undefined,
                        backgroundClip: formData.title_style?.gradient ? 'text' : undefined,
                        WebkitTextFillColor: formData.title_style?.gradient ? 'transparent' : undefined,
                        fontSize: titleSizeClass.includes('text-') ? undefined : '3rem',
                      }}
                      aria-label="Hero title"
                    />
                    {hasTriedSave && !formData.title.trim() && (
                      <p className="mt-1 text-sm text-red-600">Title is required.</p>
                    )}

                    {formData.button_style?.aboveDescription && formData.button && (
                      <div className={`mt-6 flex items-center justify-${formData.title_style?.alignment || 'center'} gap-x-6`}>
                        {formData.button_style?.isVideo ? (
                          <Link href={formData.button_style?.url || '/products'} className="hover:opacity-80 transition-opacity">
                            <FaPlayCircle className="h-16 w-16 text-white hover:text-gray-200" />
                          </Link>
                        ) : (
                          <Link href={formData.button_style?.url || '/products'} className={`rounded-full ${GetstartedBackgroundColorClass} hover:bg-sky-500 py-3 px-6 text-base font-medium text-white shadow-sm hover:opacity-80`}>
                            <input
                              type="text"
                              value={formData.button}
                              onChange={(e) => setFormData({ ...formData, button: e.target.value })}
                              placeholder="Button text..."
                              className="border-0 focus:outline-none focus:ring-0 bg-transparent text-white placeholder:text-white/50 text-center min-w-[100px]"
                              aria-label="Primary button text"
                            />
                          </Link>
                        )}
                      </div>
                    )}

                    {/* Description - Inline Editing */}
                    <textarea
                      ref={descriptionTextareaRef}
                      value={formData.description}
                      onChange={handleDescriptionChange}
                      placeholder="Enter hero description..."
                      className={cn(
                        'w-full px-0 py-2 border-0 focus:outline-none focus:ring-0 placeholder:text-gray-300 bg-transparent resize-none overflow-hidden',
                        `${descSizeClass} ${descWeightClass} tracking-wide hover:text-gray-900`
                      )}
                      style={{
                        color: safeDescColor,
                        fontWeight: formData.description_style?.weight || 'normal',
                      }}
                      aria-label="Hero description"
                    />

                    {!formData.button_style?.aboveDescription && formData.button && (
                      <div className={`mt-10 flex items-center justify-${formData.title_style?.alignment || 'center'} gap-x-6`}>
                        {formData.button_style?.isVideo ? (
                          <Link href={formData.button_style?.url || '/products'} className="hover:opacity-80 transition-opacity">
                            <FaPlayCircle className="h-4 w-4 text-white hover:text-gray-200" />
                          </Link>
                        ) : (
                          <Link href={formData.button_style?.url || '/products'} className={`rounded-full ${GetstartedBackgroundColorClass} hover:bg-sky-500 py-3 px-6 text-base font-medium text-white shadow-sm hover:opacity-80`}>
                            <input
                              type="text"
                              value={formData.button}
                              onChange={(e) => setFormData({ ...formData, button: e.target.value })}
                              placeholder="Button text..."
                              className="border-0 focus:outline-none focus:ring-0 bg-transparent text-white placeholder:text-white/50 text-center min-w-[100px]"
                              aria-label="Primary button text"
                            />
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Image - Show/Add (only for left/right positions) */}
                <div className={imagePosition === 'left' && shouldShowInlineImage ? 'order-1' : 'order-1'}>
                    {shouldShowInlineImage && formData.image && (
                      <div className={`text-${formData.title_style?.alignment || 'center'}`}>
                        <Image
                          src={formData.image}
                          alt={`Image of ${translatedH1Title}`}
                          className="h-full w-full object-cover sm:h-auto sm:w-full sm:max-w-[80%] sm:mx-auto sm:object-contain"
                          width={1024}
                          height={576}
                          priority={false}
                        />
                      </div>
                    )}
                  </div>

              </div>
            </div>

          {/* Information Section */}
          <div className="rounded-xl border border-sky-200 bg-gradient-to-br from-sky-50 to-white p-4 mb-6">
            <p className="text-sm text-sky-900 font-medium mb-1">
              Design your hero section with live preview
            </p>
            <p className="text-xs text-sky-800">
              Customize title, description, buttons, colors, and layout. All changes are reflected in real-time.
            </p>
          </div>
        </div>

        {/* Fixed Footer with Action Buttons */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
          {saveError && (
            <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {saveError}
            </div>
          )}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3">
            <Button
              variant="outline"
              onClick={closeModal}
              disabled={isSaving}
            >
              Cancel
            </Button>

            {mode === 'edit' && (
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isSaving}
                className="text-red-600 hover:text-red-700 hover:border-red-600"
              >
                Delete
              </Button>
            )}

            <Button
              variant="primary"
              onClick={handleSave}
              disabled={isSaving || !formData.title.trim()}
              loading={isSaving}
              loadingText="Saving..."
              className="bg-sky-600 hover:bg-sky-700"
            >
              {mode === 'create' ? 'Create Hero Section' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </BaseModal>

      {/* Image Gallery Modal */}
      {showImageGallery && (
        <ImageGalleryModal
          isOpen={showImageGallery}
          onClose={() => setShowImageGallery(false)}
          onSelectImage={handleImageSelect}
        />
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl p-6 max-w-md mx-4">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Delete Hero Section</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this hero section? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
