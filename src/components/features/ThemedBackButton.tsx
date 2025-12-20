// src/components/features/ThemedBackButton.tsx
'use client';

import Link from 'next/link';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import { useThemeColors } from '@/hooks/useThemeColors';

export default function ThemedBackButton() {
  const themeColors = useThemeColors();

  return (
    <Link 
      href="/features"
      className="inline-flex items-center space-x-3 px-8 py-4 bg-white/80 backdrop-blur-sm shadow-sm border text-sm font-light rounded-full text-gray-700 hover:text-gray-900 hover:shadow-lg hover:scale-105 active:scale-100 transition-all duration-300 group focus:outline-none"
      style={{
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
      <ArrowRightIcon className="h-4 w-4 rotate-180 group-hover:-translate-x-1 transition-transform duration-300" />
      <span className="tracking-wide">Back to All Features</span>
    </Link>
  );
}
