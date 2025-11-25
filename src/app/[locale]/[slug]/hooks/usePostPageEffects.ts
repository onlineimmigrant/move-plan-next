'use client';

import { useEffect, useState, useMemo } from 'react';
import { getBaseUrl } from '@/lib/utils';
import { debug } from '@/utils/debug';

interface Post {
  slug: string;
  content?: string;
}

/**
 * Custom hook for managing lifecycle effects
 * Handles hash navigation, post updates, template sections, and touch events
 * 
 * @param post - Current post data
 * @param slug - Post slug for API calls
 * @returns Template sections state and content checks
 */
export function usePostPageEffects(post: Post | null, slug: string) {
  const [hasTemplateSections, setHasTemplateSections] = useState(false);

  // Handle hash navigation on page load and slug changes
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      // Reduced delay for faster hash navigation
      setTimeout(() => {
        const hash = window.location.hash.substring(1);
        const element = document.getElementById(hash);
        if (element) {
          const yOffset = -100;
          const yPosition = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
          window.scrollTo({ top: yPosition, behavior: 'smooth' });
        }
      }, 100); // Reduced from 300ms to 100ms
    }
  }, [post?.slug]); // Added dependency to trigger on page navigation

  // Listen for post-updated events (like Hero component does)
  useEffect(() => {
    const handlePostUpdate = (event: Event) => {
      const customEvent = event as CustomEvent;
      debug.log('usePostPageEffects', 'Received post-updated event:', customEvent.detail);
      
      // Reload the page to fetch fresh post data
      window.location.reload();
    };

    window.addEventListener('post-updated', handlePostUpdate);

    return () => {
      window.removeEventListener('post-updated', handlePostUpdate);
    };
  }, []);

  // Check if there are any template sections or headings for this page
  useEffect(() => {
    const checkTemplateSections = async () => {
      try {
        const clientBaseUrl = getBaseUrl(false);
        const urlPage = `/${slug}`;
        
        const [sectionsResponse, headingsResponse] = await Promise.all([
          fetch(`${clientBaseUrl}/api/template-sections?url_page=${encodeURIComponent(urlPage)}`),
          fetch(`${clientBaseUrl}/api/template-heading-sections?url_page=${encodeURIComponent(urlPage)}`),
        ]);

        if (sectionsResponse.ok && headingsResponse.ok) {
          const sectionsData = await sectionsResponse.json();
          const headingsData = await headingsResponse.json();
          
          const hasSections = sectionsData.length > 0 || headingsData.length > 0;
          debug.log('usePostPageEffects', 'Template sections check:', { 
            sections: sectionsData.length, 
            headings: headingsData.length,
            hasSections 
          });
          setHasTemplateSections(hasSections);
        }
      } catch (error) {
        debug.error('usePostPageEffects', 'Error checking template sections:', error);
      }
    };

    checkTemplateSections();
  }, [slug]);

  // Touch handler for table scrolling
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      const wrapper = (e.target as HTMLElement).closest('.table-wrapper') as HTMLElement;
      if (!wrapper) return;

      const startX = e.touches[0].clientX;
      const scrollStart = wrapper.scrollLeft;

      const handleTouchMove = (moveEvent: TouchEvent) => {
        moveEvent.preventDefault();
        moveEvent.stopPropagation();
        const currentX = moveEvent.touches[0].clientX;
        const deltaX = startX - currentX;
        wrapper.scrollLeft = scrollStart + deltaX;
      };

      const handleTouchEnd = () => {
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };

      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: false });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
    };
  }, []);

  const shouldShowMainContent = useMemo(() => 
    post && ((post.content && post.content.length > 0) || hasTemplateSections),
    [post, hasTemplateSections]
  );

  const shouldShowNoContentMessage = useMemo(() =>
    post && 
    (!post.content || post.content.length === 0) &&
    !hasTemplateSections,
    [post, hasTemplateSections]
  );

  return {
    hasTemplateSections,
    shouldShowMainContent,
    shouldShowNoContentMessage,
  };
}
