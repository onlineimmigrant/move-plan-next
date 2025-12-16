import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';

interface PostArticleProps {
  content?: string;
  contentType?: 'html' | 'markdown';
}

export default function PostArticle({ content, contentType }: PostArticleProps) {
  if (!content) return null;

  if (contentType === 'markdown') {
    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeSanitize]}
        components={{
          img: ({ node, ...props }: any) => (
            <img
              {...props}
              alt={props.alt || ''}
              className="max-w-full h-auto rounded-lg shadow-sm"
              loading={props.loading ?? 'lazy'}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 1200px"
            />
          ),
          table: ({ node, ...props }: any) => (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <table {...props} />
            </div>
          ),
          pre: ({ node, ...props }: any) => (
            <pre {...props} className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-6" />
          ),
          p: ({ node, children, ...props }: any) => {
            const hasOnlyImage =
              node?.children?.length === 1 &&
              node.children[0].type === 'element' &&
              node.children[0].tagName === 'img';

            if (hasOnlyImage) {
              return (
                <div {...props} className="break-words my-4">
                  {children}
                </div>
              );
            }

            return (
              <p {...props} className="break-words">
                {children}
              </p>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    );
  }

  return <div dangerouslySetInnerHTML={{ __html: content }} />;
}
