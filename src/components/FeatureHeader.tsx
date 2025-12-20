// src/components/FeatureHeader.tsx
'use client';

import * as Icons from '@heroicons/react/24/outline';
import { MdOutlineFeaturedPlayList } from 'react-icons/md';
import { useThemeColors } from '@/hooks/useThemeColors';

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
  const themeColors = useThemeColors();

  const renderFeatureIcon = (iconName?: string) => {
    if (!iconName || iconName.trim() === '') {
      return null;
    }
    const IconComponent = Icons[iconName as HeroIconName];
    if (!IconComponent) {
      console.warn(`Icon "${iconName}" not found in @heroicons/react/24/outline`);
      return null;
    }
    return <IconComponent className="w-16 h-16 text-gray-500" />;
  };

  const hasIcon = feature.feature_image && feature.feature_image.trim() !== '';

  return (
    <header className="flex flex-col items-center gap-6 mb-16 sm:mb-24 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {hasIcon && (
        <div className="w-24 h-24 sm:w-28 sm:h-28 bg-gradient-to-br from-gray-50 to-gray-100 rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-shadow duration-300">
          {renderFeatureIcon(feature.feature_image)}
        </div>
      )}
      <div className="text-center w-full">
        {feature.type && (
          <div className="mb-4 animate-in fade-in slide-in-from-top-2 duration-500">
            <span 
              className="inline-block px-4 py-1.5 text-xs font-medium rounded-full tracking-wide uppercase border shadow-sm"
              style={{
                backgroundColor: themeColors.cssVars.primary.lighter,
                color: themeColors.cssVars.primary.base,
                borderColor: themeColors.cssVars.primary.light,
              }}
            >
              {feature.type}
            </span>
          </div>
        )}
        <h1 className="text-[clamp(2rem,5vw,3.5rem)] font-thin text-gray-900 tracking-tight leading-[1.1] max-w-3xl mx-auto">
          {feature.name}
        </h1>
      </div>
    </header>
  );
}