// /components/HomePageSections/Brands.tsx
import React from 'react';
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

const Brands: React.FC<BrandsProps> = ({ brands, textContent }) => {
  if (!brands || brands.length === 0) return null;

  const { settings } = useSettings();
  const animationDuration = Math.max(20, brands.length * 6); // Slower: 20s min, 6s per item

  // Debug log
  console.log('Brands count:', brands.length, 'Animation duration:', animationDuration);

  return (
    <div className="section py-12">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <h2 className="text-center text-sm font-semibold leading-8 text-gray-400 tracking-wider">
          {textContent.brands_heading}
        </h2>
        <div className="w-full relative overflow-hidden">
          <div
            className="inline-flex gap-12 sm:gap-24 animate-slideLeft"
            style={{
              width: `${brands.length * 208 * 2}px`, // 208px = w-48 (192px) + gap-8 (16px), *2 for duplicates
              animationDuration: `${animationDuration}s`,
            }}
          >
            {/* Original and duplicated items for seamless loop */}
            {[...brands, ...brands].map((logo, index) => (
              <div
                key={`${logo.id}-${index}`}
                className="flex-none flex justify-center text-center w-48"
              >
                <img
                  className="h-8 sm:h-12 w-48 object-contain"
                  src={logo.web_storage_address}
                  alt={logo.name}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CSS for right-to-left animation with fade */}
      <style jsx>{`
        @keyframes slideLeft {
          0% {
            transform: translateX(0);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateX(-50%);
            opacity: 0;
          }
        }
        .animate-slideLeft {
          animation: slideLeft ${animationDuration}s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default Brands;