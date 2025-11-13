/**
 * StandardModalHeader Component
 * 
 * Consistent header with title, icon, tabs, badges, and close button
 */

'use client';

import React from 'react';
import { isMobileViewport } from '../utils/modalSizing';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { StandardModalHeaderProps } from '../types';
import { MODAL_SPACING } from '../utils/modalConstants';

/**
 * Standard Modal Header
 * 
 * Provides:
 * - Title with optional icon and subtitle
 * - Tab navigation with badges
 * - Close button
 * - Drag handle for desktop
 * - Responsive padding
 */
export const StandardModalHeader: React.FC<StandardModalHeaderProps> = ({
  title,
  subtitle,
  icon: Icon,
  iconColor,
  tabs = [],
  currentTab,
  onTabChange,
  badges = [],
  onClose,
  showCloseButton = true,
  headerActions,
  enableDragHandle = true,
  isMobile,
  className = '',
  borderBottom = true,
}) => {
  // If isMobile prop is not provided, detect viewport size
  const effectiveIsMobile = typeof isMobile === 'boolean' ? isMobile : isMobileViewport();

  const padding = effectiveIsMobile
    ? MODAL_SPACING.mobileHeaderPadding
    : MODAL_SPACING.headerPadding;

  const getBadgeForTab = (tabId: string) => {
    const badge = badges.find((b) => b.id === tabId);
    if (!badge) return null;

    const count = typeof badge.count === 'number' && badge.count > 99 ? '99+' : badge.count;
    const colorClass = badge.color || 'bg-red-500';

    return (
      <span
        className={`ml-2 inline-flex items-center justify-center ${
          count.toString().length > 1 ? 'min-w-[24px] h-5 px-1.5' : 'w-5 h-5'
        } text-xs font-bold text-white ${colorClass} rounded-full ${
          badge.animate ? 'animate-pulse' : ''
        }`}
      >
        {count}
      </span>
    );
  };

  return (
    <div
      className={`flex flex-col ${borderBottom ? 'border-b border-gray-200 dark:border-gray-700' : ''} ${className}`}
      style={{ padding }}
    >
      {/* Title Row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3 flex-1">
          {Icon && (
            <div className="w-6 h-6 flex-shrink-0" style={{ color: iconColor || undefined }}>
              <Icon
                className="w-full h-full"
                aria-hidden="true"
              />
            </div>
          )}
          <div className="flex-1">
            <h2
              className={`text-xl font-semibold text-gray-900 dark:text-white ${
                  enableDragHandle && !effectiveIsMobile ? 'modal-drag-handle cursor-move' : ''
                }`}
              style={{
                fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
              }}
            >
              {title}
            </h2>
            {subtitle && (
              <p
                className="text-sm text-gray-600 dark:text-gray-400 mt-1"
                style={{
                  fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
                }}
              >
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Header Actions & Close */}
        <div className="flex items-center gap-2">
          {headerActions}
          {showCloseButton && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Close modal"
            >
              <XMarkIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      {tabs.length > 0 && (
        <div className="flex gap-2">
          {tabs
            .filter((tab) => !tab.hidden)
            .map((tab) => {
              const isActive = currentTab === tab.id;
              const TabIcon = tab.icon;

              return (
                <button
                  key={tab.id}
                  onClick={() => !tab.disabled && onTabChange?.(tab.id)}
                  disabled={tab.disabled}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm
                    transition-all duration-300 shadow-md
                    ${
                      isActive
                        ? 'btn-primary text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0'
                        : 'bg-white/50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 hover:bg-white/70 dark:hover:bg-gray-800/70 hover:shadow-lg'
                    }
                    ${tab.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                  style={{
                    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
                    ...(isActive && iconColor ? { backgroundColor: iconColor } : {}),
                  }}
                >
                  {TabIcon && <TabIcon className="w-4 h-4" />}
                  <span>{tab.label}</span>
                  {tab.badge && getBadgeForTab(tab.id)}
                </button>
              );
            })}
        </div>
      )}
    </div>
  );
};
