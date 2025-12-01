// /src/components/TemplateSections.tsx
'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { usePathname } from 'next/navigation';
import TemplateSection from './TemplateSection';
import { useTemplateSectionEdit } from '@/components/modals/TemplateSectionModal/context';
import { TemplateSectionSkeleton } from '@/components/skeletons/TemplateSectionSkeletons';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { debug } from '@/lib/debug';
import { getBasePathFromLocale, singleFlight } from '@/lib/pathUtils';

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
  
  // Consolidated section type field
  section_type?: 'general' | 'brand' | 'article_slider' | 'contact' | 'faq' | 'reviews' | 'help_center' | 'real_estate' | 'pricing_plans' | 'appointment' | 'form_harmony';
  
  // Form harmony
  form_id?: string | null;
  
  // DEPRECATED - Keep for backward compatibility
  is_reviews_section: boolean;
  
  website_metric: Metric[];
  organization_id: string | null;
}

// Constants
const CACHE_DURATION = 60000; // 60 seconds

// Inner component that uses the context
const TemplateSections: React.FC = () => {
  const pathname = usePathname();
  const [sections, setSections] = useState<TemplateSectionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { refreshKey } = useTemplateSectionEdit();
  
  // Client-side cache for sections
  const cachedSections = useRef<Map<string, {
    data: TemplateSectionData[];
    timestamp: number;
  }>>(new Map());

  // Memoize locale parsing to avoid recalculation on every render
  const basePath = useMemo(() => getBasePathFromLocale(pathname), [pathname]);

  useEffect(() => {
    const fetchSections = async () => {
      // Check client-side cache first (unless refreshKey changed)
      const cached = cachedSections.current.get(basePath);
      const now = Date.now();
      
      if (cached && now - cached.timestamp < CACHE_DURATION && !refreshKey) {
        debug.log('Using cached sections for:', basePath);
        setSections(cached.data);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      // Ensure pathname is defined and encode it to handle special characters
      if (!pathname) {
        setError('Pathname is undefined');
        setIsLoading(false);
        return;
      }

      const encodedPathname = encodeURIComponent(basePath);
      const url = `/api/template-sections?url_page=${encodedPathname}`;

      try {
        const data = await singleFlight<TemplateSectionData[]>(`templateSections:${basePath}`, async () => {
          const response = await fetch(url, {
            method: 'GET'
          });
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`Failed to fetch template sections: ${response.status} - ${errorData.details || response.statusText}`);
          }
          return response.json();
        });

        cachedSections.current.set(basePath, { data, timestamp: now });
        setSections(data);
      } catch (err) {
        console.error('Error fetching template sections:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSections();
  }, [refreshKey, basePath]);

  // Listen for template-section-updated events (EXACTLY like Hero component does)
  useEffect(() => {
    const handleSectionUpdate = async (_event: Event) => {
      const customEvent = event as CustomEvent;
      // Received template-section-updated event
      
      // Fetch fresh data from API to ensure we have the latest (EXACTLY like Hero does)
      if (!pathname) return;
      
      try {
        const encodedPathname = encodeURIComponent(basePath);
        const url = `/api/template-sections?url_page=${encodedPathname}&t=${Date.now()}`; // Add timestamp to bypass cache
        
        // Fetching fresh sections after update
        
        const data = await singleFlight<TemplateSectionData[]>(`templateSections-update:${basePath}`, async () => {
          const response = await fetch(url, {
            method: 'GET',
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache'
            }
          });
          if (!response.ok) return [];
          return response.json();
        });

        if (data && data.length) {
          cachedSections.current.set(basePath, { data, timestamp: Date.now() });
          setSections(data);
        }
      } catch (err) {
        console.error('[TemplateSections] Error fetching updated sections:', err);
      }
    };

    window.addEventListener('template-section-updated', handleSectionUpdate);
    window.addEventListener('template-heading-section-updated', handleSectionUpdate);

    return () => {
      window.removeEventListener('template-section-updated', handleSectionUpdate);
      window.removeEventListener('template-heading-section-updated', handleSectionUpdate);
    };
  }, [pathname, basePath]);

  if (isLoading) {
    // Don't show loading skeleton on landing pages to avoid distraction
    if (typeof document !== 'undefined' && document.body.getAttribute('data-landing-page') === 'true') {
      return null;
    }
    return (
      <>
        {/* Show 3 general section skeletons while loading */}
        <TemplateSectionSkeleton sectionType="general" count={3} />
      </>
    );
  }

  if (error) {
    return <div className="text-center text-red-500">Error: {error}</div>;
  }

  if (!sections || sections.length === 0) {
    // debug.log('No sections found for pathname:', pathname);
    return null;
  }

  return (
    <>
      {sections.map(section => (
        <ErrorBoundary 
          key={section.id}
          fallback={
            <div className="p-8 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800">Failed to load section: {section.section_title || 'Untitled'}</p>
            </div>
          }
        >
          <TemplateSection section={section} />
        </ErrorBoundary>
      ))}
    </>
  );
};

export default TemplateSections;