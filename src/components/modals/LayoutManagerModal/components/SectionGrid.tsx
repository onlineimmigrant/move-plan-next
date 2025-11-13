/**
 * SectionGrid Component
 * Grid view for page sections
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';

interface PageSection {
  id: string;
  type: 'hero' | 'template_section' | 'heading_section';
  title: string;
  order: number;
  page: string; // url_page field
  data: any;
}

interface SectionGridProps {
  sections: PageSection[];
  primaryColor: string;
  primaryColorCSS?: string; // CSS variable
  grouped?: boolean;
}

const SECTION_TYPE_LABELS: Record<string, string> = {
  general: 'General',
  brand: 'Brands',
  article_slider: 'Article Slider',
  contact: 'Contact',
  faq: 'FAQ',
  reviews: 'Reviews',
  help_center: 'Help Center',
  real_estate: 'Real Estate',
  pricing_plans: 'Pricing Plans'
};

export function SectionGrid({ sections, primaryColor, primaryColorCSS, grouped = false }: SectionGridProps) {
  const typeColors = {
    hero: 'from-purple-500/20 to-purple-600/20 border-purple-300',
    template_section: 'from-blue-500/20 to-blue-600/20 border-blue-300',
    heading_section: 'from-green-500/20 to-green-600/20 border-green-300'
  };

  const typeIcons = {
    hero: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    template_section: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
      </svg>
    ),
    heading_section: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    )
  };

  const getSectionTypeLabel = (section: PageSection) => {
    if (section.type === 'template_section' && section.data?.section_type) {
      return SECTION_TYPE_LABELS[section.data.section_type] || section.data.section_type;
    }
    return null;
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
      <div className="space-y-6">
        {pageNames.map((pageName) => (
          <div key={pageName}>
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groupedByPage[pageName].map((section, index) => (
                <SectionCard key={section.id} section={section} index={index} primaryColor={primaryColor} typeColors={typeColors} typeIcons={typeIcons} getSectionTypeLabel={getSectionTypeLabel} />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {sections.map((section, index) => (
        <SectionCard key={section.id} section={section} index={index} primaryColor={primaryColor} typeColors={typeColors} typeIcons={typeIcons} getSectionTypeLabel={getSectionTypeLabel} />
      ))}
    </div>
  );
}

// Extract card into a separate component to reduce duplication
function SectionCard({ 
  section, 
  index, 
  primaryColor, 
  typeColors, 
  typeIcons, 
  getSectionTypeLabel 
}: {
  section: PageSection;
  index: number;
  primaryColor: string;
  typeColors: Record<string, string>;
  typeIcons: Record<string, JSX.Element>;
  getSectionTypeLabel: (section: PageSection) => string | null;
}) {
  return (
    <div
      className={cn(
        "group relative p-5 rounded-xl border-2 transition-all duration-300",
        "hover:shadow-xl hover:-translate-y-1 cursor-pointer",
        "bg-gradient-to-br",
        typeColors[section.type]
      )}
    >
      {/* Preview Link */}
      <a
        href={`/${section.page}`}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          'absolute top-3 left-3',
          'p-1.5 rounded-md',
          'bg-white/80 dark:bg-gray-700/80',
          'border border-gray-200 dark:border-gray-600',
          'opacity-0 group-hover:opacity-100',
          'transition-opacity duration-200',
          'hover:bg-gray-50 dark:hover:bg-gray-600',
          'z-10'
        )}
        onClick={(e) => e.stopPropagation()}
        aria-label="Open page in new tab"
      >
        <ArrowTopRightOnSquareIcon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
      </a>

      {/* Order Badge */}
      <div
        className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-md"
        style={{ backgroundColor: primaryColor }}
      >
        {index + 1}
      </div>

      {/* Icon */}
      <div className="flex items-center justify-center mb-3 text-gray-700 dark:text-gray-300">
        {typeIcons[section.type]}
      </div>

      {/* Title */}
      <h3 className="text-center font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
        {section.title}
      </h3>

      {/* Type Label */}
      {getSectionTypeLabel(section) && (
        <p className="text-center text-xs text-blue-600 dark:text-blue-400 font-medium">
          {getSectionTypeLabel(section)}
        </p>
      )}

      {/* Type Badge */}
      <div className="flex justify-center mt-3">
        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-white/70 dark:bg-gray-800/70 text-gray-700 dark:text-gray-300">
          {section.type === 'hero' && 'Hero'}
          {section.type === 'template_section' && 'Template'}
          {section.type === 'heading_section' && 'Heading'}
        </span>
      </div>
    </div>
  );
}
