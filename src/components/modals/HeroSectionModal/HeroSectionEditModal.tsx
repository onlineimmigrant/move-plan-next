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
import { useThemeColors } from '@/hooks/useThemeColors';
import Button from '@/ui/Button';
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
  TranslationsSection,
} from './sections';

// Import preview component
import { HeroPreview } from './preview';

export default function HeroSectionEditModal() {
  // Get modal state from context
  const { isOpen, editingSection, mode, closeModal, updateSection, deleteSection } = useHeroSectionEdit();
  // Form state and computed styles
  const { formData, updateField, setFormData, computedStyles } = useHeroForm(editingSection);

  // Theme colors
  const themeColors = useThemeColors();
  const primary = themeColors.cssVars.primary;

  // UI helpers: dropdown menus (only one open at a time) and hover state
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  const [previewRefreshing, setPreviewRefreshing] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  
  // Inline editing state
  const [inlineEdit, setInlineEdit] = useState<{
    field: 'title' | 'description' | null;
    value: string;
    position: { x: number; y: number };
  }>({ field: null, value: '', position: { x: 0, y: 0 } });

  // Calculate safe positioning for inline edit popover
  const getSafePopoverPosition = (x: number, y: number) => {
    const popoverWidth = 500;
    const popoverHeight = 300;
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 768;
    const padding = 16;
    
    let safeX = x;
    let safeY = y;
    
    if (safeX + popoverWidth > viewportWidth - padding) {
      safeX = Math.max(padding, viewportWidth - popoverWidth - padding);
    }
    if (safeX < padding) {
      safeX = padding;
    }
    
    if (safeY + popoverHeight > viewportHeight - padding) {
      safeY = Math.max(padding, viewportHeight - popoverHeight - padding);
    }
    if (safeY < padding) {
      safeY = padding;
    }
    
    return { x: safeX, y: safeY };
  };

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

  // Keyboard shortcuts
  React.useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + S to save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (formData.title.trim()) {
          handleSave(formData);
        }
      }
      // Escape to close mega menu or inline edit
      if (e.key === 'Escape') {
        if (inlineEdit.field) {
          e.stopPropagation();
          setInlineEdit({ field: null, value: '', position: { x: 0, y: 0 } });
        } else if (openMenu) {
          e.stopPropagation();
          setOpenMenu(null);
        }
      }
      // Enter to save inline edit
      if (e.key === 'Enter' && inlineEdit.field && !e.shiftKey) {
        e.preventDefault();
        handleInlineEditSave();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, openMenu, formData, handleSave, inlineEdit]);

  // Reset delete confirmation text when modal closes
  React.useEffect(() => {
    if (!showDeleteConfirm) {
      setDeleteConfirmText('');
    }
  }, [showDeleteConfirm]);

  // Trigger preview refresh animation when formData changes
  React.useEffect(() => {
    if (isOpen) {
      setPreviewRefreshing(true);
      const timer = setTimeout(() => setPreviewRefreshing(false), 300);
      return () => clearTimeout(timer);
    }
  }, [formData.title, formData.description, formData.button, formData.image, formData.background_style, formData.title_style, formData.button_style, isOpen]);

  // Inline editing handlers
  const handleInlineEditOpen = (field: 'title' | 'description', event: React.MouseEvent) => {
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    setInlineEdit({
      field,
      value: formData[field],
      position: { x: rect.left, y: rect.bottom + 10 }
    });
  };

  const handleInlineEditSave = () => {
    if (inlineEdit.field && inlineEdit.value.trim()) {
      setFormData({ ...formData, [inlineEdit.field]: inlineEdit.value });
    }
    setInlineEdit({ field: null, value: '', position: { x: 0, y: 0 } });
  };

  const handleInlineEditCancel = () => {
    setInlineEdit({ field: null, value: '', position: { x: 0, y: 0 } });
  };

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
    primaryColor: primary.base,
  };

  const descriptionSectionProps = {
    formData,
    setFormData,
    openColorPickers: {
      descriptionColor: openColorPickers.descriptionColor,
    },
    toggleColorPicker,
    primaryColor: primary.base,
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
    primaryColor: primary.base,
  };

  const imageSectionProps = {
    formData,
    setFormData,
    openImageGallery,
    primaryColor: primary.base,
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
    primaryColor: primary.base,
  };

  const animationSectionProps = {
    formData,
    setFormData,
    primaryColor: primary.base,
  };

  const translationsSectionProps = {
    formData,
    setFormData,
    primaryColor: primary.base,
  };

  if (!isOpen) return null;

  return (
    <>
      <StandardModalContainer
        isOpen={isOpen}
        onClose={closeModal}
        size="large"
        className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-2xl"
      >
        <StandardModalHeader
          title={mode === 'create' ? 'Create Hero Section' : 'Edit Hero Section'}
          icon={PaintBrushIcon}
          onClose={closeModal}
          className="bg-white/30 dark:bg-gray-800/30 rounded-t-2xl"
        />

        {/* Quick action panel - transparent, no borders, left-aligned, mega menu dropdowns */}
        <div className="px-6 py-3 flex items-center border-b border-white/10 dark:border-gray-700/20 bg-white/30 dark:bg-gray-800/30 relative z-30" id="hero-menu-panel">
          <div className="flex gap-2">
            {[
              { 
                id: 'content', 
                label: 'Content', 
                sections: [
                  { id: 'title', label: 'Title', component: 'title' },
                  { id: 'description', label: 'Description', component: 'description' }
                ]
              },
              { 
                id: 'background', 
                label: 'Background', 
                sections: [
                  { id: 'button', label: 'Button', component: 'button' },
                  { id: 'background', label: 'Background', component: 'background' },
                  { id: 'image', label: 'Image', component: 'image' },
                  { id: 'animation', label: 'Animation', component: 'animation' }
                ]
              },
              { 
                id: 'translations', 
                label: 'Translations', 
                sections: [
                  { id: 'translations', label: 'Translations', component: 'translations' }
                ]
              },
            ].map((menu) => (
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

        {/* Mega Menu Dropdown - Below panel, full height */}
        {openMenu && (
          <>
            {/* Backdrop for closing menu */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setOpenMenu(null)}
              aria-label="Close menu"
            />
            
            {/* Mega Menu Panel - Starts exactly at panel bottom border */}
            <div className="absolute left-0 right-0 bottom-0 bg-white dark:bg-gray-800 shadow-2xl z-50 overflow-y-auto rounded-b-2xl" style={{ top: '138px' }}>
              <div className={`max-w-7xl mx-auto py-6 h-full ${openMenu === 'translations' ? 'px-2' : 'px-6'}`}>
                {[
                  { 
                    id: 'content', 
                    label: 'Content', 
                    sections: [
                      { id: 'title', label: 'Title', component: 'title' },
                      { id: 'description', label: 'Description', component: 'description' }
                    ]
                  },
                  { 
                    id: 'background', 
                    label: 'Background', 
                    sections: [
                      { id: 'button', label: 'Button', component: 'button' },
                      { id: 'background', label: 'Background', component: 'background' },
                      { id: 'image', label: 'Image', component: 'image' },
                      { id: 'animation', label: 'Animation', component: 'animation' }
                    ]
                  },
                  { 
                    id: 'translations', 
                    label: 'Translations', 
                    sections: [
                      { id: 'translations', label: 'Manage Translations', component: 'translations' }
                    ]
                  },
                ].filter(menu => menu.id === openMenu).map((menu) => (
                  <div key={menu.id}>
                    {/* Close hint */}
                    <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-100 dark:border-gray-700 px-6">
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Settings</h2>
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
                    
                    {/* Special handling for Translations - full width, no grid */}
                    {menu.id === 'translations' ? (
                      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg px-2 py-6">
                        <TranslationsSection {...translationsSectionProps} />
                      </div>
                    ) : (
                      <div className={`grid gap-6 ${menu.sections.length === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'}`}>
                        {menu.sections.map((section) => (
                          <div key={section.id} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
                              {section.label}
                            </h3>
                            <div className="space-y-3">
                              {section.component === 'title' && <TitleStyleSection {...titleSectionProps} />}
                              {section.component === 'description' && <DescriptionStyleSection {...descriptionSectionProps} />}
                              {section.component === 'button' && <ButtonStyleSection {...buttonSectionProps} />}
                              {section.component === 'image' && <ImageStyleSection {...imageSectionProps} />}
                              {section.component === 'background' && <BackgroundStyleSection {...backgroundSectionProps} />}
                              {section.component === 'animation' && <AnimationSection {...animationSectionProps} />}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        <StandardModalBody className="p-0 bg-white/20 dark:bg-gray-900/20" noPadding>
          {/* Preview refresh indicator */}
          {previewRefreshing && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg border"
              style={{ borderColor: `${primary.base}40` }}
            >
              <div className="w-3 h-3 border-2 border-t-transparent rounded-full animate-spin"
                style={{ borderColor: `${primary.base} transparent transparent transparent` }}
              ></div>
              <span className="text-xs font-medium text-gray-700">Updating preview...</span>
            </div>
          )}
          
          {/* Full-width Live Preview - exact Hero mirror, no space */}
          <div className={`transition-opacity duration-300 ${previewRefreshing ? 'opacity-50' : 'opacity-100'}`}>
            <HeroPreview 
              formData={formData} 
              onDoubleClickTitle={(e: React.MouseEvent) => handleInlineEditOpen('title', e)} 
              onDoubleClickDescription={(e: React.MouseEvent) => handleInlineEditOpen('description', e)} 
            />
          </div>
        </StandardModalBody>

        <StandardModalFooter
          className="bg-white/30 dark:bg-gray-800/30 rounded-b-2xl"
        >
          {saveError && (
            <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {saveError}
            </div>
          )}
          
          <div className="flex items-center justify-between w-full gap-3">
            {/* Left side - Delete button for edit mode only */}
            {mode === 'edit' ? (
              <Button
                variant="danger"
                onClick={openDeleteConfirm}
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
                onClick={() => handleSave(formData)}
                loading={isSaving}
                disabled={!formData.title.trim()}
                className="px-6 py-2"
                title="Ctrl/Cmd + S to save"
              >
                {mode === 'create' ? 'Create' : 'Save'}
              </Button>
            </div>
          </div>
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
        <div className="fixed inset-0 z-[10002] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={cancelDelete} />
          <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-md border border-gray-200 dark:border-gray-700">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Delete Hero Section</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Are you sure you want to delete this hero section? This action cannot be undone and will permanently remove all content and styling.
                </p>
                
                {/* Safety input - require typing "delete" */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Type <span className="font-mono font-semibold text-red-600 dark:text-red-400">delete</span> to confirm:
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="delete"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:text-white"
                    autoFocus
                  />
                </div>
                
                <div className="flex items-center justify-end gap-3">
                  <Button
                    variant="secondary"
                    onClick={cancelDelete}
                    className="px-4 py-2"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="danger"
                    onClick={handleDelete}
                    disabled={deleteConfirmText.toLowerCase() !== 'delete'}
                    className="px-4 py-2"
                  >
                    Delete Permanently
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Inline Edit Popover */}
      {inlineEdit.field && (() => {
        const safePosition = getSafePopoverPosition(inlineEdit.position.x, inlineEdit.position.y);
        return (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-[10003]" 
              onClick={handleInlineEditCancel}
            />
            
            {/* Popover */}
            <div 
              className="fixed z-[10004] bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 p-4 w-[500px] max-w-[90vw]"
              style={{ 
                left: `${safePosition.x}px`, 
                top: `${safePosition.y}px` 
              }}
            >
            <div className="mb-3">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-gray-900 dark:text-white capitalize">
                  Edit {inlineEdit.field}
                </label>
                <button
                  onClick={handleInlineEditCancel}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {inlineEdit.field === 'title' ? (
                <input
                  type="text"
                  value={inlineEdit.value}
                  onChange={(e) => setInlineEdit({ ...inlineEdit, value: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white text-lg font-semibold focus:outline-none focus:ring-2"
                  style={{
                    borderColor: `${primary.base}40`,
                    '--tw-ring-color': primary.base
                  } as React.CSSProperties}
                  placeholder="Enter title..."
                  autoFocus
                />
              ) : (
                <textarea
                  value={inlineEdit.value}
                  onChange={(e) => setInlineEdit({ ...inlineEdit, value: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white resize-none focus:outline-none focus:ring-2"
                  style={{
                    borderColor: `${primary.base}40`,
                    '--tw-ring-color': primary.base
                  } as React.CSSProperties}
                  placeholder="Enter description..."
                  rows={3}
                  autoFocus
                />
              )}
              
              <div className="flex items-center justify-between mt-3">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  <kbd className="px-1.5 py-0.5 border rounded text-xs" style={{ 
                    backgroundColor: `${primary.base}10`,
                    borderColor: `${primary.base}30`,
                    color: primary.base
                  }}>Enter</kbd> to save, 
                  <kbd className="ml-1 px-1.5 py-0.5 border rounded text-xs" style={{ 
                    backgroundColor: `${primary.base}10`,
                    borderColor: `${primary.base}30`,
                    color: primary.base
                  }}>Esc</kbd> to cancel
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
    </>
  );
}
