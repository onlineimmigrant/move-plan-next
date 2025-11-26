'use client';

import React, { memo, useMemo, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
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

  if (!post?.content) {
    return (
      <div className="w-full min-h-[200px] flex items-center justify-center text-gray-500">
        <p>No content available</p>
      </div>
    );
  }

  // Render Markdown if content_type is 'markdown'
  if (post.content_type === 'markdown') {
    return (
      <div className="w-full max-w-none overflow-hidden">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw, rehypeSanitize]}
          components={{
            // Ensure images are responsive
            img: ({node, ...props}) => (
              <img {...props} alt={props.alt || ''} className="max-w-full h-auto" />
            ),
            // Ensure tables are scrollable on mobile
            table: ({node, ...props}) => (
              <div className="overflow-x-auto">
                <table {...props} />
              </div>
            ),
            // Ensure code blocks don't overflow
            pre: ({node, ...props}) => (
              <pre {...props} className="overflow-x-auto" />
            ),
          }}
        >
          {post.content}
        </ReactMarkdown>
      </div>
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