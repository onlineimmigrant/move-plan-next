/**
 * SectionTimeline Component
 * Timeline view for page sections
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface PageSection {
  id: string;
  type: 'hero' | 'template_section' | 'heading_section';
  title: string;
  order: number;
  page: string; // url_page field
  data: any;
}

interface SectionTimelineProps {
  sections: PageSection[];
  primaryColor: string;
  primaryColorCSS?: string; // CSS variable
  grouped?: boolean;
}

export function SectionTimeline({ sections, primaryColor, primaryColorCSS, grouped = false }: SectionTimelineProps) {
  const typeColors = {
    hero: 'bg-purple-100 text-purple-700 border-purple-300',
    template_section: 'bg-blue-100 text-blue-700 border-blue-300',
    heading_section: 'bg-green-100 text-green-700 border-green-300'
  };

  // Helper to format page name
  const formatPageName = (page: string) => {
    return page
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Group sections by page if requested
  if (grouped) {
    const groupedByPage = sections.reduce((acc, section) => {
      const pageName = section.page || 'home';
      if (!acc[pageName]) {
        acc[pageName] = [];
      }
      acc[pageName].push(section);
      return acc;
    }, {} as Record<string, PageSection[]>);

    const pageNames = Object.keys(groupedByPage).sort();

    return (
      <div className="space-y-8">
        {pageNames.map((pageName) => (
          <div key={pageName}>
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: primaryColorCSS }}></div>
                <h3 className="text-sm font-semibold text-gray-700">
                  {formatPageName(pageName)} Page
                </h3>
              </div>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                {groupedByPage[pageName].length} sections
              </span>
            </div>
            <TimelineContent sections={groupedByPage[pageName]} primaryColor={primaryColor} typeColors={typeColors} />
          </div>
        ))}
      </div>
    );
  }

  return <TimelineContent sections={sections} primaryColor={primaryColor} typeColors={typeColors} />;
}

// Extract timeline content into a separate component
function TimelineContent({ 
  sections, 
  primaryColor, 
  typeColors 
}: {
  sections: PageSection[];
  primaryColor: string;
  typeColors: Record<string, string>;
}) {
  return (
    <div className="relative">
      {/* Timeline Line */}
      <div
        className="absolute left-8 top-0 bottom-0 w-0.5"
        style={{ backgroundColor: `${primaryColor}40` }}
      />

      {/* Timeline Items */}
      <div className="space-y-6">
        {sections.map((section, index) => (
          <div key={section.id} className="relative flex gap-4">
            {/* Timeline Dot */}
            <div className="relative z-10 flex-shrink-0">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg"
                style={{ backgroundColor: primaryColor }}
              >
                {index + 1}
              </div>
            </div>

            {/* Content Card */}
            <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-4 hover:shadow-xl transition-shadow">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={cn(
                        "px-2.5 py-1 text-xs font-semibold rounded-full border",
                        typeColors[section.type]
                      )}
                    >
                      {section.type === 'hero' && 'Hero'}
                      {section.type === 'template_section' && 'Template'}
                      {section.type === 'heading_section' && 'Heading'}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-1">
                    {section.title}
                  </h3>
                  {section.type === 'template_section' && section.data?.section_type && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Type: {section.data.section_type}
                    </p>
                  )}
                </div>

                {/* Icon */}
                <div className="flex-shrink-0 text-gray-400">
                  {section.type === 'hero' && (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  )}
                  {section.type === 'template_section' && (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                    </svg>
                  )}
                  {section.type === 'heading_section' && (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
