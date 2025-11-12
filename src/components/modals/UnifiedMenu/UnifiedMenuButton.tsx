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
      ticketsBadgeCount,
      meetingsBadgeCount,
      badgeCount, // Legacy support
      className = '',
    },
    ref
  ) {
    const themeColors = useThemeColors();
    const primary = themeColors.cssVars.primary;

    const positionStyles = getButtonPositionStyles(position);
    
    // Show individual badges if provided, otherwise fall back to legacy badgeCount
    const showTicketsBadge = ticketsBadgeCount !== null && ticketsBadgeCount !== undefined && ticketsBadgeCount !== '';
    const showMeetingsBadge = meetingsBadgeCount !== null && meetingsBadgeCount !== undefined && meetingsBadgeCount !== '';
    const showLegacyBadge = !showTicketsBadge && !showMeetingsBadge && badgeCount !== null && badgeCount !== undefined && badgeCount !== '';

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
          group
          outline-none focus:outline-none
          focus-visible:ring-2 focus-visible:ring-offset-2
          focus-visible:ring-white/50 dark:focus-visible:ring-gray-500/50
          ${isOpen ? 'opacity-0 scale-90 pointer-events-none' : 'opacity-100 scale-100'}
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

        {/* Tickets Badge (Left side - primary-600) */}
        {showTicketsBadge && !isOpen && (
          <span
            className={`
              absolute -top-1 -left-1
              flex items-center justify-center
              text-xs font-light
              text-white
              rounded-full
              shadow-lg
              animate-in zoom-in duration-200
              transition-all
              ${typeof ticketsBadgeCount === 'number' && ticketsBadgeCount >= 10 ? 'min-w-[22px] h-5 px-1' : 'w-5 h-5'}
            `}
            style={{
              backgroundColor: primary.base, // primary-600
            }}
            aria-label={`${ticketsBadgeCount} unread tickets`}
          >
            {ticketsBadgeCount}
          </span>
        )}

        {/* Meetings Badge (Right side - primary-800) */}
        {showMeetingsBadge && !isOpen && (
          <span
            className={`
              absolute -top-1 -right-1
              flex items-center justify-center
              text-xs font-light
              text-white
              rounded-full
              shadow-lg
              animate-in zoom-in duration-200
              transition-all
              ${typeof meetingsBadgeCount === 'number' && meetingsBadgeCount >= 10 ? 'min-w-[22px] h-5 px-1' : 'w-5 h-5'}
            `}
            style={{
              backgroundColor: primary.active, // Darker shade for meetings
            }}
            aria-label={`${meetingsBadgeCount} unread meetings`}
          >
            {meetingsBadgeCount}
          </span>
        )}

        {/* Legacy Badge (for backwards compatibility) */}
        {showLegacyBadge && !isOpen && (
          <span
            className={`
              absolute -top-1 -right-1
              flex items-center justify-center
              text-xs font-light
              text-white
              rounded-full
              shadow-lg
              animate-in zoom-in duration-200
              transition-all
              ${typeof badgeCount === 'number' && badgeCount >= 10 ? 'min-w-[22px] h-5 px-1' : 'w-5 h-5'}
            `}
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
