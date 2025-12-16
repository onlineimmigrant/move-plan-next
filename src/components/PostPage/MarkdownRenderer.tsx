'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import type { Components } from 'react-markdown';

interface MarkdownRendererProps {
  content: string;
  components?: Partial<Components>;
  className?: string;
}

/**
 * Direct Markdown Renderer (NOT lazy loaded)
 * 
 * Used for blog post content where markdown IS the LCP element.
 * Loads immediately to avoid delaying first contentful paint.
 * 
 * Bundle size: ~100KB (react-markdown + plugins)
 * Load time: Immediate (no lazy loading delay)
 * 
 * For non-critical markdown content, use LazyMarkdownRenderer instead.
 */
export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  components,
  className = '',
}) => {
  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeSanitize]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
