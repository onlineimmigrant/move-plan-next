'use client';

import React from 'react';
import { RocketLaunchIcon } from '@heroicons/react/24/outline';
import { useThemeColors } from '@/hooks/useThemeColors';
import { UnifiedMenuItemProps } from './types';

/**
 * UnifiedMenuItem Component
 * 
 * Individual menu item with glass morphism styling
 * Supports two layouts:
 * - Bottom row: 2 items side-by-side (vertical icon above text)
 * - Regular rows: icon + text inline (horizontal)
 */
export function UnifiedMenuItem({
  item,
  isSelected,
  isHovered,
  onClick,
  onHover,
  onLeave,
  isInBottomRow = false,
  positionInBottomRow,
}: UnifiedMenuItemProps) {
  const themeColors = useThemeColors();
  const primary = themeColors.cssVars.primary;

  // Evaluate badge if it's a function
  const badgeValue = typeof item.badge === 'function' ? item.badge() : item.badge;
  const showBadge = badgeValue !== null && badgeValue !== undefined && badgeValue !== '';

  // Use rocket icon for AI Agent
  const IconComponent = item.id === 'ai-agent' ? RocketLaunchIcon : item.icon;

  // Bottom row: 2 items side-by-side (vertical layout - icon above text)
  if (isInBottomRow) {
    return (
      <button
        onClick={onClick}
        onMouseEnter={onHover}
        onMouseLeave={onLeave}
        className={`
          flex-1 flex flex-col items-center justify-center gap-2.5 px-3 py-3.5
          hover:bg-white/10 dark:hover:bg-gray-800/10
          active:bg-white/20 dark:active:bg-gray-800/20
          transition-all duration-200
          group
          relative
          focus-visible:outline-2 focus-visible:outline-offset-1
          focus-visible:outline-white/60 dark:focus-visible:outline-gray-400/60
          ${positionInBottomRow === 'left' ? 'rounded-bl-lg' : ''}
          ${positionInBottomRow === 'right' ? 'rounded-br-lg' : ''}
        `}
        aria-label={item.description || item.label}
      >
        {/* Icon */}
        <div
          className="flex-shrink-0 transition-transform duration-200 group-hover:scale-105"
          style={{
            color: isSelected || isHovered ? primary.base : undefined,
          }}
        >
          <IconComponent className="w-5 h-5" />
        </div>

        {/* Label */}
        <div
          className="text-xs font-semibold text-gray-900 dark:text-white text-center leading-tight"
          style={{
            color: isSelected || isHovered ? primary.base : undefined,
          }}
        >
          {item.label}
        </div>

        {/* Badge */}
        {showBadge && (
          <div
            className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full text-[9px] font-bold text-white"
            style={{
              backgroundColor: primary.base,
            }}
          >
            {badgeValue}
          </div>
        )}
      </button>
    );
  }

  // Regular rows: icon + text inline (horizontal layout)
  return (
    <button
      onClick={onClick}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      className="
        w-full flex items-center gap-4 px-4 py-2.5
        hover:bg-white/10 dark:hover:bg-gray-800/10
        active:bg-white/20 dark:active:bg-gray-800/20
        transition-all duration-200
        rounded-lg
        group
        relative
        focus-visible:outline-2 focus-visible:outline-offset-1
        focus-visible:outline-white/60 dark:focus-visible:outline-gray-400/60
      "
      aria-label={item.description || item.label}
    >
      {/* Icon */}
      <div
        className="flex-shrink-0 transition-transform duration-200 group-hover:scale-105"
        style={{
          color: isSelected || isHovered ? primary.base : undefined,
        }}
      >
        <IconComponent className="w-5 h-5" />
      </div>

      {/* Label */}
      <div
        className="text-sm font-medium tracking-tight text-gray-900 dark:text-white flex-1 text-left"
        style={{
          color: isSelected || isHovered ? primary.base : undefined,
        }}
      >
        {item.label}
      </div>

      {/* Badge */}
      {showBadge && (
        <div
          className="min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full text-xs font-bold text-white"
          style={{
            backgroundColor: primary.base,
          }}
        >
          {badgeValue}
        </div>
      )}
    </button>
  );
}

