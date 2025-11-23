/**
 * ShopToggleButton Component
 * 
 * Toggle button for opening the ShopModal
 * Can be placed in navigation or header
 */

'use client';

import React from 'react';
import { CubeIcon } from '@heroicons/react/24/outline';
import { useShopModal } from './context';
import { useThemeColors } from '@/hooks/useThemeColors';

export function ShopToggleButton() {
  const { openModal } = useShopModal();
  const themeColors = useThemeColors();
  const primary = themeColors.cssVars.primary;

  return (
    <button
      onClick={openModal}
      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      aria-label="Open shop management"
      title="Shop (⌘P)"
    >
      <CubeIcon
        className="h-5 w-5"
        style={{ color: primary.base }}
      />
    </button>
  );
}
