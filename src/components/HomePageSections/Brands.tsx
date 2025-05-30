// /components/HomePageSections/Brands.tsx
import React from 'react';

interface Brand {
  id: string;
  web_storage_address: string;
  name: string;
  organization_id: string | null; // Added
}

interface BrandsProps {
  brands: Brand[];
  textContent: {
    brands_heading: string;
  };
}

const Brands: React.FC<BrandsProps> = ({ brands, textContent }) => {
  if (!brands || brands.length === 0) return null;

  return (
    <div className="section py-12">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <h2 className="text-center text-sm font-semibold leading-8 text-gray-400 tracking-wider">
          {textContent.brands_heading}
        </h2>
        <div className="mx-auto max-w-lg sm:max-w-xl lg:mx-0 lg:max-w-none">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-8 sm:gap-12 justify-items-center">
            {brands.map((logo) => (
              <img
                key={logo.id}
                className="h-8 sm:h-12 w-48 object-contain"
                src={logo.web_storage_address}
                alt={logo.name}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Brands;