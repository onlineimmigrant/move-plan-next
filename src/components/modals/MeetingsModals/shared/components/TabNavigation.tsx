/**
 * Reusable Tab Navigation Component
 * Provides consistent tab interface across all modals
 * 
 * Features:
 * - Accessible (ARIA labels, keyboard navigation)
 * - Hover effects
 * - Active state styling
 * - Badge support for counts
 * - Theme-aware colors
 * 
 * @example
 * ```tsx
 * <TabNavigation
 *   tabs={[
 *     { id: 'create', label: 'Create', icon: PlusIcon },
 *     { id: 'manage', label: 'Manage', icon: ListIcon, badge: 5 }
 *   ]}
 *   activeTab="create"
 *   onTabChange={(tabId) => setActiveTab(tabId)}
 * />
 * ```
 */

'use client';

import React from 'react';
import type { ComponentType } from 'react';

export interface Tab {
  /**
   * Unique identifier for the tab
   */
  id: string;

  /**
   * Display label for the tab
   */
  label: string;

  /**
   * Optional icon component (Heroicon)
   */
  icon?: ComponentType<{ className?: string }>;

  /**
   * Optional badge count
   */
  badge?: number;

  /**
   * Whether tab is disabled
   */
  disabled?: boolean;
}

export interface TabNavigationProps {
  /**
   * Array of tab definitions
   */
  tabs: Tab[];

  /**
   * Currently active tab ID
   */
  activeTab: string;

  /**
   * Callback when tab is changed
   */
  onTabChange: (tabId: string) => void;

  /**
   * Custom primary color (hex or CSS variable)
   * @default '#3B82F6'
   */
  primaryColor?: string;

  /**
   * Size variant
   * @default 'medium'
   */
  size?: 'small' | 'medium' | 'large';
}

/**
 * Accessible tab navigation component
 */
export function TabNavigation({
  tabs,
  activeTab,
  onTabChange,
  primaryColor = '#3B82F6',
  size = 'medium',
}: TabNavigationProps) {
  const [hoveredTab, setHoveredTab] = React.useState<string | null>(null);

  const sizeClasses = {
    small: 'px-3 py-1.5 text-sm',
    medium: 'px-4 py-2 text-base',
    large: 'px-6 py-3 text-lg',
  };

  const handleKeyDown = (e: React.KeyboardEvent, tabId: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onTabChange(tabId);
    }
  };

  return (
    <div
      role="tablist"
      className="flex space-x-1 rounded-lg p-1"
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
      }}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const isHovered = hoveredTab === tab.id;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            aria-controls={`tabpanel-${tab.id}`}
            aria-label={tab.label}
            disabled={tab.disabled}
            className={`
              ${sizeClasses[size]}
              flex items-center justify-center gap-2
              rounded-md font-medium
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-offset-2
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
            style={{
              backgroundColor: isActive
                ? 'rgba(255, 255, 255, 0.15)'
                : isHovered
                ? 'rgba(255, 255, 255, 0.08)'
                : 'transparent',
              color: isActive ? primaryColor : 'rgba(255, 255, 255, 0.7)',
              boxShadow: isActive
                ? `0 0 0 1px ${primaryColor}40, 0 4px 6px -1px ${primaryColor}20`
                : 'none',
              transform: isActive ? 'scale(1.02)' : 'scale(1)',
            }}
            onClick={() => !tab.disabled && onTabChange(tab.id)}
            onKeyDown={(e) => !tab.disabled && handleKeyDown(e, tab.id)}
            onMouseEnter={() => setHoveredTab(tab.id)}
            onMouseLeave={() => setHoveredTab(null)}
            tabIndex={isActive ? 0 : -1}
          >
            {Icon && <Icon className="w-5 h-5" />}
            <span>{tab.label}</span>
            {tab.badge !== undefined && tab.badge > 0 && (
              <span
                className="px-2 py-0.5 text-xs font-bold rounded-full min-w-[20px] text-center"
                style={{
                  backgroundColor: primaryColor,
                  color: 'white',
                }}
                aria-label={`${tab.badge} items`}
              >
                {tab.badge > 99 ? '99+' : tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
