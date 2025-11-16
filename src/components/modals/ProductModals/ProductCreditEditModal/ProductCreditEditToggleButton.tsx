/**
 * ProductCreditEditToggleButton Component
 * 
 * Toggle button for opening the ProductCreditEditModal
 * Can be placed in navigation or header
 */

'use client';

import React from 'react';
import { CubeIcon } from '@heroicons/react/24/outline';
import { useProductModal } from './context';
import { useThemeColors } from '@/hooks/useThemeColors';

export function ProductCreditEditToggleButton() {
  const { openModal } = useProductModal();
  const themeColors = useThemeColors();
  const primary = themeColors.cssVars.primary;

  return (
    <button
      onClick={openModal}
      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      aria-label="Open product management"
      title="Products (⌘P)"
    >
      <CubeIcon
        className="h-5 w-5"
        style={{ color: primary.base }}
      />
    </button>
  );
}
