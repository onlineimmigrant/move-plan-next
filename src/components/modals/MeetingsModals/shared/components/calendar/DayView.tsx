'use client';

import React, { useMemo } from 'react';
import { format, isToday } from 'date-fns';
import { CalendarEvent } from '@/types/meetings';
import { useThemeColors } from '@/hooks/useThemeColors';
import { CurrentTimeIndicator } from '../CurrentTimeIndicator';

/**
 * Props for the DayView component
 */
export interface DayViewProps {
  /** Current date being displayed */
  currentDate: Date;
  /** Array of calendar events to display */
  events: CalendarEvent[];
  /** Callback when an event is clicked */
  onEventClick: (event: CalendarEvent) => void;
  /** Callback when an empty slot is clicked */
  onSlotClick?: (date: Date, hour?: number) => void;
  /** Whether to use 24-hour time format */
  use24Hour?: boolean;
}

/**
 * DayView Component
 * 
 * Displays a single day calendar view with hourly time slots and events.
 * Shows a current time indicator for today and allows clicking empty slots.
 * 
 * @component
 * @example
 * ```tsx
 * <DayView
 *   currentDate={new Date()}
 *   events={events}
 *   onEventClick={handleEventClick}
 *   onSlotClick={handleSlotClick}
 *   use24Hour={true}
 * />
 * ```
 */
export function DayView({ 
  currentDate, 
  events, 
  onEventClick, 
  onSlotClick, 
  use24Hour = true 
}: DayViewProps) {
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
              const hasSlotEvents = events.length > 0;
              
              // Check if this time slot is in the past
              const slotDate = new Date(currentDate);
              slotDate.setHours(hour, 0, 0, 0);
              const isPast = slotDate < new Date();

              return (
                <div
                  key={hour}
                  onClick={() => !isPast && !hasSlotEvents && onSlotClick?.(currentDate, hour)}
                  className={`flex min-h-[55px] sm:min-h-[65px] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset`}
                  style={{
                    backgroundColor: hasSlotEvents
                      ? 'transparent'
                      : isPast
                      ? colors.bg.gray
                      : isTodayHour
                      ? `${primary.lighter}30`
                      : index % 2 === 0
                      ? colors.bg.white
                      : colors.bg.lighter,
                    borderBottom: index === hours.length - 1 ? 'none' : '1px solid transparent',
                    cursor: hasSlotEvents ? 'default' : isPast ? 'not-allowed' : 'pointer',
                    opacity: isPast ? 0.5 : 1,
                    ['--tw-ring-color' as string]: primary.base,
                  }}
                  onMouseEnter={(e) => {
                    if (!isPast && !hasSlotEvents) {
                      e.currentTarget.style.backgroundColor = `${primary.lighter}20`;
                      e.currentTarget.style.transform = 'translateX(2px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isPast && !hasSlotEvents) {
                      e.currentTarget.style.backgroundColor = isTodayHour
                        ? `${primary.lighter}30`
                        : index % 2 === 0
                        ? colors.bg.white
                        : colors.bg.lighter;
                      e.currentTarget.style.transform = 'translateX(0)';
                    }
                  }}
                  role={!isPast && !hasSlotEvents ? 'button' : undefined}
                  aria-label={!isPast && !hasSlotEvents ? `Add event at ${formatTime(new Date().setHours(hour, 0))}` : undefined}
                  tabIndex={!isPast && !hasSlotEvents ? 0 : -1}
                >
                  <div 
                    className="w-12 sm:w-16 md:w-20 p-1 sm:p-1.5 md:p-2 text-[8px] sm:text-[10px] md:text-xs font-medium flex-shrink-0"
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

                  <div className="flex-1">
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
