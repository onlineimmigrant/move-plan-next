// src/components/FeatureHeader.tsx
'use client';

import * as Icons from '@heroicons/react/24/outline';
import { MdOutlineFeaturedPlayList } from 'react-icons/md';

interface Feature {
  id: string;
  created_at: string;
  name: string;
  feature_image?: string;
  content: string;
  slug: string;
  display_content: boolean;
  display_on_product_card: boolean;
  type?: string;
  package?: string;
  description?: string;
  type_display?: string;
}

type HeroIconName = keyof typeof Icons;

export default function FeatureHeader({ feature }: { feature: Feature }) {
  const renderFeatureIcon = (iconName?: string) => {
    if (!iconName || iconName.trim() === '') {
      return <MdOutlineFeaturedPlayList className="w-6 h-6 text-gray-500" />;
    }
    const IconComponent = Icons[iconName as HeroIconName];
    if (!IconComponent) {
      console.warn(`Icon "${iconName}" not found in @heroicons/react/24/outline; using fallback`);
      return <MdOutlineFeaturedPlayList className="w-16 h-16 text-gray-500" />;
    }
    return <IconComponent className="w-16 h-16 text-gray-500" />;
  };

  return (
    <header className="flex flex-col sm:flex-row items-center gap-6 mb-16 sm:mb-24">
      <div className="w-24 h-24 sm:w-28 sm:h-28 neomorphic rounded-full flex items-center justify-center">
        {renderFeatureIcon(feature.feature_image)}
      </div>
      <div className="text-center sm:text-left">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-thin text-gray-900 tracking-tight leading-tight">
          {feature.name}
        </h1>
        {feature.type && (
          <div className="mt-4">
            <span className="inline-block px-4 py-1.5 bg-sky-50 text-sky-600 text-xs font-medium rounded-full tracking-wide uppercase border border-sky-100">
              {feature.type}
            </span>
          </div>
        )}
      </div>
    </header>
  );
}