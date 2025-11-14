/**
 * LayoutTab - Title alignment and Colors & Text
 */

'use client';

import React from 'react';
import {
  Bars3BottomLeftIcon,
  Bars3Icon,
  Bars3BottomRightIcon,
  Square2StackIcon,
  PlusCircleIcon,
  RectangleStackIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { useThemeColors } from '@/hooks/useThemeColors';
import EditableGradientPicker from '@/components/Shared/EditableFields/EditableGradientPicker';
import { getBackgroundStyle } from '@/utils/gradientHelper';
import { TemplateSectionFormData } from '../hooks';
import { useTemplateSectionEdit } from '../context';
import MetricManager from '../MetricManager';
import { useSectionTypeFilter, SECTION_TYPE_OPTIONS, SectionTypeOption } from '../hooks';

interface LayoutTabProps {
  formData: TemplateSectionFormData;
  setFormData: (data: TemplateSectionFormData) => void;
  mode?: 'create' | 'edit';
}

// Tooltip Component
const Tooltip = ({ content, position = 'top' }: { content: string; position?: 'top' | 'bottom' }) => {
  if (position === 'bottom') {
    return (
      <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="relative">
          <div className="absolute -top-1 left-1/2 -translate-x-1/2">
            <div className="w-2 h-2 bg-white border-l border-t border-gray-200 transform rotate-45" />
          </div>
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 px-3 py-2">
            <p className="text-xs text-gray-700 whitespace-nowrap">{content}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
      <div className="relative">
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 px-3 py-2">
          <p className="text-xs text-gray-700 whitespace-nowrap">{content}</p>
        </div>
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
          <div className="w-2 h-2 bg-white border-r border-b border-gray-200 transform rotate-45" />
        </div>
      </div>
    </div>
  );
};

export default function LayoutTab({ formData, setFormData, mode = 'edit' }: LayoutTabProps) {
  const themeColors = useThemeColors();
  const { editingSection, refetchEditingSection, refreshSections } = useTemplateSectionEdit();
  const [showCreateForm, setShowCreateForm] = React.useState(false);
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = React.useState(false);
  const [showVariantDropdown, setShowVariantDropdown] = React.useState(false);
  const typeButtonRef = React.useRef<HTMLButtonElement | null>(null);
  const typeDropdownRef = React.useRef<HTMLDivElement | null>(null);
  const variantButtonRef = React.useRef<HTMLButtonElement | null>(null);
  const variantDropdownRef = React.useRef<HTMLDivElement | null>(null);

  // Section type search/filter
  const { searchQuery, setSearchQuery, filteredOptions } = useSectionTypeFilter();

  // Text style variants with simple preview classes
  const [variantSearch, setVariantSearch] = React.useState('');
  const TEXT_VARIANT_OPTIONS: { value: TemplateSectionFormData['text_style_variant']; label: string; preview: { h: string; p: string } }[] = [
    { value: 'default', label: 'Default', preview: { h: 'text-2xl font-bold text-gray-900', p: 'text-sm text-gray-600' } },
    { value: 'apple', label: 'Apple', preview: { h: 'text-3xl font-light text-gray-900', p: 'text-sm text-gray-500' } },
    { value: 'codedharmony', label: 'CodedHarmony', preview: { h: 'text-3xl font-bold tracking-tight', p: 'text-sm text-gray-600' } },
    { value: 'magazine', label: 'Magazine', preview: { h: 'text-3xl font-black uppercase', p: 'text-xs uppercase tracking-wide' } },
    { value: 'startup', label: 'Startup', preview: { h: 'text-3xl font-black', p: 'text-sm' } },
    { value: 'elegant', label: 'Elegant', preview: { h: 'text-2xl font-serif italic', p: 'text-sm font-serif' } },
    { value: 'brutalist', label: 'Brutalist', preview: { h: 'text-3xl font-black uppercase', p: 'text-xs uppercase font-bold' } },
    { value: 'modern', label: 'Modern', preview: { h: 'text-3xl font-extrabold tracking-tight', p: 'text-sm' } },
    { value: 'playful', label: 'Playful', preview: { h: 'text-3xl font-extrabold', p: 'text-sm font-medium' } },
  ];
  const filteredVariants = TEXT_VARIANT_OPTIONS.filter(v => v.label.toLowerCase().includes(variantSearch.toLowerCase()));

  // Close dropdowns on outside click
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        showTypeDropdown &&
        typeDropdownRef.current &&
        !typeDropdownRef.current.contains(target) &&
        typeButtonRef.current &&
        !typeButtonRef.current.contains(target)
      ) {
        setShowTypeDropdown(false);
      }
      if (
        showVariantDropdown &&
        variantDropdownRef.current &&
        !variantDropdownRef.current.contains(target) &&
        variantButtonRef.current &&
        !variantButtonRef.current.contains(target)
      ) {
        setShowVariantDropdown(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showTypeDropdown, showVariantDropdown]);

  return (
    <div className="space-y-6">
      {/* Metrics Quick Actions - First Section */}
      <div>
        <label className="block text-sm font-semibold mb-4 text-gray-900">
          Metrics
        </label>
        
        {/* Debug info */}
        <div className="mb-2 text-xs text-gray-500">
          Mode: {mode} | Has editingSection: {editingSection ? 'Yes' : 'No'}
        </div>

        {mode === 'edit' && editingSection ? (
          <div className="flex items-center gap-3">
            {/* Create New Metric Button */}
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200"
              title="Create new metric"
            >
              <PlusCircleIcon className="w-5 h-5" />
              <span className="text-sm font-medium">Create New</span>
            </button>

            {/* Add Existing Metric Button */}
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200"
              title="Add existing metric from library"
            >
              <RectangleStackIcon className="w-5 h-5" />
              <span className="text-sm font-medium">Add Existing</span>
            </button>

            {/* Metric count badge */}
            {formData.website_metric && formData.website_metric.length > 0 && (
              <div className="ml-auto flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 text-gray-600">
                <RectangleStackIcon className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {formData.website_metric.length} metric{formData.website_metric.length !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
        ) : mode === 'create' ? (
          <div 
            className="rounded-xl border-2 border-dashed p-6 text-center"
            style={{ 
              borderColor: themeColors.cssVars.primary.border,
              backgroundColor: `${themeColors.cssVars.primary.light}10`
            }}
          >
            <RectangleStackIcon className="w-10 h-10 mx-auto mb-2 opacity-40" style={{ color: themeColors.cssVars.primary.base }} />
            <h4 className="text-sm font-medium text-gray-900 mb-1">
              Save Section First
            </h4>
            <p className="text-xs text-gray-600">
              Create the section, then you'll be able to add and manage metrics
            </p>
          </div>
        ) : (
          <div className="text-sm text-gray-500 italic">
            {!editingSection ? 'No editing section available' : 'Waiting...'}
          </div>
        )}

        {/* Full MetricManager with modals */}
        {mode === 'edit' && editingSection && (showCreateForm || showAddModal) && (
          <div className="mt-4">
            <MetricManager
              sectionId={editingSection.id}
              metrics={formData.website_metric || []}
              onMetricsChange={async () => {
                await refetchEditingSection();
                refreshSections();
              }}
              showCreateForm={showCreateForm}
              setShowCreateForm={setShowCreateForm}
              showAddModal={showAddModal}
              setShowAddModal={setShowAddModal}
              isImageBottom={formData.is_image_bottom}
              imageMetricsHeight={formData.image_metrics_height}
              textStyleVariant={formData.text_style_variant}
            />
          </div>
        )}
      </div>

      {/* Quick pick: Section Type + Color & Text */}
      <div>
        <label className="block text-sm font-semibold mb-4 text-gray-900">
          Layout Options
        </label>
        <div className="flex flex-wrap items-center gap-3">
          {/* Section Type button */}
          <div className="relative">
            <button
              ref={typeButtonRef}
              onClick={() => {
                setShowTypeDropdown((o) => !o);
                setShowVariantDropdown(false);
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all bg-white/80 backdrop-blur-sm border hover:shadow-sm"
            >
              <RectangleStackIcon className="w-5 h-5 text-gray-700" />
              <span className="text-sm font-medium text-gray-800">Section Type</span>
              <ChevronDownIcon className="w-4 h-4 text-gray-500" />
            </button>
            {showTypeDropdown && (
              <div
                ref={typeDropdownRef}
                className="dropdown-container absolute mt-2 left-0 w-[22rem] max-w-[90vw] bg-white rounded-xl shadow-lg border border-gray-200 z-[10020] p-3"
                role="listbox"
                aria-label="Section type list"
              >
                <div className="flex items-center gap-2 mb-2">
                  <MagnifyingGlassIcon className="w-4 h-4 text-gray-400" />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search section types..."
                    className="w-full outline-none text-sm text-gray-800 placeholder:text-gray-400"
                  />
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-gray-100">
                  {filteredOptions.map((opt: SectionTypeOption) => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        setFormData({ ...formData, section_type: opt.value });
                        setShowTypeDropdown(false);
                      }}
                      role="option"
                      aria-selected={formData.section_type === opt.value}
                      className={cn(
                        'w-full text-left p-3 hover:bg-gray-50 flex items-start gap-3',
                        formData.section_type === opt.value && 'bg-blue-50/70'
                      )}
                    >
                      <div className={cn('p-2 rounded-md', 'bg-gray-100')}>
                        <opt.icon className="w-5 h-5 text-gray-700" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                          {opt.label}
                          {formData.section_type === opt.value && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">Selected</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-600">{opt.description}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Color & Text button */}
          <div className="relative">
            <button
              ref={variantButtonRef}
              onClick={() => {
                setShowVariantDropdown((o) => !o);
                setShowTypeDropdown(false);
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all bg-white/80 backdrop-blur-sm border hover:shadow-sm"
            >
              <Square2StackIcon className="w-5 h-5 text-gray-700" />
              <span className="text-sm font-medium text-gray-800">Color & Text</span>
              <ChevronDownIcon className="w-4 h-4 text-gray-500" />
            </button>
            {showVariantDropdown && (
              <div
                ref={variantDropdownRef}
                className="dropdown-container absolute mt-2 left-0 w-[22rem] max-w-[90vw] bg-white rounded-xl shadow-lg border border-gray-200 z-[10020] p-3"
              >
                <div className="flex items-center gap-2 mb-2">
                  <MagnifyingGlassIcon className="w-4 h-4 text-gray-400" />
                  <input
                    value={variantSearch}
                    onChange={(e) => setVariantSearch(e.target.value)}
                    placeholder="Search styles..."
                    className="w-full outline-none text-sm text-gray-800 placeholder:text-gray-400"
                  />
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-gray-100">
                  {filteredVariants.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        setFormData({ ...formData, text_style_variant: opt.value });
                        setShowVariantDropdown(false);
                      }}
                      className={cn(
                        'w-full text-left p-3 hover:bg-gray-50',
                        formData.text_style_variant === opt.value && 'bg-blue-50/70'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                            {opt.label}
                            {formData.text_style_variant === opt.value && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">Selected</span>
                            )}
                          </div>
                          <div className="mt-1 p-3 rounded-lg border bg-white/60">
                            <div className={cn(opt.preview.h)}>Sample Heading</div>
                            <div className={cn(opt.preview.p)}>This is a preview of text.</div>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="mt-2 text-xs text-gray-500">Selecting a style updates the live preview.</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Alignment Controls */}
      <div>
        <label className="block text-sm font-semibold mb-4 text-gray-900">
          Title Alignment
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative group">
            <button
              onClick={() => setFormData({
                ...formData,
                is_section_title_aligned_center: false,
                is_section_title_aligned_right: false,
              })}
              className={cn(
                'p-2.5 rounded-lg transition-all bg-white/80 backdrop-blur-sm',
                'hover:shadow-sm border',
                !formData.is_section_title_aligned_center && !formData.is_section_title_aligned_right
                  ? 'border-2'
                  : ''
              )}
              style={{
                borderColor: !formData.is_section_title_aligned_center && !formData.is_section_title_aligned_right
                  ? themeColors.cssVars.primary.base
                  : '#e5e7eb',
                color: !formData.is_section_title_aligned_center && !formData.is_section_title_aligned_right
                  ? themeColors.cssVars.primary.base
                  : '#6B7280',
              }}
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
                'p-2.5 rounded-lg transition-all bg-white/80 backdrop-blur-sm',
                'hover:shadow-sm border',
                formData.is_section_title_aligned_center ? 'border-2' : ''
              )}
              style={{
                borderColor: formData.is_section_title_aligned_center
                  ? themeColors.cssVars.primary.base
                  : '#e5e7eb',
                color: formData.is_section_title_aligned_center
                  ? themeColors.cssVars.primary.base
                  : '#6B7280',
              }}
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
                'p-2.5 rounded-lg transition-all bg-white/80 backdrop-blur-sm',
                'hover:shadow-sm border',
                formData.is_section_title_aligned_right ? 'border-2' : ''
              )}
              style={{
                borderColor: formData.is_section_title_aligned_right
                  ? themeColors.cssVars.primary.base
                  : '#e5e7eb',
                color: formData.is_section_title_aligned_right
                  ? themeColors.cssVars.primary.base
                  : '#6B7280',
              }}
            >
              <Bars3BottomRightIcon className="w-5 h-5" />
            </button>
            <Tooltip content="Align section title to the right" position="bottom" />
          </div>
        </div>
      </div>

      {/* Colors & Text Section */}
      <div>
        <label className="block text-sm font-semibold mb-4 text-gray-900">
          Background Color
        </label>
        <div className="space-y-4">
          {/* Gradient Toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setFormData({ ...formData, is_gradient: false })}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all border',
                'hover:shadow-sm bg-white/80 backdrop-blur-sm',
                !formData.is_gradient ? 'border-2' : ''
              )}
              style={{
                borderColor: !formData.is_gradient ? themeColors.cssVars.primary.base : '#e5e7eb',
                color: !formData.is_gradient ? themeColors.cssVars.primary.base : '#6B7280',
              }}
            >
              <div className="flex items-center gap-2">
                <Square2StackIcon className="w-4 h-4" />
                Solid Color
              </div>
            </button>
            <button
              onClick={() => setFormData({ ...formData, is_gradient: true })}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all border',
                'hover:shadow-sm bg-white/80 backdrop-blur-sm',
                formData.is_gradient ? 'border-2' : ''
              )}
              style={{
                borderColor: formData.is_gradient ? themeColors.cssVars.primary.base : '#e5e7eb',
                color: formData.is_gradient ? themeColors.cssVars.primary.base : '#6B7280',
              }}
            >
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-gradient-to-r from-blue-400 to-purple-500" />
                Gradient
              </div>
            </button>
          </div>

          {/* Color Picker */}
          <div>
            <EditableGradientPicker
              label="Section Background"
              isGradient={formData.is_gradient}
              gradient={formData.gradient || { from: 'blue-400', to: 'purple-500' }}
              solidColor={formData.background_color}
              onGradientChange={(isGradient: boolean, gradient: any) => 
                setFormData({ ...formData, is_gradient: isGradient, gradient })
              }
              onSolidColorChange={(color: string) => 
                setFormData({ ...formData, background_color: color })
              }
            />
          </div>

          {/* Preview */}
          <div 
            className="h-24 rounded-lg border"
            style={{
              ...getBackgroundStyle(formData.is_gradient, formData.gradient, formData.background_color),
              borderColor: '#e5e7eb',
            }}
          />
        </div>
      </div>
    </div>
  );
}
