// src/components/TemplateSections.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import TemplateSection from './TemplateSection';

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

const TemplateSections: React.FC = () => {
  const pathname = usePathname();
  const [sections, setSections] = useState<TemplateSectionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

      const encodedPathname = encodeURIComponent(pathname);
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
  }, [pathname]);

  if (isLoading) {
    return <div className="py-32 text-center text-gray-500">Loading sections...</div>;
  }

  if (error) {
    return <div className="py-32 text-center text-red-500">Error: {error}</div>;
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