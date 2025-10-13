'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Bars3BottomLeftIcon,
  Bars3Icon,
  Bars3BottomRightIcon,
  SparklesIcon,
  Square2StackIcon,
  ArrowsUpDownIcon,
  ViewColumnsIcon,
  ArrowsRightLeftIcon,
  ChatBubbleBottomCenterTextIcon,
  QuestionMarkCircleIcon,
  HomeModernIcon,
  RectangleStackIcon,
  PhotoIcon,
  PlusIcon,
  BuildingOfficeIcon,
  NewspaperIcon,
  EnvelopeIcon,
  ChatBubbleLeftRightIcon,
  CurrencyDollarIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import { RadioGroup } from '@headlessui/react';
import { useTemplateSectionEdit } from './context';
import ColorPaletteDropdown, { getColorValue } from '@/components/Shared/ColorPaletteDropdown';
import EditableGradientPicker from '@/components/Shared/EditableFields/EditableGradientPicker';
import { getBackgroundStyle } from '@/utils/gradientHelper';
import DeleteSectionModal from './DeleteSectionModal';
import MetricManager from './MetricManager';
import Button from '@/ui/Button';
import { cn } from '@/lib/utils';
import { BaseModal } from '../_shared/BaseModal';

// Tooltip Component - appears above button (like nav menu)
const Tooltip = ({ content }: { content: string }) => {
  return (
    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
      <div className="relative">
        {/* Content */}
        <div className="bg-white text-gray-700 text-xs rounded-lg shadow-lg border border-gray-200 px-3 py-2 whitespace-normal w-64">
          {content}
        </div>
        {/* Arrow pointing down */}
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2">
          <div className="w-2 h-2 bg-white border-r border-b border-gray-200 transform rotate-45" />
        </div>
      </div>
    </div>
  );
};

// Text style variants matching TemplateSection.tsx
const TEXT_VARIANTS = {
  default: {
    sectionTitle: 'text-3xl sm:text-4xl lg:text-5xl font-normal text-gray-800',
    sectionDescription: 'text-lg font-light text-gray-700',
  },
  apple: {
    sectionTitle: 'text-4xl font-light text-gray-900',
    sectionDescription: 'text-lg font-light text-gray-600',
  },
  codedharmony: {
    sectionTitle: 'text-3xl sm:text-5xl lg:text-6xl font-thin text-gray-900 tracking-tight leading-none',
    sectionDescription: 'text-lg sm:text-xl text-gray-500 font-light leading-relaxed',
  }
};

// Height options
const HEIGHT_OPTIONS = [
  { value: 'h-8', label: '2rem' },
  { value: 'h-12', label: '3rem' },
  { value: 'h-16', label: '4rem' },
  { value: 'h-20', label: '5rem' },
  { value: 'h-24', label: '6rem' },
  { value: 'h-32', label: '8rem' },
  { value: 'h-40', label: '10rem' },
  { value: 'h-48', label: '12rem' },
  { value: 'h-56', label: '14rem' },
  { value: 'h-64', label: '16rem' },
  { value: 'h-72', label: '18rem' },
  { value: 'h-80', label: '20rem' },
  { value: 'h-96', label: '24rem' },
];

// Section type options
const SECTION_TYPE_OPTIONS = [
  {
    value: 'general' as const,
    label: 'General Content',
    description: 'Standard section with title, description, and metrics',
    icon: ChatBubbleBottomCenterTextIcon,
    color: 'gray',
  },
  {
    value: 'reviews' as const,
    label: 'Reviews',
    description: 'Customer reviews and testimonials',
    icon: StarIcon,
    color: 'amber',
  },
  {
    value: 'help_center' as const,
    label: 'Help Center',
    description: 'FAQ and support knowledge base',
    icon: QuestionMarkCircleIcon,
    color: 'cyan',
  },
  {
    value: 'real_estate' as const,
    label: 'Real Estate',
    description: 'Property listings and details',
    icon: HomeModernIcon,
    color: 'orange',
  },
  {
    value: 'brand' as const,
    label: 'Brands',
    description: 'Brand logos carousel',
    icon: BuildingOfficeIcon,
    color: 'purple',
  },
  {
    value: 'article_slider' as const,
    label: 'Article Slider',
    description: 'Featured blog posts carousel',
    icon: NewspaperIcon,
    color: 'indigo',
  },
  {
    value: 'contact' as const,
    label: 'Contact Form',
    description: 'Contact information and form',
    icon: EnvelopeIcon,
    color: 'green',
  },
  {
    value: 'faq' as const,
    label: 'FAQ',
    description: 'Frequently asked questions',
    icon: ChatBubbleLeftRightIcon,
    color: 'blue',
  },
  {
    value: 'pricing_plans' as const,
    label: 'Pricing Plans',
    description: 'Product pricing cards',
    icon: CurrencyDollarIcon,
    color: 'yellow',
  },
];

interface Metric {
  id: number;
  title: string;
  title_translation?: Record<string, string>;
  is_title_displayed: boolean;
  description: string;
  description_translation?: Record<string, string>;
  image?: string;
  is_image_rounded_full: boolean;
  is_card_type: boolean;
  background_color?: string;
  organization_id: string | null;
  template_section_id?: number;
  display_order?: number;
}

interface TemplateSectionFormData {
  section_title: string;
  section_description: string;
  background_color: string;
  is_gradient: boolean;
  gradient: { from: string; via?: string; to: string } | null;
  text_style_variant: 'default' | 'apple' | 'codedharmony';
  grid_columns: number;
  image_metrics_height: string;
  is_full_width: boolean;
  is_section_title_aligned_center: boolean;
  is_section_title_aligned_right: boolean;
  is_image_bottom: boolean;
  is_slider: boolean;
  
  // New consolidated field
  section_type: 'general' | 'brand' | 'article_slider' | 'contact' | 'faq' | 'reviews' | 'help_center' | 'real_estate' | 'pricing_plans';
  
  // DEPRECATED - Keep temporarily for backward compat
  is_reviews_section: boolean;
  is_help_center_section: boolean;
  is_real_estate_modal: boolean;
  is_brand: boolean;
  is_article_slider: boolean;
  is_contact_section: boolean;
  is_faq_section: boolean;
  is_pricingplans_section: boolean;
  url_page?: string;
  website_metric?: Metric[];
}

export default function TemplateSectionEditModal() {
  const { isOpen, editingSection, mode, closeModal, updateSection, deleteSection, refreshSections, refetchEditingSection } = useTemplateSectionEdit();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showStylePicker, setShowStylePicker] = useState(false);
  const [showHeightPicker, setShowHeightPicker] = useState(false);
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const [showCreateMetricForm, setShowCreateMetricForm] = useState(false);
  const [showAddMetricModal, setShowAddMetricModal] = useState(false);
  const [editingMetricId, setEditingMetricId] = useState<number | null>(null);
  const descriptionTextareaRef = useRef<HTMLTextAreaElement>(null);
  const colorButtonRef = useRef<HTMLButtonElement>(null);
  const styleButtonRef = useRef<HTMLButtonElement>(null);
  const columnButtonRef = useRef<HTMLButtonElement>(null);
  const heightButtonRef = useRef<HTMLButtonElement>(null);
  
  const [formData, setFormData] = useState<TemplateSectionFormData>({
    section_title: '',
    section_description: '',
    background_color: 'white',
    is_gradient: false,
    gradient: null,
    text_style_variant: 'default',
    grid_columns: 3,
    image_metrics_height: '300px',
    is_full_width: false,
    is_section_title_aligned_center: false,
    is_section_title_aligned_right: false,
    is_image_bottom: false,
    is_slider: false,
    section_type: 'general',
    is_reviews_section: false,
    is_help_center_section: false,
    is_real_estate_modal: false,
    is_brand: false,
    is_article_slider: false,
    is_contact_section: false,
    is_faq_section: false,
    is_pricingplans_section: false,
    url_page: undefined,
    website_metric: undefined,
  });

  // Initialize form data when editing section changes
  useEffect(() => {
    if (editingSection) {
      // Determine section_type from boolean flags if not set
      let sectionType: TemplateSectionFormData['section_type'] = (editingSection as any).section_type || 'general';
      if (!(editingSection as any).section_type) {
        // Fallback: derive from boolean flags
        if (editingSection.is_reviews_section) sectionType = 'reviews';
        else if (editingSection.is_help_center_section) sectionType = 'help_center';
        else if (editingSection.is_real_estate_modal) sectionType = 'real_estate';
        else if (editingSection.is_brand) sectionType = 'brand';
        else if (editingSection.is_article_slider) sectionType = 'article_slider';
        else if (editingSection.is_contact_section) sectionType = 'contact';
        else if (editingSection.is_faq_section) sectionType = 'faq';
        else if (editingSection.is_pricingplans_section) sectionType = 'pricing_plans';
      }
      
      setFormData({
        section_title: editingSection.section_title || '',
        section_description: editingSection.section_description || '',
        background_color: editingSection.background_color || 'white',
        is_gradient: editingSection.is_gradient || false,
        gradient: editingSection.gradient || null,
        text_style_variant: editingSection.text_style_variant || 'default',
        grid_columns: editingSection.grid_columns || 3,
        image_metrics_height: editingSection.image_metrics_height || '300px',
        is_full_width: editingSection.is_full_width || false,
        is_section_title_aligned_center: editingSection.is_section_title_aligned_center || false,
        is_section_title_aligned_right: editingSection.is_section_title_aligned_right || false,
        is_image_bottom: editingSection.is_image_bottom || false,
        is_slider: editingSection.is_slider || false,
        section_type: sectionType,
        is_reviews_section: editingSection.is_reviews_section || false,
        is_help_center_section: editingSection.is_help_center_section || false,
        is_real_estate_modal: editingSection.is_real_estate_modal || false,
        is_brand: editingSection.is_brand || false,
        is_article_slider: editingSection.is_article_slider || false,
        is_contact_section: editingSection.is_contact_section || false,
        is_faq_section: editingSection.is_faq_section || false,
        is_pricingplans_section: editingSection.is_pricingplans_section || false,
        url_page: editingSection.url_page,
        website_metric: editingSection.website_metric,
      });
    }
  }, [editingSection]);

  // Auto-expand textarea
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData({ ...formData, section_description: e.target.value });
    
    if (descriptionTextareaRef.current) {
      descriptionTextareaRef.current.style.height = 'auto';
      descriptionTextareaRef.current.style.height = descriptionTextareaRef.current.scrollHeight + 'px';
    }
  };

  // Reset textarea height when content changes
  useEffect(() => {
    if (descriptionTextareaRef.current) {
      descriptionTextareaRef.current.style.height = 'auto';
      descriptionTextareaRef.current.style.height = descriptionTextareaRef.current.scrollHeight + 'px';
    }
  }, [formData.section_description]);

  const handleSave = async () => {
    if (!formData.section_title || !formData.section_title.trim()) {
      alert('Please enter a section title');
      return;
    }
    
    setIsSaving(true);
    try {
      await updateSection(formData);
      closeModal();
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editingSection?.id) return;
    
    try {
      await deleteSection(editingSection.id);
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.dropdown-container') && 
          !target.closest('.color-palette-dropdown') &&
          !target.closest('.fixed.bg-white.rounded-lg.shadow-lg')) {
        setShowColorPicker(false);
        setShowStylePicker(false);
        setShowColumnPicker(false);
        setShowHeightPicker(false);
      }
    };

    if (showColorPicker || showStylePicker || showColumnPicker || showHeightPicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showColorPicker, showStylePicker, showColumnPicker, showHeightPicker]);

  if (!isOpen) return null;

  const modalTitle = (
    <div className="flex items-center gap-2.5">
      <span>{mode === 'create' ? 'Create Template Section' : 'Edit Template Section'}</span>
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
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-3 sm:px-6">
          <div className="overflow-x-auto">
            <div className="flex items-center gap-1 py-3 min-w-max">
              {/* Alignment buttons */}
              <div className="relative group">
                <button
                  onClick={() => setFormData({
                    ...formData,
                    is_section_title_aligned_center: false,
                    is_section_title_aligned_right: false,
                  })}
                  className={cn(
                    'p-2 rounded-lg transition-colors',
                    !formData.is_section_title_aligned_center && !formData.is_section_title_aligned_right
                      ? 'bg-sky-100 text-sky-500 border border-sky-200'
                      : 'text-gray-400 hover:text-sky-500 hover:bg-gray-50 border border-transparent'
                  )}
                >
                  <Bars3BottomLeftIcon className="w-5 h-5" />
                </button>
                <Tooltip content="Align section title to the left" />
              </div>

              <div className="relative group">
                <button
                  onClick={() => setFormData({
                    ...formData,
                    is_section_title_aligned_center: true,
                    is_section_title_aligned_right: false,
                  })}
                  className={cn(
                    'p-2 rounded-lg transition-colors',
                    formData.is_section_title_aligned_center
                      ? 'bg-sky-100 text-sky-500 border border-sky-200'
                      : 'text-gray-400 hover:text-sky-500 hover:bg-gray-50 border border-transparent'
                  )}
                >
                  <Bars3Icon className="w-5 h-5" />
                </button>
                <Tooltip content="Align section title to the center" />
              </div>

              <div className="relative group">
                <button
                  onClick={() => setFormData({
                    ...formData,
                    is_section_title_aligned_center: false,
                    is_section_title_aligned_right: true,
                  })}
                  className={cn(
                    'p-2 rounded-lg transition-colors',
                    formData.is_section_title_aligned_right
                      ? 'bg-sky-100 text-sky-500 border border-sky-200'
                      : 'text-gray-400 hover:text-sky-500 hover:bg-gray-50 border border-transparent'
                  )}
                >
                  <Bars3BottomRightIcon className="w-5 h-5" />
                </button>
                <Tooltip content="Align section title to the right" />
              </div>

              <div className="w-px h-6 bg-gray-300 mx-1" />

              {/* Full Width */}
              <div className="relative group">
                <button
                  onClick={() => setFormData({ ...formData, is_full_width: !formData.is_full_width })}
                  className={cn(
                    'p-2 rounded-lg transition-colors',
                    formData.is_full_width
                      ? 'bg-sky-100 text-sky-500 border border-sky-200'
                      : 'text-gray-400 hover:text-sky-500 hover:bg-gray-50 border border-transparent'
                  )}
                >
                  <ArrowsRightLeftIcon className="w-5 h-5" />
                </button>
                <Tooltip content="Make section full width without container constraints" />
              </div>

              {/* Enable Slider - Only for general sections */}
              {formData.section_type === 'general' && (
                <div className="relative group">
                  <button
                    onClick={() => setFormData({ ...formData, is_slider: !formData.is_slider })}
                    className={cn(
                      'p-2 rounded-lg transition-colors',
                      formData.is_slider
                        ? 'bg-sky-100 text-sky-500 border border-sky-200'
                        : 'text-gray-400 hover:text-sky-500 hover:bg-gray-50 border border-transparent'
                    )}
                  >
                    <RectangleStackIcon className="w-5 h-5" />
                  </button>
                  <Tooltip content="Enable horizontal slider/carousel for metrics" />
                </div>
              )}

              {/* Background Color */}
              <div className="relative group">
                <ColorPaletteDropdown
                  value={formData.background_color}
                  onChange={async (colorClass) => {
                    const updatedData = { ...formData, background_color: colorClass };
                    setFormData(updatedData);
                    setShowColorPicker(false);
                  }}
                  isOpen={showColorPicker}
                  onToggle={() => {
                    setShowColorPicker(!showColorPicker);
                    setShowStylePicker(false);
                    setShowHeightPicker(false);
                    setShowColumnPicker(false);
                  }}
                  onClose={() => setShowColorPicker(false)}
                  buttonRef={colorButtonRef}
                  useFixedPosition={true}
                />
              </div>

              {/* Text Style */}
              <div className="dropdown-container relative group">
                <button
                  ref={styleButtonRef}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowStylePicker(!showStylePicker);
                    setShowColorPicker(false);
                    setShowHeightPicker(false);
                    setShowColumnPicker(false);
                  }}
                  className={cn(
                    'p-2 rounded-lg transition-colors',
                    showStylePicker
                      ? 'bg-sky-100 text-sky-500 border border-sky-200'
                      : 'text-gray-400 hover:text-sky-500 hover:bg-gray-50 border border-transparent'
                  )}
                >
                  <SparklesIcon className="w-5 h-5" />
                </button>
                <Tooltip content="Choose text style variant: Default, Apple, or Coded Harmony" />
                {showStylePicker && styleButtonRef.current && (() => {
                  const rect = styleButtonRef.current.getBoundingClientRect();
                  return (
                    <div 
                      className="fixed bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-[100] w-48"
                      style={{
                        top: `${rect.bottom + 8}px`,
                        left: `${rect.left}px`,
                      }}
                    >
                      {(['default', 'apple', 'codedharmony'] as const).map((style) => (
                        <button
                          key={style}
                          onClick={(e) => {
                            e.stopPropagation();
                            setFormData({ ...formData, text_style_variant: style });
                            setShowStylePicker(false);
                          }}
                          className={cn(
                            'w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors',
                            formData.text_style_variant === style && 'bg-sky-50 text-sky-700 font-medium'
                          )}
                        >
                          {style === 'default' && 'Default'}
                          {style === 'apple' && 'Apple Style'}
                          {style === 'codedharmony' && 'Coded Harmony'}
                        </button>
                      ))}
                    </div>
                  );
                })()}
              </div>

              {/* Grid Columns */}
              <div className="dropdown-container relative group">
                <button
                  ref={columnButtonRef}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowColumnPicker(!showColumnPicker);
                    setShowColorPicker(false);
                    setShowStylePicker(false);
                    setShowHeightPicker(false);
                  }}
                  className={cn(
                    'p-2 rounded-lg transition-colors flex items-center gap-1',
                    showColumnPicker
                      ? 'bg-sky-100 text-sky-500 border border-sky-200'
                      : 'text-gray-400 hover:text-sky-500 hover:bg-gray-50 border border-transparent'
                  )}
                >
                  <ViewColumnsIcon className="w-5 h-5" />
                  <span className="text-xs font-medium">{formData.grid_columns}</span>
                </button>
                <Tooltip content={`Grid columns: ${formData.grid_columns} column${formData.grid_columns > 1 ? 's' : ''}`} />
                {showColumnPicker && columnButtonRef.current && (() => {
                  const rect = columnButtonRef.current.getBoundingClientRect();
                  return (
                    <div 
                      className="fixed bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-[100] w-24"
                      style={{
                        top: `${rect.bottom + 8}px`,
                        left: `${rect.left}px`,
                      }}
                    >
                      {[1, 2, 3, 4, 5, 6].map((cols) => (
                        <button
                          key={cols}
                          onClick={(e) => {
                            e.stopPropagation();
                            setFormData({ ...formData, grid_columns: cols });
                            setShowColumnPicker(false);
                          }}
                          className={cn(
                            'w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors',
                            formData.grid_columns === cols && 'bg-sky-50 text-sky-700 font-medium'
                          )}
                        >
                          {cols} {cols === 1 ? 'col' : 'cols'}
                        </button>
                      ))}
                    </div>
                  );
                })()}
              </div>

              <div className="w-px h-6 bg-gray-300 mx-1" />

              {/* Metric & Image Controls Group */}
              <div className="flex items-center gap-1">
                {/* Create New Metric */}
                <div className="relative group">
                  <button
                    onClick={() => mode === 'edit' && setShowCreateMetricForm(true)}
                    disabled={mode === 'create'}
                    className={cn(
                      'p-2 rounded-lg border-2 border-dashed transition-colors',
                      mode === 'create'
                        ? 'border-gray-200 cursor-not-allowed opacity-50'
                        : 'border-gray-300 hover:border-sky-500 hover:bg-sky-50'
                    )}
                  >
                    <PlusIcon className={cn(
                      'w-5 h-5',
                      mode === 'create' ? 'text-gray-300' : 'text-gray-400 hover:text-sky-600'
                    )} />
                  </button>
                  <Tooltip content={mode === 'create' ? 'Save the section first to add metrics' : 'Create a new metric for this section'} />
                </div>

                {/* Add Existing Metric */}
                <div className="relative group">
                  <button
                    onClick={() => mode === 'edit' && setShowAddMetricModal(true)}
                    disabled={mode === 'create'}
                    className={cn(
                      'p-2 rounded-lg transition-colors',
                      mode === 'create'
                        ? 'text-gray-300 cursor-not-allowed opacity-50'
                        : 'text-gray-400 hover:text-sky-500 hover:bg-gray-50'
                    )}
                  >
                    <Square2StackIcon className="w-5 h-5" />
                  </button>
                  <Tooltip content={mode === 'create' ? 'Save the section first to add metrics' : 'Add an existing metric from library'} />
                </div>

                {/* Image Position */}
                <div className="relative group">
                  <button
                    onClick={() => setFormData({ ...formData, is_image_bottom: !formData.is_image_bottom })}
                    className={cn(
                      'p-2 rounded-lg transition-colors',
                      formData.is_image_bottom
                        ? 'bg-sky-100 text-sky-500 border border-sky-200'
                        : 'text-gray-400 hover:text-sky-500 hover:bg-gray-50 border border-transparent'
                    )}
                  >
                    <ArrowsUpDownIcon className="w-5 h-5" />
                  </button>
                  <Tooltip content={formData.is_image_bottom ? "Image at bottom" : "Image at top"} />
                </div>

                {/* Image Height */}
                <div className="dropdown-container relative group">
                  <button
                    ref={heightButtonRef}
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowHeightPicker(!showHeightPicker);
                      setShowColorPicker(false);
                      setShowStylePicker(false);
                      setShowColumnPicker(false);
                    }}
                    className={cn(
                      'p-2 rounded-lg transition-colors',
                      showHeightPicker
                        ? 'bg-sky-100 text-sky-500 border border-sky-200'
                        : 'text-gray-400 hover:text-sky-500 hover:bg-gray-50 border border-transparent'
                    )}
                  >
                    <PhotoIcon className="w-5 h-5" />
                  </button>
                  <Tooltip content="Set metric image height" />
                  {showHeightPicker && heightButtonRef.current && (() => {
                    const rect = heightButtonRef.current.getBoundingClientRect();
                    return (
                      <div 
                        className="fixed bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-[100] w-32 max-h-64 overflow-y-auto"
                        style={{
                          top: `${rect.bottom + 8}px`,
                          left: `${rect.left}px`,
                        }}
                      >
                        {HEIGHT_OPTIONS.map((option) => (
                          <button
                            key={option.value}
                            onClick={(e) => {
                              e.stopPropagation();
                              setFormData({ ...formData, image_metrics_height: option.label });
                              setShowHeightPicker(false);
                            }}
                            className={cn(
                              'w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors',
                              formData.image_metrics_height === option.label && 'bg-sky-50 text-sky-700 font-medium'
                            )}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-6">
          {/* Section Type Selection */}
          <div className="py-6 border-b border-gray-200">
            <label className="block text-sm font-semibold text-gray-700 mb-4">
              Section Type
            </label>
            <RadioGroup
              value={formData.section_type}
              onChange={(value) => setFormData({ ...formData, section_type: value })}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {SECTION_TYPE_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  
                  return (
                    <RadioGroup.Option
                      key={option.value}
                      value={option.value}
                      className={({ checked }) =>
                        `relative flex cursor-pointer rounded-xl border-2 p-4 transition-all hover:shadow-md
                        ${checked
                          ? 'border-sky-500 bg-sky-50 ring-2 ring-sky-500 shadow-sm'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                        }`
                      }
                    >
                      {({ checked }) => (
                        <div className="flex w-full items-start">
                          <div className="flex-shrink-0">
                            <Icon
                              className={`h-6 w-6 ${
                                checked ? 'text-sky-600' : 'text-gray-400'
                              }`}
                            />
                          </div>
                          <div className="ml-3 flex-1">
                            <RadioGroup.Label
                              as="p"
                              className={`text-sm font-semibold ${
                                checked ? 'text-sky-900' : 'text-gray-900'
                              }`}
                            >
                              {option.label}
                            </RadioGroup.Label>
                            <RadioGroup.Description
                              as="p"
                              className="text-xs text-gray-500 mt-1 leading-relaxed"
                            >
                              {option.description}
                            </RadioGroup.Description>
                          </div>
                          {checked && (
                            <div className="flex-shrink-0 ml-2">
                              <div className="rounded-full bg-sky-500 p-1">
                                <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 12 12">
                                  <path d="M3.707 5.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4a1 1 0 00-1.414-1.414L5 6.586 3.707 5.293z" />
                                </svg>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </RadioGroup.Option>
                  );
                })}
              </div>
            </RadioGroup>
            <p className="text-xs text-gray-500 mt-3">
              {formData.section_type === 'general' 
                ? 'Standard section with customizable title, description, and metrics below.'
                : 'Special section with predefined layout and functionality. Title and description are optional.'}
            </p>
          </div>

          {/* Background Style */}
          <div className="py-6 border-b border-gray-200">
            <EditableGradientPicker
              label="Section Background"
              isGradient={formData.is_gradient}
              gradient={formData.gradient}
              solidColor={formData.background_color}
              onGradientChange={(isGradient, gradient) => 
                setFormData({ ...formData, is_gradient: isGradient, gradient })
              }
              onSolidColorChange={(color) => 
                setFormData({ ...formData, background_color: color })
              }
            />
          </div>

          {/* Content - Preview Area */}
          <div 
            className="rounded-lg overflow-hidden p-3 sm:p-6 my-4 sm:my-6 transition-colors"
            style={getBackgroundStyle(
              formData.is_gradient, 
              formData.gradient, 
              formData.background_color || 'white'
            )}
          >
            <div className="space-y-2 max-w-4xl mx-auto">
              {/* Section Title - Styled like actual section */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <label className="text-xs font-medium text-gray-500">
                    Title {formData.section_type !== 'general' && <span className="text-gray-400 font-normal">(optional)</span>}
                  </label>
                </div>
                <input
                  type="text"
                  value={formData.section_title}
                  onChange={(e) => setFormData({ ...formData, section_title: e.target.value })}
                  placeholder="Enter section title..."
                  className={cn(
                    'w-full px-0 py-2 border-0 focus:outline-none focus:ring-0 placeholder:text-gray-300 bg-transparent text-2xl sm:text-3xl',
                    TEXT_VARIANTS[formData.text_style_variant].sectionTitle,
                    formData.is_section_title_aligned_center && 'text-center',
                    formData.is_section_title_aligned_right && 'text-right'
                  )}
                />
              </div>

              {/* Section Description - Styled like actual section */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <label className="text-xs font-medium text-gray-500">
                    Description {formData.section_type !== 'general' && <span className="text-gray-400 font-normal">(optional)</span>}
                  </label>
                </div>
                <textarea
                  ref={descriptionTextareaRef}
                  value={formData.section_description}
                  onChange={handleDescriptionChange}
                  placeholder="Enter section description (optional)..."
                  rows={1}
                  className={cn(
                    'w-full px-0 py-1 border-0 focus:outline-none focus:ring-0 placeholder:text-gray-300 resize-none bg-transparent overflow-hidden text-base sm:text-lg',
                    TEXT_VARIANTS[formData.text_style_variant].sectionDescription,
                    formData.is_section_title_aligned_center && 'text-center',
                    formData.is_section_title_aligned_right && 'text-right'
                  )}
                />
              </div>

              {/* Metrics Section - Only for general sections */}
              {formData.section_type === 'general' && (
                <div className="pt-4 sm:pt-6 mt-3 sm:mt-4">
                  {mode === 'create' ? (
                    <div className="rounded-xl border-2 border-dashed border-sky-200 bg-sky-50/50 p-4 sm:p-6 md:p-8 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-sky-100 flex items-center justify-center">
                          <RectangleStackIcon className="w-5 h-5 sm:w-6 sm:h-6 text-sky-600" />
                        </div>
                        <div>
                          <h4 className="text-sm sm:text-base font-medium text-sky-900 mb-1">
                            Save Section to Add Metrics
                          </h4>
                          <p className="text-xs sm:text-sm text-sky-700">
                            Create the section first, then you'll be able to add and manage metrics
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : editingSection ? (
                  <MetricManager
                    sectionId={editingSection.id}
                    metrics={formData.website_metric || []}
                    onMetricsChange={async () => {
                      console.log('Modal: onMetricsChange called, refetching section...');
                      await refetchEditingSection();
                      console.log('Modal: refetchEditingSection completed');
                      refreshSections();
                      console.log('Modal: refreshSections called');
                    }}
                    showCreateForm={showCreateMetricForm}
                    setShowCreateForm={setShowCreateMetricForm}
                    showAddModal={showAddMetricModal}
                    setShowAddModal={setShowAddMetricModal}
                    editingMetricId={editingMetricId}
                    setEditingMetricId={setEditingMetricId}
                    isImageBottom={formData.is_image_bottom}
                    imageMetricsHeight={formData.image_metrics_height}
                    textStyleVariant={formData.text_style_variant}
                  />
                ) : null}
                </div>
              )}
            </div>
          </div>

          {/* Information Section */}
          <div className="rounded-xl border border-sky-200 bg-gradient-to-br from-sky-50 to-white p-3 sm:p-4 mb-4 sm:mb-6">
            <p className="text-xs sm:text-sm text-sky-900 font-medium mb-1">
              Design your template section with live preview
            </p>
            <p className="text-xs text-sky-800">
              Configure section layout, styling, and metrics. Use the toolbar to adjust alignment, colors, grid columns, and more. 
              Metrics can be created, edited, or added from your library.
            </p>
          </div>
        </div>

        {/* Fixed Footer with Action Buttons */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-3 sm:px-6 py-3 sm:py-4">
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
              disabled={isSaving}
              loading={isSaving}
              loadingText="Saving..."
              className="bg-sky-600 hover:bg-sky-700"
            >
              {mode === 'create' ? 'Create' : 'Update'}
            </Button>
          </div>
        </div>
      </BaseModal>

      {/* Delete Section Modal */}
      <DeleteSectionModal
        isOpen={showDeleteConfirm}
        sectionTitle={editingSection?.section_title || ''}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  );
}
