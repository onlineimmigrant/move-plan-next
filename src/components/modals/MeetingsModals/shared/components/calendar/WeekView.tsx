'use client';

import React, { useMemo, useRef, useCallback } from 'react';
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isToday,
} from 'date-fns';
import { CalendarEvent } from '@/types/meetings';
import { useThemeColors } from '@/hooks/useThemeColors';
import { CurrentTimeIndicator } from '../CurrentTimeIndicator';

/**
 * Props for the WeekView component
 */
export interface WeekViewProps {
  /** Current date being displayed */
  currentDate: Date;
  /** Array of calendar events to display */
  events: CalendarEvent[];
  /** Callback when an event is clicked */
  onEventClick: (event: CalendarEvent) => void;
  /** Callback when an empty slot is clicked */
  onSlotClick?: (date: Date, hour?: number) => void;
  /** Date to highlight with primary color (for mobile date selection) */
  highlightedDate?: Date | null;
  /** Whether to use 24-hour time format */
  use24Hour?: boolean;
}

/**
 * WeekView Component
 * 
 * Displays a calendar week view with time slots and events.
 * Shows Monday-Friday on mobile, full week on desktop.
 * Includes current time indicator and smart hour display.
 * 
 * @component
 * @example
 * ```tsx
 * <WeekView
 *   currentDate={new Date()}
 *   events={events}
 *   onEventClick={handleEventClick}
 *   onSlotClick={handleSlotClick}
 *   use24Hour={true}
 * />
 * ```
 */
export function WeekView({ 
  currentDate, 
  events, 
  onEventClick, 
  onSlotClick, 
  use24Hour = true 
}: WeekViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const themeColors = useThemeColors();
  const primary = themeColors.cssVars.primary;
  
  // Memoize static color palette
  const colors = useMemo(() => ({
    bg: {
      white: '#ffffff',
      light: '#fafafa',
      gray: '#f3f4f6',
    }
  }), []);
  
  // Memoize shadow system
  const shadows = useMemo(() => ({
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  }), []);
  
  // Memoize format time helper
  const formatTime = useCallback((date: Date | number) => {
    return format(date, use24Hour ? 'HH:mm' : 'h:mm a');
  }, [use24Hour]);
  
  const weekStart = useMemo(
    () => startOfWeek(currentDate, { weekStartsOn: 1 }),
    [currentDate]
  );
  const weekDays = useMemo(
    () => eachDayOfInterval({ start: weekStart, end: endOfWeek(currentDate, { weekStartsOn: 1 }) }),
    [weekStart, currentDate]
  );
  
  // Memoize display days calculation
  const displayDays = useMemo(() => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
    return isMobile ? weekDays.slice(0, 5) : weekDays;
  }, [weekDays]);

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
  }, [events]);

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

  // Generate hours starting from earliest event (memoized)
  const hours = useMemo(
    () => Array.from({ length: 24 - earliestHour }, (_, i) => earliestHour + i),
    [earliestHour]
  );

  // Memoize hasEvents check
  const hasEvents = useMemo(() => {
    return events.some(event => {
      const eventDate = format(event.start, 'yyyy-MM-dd');
      return weekDays.some(day => format(day, 'yyyy-MM-dd') === eventDate);
    });
  }, [events, weekDays]);

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
