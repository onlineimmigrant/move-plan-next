import DOMPurify from 'dompurify';

/**
 * Sanitize HTML content to prevent XSS attacks
 * Use this before rendering user-generated HTML content
 */
export function sanitizeHTML(html: string): string {
  // DOMPurify works in browser environment
  if (typeof window === 'undefined') {
    // Server-side: return as-is (should only be used client-side)
    console.warn('sanitizeHTML called on server-side, skipping sanitization');
    return html;
  }
  
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 's', 'a', 'img',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'blockquote', 'code', 'pre',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'div', 'span', 'hr'
    ],
    ALLOWED_ATTR: [
      'href', 'src', 'alt', 'title', 'width', 'height',
      'style', 'class', 'id', 'target', 'rel'
    ],
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  });
}

/**
 * Sanitize HTML for email templates with stricter rules
 * Removes potentially dangerous attributes and scripts
 */
export function sanitizeEmailTemplate(html: string): string {
  // DOMPurify works in browser environment
  if (typeof window === 'undefined') {
    // Server-side: return as-is (should only be used client-side)
    console.warn('sanitizeEmailTemplate called on server-side, skipping sanitization');
    return html;
  }
  
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 's', 'a', 'img',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'blockquote',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'div', 'span', 'hr'
    ],
    ALLOWED_ATTR: [
      'href', 'src', 'alt', 'title', 'width', 'height',
      'style', 'class', 'target'
    ],
    ALLOWED_URI_REGEXP: /^(?:https?:|mailto:)/i,
    FORBID_ATTR: ['onerror', 'onload', 'onclick'],
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed'],
  });
}

/**
 * Strip all HTML tags and return plain text
 * Useful for previews and excerpts
 */
export function stripHTML(html: string): string {
  // DOMPurify works in browser environment
  if (typeof window === 'undefined') {
    // Server-side: basic regex strip
    return html.replace(/<[^>]*>/g, '');
  }
  
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
}
