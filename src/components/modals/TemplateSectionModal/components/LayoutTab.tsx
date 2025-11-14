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
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { useThemeColors } from '@/hooks/useThemeColors';
import EditableGradientPicker from '@/components/Shared/EditableFields/EditableGradientPicker';
import { getBackgroundStyle } from '@/utils/gradientHelper';
import { TemplateSectionFormData } from '../hooks';
import { useTemplateSectionEdit } from '../context';
import MetricManager from '../MetricManager';

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
