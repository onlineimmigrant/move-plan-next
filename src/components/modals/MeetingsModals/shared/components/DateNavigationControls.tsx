/**
 * Date Navigation Controls Component
 * Provides prev/next navigation and today button for calendar
 * 
 * Features:
 * - Previous/Next navigation
 * - Today button
 * - Current date display
 * - Keyboard shortcuts support
 * - Accessible labels
 * 
 * @example
 * ```tsx
 * <DateNavigationControls
 *   currentDate={new Date()}
 *   view="month"
 *   onNavigate={(direction) => handleNavigate(direction)}
 *   onToday={() => setDate(new Date())}
 * />
 * ```
 */

'use client';

import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { CalendarView } from '@/types/meetings';

export interface DateNavigationControlsProps {
  /**
   * Current date being displayed
   */
  currentDate: Date;

  /**
   * Current calendar view (affects date format)
   */
  view: CalendarView;

  /**
   * Callback for navigation (prev/next)
   */
  onNavigate: (direction: 'prev' | 'next') => void;

  /**
   * Callback to go to today
   */
  onToday: () => void;

  /**
   * Primary color (hex or CSS variable)
   * @default '#3B82F6'
   */
  primaryColor?: string;

  /**
   * Whether navigation is disabled (e.g., during loading)
   * @default false
   */
  disabled?: boolean;
}

/**
 * Get formatted date string based on view
 */
function getDateFormat(date: Date, view: CalendarView): string {
  switch (view) {
    case 'month':
      return format(date, 'MMMM yyyy');
    case 'week':
      // Show week range
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
    case 'day':
      return format(date, 'EEEE, MMMM d, yyyy');
    default:
      return format(date, 'MMMM yyyy');
  }
}

/**
 * Date navigation controls for calendar
 */
export function DateNavigationControls({
  currentDate,
  view,
  onNavigate,
  onToday,
  primaryColor = '#3B82F6',
  disabled = false,
}: DateNavigationControlsProps) {
  const [hoveredButton, setHoveredButton] = React.useState<string | null>(null);

  const formattedDate = getDateFormat(currentDate, view);

  const buttonBaseClass = `
    p-2 rounded-lg
    transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  const getButtonStyle = (buttonId: string) => ({
    backgroundColor:
      hoveredButton === buttonId ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
    color: 'rgba(255, 255, 255, 0.9)',
  });

  return (
    <div className="flex items-center gap-2">
      {/* Previous button */}
      <button
        aria-label="Previous"
        title="Previous (P)"
        className={buttonBaseClass}
        style={getButtonStyle('prev')}
        onClick={() => onNavigate('prev')}
        onMouseEnter={() => setHoveredButton('prev')}
        onMouseLeave={() => setHoveredButton(null)}
        disabled={disabled}
      >
        <ChevronLeftIcon className="w-5 h-5" />
      </button>

      {/* Today button */}
      <button
        aria-label="Go to today"
        title="Today (T)"
        className={`${buttonBaseClass} px-3 font-medium text-sm`}
        style={getButtonStyle('today')}
        onClick={onToday}
        onMouseEnter={() => setHoveredButton('today')}
        onMouseLeave={() => setHoveredButton(null)}
        disabled={disabled}
      >
        Today
      </button>

      {/* Next button */}
      <button
        aria-label="Next"
        title="Next (N)"
        className={buttonBaseClass}
        style={getButtonStyle('next')}
        onClick={() => onNavigate('next')}
        onMouseEnter={() => setHoveredButton('next')}
        onMouseLeave={() => setHoveredButton(null)}
        disabled={disabled}
      >
        <ChevronRightIcon className="w-5 h-5" />
      </button>

      {/* Current date display */}
      <div
        className="ml-4 px-4 py-2 rounded-lg font-semibold text-lg"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          color: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
        }}
        aria-live="polite"
        aria-atomic="true"
      >
        {formattedDate}
      </div>
    </div>
  );
}
