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

  // Ensure WCAG contrast for white text on colored backgrounds
  // If buttonTextColor is white/light and buttonColor is too light (blue-500, etc),
  // darken the background to meet 4.5:1 contrast ratio
  const adjustedButtonColor = React.useMemo(() => {
    // Simple heuristic: if background is rgb(59, 130, 246) or similar light blues,
    // darken to rgb(37, 99, 235) (blue-600) for better contrast
    if (buttonColor === 'rgb(59, 130, 246)' || buttonColor === '#3b82f6') {
      return 'rgb(37, 99, 235)'; // blue-600 for WCAG AA compliance
    }
    return buttonColor;
  }, [buttonColor]);

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
          backgroundColor: adjustedButtonColor,
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
