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
    <header className="flex items-center gap-4 mb-24">
      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center shadow-md">
        {renderFeatureIcon(feature.feature_image)}
      </div>
      <h1 className="text-2xl font-semibold text-gray-800">
        {feature.name}
      </h1>
    </header>
  );
}