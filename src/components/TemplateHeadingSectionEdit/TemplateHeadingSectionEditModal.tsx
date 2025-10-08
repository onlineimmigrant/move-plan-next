'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  XMarkIcon, 
  ArrowsPointingOutIcon, 
  ArrowsPointingInIcon,
  PhotoIcon,
  Square2StackIcon,
  LinkIcon,
  Bars3BottomLeftIcon,
  Bars3Icon,
  Bars3BottomRightIcon,
  SparklesIcon,
  ArrowsRightLeftIcon,
  PlusIcon,
  CursorArrowRaysIcon,
} from '@heroicons/react/24/outline';
import { useTemplateHeadingSectionEdit } from '@/context/TemplateHeadingSectionEditContext';
import ColorPaletteDropdown, { getColorValue } from '@/components/Shared/ColorPaletteDropdown';
import ImageGalleryModal from '@/components/ImageGalleryModal/ImageGalleryModal';
import Button from '@/ui/Button';
import { cn } from '@/lib/utils';

// Text style variants matching TemplateHeadingSection.tsx
const TEXT_VARIANTS = {
  default: {
    h1: 'text-3xl sm:text-5xl lg:text-7xl font-normal text-gray-800',
    description: 'text-lg font-light text-gray-700',
    button: 'bg-gradient-to-r from-emerald-400 to-teal-500',
    linkColor: 'text-emerald-600 hover:text-emerald-500'
  },
  apple: {
    h1: 'text-4xl sm:text-6xl lg:text-7xl font-light text-gray-900',
    description: 'text-lg font-light text-gray-600',
    button: 'bg-gradient-to-r from-sky-500 to-blue-500',
    linkColor: 'text-sky-600 hover:text-sky-500'
  },
  codedharmony: {
    h1: 'text-3xl sm:text-5xl lg:text-6xl font-thin text-gray-900 tracking-tight leading-none',
    description: 'text-lg sm:text-xl text-gray-500 font-light leading-relaxed',
    button: 'bg-gradient-to-r from-indigo-500 to-purple-500',
    linkColor: 'text-indigo-600 hover:text-indigo-500'
  }
};

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
  background_color: string;
  text_style_variant: 'default' | 'apple' | 'codedharmony';
  is_text_link: boolean;
  title_alignment: 'left' | 'center' | 'right';
}

export default function TemplateHeadingSectionEditModal() {
  const { isOpen, editingSection, mode, closeModal, updateSection, deleteSection } = useTemplateHeadingSectionEdit();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showStylePicker, setShowStylePicker] = useState(false);
  const [showImageGallery, setShowImageGallery] = useState(false);
  const [showUrlFields, setShowUrlFields] = useState(false);
  const [showPart2, setShowPart2] = useState(false);
  const [showPart3, setShowPart3] = useState(false);
  
  const descriptionTextareaRef = useRef<HTMLTextAreaElement>(null);
  const colorButtonRef = useRef<HTMLButtonElement>(null);
  const styleButtonRef = useRef<HTMLButtonElement>(null);
  const urlButtonRef = useRef<HTMLButtonElement>(null);
  
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
    background_color: 'white',
    text_style_variant: 'default',
    is_text_link: false,
    title_alignment: 'left',
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
        background_color: (editingSection as any).background_color || 'white',
        text_style_variant: (editingSection.text_style_variant as any) || 'default',
        is_text_link: editingSection.is_text_link || false,
        title_alignment: 'left',
      });
      
      // Show part 2 and 3 if they have content
      setShowPart2(!!editingSection.name_part_2);
      setShowPart3(!!editingSection.name_part_3);
    }
  }, [editingSection]);

  // Auto-expand textarea
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData({ ...formData, description_text: e.target.value });
    
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
  }, [formData.description_text]);

  const handleSave = async () => {
    // Validate required fields
    if (!formData.name || !formData.name.trim()) {
      alert('Please enter a heading name');
      return;
    }
    
    if (!formData.description_text || !formData.description_text.trim()) {
      alert('Please enter a description text');
      return;
    }
    
    if (!formData.url_page || !formData.url_page.trim()) {
      alert('Please enter a page URL (e.g., "/about" or "/")');
      return;
    }
    
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

  const handleImageSelect = (imageUrl: string) => {
    setFormData({ ...formData, image: imageUrl });
    setShowImageGallery(false);
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
        setShowUrlFields(false);
      }
    };

    if (showColorPicker || showStylePicker || showUrlFields) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showColorPicker, showStylePicker, showUrlFields]);

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

        {/* Fixed Toolbar - Horizontally Scrollable */}
        <div className="border-b border-gray-200 shrink-0 relative">
          <div className="overflow-x-auto">
            <div className="flex items-center gap-1 px-6 py-3 min-w-max">
              {/* Image Position */}
              <button
                onClick={() => setFormData({ ...formData, image_first: !formData.image_first })}
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  formData.image_first
                    ? 'bg-sky-100 text-sky-700'
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                )}
                title="Image first (left/top)"
              >
                <PhotoIcon className="w-5 h-5" />
              </button>

              {/* Button/Link Style Toggle */}
              <button
                onClick={() => {
                  const newValue = !formData.is_text_link;
                  console.log('Toggling is_text_link:', formData.is_text_link, '->', newValue);
                  setFormData({ ...formData, is_text_link: newValue });
                }}
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  formData.is_text_link
                    ? 'bg-sky-100 text-sky-700'
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                )}
                title={formData.is_text_link ? "Text Link Mode - Click to switch to Button" : "Button Mode - Click to switch to Text Link"}
              >
                {formData.is_text_link ? (
                  <CursorArrowRaysIcon className="w-5 h-5" />
                ) : (
                  <Square2StackIcon className="w-5 h-5" />
                )}
              </button>

              {/* Include Template Section */}
              <button
                onClick={() => setFormData({ ...formData, is_included_templatesection: !formData.is_included_templatesection })}
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  formData.is_included_templatesection
                    ? 'bg-sky-100 text-sky-700'
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                )}
                title="Include template section"
              >
                <Square2StackIcon className="w-5 h-5" />
              </button>

              <div className="w-px h-6 bg-gray-300 mx-1" />

              {/* Background Color */}
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
                  setShowUrlFields(false);
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
                    setShowUrlFields(false);
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
                      className="fixed bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-[100] min-w-[200px]"
                      style={{
                        top: `${rect.bottom + 8}px`,
                        left: `${rect.left}px`,
                      }}
                    >
                      {[
                        { value: 'default' as const, label: 'Default' },
                        { value: 'apple' as const, label: 'Apple' },
                        { value: 'codedharmony' as const, label: 'Coded Harmony' },
                      ].map((option) => (
                        <button
                          key={option.value}
                          onClick={() => {
                            setFormData({ ...formData, text_style_variant: option.value });
                            setShowStylePicker(false);
                          }}
                          className={cn(
                            'w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors',
                            formData.text_style_variant === option.value && 'bg-sky-50 text-sky-700'
                          )}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  );
                })()}
              </div>

              {/* URL Fields Dropdown */}
              <div className="dropdown-container">
                <button
                  ref={urlButtonRef}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowUrlFields(!showUrlFields);
                    setShowColorPicker(false);
                    setShowStylePicker(false);
                  }}
                  className={cn(
                    'p-2 rounded-lg transition-colors',
                    showUrlFields
                      ? 'bg-sky-100 text-sky-700'
                      : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                  )}
                  title="URLs"
                >
                  <LinkIcon className="w-5 h-5" />
                </button>
                {showUrlFields && urlButtonRef.current && (() => {
                  const rect = urlButtonRef.current.getBoundingClientRect();
                  return (
                    <div 
                      className="fixed bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-[100] min-w-[300px]"
                      style={{
                        top: `${rect.bottom + 8}px`,
                        left: `${rect.left}px`,
                      }}
                    >
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">
                            Page URL <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={formData.url_page}
                            onChange={(e) => setFormData({ ...formData, url_page: e.target.value })}
                            placeholder="/about or / (required)"
                            className={cn(
                              "w-full px-3 py-1.5 text-sm border rounded focus:border-sky-500 focus:outline-none",
                              !formData.url_page ? 'border-red-300' : 'border-gray-300'
                            )}
                          />
                          <p className="text-xs text-gray-400 mt-1">The page where this heading will appear</p>
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">Button URL</label>
                          <input
                            type="text"
                            value={formData.url}
                            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                            placeholder="/contact (optional)"
                            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:border-sky-500 focus:outline-none"
                          />
                          <p className="text-xs text-gray-400 mt-1">Where the button/link should navigate</p>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>

        {/* Content - Preview Area */}
        <div 
          className="flex-1 overflow-y-auto p-6 transition-colors"
          style={{
            backgroundColor: getColorValue(formData.background_color || 'white')
          }}
        >
          <div className="max-w-7xl mx-auto">
            {/* Desktop Layout - Two Columns if image exists */}
            <div className={cn(
              "grid gap-8",
              formData.image ? "lg:grid-cols-2 lg:gap-16" : "lg:grid-cols-1"
            )}>
              {/* Text Content */}
              <div className={cn(
                "space-y-6",
                formData.image && formData.image_first ? "lg:order-2" : "lg:order-1",
                !formData.image && "max-w-4xl mx-auto"
              )}>
                {/* Heading Name (Part 1) - Required */}
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <span className="text-xs text-gray-500">Heading</span>
                    <span className="text-red-500 text-xs">*</span>
                  </div>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter main heading... (required)"
                    className={cn(
                      'w-full px-0 py-2 border-0 focus:outline-none focus:ring-0 placeholder:text-gray-300 bg-transparent',
                      TEXT_VARIANTS[formData.text_style_variant].h1,
                      !formData.name && 'border-b-2 border-red-200'
                    )}
                  />
                </div>

                {/* Heading Name (Part 2) - Show/Hide with + button */}
                {showPart2 ? (
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.name_part_2}
                      onChange={(e) => setFormData({ ...formData, name_part_2: e.target.value })}
                      placeholder="Enter second part..."
                      className={cn(
                        'w-full px-0 py-2 pr-8 border-0 focus:outline-none focus:ring-0 placeholder:text-gray-300 bg-transparent',
                        TEXT_VARIANTS[formData.text_style_variant].h1,
                        'opacity-80'
                      )}
                    />
                    <button
                      onClick={() => {
                        setShowPart2(false);
                        setFormData({ ...formData, name_part_2: '' });
                      }}
                      className="absolute right-0 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-red-600"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowPart2(true)}
                    className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <PlusIcon className="w-4 h-4" />
                    Add second heading part
                  </button>
                )}

                {/* Heading Name (Part 3) - Show only if Part 2 is shown */}
                {showPart2 && (
                  showPart3 ? (
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.name_part_3}
                        onChange={(e) => setFormData({ ...formData, name_part_3: e.target.value })}
                        placeholder="Enter third part..."
                        className={cn(
                          'w-full px-0 py-2 pr-8 border-0 focus:outline-none focus:ring-0 placeholder:text-gray-300 bg-transparent',
                          TEXT_VARIANTS[formData.text_style_variant].h1,
                          'opacity-70'
                        )}
                      />
                      <button
                        onClick={() => {
                          setShowPart3(false);
                          setFormData({ ...formData, name_part_3: '' });
                        }}
                        className="absolute right-0 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-red-600"
                      >
                        <XMarkIcon className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowPart3(true)}
                      className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      <PlusIcon className="w-4 h-4" />
                      Add third heading part
                    </button>
                  )
                )}

                {/* Description Text - Required */}
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <span className="text-xs text-gray-500">Description</span>
                    <span className="text-red-500 text-xs">*</span>
                  </div>
                  <textarea
                    ref={descriptionTextareaRef}
                    value={formData.description_text}
                    onChange={handleDescriptionChange}
                    placeholder="Enter description text... (required)"
                    rows={1}
                    className={cn(
                      'w-full px-0 py-1 border-0 focus:outline-none focus:ring-0 placeholder:text-gray-300 resize-none bg-transparent overflow-hidden',
                      TEXT_VARIANTS[formData.text_style_variant].description,
                      !formData.description_text && 'border-b-2 border-red-200'
                    )}
                  />
                </div>

                {/* Button/Link Preview */}
                {formData.button_text ? (
                  <div className="flex">
                    {formData.is_text_link ? (
                      // Text Link Style - Inline Editable
                      <div className="relative group flex items-center gap-x-2">
                        <input
                          type="text"
                          value={formData.button_text}
                          onChange={(e) => setFormData({ ...formData, button_text: e.target.value })}
                          placeholder="Enter link text..."
                          className={cn(
                            'px-0 py-1 border-0 focus:outline-none focus:ring-0 placeholder:text-gray-300 bg-transparent text-lg font-light',
                            TEXT_VARIANTS[formData.text_style_variant].linkColor,
                            'inline-flex items-center'
                          )}
                          style={{ width: `${Math.max(formData.button_text.length * 10, 100)}px` }}
                        />
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </div>
                    ) : (
                      // Button Style - Inline Editable with proper sizing
                      <div className="relative">
                        <div className={cn(
                          'inline-flex items-center justify-center px-4 py-2 sm:px-6 sm:py-2 text-sm sm:text-sm rounded-lg shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5',
                          TEXT_VARIANTS[formData.text_style_variant].button
                        )}>
                          <input
                            type="text"
                            value={formData.button_text}
                            onChange={(e) => setFormData({ ...formData, button_text: e.target.value })}
                            placeholder="Enter button text..."
                            className="text-white font-medium bg-transparent border-0 focus:outline-none focus:ring-0 placeholder:text-white/70 text-center text-sm sm:text-sm"
                            style={{ width: `${Math.max(formData.button_text.length * 8, 80)}px` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex">
                    <input
                      type="text"
                      value={formData.button_text}
                      onChange={(e) => setFormData({ ...formData, button_text: e.target.value })}
                      placeholder={formData.is_text_link ? "Add link text (optional)..." : "Add button text (optional)..."}
                      className="px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg placeholder:text-gray-400 focus:border-sky-500 focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Image Section */}
              {formData.image ? (
                <div className={cn(
                  "relative",
                  formData.image_first ? "lg:order-1" : "lg:order-2"
                )}>
                  <div className="relative group">
                    <img
                      src={formData.image}
                      alt="Hero"
                      className="w-full h-auto rounded-lg shadow-md"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-3">
                      <button
                        onClick={() => setShowImageGallery(true)}
                        className="px-4 py-2 bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        Change Image
                      </button>
                      <button
                        onClick={() => setFormData({ ...formData, image: '' })}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className={cn(
                  formData.image_first ? "lg:order-1" : "lg:order-2"
                )}>
                  <button
                    onClick={() => setShowImageGallery(true)}
                    className="w-full border-2 border-dashed border-gray-300 rounded-lg p-12 hover:border-gray-400 hover:bg-gray-50 transition-colors flex flex-col items-center justify-center gap-2"
                  >
                    <PhotoIcon className="w-12 h-12 text-gray-400" />
                    <span className="text-gray-500">Click to add hero image</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer with Action Buttons */}
        <div className="shrink-0 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-end px-6 py-4 gap-3">
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl p-6 max-w-md mx-4">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Delete Heading Section</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this heading section? This action cannot be undone.
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
    </div>
  );
}
