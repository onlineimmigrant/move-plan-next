// hooks/useTOC.ts - Table of Contents hook

import { useState, useEffect } from 'react';
import { TOCItem } from '../types';

export function useTOC(content: string, isFullScreen: boolean) {
  const [toc, setToc] = useState<TOCItem[]>([]);

  useEffect(() => {
    const extractTOC = (isInitialLoad = false) => {
      console.log('📚 TOC: Attempting extraction, content length:', content?.length, 'isInitialLoad:', isInitialLoad);
      
      // Try multiple selectors for the editor
      const editorContent = document.querySelector('.ProseMirror') || 
                           document.querySelector('[contenteditable="true"]') ||
                           document.querySelector('.tiptap');
      console.log('📚 TOC: Editor found:', !!editorContent);
      
      if (editorContent) {
        const headings = editorContent.querySelectorAll('h1, h2, h3, h4, h5, h6');
        console.log('📚 TOC: Headings found in editor:', headings.length);
        
        if (headings.length > 0) {
          const tocItems: TOCItem[] = Array.from(headings).map((heading, index) => {
            const text = heading.textContent || '';
            const tagName = heading.tagName.toLowerCase();
            const id = heading.id || `heading-${index}`;

            return {
              tag_name: tagName,
              tag_text: text,
              tag_id: id,
            };
          });
          console.log('📚 TOC: Extracted from editor:', tocItems);
          setToc(tocItems);
          return true;
        } else if (!isInitialLoad) {
          // If editor exists but has no headings, and this is not initial load,
          // don't clear existing TOC - the editor might be re-rendering
          console.log('📚 TOC: Editor found but no headings - keeping existing TOC');
          return false;
        }
      }

      // Fallback: parse markdown or HTML content (only on initial load or when no editor found)
      if (!content) {
        console.log('📚 TOC: No content provided');
        if (isInitialLoad) {
          setToc([]);
        }
        return false;
      }

      // Try to parse as markdown first
      const markdownHeadingRegex = /^(#{1,6})\s+(.+)$/gm;
      const markdownMatches = [...content.matchAll(markdownHeadingRegex)];
      
      if (markdownMatches.length > 0) {
        const tocItems: TOCItem[] = markdownMatches.map((match, index) => {
          const level = match[1].length; // Number of # characters
          const text = match[2].trim();
          const tagName = `h${level}`;
          const id = `heading-${index}`;

          return {
            tag_name: tagName,
            tag_text: text,
            tag_id: id,
          };
        });
        console.log('📚 TOC: Extracted from markdown:', tocItems);
        setToc(tocItems);
        return true;
      }

      // Fallback to HTML parsing
      const parser = new DOMParser();
      const doc = parser.parseFromString(content, 'text/html');
      const headings = doc.body.querySelectorAll('h1, h2, h3, h4, h5, h6');
      
      console.log('📚 TOC: Headings found in HTML content:', headings.length);

      if (headings.length > 0) {
        const tocItems: TOCItem[] = Array.from(headings).map((heading, index) => {
          const text = heading.textContent || '';
          const tagName = heading.tagName.toLowerCase();
          const id = heading.id || `heading-${index}`;

          return {
            tag_name: tagName,
            tag_text: text,
            tag_id: id,
          };
        });

        console.log('📚 TOC: Extracted from HTML:', tocItems);
        setToc(tocItems);
        return true;
      } else if (isInitialLoad) {
        // Only clear TOC on initial load if no headings found anywhere
        setToc([]);
      }
      
      return false;
    };

    // Initial extraction with retry logic
    const attemptExtraction = () => {
      const success = extractTOC(true);
      
      // If no TOC found, retry multiple times to wait for editor to render
      if (!success) {
        setTimeout(() => extractTOC(false), 300);
        setTimeout(() => extractTOC(false), 800);
        setTimeout(() => extractTOC(false), 1500);
      }
    };

    attemptExtraction();

    // Re-extract TOC when editor content changes (using MutationObserver)
    const setupObserver = () => {
      const editorContent = document.querySelector('.ProseMirror') || 
                           document.querySelector('[contenteditable="true"]') ||
                           document.querySelector('.tiptap');
      if (editorContent) {
        console.log('📚 TOC: Setting up MutationObserver on editor');
        const observer = new MutationObserver(() => {
          console.log('📚 TOC: Editor content changed, re-extracting');
          // Don't pass isInitialLoad flag - we want to preserve TOC if headings temporarily disappear
          extractTOC(false);
        });
        observer.observe(editorContent, {
          childList: true,
          subtree: true,
          characterData: true, // Also watch for text changes
        });
        return observer;
      }
      return null;
    };

    // Try to setup observer immediately
    let observer = setupObserver();

    // If observer not found initially, keep retrying
    if (!observer) {
      const retryIntervals = [500, 1000, 2000, 3000];
      const timeouts = retryIntervals.map(delay => 
        setTimeout(() => {
          if (!observer) {
            observer = setupObserver();
            if (observer) {
              console.log('📚 TOC: Observer setup successful after retry');
            }
          }
        }, delay)
      );
      
      return () => {
        timeouts.forEach(clearTimeout);
        observer?.disconnect();
      };
    }

    return () => observer?.disconnect();
  }, [content]);

  const handleScrollTo = (id: string) => {
    const editorContent = document.querySelector('.ProseMirror');
    if (!editorContent) return;

    const headings = editorContent.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let targetHeading: Element | null = editorContent.querySelector(`#${CSS.escape(id)}`);

    if (!targetHeading) {
      const tocItem = toc.find(item => item.tag_id === id);
      if (tocItem) {
        targetHeading = Array.from(headings).find(h =>
          h.textContent?.trim() === tocItem.tag_text.trim()
        ) || null;
      }
    }

    if (targetHeading) {
      targetHeading.scrollIntoView({ behavior: 'smooth', block: 'center' });
      targetHeading.classList.add('ring-2', 'ring-sky-500', 'rounded');
      setTimeout(() => {
        targetHeading?.classList.remove('ring-2', 'ring-sky-500', 'rounded');
      }, 2000);
    }
  };

  return { toc, handleScrollTo };
}
