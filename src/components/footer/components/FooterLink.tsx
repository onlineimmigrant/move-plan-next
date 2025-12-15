import React, { useState } from 'react';
import LocalizedLink from '@/components/LocalizedLink';
import { usePrefetchLink } from '@/hooks/usePrefetchLink';
import { getLinkStyles } from '../hooks/getLinkStyles';

interface FooterLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  isHeading?: boolean;
  footerStyles: {
    color: string;
    colorHover: string;
    background: string;
  };
}

/**
 * FooterLink - Link wrapper with hover state and prefetching
 * Applies dynamic color styles based on hover state
 */
export const FooterLink: React.FC<FooterLinkProps> = ({ 
  href, 
  children, 
  className = '', 
  isHeading = false,
  footerStyles 
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const prefetchHandlers = usePrefetchLink({
    url: href,
    prefetchOnHover: true,
    delay: 100,
  });
  
  return (
    <span
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={getLinkStyles(isHovered, footerStyles)}
    >
      <LocalizedLink
        {...prefetchHandlers}
        href={href}
        className={`transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 ${className}`}
      >
        {children}
      </LocalizedLink>
    </span>
  );
};
