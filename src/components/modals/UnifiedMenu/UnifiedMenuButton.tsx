'use client';

import React, { forwardRef } from 'react';
import { Cog6ToothIcon } from '@heroicons/react/24/outline';
import { useThemeColors } from '@/hooks/useThemeColors';
import { UnifiedMenuButtonProps } from './types';
import { getButtonPositionStyles } from './utils/positioning';

/**
 * UnifiedMenuButton Component
 * 
 * Floating trigger button for the unified menu
 * Settings icon on glass morphism background
 */
export const UnifiedMenuButton = forwardRef<HTMLButtonElement, UnifiedMenuButtonProps>(
  function UnifiedMenuButton(
    {
      isOpen,
      onClick,
      position,
      badgeCount,
      className = '',
    },
    ref
  ) {
    const themeColors = useThemeColors();
    const primary = themeColors.cssVars.primary;

    const positionStyles = getButtonPositionStyles(position);
    const showBadge = badgeCount !== null && badgeCount !== undefined && badgeCount !== '';

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      onClick();
    };

    return (
      <button
        ref={ref}
        onClick={handleClick}
        onMouseDown={(e) => e.preventDefault()}
        className={`
          w-14 h-14
          rounded-full
          bg-white/30 dark:bg-gray-900/30
          backdrop-blur-3xl
          border border-white/10 dark:border-gray-700/10
          shadow-xl hover:shadow-2xl
          hover:scale-105 active:scale-95
          hover:bg-white/40 dark:hover:bg-gray-900/40
          transition-all duration-300
          flex items-center justify-center
          group
          outline-none focus:outline-none focus-visible:outline-none
          focus:ring-0 focus-visible:ring-0
          ${className}
        `}
        style={{
          ...positionStyles,
          WebkitTapHighlightColor: 'transparent',
        }}
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        type="button"
      >
        {/* Settings Icon */}
        <Cog6ToothIcon
          className={`
            h-6 w-6 transition-all duration-300
            ${isOpen ? 'rotate-90' : ''}
          `}
          style={{
            color: primary.base,
          }}
        />

        {/* Badge */}
        {showBadge && !isOpen && (
          <span
            className="
              absolute -top-1 -right-1
              min-w-[20px] h-5
              px-1.5
              flex items-center justify-center
              text-xs font-bold
              text-white
              rounded-full
              shadow-lg
              animate-in zoom-in duration-200
            "
            style={{
              backgroundColor: primary.base,
            }}
          >
            {badgeCount}
          </span>
        )}
      </button>
    );
  }
);
