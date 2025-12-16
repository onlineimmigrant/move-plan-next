'use client';

import React, { memo, useMemo, useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { MediaCarouselRenderer } from './PostEditor/ui/MediaCarouselRenderer';

interface LandingPostContentProps {
  post: {
    content: string;
    content_type?: 'html' | 'markdown';
    [key: string]: any;
  };
}

const LandingPostContent: React.FC<LandingPostContentProps> = memo(({ post }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [markdownHtml, setMarkdownHtml] = useState<string | null>(null);
  const [markdownError, setMarkdownError] = useState<string | null>(null);
  
  // Use content directly without sanitization to preserve comments and formatting
  const processedContent = useMemo(() => {
    if (!post?.content) return '';
    // Return content as-is to preserve HTML comments and custom spacing
    return post.content;
  }, [post?.content]);

  // Process carousel elements after render
  useEffect(() => {
    if (!contentRef.current || post.content_type === 'markdown') return;

    console.log('🔍 Searching for carousel elements...');
    const carouselElements = contentRef.current.querySelectorAll(
      '[data-type="media-carousel"]'
    );
    console.log('🔍 Found carousel elements:', carouselElements.length);

    const roots: any[] = [];

    carouselElements.forEach((element, index) => {
      const mediaItemsData = element.getAttribute('data-media-items');
      const align = element.getAttribute('data-align') as 'left' | 'center' | 'right' || 'center';
      const width = element.getAttribute('data-width') || '600px';
      
      console.log(`🎠 Processing carousel ${index}:`, { mediaItemsData, align, width });

      if (mediaItemsData) {
        try {
          const mediaItems = JSON.parse(mediaItemsData);
          console.log('🎠 Parsed media items:', mediaItems);
          
          // Create a container for the React component
          const container = document.createElement('div');
          element.parentNode?.replaceChild(container, element);
          
          console.log('🎠 Rendering MediaCarouselRenderer...');
          // Render the carousel component
          const root = ReactDOM.createRoot(container);
          root.render(
            <MediaCarouselRenderer
              mediaItems={mediaItems}
              align={align}
              width={width}
            />
          );
          roots.push(root);
        } catch (error) {
          console.error('❌ Failed to parse carousel data:', error);
        }
      }
    });

    // Cleanup
    return () => {
      roots.forEach(root => {
        try {
          root.unmount();
        } catch (e) {
          // Ignore unmount errors
        }
      });
    };
  }, [processedContent, post.content_type]);

  // Convert markdown to HTML on-demand (to avoid bundling markdown libs in initial JS)
  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (post.content_type !== 'markdown') {
        setMarkdownHtml(null);
        setMarkdownError(null);
        return;
      }

      if (!post?.content) {
        setMarkdownHtml('');
        setMarkdownError(null);
        return;
      }

      try {
        setMarkdownError(null);

        const [{ unified }, remarkParseMod, remarkGfmMod, remarkRehypeMod, rehypeRawMod, rehypeSanitizeMod, rehypeStringifyMod] =
          await Promise.all([
            import('unified'),
            import('remark-parse'),
            import('remark-gfm'),
            import('remark-rehype'),
            import('rehype-raw'),
            import('rehype-sanitize'),
            import('rehype-stringify'),
          ]);

        const getDefault = <T,>(mod: any): T => (mod?.default ?? mod) as T;
        const remarkParse = getDefault<any>(remarkParseMod);
        const remarkGfm = getDefault<any>(remarkGfmMod);
        const remarkRehype = getDefault<any>(remarkRehypeMod);
        const rehypeRaw = getDefault<any>(rehypeRawMod);
        const rehypeSanitize = getDefault<any>(rehypeSanitizeMod);
        const rehypeStringify = getDefault<any>(rehypeStringifyMod);

        const file = await unified()
          .use(remarkParse)
          .use(remarkGfm)
          .use(remarkRehype, { allowDangerousHtml: true })
          .use(rehypeRaw)
          .use(rehypeSanitize)
          .use(rehypeStringify)
          .process(post.content);

        if (!cancelled) {
          setMarkdownHtml(String(file));
        }
      } catch (err) {
        console.error('❌ Failed to render markdown:', err);
        if (!cancelled) {
          setMarkdownError('Failed to render content');
          setMarkdownHtml(null);
        }
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [post?.content, post.content_type]);

  if (!post?.content) {
    return (
      <div className="w-full min-h-[200px] flex items-center justify-center text-gray-500">
        <p>No content available</p>
      </div>
    );
  }

  // Render Markdown if content_type is 'markdown'
  if (post.content_type === 'markdown') {
    if (markdownError) {
      return (
        <div className="w-full min-h-[200px] flex items-center justify-center text-gray-500">
          <p>{markdownError}</p>
        </div>
      );
    }

    if (markdownHtml === null) {
      return (
        <div className="w-full min-h-[200px] flex items-center justify-center text-gray-500">
          <p>Loading content…</p>
        </div>
      );
    }

    return (
      <div
        className="w-full max-w-none overflow-hidden"
        dangerouslySetInnerHTML={{ __html: markdownHtml }}
      />
    );
  }

  // Default: Render as HTML
  return (
    <div 
      ref={contentRef}
      className="w-full max-w-none overflow-hidden"
      dangerouslySetInnerHTML={{ __html: processedContent }}
    />
  );
});

LandingPostContent.displayName = 'LandingPostContent';

export default LandingPostContent;