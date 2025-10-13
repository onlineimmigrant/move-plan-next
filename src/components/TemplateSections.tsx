// /src/components/TemplateSections.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import TemplateSection from './TemplateSection';
import { useTemplateSectionEdit } from '@/components/modals/TemplateSectionModal/context';

// Types
interface Metric {
  id: number;
  title: string;
  title_translation?: Record<string, string>;
  description: string;
  description_translation?: Record<string, string>;
  image?: string;
  is_image_rounded_full: boolean;
  is_title_displayed: boolean;
  background_color?: string;
  is_card_type: boolean;
  organization_id: string | null;
}

interface TemplateSectionData {
  id: number;
  background_color?: string;
  is_full_width: boolean;
  is_section_title_aligned_center: boolean;
  is_section_title_aligned_right: boolean;
  section_title: string;
  section_title_translation?: Record<string, string>;
  section_description?: string;
  section_description_translation?: Record<string, string>;
  text_style_variant?: 'default' | 'apple' | 'codedharmony';
  grid_columns: number;
  image_metrics_height?: string;
  is_image_bottom: boolean;
  is_slider?: boolean;
  is_reviews_section: boolean;
  is_help_center_section?: boolean;
  is_real_estate_modal?: boolean;
  is_brand?: boolean;
  is_article_slider?: boolean;
  is_contact_section?: boolean;
  is_faq_section?: boolean;
  is_pricingplans_section?: boolean;
  website_metric: Metric[];
  organization_id: string | null;
}

// Inner component that uses the context
const TemplateSections: React.FC = () => {
  const pathname = usePathname();
  const [sections, setSections] = useState<TemplateSectionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { refreshKey } = useTemplateSectionEdit();

  useEffect(() => {
    const fetchSections = async () => {
      setIsLoading(true);
      setError(null);

      // Ensure pathname is defined and encode it to handle special characters
      if (!pathname) {
        setError('Pathname is undefined');
        setIsLoading(false);
        return;
      }

      // Strip locale from pathname for API call
      const pathSegments = pathname.split('/').filter(Boolean);
      const firstSegment = pathSegments[0];
      const supportedLocales = ['en', 'es', 'fr', 'de', 'ru', 'pt', 'it', 'nl', 'pl', 'ja', 'zh'];
      
      // If first segment is a locale, remove it to get the base path
      const basePath = firstSegment && firstSegment.length === 2 && supportedLocales.includes(firstSegment)
        ? '/' + pathSegments.slice(1).join('/')
        : pathname;
      
      console.log('TemplateSections pathname processing:', {
        originalPathname: pathname,
        pathSegments,
        firstSegment,
        isLocale: supportedLocales.includes(firstSegment),
        basePath
      });

      const encodedPathname = encodeURIComponent(basePath);
      const url = `/api/template-sections?url_page=${encodedPathname}`;
      console.log('Fetching template sections from URL:', url);

      try {
        const response = await fetch(url, {
          method: 'GET',
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Failed to fetch template sections: ${response.statusText} - ${errorData.details || 'No details available'}`);
        }

        const data: TemplateSectionData[] = await response.json();
        console.log('Fetched template sections:', data);
        setSections(data);
      } catch (err) {
        console.error('Error fetching template sections:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSections();
  }, [pathname, refreshKey]); // Added refreshKey dependency

  if (error) {
    return <div className="text-center text-red-500">Error: {error}</div>;
  }

  if (!sections || sections.length === 0) {
    console.log('No sections found for pathname:', pathname);
    return null;
  }

  return (
    <>
      {sections.map(section => (
        <TemplateSection key={section.id} section={section} />
      ))}
    </>
  );
};

export default TemplateSections;