// /src/components/TemplateHeadingSections.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import TemplateHeadingSection from './TemplateHeadingSection';

interface TemplateHeadingSectionData {
  id: number;
  name: string;
  name_part_2?: string;
  name_part_3?: string;
  description_text?: string;
  button_text?: string;
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
  organization_id: string | null; // Added
}

const TemplateHeadingSections: React.FC = () => {
  const pathname = usePathname();
  const [headings, setHeadings] = useState<TemplateHeadingSectionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHeadings = async () => {
      setIsLoading(true);
      setError(null);

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
      
      console.log('Pathname processing:', {
        originalPathname: pathname,
        pathSegments,
        firstSegment,
        isLocale: supportedLocales.includes(firstSegment),
        basePath
      });

      const encodedPathname = encodeURIComponent(basePath);
      const url = `/api/template-heading-sections?url_page=${encodedPathname}`;
      console.log('Fetching template heading sections from URL:', url);

      try {
        const response = await fetch(url, { method: 'GET' });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Failed to fetch template heading sections: ${response.statusText} - ${errorData.details || 'No details available'}`);
        }

        const data: TemplateHeadingSectionData[] = await response.json();
        console.log('Fetched template heading sections:', data);
        setHeadings(data);
      } catch (err) {
        console.error('Error fetching template heading sections:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchHeadings();
  }, [pathname]);



  if (error) {
    return (
      <div className="text-center text-red-500">
        <p>Error: {error}</p>
        <p>Please try refreshing the page or contact support if the issue persists.</p>
      </div>
    );
  }

  if (!headings || headings.length === 0) {
    console.log('No heading sections found for pathname:', pathname);
    return null;
  }

  return <TemplateHeadingSection templateSectionHeadings={headings} />;
};

export default TemplateHeadingSections;