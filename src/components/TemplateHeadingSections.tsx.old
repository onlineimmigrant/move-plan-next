// /src/components/TemplateHeadingSections.tsx
'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import TemplateHeadingSection from './TemplateHeadingSection';
import { useTemplateHeadingSectionEdit } from '@/components/modals/TemplateHeadingSectionModal/context';
import { getBasePathFromLocale, singleFlight } from '@/lib/pathUtils';

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
  organization_id: string | null;
}

// Inner component that uses the context
const TemplateHeadingSections: React.FC = () => {
  const pathname = usePathname();
  const [headings, setHeadings] = useState<TemplateHeadingSectionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { refreshKey } = useTemplateHeadingSectionEdit();
  const cachedHeadings = useRef<Map<string, { data: TemplateHeadingSectionData[]; timestamp: number }>>(new Map());
  const CACHE_DURATION = 60000; // 60s client cache
  const basePath = useMemo(() => getBasePathFromLocale(pathname), [pathname]);

  useEffect(() => {
    const fetchHeadings = async () => {
      const now = Date.now();
      const cached = cachedHeadings.current.get(basePath);
      if (cached && now - cached.timestamp < CACHE_DURATION && !refreshKey) {
        setHeadings(cached.data);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      if (!pathname) {
        setError('Pathname is undefined');
        setIsLoading(false);
        return;
      }
      const encoded = encodeURIComponent(basePath);
      const url = `/api/template-heading-sections?url_page=${encoded}`;
      try {
        const data = await singleFlight<TemplateHeadingSectionData[]>(`templateHeadingSections:${basePath}`, async () => {
          const response = await fetch(url, { method: 'GET' });
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`Failed to fetch template heading sections: ${response.status} - ${errorData.details || response.statusText}`);
          }
          return response.json();
        });
        cachedHeadings.current.set(basePath, { data, timestamp: now });
        setHeadings(data);
      } catch (err) {
        console.error('Error fetching template heading sections:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };
    fetchHeadings();
  }, [basePath, refreshKey]);

  if (error) {
    return (
      <div className="text-center text-red-500">
        <p>Error: {error}</p>
        <p>Please try refreshing the page or contact support if the issue persists.</p>
      </div>
    );
  }

  if (!headings || headings.length === 0) {
    return null;
  }

  return (
    <>
      <TemplateHeadingSection templateSectionHeadings={headings} />
    </>
  );
};

export default TemplateHeadingSections;