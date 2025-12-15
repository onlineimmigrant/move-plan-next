/**
 * QuickPicksSection - Extracted component for section type and style selection
 * Reduces TemplateSectionEditModal from 1744 lines to more manageable size
 */

'use client';

import React, { useRef, useEffect } from 'react';
import { RectangleStackIcon, Squares2X2Icon, ChevronDownIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useSectionTypeFilter } from '../hooks';
import { TemplateSectionFormData } from '../hooks';

interface QuickPicksSectionProps {
  formData: TemplateSectionFormData;
  setFormData: (data: TemplateSectionFormData) => void;
  breakpoint: 'sm' | 'md' | 'lg';
}

const TEXT_VARIANT_OPTIONS: { value: TemplateSectionFormData['text_style_variant']; label: string; preview: { h: string; p: string } }[] = [
  { value: 'default', label: 'Default', preview: { h: 'text-sm font-bold text-gray-900', p: 'text-xs text-gray-600' } },
  { value: 'apple', label: 'Apple', preview: { h: 'text-base font-light text-gray-900', p: 'text-xs text-gray-500' } },
  { value: 'codedharmony', label: 'CodedHarmony', preview: { h: 'text-base font-bold tracking-tight', p: 'text-xs text-gray-600' } },
  { value: 'magazine', label: 'Magazine', preview: { h: 'text-base font-black uppercase', p: 'text-[10px] uppercase tracking-wide' } },
  { value: 'startup', label: 'Startup', preview: { h: 'text-base font-black', p: 'text-xs' } },
  { value: 'elegant', label: 'Elegant', preview: { h: 'text-base font-serif italic', p: 'text-xs font-serif' } },
  { value: 'brutalist', label: 'Brutalist', preview: { h: 'text-base font-black uppercase', p: 'text-[10px] uppercase font-bold' } },
  { value: 'modern', label: 'Modern', preview: { h: 'text-base font-extrabold tracking-tight', p: 'text-xs' } },
  { value: 'playful', label: 'Playful', preview: { h: 'text-base font-extrabold', p: 'text-xs font-medium' } },
];

export default function QuickPicksSection({ formData, setFormData, breakpoint }: QuickPicksSectionProps) {
  const themeColors = useThemeColors();
  const primary = themeColors.cssVars.primary;

  // Dropdown state management
  const [showTypeDropdown, setShowTypeDropdown] = React.useState(false);
  const [showVariantDropdown, setShowVariantDropdown] = React.useState(false);
  const [variantSearch, setVariantSearch] = React.useState('');

  // Refs for dropdowns
  const typeBtnRef = useRef<HTMLButtonElement | null>(null);
  const typeDropdownRef = useRef<HTMLDivElement | null>(null);
  const variantBtnRef = useRef<HTMLButtonElement | null>(null);
  const variantDropdownRef = useRef<HTMLDivElement | null>(null);

  const { searchQuery, setSearchQuery, filteredOptions } = useSectionTypeFilter();

  const filteredVariants = React.useMemo(() =>
    TEXT_VARIANT_OPTIONS.filter(v => v.label.toLowerCase().includes(variantSearch.toLowerCase())),
    [variantSearch]
  );

  // Click outside to close dropdowns
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement;

      // Close type dropdown if clicked outside
      if (showTypeDropdown && typeDropdownRef.current && !typeDropdownRef.current.contains(t) && !typeBtnRef.current?.contains(t)) {
        setShowTypeDropdown(false);
      }

      // Close variant dropdown if clicked outside
      if (showVariantDropdown && variantDropdownRef.current && !variantDropdownRef.current.contains(t) && !variantBtnRef.current?.contains(t)) {
        setShowVariantDropdown(false);
      }
    };

    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [showTypeDropdown, showVariantDropdown]);

  return (
    <div>
      <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Quick Picks</h3>
      <div className="flex gap-1.5 relative">
        {/* Section Type */}
        <button
          ref={typeBtnRef}
          onClick={() => { setShowTypeDropdown(v => !v); setShowVariantDropdown(false); }}
          className="px-2.5 py-1.5 rounded-lg border-2 text-xs font-medium transition-all hover:shadow-sm inline-flex items-center gap-1.5"
          style={{ backgroundColor: 'white', borderColor: '#e5e7eb', color: '#374151' }}
          aria-label="Choose section type"
        >
          <RectangleStackIcon className="w-4 h-4" />
          Type
          <ChevronDownIcon className="w-4 h-4" />
        </button>
        {showTypeDropdown && (
          <div ref={typeDropdownRef} className="dropdown-container absolute top-full mt-2 left-0 bg-white rounded-lg shadow-lg border border-gray-200 z-[10020] w-80 max-h-72 overflow-y-auto p-2">
            <div className="flex items-center gap-2 mb-2 px-1">
              <MagnifyingGlassIcon className="w-4 h-4 text-gray-400" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search section types..."
                className="w-full outline-none text-xs text-gray-800 placeholder:text-gray-400"
              />
            </div>
            <div className="divide-y divide-gray-100">
              {filteredOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => { setFormData({ ...formData, section_type: opt.value }); setShowTypeDropdown(false); }}
                  className={cn('w-full text-left p-2 hover:bg-gray-50 flex items-start gap-2', formData.section_type === opt.value && 'bg-blue-50/70')}
                >
                  <div className="p-1.5 rounded bg-gray-100"><opt.icon className="w-4 h-4 text-gray-700" /></div>
                  <div>
                    <div className="text-xs font-medium text-gray-900 flex items-center gap-1.5">
                      {opt.label}
                      {formData.section_type === opt.value && <span className="text-[9px] px-1 rounded bg-blue-100 text-blue-700">Selected</span>}
                    </div>
                    <div className="text-[11px] text-gray-600">{opt.shortDescription || opt.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Color & Text */}
        <button
          ref={variantBtnRef}
          onClick={() => { setShowVariantDropdown(v => !v); setShowTypeDropdown(false); }}
          className="px-2.5 py-1.5 rounded-lg border-2 text-xs font-medium transition-all hover:shadow-sm inline-flex items-center gap-1.5"
          style={{ backgroundColor: 'white', borderColor: '#e5e7eb', color: '#374151' }}
          aria-label="Choose color & text style"
        >
          <Squares2X2Icon className="w-4 h-4" />
          Color & Text
          <ChevronDownIcon className="w-4 h-4" />
        </button>
        {showVariantDropdown && (
          <div ref={variantDropdownRef} className="dropdown-container absolute top-full mt-2 left-0 bg-white rounded-lg shadow-lg border border-gray-200 z-[10020] w-80 max-h-72 overflow-y-auto p-2">
            <div className="flex items-center gap-2 mb-2 px-1">
              <MagnifyingGlassIcon className="w-4 h-4 text-gray-400" />
              <input
                value={variantSearch}
                onChange={(e) => setVariantSearch(e.target.value)}
                placeholder="Search styles..."
                className="w-full outline-none text-xs text-gray-800 placeholder:text-gray-400"
              />
            </div>
            <div className="divide-y divide-gray-100">
              {filteredVariants.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => { setFormData({ ...formData, text_style_variant: opt.value }); setShowVariantDropdown(false); }}
                  className={cn('w-full text-left p-2 hover:bg-gray-50', formData.text_style_variant === opt.value && 'bg-blue-50/70')}
                >
                  <div className="text-xs font-medium text-gray-900 flex items-center gap-1.5">
                    {opt.label}
                    {formData.text_style_variant === opt.value && <span className="text-[9px] px-1 rounded bg-blue-100 text-blue-700">Selected</span>}
                  </div>
                  <div className="mt-1 p-2 rounded border bg-white/60">
                    <div className={cn(opt.preview.h)}>Sample Heading</div>
                    <div className={cn(opt.preview.p)}>This is a preview of text.</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}