'use client';

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  isToday,
  parseISO,
} from 'date-fns';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { CalendarEvent, CalendarView } from '@/types/meetings';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useSwipeGesture, useHoverBackground } from '../hooks';
import { CurrentTimeIndicator } from './CurrentTimeIndicator';
import { getCachedData, setCachedData } from '../utils/calendarCache';
import { MonthView } from './calendar/MonthView';
import { WeekView } from './calendar/WeekView';
import { DayView } from './calendar/DayView';

interface CalendarProps {
  events: CalendarEvent[];
  currentDate: Date;
  view: CalendarView;
  onDateChange: (date: Date) => void;
  onViewChange: (view: CalendarView) => void;
  onEventClick: (event: CalendarEvent) => void;
  onSlotClick?: (date: Date, hour?: number) => void;
  loading?: boolean;
  use24Hour?: boolean; // Time format preference from organization settings
}

export default function Calendar({
  events,
  currentDate,
  view,
  onDateChange,
  onViewChange,
  onEventClick,
  onSlotClick,
  loading = false,
  use24Hour = true,
}: CalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const themeColors = useThemeColors();
  const primary = themeColors.cssVars.primary;
  const calendarRef = useRef<HTMLDivElement>(null);
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ignore if typing in input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'n':
          e.preventDefault();
          navigateDate('next');
          break;
        case 'p':
          e.preventDefault();
          navigateDate('prev');
          break;
        case 't':
          e.preventDefault();
          goToToday();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);
  
  // Swipe gesture handlers
  const handleSwipeLeft = useCallback(() => {
    navigateDate('next');
  }, [view, currentDate]);

  const handleSwipeRight = useCallback(() => {
    navigateDate('prev');
  }, [view, currentDate]);

  const swipeGesture = useSwipeGesture(handleSwipeLeft, handleSwipeRight, true);
  
  // Enhanced color palette with better contrast
  const colors = {
    bg: {
      white: '#ffffff',
      light: '#fafafa',
      lighter: '#f9fafb',
      gray: '#f3f4f6',
      available: `${primary.lighter}08`, // Very subtle tint for available days
      hover: `${primary.lighter}20`, // Stronger hover feedback
      selected: `${primary.lighter}30`, // Clear selection state
    },
    border: {
      light: primary.lighter,
      base: primary.light,
      strong: primary.base,
    },
    text: {
      primary: '#111827',
      secondary: '#6b7280',
      muted: '#9ca3af',
      bright: primary.base,
    },
    status: {
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      info: '#3B82F6',
    }
  };
  
  // Enhanced shadow system for depth hierarchy
  const shadows = {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)', // For pressed states
    hover: `0 8px 16px -4px ${primary.base}20, 0 4px 8px -2px ${primary.base}15`, // Theme-colored shadow
  };
  
  // Helper to format time based on preference
  const formatTime = (date: Date | number) => {
    return format(date, use24Hour ? 'HH:mm' : 'h:mm a');
  };

  const navigateDate = useCallback((direction: 'prev' | 'next') => {
    let newDate: Date;

    switch (view) {
      case 'month':
        newDate = direction === 'next'
          ? addMonths(currentDate, 1)
          : subMonths(currentDate, 1);
        break;
      case 'week':
        newDate = direction === 'next'
          ? addWeeks(currentDate, 1)
          : subWeeks(currentDate, 1);
        break;
      case 'day':
        newDate = direction === 'next'
          ? addDays(currentDate, 1)
          : subDays(currentDate, 1);
        break;
      default:
        newDate = currentDate;
    }

    onDateChange(newDate);
  }, [view, currentDate, onDateChange]);

  const goToToday = () => {
    onDateChange(new Date());
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    if (onSlotClick) {
      onSlotClick(date);
    }
  };
  
  // Keyboard navigation handler
  const handleKeyDown = useCallback((e: React.KeyboardEvent, date: Date, action?: () => void) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (action) {
        action();
      } else {
        handleDateClick(date);
      }
    }
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl overflow-hidden w-full">
        {/* Header Skeleton - Compact */}
        <div 
          className="px-2 sm:px-3 md:px-4 py-2"
          style={{ 
            background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})` 
          }}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <div className="h-9 w-24 sm:w-28 bg-white/20 rounded animate-pulse flex-shrink-0"></div>
              <div className="h-5 w-24 sm:w-32 bg-white/20 rounded animate-pulse"></div>
            </div>
            <div className="h-9 w-32 sm:w-40 bg-white/20 rounded animate-pulse flex-shrink-0"></div>
          </div>
        </div>
        
        {/* Calendar Skeleton */}
        <div className="w-full p-2">
          <div className="space-y-2">
            {/* Week headers skeleton */}
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="h-6 sm:h-8 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
            {/* Days skeleton */}
            {Array.from({ length: 5 }).map((_, weekIndex) => (
              <div key={weekIndex} className="grid grid-cols-7 gap-2">
                {Array.from({ length: 7 }).map((_, dayIndex) => (
                  <div key={dayIndex} className="h-16 sm:h-20 md:h-24 bg-gray-100 rounded animate-pulse"></div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="rounded-xl overflow-hidden w-full mx-auto touch-pan-y"
      onTouchStart={swipeGesture.handleTouchStart}
      onTouchMove={swipeGesture.handleTouchMove}
      onTouchEnd={swipeGesture.handleTouchEnd}
      ref={calendarRef}
    >
      {/* Header - Simplified Design */}
      <div 
        className="px-3 sm:px-4 md:px-5 py-3"
        style={{ 
          background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})` 
        }}
      >
        <div className="flex items-center justify-between gap-3">
          {/* Left: Date/Title */}
          <h2 className="text-sm sm:text-base font-bold text-white truncate" style={{ fontVariantNumeric: 'tabular-nums', letterSpacing: '0.01em' }}>
            {format(currentDate, view === 'month' ? 'MMM yyyy' : view === 'week' ? "'Week of' MMM d" : 'MMM d')}
          </h2>

          {/* Right: View Toggle + Today Button (Desktop: + Navigation) */}
          <div className="flex items-center gap-2">
            {/* Navigation Buttons - Desktop Only */}
            <div className="hidden sm:inline-flex items-center gap-1">
              <button
                onClick={() => navigateDate('prev')}
                className="p-1.5 text-white bg-white/10 backdrop-blur-sm rounded-lg hover:bg-white/20 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                aria-label="Previous period"
              >
                <ChevronLeftIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => navigateDate('next')}
                className="p-1.5 text-white bg-white/10 backdrop-blur-sm rounded-lg hover:bg-white/20 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                aria-label="Next period"
              >
                <ChevronRightIcon className="w-4 h-4" />
              </button>
            </div>

            {/* View Toggle + Today Button Combined */}
            <div className="inline-flex items-center rounded-lg bg-white/10 backdrop-blur-sm p-0.5" role="group" aria-label="Calendar controls">
              {(['month', 'week', 'day'] as CalendarView[]).map((viewOption) => (
                <button
                  key={viewOption}
                  onClick={() => onViewChange(viewOption)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 ${
                    view === viewOption
                      ? 'bg-white shadow-md'
                      : 'text-white hover:bg-white/10'
                  }`}
                  style={{
                    ...(view === viewOption ? { color: primary.base } : {}),
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                  aria-pressed={view === viewOption}
                  aria-label={`${viewOption} view`}
                >
                  {viewOption.charAt(0).toUpperCase() + viewOption.slice(1)}
                </button>
              ))}
              
              {/* Today Button */}
              <button
                onClick={goToToday}
                className="px-3 py-1.5 text-xs font-medium text-white hover:bg-white/10 transition-colors duration-200 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 rounded-md"
                style={{
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                }}
                aria-label="Go to today"
              >
                Today
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Content */}
      <div className="w-full">
        {view === 'month' && (
          <MonthView
            currentDate={currentDate}
            events={events}
            onDateClick={handleDateClick}
            onEventClick={onEventClick}
            onViewChange={onViewChange}
            onDateChange={onDateChange}
            selectedDate={selectedDate}
            use24Hour={use24Hour}
          />
        )}

        {view === 'week' && (
          <WeekView
            currentDate={currentDate}
            events={events}
            onEventClick={onEventClick}
            onSlotClick={onSlotClick}
            use24Hour={use24Hour}
          />
        )}

        {view === 'day' && (
          <DayView
            currentDate={currentDate}
            events={events}
            onEventClick={onEventClick}
            onSlotClick={onSlotClick}
            use24Hour={use24Hour}
          />
        )}
      </div>
    </div>
  );
}
