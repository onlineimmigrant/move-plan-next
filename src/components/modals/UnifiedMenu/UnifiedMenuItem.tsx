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
          flex-1 flex flex-col items-center justify-center gap-2 px-3 py-3
          bg-white/20 dark:bg-gray-800/20 backdrop-blur-xl
          hover:bg-white/30 dark:hover:bg-gray-800/30
          active:bg-white/40 dark:active:bg-gray-800/40
          transition-all duration-200
          group
          relative
          ${positionInBottomRow === 'left' ? 'rounded-bl-lg' : ''}
          ${positionInBottomRow === 'right' ? 'rounded-br-lg' : ''}
        `}
        aria-label={item.description || item.label}
      >
        {/* Icon */}
        <div
          className="flex-shrink-0 transition-transform duration-200 group-hover:scale-110"
          style={{
            color: isSelected || isHovered ? primary.base : undefined,
          }}
        >
          <IconComponent className="w-6 h-6" />
        </div>

        {/* Label */}
        <div
          className="text-xs font-medium text-gray-900 dark:text-white text-center leading-tight"
          style={{
            color: isSelected || isHovered ? primary.base : undefined,
          }}
        >
          {item.label}
        </div>

        {/* Badge */}
        {showBadge && (
          <div
            className="absolute top-1 right-1 min-w-[14px] h-3.5 px-1 flex items-center justify-center rounded-full text-[9px] font-bold text-white"
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
        w-full flex items-center gap-4 px-4 py-3.5 mb-2
        bg-white/20 dark:bg-gray-800/20 backdrop-blur-xl
        hover:bg-white/30 dark:hover:bg-gray-800/30
        active:bg-white/40 dark:active:bg-gray-800/40
        transition-all duration-200
        rounded-lg
        group
        relative
      "
      aria-label={item.description || item.label}
    >
      {/* Icon */}
      <div
        className="flex-shrink-0 transition-transform duration-200 group-hover:scale-110"
        style={{
          color: isSelected || isHovered ? primary.base : undefined,
        }}
      >
        <IconComponent className="w-6 h-6" />
      </div>

      {/* Label */}
      <div
        className="text-sm font-medium text-gray-900 dark:text-white flex-1 text-left"
        style={{
          color: isSelected || isHovered ? primary.base : undefined,
        }}
      >
        {item.label}
      </div>

      {/* Badge */}
      {showBadge && (
        <div
          className="min-w-[18px] h-5 px-1.5 flex items-center justify-center rounded-full text-[10px] font-bold text-white"
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

