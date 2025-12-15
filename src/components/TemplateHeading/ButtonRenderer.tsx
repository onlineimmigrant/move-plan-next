/**
 * ButtonRenderer Component
 * Renders CTA button with text link or standard button style
 * Includes advanced prefetching for instant navigation
 */

'use client';

import React from 'react';
import parse from 'html-react-parser';
import { usePrefetchLink } from '@/hooks/usePrefetchLink';

interface ButtonRendererProps {
  buttonText: string;
  buttonUrl: string;
  isTextLink: boolean;
  buttonColor: string;
  buttonTextColor: string;
  sanitizeHTML: (html: string) => string;
}

export const ButtonRenderer: React.FC<ButtonRendererProps> = ({
  buttonText,
  buttonUrl,
  isTextLink,
  buttonColor,
  buttonTextColor,
  sanitizeHTML,
}) => {
  // Prefetch button URL for instant navigation
  const prefetchHandlers = usePrefetchLink({
    url: buttonUrl,
    prefetchOnHover: true,
    prefetchOnFocus: true,
    delay: 100,
  });

  if (!buttonText || !buttonUrl) {
    return null;
  }

  if (isTextLink) {
    return (
      <div className="mt-10">
        <a
          href={buttonUrl}
          className="inline-flex items-center gap-x-2 text-lg font-medium transition-colors duration-200 group focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          style={{ color: buttonColor }}
          aria-label={`Navigate to ${buttonText}`}
          {...prefetchHandlers}
        >
          {parse(sanitizeHTML(buttonText))}
          <svg 
            className="w-4 h-4 transition-transform group-hover:translate-x-1" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </a>
      </div>
    );
  }

  return (
    <div className="mt-10">
      <a
        href={buttonUrl}
        className="inline-flex items-center justify-center px-6 py-2 text-sm rounded-lg shadow-lg font-medium transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        style={{ 
          backgroundColor: buttonColor,
          color: buttonTextColor,
        }}
        aria-label={`${buttonText} - Call to action button`}
        {...prefetchHandlers}
      >
        {parse(sanitizeHTML(buttonText))}
      </a>
    </div>
  );
};

export default ButtonRenderer;
