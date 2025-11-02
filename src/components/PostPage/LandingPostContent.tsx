'use client';

import React, { memo, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';

interface LandingPostContentProps {
  post: {
    content: string;
    content_type?: 'html' | 'markdown';
    [key: string]: any;
  };
}

const LandingPostContent: React.FC<LandingPostContentProps> = memo(({ post }) => {
  // Use content directly without sanitization to preserve comments and formatting
  const processedContent = useMemo(() => {
    if (!post?.content) return '';
    // Return content as-is to preserve HTML comments and custom spacing
    return post.content;
  }, [post?.content]);

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
      <div className="w-full max-w-none prose prose-lg prose-gray dark:prose-invert">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw, rehypeSanitize]}
        >
          {post.content}
        </ReactMarkdown>
      </div>
    );
  }

  // Default: Render as HTML
  return (
    <div 
      className="w-full max-w-none prose prose-lg prose-gray dark:prose-invert"
      dangerouslySetInnerHTML={{ __html: processedContent }}
    />
  );
});

LandingPostContent.displayName = 'LandingPostContent';

export default LandingPostContent;