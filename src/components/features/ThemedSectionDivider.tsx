// src/components/features/ThemedSectionDivider.tsx
'use client';

import { useThemeColors } from '@/hooks/useThemeColors';

export default function ThemedSectionDivider() {
  const themeColors = useThemeColors();

  return (
    <div 
      className="w-32 h-1 mx-auto mb-8 rounded-full"
      style={{
        background: `linear-gradient(to right, transparent, ${themeColors.cssVars.primary.light}, transparent)`,
      }}
    ></div>
  );
}
