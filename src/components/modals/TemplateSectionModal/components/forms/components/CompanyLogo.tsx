/**
 * CompanyLogo - Fixed position company logo display
 */

'use client';

import React from 'react';

interface CompanyLogoProps {
  imageUrl: string;
  designStyle: 'large' | 'compact';
}

export function CompanyLogo({ imageUrl, designStyle }: CompanyLogoProps) {
  return (
    <div className="absolute top-6 left-6 z-50">
      <a href="/" className="block transition-transform hover:scale-105">
        <img 
          src={imageUrl} 
          alt="Company Logo" 
          className={designStyle === 'compact' ? 'h-8' : 'h-10'}
        />
      </a>
    </div>
  );
}
