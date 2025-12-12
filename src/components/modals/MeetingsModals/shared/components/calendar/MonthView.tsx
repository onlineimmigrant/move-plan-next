'use client';

import React, { useMemo, useCallback } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
} from 'date-fns';
import { CalendarEvent, CalendarView } from '@/types/meetings';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useHoverBackground } from '../../hooks';

/**
 * Props for the MonthView component
 */
export interface MonthViewProps {
  /** Current date being displayed */
  currentDate: Date;
  /** Array of calendar events to display */
  events: CalendarEvent[];
  /** Callback when a date is clicked */
  onDateClick: (date: Date) => void;
  /** Callback when an event is clicked */
  onEventClick: (event: CalendarEvent) => void;
  /** Callback when the view should change */
  onViewChange: (view: CalendarView) => void;
  /** Callback when the date should change */
  onDateChange: (date: Date) => void;
  /** Currently selected date */
  selectedDate: Date | null;
  /** Date to highlight with primary color (for mobile date selection) */
  highlightedDate?: Date | null;
  /** Whether to use 24-hour time format */
  use24Hour?: boolean;
}

/**
 * MonthView Component
 * 
 * Displays a calendar month view with dates, events, and interactive elements.
 * Provides visual feedback for today, selected dates, and dates with events.
 * 
 * @component
 * @example
 * ```tsx
 * <MonthView
 *   currentDate={new Date()}
 *   events={events}
 *   onDateClick={handleDateClick}
 *   onEventClick={handleEventClick}
 *   onViewChange={setView}
 *   onDateChange={setDate}
 *   selectedDate={selectedDate}
 *   use24Hour={true}
 * />
 * ```
 */
export function MonthView({ 
  currentDate, 
  events, 
  onDateClick, 
  onEventClick, 
  onViewChange, 
  onDateChange, 
  selectedDate,
  highlightedDate = null,
  use24Hour = true 
}: MonthViewProps) {
  const themeColors = useThemeColors();
  const primary = themeColors.cssVars.primary;
  
  // Memoize static color palette
  const colors = useMemo(() => ({
    bg: {
      white: '#ffffff',
      light: '#fafafa',
      lighter: '#f9fafb',
      available: primary.lighter,
      hover: `${primary.lighter}`,
      selected: `${primary.lighter}`,
    }
  }), [primary.lighter]);
  
  // Memoize shadow system
  const shadows = useMemo(() => ({
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    hover: `0 6px 12px -2px ${primary.base}20, 0 3px 6px -1px ${primary.base}15`,
  }), [primary.base]);
  
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
  const formatTime = useCallback((date: Date | number) => {
    return format(date, use24Hour ? 'HH:mm' : 'h:mm a');
  }, [use24Hour]);
  
  // Memoize calendar date calculations
  const { monthStart, monthEnd, calendarStart, calendarEnd } = useMemo(() => {
    const mStart = startOfMonth(currentDate);
    const mEnd = endOfMonth(currentDate);
    const cStart = startOfWeek(mStart);
    const cEnd = endOfWeek(mEnd);
    return {
      monthStart: mStart,
      monthEnd: mEnd,
      calendarStart: cStart,
      calendarEnd: cEnd,
    };
  }, [currentDate]);

  const days = useMemo(
    () => eachDayOfInterval({ start: calendarStart, end: calendarEnd }),
    [calendarStart, calendarEnd]
  );

  // Memoize static day headers
  const dayHeaders = useMemo(
    () => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    []
  );

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
          {dayHeaders.map(day => (
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
            const isHighlighted = highlightedDate && isSameDay(day, highlightedDate);
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
                  if (!isPastDate && isCurrentMonth && !isHighlighted) {
                    if (isTodayDate && !isSelected) {
                      e.currentTarget.style.background = `linear-gradient(135deg, ${primary.light}, ${primary.lighter})`;
                      e.currentTarget.style.boxShadow = shadows.hover;
                    } else {
                      e.currentTarget.style.backgroundColor = primary.light;
                      e.currentTarget.style.boxShadow = shadows.md;
                    }
                    e.currentTarget.style.transform = 'scale(1.03)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isPastDate && isCurrentMonth && !isSelected && !isHighlighted) {
                    if (isTodayDate) {
                      e.currentTarget.style.background = `linear-gradient(135deg, ${primary.lighter}, ${primary.lighter})`;
                    } else {
                      e.currentTarget.style.backgroundColor = hasEvents ? primary.lighter : (isCurrentMonth ? colors.bg.white : colors.bg.lighter);
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
                  ...(isHighlighted 
                    ? { 
                        backgroundColor: primary.base,
                        color: 'white',
                        boxShadow: `0 0 0 3px ${primary.base}40`
                      }
                    : isTodayDate && !isSelected 
                    ? { background: `linear-gradient(135deg, ${primary.lighter}, ${primary.lighter})` }
                    : { 
                        backgroundColor: isSelected 
                          ? primary.lighter
                          : isPastDate 
                          ? colors.bg.light 
                          : hasEvents 
                          ? primary.lighter
                          : isCurrentMonth 
                          ? colors.bg.white 
                          : colors.bg.lighter
                      }
                  ),
                  opacity: isPastDate ? 0.6 : 1,
                  ...(isSelected && !isHighlighted ? { boxShadow: `inset 0 0 0 2px ${primary.base}` } : {}),
                  ['--tw-ring-color' as string]: primary.base,
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                {/* Date number - centered */}
                <div className="relative mb-0.5">
                  <span
                    className={`inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-full text-sm sm:text-base md:text-lg font-bold transition-all duration-200 ${
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
                    <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 flex gap-0.5">
                      {Array.from({ length: Math.min(dayEventsList.length, 3) }).map((_, i) => (
                        <div
                          key={i}
                          className="w-1.5 h-1.5 rounded-full shadow-sm transition-all duration-200"
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

                {/* Appointment count badge */}
                <div className="min-h-[20px] flex items-center justify-center mt-auto mb-1">
                  {dayEventsList.length > 0 && !isPastDate && (
                    <span
                      className="inline-flex items-center justify-center min-w-[20px] h-[20px] px-1.5 text-[10px] sm:text-xs font-bold rounded-full shadow-sm"
                      style={{
                        backgroundColor: isTodayDate || isSelected ? 'white' : `${primary.lighter}40`,
                        color: isTodayDate || isSelected ? primary.base : primary.base,
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
