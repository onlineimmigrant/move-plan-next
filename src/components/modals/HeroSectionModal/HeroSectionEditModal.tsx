/**
 * HeroSectionEditModal (Refactored)
 * 
 * Clean, modular version using extracted components, hooks, and sections
 */

'use client';

import React, { useRef, useState } from 'react';
import { PaintBrushIcon } from '@heroicons/react/24/outline';
import { StandardModalContainer } from '../_shared/containers/StandardModalContainer';
import { StandardModalHeader } from '../_shared/layout/StandardModalHeader';
import { StandardModalBody } from '../_shared/layout/StandardModalBody';
import { StandardModalFooter } from '../_shared/layout/StandardModalFooter';
import ImageGalleryModal from '@/components/modals/ImageGalleryModal';
import { HeroFormData } from './types';
import { useHeroSectionEdit } from './context';

// Import all hooks
import {
  useHeroForm,
  useColorPickers,
  useDropdowns,
  useImageGallery,
  useHeroSave,
  useHeroDelete,
} from './hooks';

// Import all section components
import {
  TitleStyleSection,
  DescriptionStyleSection,
  ButtonStyleSection,
  ImageStyleSection,
  BackgroundStyleSection,
  AnimationSection,
} from './sections';

// Import preview component
import { HeroPreview } from './preview';

export default function HeroSectionEditModal() {
  // Get modal state from context
  const { isOpen, editingSection, mode, closeModal, updateSection, deleteSection } = useHeroSectionEdit();
  // Form state and computed styles
  const { formData, updateField, setFormData, computedStyles } = useHeroForm(editingSection);

  // UI helpers: refs to sections so header-panel buttons can open/scroll to them
  const titleSectionRef = useRef<HTMLDivElement | null>(null);
  const descriptionSectionRef = useRef<HTMLDivElement | null>(null);
  const imageSectionRef = useRef<HTMLDivElement | null>(null);
  const backgroundSectionRef = useRef<HTMLDivElement | null>(null);
  const animationSectionRef = useRef<HTMLDivElement | null>(null);
  const [activePanel, setActivePanel] = useState<string | null>(null);

  // Color picker states
  const {
    openColorPickers,
    toggleColorPicker,
    closeAllColorPickers,
  } = useColorPickers();

  // Dropdown states
  const {
    openDropdowns,
    toggleDropdown,
    closeAllDropdowns,
  } = useDropdowns();

  // Image gallery state
  const {
    isImageGalleryOpen,
    openImageGallery,
    closeImageGallery,
    handleImageSelect,
  } = useImageGallery();

  // Save functionality
  const {
    isSaving,
    saveError,
    hasTriedSave,
    handleSave,
    setSaveError,
  } = useHeroSave(updateSection, closeModal);

  // Delete functionality
  const {
    showDeleteConfirm,
    openDeleteConfirm,
    cancelDelete,
    handleDelete,
  } = useHeroDelete(deleteSection, closeModal, (saving: boolean) => {
    // Note: useHeroSave manages isSaving, but delete needs to set it too
    // This is a limitation of the current hook design - in production, we'd unify this
  });

  if (!isOpen) return null;

  // Prepare props for sections
  const titleSectionProps = {
    formData,
    setFormData,
    openColorPickers: {
      titleColor: openColorPickers.titleColor,
      titleGradientFrom: openColorPickers.titleGradientFrom,
      titleGradientVia: openColorPickers.titleGradientVia,
      titleGradientTo: openColorPickers.titleGradientTo,
    },
    toggleColorPicker,
  };

  const descriptionSectionProps = {
    formData,
    setFormData,
    openColorPickers: {
      descriptionColor: openColorPickers.descriptionColor,
    },
    toggleColorPicker,
  };

  const buttonSectionProps = {
    formData,
    setFormData,
    openColorPickers: {
      buttonColor: openColorPickers.buttonColor,
      buttonGradientFrom: openColorPickers.buttonGradientFrom,
      buttonGradientVia: openColorPickers.buttonGradientVia,
      buttonGradientTo: openColorPickers.buttonGradientTo,
    },
    toggleColorPicker,
  };

  const imageSectionProps = {
    formData,
    setFormData,
    openImageGallery,
  };

  const backgroundSectionProps = {
    formData,
    setFormData,
    openColorPickers: {
      backgroundColor: openColorPickers.backgroundColor,
      backgroundGradientFrom: openColorPickers.backgroundGradientFrom,
      backgroundGradientVia: openColorPickers.backgroundGradientVia,
      backgroundGradientTo: openColorPickers.backgroundGradientTo,
    },
    toggleColorPicker,
  };

  const animationSectionProps = {
    formData,
    setFormData,
  };

  if (!isOpen) return null;

  return (
    <>
      <StandardModalContainer
        isOpen={isOpen}
        onClose={closeModal}
        size="xlarge"
        className="max-w-7xl"
      >
        <StandardModalHeader
          title={mode === 'create' ? 'Create Hero Section' : 'Edit Hero Section'}
          icon={PaintBrushIcon}
          onClose={closeModal}
        />

        {/* Quick action panel under header - styled like meetings filter buttons */}
        <div className="px-6 pb-4">
          <div className="flex items-center justify-between">
            <nav className="flex gap-2 overflow-x-auto scrollbar-hide w-full" aria-label="Hero quick actions" style={{ WebkitOverflowScrolling: 'touch' }}>
              {[
                { id: 'layout', label: 'Layout' },
                { id: 'title', label: 'Title' },
                { id: 'description', label: 'Description' },
                { id: 'background', label: 'Background' },
              ].map((b) => (
                <button
                  key={b.id}
                  onClick={() => {
                    setActivePanel(activePanel === b.id ? null : b.id);
                    // scroll to corresponding section
                    const map: Record<string, HTMLDivElement | null> = {
                      layout: backgroundSectionRef.current, // layout settings live in background/layout area
                      title: titleSectionRef.current,
                      description: descriptionSectionRef.current,
                      background: backgroundSectionRef.current,
                    };
                    const target = map[b.id];
                    if (target) {
                      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all duration-300 shadow-sm flex-shrink-0"
                  style={
                    activePanel === b.id
                      ? {
                          background: `linear-gradient(135deg, #0ea5e9, #06b6d4)`,
                          color: 'white',
                          boxShadow: `0 6px 18px rgba(6, 182, 212, 0.18)`,
                        }
                      : {
                          backgroundColor: 'transparent',
                          color: '#0f172a',
                          borderWidth: '1px',
                          borderStyle: 'solid',
                          borderColor: 'rgba(15,23,42,0.06)',
                        }
                  }
                >
                  <span>{b.label}</span>
                </button>
              ))}

              {/* Image button */}
              <button
                onClick={() => {
                  openImageGallery();
                  setActivePanel('image');
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all duration-300 shadow-sm flex-shrink-0"
                style={{ backgroundColor: 'transparent', color: '#0f172a', borderWidth: '1px', borderStyle: 'solid', borderColor: 'rgba(15,23,42,0.06)' }}
                aria-label="Open image gallery"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M15 11l-2-2-4 4-3-3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>Image</span>
              </button>
            </nav>
          </div>
        </div>

        <StandardModalBody className="p-0">
          <div className="p-6 space-y-6">
            {/* Full-width Live Preview */}
            <div className="w-full">
              <HeroPreview formData={formData} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column: Form Sections */}
              <div className="space-y-6 overflow-y-auto max-h-[calc(70vh-12rem)] pr-2">
              {/* Information Banner */}
              <div className="rounded-xl border border-sky-200 bg-gradient-to-br from-sky-50 to-white p-4">
                <p className="text-sm text-sky-900 font-medium mb-1">
                  Design your hero section with live preview
                </p>
                <p className="text-xs text-sky-800">
                  Customize title, description, buttons, colors, and layout. All changes are reflected in real-time.
                </p>
              </div>

              {/* Title Section */}
              <div ref={titleSectionRef} className="bg-white rounded-lg border border-gray-200 p-4">
                <TitleStyleSection {...titleSectionProps} />
              </div>

              {/* Description Section */}
              <div ref={descriptionSectionRef} className="bg-white rounded-lg border border-gray-200 p-4">
                <DescriptionStyleSection {...descriptionSectionProps} />
              </div>

              {/* Button Section */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <ButtonStyleSection {...buttonSectionProps} />
              </div>

              {/* Image Section */}
              <div ref={imageSectionRef} className="bg-white rounded-lg border border-gray-200 p-4">
                <ImageStyleSection {...imageSectionProps} />
              </div>

              {/* Background Section */}
              <div ref={backgroundSectionRef} className="bg-white rounded-lg border border-gray-200 p-4">
                <BackgroundStyleSection {...backgroundSectionProps} />
              </div>

              {/* Animation Section */}
              <div ref={animationSectionRef} className="bg-white rounded-lg border border-gray-200 p-4">
                <AnimationSection {...animationSectionProps} />
              </div>
            </div>
            </div>
          </div>
        </StandardModalBody>

        <StandardModalFooter
          primaryAction={{
            label: mode === 'create' ? 'Create Hero Section' : 'Save Changes',
            onClick: () => handleSave(formData),
            variant: 'primary',
            loading: isSaving,
            disabled: !formData.title.trim(),
          }}
          secondaryAction={{
            label: 'Cancel',
            onClick: closeModal,
            variant: 'secondary',
          }}
          tertiaryActions={mode === 'edit' ? [{
            label: 'Delete',
            onClick: openDeleteConfirm,
            variant: 'danger',
          }] : []}
        >
          {saveError && (
            <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {saveError}
            </div>
          )}
        </StandardModalFooter>
      </StandardModalContainer>

      {/* Image Gallery Modal */}
      {isImageGalleryOpen && (
        <ImageGalleryModal
          isOpen={isImageGalleryOpen}
          onClose={closeImageGallery}
          onSelectImage={(url) => handleImageSelect(url, (imageUrl) => {
            setFormData({ ...formData, image: imageUrl });
          })}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={cancelDelete} />
          <div className="relative bg-white rounded-xl shadow-2xl p-6 max-w-md mx-4">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Delete Hero Section</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this hero section? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
