/**
 * View Switcher Component for Calendar
 * Provides buttons to switch between Month, Week, and Day views
 * 
 * Features:
 * - Accessible (ARIA labels, keyboard navigation)
 * - Visual active state
 * - Hover effects
 * - Keyboard shortcuts hints
 * 
 * @example
 * ```tsx
 * <ViewSwitcher
 *   currentView="month"
 *   onViewChange={(view) => setView(view)}
 * />
 * ```
 */

'use client';

import React from 'react';
import { CalendarIcon, CalendarDaysIcon, ClockIcon } from '@heroicons/react/24/outline';
import { CalendarView } from '@/types/meetings';

export interface ViewSwitcherProps {
  /**
   * Currently active view
   */
  currentView: CalendarView;

  /**
   * Callback when view changes
   */
  onViewChange: (view: CalendarView) => void;

  /**
   * Primary color (hex or CSS variable)
   * @default '#3B82F6'
   */
  primaryColor?: string;

  /**
   * Show keyboard shortcut hints
   * @default false
   */
  showShortcuts?: boolean;
}

interface ViewOption {
  value: CalendarView;
  label: string;
  icon: typeof CalendarIcon;
  shortcut?: string;
}

const viewOptions: ViewOption[] = [
  {
    value: 'month',
    label: 'Month',
    icon: CalendarDaysIcon,
    shortcut: 'M',
  },
  {
    value: 'week',
    label: 'Week',
    icon: CalendarIcon,
    shortcut: 'W',
  },
  {
    value: 'day',
    label: 'Day',
    icon: ClockIcon,
    shortcut: 'D',
  },
];

/**
 * Calendar view switcher component
 */
export function ViewSwitcher({
  currentView,
  onViewChange,
  primaryColor = '#3B82F6',
  showShortcuts = false,
}: ViewSwitcherProps) {
  const [hoveredView, setHoveredView] = React.useState<CalendarView | null>(null);

  const handleKeyDown = (e: React.KeyboardEvent, view: CalendarView) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onViewChange(view);
    }
  };

  return (
    <div
      role="radiogroup"
      aria-label="Calendar view"
      className="flex items-center rounded-lg overflow-hidden"
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
      }}
    >
      {viewOptions.map((option, index) => {
        const isActive = currentView === option.value;
        const isHovered = hoveredView === option.value;
        const Icon = option.icon;

        return (
          <button
            key={option.value}
            role="radio"
            aria-checked={isActive}
            aria-label={`${option.label} view`}
            className={`
              px-3 py-2 flex items-center gap-2
              font-medium text-sm
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-inset
              ${index > 0 ? 'border-l border-white/10' : ''}
            `}
            style={{
              backgroundColor: isActive
                ? 'rgba(255, 255, 255, 0.12)'
                : isHovered
                ? 'rgba(255, 255, 255, 0.06)'
                : 'transparent',
              color: isActive ? primaryColor : 'rgba(255, 255, 255, 0.7)',
              minWidth: '80px',
            }}
            onClick={() => onViewChange(option.value)}
            onKeyDown={(e) => handleKeyDown(e, option.value)}
            onMouseEnter={() => setHoveredView(option.value)}
            onMouseLeave={() => setHoveredView(null)}
            tabIndex={isActive ? 0 : -1}
          >
            <Icon className="w-4 h-4" />
            <span>{option.label}</span>
            {showShortcuts && option.shortcut && (
              <kbd
                className="px-1.5 py-0.5 text-xs rounded"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: 'rgba(255, 255, 255, 0.6)',
                }}
              >
                {option.shortcut}
              </kbd>
            )}
          </button>
        );
      })}
    </div>
  );
}
