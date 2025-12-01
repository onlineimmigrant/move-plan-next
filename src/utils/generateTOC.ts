import { debug } from './debug';

export interface TOCItem {
  tag_name: string;
  tag_text: string;
  tag_id: string;
}

/**
 * Generate table of contents from HTML content
 * Parses h1-h5 headings and assigns IDs if missing
 * 
 * @param content - HTML content string to parse
 * @returns Array of TOC items with tag name, text, and ID
 */
export function generateTOC(content: string | undefined): TOCItem[] {
  // Only run in browser environment
  if (typeof window === 'undefined') {
    debug.warn('generateTOC', 'Called in SSR environment, returning empty array');
    return [];
  }

  if (!content) {
    debug.log('generateTOC', 'No content provided');
    return [];
  }
  
  const tocItems: TOCItem[] = [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(content, 'text/html');
  const headings = doc.querySelectorAll('h1, h2, h3, h4, h5');

  debug.emoji('generateTOC', '🔍', 'Total headings found:', headings.length);

  headings.forEach((heading, index) => {
    const tagName = heading.tagName.toLowerCase();
    const tagText = heading.textContent || '';
    const tagId = heading.id || `${tagName}-${index + 1}`;

    // Assign ID to heading if it doesn't have one
    if (!heading.id) {
      heading.id = tagId;
    }

    debug.log('generateTOC', `  ${index + 1}. ${tagName.toUpperCase()}: "${tagText}" → ID: "${tagId}"`);

    tocItems.push({
      tag_name: tagName,
      tag_text: tagText,
      tag_id: tagId,
    });
  });

  debug.emoji('generateTOC', '📋', 'Generated TOC items:', tocItems.length);
  return tocItems;
}

/**
 * Apply TOC IDs to rendered DOM headings
 * Ensures rendered headings have matching IDs from TOC generation
 * 
 * @param contentElement - The DOM element containing the rendered content
 * @param toc - The TOC items with expected IDs
 */
export function applyTOCIds(contentElement: HTMLElement, toc: TOCItem[]): void {
  if (toc.length === 0) {
    debug.log('applyTOCIds', '⏭️ Skipping - no TOC items');
    return;
  }

  debug.emoji('applyTOCIds', '🔧', 'Applying IDs to rendered DOM...');
  const headings = contentElement.querySelectorAll('h1, h2, h3, h4, h5, h6');
  
  debug.log('applyTOCIds', '  Total rendered headings:', headings.length);
  debug.log('applyTOCIds', '  TOC expects', toc.length, 'headings');
  
  if (headings.length === 0) {
    debug.warn('applyTOCIds', '⚠️ No headings found in DOM - content may not be rendered yet');
    return;
  }
  
  if (headings.length !== toc.length) {
    debug.warn('applyTOCIds', '⚠️ MISMATCH: DOM has', headings.length, 'headings but TOC has', toc.length);
    debug.log('applyTOCIds', 'This is normal if some headings are in collapsed sections or lazy-loaded');
  }
  
  headings.forEach((heading, index) => {
    const tagName = heading.tagName.toLowerCase();
    const oldId = heading.id;
    
    // Use TOC ID if available, otherwise generate one
    const expectedId = toc[index]?.tag_id || `${tagName}-${index + 1}`;
    
    // Set ID to match TOC
    heading.id = expectedId;
    debug.log('applyTOCIds', `  ${index + 1}. ${tagName.toUpperCase()}: ${oldId ? `"${oldId}"` : '(no id)'} → "${expectedId}"`);
  });
  
  debug.log('applyTOCIds', '✅ Applied', headings.length, 'IDs to DOM headings');
}
