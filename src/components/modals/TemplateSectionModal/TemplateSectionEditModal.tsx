/**
 * TemplateSectionEditModal - Matching Hero Edit Modal Design
 * Draggable modal with mega menu buttons (Style, Content) matching HeroSectionEditModal
 */

'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Rnd } from 'react-rnd';
import {
  RectangleStackIcon,
  XMarkIcon,
  PlusCircleIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  Squares2X2Icon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useTemplateSectionEdit } from './context';
import useFocusTrap from '@/hooks/useFocusTrap';
import { SettingsTab, LayoutTab, LayoutOptionsTab, StyleTab, ContentTab, TranslationsSection, FormsTab } from './components';
import { useSectionOperations, TemplateSectionFormData, useSectionTypeFilter } from './hooks';
import DeleteSectionModal from './DeleteSectionModal';
import Button from '@/ui/Button';
import { TemplateSectionPreview } from './preview';
import MetricManager from './MetricManager';
import ImageGalleryModal from '@/components/modals/ImageGalleryModal';
import EditableGradientPicker from '@/components/Shared/EditableFields/EditableGradientPicker';
import SimpleGradientPicker from '@/components/Shared/EditableFields/SimpleGradientPicker';
import { getBackgroundStyle } from '@/utils/gradientHelper';

type MegaMenuId = 'style' | 'layout' | 'content' | 'translations' | 'forms' | null;

export default function TemplateSectionEditModal() {
  const { isOpen, editingSection, mode, closeModal, refetchEditingSection, refreshSections } = useTemplateSectionEdit();
  const themeColors = useThemeColors();
  const primary = themeColors.cssVars.primary;

  // Section operations (needs to be before focus trap usage)
  const {
    isSaving,
    showDeleteConfirm,
    setShowDeleteConfirm,
    handleSave,
    handleDelete,
  } = useSectionOperations();

  const [openMenu, setOpenMenu] = useState<MegaMenuId>(null);
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  const [previewRefreshing, setPreviewRefreshing] = useState(false);
  const [imageLoading, setImageLoading] = useState<number | null>(null); // Track which metric image is loading
  const [hasUnsavedTranslations, setHasUnsavedTranslations] = useState(false);
  // Metric manager state (for inline layout panel quick actions)
  const [showCreateMetricForm, setShowCreateMetricForm] = useState(false);
  const [showAddMetricModal, setShowAddMetricModal] = useState(false);
  // Quick-pick dropdowns for Section Type and Color & Text (scoped per breakpoint to avoid duplicate dropdowns)
  const [showTypeDropdownSm, setShowTypeDropdownSm] = useState(false);
  const [showVariantDropdownSm, setShowVariantDropdownSm] = useState(false);
  const [showTypeDropdownMd, setShowTypeDropdownMd] = useState(false);
  const [showVariantDropdownMd, setShowVariantDropdownMd] = useState(false);
  const [showTypeDropdownLg, setShowTypeDropdownLg] = useState(false);
  const [showVariantDropdownLg, setShowVariantDropdownLg] = useState(false);
  const typeBtnRefSm = useRef<HTMLButtonElement | null>(null);
  const typeDropdownRefSm = useRef<HTMLDivElement | null>(null);
  const variantBtnRefSm = useRef<HTMLButtonElement | null>(null);
  const variantDropdownRefSm = useRef<HTMLDivElement | null>(null);
  const typeBtnRefMd = useRef<HTMLButtonElement | null>(null);
  const typeDropdownRefMd = useRef<HTMLDivElement | null>(null);
  const variantBtnRefMd = useRef<HTMLButtonElement | null>(null);
  const variantDropdownRefMd = useRef<HTMLDivElement | null>(null);
  const typeBtnRefLg = useRef<HTMLButtonElement | null>(null);
  const typeDropdownRefLg = useRef<HTMLDivElement | null>(null);
  const variantBtnRefLg = useRef<HTMLButtonElement | null>(null);
  const variantDropdownRefLg = useRef<HTMLDivElement | null>(null);
  const { searchQuery, setSearchQuery, filteredOptions } = useSectionTypeFilter();
  const [variantSearch, setVariantSearch] = useState('');
  const TEXT_VARIANT_OPTIONS: { value: TemplateSectionFormData['text_style_variant']; label: string; preview: { h: string; p: string } }[] = [
    { value: 'default', label: 'Default', preview: { h: 'text-sm font-bold text-gray-900', p: 'text-xs text-gray-600' } },
    { value: 'apple', label: 'Apple', preview: { h: 'text-base font-light text-gray-900', p: 'text-xs text-gray-500' } },
    { value: 'codedharmony', label: 'CodedHarmony', preview: { h: 'text-base font-bold tracking-tight', p: 'text-xs text-gray-600' } },
    { value: 'magazine', label: 'Magazine', preview: { h: 'text-base font-black uppercase', p: 'text-[10px] uppercase tracking-wide' } },
    { value: 'startup', label: 'Startup', preview: { h: 'text-base font-black', p: 'text-xs' } },
    { value: 'elegant', label: 'Elegant', preview: { h: 'text-base font-serif italic', p: 'text-xs font-serif' } },
    { value: 'brutalist', label: 'Brutalist', preview: { h: 'text-base font-black uppercase', p: 'text-[10px] uppercase font-bold' } },
    { value: 'modern', label: 'Modern', preview: { h: 'text-base font-extrabold tracking-tight', p: 'text-xs' } },
    { value: 'playful', label: 'Playful', preview: { h: 'text-base font-extrabold', p: 'text-xs font-medium' } },
  ];
  const filteredVariants = useMemo(() => 
    TEXT_VARIANT_OPTIONS.filter(v => v.label.toLowerCase().includes(variantSearch.toLowerCase())),
    [variantSearch]
  );

  // Click outside to close dropdowns (handles all breakpoints)
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      // sm
      if (showTypeDropdownSm && typeDropdownRefSm.current && !typeDropdownRefSm.current.contains(t) && typeBtnRefSm.current && !typeBtnRefSm.current.contains(t)) {
        setShowTypeDropdownSm(false);
      }
      if (showVariantDropdownSm && variantDropdownRefSm.current && !variantDropdownRefSm.current.contains(t) && variantBtnRefSm.current && !variantBtnRefSm.current.contains(t)) {
        setShowVariantDropdownSm(false);
      }
      // md
      if (showTypeDropdownMd && typeDropdownRefMd.current && !typeDropdownRefMd.current.contains(t) && typeBtnRefMd.current && !typeBtnRefMd.current.contains(t)) {
        setShowTypeDropdownMd(false);
      }
      if (showVariantDropdownMd && variantDropdownRefMd.current && !variantDropdownRefMd.current.contains(t) && variantBtnRefMd.current && !variantBtnRefMd.current.contains(t)) {
        setShowVariantDropdownMd(false);
      }
      // lg
      if (showTypeDropdownLg && typeDropdownRefLg.current && !typeDropdownRefLg.current.contains(t) && typeBtnRefLg.current && !typeBtnRefLg.current.contains(t)) {
        setShowTypeDropdownLg(false);
      }
      if (showVariantDropdownLg && variantDropdownRefLg.current && !variantDropdownRefLg.current.contains(t) && variantBtnRefLg.current && !variantBtnRefLg.current.contains(t)) {
        setShowVariantDropdownLg(false);
      }
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, [showTypeDropdownSm, showVariantDropdownSm, showTypeDropdownMd, showVariantDropdownMd, showTypeDropdownLg, showVariantDropdownLg]);
  
  // Inline editing state
  const [inlineEdit, setInlineEdit] = useState<{
    field: 'section_title' | 'section_description' | 'metric_title' | 'metric_description' | null;
    value: string;
    position: { x: number; y: number };
    metricIndex?: number;
  }>({ field: null, value: '', position: { x: 0, y: 0 } });

  // Local state for title/description inputs to prevent typing interruptions
  const [localTitle, setLocalTitle] = useState('');
  const [localDescription, setLocalDescription] = useState('');
  
  // Track if user is actively typing
  const isTypingTitleRef = useRef(false);
  const isTypingDescriptionRef = useRef(false);
  
  // Debounced sync from local state to formData
  const titleSyncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const descriptionSyncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync local title to formData with debounce - only when not actively typing
  useEffect(() => {
    if (titleSyncTimeoutRef.current) clearTimeout(titleSyncTimeoutRef.current);
    
    titleSyncTimeoutRef.current = setTimeout(() => {
      isTypingTitleRef.current = false;
      setFormData(prev => {
        // Only update if value actually changed
        if (prev.section_title !== localTitle) {
          return { ...prev, section_title: localTitle };
        }
        return prev;
      });
    }, 500); // Increased to 500ms for better stability
    
    return () => {
      if (titleSyncTimeoutRef.current) clearTimeout(titleSyncTimeoutRef.current);
    };
  }, [localTitle]);

  // Sync local description to formData with debounce - only when not actively typing
  useEffect(() => {
    if (descriptionSyncTimeoutRef.current) clearTimeout(descriptionSyncTimeoutRef.current);
    
    descriptionSyncTimeoutRef.current = setTimeout(() => {
      isTypingDescriptionRef.current = false;
      setFormData(prev => {
        // Only update if value actually changed
        if (prev.section_description !== localDescription) {
          return { ...prev, section_description: localDescription };
        }
        return prev;
      });
    }, 500); // Increased to 500ms for better stability
    
    return () => {
      if (descriptionSyncTimeoutRef.current) clearTimeout(descriptionSyncTimeoutRef.current);
    };
  }, [localDescription]);

  // Focus trap - disabled to prevent cursor jumping during typing
  const focusTrapRef = useRef<HTMLElement | null>(null);
  
  // Manual keyboard handler for escape key
  useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Esc should prioritize closing inline edit or mega menu before modal
        if (inlineEdit.field) {
          setInlineEdit({ field: null, value: '', position: { x: 0, y: 0 } });
          return;
        }
        if (openMenu) {
          setOpenMenu(null);
          return;
        }
        if (!showDeleteConfirm) {
          closeModal();
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, inlineEdit.field, openMenu, showDeleteConfirm, closeModal]);

  // Calculate safe positioning for inline edit popover
  const getSafePopoverPosition = (x: number, y: number) => {
    const popoverWidth = 500;
    const popoverHeight = 300; // Approximate height
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 768;
    const padding = 16;
    
    let safeX = x;
    let safeY = y;
    
    // Adjust horizontal position
    if (safeX + popoverWidth > viewportWidth - padding) {
      safeX = Math.max(padding, viewportWidth - popoverWidth - padding);
    }
    if (safeX < padding) {
      safeX = padding;
    }
    
    // Adjust vertical position
    if (safeY + popoverHeight > viewportHeight - padding) {
      safeY = Math.max(padding, viewportHeight - popoverHeight - padding);
    }
    if (safeY < padding) {
      safeY = padding;
    }
    
    return { x: safeX, y: safeY };
  };
  
  // Image gallery state
  const [isImageGalleryOpen, setIsImageGalleryOpen] = useState(false);
  const [imageSelectionTarget, setImageSelectionTarget] = useState<{
    type: 'metric';
    metricIndex: number;
  } | null>(null);
  
  const [formData, setFormData] = useState<TemplateSectionFormData>({
    section_title: '',
    section_description: '',
    background_color: 'white',
    is_gradient: false,
    gradient: null,
    text_style_variant: 'default',
    grid_columns: 3,
    image_metrics_height: 'h-48',
    is_full_width: false,
    is_section_title_aligned_center: false,
    is_section_title_aligned_right: false,
    is_image_bottom: false,
    is_slider: false,
    section_type: 'general',
    form_id: null,
    is_reviews_section: false,
    url_page: undefined,
    website_metric: undefined,
  });

  // Initialize form data when editing section changes
  useEffect(() => {
    if (editingSection) {
      // Cast to any for backward compatibility with old boolean fields
      const section = editingSection as any;
      
      let sectionType: TemplateSectionFormData['section_type'] = section.section_type || 'general';
      if (!section.section_type) {
        // Migration logic: Convert old boolean flags to section_type
        if (editingSection.is_reviews_section) sectionType = 'reviews';
        else if (section.is_help_center_section) sectionType = 'help_center';
        else if (section.is_real_estate_modal) sectionType = 'real_estate';
        else if (section.is_brand) sectionType = 'brand';
        else if (section.is_article_slider) sectionType = 'article_slider';
        else if (section.is_contact_section) sectionType = 'contact';
        else if (section.is_faq_section) sectionType = 'faq';
        else if (section.is_pricingplans_section) sectionType = 'pricing_plans';
      }
      
      // Initialize local title/description state
      const title = editingSection.section_title || '';
      const description = editingSection.section_description || '';
      setLocalTitle(title);
      setLocalDescription(description);
      
      setFormData({
        section_title: title,
        section_description: description,
        section_title_translation: editingSection.section_title_translation || {},
        section_description_translation: editingSection.section_description_translation || {},
        background_color: editingSection.background_color || 'white',
        is_gradient: editingSection.is_gradient || false,
        gradient: editingSection.gradient || null,
        text_style_variant: editingSection.text_style_variant || 'default',
        grid_columns: editingSection.grid_columns || 3,
        image_metrics_height: editingSection.image_metrics_height || 'h-48',
        is_full_width: editingSection.is_full_width || false,
        is_section_title_aligned_center: editingSection.is_section_title_aligned_center || false,
        is_section_title_aligned_right: editingSection.is_section_title_aligned_right || false,
        is_image_bottom: editingSection.is_image_bottom || false,
        is_slider: editingSection.is_slider || false,
        section_type: sectionType,
        form_id: editingSection.form_id || null,
        is_reviews_section: editingSection.is_reviews_section || false,
        url_page: editingSection.url_page,
        website_metric: editingSection.website_metric,
      });
    }
  }, [editingSection]);

  // Remove legacy focus management (now handled by useFocusTrap which restores previous focus)

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to close mega menu, inline edit, or modal
      if (e.key === 'Escape') {
        if (inlineEdit.field) {
          e.stopPropagation();
          setInlineEdit({ field: null, value: '', position: { x: 0, y: 0 } });
        } else if (openMenu) {
          e.stopPropagation();
          setOpenMenu(null);
        } else if (!showDeleteConfirm) {
          closeModal();
        }
      }
      // Enter to save inline edit
      if (e.key === 'Enter' && inlineEdit.field && !e.shiftKey) {
        e.preventDefault();
        handleInlineEditSave();
      }
      // Ctrl/Cmd + S to save
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave(formData);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, formData, handleSave, closeModal, showDeleteConfirm, openMenu, inlineEdit]);

  // Trigger preview refresh animation when significant formData changes (excluding title/description)
  const prevSignificantDataRef = useRef({
    background_color: formData.background_color,
    is_gradient: formData.is_gradient,
    gradient: formData.gradient,
    text_style_variant: formData.text_style_variant,
    grid_columns: formData.grid_columns,
    image_metrics_height: formData.image_metrics_height,
    is_full_width: formData.is_full_width,
    is_section_title_aligned_center: formData.is_section_title_aligned_center,
    is_section_title_aligned_right: formData.is_section_title_aligned_right,
    is_image_bottom: formData.is_image_bottom,
    is_slider: formData.is_slider,
    section_type: formData.section_type,
    website_metric: formData.website_metric,
    url_page: formData.url_page,
  });

  useEffect(() => {
    if (isOpen) {
      const prevData = prevSignificantDataRef.current;
      const currentSignificantData = {
        background_color: formData.background_color,
        is_gradient: formData.is_gradient,
        gradient: formData.gradient,
        text_style_variant: formData.text_style_variant,
        grid_columns: formData.grid_columns,
        image_metrics_height: formData.image_metrics_height,
        is_full_width: formData.is_full_width,
        is_section_title_aligned_center: formData.is_section_title_aligned_center,
        is_section_title_aligned_right: formData.is_section_title_aligned_right,
        is_image_bottom: formData.is_image_bottom,
        is_slider: formData.is_slider,
        section_type: formData.section_type,
        website_metric: formData.website_metric,
        url_page: formData.url_page,
      };

      // Check if any significant field changed
      const significantChange = Object.keys(currentSignificantData).some(key => {
        return prevData[key as keyof typeof prevData] !== currentSignificantData[key as keyof typeof currentSignificantData];
      });

      if (significantChange) {
        setPreviewRefreshing(true);
        const timer = setTimeout(() => setPreviewRefreshing(false), 300);
        return () => clearTimeout(timer);
      }

      prevSignificantDataRef.current = currentSignificantData;
    }
  }, [
    formData.background_color,
    formData.is_gradient,
    formData.gradient,
    formData.text_style_variant,
    formData.grid_columns,
    formData.image_metrics_height,
    formData.is_full_width,
    formData.is_section_title_aligned_center,
    formData.is_section_title_aligned_right,
    formData.is_image_bottom,
    formData.is_slider,
    formData.section_type,
    formData.website_metric,
    formData.url_page,
    isOpen
  ]);  // Inline editing handlers - wrapped in useCallback for performance
  const handleInlineEditOpen = useCallback((
    field: 'section_title' | 'section_description' | 'metric_title' | 'metric_description',
    event: React.MouseEvent,
    metricIndex?: number
  ) => {
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    let value = '';
    
    if (field === 'section_title') {
      value = formData.section_title || '';
    } else if (field === 'section_description') {
      value = formData.section_description || '';
    } else if (field === 'metric_title' && metricIndex !== undefined && formData.website_metric?.[metricIndex]) {
      value = formData.website_metric[metricIndex].title || '';
    } else if (field === 'metric_description' && metricIndex !== undefined && formData.website_metric?.[metricIndex]) {
      value = formData.website_metric[metricIndex].description || '';
    }
    
    setInlineEdit({
      field,
      value,
      position: { x: rect.left, y: rect.bottom + 10 },
      metricIndex
    });
  }, [formData.section_title, formData.section_description, formData.website_metric]);

  const handleInlineEditSave = useCallback(() => {
    if (!inlineEdit.field || !inlineEdit.value.trim()) {
      setInlineEdit({ field: null, value: '', position: { x: 0, y: 0 } });
      return;
    }

    if (inlineEdit.field === 'section_title') {
      setFormData(prev => ({ ...prev, section_title: inlineEdit.value }));
      setLocalTitle(inlineEdit.value); // Also update local state to keep in sync
    } else if (inlineEdit.field === 'section_description') {
      setFormData(prev => ({ ...prev, section_description: inlineEdit.value }));
      setLocalDescription(inlineEdit.value); // Also update local state to keep in sync
    } else if (
      (inlineEdit.field === 'metric_title' || inlineEdit.field === 'metric_description') &&
      inlineEdit.metricIndex !== undefined &&
      formData.website_metric
    ) {
      const updatedMetrics = [...formData.website_metric];
      if (inlineEdit.field === 'metric_title') {
        updatedMetrics[inlineEdit.metricIndex] = {
          ...updatedMetrics[inlineEdit.metricIndex],
          title: inlineEdit.value
        };
      } else {
        updatedMetrics[inlineEdit.metricIndex] = {
          ...updatedMetrics[inlineEdit.metricIndex],
          description: inlineEdit.value
        };
      }
      setFormData(prev => ({ ...prev, website_metric: updatedMetrics }));
    }
    
    setInlineEdit({ field: null, value: '', position: { x: 0, y: 0 } });
  }, [inlineEdit, formData.website_metric]);

  const handleInlineEditCancel = useCallback(() => {
    setInlineEdit({ field: null, value: '', position: { x: 0, y: 0 } });
  }, []);

  // Image gallery handlers - wrapped in useCallback for performance
  const handleOpenImageGallery = useCallback((metricIndex: number) => {
    setImageSelectionTarget({ type: 'metric', metricIndex });
    setIsImageGalleryOpen(true);
  }, []);

  const handleImageSelect = useCallback((imageUrl: string) => {
    if (imageSelectionTarget?.type === 'metric' && formData.website_metric) {
      setImageLoading(imageSelectionTarget.metricIndex); // Show loading state
      
      // Simulate a brief delay for visual feedback (image processing)
      setTimeout(() => {
        const updatedMetrics = [...formData.website_metric!];
        updatedMetrics[imageSelectionTarget.metricIndex] = {
          ...updatedMetrics[imageSelectionTarget.metricIndex],
          image: imageUrl
        };
        setFormData(prev => ({ ...prev, website_metric: updatedMetrics }));
        setImageLoading(null); // Clear loading state
      }, 300);
    }
    setIsImageGalleryOpen(false);
    setImageSelectionTarget(null);
  }, [imageSelectionTarget, formData.website_metric]);

  const handleRemoveImage = useCallback((metricIndex: number) => {
    if (formData.website_metric) {
      setImageLoading(metricIndex); // Show loading state
      
      // Brief delay for visual feedback
      setTimeout(() => {
        const updatedMetrics = [...formData.website_metric!];
        updatedMetrics[metricIndex] = {
          ...updatedMetrics[metricIndex],
          image: null
        };
        setFormData(prev => ({ ...prev, website_metric: updatedMetrics }));
        setImageLoading(null); // Clear loading state
      }, 200);
    }
  }, [formData.website_metric]);

  const onSave = useCallback(async () => {
    await handleSave(formData);
  }, [formData, handleSave]);

  const onDelete = useCallback(async () => {
    await handleDelete(editingSection?.id);
  }, [editingSection, handleDelete]);

  const onSaveTranslations = useCallback(async () => {
    await handleSave(formData);
    setHasUnsavedTranslations(false);
  }, [formData, handleSave]);

  if (!isOpen) return null;

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;

  const menus = [
    {
      id: 'style' as const,
      label: 'Style',
      sections: [
        { id: 'section-type', label: 'Section Type', component: 'settings' },
        { id: 'colors', label: 'Colors & Text', component: 'style' },
      ]
    },
    {
      id: 'layout' as const,
      label: 'Layout',
      compact: true, // Flag for compact full-width layout
      sections: [] // Will render custom compact layout
    },
    {
      id: 'content' as const,
      label: 'Content',
      sections: [
        { id: 'metrics', label: 'Metrics / Items', component: 'content' },
      ]
    },
    // Only show Forms tab when section_type is 'form_harmony'
    ...(formData.section_type === 'form_harmony' ? [{
      id: 'forms' as const,
      label: 'Forms',
      sections: []
    }] : []),
    {
      id: 'translations' as const,
      label: 'Translations',
      sections: []
    },
  ];

  const modalContent = (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 animate-in fade-in duration-200 z-[10001]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="section-modal-title"
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={closeModal}
        aria-hidden="true"
      />
      
      {/* Modal - Responsive */}
      {isMobile ? (
        <div 
          ref={(el) => {
            // Provide element to focus trap
            if (focusTrapRef) {
              (focusTrapRef as React.MutableRefObject<HTMLElement | null>).current = el;
            }
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Template Section Modal"
          tabIndex={-1}
          className="template-section-modal-root relative w-full h-[90vh] flex flex-col bg-white/50 dark:bg-gray-900/50 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/20"
          onClick={(e) => e.stopPropagation()}
        >
          {renderModalContent()}
        </div>
      ) : (
        <Rnd
          default={{
            x: (typeof window !== 'undefined' ? window.innerWidth : 1200) / 2 - 560,
            y: (typeof window !== 'undefined' ? window.innerHeight : 900) / 2 - 450,
            width: 1120,
            height: 900,
          }}
          minWidth={800}
          minHeight={700}
          bounds="window"
          dragHandleClassName="modal-drag-handle"
          enableResizing={true}
          className="pointer-events-auto"
        >
          <div 
            ref={(el) => {
              if (focusTrapRef) {
                (focusTrapRef as React.MutableRefObject<HTMLElement | null>).current = el;
              }
            }}
            role="dialog"
            aria-modal="true"
            aria-label="Template Section Modal"
            tabIndex={-1}
            className="template-section-modal-root relative h-full flex flex-col bg-white/50 dark:bg-gray-900/50 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/20"
            onClick={(e) => e.stopPropagation()}
          >
            {renderModalContent()}
          </div>
        </Rnd>
      )}
    </div>
  );

  function renderModalContent() {
    return (
      <>
        {/* Header - Matching Hero Edit Modal */}
        <div className="modal-drag-handle flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-white/20 dark:border-gray-700/20 cursor-move bg-white/30 dark:bg-gray-800/30 rounded-t-2xl">
          <div className="flex items-center space-x-3">
            <RectangleStackIcon className="h-6 w-6" style={{ color: primary.base }} />
            <h2 
              id="section-modal-title" 
              className="text-xl font-semibold text-gray-900 dark:text-gray-100"
            >
              {mode === 'create' ? 'Create Template Section' : 'Edit Template Section'}
            </h2>
          </div>
          
          <button
            onClick={closeModal}
            className="p-2 rounded-lg hover:bg-white/10 dark:hover:bg-gray-700/30 transition-colors"
            aria-label="Close modal"
          >
            <XMarkIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Mega Menu Buttons - Matching Hero Edit Modal */}
        <div className="px-6 py-3 flex items-center border-b border-white/10 dark:border-gray-700/20 bg-white/30 dark:bg-gray-800/30 relative z-30">
          <div className="flex gap-2">
            {menus.map((menu) => (
              <div key={menu.id} className="relative">
                <button
                  onClick={() => setOpenMenu(openMenu === menu.id ? null : menu.id)}
                  onMouseEnter={() => setHoveredButton(menu.id)}
                  onMouseLeave={() => setHoveredButton(null)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all duration-300 shadow-sm"
                  style={
                    openMenu === menu.id
                      ? {
                          background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`,
                          color: 'white',
                          boxShadow: `0 4px 12px ${primary.base}40`,
                        }
                      : {
                          backgroundColor: 'transparent',
                          color: hoveredButton === menu.id ? primary.hover : primary.base,
                          borderWidth: '1px',
                          borderStyle: 'solid',
                          borderColor: hoveredButton === menu.id ? `${primary.base}80` : `${primary.base}40`,
                        }
                  }
                >
                  <span>{menu.label}</span>
                  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Mega Menu Dropdown (for Style, Content, and Translations) */}
        {openMenu && openMenu !== 'layout' && openMenu !== 'translations' && openMenu !== 'forms' && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setOpenMenu(null)}
              aria-label="Close menu"
            />
            
            {/* Mega Menu Panel */}
            <div className="absolute left-0 right-0 bottom-0 bg-white dark:bg-gray-800 shadow-2xl z-50 overflow-y-auto rounded-b-2xl" style={{ top: '132px' }}>
              <div className="max-w-7xl mx-auto px-6 py-6 h-full">
                {menus.filter(menu => menu.id === openMenu).map((menu) => (
                  <div key={menu.id}>
                    {/* Menu Header */}
                    <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-100 dark:border-gray-700">
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {menu.id === 'style' ? 'Settings' : `${menu.label} Settings`}
                      </h2>
                      <button
                        onClick={() => setOpenMenu(null)}
                        className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 flex items-center gap-1 transition-colors"
                        style={{
                          color: hoveredButton === 'close-menu' ? primary.hover : undefined
                        }}
                        onMouseEnter={() => setHoveredButton('close-menu')}
                        onMouseLeave={() => setHoveredButton(null)}
                      >
                        <kbd className="px-2 py-0.5 text-xs border rounded" style={{
                          backgroundColor: hoveredButton === 'close-menu' ? `${primary.base}10` : undefined,
                          borderColor: hoveredButton === 'close-menu' ? `${primary.base}40` : undefined,
                          color: hoveredButton === 'close-menu' ? primary.base : undefined
                        }}>Esc</kbd>
                        <span>to close</span>
                      </button>
                    </div>
                    
                    {/* Regular Grid Layout */}
                    <div className={`grid gap-6 ${menu.sections.length === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-3'}`}>
                      {menu.sections.map((section) => (
                        <div key={section.id} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
                            {section.label}
                          </h3>
                          <div className="space-y-3">
                            {section.component === 'settings' && (
                              <SettingsTab formData={formData} setFormData={setFormData} mode={mode} />
                            )}
                            {section.component === 'layout' && (
                              <LayoutTab formData={formData} setFormData={setFormData} mode={mode} />
                            )}
                            {section.component === 'style' && (
                              <StyleTab formData={formData} setFormData={setFormData} />
                            )}
                            {section.component === 'content' && (
                              <ContentTab formData={formData} mode={mode} />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Inline Layout Panel (narrow horizontal strip above preview) */}
        {openMenu === 'layout' && (
          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-3.5">
            {/* Mobile (sm) - reorganized into first and second rows */}
            <div className="md:hidden space-y-4">
              {/* First Row - Permanent */}
              <div className="space-y-3">
                {/* Quick Picks */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Quick Picks</h3>
                  <div className="flex gap-1.5 relative">
                    {/* Section Type */}
                    <button
                      ref={typeBtnRefSm}
                      onClick={() => { setShowTypeDropdownSm(v => !v); setShowVariantDropdownSm(false); }}
                      className="px-2.5 py-1.5 rounded-lg border-2 text-xs font-medium transition-all hover:shadow-sm inline-flex items-center gap-1.5"
                      style={{ backgroundColor: 'white', borderColor: '#e5e7eb', color: '#374151' }}
                      aria-label="Choose section type"
                    >
                      <RectangleStackIcon className="w-4 h-4" />
                      Type
                      <ChevronDownIcon className="w-4 h-4" />
                    </button>
                    {showTypeDropdownSm && (
                      <div ref={typeDropdownRefSm} className="dropdown-container absolute top-full mt-2 left-0 bg-white rounded-lg shadow-lg border border-gray-200 z-[10020] w-80 max-h-72 overflow-y-auto p-2">
                        <div className="flex items-center gap-2 mb-2 px-1">
                          <MagnifyingGlassIcon className="w-4 h-4 text-gray-400" />
                          <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search section types..." className="w-full outline-none text-xs text-gray-800 placeholder:text-gray-400" />
                        </div>
                        <div className="divide-y divide-gray-100">
                          {filteredOptions.map(opt => (
                            <button key={opt.value} onClick={() => { setFormData({ ...formData, section_type: opt.value }); setShowTypeDropdownSm(false); }} className={cn('w-full text-left p-2 hover:bg-gray-50 flex items-start gap-2', formData.section_type === opt.value && 'bg-blue-50/70')}> 
                              <div className="p-1.5 rounded bg-gray-100"><opt.icon className="w-4 h-4 text-gray-700" /></div>
                              <div>
                                <div className="text-xs font-medium text-gray-900 flex items-center gap-1.5">{opt.label}{formData.section_type === opt.value && <span className="text-[9px] px-1 rounded bg-blue-100 text-blue-700">Selected</span>}</div>
                                <div className="text-[11px] text-gray-600">{opt.shortDescription || opt.description}</div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Color & Text */}
                    <button
                      ref={variantBtnRefSm}
                      onClick={() => { setShowVariantDropdownSm(v => !v); setShowTypeDropdownSm(false); }}
                      className="px-2.5 py-1.5 rounded-lg border-2 text-xs font-medium transition-all hover:shadow-sm inline-flex items-center gap-1.5"
                      style={{ backgroundColor: 'white', borderColor: '#e5e7eb', color: '#374151' }}
                      aria-label="Choose color & text style"
                    >
                      <Squares2X2Icon className="w-4 h-4" />
                      Color & Text
                      <ChevronDownIcon className="w-4 h-4" />
                    </button>
                    {showVariantDropdownSm && (
                      <div ref={variantDropdownRefSm} className="dropdown-container absolute top-full mt-2 left-0 bg-white rounded-lg shadow-lg border border-gray-200 z-[10020] w-80 max-h-72 overflow-y-auto p-2">
                        <div className="flex items-center gap-2 mb-2 px-1">
                          <MagnifyingGlassIcon className="w-4 h-4 text-gray-400" />
                          <input value={variantSearch} onChange={(e) => setVariantSearch(e.target.value)} placeholder="Search styles..." className="w-full outline-none text-xs text-gray-800 placeholder:text-gray-400" />
                        </div>
                        <div className="divide-y divide-gray-100">
                          {filteredVariants.map(opt => (
                            <button key={opt.value} onClick={() => { setFormData({ ...formData, text_style_variant: opt.value }); setShowVariantDropdownSm(false); }} className={cn('w-full text-left p-2 hover:bg-gray-50', formData.text_style_variant === opt.value && 'bg-blue-50/70')}>
                              <div className="text-xs font-medium text-gray-900 flex items-center gap-1.5">{opt.label}{formData.text_style_variant === opt.value && <span className="text-[9px] px-1 rounded bg-blue-100 text-blue-700">Selected</span>}</div>
                              <div className="mt-1 p-2 rounded border bg-white/60">
                                <div className={cn(opt.preview.h)}>Sample Heading</div>
                                <div className={cn(opt.preview.p)}>This is a preview of text.</div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Background with Full Width */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Background</h3>
                  <div className="flex gap-1.5 items-end">
                    <button
                      onClick={() => setFormData({ ...formData, is_full_width: !formData.is_full_width })}
                      className="px-2.5 py-1.5 rounded-lg border-2 text-xs font-medium transition-all hover:shadow-sm"
                      aria-label="Toggle full width section"
                      style={
                        formData.is_full_width
                          ? { background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`, color: 'white', borderColor: primary.base }
                          : { backgroundColor: 'white', borderColor: '#e5e7eb', color: '#6b7280' }
                      }
                    >
                      Full Width
                    </button>
                    <SimpleGradientPicker
                      label=""
                      isGradient={formData.is_gradient}
                      gradient={formData.gradient || { from: 'blue-500', via: 'purple-500', to: 'pink-500' }}
                      solidColor={formData.background_color}
                      onGradientChange={(isGradient: boolean, gradient: any) => setFormData({ ...formData, is_gradient: isGradient, gradient })}
                      onSolidColorChange={(color: string) => setFormData({ ...formData, background_color: color })}
                    />
                  </div>
                </div>

                {/* Title Alignment */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Title Alignment</h3>
                  <div className="flex gap-1.5">
                    {[
                      { value: 'left', label: 'L' },
                      { value: 'center', label: 'C' },
                      { value: 'right', label: 'R' }
                    ].map((align) => (
                      <button
                        key={align.value}
                        onClick={() => {
                          setFormData({
                            ...formData,
                            is_section_title_aligned_center: align.value === 'center',
                            is_section_title_aligned_right: align.value === 'right'
                          });
                        }}
                        className="flex-1 px-2.5 py-1.5 rounded-lg border-2 font-medium text-xs transition-all hover:shadow-sm"
                        aria-label={align.value === 'left' ? 'Align title left' : align.value === 'center' ? 'Align title center' : 'Align title right'}
                        style={
                          (align.value === 'center' && formData.is_section_title_aligned_center) ||
                          (align.value === 'right' && formData.is_section_title_aligned_right) ||
                          (align.value === 'left' && !formData.is_section_title_aligned_center && !formData.is_section_title_aligned_right)
                            ? { background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`, color: 'white', borderColor: primary.base }
                            : { backgroundColor: 'white', borderColor: '#e5e7eb', color: '#6b7280' }
                        }
                      >
                        {align.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Second Row - Title/Description always accessible, Metrics inactive for non-general sections */}
              <div className="space-y-3">
                {/* Title and Description - Always accessible */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Title & Description</h3>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={localTitle}
                        onChange={(e) => { isTypingTitleRef.current = true; setLocalTitle(e.target.value); }}
                        className="w-full px-2 py-1.5 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Section title"
                      />
                    </div>
                    <div className="flex-1">
                      <input
                        type="text"
                        value={localDescription}
                        onChange={(e) => { isTypingDescriptionRef.current = true; setLocalDescription(e.target.value); }}
                        className="w-full px-2 py-1.5 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Section description"
                      />
                    </div>
                  </div>
                </div>

                {/* Metrics with Options - Inactive for non-general sections */}
                <div className={cn("", formData.section_type !== 'general' && formData.section_type && 'opacity-50 pointer-events-none')}>
                  <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Metrics</h3>
                  <div className="flex gap-1.5 flex-wrap">
                    <button
                      onClick={() => setShowCreateMetricForm(true)}
                      className="px-2.5 py-1.5 rounded-lg border-2 text-xs font-medium transition-all hover:shadow-sm inline-flex items-center gap-1.5"
                      style={{ backgroundColor: 'white', borderColor: '#bfdbfe', color: '#2563eb' }}
                      title="Create new metric"
                      aria-label="Create new metric"
                    >
                      <PlusCircleIcon className="w-4 h-4" />
                      New
                    </button>
                    <button
                      onClick={() => setShowAddMetricModal(true)}
                      className="px-2.5 py-1.5 rounded-lg border-2 text-xs font-medium transition-all hover:shadow-sm inline-flex items-center gap-1.5"
                      style={{ backgroundColor: 'white', borderColor: '#e5e7eb', color: '#6b7280' }}
                      title="Add existing metric from library"
                      aria-label="Add existing metric from library"
                    >
                      <RectangleStackIcon className="w-4 h-4" />
                      Add
                    </button>
                    <button
                      onClick={() => setFormData({ ...formData, is_slider: !formData.is_slider })}
                      className="px-2.5 py-1.5 rounded-lg border-2 text-xs font-medium transition-all hover:shadow-sm"
                      aria-label="Toggle slider mode"
                      style={
                        formData.is_slider
                          ? { background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`, color: 'white', borderColor: primary.base }
                          : { backgroundColor: 'white', borderColor: '#e5e7eb', color: '#6b7280' }
                      }
                    >
                      Slider
                    </button>
                    <select
                      value={formData.grid_columns || 3}
                      onChange={(e) => setFormData({ ...formData, grid_columns: parseInt(e.target.value) })}
                      className="px-2.5 py-1.5 text-xs rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-offset-0 transition-all hover:shadow-sm font-medium"
                      style={{ '--tw-ring-color': primary.base, borderColor: '#e5e7eb' } as React.CSSProperties}
                      aria-label="Columns"
                    >
                      <option value="1">1 Col</option>
                      <option value="2">2 Col</option>
                      <option value="3">3 Col</option>
                      <option value="4">4 Col</option>
                      <option value="5">5 Col</option>
                      <option value="6">6 Col</option>
                    </select>
                    <button
                      onClick={() => setFormData({ ...formData, is_image_bottom: !formData.is_image_bottom })}
                      className="px-2.5 py-1.5 rounded-lg border-2 text-xs font-medium transition-all hover:shadow-sm"
                      aria-label="Toggle image position bottom"
                      style={
                        formData.is_image_bottom
                          ? { background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`, color: 'white', borderColor: primary.base }
                          : { backgroundColor: 'white', borderColor: '#e5e7eb', color: '#6b7280' }
                      }
                    >
                      Img Bottom
                    </button>
                    <select
                      value={formData.image_metrics_height || 'h-48'}
                      onChange={(e) => setFormData({ ...formData, image_metrics_height: e.target.value })}
                      className="px-2.5 py-1.5 text-xs rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-offset-0 transition-all hover:shadow-sm font-medium"
                      style={{ '--tw-ring-color': primary.base, borderColor: '#e5e7eb' } as React.CSSProperties}
                      aria-label="Image height"
                    >
                      <option value="h-32">Sm</option>
                      <option value="h-48">Md</option>
                      <option value="h-64">Lg</option>
                      <option value="h-80">XL</option>
                      <option value="h-96">2XL</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Tablet (md) - reorganized into first and second rows */}
            <div className="hidden md:block lg:hidden space-y-4">
              {/* First Row - Permanent */}
              <div className="space-y-3">
                {/* Quick Picks */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Quick Picks</h3>
                  <div className="flex gap-1.5 relative">
                    {/* Section Type */}
                    <button
                      ref={typeBtnRefMd}
                      onClick={() => { setShowTypeDropdownMd(v => !v); setShowVariantDropdownMd(false); }}
                      className="px-2.5 py-1.5 rounded-lg border-2 text-xs font-medium transition-all hover:shadow-sm inline-flex items-center gap-1.5"
                      style={{ backgroundColor: 'white', borderColor: '#e5e7eb', color: '#374151' }}
                      aria-label="Choose section type"
                    >
                      <RectangleStackIcon className="w-4 h-4" />
                      Type
                      <ChevronDownIcon className="w-4 h-4" />
                    </button>
                    {showTypeDropdownMd && (
                      <div ref={typeDropdownRefMd} className="dropdown-container absolute top-full mt-2 left-0 bg-white rounded-lg shadow-lg border border-gray-200 z-[10020] w-80 max-h-72 overflow-y-auto p-2">
                        <div className="flex items-center gap-2 mb-2 px-1">
                          <MagnifyingGlassIcon className="w-4 h-4 text-gray-400" />
                          <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search section types..." className="w-full outline-none text-xs text-gray-800 placeholder:text-gray-400" />
                        </div>
                        <div className="divide-y divide-gray-100">
                          {filteredOptions.map(opt => (
                            <button key={opt.value} onClick={() => { setFormData({ ...formData, section_type: opt.value }); setShowTypeDropdownMd(false); }} className={cn('w-full text-left p-2 hover:bg-gray-50 flex items-start gap-2', formData.section_type === opt.value && 'bg-blue-50/70')}> 
                              <div className="p-1.5 rounded bg-gray-100"><opt.icon className="w-4 h-4 text-gray-700" /></div>
                              <div>
                                <div className="text-xs font-medium text-gray-900 flex items-center gap-1.5">{opt.label}{formData.section_type === opt.value && <span className="text-[9px] px-1 rounded bg-blue-100 text-blue-700">Selected</span>}</div>
                                <div className="text-[11px] text-gray-600">{opt.shortDescription || opt.description}</div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Color & Text */}
                    <button
                      ref={variantBtnRefMd}
                      onClick={() => { setShowVariantDropdownMd(v => !v); setShowTypeDropdownMd(false); }}
                      className="px-2.5 py-1.5 rounded-lg border-2 text-xs font-medium transition-all hover:shadow-sm inline-flex items-center gap-1.5"
                      style={{ backgroundColor: 'white', borderColor: '#e5e7eb', color: '#374151' }}
                      aria-label="Choose color & text style"
                    >
                      <Squares2X2Icon className="w-4 h-4" />
                      Color & Text
                      <ChevronDownIcon className="w-4 h-4" />
                    </button>
                    {showVariantDropdownMd && (
                      <div ref={variantDropdownRefMd} className="dropdown-container absolute top-full mt-2 left-0 bg-white rounded-lg shadow-lg border border-gray-200 z-[10020] w-80 max-h-72 overflow-y-auto p-2">
                        <div className="flex items-center gap-2 mb-2 px-1">
                          <MagnifyingGlassIcon className="w-4 h-4 text-gray-400" />
                          <input value={variantSearch} onChange={(e) => setVariantSearch(e.target.value)} placeholder="Search styles..." className="w-full outline-none text-xs text-gray-800 placeholder:text-gray-400" />
                        </div>
                        <div className="divide-y divide-gray-100">
                          {filteredVariants.map(opt => (
                            <button key={opt.value} onClick={() => { setFormData({ ...formData, text_style_variant: opt.value }); setShowVariantDropdownMd(false); }} className={cn('w-full text-left p-2 hover:bg-gray-50', formData.text_style_variant === opt.value && 'bg-blue-50/70')}>
                              <div className="text-xs font-medium text-gray-900 flex items-center gap-1.5">{opt.label}{formData.text_style_variant === opt.value && <span className="text-[9px] px-1 rounded bg-blue-100 text-blue-700">Selected</span>}</div>
                              <div className="mt-1 p-2 rounded border bg-white/60">
                                <div className={cn(opt.preview.h)}>Sample Heading</div>
                                <div className={cn(opt.preview.p)}>This is a preview of text.</div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Background with Full Width */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Background</h3>
                  <div className="flex gap-1.5 items-end">
                    <button
                      onClick={() => setFormData({ ...formData, is_full_width: !formData.is_full_width })}
                      className="px-2.5 py-1.5 rounded-lg border-2 text-xs font-medium transition-all hover:shadow-sm"
                      aria-label="Toggle full width section"
                      style={
                        formData.is_full_width
                          ? { background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`, color: 'white', borderColor: primary.base }
                          : { backgroundColor: 'white', borderColor: '#e5e7eb', color: '#6b7280' }
                      }
                    >
                      Full Width
                    </button>
                    <SimpleGradientPicker
                      label=""
                      isGradient={formData.is_gradient}
                      gradient={formData.gradient || { from: 'blue-500', via: 'purple-500', to: 'pink-500' }}
                      solidColor={formData.background_color}
                      onGradientChange={(isGradient: boolean, gradient: any) => setFormData({ ...formData, is_gradient: isGradient, gradient })}
                      onSolidColorChange={(color: string) => setFormData({ ...formData, background_color: color })}
                    />
                  </div>
                </div>

                {/* Title Alignment */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Title Alignment</h3>
                  <div className="flex gap-1.5">
                    {[
                      { value: 'left', label: 'L' },
                      { value: 'center', label: 'C' },
                      { value: 'right', label: 'R' }
                    ].map((align) => (
                      <button
                        key={align.value}
                        onClick={() => {
                          setFormData({
                            ...formData,
                            is_section_title_aligned_center: align.value === 'center',
                            is_section_title_aligned_right: align.value === 'right'
                          });
                        }}
                        className="flex-1 px-2.5 py-1.5 rounded-lg border-2 font-medium text-xs transition-all hover:shadow-sm"
                        aria-label={align.value === 'left' ? 'Align title left' : align.value === 'center' ? 'Align title center' : 'Align title right'}
                        style={
                          (align.value === 'center' && formData.is_section_title_aligned_center) ||
                          (align.value === 'right' && formData.is_section_title_aligned_right) ||
                          (align.value === 'left' && !formData.is_section_title_aligned_center && !formData.is_section_title_aligned_right)
                            ? { background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`, color: 'white', borderColor: primary.base }
                            : { backgroundColor: 'white', borderColor: '#e5e7eb', color: '#6b7280' }
                        }
                      >
                        {align.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Second Row - Title/Description always accessible, Metrics inactive for non-general sections */}
              <div className="space-y-3">
                {/* Title and Description - Always accessible */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Title & Description</h3>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={localTitle}
                        onChange={(e) => { isTypingTitleRef.current = true; setLocalTitle(e.target.value); }}
                        className="w-full px-2 py-1.5 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Section title"
                      />
                    </div>
                    <div className="flex-1">
                      <input
                        type="text"
                        value={localDescription}
                        onChange={(e) => { isTypingDescriptionRef.current = true; setLocalDescription(e.target.value); }}
                        className="w-full px-2 py-1.5 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Section description"
                      />
                    </div>
                  </div>
                </div>

                {/* Metrics with Options - Inactive for non-general sections */}
                <div className={cn("", formData.section_type !== 'general' && formData.section_type && 'opacity-50 pointer-events-none')}>
                  <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Metrics</h3>
                  <div className="flex gap-1.5 flex-wrap">
                    <button
                      onClick={() => setShowCreateMetricForm(true)}
                      className="px-2.5 py-1.5 rounded-lg border-2 text-xs font-medium transition-all hover:shadow-sm inline-flex items-center gap-1.5"
                      style={{ backgroundColor: 'white', borderColor: '#bfdbfe', color: '#2563eb' }}
                      title="Create new metric"
                      aria-label="Create new metric"
                    >
                      <PlusCircleIcon className="w-4 h-4" />
                      New
                    </button>
                    <button
                      onClick={() => setShowAddMetricModal(true)}
                      className="px-2.5 py-1.5 rounded-lg border-2 text-xs font-medium transition-all hover:shadow-sm inline-flex items-center gap-1.5"
                      style={{ backgroundColor: 'white', borderColor: '#e5e7eb', color: '#6b7280' }}
                      title="Add existing metric from library"
                      aria-label="Add existing metric from library"
                    >
                      <RectangleStackIcon className="w-4 h-4" />
                      Add
                    </button>
                    <button
                      onClick={() => setFormData({ ...formData, is_slider: !formData.is_slider })}
                      className="px-2.5 py-1.5 rounded-lg border-2 text-xs font-medium transition-all hover:shadow-sm"
                      aria-label="Toggle slider mode"
                      style={
                        formData.is_slider
                          ? { background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`, color: 'white', borderColor: primary.base }
                          : { backgroundColor: 'white', borderColor: '#e5e7eb', color: '#6b7280' }
                      }
                    >
                      Slider
                    </button>
                    <select
                      value={formData.grid_columns || 3}
                      onChange={(e) => setFormData({ ...formData, grid_columns: parseInt(e.target.value) })}
                      className="px-2.5 py-1.5 text-xs rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-offset-0 transition-all hover:shadow-sm font-medium"
                      style={{ '--tw-ring-color': primary.base, borderColor: '#e5e7eb' } as React.CSSProperties}
                      aria-label="Columns"
                    >
                      <option value="1">1 Col</option>
                      <option value="2">2 Col</option>
                      <option value="3">3 Col</option>
                      <option value="4">4 Col</option>
                      <option value="5">5 Col</option>
                      <option value="6">6 Col</option>
                    </select>
                    <button
                      onClick={() => setFormData({ ...formData, is_image_bottom: !formData.is_image_bottom })}
                      className="px-2.5 py-1.5 rounded-lg border-2 text-xs font-medium transition-all hover:shadow-sm"
                      aria-label="Toggle image position bottom"
                      style={
                        formData.is_image_bottom
                          ? { background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`, color: 'white', borderColor: primary.base }
                          : { backgroundColor: 'white', borderColor: '#e5e7eb', color: '#6b7280' }
                      }
                    >
                      Img Bottom
                    </button>
                    <select
                      value={formData.image_metrics_height || 'h-48'}
                      onChange={(e) => setFormData({ ...formData, image_metrics_height: e.target.value })}
                      className="px-2.5 py-1.5 text-xs rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-offset-0 transition-all hover:shadow-sm font-medium"
                      style={{ '--tw-ring-color': primary.base, borderColor: '#e5e7eb' } as React.CSSProperties}
                      aria-label="Image height"
                    >
                      <option value="h-32">Sm</option>
                      <option value="h-48">Md</option>
                      <option value="h-64">Lg</option>
                      <option value="h-80">XL</option>
                      <option value="h-96">2XL</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop (lg and above) - reorganized into first and second rows */}
            <div className="hidden lg:block">
              {/* First Row - Permanent */}
              <div className="grid grid-cols-12 gap-3 items-end mb-4">
                {/* Quick Picks */}
                <div className="lg:col-span-4">
                  <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Quick Picks</h3>
                  <div className="flex gap-1.5 relative">
                    <button ref={typeBtnRefLg} onClick={() => { setShowTypeDropdownLg(v => !v); setShowVariantDropdownLg(false); }} className="px-2.5 py-1.5 rounded-lg border-2 text-xs font-medium transition-all hover:shadow-sm inline-flex items-center gap-1.5" style={{ backgroundColor: 'white', borderColor: '#e5e7eb', color: '#374151' }} aria-label="Choose section type">
                      <RectangleStackIcon className="w-4 h-4" /> Type <ChevronDownIcon className="w-4 h-4" />
                    </button>
                    {showTypeDropdownLg && (
                      <div ref={typeDropdownRefLg} className="dropdown-container absolute top-full mt-2 left-0 bg-white rounded-lg shadow-lg border border-gray-200 z-[10020] w-96 max-h-80 overflow-y-auto p-2">
                        <div className="flex items-center gap-2 mb-2 px-1">
                          <MagnifyingGlassIcon className="w-4 h-4 text-gray-400" />
                          <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search section types..." className="w-full outline-none text-xs text-gray-800 placeholder:text-gray-400" />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                          {filteredOptions.map(opt => (
                            <button key={opt.value} onClick={() => { setFormData({ ...formData, section_type: opt.value }); setShowTypeDropdownLg(false); }} className={cn('text-left p-2 hover:bg-gray-50 flex items-start gap-2 rounded', formData.section_type === opt.value && 'bg-blue-50/70')}>
                              <div className="p-1.5 rounded bg-gray-100"><opt.icon className="w-4 h-4 text-gray-700" /></div>
                              <div>
                                <div className="text-xs font-medium text-gray-900 flex items-center gap-1.5">{opt.label}{formData.section_type === opt.value && <span className="text-[9px] px-1 rounded bg-blue-100 text-blue-700">Selected</span>}</div>
                                <div className="text-[11px] text-gray-600">{opt.shortDescription || opt.description}</div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <button ref={variantBtnRefLg} onClick={() => { setShowVariantDropdownLg(v => !v); setShowTypeDropdownLg(false); }} className="px-2.5 py-1.5 rounded-lg border-2 text-xs font-medium transition-all hover:shadow-sm inline-flex items-center gap-1.5" style={{ backgroundColor: 'white', borderColor: '#e5e7eb', color: '#374151' }} aria-label="Choose color & text style">
                      <Squares2X2Icon className="w-4 h-4" /> Color & Text <ChevronDownIcon className="w-4 h-4" />
                    </button>
                    {showVariantDropdownLg && (
                      <div ref={variantDropdownRefLg} className="dropdown-container absolute top-full mt-2 left-0 bg-white rounded-lg shadow-lg border border-gray-200 z-[10020] w-96 max-h-80 overflow-y-auto p-2">
                        <div className="flex items-center gap-2 mb-2 px-1">
                          <MagnifyingGlassIcon className="w-4 h-4 text-gray-400" />
                          <input value={variantSearch} onChange={(e) => setVariantSearch(e.target.value)} placeholder="Search styles..." className="w-full outline-none text-xs text-gray-800 placeholder:text-gray-400" />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                          {filteredVariants.map(opt => (
                            <button key={opt.value} onClick={() => { setFormData({ ...formData, text_style_variant: opt.value }); setShowVariantDropdownLg(false); }} className={cn('text-left p-2 hover:bg-gray-50 rounded', formData.text_style_variant === opt.value && 'bg-blue-50/70')}>
                              <div className="text-xs font-medium text-gray-900 flex items-center gap-1.5">{opt.label}{formData.text_style_variant === opt.value && <span className="text-[9px] px-1 rounded bg-blue-100 text-blue-700">Selected</span>}</div>
                              <div className="mt-1 p-2 rounded border bg-white/60">
                                <div className={cn(opt.preview.h)}>Sample Heading</div>
                                <div className={cn(opt.preview.p)}>This is a preview of text.</div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Background with Full Width */}
                <div className="lg:col-span-4">
                  <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Background</h3>
                  <div className="flex gap-1.5 items-end">
                    <button onClick={() => setFormData({ ...formData, is_full_width: !formData.is_full_width })} className="px-2.5 py-1.5 rounded-lg border-2 text-xs font-medium transition-all hover:shadow-sm" aria-label="Toggle full width section" style={formData.is_full_width ? { background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`, color: 'white', borderColor: primary.base } : { backgroundColor: 'white', borderColor: '#e5e7eb', color: '#6b7280' }}>Full Width</button>
                    <SimpleGradientPicker
                      label=""
                      isGradient={formData.is_gradient}
                      gradient={formData.gradient || { from: 'blue-500', via: 'purple-500', to: 'pink-500' }}
                      solidColor={formData.background_color}
                      onGradientChange={(isGradient: boolean, gradient: any) => setFormData({ ...formData, is_gradient: isGradient, gradient })}
                      onSolidColorChange={(color: string) => setFormData({ ...formData, background_color: color })}
                    />
                  </div>
                </div>

                {/* Title Alignment */}
                <div className="lg:col-span-4">
                  <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Title Alignment</h3>
                  <div className="flex gap-1.5">
                    {[
                      { value: 'left', label: 'L' },
                      { value: 'center', label: 'C' },
                      { value: 'right', label: 'R' }
                    ].map((align) => (
                      <button key={align.value} onClick={() => setFormData({ ...formData, is_section_title_aligned_center: align.value === 'center', is_section_title_aligned_right: align.value === 'right' })} className="flex-1 px-2.5 py-1.5 rounded-lg border-2 font-medium text-xs transition-all hover:shadow-sm" aria-label={align.value === 'left' ? 'Align title left' : align.value === 'center' ? 'Align title center' : 'Align title right'} style={(align.value === 'center' && formData.is_section_title_aligned_center) || (align.value === 'right' && formData.is_section_title_aligned_right) || (align.value === 'left' && !formData.is_section_title_aligned_center && !formData.is_section_title_aligned_right) ? { background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`, color: 'white', borderColor: primary.base } : { backgroundColor: 'white', borderColor: '#e5e7eb', color: '#6b7280' }}>{align.label}</button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Second Row - Inactive for non-general sections */}
              <div className="grid grid-cols-12 gap-3 items-end">
                {/* Title and Description - Always accessible */}
                <div className="lg:col-span-6">
                  <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Title & Description</h3>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={localTitle}
                        onChange={(e) => { isTypingTitleRef.current = true; setLocalTitle(e.target.value); }}
                        className="w-full px-2 py-1.5 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Section title"
                      />
                    </div>
                    <div className="flex-1">
                      <input
                        type="text"
                        value={localDescription}
                        onChange={(e) => { isTypingDescriptionRef.current = true; setLocalDescription(e.target.value); }}
                        className="w-full px-2 py-1.5 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Section description"
                      />
                    </div>
                  </div>
                </div>

                {/* Metrics with Options - Inactive for non-general sections */}
                <div className={cn("lg:col-span-6", formData.section_type !== 'general' && formData.section_type && 'opacity-50 pointer-events-none')}>
                  <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Metrics</h3>
                  <div className="flex gap-1.5 flex-wrap">
                    <button onClick={() => setShowCreateMetricForm(true)} className="px-2.5 py-1.5 rounded-lg border-2 text-xs font-medium transition-all hover:shadow-sm inline-flex items-center gap-1.5" style={{ backgroundColor: 'white', borderColor: '#bfdbfe', color: '#2563eb' }} title="Create new metric" aria-label="Create new metric">
                      <PlusCircleIcon className="w-4 h-4" />
                      New
                    </button>
                    <button onClick={() => setShowAddMetricModal(true)} className="px-2.5 py-1.5 rounded-lg border-2 text-xs font-medium transition-all hover:shadow-sm inline-flex items-center gap-1.5" style={{ backgroundColor: 'white', borderColor: '#e5e7eb', color: '#6b7280' }} title="Add existing metric from library" aria-label="Add existing metric from library">
                      <RectangleStackIcon className="w-4 h-4" />
                      Add
                    </button>
                    <button onClick={() => setFormData({ ...formData, is_slider: !formData.is_slider })} className="px-2.5 py-1.5 rounded-lg border-2 text-xs font-medium transition-all hover:shadow-sm" aria-label="Toggle slider mode" style={formData.is_slider ? { background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`, color: 'white', borderColor: primary.base } : { backgroundColor: 'white', borderColor: '#e5e7eb', color: '#6b7280' }}>Slider</button>
                    <select value={formData.grid_columns || 3} onChange={(e) => setFormData({ ...formData, grid_columns: parseInt(e.target.value) })} className="px-2 py-1.5 text-xs rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-offset-0 transition-all hover:shadow-sm font-medium" style={{ '--tw-ring-color': primary.base, borderColor: '#e5e7eb' } as React.CSSProperties} aria-label="Columns">
                      <option value="1">1 Col</option>
                      <option value="2">2 Col</option>
                      <option value="3">3 Col</option>
                      <option value="4">4 Col</option>
                      <option value="5">5 Col</option>
                      <option value="6">6 Col</option>
                    </select>
                    <button onClick={() => setFormData({ ...formData, is_image_bottom: !formData.is_image_bottom })} className="px-2.5 py-1.5 rounded-lg border-2 text-xs font-medium transition-all hover:shadow-sm" aria-label="Toggle image position bottom" style={formData.is_image_bottom ? { background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`, color: 'white', borderColor: primary.base } : { backgroundColor: 'white', borderColor: '#e5e7eb', color: '#6b7280' }}>Img Bottom</button>
                    <select value={formData.image_metrics_height || 'h-48'} onChange={(e) => setFormData({ ...formData, image_metrics_height: e.target.value })} className="px-2 py-1.5 text-xs rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-offset-0 transition-all hover:shadow-sm font-medium" style={{ '--tw-ring-color': primary.base, borderColor: '#e5e7eb' } as React.CSSProperties} aria-label="Image height">
                      <option value="h-32">Sm</option>
                      <option value="h-48">Md</option>
                      <option value="h-64">Lg</option>
                      <option value="h-80">XL</option>
                      <option value="h-96">2XL</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Inline MetricManager - appears when quick action buttons are used */}
        {(showCreateMetricForm || showAddMetricModal) && editingSection && (
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white/40 dark:bg-gray-800/40">
            <div className="max-w-7xl mx-auto">
              <MetricManager
                sectionId={editingSection.id}
                metrics={formData.website_metric || []}
                onMetricsChange={async () => {
                  await refetchEditingSection();
                  refreshSections();
                }}
                showCreateForm={showCreateMetricForm}
                setShowCreateForm={setShowCreateMetricForm}
                showAddModal={showAddMetricModal}
                setShowAddModal={setShowAddMetricModal}
                isImageBottom={formData.is_image_bottom}
                imageMetricsHeight={formData.image_metrics_height}
                textStyleVariant={formData.text_style_variant}
              />
            </div>
          </div>
        )}

        {/* Translations Mega Menu Dropdown */}
        {openMenu === 'translations' && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setOpenMenu(null)}
              aria-label="Close menu"
            />
            
            {/* Translations Panel */}
            <div className="absolute left-0 right-0 bottom-0 bg-white dark:bg-gray-800 shadow-2xl z-50 overflow-y-auto rounded-b-2xl" style={{ top: '132px' }}>
              <div className="max-w-7xl mx-auto px-6 py-6 h-full pb-24">
                <TranslationsSection
                  formData={formData}
                  setFormData={setFormData}
                  metrics={formData.website_metric || []}
                  setMetrics={(updatedMetrics: any) => {
                    if (typeof updatedMetrics === 'function') {
                      setFormData(prevFormData => ({
                        ...prevFormData,
                        website_metric: updatedMetrics(prevFormData.website_metric || [])
                      }));
                    } else {
                      setFormData(prevFormData => ({ ...prevFormData, website_metric: updatedMetrics }));
                    }
                  }}
                  primaryColor={primary.base}
                  onSave={onSaveTranslations}
                  isSaving={isSaving}
                  hasUnsavedChanges={hasUnsavedTranslations}
                  setHasUnsavedChanges={setHasUnsavedTranslations}
                />
              </div>
            </div>
          </>
        )}

        {/* Forms Mega Menu Dropdown */}
        {openMenu === 'forms' && formData.section_type === 'form_harmony' && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setOpenMenu(null)}
              aria-label="Close menu"
            />
            
            {/* Forms Panel */}
            <div className="absolute left-0 right-0 bottom-0 bg-white dark:bg-gray-800 shadow-2xl z-50 overflow-y-auto rounded-b-2xl" style={{ top: '132px' }}>
              <div className="max-w-4xl mx-auto px-6 py-6 h-full pb-24">
                <FormsTab
                  formId={formData.form_id}
                  onFormIdChange={(newFormId) => {
                    setFormData(prev => ({ ...prev, form_id: newFormId }));
                  }}
                />
              </div>
            </div>
          </>
        )}

        {/* Main Content Area - Live Preview */}
        <div className="flex-1 overflow-y-auto bg-white/20 dark:bg-gray-900/20 p-0">
          {/* Preview refresh indicator */}
          {previewRefreshing && (
            <div 
              className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg border"
              style={{ borderColor: `${primary.base}40` }}
              role="status"
              aria-live="polite"
            >
              <div 
                className="w-3 h-3 border-2 border-t-transparent rounded-full animate-spin"
                style={{ borderColor: `${primary.base} transparent transparent transparent` }}
              ></div>
              <span className="text-xs font-medium text-gray-700">Updating preview...</span>
            </div>
          )}
          
          {/* Full-width Live Preview - exact Section mirror */}
          <div className={`transition-opacity duration-300 ${previewRefreshing ? 'opacity-50' : 'opacity-100'}`}>
            <TemplateSectionPreview 
              formData={formData}
              onDoubleClickTitle={(e: React.MouseEvent) => handleInlineEditOpen('section_title', e)}
              onDoubleClickDescription={(e: React.MouseEvent) => handleInlineEditOpen('section_description', e)}
              onDoubleClickMetricTitle={(e: React.MouseEvent, metricIndex: number) => handleInlineEditOpen('metric_title', e, metricIndex)}
              onDoubleClickMetricDescription={(e: React.MouseEvent, metricIndex: number) => handleInlineEditOpen('metric_description', e, metricIndex)}
              onImageClick={(metricIndex: number) => handleOpenImageGallery(metricIndex)}
              onImageRemove={(metricIndex: number) => handleRemoveImage(metricIndex)}
              imageLoading={imageLoading}
            />
          </div>
        </div>

        {/* Footer - Matching Hero Edit Modal */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-white/20 dark:border-gray-700/20 bg-white/30 dark:bg-gray-800/30 rounded-b-2xl">
          <div className="flex items-center justify-between w-full gap-3">
            {/* Left side - Delete button for edit mode only */}
            {mode === 'edit' ? (
              <Button
                variant="danger"
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 text-sm"
              >
                Delete
              </Button>
            ) : (
              <div></div>
            )}
            
            {/* Right side - Cancel and Save */}
            <div className="flex items-center gap-3 ml-auto">
              <Button
                variant="secondary"
                onClick={closeModal}
                className="px-6 py-2"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={onSave}
                loading={isSaving}
                className="px-6 py-2"
                title="Ctrl/Cmd + S to save"
              >
                {mode === 'create' ? 'Create' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {createPortal(modalContent, document.body)}

      {/* Delete Confirmation Modal */}
      <DeleteSectionModal
        isOpen={showDeleteConfirm}
        sectionTitle={editingSection?.section_title || ''}
        onConfirm={onDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      {/* Inline Edit Popover */}
      {inlineEdit.field && (() => {
        const safePosition = getSafePopoverPosition(inlineEdit.position.x, inlineEdit.position.y);
        return (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-[10003] bg-black/20 backdrop-blur-[2px]" 
              onClick={handleInlineEditCancel}
            />
            
            {/* Popover with pulsing glow effect */}
            <div 
              className="fixed z-[10004] bg-white dark:bg-gray-800 rounded-xl shadow-2xl border-2 p-5 w-[500px] max-w-[90vw] animate-in fade-in zoom-in-95 duration-200"
              style={{ 
                left: `${safePosition.x}px`, 
                top: `${safePosition.y}px`,
                borderColor: primary.base,
                boxShadow: `0 0 0 4px ${primary.base}20, 0 20px 25px -5px rgba(0, 0, 0, 0.1)`
              }}
            >
            {/* Active edit indicator */}
            <div className="absolute -top-3 left-4 px-3 py-1 rounded-full text-xs font-semibold text-white shadow-lg flex items-center gap-1.5"
              style={{ 
                background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`
              }}
            >
              <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
              Editing
            </div>
            
            <div className="mb-3">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-bold text-gray-900 dark:text-white capitalize flex items-center gap-2">
                  <span className="text-lg">✏️</span>
                  {inlineEdit.field === 'section_title' ? 'Section Title' : 
                    inlineEdit.field === 'section_description' ? 'Section Description' : 
                    inlineEdit.field === 'metric_title' ? 'Metric Title' : 'Metric Description'}
                </label>
                <button
                  onClick={handleInlineEditCancel}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="Cancel (Esc)"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {inlineEdit.field === 'section_title' || inlineEdit.field === 'metric_title' ? (
                <input
                  type="text"
                  value={inlineEdit.value}
                  onChange={(e) => setInlineEdit({ ...inlineEdit, value: e.target.value })}
                  className="w-full px-4 py-3 border-2 rounded-xl dark:bg-gray-700 dark:text-white text-lg font-semibold focus:outline-none focus:ring-2 transition-all"
                  style={{
                    borderColor: `${primary.base}40`,
                    '--tw-ring-color': primary.base,
                    boxShadow: `0 0 0 3px ${primary.base}10`
                  } as React.CSSProperties}
                  placeholder="Enter title..."
                  autoFocus
                />
              ) : (
                <textarea
                  value={inlineEdit.value}
                  onChange={(e) => setInlineEdit({ ...inlineEdit, value: e.target.value })}
                  className="w-full px-4 py-3 border-2 rounded-xl dark:bg-gray-700 dark:text-white resize-none focus:outline-none focus:ring-2 transition-all"
                  style={{
                    borderColor: `${primary.base}40`,
                    '--tw-ring-color': primary.base,
                    boxShadow: `0 0 0 3px ${primary.base}10`
                  } as React.CSSProperties}
                  placeholder="Enter description..."
                  rows={4}
                  autoFocus
                />
              )}
              
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <span className="flex items-center gap-1">
                    <kbd className="px-2 py-1 border rounded-md text-xs font-semibold" style={{ 
                      backgroundColor: `${primary.base}10`,
                      borderColor: `${primary.base}30`,
                      color: primary.base
                    }}>↵ Enter</kbd> 
                    <span>save</span>
                  </span>
                  <span className="text-gray-300 dark:text-gray-600">•</span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-2 py-1 border rounded-md text-xs font-semibold" style={{ 
                      backgroundColor: `${primary.base}10`,
                      borderColor: `${primary.base}30`,
                      color: primary.base
                    }}>Esc</kbd>
                    <span>cancel</span>
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    onClick={handleInlineEditCancel}
                    className="px-3 py-1 text-sm"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleInlineEditSave}
                    disabled={!inlineEdit.value.trim()}
                    className="px-3 py-1 text-sm"
                  >
                    Save
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </>
        );
      })()}

      {/* Image Gallery Modal */}
      {isImageGalleryOpen && (
        <ImageGalleryModal
          isOpen={isImageGalleryOpen}
          onClose={() => {
            setIsImageGalleryOpen(false);
            setImageSelectionTarget(null);
          }}
          onSelectImage={handleImageSelect}
        />
      )}
    </>
  );
}
