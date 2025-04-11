// src/components/TemplateHeadingSection.tsx
'use client';

import React from 'react';
import parse from 'html-react-parser';
import DOMPurify from 'dompurify';

// Types
interface TemplateHeadingSectionData {
  id: number;
  name: string;
  name_part_2?: string;
  name_part_3?: string;
  description_text?: string;
  button_text?: string;
  url_page?: string;
  url?: string;
  image?: string;
  background_color?: string;
  font_family?: string;
  text_color?: string;
  button_color?: string;
  button_text_color?: string;
  text_size_h1?: string;
  text_size_h1_mobile?: string;
  text_size?: string;
  font_weight_1?: string;
  font_weight?: string;
  h1_text_color?: string;
  is_text_link?: boolean;
  image_first?: boolean;
  is_included_templatesection?: boolean;
}

interface TemplateHeadingSectionProps {
  templateSectionHeadings: TemplateHeadingSectionData[];
}

// Utility function to map color values (same as in TemplateSection)


const TemplateHeadingSection: React.FC<TemplateHeadingSectionProps> = ({ templateSectionHeadings }) => {
  if (!templateSectionHeadings || templateSectionHeadings.length === 0) {
    return null;
  }

  // Sanitize HTML content to remove problematic characters and tags
  const sanitizeHTML = (html: string) => {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'a', 'span'],
      ALLOWED_ATTR: ['href', 'class', 'style'],
      FORBID_TAGS: ['iframe'],
    });
  };

  return (
    <>
      {templateSectionHeadings.map((sectionHeading) => (
        <section
          key={sectionHeading.id}
          className={`min-h-screen py-12 sm:py-32 mx-auto w-full bg-${sectionHeading.background_color} ${sectionHeading.font_family || ''}`}
        >
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center px-6">
            {/* Left Side (Text) */}
            <div
              className={`space-y-8 text-center md:text-left ${sectionHeading.image_first ? 'order-2' : 'order-1'}`}
            >
              <h1
                className={`${sectionHeading.font_weight_1 || 'font-bold'} ${sectionHeading.text_size_h1_mobile || 'text-3xl'} sm:${sectionHeading.text_size_h1 || 'text-4xl'} text-${sectionHeading.h1_text_color}`}
              >
                {parse(sanitizeHTML(sectionHeading.name || ''))}{' '}
                {sectionHeading.name_part_2 && (
                  <span className="bg-sky-100 px-2">
                    {parse(sanitizeHTML(sectionHeading.name_part_2))}
                  </span>
                )}{' '}
                {sectionHeading.name_part_3 && parse(sanitizeHTML(sectionHeading.name_part_3))}
              </h1>

              {sectionHeading.description_text && (
                <p
                  className={`mt-4 text-${sectionHeading.text_color || 'gray-500'} ${sectionHeading.text_size || 'text-lg'} ${sectionHeading.font_weight || 'font-normal'}`}
                >
                  {parse(sanitizeHTML(sectionHeading.description_text))}
                </p>
              )}

              {sectionHeading.button_text && sectionHeading.url && (
                <div className="py-8 sm:py-4">
                  {sectionHeading.is_text_link ? (
                    <a
                      href={sectionHeading.url}
                      className={`text-sky-700 hover:opacity-80 underline ${sectionHeading.text_size || 'text-lg'} ${sectionHeading.font_weight || 'font-normal'}`}
                    >
                      {parse(sanitizeHTML(sectionHeading.button_text))}
                    </a>
                  ) : (
                    <a
                      href={sectionHeading.url}
                      className={`py-3 px-4 font-semibold text-sm rounded-full hover:opacity-80 bg-${sectionHeading.button_color} text-${sectionHeading.button_text_color} hover:text-${sectionHeading.button_color} hover:bg-transparent hover:border hover:border-${sectionHeading.button_color}`}
                    >
                      {parse(sanitizeHTML(sectionHeading.button_text))}
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Right Side (Image) */}
            <div
              className={`flex justify-center items-center ${sectionHeading.image_first ? 'order-1' : 'order-2'}`}
            >
              {sectionHeading.image && (
                <div className="relative">
                  <img
                    className="rounded-full w-auto h-auto object-cover"
                    src={sectionHeading.image}
                    alt={sectionHeading.name || 'Heading image'}
                  />
                </div>
              )}
            </div>
          </div>
        </section>
      ))}
    </>
  );
};

export default TemplateHeadingSection;