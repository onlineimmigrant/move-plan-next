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
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { RadioGroup } from '@headlessui/react';
import { useTemplateSectionEdit } from './context';
import ColorPaletteDropdown, { getColorValue } from '@/components/Shared/ColorPaletteDropdown';
import EditableGradientPicker from '@/components/Shared/EditableFields/EditableGradientPicker';
import { getBackgroundStyle } from '@/utils/gradientHelper';
import DeleteSectionModal from './DeleteSectionModal';
import MetricManager from './MetricManager';
import ProfileDataManager from './ProfileDataManager';
import Button from '@/ui/Button';
import { cn } from '@/lib/utils';
import { BaseModal } from '../_shared/BaseModal';

// Tooltip Component - can appear above or below button
const Tooltip = ({ content, position = 'top' }: { content: string; position?: 'top' | 'bottom' }) => {
  if (position === 'bottom') {
    return (
      <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="relative">
          {/* Arrow pointing up */}
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
  }
  
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
    metricTitle: 'text-xl font-semibold text-gray-900',
    metricDescription: 'text-base text-gray-600',
  },
  apple: {
    sectionTitle: 'text-4xl sm:text-5xl font-light text-gray-900',
    sectionDescription: 'text-lg font-light text-gray-600',
    metricTitle: 'text-2xl font-light text-gray-900',
    metricDescription: 'text-base font-light text-gray-600',
  },
  codedharmony: {
    sectionTitle: 'text-3xl sm:text-5xl lg:text-6xl font-thin text-gray-900 tracking-tight leading-none',
    sectionDescription: 'text-lg sm:text-xl text-gray-500 font-light leading-relaxed',
    metricTitle: 'text-3xl sm:text-4xl font-thin text-gray-900 tracking-tight',
    metricDescription: 'text-base sm:text-lg text-gray-600 font-light leading-relaxed',
  },
  magazine: {
    sectionTitle: 'text-4xl sm:text-5xl lg:text-7xl font-bold uppercase tracking-tight leading-none',
    sectionDescription: 'text-sm sm:text-base uppercase tracking-widest font-medium',
    metricTitle: 'text-lg sm:text-xl font-bold uppercase tracking-wide',
    metricDescription: 'text-sm leading-relaxed',
  },
  startup: {
    sectionTitle: 'text-4xl sm:text-6xl lg:text-7xl font-black',
    sectionDescription: 'text-xl sm:text-2xl font-normal leading-relaxed',
    metricTitle: 'text-2xl sm:text-3xl font-bold',
    metricDescription: 'text-lg leading-relaxed',
  },
  elegant: {
    sectionTitle: 'text-3xl sm:text-4xl lg:text-5xl font-serif font-light italic',
    sectionDescription: 'text-base sm:text-lg font-serif leading-loose',
    metricTitle: 'text-xl sm:text-2xl font-serif font-normal',
    metricDescription: 'text-sm sm:text-base font-serif leading-relaxed',
  },
  brutalist: {
    sectionTitle: 'text-5xl sm:text-6xl lg:text-8xl font-black uppercase leading-none tracking-tighter',
    sectionDescription: 'text-xs sm:text-sm uppercase tracking-wider font-bold',
    metricTitle: 'text-2xl sm:text-3xl font-black uppercase tracking-tight',
    metricDescription: 'text-xs sm:text-sm uppercase tracking-wide font-medium',
  },
  modern: {
    sectionTitle: 'text-3xl sm:text-4xl lg:text-6xl font-extrabold tracking-tight',
    sectionDescription: 'text-lg sm:text-xl font-medium',
    metricTitle: 'text-xl sm:text-2xl font-bold',
    metricDescription: 'text-base font-normal',
  },
  playful: {
    sectionTitle: 'text-4xl sm:text-5xl lg:text-6xl font-black tracking-wide',
    sectionDescription: 'text-lg sm:text-xl font-semibold',
    metricTitle: 'text-2xl sm:text-3xl font-extrabold',
    metricDescription: 'text-base font-medium leading-relaxed',
  },
};

// Height options
const HEIGHT_OPTIONS = [
  { value: 'h-32', label: 'Small', size: '128px' },
  { value: 'h-40', label: 'Medium', size: '160px' },
  { value: 'h-48', label: 'Default', size: '192px' },
  { value: 'h-56', label: 'Large', size: '224px' },
  { value: 'h-64', label: 'X-Large', size: '256px' },
  { value: 'h-72', label: 'XX-Large', size: '288px' },
  { value: 'h-80', label: 'Huge', size: '320px' },
  { value: 'h-96', label: 'Maximum', size: '384px' },
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
  {
    value: 'team' as const,
    label: 'Team Members',
    description: 'Display team member profiles',
    icon: UserGroupIcon,
    color: 'teal',
  },
  {
    value: 'testimonials' as const,
    label: 'Testimonials',
    description: 'Customer testimonials and ratings',
    icon: StarIcon,
    color: 'rose',
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
  text_style_variant: 'default' | 'apple' | 'codedharmony' | 'magazine' | 'startup' | 'elegant' | 'brutalist' | 'modern' | 'playful';
  grid_columns: number;
  image_metrics_height: string;
  is_full_width: boolean;
  is_section_title_aligned_center: boolean;
  is_section_title_aligned_right: boolean;
  is_image_bottom: boolean;
  is_slider: boolean;
  
  // New consolidated field
  section_type: 'general' | 'brand' | 'article_slider' | 'contact' | 'faq' | 'reviews' | 'help_center' | 'real_estate' | 'pricing_plans' | 'team' | 'testimonials';
  
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
    image_metrics_height: 'h-48',
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
        image_metrics_height: editingSection.image_metrics_height || 'h-48',
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

          {/* Layout Controls */}
          <div className="py-6 border-b border-gray-200">
            <label className="block text-sm font-semibold text-gray-700 mb-4">
              Layout Controls
            </label>
            <div className="flex flex-wrap items-center gap-2">
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
                <Tooltip content="Align section title to the left" position="bottom" />
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
                <Tooltip content="Align section title to the center" position="bottom" />
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
                <Tooltip content="Align section title to the right" position="bottom" />
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
                <Tooltip content="Make section full width without container constraints" position="bottom" />
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
                  <Tooltip content="Enable horizontal slider/carousel for metrics" position="bottom" />
                </div>
              )}

              <div className="w-px h-6 bg-gray-300 mx-1" />

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
                <Tooltip content={`Grid columns: ${formData.grid_columns} column${formData.grid_columns > 1 ? 's' : ''}`} position="bottom" />
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
            </div>
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

          {/* Text Style Variants */}
          <div className="py-6 border-b border-gray-200">
            <label className="block text-sm font-semibold text-gray-700 mb-4">
              Text Style
            </label>
            <RadioGroup
              value={formData.text_style_variant}
              onChange={(value) => setFormData({ ...formData, text_style_variant: value })}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  { 
                    value: 'default' as const, 
                    label: 'Default', 
                    description: 'Balanced and professional' 
                  },
                  { 
                    value: 'apple' as const, 
                    label: 'Apple', 
                    description: 'Clean, minimal, refined' 
                  },
                  { 
                    value: 'codedharmony' as const, 
                    label: 'Coded Harmony', 
                    description: 'Ultra-thin, spacious, bold' 
                  },
                  { 
                    value: 'magazine' as const, 
                    label: 'Magazine', 
                    description: 'Editorial, uppercase, impact' 
                  },
                  { 
                    value: 'startup' as const, 
                    label: 'Startup', 
                    description: 'Bold gradients, energetic' 
                  },
                  { 
                    value: 'elegant' as const, 
                    label: 'Elegant', 
                    description: 'Serif, italic, sophisticated' 
                  },
                  { 
                    value: 'brutalist' as const, 
                    label: 'Brutalist', 
                    description: 'Massive, raw, powerful' 
                  },
                  { 
                    value: 'modern' as const, 
                    label: 'Modern', 
                    description: 'Strong, contemporary, sharp' 
                  },
                  { 
                    value: 'playful' as const, 
                    label: 'Playful', 
                    description: 'Fun, vibrant, energetic' 
                  },
                ].map((option) => (
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
                          <SparklesIcon
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
                ))}
              </div>
            </RadioGroup>
          </div>

          {/* Metrics Controls */}
          <div className="py-6 border-b border-gray-200">
            <label className="block text-sm font-semibold text-gray-700 mb-4">
              Metrics Controls
            </label>
            <div className="flex flex-wrap items-center gap-2">
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
                <Tooltip content={mode === 'create' ? 'Save the section first to add metrics' : 'Create a new metric for this section'} position="bottom" />
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
                <Tooltip content={mode === 'create' ? 'Save the section first to add metrics' : 'Add an existing metric from library'} position="bottom" />
              </div>

              <div className="w-px h-6 bg-gray-300 mx-1" />

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
                <Tooltip content={formData.is_image_bottom ? "Image at bottom" : "Image at top"} position="bottom" />
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
                <Tooltip content="Set metric image height" position="bottom" />
                {showHeightPicker && heightButtonRef.current && (
                  <div 
                    className="fixed bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-[100] w-48"
                    style={{
                      top: `${heightButtonRef.current.getBoundingClientRect().bottom + 8}px`,
                      left: `${heightButtonRef.current.getBoundingClientRect().left}px`,
                    }}
                  >
                    {HEIGHT_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={(e) => {
                          e.stopPropagation();
                          setFormData({ ...formData, image_metrics_height: option.value });
                          setShowHeightPicker(false);
                        }}
                        className={cn(
                          'w-full px-4 py-2.5 text-left hover:bg-gray-50 transition-colors flex items-center justify-between group/item',
                          formData.image_metrics_height === option.value && 'bg-sky-50'
                        )}
                      >
                        <span className={cn(
                          'text-sm font-medium',
                          formData.image_metrics_height === option.value ? 'text-sky-700' : 'text-gray-900'
                        )}>
                          {option.label}
                        </span>
                        <span className={cn(
                          'text-xs',
                          formData.image_metrics_height === option.value ? 'text-sky-600' : 'text-gray-500'
                        )}>
                          {option.size}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
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

              {/* Team Section - Data Management Info */}
              {formData.section_type === 'team' && (
                <div className="pt-4 sm:pt-6 mt-3 sm:mt-4">
                  <div className="rounded-xl border-2 border-teal-200 bg-teal-50/50 p-4 sm:p-6 text-left">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
                        <UserGroupIcon className="w-5 h-5 sm:w-6 sm:h-6 text-teal-600" />
                      </div>
                      <div className="flex-grow">
                        <h4 className="text-sm sm:text-base font-medium text-teal-900 mb-2">
                          Team Member Data Management
                        </h4>
                        <p className="text-xs sm:text-sm text-teal-700 mb-3">
                          Team members are managed through user profiles. Update the <code className="px-1.5 py-0.5 bg-teal-100 rounded text-teal-800 font-mono text-xs">team</code> JSONB column in the profiles table:
                        </p>
                        <div className="bg-teal-900 text-teal-100 p-3 rounded text-xs font-mono overflow-x-auto">
                          <div>UPDATE profiles SET team = team || &apos;&#123;&apos;</div>
                          <div className="pl-2">&quot;is_team_member&quot;: true,</div>
                          <div className="pl-2">&quot;image&quot;: &quot;https://...&quot;,</div>
                          <div className="pl-2">&quot;job_title&quot;: &quot;Software Engineer&quot;,</div>
                          <div className="pl-2">&quot;pseudonym&quot;: &quot;Display Name&quot;,</div>
                          <div className="pl-2">&quot;department&quot;: &quot;Engineering&quot;,</div>
                          <div className="pl-2">&quot;description&quot;: &quot;Bio text...&quot;,</div>
                          <div className="pl-2">&quot;experience_years&quot;: 5,</div>
                          <div className="pl-2">&quot;skills&quot;: [&quot;React&quot;, &quot;Node.js&quot;],</div>
                          <div className="pl-2">&quot;linkedin_url&quot;: &quot;https://...&quot;,</div>
                          <div className="pl-2">&quot;twitter_url&quot;: &quot;https://...&quot;,</div>
                          <div className="pl-2">&quot;github_url&quot;: &quot;https://...&quot;,</div>
                          <div className="pl-2">&quot;portfolio_url&quot;: &quot;https://...&quot;,</div>
                          <div className="pl-2">&quot;is_featured&quot;: true,</div>
                          <div className="pl-2">&quot;display_order&quot;: 1,</div>
                          <div className="pl-2">&quot;assigned_sections&quot;: [
                            {mode === 'edit' && editingSection?.id ? editingSection.id : 'SECTION_ID'}
                          ]</div>
                          <div>&apos;&#125;&apos;::jsonb WHERE id = &apos;USER_ID&apos;;</div>
                        </div>
                        <p className="text-xs text-teal-700 mt-2">
                          <strong>Available fields:</strong> image, job_title, pseudonym, department, description, experience_years, skills[], linkedin_url, twitter_url, github_url, portfolio_url, is_featured, display_order, assigned_sections[]
                        </p>
                        <p className="text-xs text-teal-700 mt-1">
                          Leave <code className="px-1 py-0.5 bg-teal-100 rounded text-teal-800 font-mono text-[10px]">assigned_sections</code> empty to show in all team sections.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Team Member Management Form */}
                  {mode === 'edit' && editingSection && (
                    <div className="mt-6 pt-6 border-t border-teal-200">
                      <ProfileDataManager 
                        sectionId={editingSection.id} 
                        type="team" 
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Testimonials Section - Data Management Info */}
              {formData.section_type === 'testimonials' && (
                <div className="pt-4 sm:pt-6 mt-3 sm:mt-4">
                  <div className="rounded-xl border-2 border-rose-200 bg-rose-50/50 p-4 sm:p-6 text-left">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
                        <StarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-rose-600" />
                      </div>
                      <div className="flex-grow">
                        <h4 className="text-sm sm:text-base font-medium text-rose-900 mb-2">
                          Testimonial Data Management
                        </h4>
                        <p className="text-xs sm:text-sm text-rose-700 mb-3">
                          Testimonials are managed through user profiles. Update the <code className="px-1.5 py-0.5 bg-rose-100 rounded text-rose-800 font-mono text-xs">customer</code> JSONB column in the profiles table:
                        </p>
                        <div className="bg-rose-900 text-rose-100 p-3 rounded text-xs font-mono overflow-x-auto">
                          <div>UPDATE profiles SET customer = customer || &apos;&#123;&apos;</div>
                          <div className="pl-2">&quot;is_customer&quot;: true,</div>
                          <div className="pl-2">&quot;image&quot;: &quot;https://...&quot;,</div>
                          <div className="pl-2">&quot;testimonial_text&quot;: &quot;Great service!&quot;,</div>
                          <div className="pl-2">&quot;rating&quot;: 5,</div>
                          <div className="pl-2">&quot;pseudonym&quot;: &quot;Display Name&quot;,</div>
                          <div className="pl-2">&quot;company&quot;: &quot;Tech Corp&quot;,</div>
                          <div className="pl-2">&quot;company_logo&quot;: &quot;https://...&quot;,</div>
                          <div className="pl-2">&quot;job_title&quot;: &quot;CTO&quot;,</div>
                          <div className="pl-2">&quot;project_type&quot;: &quot;Web Development&quot;,</div>
                          <div className="pl-2">&quot;description&quot;: &quot;Additional context...&quot;,</div>
                          <div className="pl-2">&quot;testimonial_date&quot;: &quot;2024-11-01&quot;,</div>
                          <div className="pl-2">&quot;linkedin_url&quot;: &quot;https://...&quot;,</div>
                          <div className="pl-2">&quot;is_featured&quot;: true,</div>
                          <div className="pl-2">&quot;display_order&quot;: 1,</div>
                          <div className="pl-2">&quot;assigned_sections&quot;: [
                            {mode === 'edit' && editingSection?.id ? editingSection.id : 'SECTION_ID'}
                          ]</div>
                          <div>&apos;&#125;&apos;::jsonb WHERE id = &apos;USER_ID&apos;;</div>
                        </div>
                        <p className="text-xs text-rose-700 mt-2">
                          <strong>Available fields:</strong> image, testimonial_text, rating (1-5), pseudonym, company, company_logo, job_title, project_type, description, testimonial_date, linkedin_url, is_featured, display_order, assigned_sections[]
                        </p>
                        <p className="text-xs text-rose-700 mt-1">
                          Leave <code className="px-1 py-0.5 bg-rose-100 rounded text-rose-800 font-mono text-[10px]">assigned_sections</code> empty to show in all testimonial sections.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Testimonial Management Form */}
                  {mode === 'edit' && editingSection && (
                    <div className="mt-6 pt-6 border-t border-rose-200">
                      <ProfileDataManager 
                        sectionId={editingSection.id} 
                        type="testimonials" 
                      />
                    </div>
                  )}
                </div>
              )}

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
