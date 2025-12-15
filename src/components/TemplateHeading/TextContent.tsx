/**
 * TextContent Component
 * Renders title and description with styling
 */

'use client';

import React from 'react';
import parse from 'html-react-parser';

interface TextContentProps {
  title: string;
  description: string;
  titleClasses: string;
  descClasses: string;
  titleColor: string;
  descColor: string;
  alignment: string;
  hasImage: boolean;
  sanitizeHTML: (html: string) => string;
}

export const TextContent: React.FC<TextContentProps> = ({
  title,
  description,
  titleClasses,
  descClasses,
  titleColor,
  descColor,
  alignment,
  hasImage,
  sanitizeHTML,
}) => {
  return (
    <div className={`${!hasImage ? `text-center max-w-4xl mx-auto ${alignment}` : alignment}`}>
      <h1 
        className={titleClasses}
        style={{ color: titleColor }}
        role="heading"
        aria-level={1}
      >
        {parse(sanitizeHTML(title))}
      </h1>

      {description && (
        <p 
          className={`mt-8 ${descClasses} max-w-2xl ${!hasImage ? 'mx-auto' : ''}`}
          style={{ color: descColor }}
          role="text"
        >
          {parse(sanitizeHTML(description))}
        </p>
      )}
    </div>
  );
};

export default TextContent;
