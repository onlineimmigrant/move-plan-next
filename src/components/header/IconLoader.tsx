'use client';

import dynamic from 'next/dynamic';
import { ComponentType } from 'react';

// Common icons that are always needed - import directly for better performance
import {
  Bars3Icon,
  XMarkIcon,
  ShoppingCartIcon,
  UserIcon,
  ArrowRightOnRectangleIcon,
  ChevronDownIcon,
  MapIcon,
} from '@heroicons/react/24/outline';

// Type for HeroIcon components
type IconComponent = typeof MapIcon;

// Map of commonly used icons to avoid dynamic imports
const COMMON_ICONS: Record<string, IconComponent> = {
  Bars3Icon,
  XMarkIcon,
  ShoppingCartIcon,
  UserIcon,
  ArrowRightOnRectangleIcon,
  ChevronDownIcon,
  MapIcon,
};

/**
 * Dynamically load an icon by name with proper tree-shaking
 * Falls back to MapIcon if the icon doesn't exist
 */
export function getIconComponent(iconName: string | undefined): IconComponent {
  if (!iconName) {
    return MapIcon;
  }

  // Return common icon if available (no dynamic import needed)
  if (COMMON_ICONS[iconName]) {
    return COMMON_ICONS[iconName];
  }

  // For other icons, use dynamic import with proper path
  // This ensures tree-shaking works correctly
  try {
    const DynamicIcon = dynamic(
      () => import('@heroicons/react/24/outline').then((mod) => {
        const Icon = (mod as any)[iconName];
        return Icon ? { default: Icon } : { default: MapIcon };
      }),
      {
        loading: () => null,
        ssr: true,
      }
    );
    return DynamicIcon as any;
  } catch (error) {
    console.warn(`Icon ${iconName} not found, falling back to MapIcon`);
    return MapIcon;
  }
}

/**
 * Preload commonly used icons for menu items
 * Call this once when the header mounts
 */
export function preloadMenuIcons(iconNames: (string | undefined)[]): void {
  iconNames.forEach((iconName) => {
    if (iconName && !COMMON_ICONS[iconName]) {
      // Trigger dynamic import to preload
      import('@heroicons/react/24/outline').then((mod) => {
        if (!(mod as any)[iconName]) {
          console.warn(`Icon ${iconName} not found in heroicons`);
        }
      }).catch(() => {
        // Silently fail - icon will fall back to MapIcon when rendered
      });
    }
  });
}
