'use client';

import React, { useState, useMemo, useCallback } from 'react';
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
  
  // Consistent color palette
  const colors = {
    bg: {
      white: '#ffffff',
      light: '#fafafa',
      lighter: '#f9fafb',
      gray: '#f3f4f6',
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
    }
  };
  
  // Shadow system for depth hierarchy
  const shadows = {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  };
  
  // Helper to format time based on preference
  const formatTime = (date: Date | number) => {
    return format(date, use24Hour ? 'HH:mm' : 'h:mm a');
  };

  const navigateDate = (direction: 'prev' | 'next') => {
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
  };

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
      <div className="bg-white rounded-xl shadow-lg overflow-hidden" style={{ boxShadow: shadows.lg }}>
        {/* Header Skeleton - Compact */}
        <div 
          className="px-3 md:px-4 py-2"
          style={{ 
            background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})` 
          }}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="h-9 w-28 bg-white/20 rounded animate-pulse"></div>
              <div className="h-5 w-32 bg-white/20 rounded animate-pulse"></div>
            </div>
            <div className="h-9 w-40 bg-white/20 rounded animate-pulse"></div>
          </div>
        </div>
        
        {/* Calendar Skeleton */}
        <div className="">
          <div className="space-y-2">
            {/* Week headers skeleton */}
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="h-8 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
            {/* Days skeleton */}
            {Array.from({ length: 5 }).map((_, weekIndex) => (
              <div key={weekIndex} className="grid grid-cols-7 gap-2">
                {Array.from({ length: 7 }).map((_, dayIndex) => (
                  <div key={dayIndex} className="h-20 bg-gray-100 rounded animate-pulse"></div>
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
      className="bg-white rounded-xl overflow-hidden"
      style={{ boxShadow: shadows.lg }}
    >
      {/* Header - Compact Design */}
      <div 
        className="px-3 md:px-4 py-2"
        style={{ 
          background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})` 
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          {/* Left: Title and Navigation */}
          <div className="flex items-center gap-2">
            {/* Navigation */}
            <div className="inline-flex items-center bg-white/10 backdrop-blur-sm rounded-lg">
              <button
                onClick={() => navigateDate('prev')}
                className="p-1.5 rounded-l-lg text-white hover:bg-white/20 transition-colors duration-200"
                aria-label="Previous"
              >
                <ChevronLeftIcon className="w-4 h-4" />
              </button>

              <button
                onClick={goToToday}
                className="px-3 py-1.5 text-xs font-medium text-white hover:bg-white/20 transition-colors duration-200 whitespace-nowrap border-x border-white/10"
              >
                Today
              </button>

              <button
                onClick={() => navigateDate('next')}
                className="p-1.5 rounded-r-lg text-white hover:bg-white/20 transition-colors duration-200"
                aria-label="Next"
              >
                <ChevronRightIcon className="w-4 h-4" />
              </button>
            </div>
            
            {/* Title */}
            <h2 className="text-sm sm:text-base font-bold text-white">
              {format(currentDate, view === 'month' ? 'MMMM yyyy' : view === 'week' ? "'Week of' MMM d, yyyy" : 'MMMM d, yyyy')}
            </h2>
          </div>

          {/* Right: View Toggle */}
          <div className="inline-flex rounded-lg bg-white/10 backdrop-blur-sm p-0.5" role="group" aria-label="Calendar view">
            {(['month', 'week', 'day'] as CalendarView[]).map((viewOption) => (
              <button
                key={viewOption}
                onClick={() => onViewChange(viewOption)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all duration-200 ${
                  view === viewOption
                    ? 'bg-white shadow-md'
                    : 'text-white hover:bg-white/10'
                }`}
                style={view === viewOption ? { color: primary.base } : {}}
                aria-pressed={view === viewOption}
                aria-label={`${viewOption} view`}
              >
                {viewOption.charAt(0).toUpperCase() + viewOption.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Calendar Content */}
      <div className="">
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
  
  // Consistent color palette
  const colors = {
    bg: {
      white: '#ffffff',
      light: '#fafafa',
      lighter: '#f9fafb',
    }
  };
  
  // Shadow system
  const shadows = {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  };
  
  // Hover background hook
  const hoverBg = useHoverBackground(`${primary.lighter}20`);
  
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
    <div className="overflow-x-auto -mx-2 sm:-mx-3 md:-mx-4 px-2 sm:px-3 md:px-0 scrollbar-hide">
      <div className="min-w-[640px] md:min-w-0 w-full">
        <div className="grid grid-cols-7 gap-px bg-gray-200 md:rounded-lg overflow-hidden">
          {/* Day headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div 
              key={day} 
              className="p-1 sm:p-2 text-center"
              style={{ background: `linear-gradient(135deg, ${primary.lighter}20, ${primary.lighter}10)` }}
            >
              <span 
                className="text-[9px] sm:text-[10px] md:text-xs font-semibold uppercase tracking-wider"
                style={{ color: primary.base }}
              >
                {day}
              </span>
            </div>
          ))}

          {/* Calendar days */}
          {days.map(day => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const dayEventsList = dayEvents[dateKey] || [];
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const isTodayDate = isToday(day);
            const isPastDate = day < new Date(new Date().setHours(0, 0, 0, 0));

            return (
              <div
                key={day.toISOString()}
                onClick={() => !isPastDate && onDateClick(day)}
                onKeyDown={(e) => !isPastDate && handleKeyDown(e, day)}
                tabIndex={!isPastDate && isCurrentMonth ? 0 : -1}
                role="button"
                aria-label={`${format(day, 'MMMM d, yyyy')}${isTodayDate ? ' (Today)' : ''}`}
                aria-pressed={isSelected ? 'true' : 'false'}
                onMouseEnter={(e) => {
                  if (!isPastDate && isCurrentMonth) {
                    if (isTodayDate && !isSelected) {
                      e.currentTarget.style.background = `linear-gradient(135deg, ${primary.lighter}40, ${primary.lighter}25)`;
                    } else {
                      e.currentTarget.style.backgroundColor = `${primary.lighter}20`;
                    }
                    e.currentTarget.style.transform = 'scale(1.02)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isPastDate && isCurrentMonth && !isSelected) {
                    if (isTodayDate) {
                      e.currentTarget.style.background = `linear-gradient(135deg, ${primary.lighter}30, ${primary.lighter}15)`;
                    } else {
                      e.currentTarget.style.backgroundColor = isCurrentMonth ? colors.bg.white : colors.bg.lighter;
                    }
                    e.currentTarget.style.transform = 'scale(1)';
                  }
                }}
                className={`min-h-[60px] sm:min-h-[75px] md:min-h-[90px] p-2 transition-all duration-200 ${
                  isPastDate 
                    ? 'cursor-not-allowed' 
                    : isCurrentMonth ? 'cursor-pointer' : 'text-gray-400 cursor-pointer'
                }`}
                style={{
                  ...(isTodayDate && !isSelected 
                    ? { background: `linear-gradient(135deg, ${primary.lighter}30, ${primary.lighter}15)` }
                    : { 
                        backgroundColor: isSelected 
                          ? `${primary.lighter}20`
                          : isPastDate 
                          ? colors.bg.light 
                          : isCurrentMonth 
                          ? colors.bg.white 
                          : colors.bg.lighter
                      }
                  ),
                  opacity: isPastDate ? 0.7 : 1,
                  ...(isSelected ? { boxShadow: `inset 0 0 0 2px ${primary.base}` } : {}),
                }}
              >
                <div className="flex items-center justify-center mb-1">
                  <div className="relative">
                    <span
                      className={`inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full text-xs sm:text-sm font-semibold transition-colors ${
                        isTodayDate || isSelected
                          ? 'text-white'
                          : 'text-gray-900'
                      }`}
                      style={
                        isTodayDate
                          ? { background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})` }
                          : isSelected
                          ? { backgroundColor: primary.base }
                          : {}
                      }
                    >
                      {format(day, 'd')}
                    </span>
                    {/* Event density indicator */}
                    {dayEventsList.length > 0 && !isPastDate && (
                      <div className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 flex gap-0.5">
                        {Array.from({ length: Math.min(dayEventsList.length, 3) }).map((_, i) => (
                          <div
                            key={i}
                            className="w-1 h-1 rounded-full"
                            style={{ 
                              backgroundColor: dayEventsList.length >= 3 ? primary.base : primary.light,
                              opacity: dayEventsList.length >= 3 ? 1 : 0.7
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Events count button - clickable to switch to day view */}
                {dayEventsList.length > 0 && !isPastDate && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDateChange(day); // Set the current date to the clicked day
                      onViewChange('day'); // Switch to day view
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = `${primary.base}30`;
                      e.currentTarget.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = `${primary.base}15`;
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                    className="w-full mt-1 px-2 py-1 rounded-md text-[10px] sm:text-xs font-semibold transition-all duration-200"
                    style={{ 
                      backgroundColor: `${primary.base}15`,
                      color: primary.base
                    }}
                    title={`View ${dayEventsList.length} appointment${dayEventsList.length > 1 ? 's' : ''} on ${format(day, 'MMM d')}`}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>{dayEventsList.length} event{dayEventsList.length > 1 ? 's' : ''}</span>
                    </div>
                  </button>
                )}
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
  const weekStart = startOfWeek(currentDate);
  const weekDays = eachDayOfInterval({ start: weekStart, end: endOfWeek(currentDate) });

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
    <div className="overflow-x-auto -mx-2 sm:mx-0 px-2 sm:px-0 rounded-lg">
      <div className="min-w-[700px] sm:min-w-[800px]">
        {/* Header */}
        <div 
          className="grid grid-cols-8"
          style={{ 
            background: `linear-gradient(135deg, ${primary.lighter}20, ${primary.lighter}10)`,
            borderBottom: `2px solid ${primary.light}`
          }}
        >
          <div 
            className="p-1.5 sm:p-2"
            style={{ borderRight: `1px solid ${primary.lighter}` }}
          ></div>
          {weekDays.map(day => (
            <div 
              key={day.toISOString()} 
              className="p-1.5 sm:p-2 text-center"
              style={{ borderRight: day === weekDays[weekDays.length - 1] ? 'none' : `1px solid ${primary.lighter}` }}
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
        <div ref={containerRef} className="relative bg-white">
          {!hasEvents ? (
            // Empty week - show + buttons
            <div 
              className="grid grid-cols-8 min-h-[200px]"
              style={{ borderBottom: `1px solid ${primary.lighter}` }}
            >
              <div 
                className="p-4"
                style={{ 
                  borderRight: `1px solid ${primary.lighter}`,
                  background: `linear-gradient(135deg, ${primary.lighter}20, ${primary.lighter}10)` 
                }}
              ></div>
              {weekDays.map((day, index) => {
                const isPast = day < new Date(new Date().setHours(0, 0, 0, 0));
                return (
                  <div
                    key={format(day, 'yyyy-MM-dd')}
                    className="p-4 flex items-center justify-center"
                    style={{ 
                      borderRight: index === weekDays.length - 1 ? 'none' : `1px solid ${primary.lighter}`
                    }}
                  >
                    {!isPast && (
                      <button
                        onClick={() => onSlotClick?.(day, 9)}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = `${primary.lighter}30`;
                          e.currentTarget.style.transform = 'scale(1.1)';
                          e.currentTarget.style.boxShadow = shadows.md;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.transform = 'scale(1)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 flex items-center justify-center transition-all duration-200"
                        style={{ 
                          borderColor: primary.base,
                          color: primary.base 
                        }}
                        title="Add event"
                        aria-label={`Add event on ${format(day, 'MMMM d, yyyy')}`}
                      >
                        <span className="text-xl sm:text-2xl font-bold leading-none">+</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            hours.map(hour => (
              <div 
                key={hour} 
                className="grid grid-cols-8 transition-colors"
                style={{ 
                  borderBottom: `1px solid ${primary.lighter}`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = `${primary.lighter}15`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '';
                }}
              >
                <div 
                  className="p-1.5 sm:p-2 text-[9px] sm:text-[10px] md:text-xs font-medium flex-shrink-0"
                  style={{
                    color: primary.active,
                    borderRight: `1px solid ${primary.lighter}`,
                    background: `linear-gradient(135deg, ${primary.lighter}20, ${primary.lighter}10)`
                  }}
                >
                  {formatTime(new Date().setHours(hour, 0, 0, 0))}
                </div>

                {weekDays.map(day => {
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
                    className={`p-1 min-h-[45px] sm:min-h-[55px] transition-all duration-200 ${
                      hasHourEvents
                        ? 'cursor-default'
                        : isPast 
                        ? 'opacity-50 cursor-not-allowed' 
                        : 'cursor-pointer'
                    }`}
                    style={{
                      backgroundColor: isPast ? colors.bg.gray : colors.bg.white,
                      borderRight: day === weekDays[weekDays.length - 1] ? 'none' : `1px solid ${primary.lighter}`
                    }}
                    onMouseEnter={(e) => {
                      if (!isPast && !hasHourEvents) {
                        e.currentTarget.style.backgroundColor = `${primary.lighter}20`;
                        e.currentTarget.style.transform = 'scale(1.01)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isPast && !hasHourEvents) {
                        e.currentTarget.style.backgroundColor = colors.bg.white;
                        e.currentTarget.style.transform = 'scale(1)';
                      }
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
    <div className="overflow-x-auto -mx-2 sm:mx-0 px-2 sm:px-0">
      <div className="min-w-[280px] sm:min-w-0">
        {!hasEvents ? (
          // Empty day - show + button
          <div 
            className="rounded-lg overflow-hidden min-h-[300px] flex items-center justify-center"
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
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center transition-all duration-200"
              style={{ 
                border: `3px solid ${primary.base}`,
                color: primary.base 
              }}
              title="Add event"
              aria-label={`Add event on ${format(currentDate, 'MMMM d, yyyy')}`}
            >
              <span className="text-3xl sm:text-4xl font-bold leading-none">+</span>
            </button>
          </div>
        ) : (
          <div 
            className="space-y-0 rounded-lg overflow-hidden"
            style={{ border: `1px solid ${primary.lighter}` }}
          >
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
                className={`flex min-h-[55px] sm:min-h-[65px] transition-all duration-200`}
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
                  borderBottom: index === hours.length - 1 ? 'none' : `1px solid ${primary.lighter}`,
                  cursor: hasEvents ? 'default' : isPast ? 'not-allowed' : 'pointer',
                  opacity: isPast ? 0.5 : 1
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
                    borderRight: `1px solid ${primary.lighter}`,
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