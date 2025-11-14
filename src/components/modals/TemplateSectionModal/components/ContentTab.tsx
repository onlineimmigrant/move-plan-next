/**
 * ContentTab - Metrics and profile data management
 */

'use client';

import React from 'react';
import { RectangleStackIcon } from '@heroicons/react/24/outline';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useTemplateSectionEdit } from '../context';
import MetricManager from '../MetricManager';
import ProfileDataManager from '../ProfileDataManager';
import { TemplateSectionFormData } from '../hooks';

interface ContentTabProps {
  formData: TemplateSectionFormData;
  mode: 'create' | 'edit';
}

export default function ContentTab({ formData, mode }: ContentTabProps) {
  const themeColors = useThemeColors();
  const { editingSection, refetchEditingSection, refreshSections } = useTemplateSectionEdit();

  // Testimonials Section
  if (formData.section_type === 'testimonials') {
    return (
      <div className="space-y-6">
        <div 
          className="rounded-xl p-6 border-2"
          style={{ 
            backgroundColor: `${themeColors.cssVars.primary.light}20`,
            borderColor: themeColors.cssVars.primary.border,
          }}
        >
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: themeColors.cssVars.primary.light }}>
              <svg className="w-6 h-6" style={{ color: themeColors.cssVars.primary.base }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 mb-2">Testimonials Management</h4>
              <p className="text-sm text-gray-600">
                This section displays customer testimonials and ratings. Content is managed through the dedicated testimonials interface below.
              </p>
            </div>
          </div>
        </div>

        {mode === 'edit' && editingSection && (
          <div className="rounded-xl border-2 p-6" style={{ borderColor: themeColors.cssVars.primary.border }}>
            <ProfileDataManager 
              sectionId={editingSection.id} 
              type="testimonials" 
            />
          </div>
        )}

        {mode === 'create' && (
          <div className="rounded-xl border-2 border-dashed p-8 text-center" style={{ 
            borderColor: themeColors.cssVars.primary.border,
            backgroundColor: `${themeColors.cssVars.primary.light}10`
          }}>
            <RectangleStackIcon className="w-12 h-12 mx-auto mb-3" style={{ color: themeColors.cssVars.primary.base }} />
            <h4 className="text-sm font-medium text-gray-900 mb-1">
              Save Section to Add Testimonials
            </h4>
            <p className="text-xs text-gray-600">
              Create the section first, then you'll be able to add and manage testimonials
            </p>
          </div>
        )}
      </div>
    );
  }

  // General Section with Metrics
  if (formData.section_type === 'general') {
    return (
      <div className="space-y-6">
        {mode === 'create' ? (
          <div className="rounded-xl border-2 border-dashed p-8 text-center" style={{ 
            borderColor: themeColors.cssVars.primary.border,
            backgroundColor: `${themeColors.cssVars.primary.light}10`
          }}>
            <RectangleStackIcon className="w-12 h-12 mx-auto mb-3" style={{ color: themeColors.cssVars.primary.base }} />
            <h4 className="text-sm font-medium text-gray-900 mb-1">
              Save Section to Add Metrics
            </h4>
            <p className="text-xs text-gray-600">
              Create the section first, then you'll be able to add and manage metrics
            </p>
          </div>
        ) : editingSection ? (
          <MetricManager
            sectionId={editingSection.id}
            metrics={formData.website_metric || []}
            onMetricsChange={async () => {
              await refetchEditingSection();
              refreshSections();
            }}
            isImageBottom={formData.is_image_bottom}
            imageMetricsHeight={formData.image_metrics_height}
            textStyleVariant={formData.text_style_variant}
          />
        ) : null}
      </div>
    );
  }

  // Special Sections (Reviews, FAQ, etc.)
  return (
    <div className="space-y-6">
      <div 
        className="rounded-xl p-6 border-2"
        style={{ 
          backgroundColor: `${themeColors.cssVars.primary.light}20`,
          borderColor: themeColors.cssVars.primary.border,
        }}
      >
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: themeColors.cssVars.primary.light }}>
            <svg className="w-6 h-6" style={{ color: themeColors.cssVars.primary.base }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 mb-2">Special Section Type</h4>
            <p className="text-sm text-gray-600">
              This section type has predefined functionality. Content is managed automatically based on the section configuration and linked data sources.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
