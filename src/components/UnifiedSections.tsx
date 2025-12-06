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
import { useSettings } from '@/context/SettingsContext';

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
  initialPathname?: string;
}

const UnifiedSections: React.FC<UnifiedSectionsProps> = ({ 
  initialSections, 
  initialHeadingSections,
  initialPathname
}) => {
  const { settings } = useSettings();
  const organizationId = settings?.organization_id || null;
  
  // Initialize with SSR data when available (eliminates initial fetch)
  const initialData = useMemo(() => {
    if ((initialSections && initialSections.length > 0) || (initialHeadingSections && initialHeadingSections.length > 0)) {
      const combined: UnifiedSection[] = [
        ...(initialSections || []).map((section: any) => ({
          id: section.id,
          type: 'template_section' as const,
          order: section.order || 0,
          data: section,
        })),
        ...(initialHeadingSections || []).map((section: any) => ({
          id: section.id,
          type: 'heading_section' as const,
          order: section.order || 0,
          data: section,
        })),
      ];
      combined.sort((a, b) => a.order - b.order);
      return combined;
    }
    return [];
  }, [initialSections, initialHeadingSections]);
  
  const [sections, setSections] = useState<UnifiedSection[]>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Client-side cache for sections
  const cachedSections = useRef<Map<string, {
    data: UnifiedSection[];
    timestamp: number;
  }>>(new Map());

  // Track live pathname for client-side navigations (RootLayout does not remount)
  const livePathname = usePathname();

  // Resolve effective pathname: prefer client value after hydration
  const effectivePathname = livePathname || initialPathname || '/';

  // Compute basePath from effective pathname (strip locale prefix)
  const basePath = useMemo(() => {
    const computed = getBasePathFromLocale(effectivePathname);
    console.log('[UnifiedSections] Computing basePath:', { initialPathname, livePathname, effectivePathname, computed });
    return computed;
  }, [effectivePathname, initialPathname, livePathname]);

  useEffect(() => {
    // Skip fetch if SSR data is already present
    if (initialData.length > 0) {
      console.log('[UnifiedSections] Using SSR data, skipping initial fetch');
      return;
    }
    
    const fetchSections = async () => {
      console.log('[UnifiedSections] Fetching sections for basePath:', basePath, 'orgId:', organizationId);
      // Multi-tenant/locale-aware cache key
      const cacheKey = `${basePath}:${organizationId || 'null'}`;
      const cached = cachedSections.current.get(cacheKey);
      const now = Date.now();
      
      if (cached && now - cached.timestamp < CACHE_DURATION) {
        setSections(cached.data);
        setLoading(false);
        return;
      }

      try {
        // Don't block - start as loaded and update when ready
        const data = await singleFlight<UnifiedSection[]>(`unifiedSections:${basePath}:${organizationId}`, async () => {
          // Fetch both template sections and heading sections in parallel
          const orgParam = organizationId ? `&organizationId=${encodeURIComponent(organizationId)}` : '';
          const [templateResponse, headingResponse] = await Promise.all([
            fetch(`/api/template-sections?url_page=${encodeURIComponent(basePath)}${orgParam}`, {
              method: 'GET',
            }),
            fetch(`/api/template-heading-sections?url_page=${encodeURIComponent(basePath)}${orgParam}`, {
              method: 'GET',
            }),
          ]);

          if (!templateResponse.ok || !headingResponse.ok) {
            throw new Error('Failed to fetch sections');
          }

          const templateSections = await templateResponse.json();
          const headingSections = await headingResponse.json();

          console.log('[UnifiedSections] Fetched data:', { 
            basePath, 
            templateCount: templateSections?.length || 0, 
            headingCount: headingSections?.length || 0,
            templateSections: templateSections?.map((s: any) => ({ id: s.id, url_page: s.url_page })),
            headingSections: headingSections?.map((s: any) => ({ id: s.id, url_page: s.url_page }))
          });

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

        const cacheKey = `${basePath}:${organizationId || 'null'}`;
        cachedSections.current.set(cacheKey, { data, timestamp: now });
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
  }, [basePath, organizationId, initialData.length]);

  // Re-fetch when layout manager updates
  useEffect(() => {
    const handleRefresh = () => {
      const fetchSections = async () => {
        try {
          setLoading(true);
          const orgParam = organizationId ? `&organizationId=${encodeURIComponent(organizationId)}` : '';
          const data = await singleFlight<UnifiedSection[]>(`unifiedSections-update:${basePath}:${organizationId}`, async () => {
            const [templateResponse, headingResponse] = await Promise.all([
              fetch(`/api/template-sections?url_page=${encodeURIComponent(basePath)}${orgParam}`, {
                method: 'GET',
              }),
              fetch(`/api/template-heading-sections?url_page=${encodeURIComponent(basePath)}${orgParam}`, {
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
          const cacheKey = `${basePath}:${organizationId || 'null'}`;
          cachedSections.current.set(cacheKey, { data, timestamp: now });
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
  }, [basePath, organizationId]);

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
