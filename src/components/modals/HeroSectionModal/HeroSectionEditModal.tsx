'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
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
  ChevronDownIcon,
  AdjustmentsHorizontalIcon,
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
const Tooltip = ({
  content,
  useFixedPosition = false
}: {
  content: string;
  useFixedPosition?: boolean;
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (useFixedPosition && containerRef.current) {
      const updatePosition = () => {
        const rect = containerRef.current!.getBoundingClientRect();
        setPosition({
          top: rect.bottom + window.scrollY + 8,
          left: rect.left + rect.width / 2 + window.scrollX
        });
      };

      updatePosition();
      window.addEventListener('scroll', updatePosition);
      window.addEventListener('resize', updatePosition);

      return () => {
        window.removeEventListener('scroll', updatePosition);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [useFixedPosition]);

  const tooltipContent = (
    <div
      ref={containerRef}
      className={`pointer-events-none transition-opacity ${
        useFixedPosition ? 'fixed z-[9999]' : 'absolute top-full mt-2 left-1/2 -translate-x-1/2 z-50'
      } ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      style={useFixedPosition ? { top: position.top, left: position.left, transform: 'translateX(-50%)' } : undefined}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
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

  if (useFixedPosition && typeof window !== 'undefined') {
    return (
      <div
        className="relative"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        {createPortal(tooltipContent, document.body)}
      </div>
    );
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {tooltipContent}
    </div>
  );
};

// Element Hover Menu Component
const ElementHoverMenu = ({ 
  element, 
  formData, 
  setFormData, 
  onClose,
  targetRect
}: { 
  element: 'title' | 'description';
  formData: HeroFormData;
  setFormData: (data: HeroFormData) => void;
  onClose: () => void;
  targetRect?: DOMRect;
}) => {
  const isTitle = element === 'title';
  const titleStyle = formData.title_style;
  const descStyle = formData.description_style;
  
  // Calculate fixed position based on target element
  const menuStyle = targetRect ? {
    position: 'fixed' as const,
    top: `${targetRect.top - 56}px`, // 56px above the element (14 * 4)
    left: `${targetRect.left}px`,
  } : {};
  
  return (
    <div 
      className="z-[10000] bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-xl p-2 flex items-center gap-1 pointer-events-auto min-w-max"
      style={menuStyle}
      onMouseDown={(e) => {
        e.stopPropagation();
      }}
    >
      {/* Alignment */}
      <div className="flex items-center gap-0.5 border-r border-gray-200 pr-2 mr-1">
        {(['left', 'center', 'right'] as const).map((align) => (
          <button
            key={align}
            onClick={(e) => {
              e.stopPropagation();
              // Alignment controls the overall title alignment
              setFormData({
                ...formData,
                title_style: { ...formData.title_style, alignment: align }
              });
            }}
            className={cn(
              'p-1.5 rounded hover:bg-gray-100 transition-colors',
              titleStyle?.alignment === align ? 'bg-sky-100 text-sky-600' : 'text-gray-600'
            )}
            title={`Align ${align}`}
          >
            {align === 'left' && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h16" /></svg>}
            {align === 'center' && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M7 12h10M4 18h16" /></svg>}
            {align === 'right' && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M14 12h6M4 18h16" /></svg>}
          </button>
        ))}
      </div>

      {/* Font Size */}
      <div className="flex items-center gap-0.5 border-r border-gray-200 pr-2 mr-1">
        {isTitle ? (
          ['text-lg', 'text-xl', 'text-2xl', 'text-3xl', 'text-4xl', 'text-5xl', 'text-6xl', 'text-7xl'].map((size) => (
            <button
              key={size}
              onClick={(e) => {
                e.stopPropagation();
                console.log('[ElementHoverMenu] Changing title size to:', size);
                setFormData({
                  ...formData,
                  title_style: {
                    ...formData.title_style,
                    size: {
                      desktop: size,
                      mobile: formData.title_style?.size?.mobile || 'text-4xl'
                    }
                  }
                });
                console.log('[ElementHoverMenu] After setFormData, title_style:', {
                  ...formData.title_style,
                  size: {
                    desktop: size,
                    mobile: formData.title_style?.size?.mobile || 'text-4xl'
                  }
                });
              }}
              className={cn(
                'px-2 py-1 text-xs rounded hover:bg-gray-100 transition-colors',
                titleStyle?.size?.desktop === size ? 'bg-sky-100 text-sky-600' : 'text-gray-600'
              )}
              title={`Size ${size.replace('text-', '')}`}
            >
              {size.replace('text-', '')}
            </button>
          ))
        ) : (
          ['text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl', 'text-4xl', 'text-5xl', 'text-6xl', 'text-7xl'].map((size) => (
            <button
              key={size}
              onClick={(e) => {
                e.stopPropagation();
                setFormData({
                  ...formData,
                  description_style: {
                    ...formData.description_style,
                    size: {
                      desktop: size,
                      mobile: formData.description_style?.size?.mobile || 'text-sm'
                    }
                  }
                });
              }}
              className={cn(
                'px-2 py-1 text-xs rounded hover:bg-gray-100 transition-colors',
                descStyle?.size?.desktop === size ? 'bg-sky-100 text-sky-600' : 'text-gray-600'
              )}
              title={`Size ${size.replace('text-', '')}`}
            >
              {size.replace('text-', '')}
            </button>
          ))
        )}
      </div>

      {/* Font Weight (Description only) */}
      {!isTitle && (
        <div className="flex items-center gap-0.5 border-r border-gray-200 pr-2 mr-1">
          {(['normal', 'medium', 'semibold', 'bold'] as const).map((weight) => (
            <button
              key={weight}
              onClick={(e) => {
                e.stopPropagation();
                setFormData({
                  ...formData,
                  description_style: { ...formData.description_style, weight }
                });
              }}
              className={cn(
                'px-2 py-1 text-xs rounded hover:bg-gray-100 transition-colors',
                descStyle?.weight === weight ? 'bg-sky-100 text-sky-600' : 'text-gray-600'
              )}
              title={`Weight ${weight}`}
            >
              {weight.charAt(0).toUpperCase()}
            </button>
          ))}
        </div>
      )}

      {/* Color Picker */}
      <div className="relative">
        <button
          onClick={(e) => e.stopPropagation()}
          className="p-1.5 rounded hover:bg-gray-100 transition-colors text-gray-600"
          title="Change color"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
          </svg>
        </button>
      </div>

      {/* Gradient Toggle (Title only) */}
      {isTitle && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setFormData({
              ...formData,
              title_style: {
                ...formData.title_style,
                is_gradient: !formData.title_style?.is_gradient,
                gradient: !formData.title_style?.is_gradient ? (formData.title_style?.gradient || { from: 'from-blue-600', via: 'via-purple-600', to: 'to-pink-600' }) : undefined
              }
            });
          }}
          className={cn(
            'p-1.5 rounded hover:bg-gray-100 transition-colors',
            formData.title_style?.is_gradient ? 'bg-sky-100 text-sky-600' : 'text-gray-600'
          )}
          title="Toggle gradient"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
      )}
    </div>
  );
};

interface HeroFormData {
  title: string;
  description: string;
  button?: string;
  image?: string | null;
  animation_element?: string;
  title_style: {
    font?: string;
    color?: string;
    is_gradient?: boolean;
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
    height?: number;
    width?: number;
  };
  background_style: {
    color?: string;
    is_gradient?: boolean;
    gradient?: { from: string; via?: string; to: string };
    seo_title?: string;
    column?: number;
  };
  button_style: {
    aboveDescription?: boolean;
    isVideo?: boolean;
    url?: string;
    color?: string;
    gradient?: { from: string; via?: string; to: string };
  };
  title_translation?: string;
  description_translation?: string;
  button_translation?: string;
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
  const [showButtonColorPicker, setShowButtonColorPicker] = useState(false);
  const [showTitleGradFromPicker, setShowTitleGradFromPicker] = useState(false);
  const [showTitleGradViaPicker, setShowTitleGradViaPicker] = useState(false);
  const [showTitleGradToPicker, setShowTitleGradToPicker] = useState(false);
  const [showBgGradFromPicker, setShowBgGradFromPicker] = useState(false);
  const [showBgGradViaPicker, setShowBgGradViaPicker] = useState(false);
  const [showBgGradToPicker, setShowBgGradToPicker] = useState(false);
  const [showButtonGradFromPicker, setShowButtonGradFromPicker] = useState(false);
  const [showButtonGradViaPicker, setShowButtonGradViaPicker] = useState(false);
  const [showButtonGradToPicker, setShowButtonGradToPicker] = useState(false);
  const [showImageGallery, setShowImageGallery] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [hoveredElement, setHoveredElement] = useState<'title' | 'description' | null>(null);
  const [editingElement, setEditingElement] = useState<'title' | 'description' | null>(null);
  const [hoveredElementRect, setHoveredElementRect] = useState<DOMRect | null>(null);
  const [isTextResizing, setIsTextResizing] = useState(false);
  const [textResizeStart, setTextResizeStart] = useState({ x: 0, y: 0, fontSize: 0 });
  const [resizingElement, setResizingElement] = useState<'title' | 'description' | null>(null);
  
  // Dropdown menu states
  const [showLayoutDropdown, setShowLayoutDropdown] = useState(false);
  const [showTitleDropdown, setShowTitleDropdown] = useState(false);
  const [showDescriptionDropdown, setShowDescriptionDropdown] = useState(false);
  const [showButtonDropdown, setShowButtonDropdown] = useState(false);
  const [showImageStyleDropdown, setShowImageStyleDropdown] = useState(false);
  
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
  });

  // Computed values for preview (mirroring Hero.tsx)
  const imagePosition = formData.image_style?.position || 'right';
  const isImageFullPage = formData.image_style?.fullPage || false;
  const shouldShowInlineImage = formData.image && !isImageFullPage;
  const translatedH1Title = formData.title;
  const translatedPDescription = formData.description;

  const backgroundClass = useMemo(() => {
    const bgStyle = formData.background_style || {};
    if (bgStyle.is_gradient && bgStyle.gradient) {
      // For gradients, we'll use inline styles instead of Tailwind classes
      return 'bg-transparent hover:bg-sky-50';
    }
    return `bg-${bgStyle.color || 'transparent'} hover:bg-sky-50`;
  }, [formData.background_style]);

  const backgroundStyle = useMemo(() => {
    const bgStyle = formData.background_style || {};
    if (bgStyle.is_gradient && bgStyle.gradient) {
      const fromColor = getColorValue(bgStyle.gradient.from?.replace('from-', '') || 'blue-50');
      const viaColor = getColorValue(bgStyle.gradient.via?.replace('via-', '') || 'white');
      const toColor = getColorValue(bgStyle.gradient.to?.replace('to-', '') || 'purple-50');
      return { backgroundImage: `linear-gradient(135deg, ${fromColor}, ${viaColor}, ${toColor})` };
    }
    return {};
  }, [formData.background_style]);

  const textColorClass = useMemo(() => {
    const titleStyle = formData.title_style || {};
    if (titleStyle.is_gradient && titleStyle.gradient) {
      // For gradients, we'll use inline styles instead of Tailwind classes
      return 'text-transparent';
    }
    return `text-${titleStyle.color || 'gray-700'}`;
  }, [formData.title_style]);

  const titleGradientStyle = useMemo(() => {
    const titleStyle = formData.title_style || {};
    if (titleStyle.is_gradient && titleStyle.gradient) {
      const fromColor = getColorValue(titleStyle.gradient.from?.replace('from-', '') || 'blue-600');
      const viaColor = getColorValue(titleStyle.gradient.via?.replace('via-', '') || 'purple-600');
      const toColor = getColorValue(titleStyle.gradient.to?.replace('to-', '') || 'pink-600');
      return {
        backgroundImage: `linear-gradient(90deg, ${fromColor}, ${viaColor}, ${toColor})`,
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        WebkitTextFillColor: 'transparent'
      };
    }
    return {};
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
      console.log('[Modal] Initializing formData from editingSection:', editingSection);
      console.log('[Modal] animation_element from editingSection:', (editingSection as any).animation_element);
      // Handle migration from old fields to new JSONB structure
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
        animation_element: (editingSection as any).animation_element || '',
      });
      console.log('[Modal] Set formData.animation_element to:', (editingSection as any).animation_element || '');
    }
  }, [editingSection]);

  // Listen for hero section updates to reflect changes immediately in modal
  useEffect(() => {
    const handleHeroSectionUpdate = (event: CustomEvent) => {
      const updatedData = event.detail;
      console.log('[HeroSectionEditModal] Received hero-section-updated event:', updatedData);
      
      // Update formData with the new data from the event
      setFormData(prevData => ({
        ...prevData,
        title: updatedData.title || prevData.title,
        description: updatedData.description || prevData.description,
        button: updatedData.button || prevData.button,
        image: updatedData.image || prevData.image,
        animation_element: updatedData.animation_element !== undefined ? updatedData.animation_element : prevData.animation_element,
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

  // Auto-expand textarea for title
  const handleTitleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData({ ...formData, title: e.target.value });
    // Debounced auto-resize with rAF and max height
    if (titleResizeRAF.current) cancelAnimationFrame(titleResizeRAF.current);
    titleResizeRAF.current = requestAnimationFrame(() => {
      if (!titleTextareaRef.current) return;
      const el = titleTextareaRef.current;
      el.style.height = 'auto';
      el.style.maxHeight = '400px'; // Increased max height for better expansion
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

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.dropdown-container') && 
          !target.closest('.layout-dropdown') && 
          !target.closest('.title-dropdown') && 
          !target.closest('.description-dropdown') && 
          !target.closest('.button-dropdown') &&
          !target.closest('.image-style-dropdown') &&
          !target.closest('.layout-dropdown-content') && 
          !target.closest('.title-dropdown-content') && 
          !target.closest('.description-dropdown-content') && 
          !target.closest('.button-dropdown-content') &&
          !target.closest('.image-style-dropdown-content')) {
        setShowLayoutDropdown(false);
        setShowTitleDropdown(false);
        setShowDescriptionDropdown(false);
        setShowButtonDropdown(false);
        setShowImageStyleDropdown(false);
        setShowTitleColorPicker(false);
        setShowDescColorPicker(false);
        setShowBgColorPicker(false);
        setShowButtonColorPicker(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleSave = async () => {
    setHasTriedSave(true);
    setSaveError(null);
    if (!formData.title.trim()) {
      return;
    }
    setIsSaving(true);
    console.log('[HeroModal] Saving formData:', JSON.stringify(formData, null, 2));
    console.log('[HeroModal] Title color:', formData.title_style?.color);
    console.log('[HeroModal] Background color:', formData.background_style?.color);
    console.log('[HeroModal] Button color:', formData.button_style?.color);
    console.log('[HeroModal] Description color:', formData.description_style?.color);
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
        setShowButtonColorPicker(false);
        setShowTitleGradFromPicker(false);
        setShowTitleGradViaPicker(false);
        setShowTitleGradToPicker(false);
        setShowBgGradFromPicker(false);
        setShowBgGradViaPicker(false);
        setShowBgGradToPicker(false);
        setShowButtonGradFromPicker(false);
        setShowButtonGradViaPicker(false);
        setShowButtonGradToPicker(false);
      }
    };

    if (showTitleColorPicker || showDescColorPicker || showBgColorPicker || showButtonColorPicker ||
        showTitleGradFromPicker || showTitleGradViaPicker || showTitleGradToPicker ||
        showBgGradFromPicker || showBgGradViaPicker || showBgGradToPicker ||
        showButtonGradFromPicker || showButtonGradViaPicker || showButtonGradToPicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showTitleColorPicker, showDescColorPicker, showBgColorPicker, showButtonColorPicker,
      showTitleGradFromPicker, showTitleGradViaPicker, showTitleGradToPicker,
      showBgGradFromPicker, showBgGradViaPicker, showBgGradToPicker,
      showButtonGradFromPicker, showButtonGradViaPicker, showButtonGradToPicker]);

  // Image resize handlers
  const handleMouseDown = useCallback((e: React.MouseEvent, handle: string) => {
    if (!formData.image || formData.image_style?.position === 'background') {
      return;
    }
    
    e.preventDefault();
    e.stopPropagation();
    
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const currentWidth = formData.image_style?.width || rect.width || 400;
    const currentHeight = formData.image_style?.height || rect.height || 300;
    
    setIsResizing(true);
    setResizeHandle(handle);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: currentWidth,
      height: currentHeight
    });
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [formData.image, formData.image_style?.position]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing || !resizeHandle) return;
    
    const deltaX = e.clientX - resizeStart.x;
    const deltaY = e.clientY - resizeStart.y;
    
    let newWidth = resizeStart.width;
    let newHeight = resizeStart.height;
    
    switch (resizeHandle) {
      case 'se': // southeast
        newWidth = Math.max(50, resizeStart.width + deltaX);
        newHeight = Math.max(50, resizeStart.height + deltaY);
        break;
      case 'sw': // southwest
        newWidth = Math.max(50, resizeStart.width - deltaX);
        newHeight = Math.max(50, resizeStart.height + deltaY);
        break;
      case 'ne': // northeast
        newWidth = Math.max(50, resizeStart.width + deltaX);
        newHeight = Math.max(50, resizeStart.height - deltaY);
        break;
      case 'nw': // northwest
        newWidth = Math.max(50, resizeStart.width - deltaX);
        newHeight = Math.max(50, resizeStart.height - deltaY);
        break;
      case 'e': // east
        newWidth = Math.max(50, resizeStart.width + deltaX);
        break;
      case 'w': // west
        newWidth = Math.max(50, resizeStart.width - deltaX);
        break;
      case 's': // south
        newHeight = Math.max(50, resizeStart.height + deltaY);
        break;
      case 'n': // north
        newHeight = Math.max(50, resizeStart.height - deltaY);
        break;
    }
    
    setFormData(prev => ({
      ...prev,
      image_style: {
        ...prev.image_style,
        width: Math.round(newWidth),
        height: Math.round(newHeight)
      }
    }));
  }, [isResizing, resizeHandle, resizeStart]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
    setResizeHandle(null);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove]);

  // Cleanup event listeners on unmount or modal close
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousemove', handleTextMouseMove);
      document.removeEventListener('mouseup', handleTextMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  // Text resize handlers
  const handleTextMouseDown = useCallback((e: React.MouseEvent, element: 'title' | 'description') => {
    e.preventDefault();
    e.stopPropagation();
    
    const currentFontSize = element === 'title' 
      ? parseInt(formData.title_style?.size?.desktop?.replace('text-', '') || '56')
      : parseInt(formData.description_style?.size?.desktop?.replace('text-', '') || '18');
    
    setIsTextResizing(true);
    setResizingElement(element);
    setTextResizeStart({
      x: e.clientX,
      y: e.clientY,
      fontSize: currentFontSize
    });
    
    document.addEventListener('mousemove', handleTextMouseMove);
    document.addEventListener('mouseup', handleTextMouseUp);
  }, [formData.title_style?.size?.desktop, formData.description_style?.size?.desktop]);

  const handleTextMouseMove = useCallback((e: MouseEvent) => {
    if (!isTextResizing || !resizingElement) return;
    
    const deltaY = e.clientY - textResizeStart.y;
    const sensitivity = 1; // Adjust sensitivity
    const fontSizeChange = Math.round(deltaY / sensitivity);
    const newFontSize = Math.max(12, Math.min(120, textResizeStart.fontSize + fontSizeChange));
    
    // Use inline style for dynamic font size during resize
    const element = resizingElement === 'title' ? titleTextareaRef.current : descriptionTextareaRef.current;
    if (element) {
      element.style.fontSize = `${newFontSize}px`;
    }
  }, [isTextResizing, resizingElement, textResizeStart]);

  const handleTextMouseUp = useCallback(() => {
    if (!isTextResizing || !resizingElement) return;
    
    const element = resizingElement === 'title' ? titleTextareaRef.current : descriptionTextareaRef.current;
    if (element) {
      const computedFontSize = parseInt(window.getComputedStyle(element).fontSize);
      const newSizeClass = `text-${Math.round(computedFontSize / 4) * 4}`; // Round to nearest 4px increment
      
      setFormData(prev => ({
        ...prev,
        [resizingElement === 'title' ? 'title_style' : 'description_style']: {
          ...prev[resizingElement === 'title' ? 'title_style' : 'description_style'],
          size: {
            desktop: newSizeClass,
            mobile: prev[resizingElement === 'title' ? 'title_style' : 'description_style']?.size?.mobile || 
                    (resizingElement === 'title' ? 'text-4xl' : 'text-sm')
          }
        }
      }));
      
      // Reset inline style
      element.style.fontSize = '';
    }
    
    setIsTextResizing(false);
    setResizingElement(null);
    document.removeEventListener('mousemove', handleTextMouseMove);
    document.removeEventListener('mouseup', handleTextMouseUp);
  }, [isTextResizing, resizingElement, handleTextMouseMove]);

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
  const previewBackgroundStyle = backgroundStyle;

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
        resizable={false}
        noPadding={true}
      >
        {/* Fixed Toolbar */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6">
          <div className="flex items-center gap-1 py-3">
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
                <Tooltip content="Add or change hero image" useFixedPosition={true} />
              </div>

              {/* Image Style Dropdown */}
              {formData.image && (
                <>
                  <div className="relative">
                    <button
                      onClick={() => {
                        setShowImageStyleDropdown(!showImageStyleDropdown);
                        setShowLayoutDropdown(false);
                        setShowTitleDropdown(false);
                        setShowDescriptionDropdown(false);
                        setShowButtonDropdown(false);
                      }}
                      className="image-style-dropdown flex items-center gap-2 px-2 py-2 sm:px-3 sm:py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 sm:bg-gray-50 sm:border sm:border-gray-200 rounded-lg transition-colors"
                    >
                      <AdjustmentsHorizontalIcon className="w-5 h-5 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">Image Style</span>
                      <ChevronDownIcon className={cn("w-4 h-4 transition-transform hidden sm:block", showImageStyleDropdown ? "rotate-180" : "")} />
                    </button>
                    
                    {showImageStyleDropdown && (
                      <div className="image-style-dropdown-content fixed inset-x-0 top-0 sm:absolute sm:top-full sm:mt-2 sm:left-0 w-full sm:w-96 h-full sm:h-auto bg-white border-t sm:border border-gray-200 sm:rounded-lg shadow-lg z-[9999] p-4 sm:p-4 overflow-y-auto">
                        {/* Mobile Close Button */}
                        <div className="flex items-center justify-between mb-4 sm:hidden">
                          <h3 className="text-lg font-semibold text-gray-900">Image Style Settings</h3>
                          <button
                            onClick={() => setShowImageStyleDropdown(false)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <XMarkIcon className="w-5 h-5 text-gray-500" />
                          </button>
                        </div>

                        <div className="space-y-4">
                          {/* Image Position */}
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-2">Position</label>
                            <div className="grid grid-cols-2 gap-2">
                              {(['left', 'right', 'background', 'inline'] as const).map((position) => (
                                <button
                                  key={position}
                                  onClick={() => setFormData({
                                    ...formData,
                                    image_style: { ...formData.image_style, position }
                                  })}
                                  className={cn(
                                    'px-3 py-2 text-sm rounded-md border transition-colors capitalize',
                                    formData.image_style?.position === position
                                      ? 'bg-sky-100 text-sky-700 border-sky-300'
                                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                  )}
                                >
                                  {position}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Full Page Toggle */}
                          <div>
                            <label className="flex items-center justify-between cursor-pointer">
                              <span className="text-xs font-medium text-gray-700">Full Page</span>
                              <div className="relative">
                                <input
                                  type="checkbox"
                                  checked={formData.image_style?.fullPage || false}
                                  onChange={(e) => setFormData({
                                    ...formData,
                                    image_style: { ...formData.image_style, fullPage: e.target.checked }
                                  })}
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-sky-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
                              </div>
                            </label>
                          </div>

                          {/* Height */}
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-2">
                              Height (px)
                            </label>
                            <input
                              type="number"
                              value={formData.image_style?.height || ''}
                              onChange={(e) => setFormData({
                                ...formData,
                                image_style: { ...formData.image_style, height: parseInt(e.target.value) || undefined }
                              })}
                              placeholder="Auto"
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                            />
                          </div>

                          {/* Width */}
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-2">
                              Width (px)
                            </label>
                            <input
                              type="number"
                              value={formData.image_style?.width || ''}
                              onChange={(e) => setFormData({
                                ...formData,
                                image_style: { ...formData.image_style, width: parseInt(e.target.value) || undefined }
                              })}
                              placeholder="Auto"
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              <div className="w-px h-6 bg-gray-300 mx-1" />

              {/* Layout Dropdown */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowLayoutDropdown(!showLayoutDropdown);
                    setShowImageStyleDropdown(false);
                    setShowTitleDropdown(false);
                    setShowDescriptionDropdown(false);
                    setShowButtonDropdown(false);
                  }}
                  className="layout-dropdown flex items-center gap-2 px-2 py-2 sm:px-3 sm:py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 sm:bg-gray-50 sm:border sm:border-gray-200 rounded-lg transition-colors"
                >
                  <RectangleGroupIcon className="w-5 h-5 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Layout</span>
                  <ChevronDownIcon className={cn("w-4 h-4 transition-transform hidden sm:block", showLayoutDropdown ? "rotate-180" : "")} />
                </button>
                
                {showLayoutDropdown && (
                  <div className="layout-dropdown-content fixed inset-x-0 top-0 sm:absolute sm:top-full sm:mt-2 sm:left-0 w-full sm:w-96 h-full sm:h-auto bg-white border-t sm:border border-gray-200 sm:rounded-lg shadow-lg z-[9999] p-4 sm:p-4 overflow-y-auto">
                    {/* Mobile Close Button */}
                    <div className="flex items-center justify-between mb-4 sm:hidden">
                      <h3 className="text-lg font-semibold text-gray-900">Layout Settings</h3>
                      <button
                        onClick={() => setShowLayoutDropdown(false)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <XMarkIcon className="w-5 h-5 text-gray-500" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {/* Column Layout */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Columns</label>
                        <select
                          value={formData.background_style?.column || 1}
                          onChange={(e) => setFormData({
                            ...formData,
                            background_style: { ...formData.background_style, column: parseInt(e.target.value) }
                          })}
                          className="w-full p-2 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
                        >
                          <option value={1}>1 Column</option>
                          <option value={2}>2 Columns</option>
                          <option value={3}>3 Columns</option>
                        </select>
                      </div>

                      {/* Content Width */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Content Width</label>
                        <select
                          value={formData.title_style?.blockWidth || '4xl'}
                          onChange={(e) => setFormData({
                            ...formData,
                            title_style: { ...formData.title_style, blockWidth: e.target.value }
                          })}
                          className="w-full p-2 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
                        >
                          <option value="2xl">2xl</option>
                          <option value="3xl">3xl</option>
                          <option value="4xl">4xl</option>
                          <option value="5xl">5xl</option>
                          <option value="6xl">6xl</option>
                          <option value="7xl">7xl</option>
                          <option value="full">Full</option>
                        </select>
                      </div>

                      {/* Alignment */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Alignment</label>
                        <div className="flex gap-1">
                          {(['left', 'center', 'right'] as const).map((align) => (
                            <button
                              key={align}
                              onClick={() => setFormData({
                                ...formData,
                                title_style: { ...formData.title_style, alignment: align }
                              })}
                              className={cn(
                                'px-3 py-1 text-xs font-medium rounded border transition-colors',
                                formData.title_style?.alignment === align
                                  ? 'bg-sky-100 text-sky-700 border-sky-200'
                                  : 'text-gray-600 hover:text-sky-700 hover:bg-gray-50 border-gray-200'
                              )}
                            >
                              {align.charAt(0).toUpperCase() + align.slice(1)}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Animation Element */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Animation</label>
                        <select
                          value={formData.animation_element || ''}
                          onChange={(e) => setFormData({ ...formData, animation_element: e.target.value as any })}
                          className="w-full p-2 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
                        >
                          <option value="">No animation</option>
                          <option value="DotGrid">DotGrid</option>
                          <option value="LetterGlitch">LetterGlitch</option>
                          <option value="MagicBento">MagicBento</option>
                        </select>
                      </div>

                      {/* Background Color */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Background Color</label>
                        <div className="dropdown-container">
                          <ColorPaletteDropdown
                            value={formData.background_style?.color || 'white'}
                            onChange={(colorClass: string) => {
                              console.log('[Background Color] Selected color:', colorClass);
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
                        </div>
                      </div>

                      {/* Background Gradient Toggle */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Background Gradient</label>
                        <label className="inline-flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={!!formData.background_style?.is_gradient}
                            onChange={(e) => setFormData({
                              ...formData,
                              background_style: {
                                ...formData.background_style,
                                is_gradient: e.target.checked,
                                gradient: e.target.checked ? (formData.background_style?.gradient || { from: 'from-blue-50', via: 'via-white', to: 'to-purple-50' }) : undefined
                              }
                            })}
                          />
                          Enable
                        </label>
                      </div>

                      {/* Background Gradient Colors */}
                      {formData.background_style?.is_gradient && (
                        <div className="col-span-2">
                          <label className="block text-xs font-medium text-gray-700 mb-2">Gradient Colors</label>
                          <div className="flex items-center gap-2">
                            <div className="dropdown-container">
                              <ColorPaletteDropdown
                                value={formData.background_style?.gradient?.from?.replace('from-', '') || 'blue-50'}
                                onChange={(colorClass: string) => {
                                  console.log('[Background Gradient From] Selected color:', colorClass);
                                  setFormData({
                                    ...formData,
                                    background_style: {
                                      ...formData.background_style,
                                      gradient: {
                                        ...formData.background_style?.gradient,
                                        from: `from-${colorClass}`,
                                        via: formData.background_style?.gradient?.via || 'via-white',
                                        to: formData.background_style?.gradient?.to || 'to-purple-50'
                                      }
                                    }
                                  });
                                  setShowBgGradFromPicker(false);
                                }}
                                isOpen={showBgGradFromPicker}
                                onToggle={() => {
                                  setShowBgGradFromPicker(!showBgGradFromPicker);
                                  setShowBgGradViaPicker(false);
                                  setShowBgGradToPicker(false);
                                  setShowBgColorPicker(false);
                                  setShowTitleColorPicker(false);
                                  setShowDescColorPicker(false);
                                  setShowButtonColorPicker(false);
                                }}
                                onClose={() => setShowBgGradFromPicker(false)}
                                buttonClassName="w-8 h-8"
                                previewSize="sm"
                                title="Background gradient start"
                                useFixedPosition={true}
                              />
                            </div>
                            <div className="dropdown-container">
                              <ColorPaletteDropdown
                                value={formData.background_style?.gradient?.via?.replace('via-', '') || 'white'}
                                onChange={(colorClass: string) => {
                                  console.log('[Background Gradient Via] Selected color:', colorClass);
                                  setFormData({
                                    ...formData,
                                    background_style: {
                                      ...formData.background_style,
                                      gradient: {
                                        ...formData.background_style?.gradient,
                                        from: formData.background_style?.gradient?.from || 'from-blue-50',
                                        via: `via-${colorClass}`,
                                        to: formData.background_style?.gradient?.to || 'to-purple-50'
                                      }
                                    }
                                  });
                                  setShowBgGradViaPicker(false);
                                }}
                                isOpen={showBgGradViaPicker}
                                onToggle={() => {
                                  setShowBgGradViaPicker(!showBgGradViaPicker);
                                  setShowBgGradFromPicker(false);
                                  setShowBgGradToPicker(false);
                                  setShowBgColorPicker(false);
                                  setShowTitleColorPicker(false);
                                  setShowDescColorPicker(false);
                                  setShowButtonColorPicker(false);
                                }}
                                onClose={() => setShowBgGradViaPicker(false)}
                                buttonClassName="w-8 h-8"
                                previewSize="sm"
                                title="Background gradient middle"
                                useFixedPosition={true}
                              />
                            </div>
                            <div className="dropdown-container">
                              <ColorPaletteDropdown
                                value={formData.background_style?.gradient?.to?.replace('to-', '') || 'purple-50'}
                                onChange={(colorClass: string) => {
                                  console.log('[Background Gradient To] Selected color:', colorClass);
                                  setFormData({
                                    ...formData,
                                    background_style: {
                                      ...formData.background_style,
                                      gradient: {
                                        ...formData.background_style?.gradient,
                                        from: formData.background_style?.gradient?.from || 'from-blue-50',
                                        via: formData.background_style?.gradient?.via || 'via-white',
                                        to: `to-${colorClass}`
                                      }
                                    }
                                  });
                                  setShowBgGradToPicker(false);
                                }}
                                isOpen={showBgGradToPicker}
                                onToggle={() => {
                                  setShowBgGradToPicker(!showBgGradToPicker);
                                  setShowBgGradFromPicker(false);
                                  setShowBgGradViaPicker(false);
                                  setShowBgColorPicker(false);
                                  setShowTitleColorPicker(false);
                                  setShowDescColorPicker(false);
                                  setShowButtonColorPicker(false);
                                }}
                                onClose={() => setShowBgGradToPicker(false)}
                                buttonClassName="w-8 h-8"
                                previewSize="sm"
                                title="Background gradient end"
                                useFixedPosition={true}
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* SEO Title */}
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">SEO Title</label>
                        <input
                          type="text"
                          value={formData.background_style?.seo_title || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            background_style: { ...formData.background_style, seo_title: e.target.value }
                          })}
                          placeholder="SEO title..."
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="w-px h-6 bg-gray-300 mx-1 hidden sm:block" />

              {/* Title Dropdown */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowTitleDropdown(!showTitleDropdown);
                    setShowLayoutDropdown(false);
                    setShowImageStyleDropdown(false);
                    setShowDescriptionDropdown(false);
                    setShowButtonDropdown(false);
                  }}
                  className="title-dropdown flex items-center gap-2 px-2 py-2 sm:px-3 sm:py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 sm:bg-gray-50 sm:border sm:border-gray-200 rounded-lg transition-colors"
                >
                  <DocumentTextIcon className="w-5 h-5 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Title</span>
                  <ChevronDownIcon className={cn("w-4 h-4 transition-transform hidden sm:block", showTitleDropdown ? "rotate-180" : "")} />
                </button>
                
                {showTitleDropdown && (
                  <div className="title-dropdown-content fixed inset-x-0 top-0 sm:absolute sm:top-full sm:mt-2 sm:left-0 w-full sm:w-96 h-full sm:h-auto bg-white border-t sm:border border-gray-200 sm:rounded-lg shadow-lg z-[9999] p-4 sm:p-4 overflow-y-auto">
                    {/* Mobile Close Button */}
                    <div className="flex items-center justify-between mb-4 sm:hidden">
                      <h3 className="text-lg font-semibold text-gray-900">Title Settings</h3>
                      <button
                        onClick={() => setShowTitleDropdown(false)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <XMarkIcon className="w-5 h-5 text-gray-500" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {/* Title Text */}
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Title Text</label>
                        <input
                          type="text"
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 focus:outline-none"
                          placeholder="Enter hero title..."
                        />
                      </div>

                      {/* Title Size Desktop */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Desktop Size</label>
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
                          className="w-full p-2 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
                        >
                          <option value="text-lg">lg</option>
                          <option value="text-xl">xl</option>
                          <option value="text-2xl">2xl</option>
                          <option value="text-3xl">3xl</option>
                          <option value="text-4xl">4xl</option>
                          <option value="text-5xl">5xl</option>
                          <option value="text-6xl">6xl</option>
                          <option value="text-7xl">7xl</option>
                        </select>
                      </div>

                      {/* Title Size Mobile */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Mobile Size</label>
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
                          className="w-full p-2 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
                        >
                          <option value="text-lg">lg</option>
                          <option value="text-xl">xl</option>
                          <option value="text-2xl">2xl</option>
                          <option value="text-3xl">3xl</option>
                          <option value="text-4xl">4xl</option>
                          <option value="text-5xl">5xl</option>
                          <option value="text-6xl">6xl</option>
                          <option value="text-7xl">7xl</option>
                        </select>
                      </div>

                      {/* Title Color */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Text Color</label>
                        <div className="dropdown-container">
                          <ColorPaletteDropdown
                            value={formData.title_style?.color || 'gray-900'}
                            onChange={(colorClass: string) => {
                              console.log('[Title Color] Selected color:', colorClass);
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
                        </div>
                      </div>

                      {/* Title Gradient Toggle */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Text Gradient</label>
                        <label className="inline-flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={!!formData.title_style?.is_gradient}
                            onChange={(e) => setFormData({
                              ...formData,
                              title_style: {
                                ...formData.title_style,
                                is_gradient: e.target.checked,
                                gradient: e.target.checked ? (formData.title_style?.gradient || { from: 'from-blue-600', via: 'via-purple-600', to: 'to-pink-600' }) : undefined
                              }
                            })}
                          />
                          Enable
                        </label>
                      </div>

                      {/* Title Gradient Colors */}
                      {formData.title_style?.is_gradient && (
                        <div className="col-span-2">
                          <label className="block text-xs font-medium text-gray-700 mb-2">Gradient Colors</label>
                          <div className="flex items-center gap-2">
                            <div className="dropdown-container">
                              <ColorPaletteDropdown
                                value={formData.title_style?.gradient?.from?.replace('from-', '') || 'blue-600'}
                                onChange={(colorClass: string) => {
                                  console.log('[Title Gradient From] Selected color:', colorClass);
                                  setFormData({
                                    ...formData,
                                    title_style: {
                                      ...formData.title_style,
                                      gradient: {
                                        ...formData.title_style?.gradient,
                                        from: `from-${colorClass}`,
                                        via: formData.title_style?.gradient?.via || 'via-purple-600',
                                        to: formData.title_style?.gradient?.to || 'to-pink-600'
                                      }
                                    }
                                  });
                                  setShowTitleGradFromPicker(false);
                                }}
                                isOpen={showTitleGradFromPicker}
                                onToggle={() => {
                                  setShowTitleGradFromPicker(!showTitleGradFromPicker);
                                  setShowTitleGradViaPicker(false);
                                  setShowTitleGradToPicker(false);
                                  setShowTitleColorPicker(false);
                                  setShowDescColorPicker(false);
                                  setShowBgColorPicker(false);
                                  setShowButtonColorPicker(false);
                                }}
                                onClose={() => setShowTitleGradFromPicker(false)}
                                buttonClassName="w-8 h-8"
                                previewSize="sm"
                                title="Title gradient start"
                                useFixedPosition={true}
                              />
                            </div>
                            <div className="dropdown-container">
                              <ColorPaletteDropdown
                                value={formData.title_style?.gradient?.via?.replace('via-', '') || 'purple-600'}
                                onChange={(colorClass: string) => {
                                  console.log('[Title Gradient Via] Selected color:', colorClass);
                                  setFormData({
                                    ...formData,
                                    title_style: {
                                      ...formData.title_style,
                                      gradient: {
                                        ...formData.title_style?.gradient,
                                        from: formData.title_style?.gradient?.from || 'from-blue-600',
                                        via: `via-${colorClass}`,
                                        to: formData.title_style?.gradient?.to || 'to-pink-600'
                                      }
                                    }
                                  });
                                  setShowTitleGradViaPicker(false);
                                }}
                                isOpen={showTitleGradViaPicker}
                                onToggle={() => {
                                  setShowTitleGradViaPicker(!showTitleGradViaPicker);
                                  setShowTitleGradFromPicker(false);
                                  setShowTitleGradToPicker(false);
                                  setShowTitleColorPicker(false);
                                  setShowDescColorPicker(false);
                                  setShowBgColorPicker(false);
                                  setShowButtonColorPicker(false);
                                }}
                                onClose={() => setShowTitleGradViaPicker(false)}
                                buttonClassName="w-8 h-8"
                                previewSize="sm"
                                title="Title gradient middle"
                                useFixedPosition={true}
                              />
                            </div>
                            <div className="dropdown-container">
                              <ColorPaletteDropdown
                                value={formData.title_style?.gradient?.to?.replace('to-', '') || 'pink-600'}
                                onChange={(colorClass: string) => {
                                  console.log('[Title Gradient To] Selected color:', colorClass);
                                  setFormData({
                                    ...formData,
                                    title_style: {
                                      ...formData.title_style,
                                      gradient: {
                                        ...formData.title_style?.gradient,
                                        from: formData.title_style?.gradient?.from || 'from-blue-600',
                                        via: formData.title_style?.gradient?.via || 'via-purple-600',
                                        to: `to-${colorClass}`
                                      }
                                    }
                                  });
                                  setShowTitleGradToPicker(false);
                                }}
                                isOpen={showTitleGradToPicker}
                                onToggle={() => {
                                  setShowTitleGradToPicker(!showTitleGradToPicker);
                                  setShowTitleGradFromPicker(false);
                                  setShowTitleGradViaPicker(false);
                                  setShowTitleColorPicker(false);
                                  setShowDescColorPicker(false);
                                  setShowBgColorPicker(false);
                                  setShowButtonColorPicker(false);
                                }}
                                onClose={() => setShowTitleGradToPicker(false)}
                                buttonClassName="w-8 h-8"
                                previewSize="sm"
                                title="Title gradient end"
                                useFixedPosition={true}
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Title Translation */}
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Title Translation Key</label>
                        <input
                          type="text"
                          value={formData.title_translation || ''}
                          onChange={(e) => setFormData({ ...formData, title_translation: e.target.value })}
                          placeholder="hero.title.main"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="w-px h-6 bg-gray-300 mx-1 hidden sm:block" />

              {/* Description Dropdown */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowDescriptionDropdown(!showDescriptionDropdown);
                    setShowLayoutDropdown(false);
                    setShowImageStyleDropdown(false);
                    setShowTitleDropdown(false);
                    setShowButtonDropdown(false);
                  }}
                  className="description-dropdown flex items-center gap-2 px-2 py-2 sm:px-3 sm:py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 sm:bg-gray-50 sm:border sm:border-gray-200 rounded-lg transition-colors"
                >
                  <DocumentTextIcon className="w-5 h-5 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Description</span>
                  <ChevronDownIcon className={cn("w-4 h-4 transition-transform hidden sm:block", showDescriptionDropdown ? "rotate-180" : "")} />
                </button>
                
                {showDescriptionDropdown && (
                  <div className="description-dropdown-content fixed inset-x-0 top-0 sm:absolute sm:top-full sm:mt-2 sm:left-0 w-full sm:w-96 h-full sm:h-auto bg-white border-t sm:border border-gray-200 sm:rounded-lg shadow-lg z-[9999] p-4 sm:p-4 overflow-y-auto">
                    {/* Mobile Close Button */}
                    <div className="flex items-center justify-between mb-4 sm:hidden">
                      <h3 className="text-lg font-semibold text-gray-900">Description Settings</h3>
                      <button
                        onClick={() => setShowDescriptionDropdown(false)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <XMarkIcon className="w-5 h-5 text-gray-500" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {/* Description Text */}
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Description Text</label>
                        <textarea
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          rows={3}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 focus:outline-none resize-none"
                          placeholder="Enter hero description..."
                        />
                      </div>

                      {/* Description Size Desktop */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Desktop Size</label>
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
                          className="w-full p-2 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
                        >
                          <option value="text-xs">xs</option>
                          <option value="text-sm">sm</option>
                          <option value="text-base">base</option>
                          <option value="text-lg">lg</option>
                          <option value="text-xl">xl</option>
                          <option value="text-2xl">2xl</option>
                          <option value="text-3xl">3xl</option>
                          <option value="text-4xl">4xl</option>
                          <option value="text-5xl">5xl</option>
                          <option value="text-6xl">6xl</option>
                          <option value="text-7xl">7xl</option>
                        </select>
                      </div>

                      {/* Description Size Mobile */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Mobile Size</label>
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
                          className="w-full p-2 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
                        >
                          <option value="text-xs">xs</option>
                          <option value="text-sm">sm</option>
                          <option value="text-base">base</option>
                          <option value="text-lg">lg</option>
                          <option value="text-xl">xl</option>
                          <option value="text-2xl">2xl</option>
                          <option value="text-3xl">3xl</option>
                          <option value="text-4xl">4xl</option>
                          <option value="text-5xl">5xl</option>
                          <option value="text-6xl">6xl</option>
                          <option value="text-7xl">7xl</option>
                        </select>
                      </div>

                      {/* Description Color */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Text Color</label>
                        <div className="dropdown-container">
                          <ColorPaletteDropdown
                            value={formData.description_style?.color || 'gray-600'}
                            onChange={(colorClass: string) => {
                              console.log('[Description Color] Selected color:', colorClass);
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
                        </div>
                      </div>

                      {/* Description Weight */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Font Weight</label>
                        <select
                          value={formData.description_style?.weight || 'font-normal'}
                          onChange={(e) => setFormData({
                            ...formData,
                            description_style: { ...formData.description_style, weight: e.target.value }
                          })}
                          className="w-full p-2 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
                        >
                          <option value="normal">normal</option>
                          <option value="medium">medium</option>
                          <option value="semibold">semibold</option>
                          <option value="bold">bold</option>
                        </select>
                      </div>

                      {/* Description Translation */}
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Description Translation Key</label>
                        <input
                          type="text"
                          value={formData.description_translation || ''}
                          onChange={(e) => setFormData({ ...formData, description_translation: e.target.value })}
                          placeholder="hero.description.main"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="w-px h-6 bg-gray-300 mx-1 hidden sm:block" />

              {/* Button Dropdown */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowButtonDropdown(!showButtonDropdown);
                    setShowLayoutDropdown(false);
                    setShowImageStyleDropdown(false);
                    setShowTitleDropdown(false);
                    setShowDescriptionDropdown(false);
                  }}
                  className="button-dropdown flex items-center gap-2 px-2 py-2 sm:px-3 sm:py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 sm:bg-gray-50 sm:border sm:border-gray-200 rounded-lg transition-colors"
                >
                  <PlayCircleIcon className="w-5 h-5 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Button</span>
                  <ChevronDownIcon className={cn("w-4 h-4 transition-transform hidden sm:block", showButtonDropdown ? "rotate-180" : "")} />
                </button>
                
                {showButtonDropdown && (
                  <div className="button-dropdown-content fixed inset-x-0 top-0 sm:absolute sm:top-full sm:mt-2 sm:left-0 w-full sm:w-96 h-full sm:h-auto bg-white border-t sm:border border-gray-200 sm:rounded-lg shadow-lg z-[9999] p-4 sm:p-4 overflow-y-auto">
                    {/* Mobile Close Button */}
                    <div className="flex items-center justify-between mb-4 sm:hidden">
                      <h3 className="text-lg font-semibold text-gray-900">Button Settings</h3>
                      <button
                        onClick={() => setShowButtonDropdown(false)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <XMarkIcon className="w-5 h-5 text-gray-500" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {/* Button Text */}
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Button Text</label>
                        <input
                          type="text"
                          value={formData.button}
                          onChange={(e) => setFormData({ ...formData, button: e.target.value })}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 focus:outline-none"
                          placeholder="Get Started"
                        />
                      </div>

                      {/* Video Button Toggle */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Button Type</label>
                        <label className="inline-flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={!!formData.button_style?.isVideo}
                            onChange={(e) => setFormData({
                              ...formData,
                              button_style: { ...formData.button_style, isVideo: e.target.checked }
                            })}
                          />
                          Video Button
                        </label>
                      </div>

                      {/* Button Position */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Position</label>
                        <button
                          onClick={() => setFormData({
                            ...formData,
                            button_style: { ...formData.button_style, aboveDescription: !formData.button_style?.aboveDescription }
                          })}
                          className={cn(
                            'w-full px-3 py-2 text-sm font-medium rounded-lg border transition-colors',
                            formData.button_style?.aboveDescription
                              ? 'bg-sky-100 text-sky-700 border-sky-200'
                              : 'text-gray-600 hover:text-sky-700 hover:bg-gray-50 border-gray-200'
                          )}
                        >
                          {formData.button_style?.aboveDescription ? 'Above Description' : 'Below Description'}
                        </button>
                      </div>

                      {/* Button URL */}
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Button URL</label>
                        <input
                          type="text"
                          value={formData.button_style?.url || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            button_style: { ...formData.button_style, url: e.target.value }
                          })}
                          placeholder="/products"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 focus:outline-none"
                        />
                      </div>

                      {/* Button Translation */}
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Button Translation Key</label>
                        <input
                          type="text"
                          value={formData.button_translation || ''}
                          onChange={(e) => setFormData({ ...formData, button_translation: e.target.value })}
                          placeholder="hero.button.primary"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 focus:outline-none"
                        />
                      </div>

                      {/* Button Color */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Button Color</label>
                        <div className="dropdown-container">
                          <ColorPaletteDropdown
                            value={formData.button_style?.color || 'sky-600'}
                            onChange={(colorClass: string) => {
                              console.log('[Button Color] Selected color:', colorClass);
                              setFormData({
                                ...formData,
                                button_style: { ...formData.button_style, color: colorClass }
                              });
                              setShowButtonColorPicker(false);
                            }}
                            isOpen={showButtonColorPicker}
                            onToggle={() => {
                              setShowButtonColorPicker(!showButtonColorPicker);
                              setShowTitleColorPicker(false);
                              setShowDescColorPicker(false);
                              setShowBgColorPicker(false);
                            }}
                            onClose={() => setShowButtonColorPicker(false)}
                            useFixedPosition={true}
                          />
                        </div>
                      </div>

                      {/* Button Gradient Toggle */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Button Gradient</label>
                        <label className="inline-flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={!!formData.button_style?.gradient}
                            onChange={(e) => setFormData({
                              ...formData,
                              button_style: {
                                ...formData.button_style,
                                gradient: e.target.checked ? { from: 'from-sky-600', via: 'via-sky-500', to: 'to-sky-700' } : undefined
                              }
                            })}
                          />
                          Enable
                        </label>
                      </div>

                      {/* Button Gradient Colors */}
                      {formData.button_style?.gradient && (
                        <div className="col-span-2">
                          <label className="block text-xs font-medium text-gray-700 mb-2">Gradient Colors</label>
                          <div className="flex items-center gap-2">
                            <div className="dropdown-container">
                              <ColorPaletteDropdown
                                value={formData.button_style?.gradient?.from?.replace('from-', '') || 'sky-600'}
                                onChange={(colorClass: string) => {
                                  console.log('[Button Gradient From] Selected color:', colorClass);
                                  setFormData({
                                    ...formData,
                                    button_style: {
                                      ...formData.button_style,
                                      gradient: {
                                        ...formData.button_style?.gradient,
                                        from: `from-${colorClass}`,
                                        via: formData.button_style?.gradient?.via || 'via-sky-500',
                                        to: formData.button_style?.gradient?.to || 'to-sky-700'
                                      }
                                    }
                                  });
                                  setShowButtonGradFromPicker(false);
                                }}
                                isOpen={showButtonGradFromPicker}
                                onToggle={() => {
                                  setShowButtonGradFromPicker(!showButtonGradFromPicker);
                                  setShowButtonGradViaPicker(false);
                                  setShowButtonGradToPicker(false);
                                  setShowButtonColorPicker(false);
                                  setShowTitleColorPicker(false);
                                  setShowDescColorPicker(false);
                                  setShowBgColorPicker(false);
                                }}
                                onClose={() => setShowButtonGradFromPicker(false)}
                                buttonClassName="w-8 h-8"
                                previewSize="sm"
                                title="Button gradient start"
                                useFixedPosition={true}
                              />
                            </div>
                            <div className="dropdown-container">
                              <ColorPaletteDropdown
                                value={formData.button_style?.gradient?.via?.replace('via-', '') || 'sky-500'}
                                onChange={(colorClass: string) => {
                                  console.log('[Button Gradient Via] Selected color:', colorClass);
                                  setFormData({
                                    ...formData,
                                    button_style: {
                                      ...formData.button_style,
                                      gradient: {
                                        ...formData.button_style?.gradient,
                                        from: formData.button_style?.gradient?.from || 'from-sky-600',
                                        via: `via-${colorClass}`,
                                        to: formData.button_style?.gradient?.to || 'to-sky-700'
                                      }
                                    }
                                  });
                                  setShowButtonGradViaPicker(false);
                                }}
                                isOpen={showButtonGradViaPicker}
                                onToggle={() => {
                                  setShowButtonGradViaPicker(!showButtonGradViaPicker);
                                  setShowButtonGradFromPicker(false);
                                  setShowButtonGradToPicker(false);
                                  setShowButtonColorPicker(false);
                                  setShowTitleColorPicker(false);
                                  setShowDescColorPicker(false);
                                  setShowBgColorPicker(false);
                                }}
                                onClose={() => setShowButtonGradViaPicker(false)}
                                buttonClassName="w-8 h-8"
                                previewSize="sm"
                                title="Button gradient middle"
                                useFixedPosition={true}
                              />
                            </div>
                            <div className="dropdown-container">
                              <ColorPaletteDropdown
                                value={formData.button_style?.gradient?.to?.replace('to-', '') || 'sky-700'}
                                onChange={(colorClass: string) => {
                                  console.log('[Button Gradient To] Selected color:', colorClass);
                                  setFormData({
                                    ...formData,
                                    button_style: {
                                      ...formData.button_style,
                                      gradient: {
                                        ...formData.button_style?.gradient,
                                        from: formData.button_style?.gradient?.from || 'from-sky-600',
                                        via: formData.button_style?.gradient?.via || 'via-sky-500',
                                        to: `to-${colorClass}`
                                      }
                                    }
                                  });
                                  setShowButtonGradToPicker(false);
                                }}
                                isOpen={showButtonGradToPicker}
                                onToggle={() => {
                                  setShowButtonGradToPicker(!showButtonGradToPicker);
                                  setShowButtonGradFromPicker(false);
                                  setShowButtonGradViaPicker(false);
                                  setShowButtonColorPicker(false);
                                  setShowTitleColorPicker(false);
                                  setShowDescColorPicker(false);
                                  setShowBgColorPicker(false);
                                }}
                                onClose={() => setShowButtonGradToPicker(false)}
                                buttonClassName="w-8 h-8"
                                previewSize="sm"
                                title="Button gradient end"
                                useFixedPosition={true}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
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
            style={backgroundStyle}
          >
            {/* Gradient glow blob when gradient enabled (visual parity with live) */}
            {formData.background_style?.is_gradient && formData.background_style?.gradient && (
              <div
                className={cn(
                  "absolute inset-x-0 -top-40 transform-gpu overflow-hidden blur-3xl sm:-top-80",
                  formData.animation_element ? "-z-20" : "-z-10"
                )}
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
                className={cn(
                  "absolute inset-0 h-auto w-auto object-contain sm:h-auto sm:w-auto sm:object-contain",
                  formData.animation_element ? "-z-20" : "-z-10"
                )}
                width={1280}
                height={720}
                priority={true}
              />
            )}

            <div className={`mx-auto max-w-${formData.title_style?.blockWidth || '2xl'} text-${formData.title_style?.alignment || 'center'} items-center grid grid-cols-1 gap-x-12 gap-y-24 ${formData.background_style?.column ? `lg:grid-cols-${formData.background_style.column}` : ''} relative`}>
              <div className={imagePosition === 'left' && shouldShowInlineImage ? 'order-2' : ''}>
                  {formData.background_style?.seo_title && (
                    <div className="hidden sm:mb-8 sm:flex sm:justify-center">
                      <div className="flex items-center relative rounded-full px-3 py-1 text-sm leading-6 text-gray-600 hover:text-gray-500 ring-2 ring-gray-900/10 hover:ring-sky-700/20">
                        {formData.background_style.seo_title}
                        <Link
                          href="/blog"
                          aria-label={`Explore ${formData.background_style.seo_title}`}
                          className="ml-2 flex items-center transition-all duration-300 group font-semibold text-gray-700 hover:text-gray-300"
                        >
                          Explore
                          <RightArrowDynamic />
                        </Link>
                      </div>
                    </div>
                  )}

                  {/* Main Content Wrapper with Alignment */}
                  <div className={alignClass}>
                    {/* Title - Inline Editing with Textarea */}
                    <div 
                      className="relative group"
                      onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        console.log('[Title] Mouse enter, rect:', rect);
                        setHoveredElementRect(rect);
                        setHoveredElement('title');
                      }}
                      onMouseLeave={() => {
                        console.log('[Title] Mouse leave');
                        // Delay hiding to allow interaction with menu
                        setTimeout(() => {
                          if (!editingElement || editingElement !== 'title') {
                            setHoveredElement(null);
                            setHoveredElementRect(null);
                          }
                        }, 100);
                      }}
                    >
                      <textarea
                        ref={titleTextareaRef}
                        value={formData.title}
                        onChange={handleTitleChange}
                        onFocus={() => setEditingElement('title')}
                        onBlur={() => {
                          setEditingElement(null);
                          setHoveredElement(null);
                        }}
                        placeholder="Enter hero title... (required)"
                        className={cn(
                          'w-full px-3 py-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 placeholder:text-gray-400 bg-transparent resize-none overflow-hidden font-bold tracking-tight hover:text-gray-700 rounded-md',
                          textColorClass,
                          alignClass,
                          !formData.title && 'border-red-300',
                          // Apply size classes directly
                          formData.title_style?.size?.mobile || 'text-5xl',
                          `sm:${formData.title_style?.size?.desktop || 'text-7xl'}`,
                          `md:${formData.title_style?.size?.desktop || 'text-7xl'}`
                        )}
                        style={{
                          ...titleGradientStyle,
                        }}
                        aria-label="Hero title"
                      />
                      
                      {/* Drag Resize Handle */}
                      {(hoveredElement === 'title' || editingElement === 'title') && (
                        <div
                          className="absolute -bottom-3 -right-3 w-7 h-7 bg-sky-500 rounded-full cursor-se-resize opacity-100 transition-opacity flex items-center justify-center shadow-lg border-2 border-white z-[9998]"
                          onMouseDown={(e) => handleTextMouseDown(e, 'title')}
                          onMouseEnter={() => setHoveredElement('title')}
                          title="Drag to resize text"
                        >
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                          </svg>
                        </div>
                      )}
                    </div>
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
                    <div 
                      className="relative group"
                      onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setHoveredElementRect(rect);
                        setHoveredElement('description');
                      }}
                      onMouseLeave={() => {
                        // Delay hiding to allow interaction with menu
                        setTimeout(() => {
                          if (!editingElement || editingElement !== 'description') {
                            setHoveredElement(null);
                            setHoveredElementRect(null);
                          }
                        }, 100);
                      }}
                    >
                      <textarea
                        ref={descriptionTextareaRef}
                        value={formData.description}
                        onChange={handleDescriptionChange}
                        onFocus={() => setEditingElement('description')}
                        onBlur={() => {
                          setEditingElement(null);
                          setHoveredElement(null);
                        }}
                        placeholder="Enter hero description..."
                        className={cn(
                          'w-full px-0 py-2 border-0 focus:outline-none focus:ring-0 placeholder:text-gray-300 bg-transparent resize-none overflow-hidden tracking-wide hover:text-gray-900',
                          `text-${formData.description_style?.color || 'gray-600'}`,
                          alignClass,
                          // Apply size classes directly
                          formData.description_style?.size?.mobile || 'text-lg',
                          `sm:${formData.description_style?.size?.desktop || 'text-2xl'}`,
                          // Apply weight class directly
                          formData.description_style?.weight === 'bold' ? 'font-bold' :
                          formData.description_style?.weight === 'semibold' ? 'font-semibold' :
                          formData.description_style?.weight === 'medium' ? 'font-medium' : 'font-normal'
                        )}
                        style={{
                          fontWeight: formData.description_style?.weight || 'normal',
                        }}
                        aria-label="Hero description"
                      />
                      
                      {/* Drag Resize Handle */}
                      {(hoveredElement === 'description' || editingElement === 'description') && (
                        <div
                          className="absolute -bottom-3 -right-3 w-7 h-7 bg-sky-500 rounded-full cursor-se-resize opacity-100 transition-opacity flex items-center justify-center shadow-lg border-2 border-white z-[9998]"
                          onMouseDown={(e) => handleTextMouseDown(e, 'description')}
                          onMouseEnter={() => setHoveredElement('description')}
                          title="Drag to resize text"
                        >
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                          </svg>
                        </div>
                      )}
                    </div>

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
                      <div className={`text-${formData.title_style?.alignment || 'center'} relative group`}>
                        <div className="relative inline-block">
                          <Image
                            src={formData.image}
                            alt={`Image of ${translatedH1Title}`}
                            className={`object-contain border-2 border-transparent hover:border-sky-300 transition-colors ${isResizing ? 'pointer-events-none' : ''}`}
                            width={formData.image_style?.width || 400}
                            height={formData.image_style?.height || 300}
                            style={{
                              width: formData.image_style?.width || 400,
                              height: formData.image_style?.height || 300,
                              maxWidth: '100%',
                              maxHeight: '400px'
                            }}
                            priority={false}
                          />
                          
                          {/* Close button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setFormData({ ...formData, image: null });
                            }}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white z-20 transition-colors"
                            title="Remove image"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                          
                          {/* Resize handles - only show when hovering and not background position */}
                          {formData.image_style?.position !== 'background' && (
                            <>
                              {/* Corner handles - positioned within bounds */}
                              <div
                                className="absolute top-0 left-0 w-4 h-4 bg-sky-500 border-2 border-white rounded-full cursor-nw-resize opacity-100 group-hover:opacity-100 transition-opacity z-10 -translate-x-2 -translate-y-2"
                                onMouseDown={(e) => handleMouseDown(e, 'nw')}
                              />
                              <div
                                className="absolute top-0 right-0 w-4 h-4 bg-sky-500 border-2 border-white rounded-full cursor-ne-resize opacity-100 group-hover:opacity-100 transition-opacity z-10 translate-x-2 -translate-y-2"
                                onMouseDown={(e) => handleMouseDown(e, 'ne')}
                              />
                              <div
                                className="absolute bottom-0 left-0 w-4 h-4 bg-sky-500 border-2 border-white rounded-full cursor-sw-resize opacity-100 group-hover:opacity-100 transition-opacity z-10 -translate-x-2 translate-y-2"
                                onMouseDown={(e) => handleMouseDown(e, 'sw')}
                              />
                              <div
                                className="absolute bottom-0 right-0 w-4 h-4 bg-sky-500 border-2 border-white rounded-full cursor-se-resize opacity-100 group-hover:opacity-100 transition-opacity z-10 translate-x-2 translate-y-2"
                                onMouseDown={(e) => handleMouseDown(e, 'se')}
                              />
                              
                              {/* Edge handles - positioned within bounds */}
                              <div
                                className="absolute top-1/2 left-0 w-3 h-8 bg-sky-500 border-2 border-white rounded cursor-w-resize opacity-100 group-hover:opacity-100 transition-opacity z-10 -translate-x-2 -translate-y-4"
                                onMouseDown={(e) => handleMouseDown(e, 'w')}
                              />
                              <div
                                className="absolute top-1/2 right-0 w-3 h-8 bg-sky-500 border-2 border-white rounded cursor-e-resize opacity-100 group-hover:opacity-100 transition-opacity z-10 translate-x-2 -translate-y-4"
                                onMouseDown={(e) => handleMouseDown(e, 'e')}
                              />
                              <div
                                className="absolute top-0 left-1/2 w-8 h-3 bg-sky-500 border-2 border-white rounded cursor-n-resize opacity-100 group-hover:opacity-100 transition-opacity z-10 -translate-x-4 -translate-y-2"
                                onMouseDown={(e) => handleMouseDown(e, 'n')}
                              />
                              <div
                                className="absolute bottom-0 left-1/2 w-8 h-3 bg-sky-500 border-2 border-white rounded cursor-s-resize opacity-100 group-hover:opacity-100 transition-opacity z-10 -translate-x-4 translate-y-2"
                                onMouseDown={(e) => handleMouseDown(e, 's')}
                              />
                            </>
                          )}
                        </div>
                        
                        {/* Dimensions display */}
                        {formData.image_style?.position !== 'background' && (
                          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-gray-500 bg-white px-2 py-1 rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                            {formData.image_style?.width || 400} × {formData.image_style?.height || 300}px
                          </div>
                        )}
                      </div>
                    )}
                  </div>

              </div>
            </div>

            {/* Optional animation overlays to mirror live component - rendered after content */}
            {formData.animation_element === 'DotGrid' && (
              <div className="absolute inset-0 -z-1" style={{ pointerEvents: 'none' }}>
                <DotGrid
                  dotSize={40}
                  gap={200}
                  baseColor="#3b82f6"
                  activeColor="#1d4ed8"
                  proximity={120}
                  shockRadius={250}
                  shockStrength={5}
                  resistance={750}
                  returnDuration={1.5}
                />
              </div>
            )}
            {formData.animation_element === 'LetterGlitch' && (
              <div className="absolute inset-0 -z-1 letter-glitch-wave" style={{ pointerEvents: 'none' }}>
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
              <div className="absolute inset-0 -z-1" style={{ pointerEvents: 'none' }}>
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

      {/* Hover Menus - Rendered at Root Level with Fixed Positioning */}
      {hoveredElement && hoveredElementRect && (
        <div
          onMouseEnter={() => {
            console.log('[HoverMenu Container] Mouse enter, element:', hoveredElement);
            // Keep the menu visible when hovering over it
            if (hoveredElement) {
              setHoveredElement(hoveredElement);
            }
          }}
          onMouseLeave={() => {
            console.log('[HoverMenu Container] Mouse leave');
            setTimeout(() => {
              if (!editingElement) {
                setHoveredElement(null);
                setHoveredElementRect(null);
              }
            }, 100);
          }}
        >
          <ElementHoverMenu
            element={hoveredElement}
            formData={formData}
            setFormData={setFormData}
            onClose={() => {
              setHoveredElement(null);
              setHoveredElementRect(null);
            }}
            targetRect={hoveredElementRect}
          />
        </div>
      )}

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
