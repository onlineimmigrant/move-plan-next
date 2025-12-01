'use client';

import { useMemo, useEffect, useRef, useCallback } from 'react';
import { generateTOC, applyTOCIds, type TOCItem } from '@/utils/generateTOC';
import { debug } from '@/utils/debug';

interface Post {
  content?: string;
  content_type?: 'html' | 'markdown';
  slug: string;
}

/**
 * Custom hook for TOC generation and navigation
 * Extracts TOC logic from PostPageClient for better organization
 * 
 * @param post - Post data containing content and content type
 * @returns TOC items, scroll handler, and content ref
 */
export function usePostPageTOC(post: Post | null) {
  const contentRef = useRef<HTMLDivElement>(null);

  // Generate TOC using utility function
  const toc: TOCItem[] = useMemo(() => {
    if (!post?.content) return [];
    
    // If content is Markdown, extract headings directly from markdown text
    if (post.content_type === 'markdown') {
      try {
        // Parse markdown headings without rendering (much lighter)
        const headings: TOCItem[] = [];
        const lines = post.content.split('\n');
        
        lines.forEach((line, index) => {
          const match = line.match(/^(#{1,6})\s+(.+)/);
          if (match) {
            const level = match[1].length;
            const text = match[2].trim();
            const id = `heading-${index}-${text.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
            
            headings.push({
              tag_name: `h${level}`,
              tag_text: text,
              tag_id: id,
            });
          }
        });
        
        return headings;
      } catch (error) {
        debug.error('PostPage', 'Error parsing markdown headings:', error);
        return [];
      }
    }
    
    // For HTML content, use directly
    return generateTOC(post.content);
  }, [post?.content, post?.content_type]);

  // Apply IDs to rendered headings to match TOC (only for HTML)
  useEffect(() => {
    if (!contentRef.current || toc.length === 0) {
      debug.log('usePostPageTOC', '⏭️ Skipping ID application:', { 
        hasContentRef: !!contentRef.current, 
        tocLength: toc.length 
      });
      return;
    }

    // For markdown content, wait longer for LazyMarkdownRenderer's Suspense to resolve
    const isMarkdown = post?.content_type === 'markdown';
    const delay = isMarkdown ? 500 : 100;

    // Retry mechanism to handle lazy-loaded content
    let attempts = 0;
    const maxAttempts = isMarkdown ? 10 : 3;
    
    const applyIds = () => {
      if (!contentRef.current) return;
      
      const headings = contentRef.current.querySelectorAll('h1, h2, h3, h4, h5, h6');
      
      // If we still don't have headings and have attempts left, retry
      if (headings.length === 0 && attempts < maxAttempts) {
        attempts++;
        debug.log('usePostPageTOC', `⏳ Retry ${attempts}/${maxAttempts} - waiting for headings to render...`);
        setTimeout(applyIds, delay);
        return;
      }
      
      // Apply IDs once headings are available
      if (headings.length > 0) {
        applyTOCIds(contentRef.current, toc);
      } else {
        debug.warn('usePostPageTOC', '⚠️ No headings found after', maxAttempts, 'attempts');
      }
    };

    const timeoutId = setTimeout(applyIds, delay);

    return () => clearTimeout(timeoutId);
  }, [toc, post?.content, post?.content_type]);

  // Memoized scroll handler
  const handleScrollTo = useCallback((id: string) => {
    debug.log('usePostPageTOC', 'Attempting to scroll to ID:', id);
    
    // First try to find by ID
    let element = document.getElementById(id);
    
    // If not found, try to find the heading by matching it with TOC
    if (!element && contentRef.current) {
      const headings = contentRef.current.querySelectorAll('h1, h2, h3, h4, h5');
      const allHeadings = Array.from(headings);
      
      debug.group('usePostPageTOC', 'All headings in DOM', () => {
        allHeadings.forEach((h, i) => {
          debug.log('usePostPageTOC', `  ${i}: ${h.tagName.toLowerCase()} - ID: ${h.id || '(none)'} - Text: ${h.textContent?.substring(0, 50)}`);
        });
      });
      
      // Find the matching heading from TOC
      const tocIndex = toc.findIndex(t => t.tag_id === id);
      if (tocIndex !== -1 && allHeadings[tocIndex]) {
        element = allHeadings[tocIndex] as HTMLElement;
        // Apply the ID so it works next time
        element.id = id;
        debug.log('usePostPageTOC', '✅ Found heading by index, applied ID:', id);
      }
    }
    
    if (element) {
      debug.log('usePostPageTOC', 'Scrolling to element');
      const yOffset = -100;
      const yPosition = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: yPosition, behavior: 'smooth' });
    } else {
      debug.error('usePostPageTOC', '❌ Element not found for ID:', id);
      debug.error('usePostPageTOC', 'Available IDs:', 
        Array.from(document.querySelectorAll('[id]')).map(el => el.id).filter(Boolean)
      );
    }
  }, [toc]);

  return {
    toc,
    handleScrollTo,
    contentRef,
  };
}
