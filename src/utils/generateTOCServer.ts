/**
 * Server-side TOC generation
 * Runs during SSR/SSG - no DOMParser needed
 */

export interface TOCItem {
  tag_name: string;
  tag_text: string;
  tag_id: string;
}

/**
 * Generate TOC from markdown content (server-side)
 * Parses markdown headings without rendering
 * 
 * @param content - Markdown content string
 * @returns Array of TOC items
 */
export function generateTOCFromMarkdown(content: string | undefined): TOCItem[] {
  if (!content) return [];
  
  const tocItems: TOCItem[] = [];
  const lines = content.split('\n');
  
  lines.forEach((line, index) => {
    const match = line.match(/^(#{1,6})\s+(.+)/);
    if (match) {
      const level = match[1].length;
      const text = match[2].trim();
      const id = `heading-${index}-${text.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
      
      tocItems.push({
        tag_name: `h${level}`,
        tag_text: text,
        tag_id: id,
      });
    }
  });
  
  return tocItems;
}

/**
 * Generate TOC from HTML content (server-side)
 * Uses regex parsing instead of DOMParser
 * 
 * @param content - HTML content string
 * @returns Array of TOC items
 */
export function generateTOCFromHTML(content: string | undefined): TOCItem[] {
  if (!content) return [];
  
  const tocItems: TOCItem[] = [];
  
  // Match heading tags with optional existing IDs
  const headingRegex = /<(h[1-6])(?:\s+id=["']([^"']+)["'])?[^>]*>(.*?)<\/\1>/gi;
  let match;
  let index = 0;
  
  while ((match = headingRegex.exec(content)) !== null) {
    const tagName = match[1].toLowerCase();
    const existingId = match[2];
    const tagText = match[3].replace(/<[^>]+>/g, '').trim(); // Strip HTML tags
    const tagId = existingId || `${tagName}-${index + 1}`;
    
    tocItems.push({
      tag_name: tagName,
      tag_text: tagText,
      tag_id: tagId,
    });
    
    index++;
  }
  
  return tocItems;
}

/**
 * Universal TOC generator (server-side)
 * Automatically detects content type
 * 
 * @param content - Content string (HTML or Markdown)
 * @param contentType - Content type ('html' or 'markdown')
 * @returns Array of TOC items
 */
export function generateTOCServer(
  content: string | undefined,
  contentType: 'html' | 'markdown' = 'html'
): TOCItem[] {
  if (contentType === 'markdown') {
    return generateTOCFromMarkdown(content);
  }
  return generateTOCFromHTML(content);
}
