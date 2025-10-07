'use client';

import React, { useState, useEffect } from 'react';
import { XMarkIcon, ArrowsPointingOutIcon, ArrowsPointingInIcon } from '@heroicons/react/24/outline';
import { useTemplateHeadingSectionEdit } from '@/context/TemplateHeadingSectionEditContext';
import EditableTextField from '@/components/Shared/EditableFields/EditableTextField';
import EditableTextArea from '@/components/Shared/EditableFields/EditableTextArea';
import EditableImageField from '@/components/Shared/EditableFields/EditableImageField';
import EditableToggle from '@/components/Shared/EditableFields/EditableToggle';
import EditableSelect from '@/components/Shared/EditableFields/EditableSelect';
import ConfirmDialog from '@/components/Shared/ConfirmDialog';
import Button from '@/ui/Button';
import { cn } from '@/lib/utils';

type Tab = 'content' | 'style' | 'advanced';

interface TemplateHeadingFormData {
  name: string;
  name_part_2: string;
  name_part_3: string;
  description_text: string;
  button_text: string;
  url_page: string;
  url: string;
  image: string;
  image_first: boolean;
  is_included_templatesection: boolean;
  style_variant: 'default' | 'clean';
  text_style_variant: 'default' | 'apple';
  is_text_link: boolean;
}

export default function TemplateHeadingSectionEditModal() {
  const { isOpen, editingSection, mode, closeModal, updateSection, deleteSection } = useTemplateHeadingSectionEdit();
  const [activeTab, setActiveTab] = useState<Tab>('content');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formData, setFormData] = useState<TemplateHeadingFormData>({
    name: '',
    name_part_2: '',
    name_part_3: '',
    description_text: '',
    button_text: '',
    url_page: '',
    url: '',
    image: '',
    image_first: false,
    is_included_templatesection: false,
    style_variant: 'default',
    text_style_variant: 'default',
    is_text_link: false,
  });

  // Initialize form data when editing section changes
  useEffect(() => {
    if (editingSection) {
      setFormData({
        name: editingSection.name || '',
        name_part_2: editingSection.name_part_2 || '',
        name_part_3: editingSection.name_part_3 || '',
        description_text: editingSection.description_text || '',
        button_text: editingSection.button_text || '',
        url_page: editingSection.url_page || '',
        url: editingSection.url || '',
        image: editingSection.image || '',
        image_first: editingSection.image_first || false,
        is_included_templatesection: editingSection.is_included_templatesection || false,
        style_variant: editingSection.style_variant || 'default',
        text_style_variant: editingSection.text_style_variant || 'default',
        is_text_link: editingSection.is_text_link || false,
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
    
    try {
      await deleteSection(editingSection.id);
      setShowDeleteConfirm(false);
      // Success toast and modal close handled by context
    } catch (error) {
      console.error('Failed to delete:', error);
      // Error toast is shown by context
    }
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'content', label: 'Content' },
    { id: 'style', label: 'Style' },
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
            {mode === 'create' ? 'Create New Heading Section' : 'Edit Heading Section'}
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
                label="Heading Name (Part 1)"
                value={formData.name}
                onChange={(value) => setFormData({ ...formData, name: value })}
                placeholder="Enter main heading"
                required
                maxLength={100}
                helperText="Primary heading text"
              />

              <EditableTextField
                label="Heading Name (Part 2)"
                value={formData.name_part_2}
                onChange={(value) => setFormData({ ...formData, name_part_2: value })}
                placeholder="Enter second part (optional)"
                maxLength={100}
                helperText="Optional second line or emphasized text"
              />

              <EditableTextField
                label="Heading Name (Part 3)"
                value={formData.name_part_3}
                onChange={(value) => setFormData({ ...formData, name_part_3: value })}
                placeholder="Enter third part (optional)"
                maxLength={100}
                helperText="Optional third line"
              />

              <EditableTextArea
                label="Description Text"
                value={formData.description_text}
                onChange={(value) => setFormData({ ...formData, description_text: value })}
                placeholder="Enter description text (optional)"
                maxLength={500}
                rows={4}
                helperText="Supporting description or subheading"
              />

              <div className="grid grid-cols-2 gap-6">
                <EditableTextField
                  label="Button Text"
                  value={formData.button_text}
                  onChange={(value) => setFormData({ ...formData, button_text: value })}
                  placeholder="Learn More"
                  maxLength={50}
                  helperText="CTA button label"
                />

                <EditableTextField
                  label="Button URL"
                  value={formData.url}
                  onChange={(value) => setFormData({ ...formData, url: value })}
                  placeholder="/contact"
                  helperText="Where the button links to"
                />
              </div>

              <EditableTextField
                label="Page URL Path"
                value={formData.url_page}
                onChange={(value) => setFormData({ ...formData, url_page: value })}
                placeholder="/about"
                helperText="Page where this heading appears"
              />

              <EditableImageField
                label="Hero Image"
                value={formData.image}
                onChange={(value) => setFormData({ ...formData, image: value })}
                helperText="Main image for this heading section"
                aspectRatio="16/9"
              />
            </div>
          )}

          {activeTab === 'style' && (
            <div className="space-y-6 max-w-3xl">
              <EditableSelect
                label="Style Variant"
                value={formData.style_variant}
                onChange={(value) => setFormData({ ...formData, style_variant: value as 'default' | 'clean' })}
                options={[
                  { value: 'default', label: 'Default Style' },
                  { value: 'clean', label: 'Clean/Minimal Style' },
                ]}
                helperText="Overall visual style of the heading section"
              />

              <EditableSelect
                label="Text Style Variant"
                value={formData.text_style_variant}
                onChange={(value) => setFormData({ ...formData, text_style_variant: value as 'default' | 'apple' })}
                options={[
                  { value: 'default', label: 'Default' },
                  { value: 'apple', label: 'Apple Style' },
                ]}
                helperText="Typography and text styling"
              />

              <EditableToggle
                label="Image First"
                value={formData.image_first}
                onChange={(value) => setFormData({ ...formData, image_first: value })}
                description="Display image before text (left side or above)"
              />

              <EditableToggle
                label="Text as Link"
                value={formData.is_text_link}
                onChange={(value) => setFormData({ ...formData, is_text_link: value })}
                description="Make the heading text clickable"
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
                label="Include Template Section"
                value={formData.is_included_templatesection}
                onChange={(value) => setFormData({ ...formData, is_included_templatesection: value })}
                description="Include template section components below this heading"
              />

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Current Configuration</h4>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Mode:</dt>
                    <dd className="font-medium">{mode}</dd>
                  </div>
                  {editingSection?.id && (
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Section ID:</dt>
                      <dd className="font-mono text-xs">{editingSection.id}</dd>
                    </div>
                  )}
                </dl>
              </div>
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
                Delete Heading
              </Button>
            )}

            <Button
              variant="primary"
              onClick={handleSave}
              disabled={isSaving}
              loading={isSaving}
              loadingText="Saving..."
            >
              {mode === 'create' ? 'Create Heading' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Heading Section"
        message="Are you sure you want to delete this heading section? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        type="danger"
      />
    </div>
  );
}
