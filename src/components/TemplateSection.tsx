// src/components/TemplateSection.tsx
'use client';

import React from 'react';
import parse from 'html-react-parser';
import DOMPurify from 'dompurify';

// Types
interface Metric {
  id: number;
  title: string;
  is_title_displayed: boolean;
  description: string;
  image?: string;
  is_image_rounded_full: boolean;
  is_card_type: boolean;
  background_color?: string;
}

interface TemplateSectionData {
  id: number;
  font_family?: string;
  background_color?: string;
  is_full_width: boolean;
  is_section_title_aligned_center: boolean;
  is_section_title_aligned_right: boolean;
  section_title: string;
  section_title_size?: string;
  section_title_weight?: string;
  section_title_color?: string;
  section_description?: string;
  section_description_size?: string;
  section_description_weight?: string;
  section_description_color?: string;
  grid_columns: number;
  image_metrics_height?: string;
  is_image_bottom: boolean;
  metric_title_size?: string;
  metric_title_weight?: string;
  metric_title_color?: string;
  metric_description_size?: string;
  metric_description_weight?: string;
  metric_description_color?: string;
  website_metric: Metric[];
}



const TemplateSection: React.FC<{ section: TemplateSectionData }> = ({ section }) => {
  if (!section) {
    return null;
  }

  // Sanitize HTML content to remove problematic characters and tags
  const sanitizeHTML = (html: string) => {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'a', 'span'], // Allow only safe tags
      ALLOWED_ATTR: ['href', 'class', 'style'], // Allow only safe attributes
      FORBID_TAGS: ['iframe'], // Explicitly forbid problematic tags like iframe
    });
  };

  return (
    <section
      className={`px-4 py-32 text-xl bg-${section.background_color}`}
    >
      <div
        className={`${section.is_full_width ? '' : 'max-w-7xl'} mx-auto space-y-12 p-4 sm:p-8 sm:rounded-xl`}
      >
        {/* Section Title and Description */}
        <div
          className={`${section.is_section_title_aligned_center ? 'text-center' : section.is_section_title_aligned_right ? 'text-right' : ''}`}
        >
          <h2
            className={`${section.section_title_size || 'text-3xl'} ${section.section_title_weight || 'font-bold'} text-${section.section_title_color}`}
          >
            {parse(sanitizeHTML(section.section_title || ''))}
          </h2>

          {section.section_description && (
            <p
              className={`pt-4 ${section.section_description_size || 'text-lg'} ${section.section_description_weight || 'font-normal'} text-${section.section_description_color || 'gray'}`}
            >
              {parse(sanitizeHTML(section.section_description || ''))}
            </p>
          )}
        </div>

        {/* Metrics Section */}
        <div
          className={`grid grid-cols-1 sm:grid-cols-${section.grid_columns || 1} gap-x-12 gap-y-12`}
        >
          {section.website_metric.map((metric) => (
            <div
              key={metric.id}
              className={`space-y-4 flex flex-col mx-auto ${metric.is_card_type ? `bg-${metric.background_color || 'transparent'} p-8 sm:p-16 rounded-lg text-center gap-y-8 max-w-xl` : ''}`}
            >
              {metric.image && (
                <div className={`${section.is_image_bottom ? 'order-3' : ''} mt-8`}>
                  <img
                    src={metric.image}
                    alt={metric.title || 'Metric image'}
                    className={`${metric.is_image_rounded_full ? 'rounded-full' : ''} mx-auto w-auto ${section.image_metrics_height || ''} object-cover`}
                  />
                </div>
              )}

              {metric.is_title_displayed && (
                <h3
                  className={`order-1 ${section.metric_title_size || 'text-xl'} ${section.metric_title_weight || 'font-semibold'} text-${section.metric_title_color}`}
                >
                  {parse(sanitizeHTML(metric.title || ''))}
                </h3>
              )}

              <div
                className={`flex-col order-2 ${section.metric_description_size || 'text-base'} ${section.metric_description_weight || 'font-normal'} text-${section.metric_description_color || 'gray'} tracking-wider`}
              >
                {parse(sanitizeHTML(metric.description || ''))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TemplateSection;