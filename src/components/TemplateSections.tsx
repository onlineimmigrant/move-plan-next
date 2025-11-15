// /src/components/TemplateSections.tsx
'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { usePathname } from 'next/navigation';
import TemplateSection from './TemplateSection';
import { useTemplateSectionEdit } from '@/components/modals/TemplateSectionModal/context';
import { TemplateSectionSkeleton } from '@/components/skeletons/TemplateSectionSkeletons';
import { debug } from '@/lib/debug';

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
  section_type?: 'general' | 'brand' | 'article_slider' | 'contact' | 'faq' | 'reviews' | 'help_center' | 'real_estate' | 'pricing_plans' | 'appointment';
  
  // DEPRECATED - Keep for backward compatibility
  is_reviews_section: boolean;
  
  website_metric: Metric[];
  organization_id: string | null;
}

// Constants
const SUPPORTED_LOCALES = ['en', 'es', 'fr', 'de', 'ru', 'pt', 'it', 'nl', 'pl', 'ja', 'zh'];
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
  const basePath = useMemo(() => {
    if (!pathname) return '/';
    
    const pathSegments = pathname.split('/').filter(Boolean);
    const firstSegment = pathSegments[0];
    
    // If first segment is a locale, remove it to get the base path
    return firstSegment && firstSegment.length === 2 && SUPPORTED_LOCALES.includes(firstSegment)
      ? '/' + pathSegments.slice(1).join('/')
      : pathname;
  }, [pathname]);

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
      
      debug.log('Fetching template sections:', {
        pathname,
        basePath,
        url: `/api/template-sections?url_page=${encodedPathname}`
      });

      try {
        const response = await fetch(url, {
          method: 'GET',
          next: { revalidate: 60 } // Cache for 60 seconds on server
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Failed to fetch template sections: ${response.statusText} - ${errorData.details || 'No details available'}`);
        }

        const data: TemplateSectionData[] = await response.json();
        debug.log('Fetched template sections:', data.length, 'sections');
        
        // Update client-side cache
        cachedSections.current.set(basePath, {
          data,
          timestamp: now
        });
        setSections(data);
      } catch (err) {
        console.error('Error fetching template sections:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSections();
  }, [pathname, refreshKey, basePath]); // Added refreshKey and basePath dependencies

  // Listen for template-section-updated events (EXACTLY like Hero component does)
  useEffect(() => {
    const handleSectionUpdate = async (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log('[TemplateSections] Received template-section-updated event:', customEvent.detail);
      
      // Fetch fresh data from API to ensure we have the latest (EXACTLY like Hero does)
      if (!pathname) return;
      
      try {
        const encodedPathname = encodeURIComponent(basePath);
        const url = `/api/template-sections?url_page=${encodedPathname}&t=${Date.now()}`; // Add timestamp to bypass cache
        
        console.log('[TemplateSections] Fetching fresh sections after update from:', url);
        
        const response = await fetch(url, {
          method: 'GET',
          cache: 'no-store', // Force fresh data
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        });

        if (response.ok) {
          const data: TemplateSectionData[] = await response.json();
          console.log('[TemplateSections] Fetched fresh sections after update:', data.length);
          
          // Update client-side cache with fresh data
          cachedSections.current.set(basePath, {
            data,
            timestamp: Date.now()
          });
          setSections(data);
        } else {
          console.error('[TemplateSections] Failed to fetch updated sections:', response.status);
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
    debug.log('No sections found for pathname:', pathname);
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