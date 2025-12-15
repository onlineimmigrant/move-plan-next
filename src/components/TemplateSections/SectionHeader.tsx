/**
 * SectionHeader Component
 * 
 * Reusable section header with title and description
 * Supports text alignment and style variants
 */
'use client';

import React, { useMemo } from 'react';
import parse from 'html-react-parser';
import DOMPurify from 'dompurify';
import { cn } from '@/lib/utils';
import { TextVariantStyles } from '@/constants/textStyleVariants';

interface SectionHeaderProps {
  /**
   * Section title (can contain HTML)
   */
  title: string;
  
  /**
   * Section description (optional, can contain HTML)
   */
  description?: string;
  
  /**
   * Text variant styles for typography
   */
  textVariant: TextVariantStyles;
  
  /**
   * Center align the header
   */
  isCenterAligned?: boolean;
  
  /**
   * Right align the header
   */
  isRightAligned?: boolean;
  
  /**
   * Additional CSS classes
   */
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  description,
  textVariant,
  isCenterAligned = false,
  isRightAligned = false,
  className,
}) => {
  // Memoized sanitize function to avoid unnecessary recalculations
  const sanitizeHTML = useMemo(() => {
    return (html: string): string => DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'a', 'span'],
      ALLOWED_ATTR: ['href', 'class', 'style'],
      FORBID_TAGS: ['iframe'],
    });
  }, []);

  return (
    <div
      className={cn(
        'px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 mb-12 md:mb-16 lg:mb-20 xl:mb-24 max-w-5xl',
        isCenterAligned
          ? 'text-center mx-auto'
          : isRightAligned
          ? 'text-right ml-auto'
          : 'text-left mr-auto',
        className
      )}
    >
      {/* Section Title */}
      <h2 className={textVariant.sectionTitle}>
        {parse(sanitizeHTML(title))}
      </h2>

      {/* Section Description */}
      {description && (
        <p className={`pt-4 md:pt-6 ${textVariant.sectionDescription}`}>
          {parse(sanitizeHTML(description))}
        </p>
      )}
    </div>
  );
};

SectionHeader.displayName = 'SectionHeader';
