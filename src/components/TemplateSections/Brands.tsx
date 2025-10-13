'use client';

import React, { memo, useMemo } from 'react';
import Image from 'next/image';
import { useSettings } from '@/context/SettingsContext';

interface Brand {
  id: string;
  web_storage_address: string;
  name: string;
  organization_id: string | null;
}

interface BrandsProps {
  brands: Brand[];
  textContent: {
    brands_heading: string;
  };
}

const Brands: React.FC<BrandsProps> = memo(({ brands, textContent }) => {
  const { settings } = useSettings();
  
  // Memoize calculations for performance
  const animationConfig = useMemo(() => {
    const duration = Math.max(20, brands.length * 6);
    const containerWidth = brands.length * 208 * 2; // 208px per item (144px + 64px gap) * 2 for duplicates
    return { duration, containerWidth };
  }, [brands.length]);

  // Early return after hooks
  if (!brands || brands.length === 0) {
    return null;
  }

  // Memoize duplicated brands array
  const duplicatedBrands = useMemo(() => [...brands, ...brands], [brands]);

  return (
    <section className="py-16 " aria-labelledby="brands-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
       {/*
        <h2 
          id="brands-heading"
          className="text-center text-sm font-semibold leading-8 text-gray-500 tracking-wider uppercase mb-8"
        >
          {textContent.brands_heading || 'Our Trusted Partners'}
        </h2>*/}
        
        <div className="relative overflow-hidden" role="img" aria-label="Partner company logos">
          {/* Gradient overlays for smooth fade effect */}
          <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-gray-50/50 to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-gray-50/50 to-transparent z-10 pointer-events-none" />
          
          <div
            className="flex animate-scroll-left gap-16"
            style={{
              width: `${animationConfig.containerWidth}px`,
              animationDuration: `${animationConfig.duration}s`,
            }}
          >
            {duplicatedBrands.map((brand, index) => (
              <div
                key={`${brand.id}-${index}`}
                className="flex-none flex items-center justify-center w-36"
              >
                <div className="relative w-full h-8 sm:h-10 group">
                  <Image
                    src={brand.web_storage_address}
                    alt={`${brand.name} logo`}
                    fill
                    className="object-contain filter grayscale hover:grayscale-0 transition-all duration-300 group-hover:scale-105"
                    sizes="(max-width: 640px) 128px, 144px"
                    loading="lazy"
                    quality={75}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes scroll-left {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-scroll-left {
          animation: scroll-left ${animationConfig.duration}s linear infinite;
        }
      `}</style>
    </section>
  );
});

Brands.displayName = 'Brands';

export default Brands;