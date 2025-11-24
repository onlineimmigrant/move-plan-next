'use client';

import React, { useEffect, useState, useRef } from 'react';
import FAQSection from '@/components/TemplateSections/FAQSection';
import { getOrganizationId } from '@/lib/supabase';
import { FAQ } from '@/types/faq';

interface FAQSectionWrapperProps {
  section: any; // Template section data (unused but consistent with pattern)
}

// Cache FAQs to prevent refetching
const faqsCache = new Map<string, { faqs: FAQ[]; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const FAQSectionWrapper: React.FC<FAQSectionWrapperProps> = ({ section }) => {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const containerRef = useRef<HTMLDivElement>(null);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (hasLoadedRef.current) return;

    const fetchFAQs = async () => {
      try {
        const organizationId = await getOrganizationId(baseUrl);
        if (!organizationId) {
          setLoading(false);
          hasLoadedRef.current = true;
          return;
        }

        // Check cache first
        const cached = faqsCache.get(organizationId);
        const now = Date.now();
        
        if (cached && (now - cached.timestamp) < CACHE_DURATION) {
          setFaqs(cached.faqs);
          setLoading(false);
          hasLoadedRef.current = true;
          return;
        }

        const response = await fetch(`/api/faqs?organization_id=${organizationId}`);
        if (response.ok) {
          const data = await response.json();
          
          // Cache the result
          faqsCache.set(organizationId, {
            faqs: data,
            timestamp: Date.now(),
          });
          
          setFaqs(data);
          hasLoadedRef.current = true;
        }
      } catch (error) {
        console.error('Error fetching FAQs:', error);
        hasLoadedRef.current = true;
      } finally {
        setLoading(false);
      }
    };

    if (!hasLoadedRef.current) {
      // Use IntersectionObserver to only load when visible
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && !hasLoadedRef.current) {
              fetchFAQs();
              observer.disconnect();
            }
          });
        },
        { rootMargin: '50px' }
      );

      if (containerRef.current) {
        observer.observe(containerRef.current);
      }

      return () => {
        observer.disconnect();
      };
    }
  }, [baseUrl]);

  // Don't show loading spinner here - parent TemplateSections handles skeleton loading
  // Just return null during loading to avoid duplication
  if (loading) {
    return <div ref={containerRef} />;
  }

  if (!faqs || faqs.length === 0) {
    return null;
  }

  return (
    <div ref={containerRef}>
      <FAQSection faqs={faqs} showTitle={true} />
    </div>
  );
};

export default FAQSectionWrapper;
