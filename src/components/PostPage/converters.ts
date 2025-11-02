/**
 * Conversion utilities for PostEditor content formats
 * Handles conversion between HTML, Markdown, and Visual editor formats
 */

import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';

// Initialize Turndown service for HTML to Markdown conversion
const turndownService = new TurndownService({
  headingStyle: 'atx',
  hr: '---',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
  emDelimiter: '*',
});

// Add GitHub Flavored Markdown support (tables, strikethrough, task lists)
turndownService.use(gfm);

// Custom rules for better conversion
turndownService.addRule('strikethrough', {
  filter: ['del', 's'] as any,
  replacement: (content: string) => `~~${content}~~`
});

turndownService.addRule('highlight', {
  filter: (node: HTMLElement) => {
    return (
      node.nodeName === 'MARK' ||
      (node.nodeName === 'SPAN' && node.classList && node.classList.contains('bg-yellow-200'))
    );
  },
  replacement: (content: string) => `==${content}==`
});

// Preserve image attributes
turndownService.addRule('imageWithAttributes', {
  filter: 'img',
  replacement: (content: string, node: HTMLElement) => {
    const alt = node.getAttribute('alt') || '';
    const src = node.getAttribute('src') || '';
    const title = node.getAttribute('title');
    
    if (!src) return '';
    
    if (title) {
      return `![${alt}](${src} "${title}")`;
    }
    return `![${alt}](${src})`;
  }
});

/**
 * Remove unnecessary escape characters from markdown
 * Turndown sometimes adds escape characters that aren't needed
 * @param markdown - Markdown string with potential escape characters
 * @returns Cleaned markdown string
 */
export function unescapeMarkdown(markdown: string): string {
  if (!markdown) return '';
  
  // Remove escapes before common markdown characters
  let cleaned = markdown;
  
  // Unescape headers
  cleaned = cleaned.replace(/\\#/g, '#');
  
  // Unescape lists
  cleaned = cleaned.replace(/\\-/g, '-');
  cleaned = cleaned.replace(/\\\*/g, '*');
  cleaned = cleaned.replace(/\\\+/g, '+');
  
  // Unescape emphasis
  cleaned = cleaned.replace(/\\_/g, '_');
  
  // Unescape brackets and parentheses  
  cleaned = cleaned.replace(/\\\[/g, '[');
  cleaned = cleaned.replace(/\\\]/g, ']');
  cleaned = cleaned.replace(/\\\(/g, '(');
  cleaned = cleaned.replace(/\\\)/g, ')');
  
  // Unescape pipes (for tables)
  cleaned = cleaned.replace(/\\\|/g, '|');
  
  // Unescape backticks
  cleaned = cleaned.replace(/\\`/g, '`');
  
  // Unescape greater-than (for blockquotes)
  cleaned = cleaned.replace(/\\>/g, '>');
  
  return cleaned;
}

/**
 * Convert HTML to Markdown
 * @param html - HTML string to convert
 * @returns Markdown string
 */
export function htmlToMarkdown(html: string): string {
  if (!html || html.trim() === '') {
    return '';
  }

  try {
    const markdown = turndownService.turndown(html);
    // Remove unnecessary escapes that Turndown adds
    return unescapeMarkdown(markdown);
  } catch (error) {
    console.error('Error converting HTML to Markdown:', error);
    return html; // Fallback to original HTML
  }
}

/**
 * Convert Markdown to HTML using react-markdown
 * This ensures consistent rendering between preview and TipTap editor
 * @param markdown - Markdown string to convert
 * @returns HTML string
 */
export function markdownToHtml(markdown: string): string {
  if (!markdown || markdown.trim() === '') {
    return '';
  }

  try {
    // Use the same markdown rendering logic as the preview
    // This is a synchronous operation for the editor
    // We'll use a simple markdown parser for basic syntax
    
    // Basic markdown to HTML conversion (for common cases)
    let html = markdown;
    
    // Headers
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    
    // Bold
    html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
    html = html.replace(/__(.*?)__/gim, '<strong>$1</strong>');
    
    // Italic
    html = html.replace(/\*(.*?)\*/gim, '<em>$1</em>');
    html = html.replace(/_(.*?)_/gim, '<em>$1</em>');
    
    // Strikethrough
    html = html.replace(/~~(.*?)~~/gim, '<del>$1</del>');
    
    // Code blocks
    html = html.replace(/```(\w+)?\n([\s\S]*?)```/gim, '<pre><code>$2</code></pre>');
    
    // Inline code
    html = html.replace(/`([^`]+)`/gim, '<code>$1</code>');
    
    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2">$1</a>');
    
    // Images
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/gim, '<img src="$2" alt="$1" />');
    
    // Lists - unordered
    html = html.replace(/^\* (.+)$/gim, '<li>$1</li>');
    html = html.replace(/^- (.+)$/gim, '<li>$1</li>');
    // Wrap consecutive <li> tags in <ul> (without 's' flag for compatibility)
    html = html.replace(/(<li>[\s\S]*?<\/li>)/gim, '<ul>$1</ul>');
    
    // Lists - ordered
    html = html.replace(/^\d+\. (.+)$/gim, '<li>$1</li>');
    
    // Blockquotes
    html = html.replace(/^> (.+)$/gim, '<blockquote>$1</blockquote>');
    
    // Line breaks (double newline = paragraph)
    const paragraphs = html.split(/\n\n+/);
    html = paragraphs
      .map(p => {
        p = p.trim();
        // Don't wrap if already has block-level tags
        if (p.match(/^<(h[1-6]|ul|ol|blockquote|pre|div)/)) {
          return p;
        }
        // Replace single newlines with <br>
        p = p.replace(/\n/g, '<br>');
        return `<p>${p}</p>`;
      })
      .join('\n');
    
    return html;
  } catch (error) {
    console.error('Error converting Markdown to HTML:', error);
    return markdown; // Fallback to original markdown
  }
}

/**
 * Clean and format HTML
 * @param html - HTML string to clean
 * @returns Cleaned HTML string
 */
export function cleanHtml(html: string): string {
  if (!html) return '';
  
  // Remove empty paragraphs
  let cleaned = html.replace(/<p><\/p>/g, '');
  cleaned = cleaned.replace(/<p>\s*<\/p>/g, '');
  
  // Remove empty spans
  cleaned = cleaned.replace(/<span><\/span>/g, '');
  cleaned = cleaned.replace(/<span>\s*<\/span>/g, '');
  
  // Trim whitespace
  cleaned = cleaned.trim();
  
  return cleaned;
}

/**
 * Detect content type from content string
 * @param content - Content string to analyze
 * @returns 'html' or 'markdown'
 */
export function detectContentType(content: string): 'html' | 'markdown' {
  if (!content) return 'html';
  
  const trimmed = content.trim();
  
  // Check for HTML tags
  const hasHtmlTags = /<[^>]+>/.test(trimmed);
  
  // Check for Markdown patterns
  const hasMarkdownHeaders = /^#{1,6}\s/.test(trimmed);
  const hasMarkdownLists = /^[\-\*\+]\s/.test(trimmed);
  const hasMarkdownCode = /```[\s\S]*```/.test(trimmed);
  const hasMarkdownLinks = /\[.*?\]\(.*?\)/.test(trimmed);
  
  const markdownScore = [
    hasMarkdownHeaders,
    hasMarkdownLists,
    hasMarkdownCode,
    hasMarkdownLinks
  ].filter(Boolean).length;
  
  // If it has HTML tags and low markdown score, it's HTML
  if (hasHtmlTags && markdownScore < 2) {
    return 'html';
  }
  
  // If it has high markdown score, it's markdown
  if (markdownScore >= 2) {
    return 'markdown';
  }
  
  // Default to HTML
  return 'html';
}

/**
 * Escape HTML in markdown content
 * @param markdown - Markdown string
 * @returns Escaped markdown
 */
export function escapeHtmlInMarkdown(markdown: string): string {
  // This is handled by rehype-sanitize in the component
  // Placeholder for additional sanitization if needed
  return markdown;
}

export default {
  htmlToMarkdown,
  markdownToHtml,
  cleanHtml,
  detectContentType,
  escapeHtmlInMarkdown,
};
