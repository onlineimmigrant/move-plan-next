import React from 'react';
import Image from 'next/image';
import LocalizedLink from '@/components/LocalizedLink';

interface HeaderLogoProps {
  logoUrl: string;
  companyLogo: string;
  logoHeightClass: string;
  companyName?: string;
}

/**
 * HeaderLogo component - Company logo with link
 * Optimized with React.memo to prevent unnecessary re-renders
 */
const HeaderLogoComponent: React.FC<HeaderLogoProps> = ({
  logoUrl,
  companyLogo,
  logoHeightClass,
  companyName = 'Logo',
}) => {
  return (
    <LocalizedLink 
      href={logoUrl} 
      className="flex items-center"
      aria-label={`${companyName} - Home`}
    >
      <div className={`relative ${logoHeightClass} w-auto`}>
        <Image
          src={companyLogo}
          alt={companyName}
          width={120}
          height={40}
          className={`${logoHeightClass} w-auto object-contain`}
          priority
        />
      </div>
    </LocalizedLink>
  );
};

// Memoized export to prevent unnecessary re-renders
export const HeaderLogo = React.memo(HeaderLogoComponent, (prevProps, nextProps) => {
  // Only re-render if logo config changes
  return (
    prevProps.logoUrl === nextProps.logoUrl &&
    prevProps.logoHeightClass === nextProps.logoHeightClass &&
    prevProps.companyLogo === nextProps.companyLogo
  );
});
