// src/components/features/ThemedRelatedFeatureCard.tsx
'use client';

import Link from 'next/link';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import { useThemeColors } from '@/hooks/useThemeColors';

interface Feature {
  id: string;
  name: string;
  description?: string;
  slug: string;
}

export default function ThemedRelatedFeatureCard({ feature, index }: { feature: Feature; index: number }) {
  const themeColors = useThemeColors();

  return (
    <Link
      href={`/features/${feature.slug}`}
      className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm p-6 hover:shadow-xl hover:scale-[1.03] hover:-translate-y-1 active:scale-[1.01] transition-all duration-300 border focus:outline-none"
      style={{ 
        animationDelay: `${index * 100}ms`,
        borderColor: 'rgb(243 244 246)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = themeColors.cssVars.primary.light;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'rgb(243 244 246)';
      }}
      onFocus={(e) => {
        e.currentTarget.style.outline = `2px solid ${themeColors.cssVars.primary.base}`;
        e.currentTarget.style.outlineOffset = '2px';
      }}
      onBlur={(e) => {
        e.currentTarget.style.outline = 'none';
      }}
    >
      <h3 
        className="text-lg font-semibold text-gray-900 mb-2 transition-colors"
        style={{
          color: undefined,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = themeColors.cssVars.primary.base;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = '';
        }}
      >
        {feature.name}
      </h3>
      {feature.description && (
        <p className="text-sm text-gray-600 line-clamp-2">
          {feature.description}
        </p>
      )}
      <div className="mt-4 flex items-center text-sm font-medium" style={{ color: themeColors.cssVars.primary.base }}>
        <span>Learn more</span>
        <ArrowRightIcon className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
      </div>
    </Link>
  );
}
