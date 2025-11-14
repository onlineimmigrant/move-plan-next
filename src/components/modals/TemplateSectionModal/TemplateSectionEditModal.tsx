/**
 * TemplateSectionEditModal - Matching Hero Edit Modal Design
 * Draggable modal with mega menu buttons (Style, Content) matching HeroSectionEditModal
 */

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Rnd } from 'react-rnd';
import {
  RectangleStackIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useTemplateSectionEdit } from './context';
import { SettingsTab, LayoutTab, LayoutOptionsTab, StyleTab, ContentTab } from './components';
import { useSectionOperations, TemplateSectionFormData } from './hooks';
import DeleteSectionModal from './DeleteSectionModal';
import Button from '@/ui/Button';
import { TemplateSectionPreview } from './preview';
import ImageGalleryModal from '@/components/modals/ImageGalleryModal';

type MegaMenuId = 'style' | 'layout' | 'content' | null;

export default function TemplateSectionEditModal() {
  const { isOpen, editingSection, mode, closeModal } = useTemplateSectionEdit();
  const themeColors = useThemeColors();
  const primary = themeColors.cssVars.primary;
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

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
  
  // Inline editing state
  const [inlineEdit, setInlineEdit] = useState<{
    field: 'section_title' | 'section_description' | 'metric_title' | 'metric_description' | null;
    value: string;
    position: { x: number; y: number };
    metricIndex?: number;
  }>({ field: null, value: '', position: { x: 0, y: 0 } });
  
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
      let sectionType: TemplateSectionFormData['section_type'] = (editingSection as any).section_type || 'general';
      if (!(editingSection as any).section_type) {
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

  // Focus management
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      setTimeout(() => modalRef.current?.focus(), 100);
    } else {
      previousFocusRef.current?.focus();
    }
  }, [isOpen]);

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

  // Trigger preview refresh animation when formData changes
  useEffect(() => {
    if (isOpen) {
      setPreviewRefreshing(true);
      const timer = setTimeout(() => setPreviewRefreshing(false), 300);
      return () => clearTimeout(timer);
    }
  }, [formData, isOpen]);

  // Inline editing handlers
  const handleInlineEditOpen = (
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
  };

  const handleInlineEditSave = () => {
    if (!inlineEdit.field || !inlineEdit.value.trim()) {
      setInlineEdit({ field: null, value: '', position: { x: 0, y: 0 } });
      return;
    }

    if (inlineEdit.field === 'section_title') {
      setFormData({ ...formData, section_title: inlineEdit.value });
    } else if (inlineEdit.field === 'section_description') {
      setFormData({ ...formData, section_description: inlineEdit.value });
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
      setFormData({ ...formData, website_metric: updatedMetrics });
    }
    
    setInlineEdit({ field: null, value: '', position: { x: 0, y: 0 } });
  };

  const handleInlineEditCancel = () => {
    setInlineEdit({ field: null, value: '', position: { x: 0, y: 0 } });
  };

  // Image gallery handlers
  const handleOpenImageGallery = (metricIndex: number) => {
    setImageSelectionTarget({ type: 'metric', metricIndex });
    setIsImageGalleryOpen(true);
  };

  const handleImageSelect = (imageUrl: string) => {
    if (imageSelectionTarget?.type === 'metric' && formData.website_metric) {
      const updatedMetrics = [...formData.website_metric];
      updatedMetrics[imageSelectionTarget.metricIndex] = {
        ...updatedMetrics[imageSelectionTarget.metricIndex],
        image: imageUrl
      };
      setFormData({ ...formData, website_metric: updatedMetrics });
    }
    setIsImageGalleryOpen(false);
    setImageSelectionTarget(null);
  };

  const handleRemoveImage = (metricIndex: number) => {
    if (formData.website_metric) {
      const updatedMetrics = [...formData.website_metric];
      updatedMetrics[metricIndex] = {
        ...updatedMetrics[metricIndex],
        image: null
      };
      setFormData({ ...formData, website_metric: updatedMetrics });
    }
  };

  const onSave = useCallback(async () => {
    await handleSave(formData);
  }, [formData, handleSave]);

  const onDelete = useCallback(async () => {
    await handleDelete(editingSection?.id);
  }, [editingSection, handleDelete]);

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
        { id: 'title-desc', label: 'Title & Description', component: 'title-description' },
        { id: 'metrics', label: 'Metrics / Items', component: 'content' },
      ]
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
          ref={modalRef}
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
            ref={modalRef}
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

        {/* Mega Menu Dropdown (for Style & Content only) */}
        {openMenu && openMenu !== 'layout' && (
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
                              <LayoutTab formData={formData} setFormData={setFormData} />
                            )}
                            {section.component === 'style' && (
                              <StyleTab formData={formData} setFormData={setFormData} />
                            )}
                            {section.component === 'title-description' && (
                              <div className="space-y-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Section Title
                                  </label>
                                  <input
                                    type="text"
                                    value={formData.section_title}
                                    onChange={(e) => setFormData({ ...formData, section_title: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-offset-0 transition-colors"
                                    placeholder="Enter section title..."
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Section Description
                                  </label>
                                  <textarea
                                    value={formData.section_description}
                                    onChange={(e) => setFormData({ ...formData, section_description: e.target.value })}
                                    rows={4}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-offset-0 transition-colors resize-none"
                                    placeholder="Enter section description..."
                                  />
                                </div>
                              </div>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 md:gap-6">
              {/* Options */}
              <div className="md:col-span-2 lg:col-span-5">
                <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2.5">Options</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setFormData({ ...formData, is_full_width: !formData.is_full_width })}
                    className="px-3 py-1.5 rounded-lg border-2 text-xs font-medium transition-all hover:shadow-sm"
                    style={
                      formData.is_full_width
                        ? {
                            background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`,
                            color: 'white',
                            borderColor: primary.base,
                          }
                        : {
                            backgroundColor: 'white',
                            borderColor: '#e5e7eb',
                            color: '#6b7280',
                          }
                    }
                  >
                    Full Width
                  </button>
                  <button
                    onClick={() => setFormData({ ...formData, is_slider: !formData.is_slider })}
                    className="px-3 py-1.5 rounded-lg border-2 text-xs font-medium transition-all hover:shadow-sm"
                    style={
                      formData.is_slider
                        ? {
                            background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`,
                            color: 'white',
                            borderColor: primary.base,
                          }
                        : {
                            backgroundColor: 'white',
                            borderColor: '#e5e7eb',
                            color: '#6b7280',
                          }
                    }
                  >
                    Slider
                  </button>
                  <button
                    onClick={() => setFormData({ ...formData, is_image_bottom: !formData.is_image_bottom })}
                    className="px-3 py-1.5 rounded-lg border-2 text-xs font-medium transition-all hover:shadow-sm"
                    style={
                      formData.is_image_bottom
                        ? {
                            background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`,
                            color: 'white',
                            borderColor: primary.base,
                          }
                        : {
                            backgroundColor: 'white',
                            borderColor: '#e5e7eb',
                            color: '#6b7280',
                          }
                    }
                  >
                    Image Bottom
                  </button>
                </div>
              </div>
              
              {/* Grid Columns & Image Height combined on mobile */}
              <div className="grid grid-cols-2 gap-3 md:hidden">
                {/* Grid Columns */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2.5">Columns</h3>
                  <select
                    value={formData.grid_columns || 3}
                    onChange={(e) => setFormData({ ...formData, grid_columns: parseInt(e.target.value) })}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-offset-0 transition-all hover:shadow-sm font-medium"
                    style={{
                      '--tw-ring-color': primary.base,
                      borderColor: '#e5e7eb'
                    } as React.CSSProperties}
                  >
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                    <option value="6">6</option>
                  </select>
                </div>
                
                {/* Image Height */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2.5">Image Height</h3>
                  <select
                    value={formData.image_metrics_height || 'h-48'}
                    onChange={(e) => setFormData({ ...formData, image_metrics_height: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-offset-0 transition-all hover:shadow-sm font-medium"
                    style={{
                      '--tw-ring-color': primary.base,
                      borderColor: '#e5e7eb'
                    } as React.CSSProperties}
                  >
                    <option value="h-32">Small</option>
                    <option value="h-48">Medium</option>
                    <option value="h-64">Large</option>
                    <option value="h-80">X-Large</option>
                    <option value="h-96">2X-Large</option>
                  </select>
                </div>
              </div>
              
              {/* Grid Columns - desktop/tablet only */}
              <div className="hidden md:block lg:col-span-2">
                <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2.5">Columns</h3>
                <select
                  value={formData.grid_columns || 3}
                  onChange={(e) => setFormData({ ...formData, grid_columns: parseInt(e.target.value) })}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-offset-0 transition-all hover:shadow-sm font-medium"
                  style={{
                    '--tw-ring-color': primary.base,
                    borderColor: '#e5e7eb'
                  } as React.CSSProperties}
                >
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                  <option value="6">6</option>
                </select>
              </div>
              
              {/* Image Height - desktop/tablet only */}
              <div className="hidden md:block lg:col-span-2">
                <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2.5">Image Height</h3>
                <select
                  value={formData.image_metrics_height || 'h-48'}
                  onChange={(e) => setFormData({ ...formData, image_metrics_height: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-offset-0 transition-all hover:shadow-sm font-medium"
                  style={{
                    '--tw-ring-color': primary.base,
                    borderColor: '#e5e7eb'
                  } as React.CSSProperties}
                >
                  <option value="h-32">Small</option>
                  <option value="h-48">Medium</option>
                  <option value="h-64">Large</option>
                  <option value="h-80">X-Large</option>
                  <option value="h-96">2X-Large</option>
                </select>
              </div>
              
              {/* Title Alignment */}
              <div className="md:col-span-2 lg:col-span-3">
                <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2.5">Title Alignment</h3>
                <div className="flex gap-2">
                  {[
                    { value: 'left', label: 'Left' },
                    { value: 'center', label: 'Center' },
                    { value: 'right', label: 'Right' }
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
                      className="flex-1 px-3 py-2 rounded-lg border-2 font-medium text-xs transition-all hover:shadow-sm"
                      style={
                        (align.value === 'center' && formData.is_section_title_aligned_center) ||
                        (align.value === 'right' && formData.is_section_title_aligned_right) ||
                        (align.value === 'left' && !formData.is_section_title_aligned_center && !formData.is_section_title_aligned_right)
                          ? {
                              background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`,
                              color: 'white',
                              borderColor: primary.base,
                            }
                          : {
                              backgroundColor: 'white',
                              borderColor: '#e5e7eb',
                              color: '#6b7280',
                            }
                      }
                    >
                      {align.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area - Live Preview */}
        <div className="flex-1 overflow-y-auto bg-white/20 dark:bg-gray-900/20 p-0">
          {/* Preview refresh indicator */}
          {previewRefreshing && (
            <div 
              className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg border"
              style={{ borderColor: `${primary.base}40` }}
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
      {inlineEdit.field && (
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
              left: `${Math.min(inlineEdit.position.x, window.innerWidth - 520)}px`, 
              top: `${Math.min(inlineEdit.position.y, window.innerHeight - 200)}px` 
            }}
          >
            <div className="mb-3">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-gray-900 dark:text-white capitalize">
                  Edit {inlineEdit.field === 'section_title' ? 'Section Title' : 
                        inlineEdit.field === 'section_description' ? 'Section Description' : 
                        inlineEdit.field === 'metric_title' ? 'Metric Title' : 'Metric Description'}
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
              
              {inlineEdit.field === 'section_title' || inlineEdit.field === 'metric_title' ? (
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
      )}

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
