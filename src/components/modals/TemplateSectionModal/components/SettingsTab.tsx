/**
 * SettingsTab - Section type selection only (title/description moved to Content tab)
 */

'use client';

import React from 'react';
import { RadioGroup } from '@headlessui/react';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useSectionTypeFilter, TemplateSectionFormData } from '../hooks';

interface SettingsTabProps {
  formData: TemplateSectionFormData;
  setFormData: (data: TemplateSectionFormData) => void;
  mode: 'create' | 'edit';
}

export default function SettingsTab({ formData, setFormData, mode }: SettingsTabProps) {
  const themeColors = useThemeColors();
  const { searchQuery, setSearchQuery, filteredOptions } = useSectionTypeFilter();

  return (
    <div className="space-y-4">
      {/* Search Bar - Minimal styling */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search section types..."
          className="w-full pl-9 pr-9 py-2 rounded-lg border border-gray-200 bg-white/60 backdrop-blur-sm text-sm transition-all focus:outline-none focus:border-gray-300 focus:bg-white/80"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-gray-100 transition-colors"
          >
            <XMarkIcon className="w-3.5 h-3.5 text-gray-400" />
          </button>
        )}
      </div>

      {/* Section Type Cards - One per row */}
      <RadioGroup
        value={formData.section_type}
        onChange={(value) => setFormData({ ...formData, section_type: value })}
      >
        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => {
              const Icon = option.icon;
              
              return (
                <div
                  key={option.value}
                  style={formData.section_type === option.value ? { borderColor: themeColors.cssVars.primary.base } : {}}
                  className={cn(
                    'relative rounded-lg border p-3 transition-all hover:shadow-sm',
                    'bg-white/80 backdrop-blur-sm',
                    formData.section_type === option.value
                      ? 'border-2 shadow-sm' 
                      : 'border border-gray-200 hover:border-gray-300'
                  )}
                >
                  <RadioGroup.Option
                    value={option.value}
                    className="cursor-pointer"
                  >
                    {({ checked }) => (
                      <div className="flex w-full items-center gap-3">
                        <div className="flex-shrink-0">
                          <Icon
                            className="h-5 w-5"
                            style={{ color: checked ? themeColors.cssVars.primary.base : '#9CA3AF' }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <RadioGroup.Label
                            as="p"
                            className="text-sm font-medium"
                            style={{ color: checked ? themeColors.cssVars.primary.base : '#111827' }}
                          >
                            {option.label}
                          </RadioGroup.Label>
                          <RadioGroup.Description
                            as="p"
                            className="text-xs mt-0.5 text-gray-500 line-clamp-1"
                          >
                            {option.shortDescription || option.description}
                          </RadioGroup.Description>
                        </div>
                        {checked && (
                          <div className="flex-shrink-0">
                            <div 
                              className="rounded-full p-0.5" 
                              style={{ backgroundColor: themeColors.cssVars.primary.base }}
                            >
                              <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 12 12">
                                <path d="M3.707 5.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4a1 1 0 00-1.414-1.414L5 6.586 3.707 5.293z" />
                              </svg>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </RadioGroup.Option>
                </div>
              );
            })
          ) : (
            <div className="py-8 text-center">
              <p className="text-sm text-gray-500">
                No section types found matching "{searchQuery}"
              </p>
            </div>
          )}
        </div>
      </RadioGroup>
    </div>
  );
}
