'use client';

import React, { useState, useEffect } from 'react';
import { 
  XMarkIcon, 
  ArrowsPointingOutIcon, 
  ArrowsPointingInIcon,
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
} from '@heroicons/react/24/outline';
import { useTemplateSectionEdit } from '@/context/TemplateSectionEditContext';
import EditableTextField from '@/components/Shared/EditableFields/EditableTextField';
import EditableTextArea from '@/components/Shared/EditableFields/EditableTextArea';
import EditableToggle from '@/components/Shared/EditableFields/EditableToggle';
import EditableSelect from '@/components/Shared/EditableFields/EditableSelect';
import EditableNumberInput from '@/components/Shared/EditableFields/EditableNumberInput';
import ColorPaletteDropdown, { getColorValue } from '@/components/Shared/ColorPaletteDropdown';
import DeleteSectionModal from './DeleteSectionModal';
import MetricManager from './MetricManager';
import Button from '@/ui/Button';
import { cn } from '@/lib/utils';

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
  text_style_variant: 'default' | 'apple' | 'codedharmony';
  grid_columns: number;
  image_metrics_height: string;
  is_full_width: boolean;
  is_section_title_aligned_center: boolean;
  is_section_title_aligned_right: boolean;
  is_image_bottom: boolean;
  is_slider: boolean;
  is_reviews_section: boolean;
  is_help_center_section: boolean;
  is_real_estate_modal: boolean;
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
  const descriptionTextareaRef = React.useRef<HTMLTextAreaElement>(null);
  const colorButtonRef = React.useRef<HTMLButtonElement>(null);
  const styleButtonRef = React.useRef<HTMLButtonElement>(null);
  const columnButtonRef = React.useRef<HTMLButtonElement>(null);
  const heightButtonRef = React.useRef<HTMLButtonElement>(null);
  const [formData, setFormData] = useState<TemplateSectionFormData>({
    section_title: '',
    section_description: '',
    background_color: 'white',
    text_style_variant: 'default',
    grid_columns: 3,
    image_metrics_height: '300px',
    is_full_width: false,
    is_section_title_aligned_center: false,
    is_section_title_aligned_right: false,
    is_image_bottom: false,
    is_slider: false,
    is_reviews_section: false,
    is_help_center_section: false,
    is_real_estate_modal: false,
    url_page: undefined,
    website_metric: undefined,
  });

  // Initialize form data when editing section changes
  useEffect(() => {
    if (editingSection) {
      setFormData({
        section_title: editingSection.section_title || '',
        section_description: editingSection.section_description || '',
        background_color: editingSection.background_color || 'white',
        text_style_variant: editingSection.text_style_variant || 'default',
        grid_columns: editingSection.grid_columns || 3,
        image_metrics_height: editingSection.image_metrics_height || '300px',
        is_full_width: editingSection.is_full_width || false,
        is_section_title_aligned_center: editingSection.is_section_title_aligned_center || false,
        is_section_title_aligned_right: editingSection.is_section_title_aligned_right || false,
        is_image_bottom: editingSection.is_image_bottom || false,
        is_slider: editingSection.is_slider || false,
        is_reviews_section: editingSection.is_reviews_section || false,
        is_help_center_section: editingSection.is_help_center_section || false,
        is_real_estate_modal: editingSection.is_real_estate_modal || false,
        url_page: editingSection.url_page,
        website_metric: editingSection.website_metric,
      });
    }
  }, [editingSection]);

  // Auto-expand textarea
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData({ ...formData, section_description: e.target.value });
    
    // Auto-expand textarea
    if (descriptionTextareaRef.current) {
      descriptionTextareaRef.current.style.height = 'auto';
      descriptionTextareaRef.current.style.height = descriptionTextareaRef.current.scrollHeight + 'px';
    }
  };

  // Reset textarea height when content changes from outside
  useEffect(() => {
    if (descriptionTextareaRef.current) {
      descriptionTextareaRef.current.style.height = 'auto';
      descriptionTextareaRef.current.style.height = descriptionTextareaRef.current.scrollHeight + 'px';
    }
  }, [formData.section_description]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateSection(formData);
      closeModal();
    } catch (error) {
      console.error('Failed to save:', error);
      // Error toast is shown by context
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editingSection?.id) return;
    
    await deleteSection(editingSection.id);
    setShowDeleteConfirm(false);
    // Success toast and modal close handled by context
  };

  // Close all dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Don't close if clicking inside a dropdown or its button
      // Also check for portaled dropdowns (fixed positioned, rendered at body level)
      if (!target.closest('.dropdown-container') && !target.closest('.fixed.bg-white.rounded-lg.shadow-lg')) {
        setShowColorPicker(false);
        setShowStylePicker(false);
        setShowHeightPicker(false);
        setShowColumnPicker(false);
      }
    };

    if (showColorPicker || showStylePicker || showHeightPicker || showColumnPicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showColorPicker, showStylePicker, showHeightPicker, showColumnPicker]);

  if (!isOpen) return null;

  return (
    <div className={cn(
      'fixed z-50 flex items-center justify-center',
      isFullscreen ? 'inset-0' : 'inset-0'
    )}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={closeModal}
      />
      
      {/* Modal */}
      <div className={cn(
        'relative bg-white shadow-2xl flex flex-col',
        isFullscreen
          ? 'w-full h-full'
          : 'w-full h-full md:rounded-xl md:max-w-5xl md:max-h-[90vh] md:mx-4'
      )}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
          <h2 className="text-2xl font-semibold text-gray-900">
            {mode === 'create' ? 'Create New Section' : 'Edit Section'}
          </h2>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
              title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? (
                <ArrowsPointingInIcon className="w-5 h-5" />
              ) : (
                <ArrowsPointingOutIcon className="w-5 h-5" />
              )}
            </button>
            <button
              onClick={closeModal}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Fixed Toolbar - Horizontally Scrollable */}
        <div className="border-b border-gray-200 shrink-0 relative">
          <div className="overflow-x-auto">
            <div className="flex items-center gap-1 px-6 py-3 min-w-max">
              {/* Reviews Section */}
              <button
              onClick={() => setFormData({ ...formData, is_reviews_section: !formData.is_reviews_section })}
              className={cn(
                'p-2 rounded-lg transition-colors',
                formData.is_reviews_section
                  ? 'bg-sky-100 text-sky-700'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              )}
              title="Reviews section"
            >
              <ChatBubbleBottomCenterTextIcon className="w-5 h-5" />
            </button>

            {/* Help Center Section */}
            <button
              onClick={() => setFormData({ ...formData, is_help_center_section: !formData.is_help_center_section })}
              className={cn(
                'p-2 rounded-lg transition-colors',
                formData.is_help_center_section
                  ? 'bg-sky-100 text-sky-700'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              )}
              title="Help center section"
            >
              <QuestionMarkCircleIcon className="w-5 h-5" />
            </button>

            {/* Real Estate Modal */}
            <button
              onClick={() => setFormData({ ...formData, is_real_estate_modal: !formData.is_real_estate_modal })}
              className={cn(
                'p-2 rounded-lg transition-colors',
                formData.is_real_estate_modal
                  ? 'bg-sky-100 text-sky-700'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              )}
              title="Real estate modal"
            >
              <HomeModernIcon className="w-5 h-5" />
            </button>

            <div className="w-px h-6 bg-gray-300 mx-1" />

            {/* Alignment buttons */}
            <button
              onClick={() => setFormData({
                ...formData,
                is_section_title_aligned_center: false,
                is_section_title_aligned_right: false,
              })}
              className={cn(
                'p-2 rounded-lg transition-colors',
                !formData.is_section_title_aligned_center && !formData.is_section_title_aligned_right
                  ? 'bg-sky-100 text-sky-700'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              )}
              title="Align left"
            >
              <Bars3BottomLeftIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => setFormData({
                ...formData,
                is_section_title_aligned_center: true,
                is_section_title_aligned_right: false,
              })}
              className={cn(
                'p-2 rounded-lg transition-colors',
                formData.is_section_title_aligned_center
                  ? 'bg-sky-100 text-sky-700'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              )}
              title="Align center"
            >
              <Bars3Icon className="w-5 h-5" />
            </button>
            <button
              onClick={() => setFormData({
                ...formData,
                is_section_title_aligned_center: false,
                is_section_title_aligned_right: true,
              })}
              className={cn(
                'p-2 rounded-lg transition-colors',
                formData.is_section_title_aligned_right
                  ? 'bg-sky-100 text-sky-700'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              )}
              title="Align right"
            >
              <Bars3BottomRightIcon className="w-5 h-5" />
            </button>

            <div className="w-px h-6 bg-gray-300 mx-1" />

            {/* Full Width */}
            <button
              onClick={() => setFormData({ ...formData, is_full_width: !formData.is_full_width })}
              className={cn(
                'p-2 rounded-lg transition-colors',
                formData.is_full_width
                  ? 'bg-sky-100 text-sky-700'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              )}
              title="Full width section"
            >
              <ArrowsRightLeftIcon className="w-5 h-5" />
            </button>

            {/* Enable Slider */}
            <button
              onClick={() => setFormData({ ...formData, is_slider: !formData.is_slider })}
              className={cn(
                'p-2 rounded-lg transition-colors',
                formData.is_slider
                  ? 'bg-sky-100 text-sky-700'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              )}
              title="Enable slider"
            >
              <RectangleStackIcon className="w-5 h-5" />
            </button>

            <div className="w-px h-6 bg-gray-300 mx-1" />

            {/* Background Color */}
            <ColorPaletteDropdown
              value={formData.background_color}
              onChange={async (colorClass) => {
                const updatedData = { ...formData, background_color: colorClass };
                setFormData(updatedData);
                try {
                  await updateSection(updatedData);
                  await refetchEditingSection();
                  setShowColorPicker(false);
                } catch (error) {
                  console.error('Failed to update background color:', error);
                }
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

            {/* Text Style */}
            <div className="dropdown-container">
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
                    ? 'bg-sky-100 text-sky-700'
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                )}
                title="Text style"
              >
                <SparklesIcon className="w-5 h-5" />
              </button>
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
            <div className="dropdown-container">
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
                    ? 'bg-sky-100 text-sky-700'
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                )}
                title="Grid columns"
              >
                <ViewColumnsIcon className="w-5 h-5" />
                <span className="text-xs font-medium">{formData.grid_columns}</span>
              </button>
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
              {/* Metric Controls */}
              <div className="flex items-center gap-1">
              {/* Create New Metric */}
              <button
                onClick={() => setShowCreateMetricForm(true)}
                className="p-2 rounded-lg border-2 border-dashed border-gray-300 hover:border-sky-500 hover:bg-sky-50 transition-colors"
                title="Create new metric"
              >
                <PlusIcon className="w-5 h-5 text-gray-400 hover:text-sky-600" />
              </button>

              {/* Add Existing Metric */}
              <button
                onClick={() => setShowAddMetricModal(true)}
                className="p-2 rounded-lg border-2 border-dashed border-gray-300 hover:border-sky-500 hover:bg-sky-50 transition-colors"
                title="Add existing metric"
              >
                <PlusIcon className="w-5 h-5 text-gray-400 hover:text-sky-600" />
              </button>

              {/* Divider */}
              {(formData.website_metric?.length || 0) > 0 && (
                <div className="w-px h-6 bg-gray-300 mx-1 shrink-0" />
              )}

              {/* Existing Metrics as Icons */}
              {(formData.website_metric || []).map((metric, index) => (
                <button
                  key={metric.id}
                  className={cn(
                    'p-2 rounded-lg transition-colors border-2',
                    editingMetricId === metric.id
                      ? 'border-sky-500 bg-sky-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  )}
                  onClick={() => setEditingMetricId(editingMetricId === metric.id ? null : metric.id)}
                  title={metric.title}
                >
                  {metric.image ? (
                    <img src={metric.image} alt={metric.title} className="w-5 h-5 object-cover rounded" />
                  ) : (
                    <div className="w-5 h-5 bg-gray-200 rounded flex items-center justify-center text-[10px] font-medium text-gray-600">
                      {index + 1}
                    </div>
                  )}
                </button>
              ))}
              </div>

              <div className="w-px h-6 bg-gray-300 mx-1" />

              {/* Image Controls */}
              <div className="flex items-center gap-1">
                {/* Image at Bottom */}
                <button
                  onClick={() => setFormData({ ...formData, is_image_bottom: !formData.is_image_bottom })}
                  className={cn(
                    'p-2 rounded-lg transition-colors flex items-center gap-1',
                    formData.is_image_bottom
                  ? 'bg-sky-100 text-sky-700'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              )}
              title="Image at bottom"
            >
              <PhotoIcon className="w-5 h-5" />
            </button>

            {/* Image Height */}
            <div className="dropdown-container">
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
                  'p-2 rounded-lg transition-colors flex items-center gap-1',
                  showHeightPicker
                    ? 'bg-sky-100 text-sky-700'
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                )}
                title="Image height"
              >
                <ArrowsUpDownIcon className="w-5 h-5" />
                <span className="text-xs font-medium">{formData.image_metrics_height}</span>
              </button>
              {showHeightPicker && heightButtonRef.current && (() => {
                const rect = heightButtonRef.current.getBoundingClientRect();
                return (
                  <div 
                    className="fixed bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-[100] w-32"
                    style={{
                      top: `${rect.bottom + 8}px`,
                      left: `${rect.left}px`,
                    }}
                  >
                    {HEIGHT_OPTIONS.map((height) => (
                      <button
                        key={height.value}
                        onClick={(e) => {
                          e.stopPropagation();
                          setFormData({ ...formData, image_metrics_height: height.value });
                          setShowHeightPicker(false);
                        }}
                        className={cn(
                          'w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors',
                          formData.image_metrics_height === height.value && 'bg-sky-50 text-sky-700 font-medium'
                        )}
                      >
                        {height.label}
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
        </div>

        {/* Content */}
        <div 
          className="flex-1 overflow-y-auto p-6 transition-colors"
          style={{
            backgroundColor: getColorValue(formData.background_color || 'white')
          }}
        >
          <div className="space-y-2 max-w-4xl mx-auto">
            {/* Section Title - Styled like actual section */}
            <div>
              <input
                type="text"
                value={formData.section_title}
                onChange={(e) => setFormData({ ...formData, section_title: e.target.value })}
                placeholder="Enter section title..."
                className={cn(
                  'w-full px-0 py-2 border-0 focus:outline-none focus:ring-0 placeholder:text-gray-300 bg-transparent',
                  TEXT_VARIANTS[formData.text_style_variant].sectionTitle,
                  formData.is_section_title_aligned_center && 'text-center',
                  formData.is_section_title_aligned_right && 'text-right'
                )}
              />
            </div>

            {/* Section Description - Styled like actual section */}
            <div>
              <textarea
                ref={descriptionTextareaRef}
                value={formData.section_description}
                onChange={handleDescriptionChange}
                placeholder="Enter section description (optional)..."
                rows={1}
                className={cn(
                  'w-full px-0 py-1 border-0 focus:outline-none focus:ring-0 placeholder:text-gray-300 resize-none bg-transparent overflow-hidden',
                  TEXT_VARIANTS[formData.text_style_variant].sectionDescription,
                  formData.is_section_title_aligned_center && 'text-center',
                  formData.is_section_title_aligned_right && 'text-right'
                )}
              />
            </div>

            {/* Metrics Section */}
            <div className="pt-6 mt-4">
              {editingSection && (
                <MetricManager
                  sectionId={editingSection.id}
                  metrics={formData.website_metric || []}
                  onMetricsChange={async () => {
                    console.log('Modal: onMetricsChange called, refetching section...');
                    // Refresh the current section data to get updated metrics
                    await refetchEditingSection();
                    console.log('Modal: refetchEditingSection completed');
                    // Also refresh the sections list in the background
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
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-gray-200 shrink-0 bg-gray-50">
          <div className="flex items-center gap-3">
            {mode === 'edit' && (
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isSaving}
                className="text-red-600 hover:text-red-700 hover:border-red-600"
              >
                Delete Section
              </Button>
            )}

            <Button
              variant="primary"
              onClick={handleSave}
              disabled={isSaving}
              loading={isSaving}
              loadingText="Saving..."
            >
              {mode === 'create' ? 'Create Section' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Section Modal */}
      <DeleteSectionModal
        isOpen={showDeleteConfirm}
        sectionTitle={editingSection?.section_title || ''}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}
