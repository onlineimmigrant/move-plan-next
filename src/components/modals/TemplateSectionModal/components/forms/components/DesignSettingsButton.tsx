/**
 * DesignSettingsButton - Floating design settings toggle button
 */

'use client';

import React from 'react';
import { Cog6ToothIcon } from '@heroicons/react/24/outline';

interface DesignSettingsButtonProps {
  isOpen: boolean;
  primaryColor: string;
  onClick: () => void;
}

export function DesignSettingsButton({ isOpen, primaryColor, onClick }: DesignSettingsButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        fixed bottom-24 right-6 z-[70]
        w-12 h-12
        rounded-full
        bg-white/50 dark:bg-gray-900/50
        backdrop-blur-3xl
        border border-white/20 dark:border-gray-700/20
        shadow-xl hover:shadow-2xl
        hover:scale-105 active:scale-95
        hover:bg-white/60 dark:hover:bg-gray-900/60
        transition-all duration-300
        flex items-center justify-center
        ${isOpen ? 'opacity-0 scale-90 pointer-events-none' : 'opacity-100 scale-100'}
      `}
      aria-label={isOpen ? 'Close design menu' : 'Open design menu'}
      aria-expanded={isOpen}
      style={{ color: primaryColor }}
    >
      <Cog6ToothIcon className={`h-6 w-6 transition-all duration-300 ${isOpen ? 'rotate-90' : ''}`} />
    </button>
  );
}
