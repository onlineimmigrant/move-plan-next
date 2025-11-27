// /src/components/UnifiedSections.tsx
// Unified component that combines TemplateSections and TemplateHeadingSections
// and renders them in the correct order based on the `order` field

'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { usePathname } from 'next/navigation';
import TemplateSection from '@/components/TemplateSection';
import TemplateHeadingSection from '@/components/TemplateHeadingSection';
import { getBasePathFromLocale, singleFlight } from '@/lib/pathUtils';
import { TemplateSectionSkeleton } from '@/components/skeletons/TemplateSectionSkeletons';
import { usePageSections } from '@/context/PageSectionsContext';

const CACHE_DURATION = 60000; // 1 minute cache

interface TemplateSection {
  id: string;
  type: 'template_section';
  order: number;
  data: any;
}

interface HeadingSection {
  id: string;
  type: 'heading_section';
  order: number;
  data: any;
}

type UnifiedSection = TemplateSection | HeadingSection;

interface UnifiedSectionsProps {
  initialSections?: any[];
  initialHeadingSections?: any[];
}

const UnifiedSections: React.FC<UnifiedSectionsProps> = ({ 
  initialSections, 
  initialHeadingSections 
}) => {
  const pathname = usePathname();
  const { templateSections: contextSections, templateHeadingSections: contextHeadingSections } = usePageSections();
  
  // Use context data if available (from SSR), otherwise fall back to props
  const serverSections = contextSections.length > 0 ? contextSections : (initialSections || []);
  const serverHeadingSections = contextHeadingSections.length > 0 ? contextHeadingSections : (initialHeadingSections || []);
  
  // Initialize with server-side data if available
  const initialData = useMemo(() => {
    if (serverSections.length === 0 && serverHeadingSections.length === 0) {
      return [];
    }
    
    const combined: UnifiedSection[] = [
      ...serverSections.map((section: any) => ({
        id: section.id,
        type: 'template_section' as const,
        order: section.order || 0,
        data: section,
      })),
      ...serverHeadingSections.map((section: any) => ({
        id: section.id,
        type: 'heading_section' as const,
        order: section.order || 0,
        data: section,
      })),
    ];
    
    return combined.sort((a, b) => a.order - b.order);
  }, [serverSections, serverHeadingSections]);
  
  const [sections, setSections] = useState<UnifiedSection[]>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Client-side cache for sections
  const cachedSections = useRef<Map<string, {
    data: UnifiedSection[];
    timestamp: number;
  }>>(new Map());

  // Use the same basePath logic as TemplateSections
  const basePath = useMemo(() => getBasePathFromLocale(pathname), [pathname]);

  useEffect(() => {
    // Skip fetching if we have initial server data on first load
    if (initialData.length > 0 && sections.length > 0) {
      return;
    }
    
    const fetchSections = async () => {
      // Check client-side cache first
      const cached = cachedSections.current.get(basePath);
      const now = Date.now();
      
      if (cached && now - cached.timestamp < CACHE_DURATION) {
        setSections(cached.data);
        setLoading(false);
        return;
      }

      try {
        // Don't block - start as loaded and update when ready
        const data = await singleFlight<UnifiedSection[]>(`unifiedSections:${basePath}`, async () => {
          // Fetch both template sections and heading sections in parallel
          const [templateResponse, headingResponse] = await Promise.all([
            fetch(`/api/template-sections?url_page=${encodeURIComponent(basePath)}`, {
              method: 'GET',
            }),
            fetch(`/api/template-heading-sections?url_page=${encodeURIComponent(basePath)}`, {
              method: 'GET',
            }),
          ]);

          if (!templateResponse.ok || !headingResponse.ok) {
            throw new Error('Failed to fetch sections');
          }

          const templateSections = await templateResponse.json();
          const headingSections = await headingResponse.json();

          // Combine and tag sections with their type
          const combined: UnifiedSection[] = [
            ...(templateSections || []).map((section: any) => ({
              id: section.id,
              type: 'template_section' as const,
              order: section.order || 0,
              data: section,
            })),
            ...(headingSections || []).map((section: any) => ({
              id: section.id,
              type: 'heading_section' as const,
              order: section.order || 0,
              data: section,
            })),
          ];

          // Sort by order field
          combined.sort((a, b) => a.order - b.order);

          return combined;
        });

        cachedSections.current.set(basePath, { data, timestamp: now });
        setSections(data || []);
      } catch (err) {
        console.error('[UnifiedSections] Error fetching sections:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch sections');
        setSections([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSections();
  }, [basePath, initialData.length, sections.length]);

  // Re-fetch when layout manager updates
  useEffect(() => {
    const handleRefresh = () => {
      const fetchSections = async () => {
        try {
          setLoading(true);
          const data = await singleFlight<UnifiedSection[]>(`unifiedSections-update:${basePath}`, async () => {
            const [templateResponse, headingResponse] = await Promise.all([
              fetch(`/api/template-sections?url_page=${encodeURIComponent(basePath)}`, {
                method: 'GET',
              }),
              fetch(`/api/template-heading-sections?url_page=${encodeURIComponent(basePath)}`, {
                method: 'GET',
              }),
            ]);

            if (!templateResponse.ok || !headingResponse.ok) {
              throw new Error('Failed to fetch sections');
            }

            const templateSections = await templateResponse.json();
            const headingSections = await headingResponse.json();

            const combined: UnifiedSection[] = [
              ...(templateSections || []).map((section: any) => ({
                id: section.id,
                type: 'template_section' as const,
                order: section.order || 0,
                data: section,
              })),
              ...(headingSections || []).map((section: any) => ({
                id: section.id,
                type: 'heading_section' as const,
                order: section.order || 0,
                data: section,
              })),
            ];

            combined.sort((a, b) => a.order - b.order);
            return combined;
          });

          const now = Date.now();
          cachedSections.current.set(basePath, { data, timestamp: now });
          setSections(data || []);
        } catch (err) {
          console.error('[UnifiedSections] Error refreshing sections:', err);
        } finally {
          setLoading(false);
        }
      };

      fetchSections();
    };

    window.addEventListener('templateSectionsUpdated', handleRefresh);
    return () => window.removeEventListener('templateSectionsUpdated', handleRefresh);
  }, [basePath]);

  if (loading) {
    // Don't show loading skeleton to avoid delaying LCP
    return null;
  }

  if (error) {
    return null;
  }

  if (!sections.length) {
    return null;
  }

  return (
    <>
      {sections.map((section, index) => {
        if (section.type === 'template_section') {
          return <TemplateSection key={section.id} section={section.data} />;
        } else {
          // Pass index to determine if this is the first heading section (for LCP optimization)
          return <TemplateHeadingSection key={section.id} templateSectionHeadings={[section.data]} isPriority={index === 0} />;
        }
      })}
    </>
  );
};

export default React.memo(UnifiedSections);
