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

// Cache for storing fetched month data
const monthCache = new Map<string, CalendarEvent[]>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface CacheEntry {
  data: CalendarEvent[];
  timestamp: number;
}

// Enhanced cache with timestamps
const enhancedCache = new Map<string, CacheEntry>();

function getCachedData(key: string): CalendarEvent[] | null {
  const entry = enhancedCache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_DURATION) {
    return entry.data;
  }
  if (entry) {
    enhancedCache.delete(key); // Remove stale data
  }
  return null;
}

function setCachedData(key: string, data: CalendarEvent[]): void {
  enhancedCache.set(key, { data, timestamp: Date.now() });
}

// Custom hook for touch gestures (swipe detection)
function useSwipeGesture(onSwipeLeft: () => void, onSwipeRight: () => void, enabled: boolean = true) {
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const minSwipeDistance = 50;

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!enabled) return;
    touchStartX.current = e.touches[0].clientX;
  }, [enabled]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!enabled) return;
    touchEndX.current = e.touches[0].clientX;
  }, [enabled]);

  const handleTouchEnd = useCallback(() => {
    if (!enabled) return;
    const distance = touchStartX.current - touchEndX.current;
    const isSwipe = Math.abs(distance) > minSwipeDistance;

    if (isSwipe) {
      if (distance > 0) {
        onSwipeLeft();
      } else {
        onSwipeRight();
      }
    }
  }, [enabled, onSwipeLeft, onSwipeRight]);

  return { handleTouchStart, handleTouchMove, handleTouchEnd };
}

// Current time indicator component
interface CurrentTimeIndicatorProps {
  primaryColor: string;
  isToday: boolean;
}

function CurrentTimeIndicator({ primaryColor, isToday }: CurrentTimeIndicatorProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  if (!isToday) return null;

  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const topPosition = (hours * 60 + minutes) / (24 * 60) * 100;

  return (
    <div
      className="absolute left-0 right-0 z-10 pointer-events-none"
      style={{ top: `${topPosition}%` }}
    >
      <div className="relative">
        <div
          className="absolute left-0 w-2 h-2 rounded-full -mt-1"
          style={{ backgroundColor: '#EF4444' }}
        />
        <div
          className="h-0.5 w-full"
          style={{ 
            backgroundColor: '#EF4444',
            boxShadow: '0 0 4px rgba(239, 68, 68, 0.5)'
          }}
        />
      </div>
    </div>
  );
}

// Custom hook for hover background management
function useHoverBackground(hoverColor: string, defaultColor: string = '') {
  const handleMouseEnter = useCallback((e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.backgroundColor = hoverColor;
  }, [hoverColor]);
  
  const handleMouseLeave = useCallback((e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.backgroundColor = defaultColor;
  }, [defaultColor]);
  
  return { handleMouseEnter, handleMouseLeave };
}

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

// Month View Component
interface MonthViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onDateClick: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
  onViewChange: (view: CalendarView) => void;
  onDateChange: (date: Date) => void;
  selectedDate: Date | null;
  use24Hour?: boolean;
}

function MonthView({ currentDate, events, onDateClick, onEventClick, onViewChange, onDateChange, selectedDate, use24Hour = true }: MonthViewProps) {
  const themeColors = useThemeColors();
  const primary = themeColors.cssVars.primary;
  
  // Enhanced color palette
  const colors = {
    bg: {
      white: '#ffffff',
      light: '#fafafa',
      lighter: '#f9fafb',
      available: `${primary.lighter}08`,
      hover: `${primary.lighter}25`,
      selected: `${primary.lighter}35`,
    }
  };
  
  // Enhanced shadow system
  const shadows = {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    hover: `0 6px 12px -2px ${primary.base}20, 0 3px 6px -1px ${primary.base}15`,
  };
  
  // Hover background hook
  const hoverBg = useHoverBackground(colors.bg.hover);
  
  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent, date: Date) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onDateClick(date);
    }
  }, [onDateClick]);
  
  // Helper to format time based on preference
  const formatTime = (date: Date | number) => {
    return format(date, use24Hour ? 'HH:mm' : 'h:mm a');
  };
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const dayEvents = useMemo(() => {
    const eventMap: Record<string, CalendarEvent[]> = {};
    events.forEach(event => {
      // Ensure dates are Date objects
      const eventWithDates = {
        ...event,
        start: event.start instanceof Date ? event.start : new Date(event.start),
        end: event.end instanceof Date ? event.end : new Date(event.end),
      };
      
      const dateKey = format(eventWithDates.start, 'yyyy-MM-dd');
      if (!eventMap[dateKey]) {
        eventMap[dateKey] = [];
      }
      eventMap[dateKey].push(eventWithDates);
    });
    // Sort events by start time for each day
    Object.keys(eventMap).forEach(key => {
      eventMap[key].sort((a, b) => a.start.getTime() - b.start.getTime());
    });
    return eventMap;
  }, [events]);

  return (
    <div className="w-full">
      <div className="w-full">
        <div className="grid grid-cols-7 gap-1 sm:gap-1.5 md:gap-2 rounded-lg overflow-hidden p-1 sm:p-1.5 md:p-2">
          {/* Day headers - Improved typography */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div 
              key={day} 
              className="p-1.5 sm:p-2 text-center rounded-md"
              style={{ background: `linear-gradient(135deg, ${primary.lighter}20, ${primary.lighter}10)` }}
            >
              <span 
                className="text-[10px] sm:text-xs md:text-sm font-bold uppercase tracking-wide"
                style={{ 
                  color: primary.base,
                  fontVariantNumeric: 'tabular-nums'
                }}
              >
                {day}
              </span>
            </div>
          ))}

          {/* Calendar days - Enhanced spacing and visual feedback */}
          {days.map(day => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const dayEventsList = dayEvents[dateKey] || [];
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const isTodayDate = isToday(day);
            const isPastDate = day < new Date(new Date().setHours(0, 0, 0, 0));
            const hasEvents = dayEventsList.length > 0;

            return (
              <div
                key={day.toISOString()}
                onClick={() => !isPastDate && onDateClick(day)}
                onKeyDown={(e) => !isPastDate && handleKeyDown(e, day)}
                tabIndex={!isPastDate && isCurrentMonth ? 0 : -1}
                role="button"
                aria-label={`${format(day, 'MMMM d, yyyy')}${isTodayDate ? ' (Today)' : ''}${hasEvents ? `, ${dayEventsList.length} appointment${dayEventsList.length > 1 ? 's' : ''}` : ''}`}
                aria-pressed={isSelected ? 'true' : 'false'}
                onMouseEnter={(e) => {
                  if (!isPastDate && isCurrentMonth) {
                    if (isTodayDate && !isSelected) {
                      e.currentTarget.style.background = `linear-gradient(135deg, ${primary.lighter}45, ${primary.lighter}30)`;
                      e.currentTarget.style.boxShadow = shadows.hover;
                    } else {
                      e.currentTarget.style.backgroundColor = colors.bg.hover;
                      e.currentTarget.style.boxShadow = shadows.md;
                    }
                    e.currentTarget.style.transform = 'scale(1.03)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isPastDate && isCurrentMonth && !isSelected) {
                    if (isTodayDate) {
                      e.currentTarget.style.background = `linear-gradient(135deg, ${primary.lighter}35, ${primary.lighter}20)`;
                    } else {
                      e.currentTarget.style.backgroundColor = hasEvents ? colors.bg.available : (isCurrentMonth ? colors.bg.white : colors.bg.lighter);
                    }
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = 'none';
                  }
                }}
                className={`min-h-[70px] sm:min-h-[75px] md:min-h-[95px] p-1.5 sm:p-2 flex flex-col items-center justify-center transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 rounded-lg ${
                  isPastDate 
                    ? 'cursor-not-allowed' 
                    : isCurrentMonth ? 'cursor-pointer' : 'text-gray-400 cursor-pointer'
                }`}
                style={{
                  ...(isTodayDate && !isSelected 
                    ? { background: `linear-gradient(135deg, ${primary.lighter}35, ${primary.lighter}20)` }
                    : { 
                        backgroundColor: isSelected 
                          ? colors.bg.selected
                          : isPastDate 
                          ? colors.bg.light 
                          : hasEvents 
                          ? colors.bg.available
                          : isCurrentMonth 
                          ? colors.bg.white 
                          : colors.bg.lighter
                      }
                  ),
                  opacity: isPastDate ? 0.6 : 1,
                  ...(isSelected ? { boxShadow: `inset 0 0 0 2px ${primary.base}` } : {}),
                  ['--tw-ring-color' as string]: primary.base,
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                {/* Date number - centered */}
                <div className="relative mb-0.5">
                  <span
                    className={`inline-flex items-center justify-center w-11 h-11 sm:w-9 sm:h-9 md:w-8 md:h-8 rounded-full text-base sm:text-sm md:text-base font-bold transition-all duration-200 ${
                      isTodayDate || isSelected
                        ? 'text-white shadow-md'
                        : 'text-gray-900'
                    }`}
                    style={{
                      ...(isTodayDate
                        ? { 
                            background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`,
                            fontWeight: 700
                          }
                        : isSelected
                        ? { 
                            backgroundColor: primary.base,
                            fontWeight: 700
                          }
                        : {}),
                      fontVariantNumeric: 'tabular-nums'
                    }}
                  >
                    {format(day, 'd')}
                  </span>
                  {/* Enhanced event density indicator with color coding */}
                  {dayEventsList.length > 0 && !isPastDate && (
                    <div className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 flex gap-0.5">
                      {Array.from({ length: Math.min(dayEventsList.length, 3) }).map((_, i) => (
                        <div
                          key={i}
                          className="w-1 h-1 rounded-full shadow-sm transition-all duration-200"
                          style={{ 
                            backgroundColor: dayEventsList.length >= 3 
                              ? '#F59E0B' // Warning color for busy days
                              : dayEventsList.length === 2
                              ? primary.hover
                              : primary.base,
                            opacity: dayEventsList.length >= 3 ? 1 : 0.8,
                            ...(isSelected || isTodayDate ? { backgroundColor: 'white' } : {})
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Appointment count badge - always present to maintain alignment */}
                <div className="min-h-[18px] flex items-center justify-center">
                  {dayEventsList.length > 0 && !isPastDate && (
                    <span
                      className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-gray-600 bg-gray-200 rounded-full"
                      style={{
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {dayEventsList.length}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Week View Component
interface WeekViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onSlotClick?: (date: Date, hour?: number) => void;
  use24Hour?: boolean;
}

function WeekView({ currentDate, events, onEventClick, onSlotClick, use24Hour = true }: WeekViewProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const themeColors = useThemeColors();
  const primary = themeColors.cssVars.primary;
  
  // Consistent color palette
  const colors = {
    bg: {
      white: '#ffffff',
      light: '#fafafa',
      gray: '#f3f4f6',
    }
  };
  
  // Shadow system
  const shadows = {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  };
  
  // Helper to format time based on preference
  const formatTime = (date: Date | number) => {
    return format(date, use24Hour ? 'HH:mm' : 'h:mm a');
  };
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Start from Monday
  const weekDays = eachDayOfInterval({ start: weekStart, end: endOfWeek(currentDate, { weekStartsOn: 1 }) });
  
  // Show only 5 days on mobile (Mon-Fri), all 7 on desktop
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  const displayDays = isMobile ? weekDays.slice(0, 5) : weekDays;

  const weekEvents = useMemo(() => {
    const eventMap: Record<string, CalendarEvent[]> = {};
    events.forEach(event => {
      // Ensure dates are Date objects (not strings)
      const eventWithDates = {
        ...event,
        start: event.start instanceof Date ? event.start : new Date(event.start),
        end: event.end instanceof Date ? event.end : new Date(event.end),
      };
      
      const dayKey = format(eventWithDates.start, 'yyyy-MM-dd');
      if (!eventMap[dayKey]) {
        eventMap[dayKey] = [];
      }
      eventMap[dayKey].push(eventWithDates);
    });
    return eventMap;
  }, [events, weekDays]);

  // Find earliest event hour to determine start time
  const earliestHour = useMemo(() => {
    if (events.length === 0) return 9; // Default to 9 AM if no events
    
    const hours = events
      .filter(event => {
        const eventDate = format(event.start, 'yyyy-MM-dd');
        return weekDays.some(day => format(day, 'yyyy-MM-dd') === eventDate);
      })
      .map(event => parseInt(format(event.start, 'H')));
    
    if (hours.length === 0) return 9;
    
    return Math.max(0, Math.min(...hours) - 1); // Show 1 hour before earliest event
  }, [events, weekDays]);

  // Generate hours starting from earliest event
  const hours = Array.from({ length: 24 - earliestHour }, (_, i) => earliestHour + i);

  // Check if there are any events this week
  const hasEvents = events.some(event => {
    const eventDate = format(event.start, 'yyyy-MM-dd');
    return weekDays.some(day => format(day, 'yyyy-MM-dd') === eventDate);
  });

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-full w-full">
        {/* Header */}
        <div 
          className="grid grid-cols-5 sm:grid-cols-7"
          style={{ 
            background: `linear-gradient(135deg, ${primary.lighter}20, ${primary.lighter}10)`,
            borderBottom: `2px solid ${primary.light}`
          }}
        >
          {displayDays.map(day => (
            <div 
              key={day.toISOString()} 
              className="p-1.5 sm:p-2 text-center"
              style={{ borderRight: day === displayDays[displayDays.length - 1] ? 'none' : '1px solid transparent' }}
            >
              <div 
                className="text-[9px] sm:text-[10px] md:text-xs font-semibold uppercase tracking-wide"
                style={{ color: primary.base }}
              >
                {format(day, 'EEE')}
              </div>
              <div
                className={`mt-0.5 sm:mt-1 inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full text-xs sm:text-sm md:text-base font-bold transition-colors ${
                  isToday(day)
                    ? 'text-white'
                    : 'text-gray-900'
                }`}
                style={
                  isToday(day)
                    ? { background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})` }
                    : {}
                }
              >
                {format(day, 'd')}
              </div>
            </div>
          ))}
        </div>

        {/* Time slots */}
        <div ref={containerRef} className="relative">
          {/* Current time indicator for today */}
          {weekDays.some(day => isToday(day)) && (
            <CurrentTimeIndicator primaryColor={primary.base} isToday={true} />
          )}
          
          {!hasEvents ? (
            // Empty week - show + buttons
            <div className="py-6">
              <div 
                className="grid grid-cols-5 sm:grid-cols-7 min-h-[200px]"
                style={{ borderBottom: `1px solid ${primary.lighter}` }}
              >
                {displayDays.map((day, index) => {
                  const isPast = day < new Date(new Date().setHours(0, 0, 0, 0));
                  return (
                    <div
                      key={format(day, 'yyyy-MM-dd')}
                      className="p-4 flex items-center justify-center"
                      style={{ 
                        borderRight: index === displayDays.length - 1 ? 'none' : '1px solid transparent',
                        touchAction: 'manipulation',
                        WebkitTapHighlightColor: 'transparent',
                      }}
                    >
                      {!isPast && (
                        <button
                          onClick={() => onSlotClick?.(day, 9)}
                          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 flex items-center justify-center transition-all duration-200"
                          style={{ 
                            borderColor: primary.base,
                            color: primary.base,
                            touchAction: 'manipulation',
                            WebkitTapHighlightColor: 'transparent',
                          }}
                          title="Schedule appointment"
                          aria-label={`Schedule appointment on ${format(day, 'MMMM d, yyyy')}`}
                        >
                          <span className="text-xl sm:text-2xl font-bold leading-none">+</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            hours.map(hour => (
              <div 
                key={hour} 
                className="grid grid-cols-5 sm:grid-cols-7 transition-colors"
                style={{ 
                  borderBottom: `1px solid ${primary.lighter}`,
                }}
              >
                {displayDays.map(day => {
                  const dateKey = format(day, 'yyyy-MM-dd');
                  const dayEvents = weekEvents[dateKey] || [];
                  
                  // Check if event overlaps with this hour slot (not just starts in it)
                  const slotStart = new Date(day);
                  slotStart.setHours(hour, 0, 0, 0);
                  const slotEnd = new Date(day);
                  slotEnd.setHours(hour + 1, 0, 0, 0);
                  
                  const hourEvents = dayEvents.filter(event => {
                    // Event overlaps if it starts before slot ends AND ends after slot starts
                    return event.start < slotEnd && event.end > slotStart;
                  });
                
                // Check if this time slot is in the past
                const slotDate = new Date(day);
                slotDate.setHours(hour, 0, 0, 0);
                const isPast = slotDate < new Date();
                const hasHourEvents = hourEvents.length > 0;

                return (
                  <div
                    key={`${dateKey}-${hour}`}
                    onClick={() => !isPast && !hasHourEvents && onSlotClick?.(day, hour)}
                    className={`p-1 min-h-[45px] sm:min-h-[55px] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset relative ${
                      hasHourEvents
                        ? 'cursor-default'
                        : isPast 
                        ? 'opacity-50 cursor-not-allowed' 
                        : 'cursor-pointer'
                    }`}
                    style={{
                      backgroundColor: isPast ? colors.bg.gray : colors.bg.white,
                      borderRight: day === displayDays[displayDays.length - 1] ? 'none' : '1px solid transparent',
                      ['--tw-ring-color' as string]: primary.base,
                      touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                    role={!isPast && !hasHourEvents ? 'button' : undefined}
                    aria-label={!isPast && !hasHourEvents ? `Add event at ${formatTime(new Date(day).setHours(hour, 0))}` : undefined}
                    tabIndex={!isPast && !hasHourEvents ? 0 : -1}
                  >
                    {hourEvents.map(event => {
                      const startTime = formatTime(event.start);
                      const endTime = formatTime(event.end);
                      const textColor = event.backgroundColor || '#14B8A6';
                      const customerName = event.extendedProps?.booking?.customer_name || 'Unnamed';
                      
                      return (
                        <div
                          key={event.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onEventClick(event);
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = `${textColor}25`;
                            e.currentTarget.style.transform = 'translateX(2px)';
                            e.currentTarget.style.boxShadow = shadows.md;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = `${textColor}15`;
                            e.currentTarget.style.transform = 'translateX(0)';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                          className="text-[9px] sm:text-[10px] px-1.5 py-1 mb-1 rounded-md cursor-pointer transition-all"
                          style={{ 
                            backgroundColor: `${textColor}15`,
                            borderLeft: `3px solid ${textColor}`
                          }}
                          role="button"
                          aria-label={`Event: ${customerName} from ${startTime} to ${endTime}`}
                          tabIndex={0}
                        >
                          <div className="font-semibold truncate" style={{ color: textColor }}>
                            {startTime}-{endTime}
                          </div>
                          <div className="text-gray-700 truncate font-medium">
                            {customerName}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// Day View Component
interface DayViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onSlotClick?: (date: Date, hour?: number) => void;
  use24Hour?: boolean;
}

function DayView({ currentDate, events, onEventClick, onSlotClick, use24Hour = true }: DayViewProps) {
  const themeColors = useThemeColors();
  const primary = themeColors.cssVars.primary;
  
  // Consistent color palette
  const colors = {
    bg: {
      white: '#ffffff',
      light: '#fafafa',
      lighter: '#f9fafb',
      gray: '#f3f4f6',
    }
  };
  
  // Shadow system
  const shadows = {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  };
  
  // Helper to format time based on preference
  const formatTime = (date: Date | number) => {
    return format(date, use24Hour ? 'HH:mm' : 'h:mm a');
  };

  const dayEvents = useMemo(() => {
    const dateKey = format(currentDate, 'yyyy-MM-dd');
    return events
      .map(event => ({
        ...event,
        start: event.start instanceof Date ? event.start : new Date(event.start),
        end: event.end instanceof Date ? event.end : new Date(event.end),
      }))
      .filter(event => format(event.start, 'yyyy-MM-dd') === dateKey);
  }, [events, currentDate]);

  const hourEvents = useMemo(() => {
    const eventMap: Record<number, CalendarEvent[]> = {};
    dayEvents.forEach(event => {
      // Add event to all hours it spans (not just the start hour)
      const startHour = parseInt(format(event.start, 'H'));
      const endHour = parseInt(format(event.end, 'H'));
      const endMinute = parseInt(format(event.end, 'm'));
      
      // Include the end hour only if event extends past the hour start
      const lastHour = endMinute > 0 ? endHour : endHour - 1;
      
      for (let hour = startHour; hour <= lastHour; hour++) {
        if (!eventMap[hour]) {
          eventMap[hour] = [];
        }
        eventMap[hour].push(event);
      }
    });
    return eventMap;
  }, [dayEvents]);

  // Find earliest event hour to determine start time
  const earliestHour = useMemo(() => {
    if (dayEvents.length === 0) return 9; // Default to 9 AM if no events
    
    const hours = dayEvents.map(event => parseInt(format(event.start, 'H')));
    return Math.max(0, Math.min(...hours) - 1); // Show 1 hour before earliest event
  }, [dayEvents]);

  // Generate hours starting from earliest event
  const hours = Array.from({ length: 24 - earliestHour }, (_, i) => earliestHour + i);

  // Check if day is empty
  const hasEvents = dayEvents.length > 0;

  return (
    <div className="w-full">
      <div className="w-full">
        {!hasEvents ? (
          // Empty day - show + button with helpful message
          <div 
            className="rounded-lg overflow-hidden min-h-[300px] flex flex-col items-center justify-center p-6 text-center"
            style={{ 
              border: `1px solid ${primary.lighter}`,
              background: `linear-gradient(135deg, ${primary.lighter}20, ${primary.lighter}10)` 
            }}
          >
            <button
              onClick={() => onSlotClick?.(currentDate, 9)}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = `${primary.lighter}30`;
                e.currentTarget.style.transform = 'scale(1.1)';
                e.currentTarget.style.boxShadow = shadows.lg;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = 'none';
              }}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center transition-all duration-200 mb-4"
              style={{ 
                border: `3px solid ${primary.base}`,
                color: primary.base,
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
              }}
              title="Add event"
              aria-label={`Add event on ${format(currentDate, 'MMMM d, yyyy')}`}
            >
              <span className="text-3xl sm:text-4xl font-bold leading-none">+</span>
            </button>
          </div>
        ) : (
          <div 
            className="space-y-0 rounded-lg overflow-hidden relative"
          >
            {/* Current time indicator for today */}
            {isToday(currentDate) && (
              <CurrentTimeIndicator primaryColor={primary.base} isToday={true} />
            )}
            
            {hours.map((hour, index) => {
            const events = hourEvents[hour] || [];
            const isTodayHour = isToday(currentDate) && new Date().getHours() === hour;
            const hasEvents = events.length > 0;
            
            // Check if this time slot is in the past
            const slotDate = new Date(currentDate);
            slotDate.setHours(hour, 0, 0, 0);
            const isPast = slotDate < new Date();

            return (
              <div
                key={hour}
                onClick={() => !isPast && !hasEvents && onSlotClick?.(currentDate, hour)}
                className={`flex min-h-[55px] sm:min-h-[65px] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset`}
                style={{
                  backgroundColor: hasEvents
                    ? 'transparent'
                    : isPast
                    ? colors.bg.gray
                    : isTodayHour
                    ? `${primary.lighter}30`
                    : index % 2 === 0
                    ? colors.bg.white
                    : colors.bg.lighter,
                  borderBottom: index === hours.length - 1 ? 'none' : '1px solid transparent',
                  cursor: hasEvents ? 'default' : isPast ? 'not-allowed' : 'pointer',
                  opacity: isPast ? 0.5 : 1,
                  ['--tw-ring-color' as string]: primary.base,
                }}
                onMouseEnter={(e) => {
                  if (!isPast && !hasEvents) {
                    e.currentTarget.style.backgroundColor = `${primary.lighter}20`;
                    e.currentTarget.style.transform = 'translateX(2px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isPast && !hasEvents) {
                    e.currentTarget.style.backgroundColor = isTodayHour
                      ? `${primary.lighter}30`
                      : index % 2 === 0
                      ? colors.bg.white
                      : colors.bg.lighter;
                    e.currentTarget.style.transform = 'translateX(0)';
                  }
                }}
                role={!isPast && !hasEvents ? 'button' : undefined}
                aria-label={!isPast && !hasEvents ? `Add event at ${formatTime(new Date().setHours(hour, 0))}` : undefined}
                tabIndex={!isPast && !hasEvents ? 0 : -1}
              >
                <div 
                  className="w-14 sm:w-16 md:w-20 p-1.5 sm:p-2 text-[9px] sm:text-[10px] md:text-xs font-medium flex-shrink-0"
                  style={{
                    color: primary.active,
                    borderRight: '1px solid transparent',
                    background: `linear-gradient(135deg, ${primary.lighter}20, ${primary.lighter}10)`
                  }}
                >
                  <div className="sticky top-0">
                    {formatTime(new Date().setHours(hour, 0, 0, 0))}
                  </div>
                </div>

                <div className="flex-1 p-2">
                  {events.length > 0 && (
                    <div className="space-y-1.5">
                      {events.map(event => {
                        const startTime = formatTime(event.start);
                        const endTime = formatTime(event.end);
                        const textColor = event.backgroundColor || '#14B8A6';
                        const customerName = event.extendedProps?.booking?.customer_name || 'Unnamed';
                        
                        return (
                          <div
                            key={event.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              onEventClick(event);
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = `${textColor}25`;
                              e.currentTarget.style.transform = 'translateX(4px)';
                              e.currentTarget.style.boxShadow = shadows.md;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = `${textColor}15`;
                              e.currentTarget.style.transform = 'translateX(0)';
                              e.currentTarget.style.boxShadow = 'none';
                            }}
                            className="text-[10px] sm:text-xs p-2 rounded-lg cursor-pointer transition-all"
                            style={{
                              backgroundColor: `${textColor}15`,
                              borderLeft: `4px solid ${textColor}`
                            }}
                            role="button"
                            aria-label={`Event: ${customerName} from ${startTime} to ${endTime}`}
                            tabIndex={0}
                          >
                            <div className="font-semibold mb-1" style={{ color: textColor }}>
                              {startTime} - {endTime}
                            </div>
                            <div className="text-gray-700 font-medium">
                              {customerName}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          </div>
        )}
      </div>
    </div>
  );
}