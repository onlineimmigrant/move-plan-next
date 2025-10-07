'use client';

import React, { useState, useEffect } from 'react';
import { XMarkIcon, ArrowsPointingOutIcon, ArrowsPointingInIcon } from '@heroicons/react/24/outline';
import { useTemplateSectionEdit } from '@/context/TemplateSectionEditContext';
import EditableTextField from '@/components/Shared/EditableFields/EditableTextField';
import EditableTextArea from '@/components/Shared/EditableFields/EditableTextArea';
import EditableToggle from '@/components/Shared/EditableFields/EditableToggle';
import EditableSelect from '@/components/Shared/EditableFields/EditableSelect';
import EditableNumberInput from '@/components/Shared/EditableFields/EditableNumberInput';
import EditableColorPicker from '@/components/Shared/EditableFields/EditableColorPicker';
import DeleteSectionModal from './DeleteSectionModal';
import MetricManager from './MetricManager';
import Button from '@/ui/Button';
import { cn } from '@/lib/utils';

type Tab = 'content' | 'style' | 'layout' | 'advanced';

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
  const [activeTab, setActiveTab] = useState<Tab>('content');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formData, setFormData] = useState<TemplateSectionFormData>({
    section_title: '',
    section_description: '',
    background_color: '#FFFFFF',
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
        background_color: editingSection.background_color || '#FFFFFF',
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

  const tabs: { id: Tab; label: string }[] = [
    { id: 'content', label: 'Content' },
    { id: 'style', label: 'Style' },
    { id: 'layout', label: 'Layout' },
    { id: 'advanced', label: 'Advanced' },
  ];

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
        'relative bg-white shadow-2xl overflow-hidden flex flex-col',
        isFullscreen
          ? 'w-full h-full'
          : 'rounded-xl w-full max-w-5xl max-h-[90vh] mx-4'
      )}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
          <h2 className="text-2xl font-semibold text-gray-900">
            {mode === 'create' ? 'Create New Template Section' : 'Edit Template Section'}
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

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-6 shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                activeTab === tab.id
                  ? 'border-sky-500 text-sky-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'content' && (
            <div className="space-y-6 max-w-3xl">
              <EditableTextField
                label="Section Title"
                value={formData.section_title}
                onChange={(value) => setFormData({ ...formData, section_title: value })}
                placeholder="Enter section title"
                required
                maxLength={100}
                helperText="Main heading for this section"
              />

              <EditableTextArea
                label="Section Description"
                value={formData.section_description}
                onChange={(value) => setFormData({ ...formData, section_description: value })}
                placeholder="Enter section description (optional)"
                maxLength={500}
                rows={3}
                helperText="Optional description text shown below the title"
              />

              <div className="border-t border-gray-200 pt-6">
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
                  />
                )}
              </div>
            </div>
          )}

          {activeTab === 'style' && (
            <div className="space-y-6 max-w-3xl">
              <EditableColorPicker
                label="Background Color"
                value={formData.background_color}
                onChange={(value) => setFormData({ ...formData, background_color: value })}
                helperText="Background color for this section"
              />

              <EditableSelect
                label="Text Style Variant"
                value={formData.text_style_variant}
                onChange={(value) => setFormData({ ...formData, text_style_variant: value as 'default' | 'apple' | 'codedharmony' })}
                options={[
                  { value: 'default', label: 'Default' },
                  { value: 'apple', label: 'Apple Style' },
                  { value: 'codedharmony', label: 'Coded Harmony' },
                ]}
                helperText="Choose the visual style for text in this section"
              />

              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-900">Title Alignment</h3>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="alignment"
                      checked={!formData.is_section_title_aligned_center && !formData.is_section_title_aligned_right}
                      onChange={() => setFormData({
                        ...formData,
                        is_section_title_aligned_center: false,
                        is_section_title_aligned_right: false,
                      })}
                      className="w-4 h-4 text-sky-600 focus:ring-sky-500"
                    />
                    <span className="text-sm text-gray-700">Left</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="alignment"
                      checked={formData.is_section_title_aligned_center}
                      onChange={() => setFormData({
                        ...formData,
                        is_section_title_aligned_center: true,
                        is_section_title_aligned_right: false,
                      })}
                      className="w-4 h-4 text-sky-600 focus:ring-sky-500"
                    />
                    <span className="text-sm text-gray-700">Center</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="alignment"
                      checked={formData.is_section_title_aligned_right}
                      onChange={() => setFormData({
                        ...formData,
                        is_section_title_aligned_center: false,
                        is_section_title_aligned_right: true,
                      })}
                      className="w-4 h-4 text-sky-600 focus:ring-sky-500"
                    />
                    <span className="text-sm text-gray-700">Right</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'layout' && (
            <div className="space-y-6 max-w-3xl">
              <EditableToggle
                label="Full Width Section"
                value={formData.is_full_width}
                onChange={(value) => setFormData({ ...formData, is_full_width: value })}
                description="Make this section span the full width of the page"
              />

              <EditableNumberInput
                label="Grid Columns"
                value={formData.grid_columns}
                onChange={(value) => setFormData({ ...formData, grid_columns: value })}
                min={1}
                max={6}
                helperText="Number of columns in the grid layout (1-6)"
              />

              <EditableTextField
                label="Image/Metric Height"
                value={formData.image_metrics_height}
                onChange={(value) => setFormData({ ...formData, image_metrics_height: value })}
                placeholder="300px"
                helperText="CSS height value (e.g., 300px, 20rem)"
              />

              <EditableToggle
                label="Image at Bottom"
                value={formData.is_image_bottom}
                onChange={(value) => setFormData({ ...formData, is_image_bottom: value })}
                description="Display images below the content instead of above"
              />

              <EditableToggle
                label="Enable Slider"
                value={formData.is_slider}
                onChange={(value) => setFormData({ ...formData, is_slider: value })}
                description="Convert grid to a slider/carousel"
              />
            </div>
          )}

          {activeTab === 'advanced' && (
            <div className="space-y-6 max-w-3xl">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-yellow-800">
                  ⚠️ Advanced settings - only modify if you know what you're doing
                </p>
              </div>

              <EditableToggle
                label="Reviews Section"
                value={formData.is_reviews_section}
                onChange={(value) => setFormData({ ...formData, is_reviews_section: value })}
                description="Enable special reviews/testimonials section behavior"
              />

              <EditableToggle
                label="Help Center Section"
                value={formData.is_help_center_section}
                onChange={(value) => setFormData({ ...formData, is_help_center_section: value })}
                description="Enable help center/FAQ section behavior"
              />

              <EditableToggle
                label="Real Estate Modal"
                value={formData.is_real_estate_modal}
                onChange={(value) => setFormData({ ...formData, is_real_estate_modal: value })}
                description="Enable real estate property modal"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 shrink-0 bg-gray-50">
          <Button
            variant="outline"
            onClick={closeModal}
            disabled={isSaving}
          >
            Cancel
          </Button>

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
