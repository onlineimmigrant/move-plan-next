'use client';

import React, { useState, useMemo } from 'react';
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-teal-500"></div>
          <div className="mt-4 text-xs sm:text-sm text-gray-500 text-center">Loading calendar...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-br from-teal-500 to-cyan-600 px-2 sm:px-3 md:px-4 py-2 sm:py-3">
        <div className="flex flex-col gap-2 sm:gap-3">
          {/* Title */}
          <h2 className="text-sm sm:text-lg md:text-xl font-bold text-white">
            {format(currentDate, view === 'month' ? 'MMMM yyyy' : view === 'week' ? "'Week of' MMM d, yyyy" : 'MMMM d, yyyy')}
          </h2>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {/* View Toggle */}
            <div className="inline-flex rounded-lg bg-white/10 backdrop-blur-sm p-0.5">
              {(['month', 'week', 'day'] as CalendarView[]).map((viewOption) => (
                <button
                  key={viewOption}
                  onClick={() => onViewChange(viewOption)}
                  className={`px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs md:text-sm font-medium rounded-md transition-all duration-200 ${
                    view === viewOption
                      ? 'bg-white text-teal-600 shadow-md'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  {viewOption.charAt(0).toUpperCase() + viewOption.slice(1)}
                </button>
              ))}
            </div>

            {/* Navigation */}
            <div className="inline-flex items-center gap-1 bg-white/10 backdrop-blur-sm rounded-lg p-0.5">
              <button
                onClick={() => navigateDate('prev')}
                className="p-1 sm:p-1.5 rounded-md text-white hover:bg-white/20 transition-colors duration-200"
                aria-label="Previous"
              >
                <ChevronLeftIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>

              <button
                onClick={goToToday}
                className="px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium text-white hover:bg-white/20 rounded-md transition-colors duration-200 whitespace-nowrap"
              >
                Today
              </button>

              <button
                onClick={() => navigateDate('next')}
                className="p-1 sm:p-1.5 rounded-md text-white hover:bg-white/20 transition-colors duration-200"
                aria-label="Next"
              >
                <ChevronRightIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Content */}
      <div className="p-2 sm:p-3 md:p-4">
        {view === 'month' && (
          <MonthView
            currentDate={currentDate}
            events={events}
            onDateClick={handleDateClick}
            onEventClick={onEventClick}
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
  selectedDate: Date | null;
  use24Hour?: boolean;
}

function MonthView({ currentDate, events, onDateClick, onEventClick, selectedDate, use24Hour = true }: MonthViewProps) {
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
    return eventMap;
  }, [events]);

  return (
    <div className="overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0 scrollbar-hide">
      <div className="min-w-[640px] sm:min-w-0 inline-block">
        <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
          {/* Day headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="bg-gradient-to-br from-teal-50 to-cyan-50 p-1 sm:p-2 text-center">
              <span className="text-[9px] sm:text-[10px] md:text-xs font-semibold text-teal-700 uppercase tracking-wider">
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
                className={`min-h-[60px] sm:min-h-[75px] md:min-h-[90px] p-1 sm:p-1.5 transition-all duration-200 ${
                  isPastDate 
                    ? 'bg-gray-100 opacity-50 cursor-not-allowed' 
                    : isCurrentMonth ? 'bg-white hover:bg-teal-50 cursor-pointer' : 'bg-gray-50 text-gray-400 hover:bg-gray-100 cursor-pointer'
                } ${isSelected ? 'ring-2 ring-teal-500 ring-inset bg-teal-50' : ''} ${
                  isTodayDate ? 'bg-gradient-to-br from-teal-100 to-cyan-100 hover:from-teal-200 hover:to-cyan-200' : ''
                }`}
              >
                <div className="flex items-center justify-center mb-0.5 sm:mb-1">
                  <span
                    className={`inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full text-[10px] sm:text-[11px] md:text-sm font-semibold transition-colors ${
                      isTodayDate
                        ? 'bg-gradient-to-br from-teal-500 to-cyan-600 text-white'
                        : isSelected
                        ? 'bg-teal-500 text-white'
                        : 'text-gray-900'
                    }`}
                  >
                    {format(day, 'd')}
                  </span>
                </div>

                {/* Events for this day */}
                <div className="space-y-0.5">
                  {dayEventsList.slice(0, 3).map(event => {
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
                        className="text-[8px] sm:text-[9px] px-1 py-0.5 rounded transition-colors cursor-pointer"
                        style={{ backgroundColor: `${textColor}15` }}
                      >
                        <div className="font-semibold truncate" style={{ color: textColor }}>
                          {startTime}-{endTime}
                        </div>
                        <div className="text-gray-700 truncate">{customerName}</div>
                      </div>
                    );
                  })}
                  {dayEventsList.length > 3 && (
                    <div className="text-[8px] sm:text-[9px] text-teal-600 font-medium px-1">
                      +{dayEventsList.length - 3} more
                    </div>
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
        <div className="grid grid-cols-8 bg-gradient-to-br from-teal-50 to-cyan-50 border-b-2 border-teal-200">
          <div className="p-1.5 sm:p-2 border-r border-teal-200"></div>
          {weekDays.map(day => (
            <div key={day.toISOString()} className="p-1.5 sm:p-2 text-center border-r border-teal-200 last:border-r-0">
              <div className="text-[9px] sm:text-[10px] md:text-xs font-semibold text-teal-700 uppercase tracking-wide">
                {format(day, 'EEE')}
              </div>
              <div
                className={`mt-0.5 sm:mt-1 inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full text-xs sm:text-sm md:text-base font-bold transition-colors ${
                  isToday(day)
                    ? 'bg-gradient-to-br from-teal-500 to-cyan-600 text-white'
                    : 'text-gray-900'
                }`}
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
            <div className="grid grid-cols-8 border-b border-gray-100 min-h-[200px]">
              <div className="p-4 border-r border-gray-200 bg-gradient-to-br from-teal-50 to-cyan-50"></div>
              {weekDays.map(day => {
                const isPast = day < new Date(new Date().setHours(0, 0, 0, 0));
                return (
                  <div
                    key={format(day, 'yyyy-MM-dd')}
                    className="p-4 border-r border-gray-100 last:border-r-0 flex items-center justify-center"
                  >
                    {!isPast && (
                      <button
                        onClick={() => onSlotClick?.(day, 9)}
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-teal-500 flex items-center justify-center text-teal-600 hover:bg-teal-50 transition-colors"
                        title="Add event"
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
              <div key={hour} className="grid grid-cols-8 border-b border-gray-100 hover:bg-teal-50 transition-colors">
                <div className="p-1.5 sm:p-2 text-[9px] sm:text-[10px] md:text-xs text-teal-700 border-r border-gray-200 font-medium bg-gradient-to-br from-teal-50 to-cyan-50">
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
                    className={`p-0.5 sm:p-1 border-r border-gray-100 last:border-r-0 min-h-[45px] sm:min-h-[55px] transition-colors ${
                      hasHourEvents
                        ? 'cursor-default'
                        : isPast 
                        ? 'bg-gray-100 opacity-50 cursor-not-allowed' 
                        : 'cursor-pointer hover:bg-teal-100'
                    }`}
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
                          className="text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0.5 sm:py-1 mb-0.5 sm:mb-1 rounded-md cursor-pointer transition-all"
                          style={{ 
                            backgroundColor: `${textColor}15`,
                            borderLeft: `3px solid ${textColor}`
                          }}
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
          <div className="rounded-lg overflow-hidden border border-teal-200 bg-gradient-to-br from-teal-50 to-cyan-50 min-h-[300px] flex items-center justify-center">
            <button
              onClick={() => onSlotClick?.(currentDate, 9)}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-3 border-teal-500 flex items-center justify-center text-teal-600 hover:bg-teal-100 transition-colors shadow-lg"
              title="Add event"
            >
              <span className="text-3xl sm:text-4xl font-bold leading-none">+</span>
            </button>
          </div>
        ) : (
          <div className="space-y-0 rounded-lg overflow-hidden border border-teal-200">
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
                className={`flex border-b last:border-b-0 min-h-[55px] sm:min-h-[65px] transition-all duration-200 ${
                  hasEvents
                    ? 'cursor-default'
                    : isPast
                    ? 'bg-gray-100 opacity-50 cursor-not-allowed'
                    : isTodayHour
                    ? 'bg-gradient-to-br from-teal-100 to-cyan-100 hover:from-teal-200 hover:to-cyan-200 cursor-pointer'
                    : index % 2 === 0
                    ? 'bg-white hover:bg-teal-50 cursor-pointer'
                    : 'bg-gray-50 hover:bg-teal-50 cursor-pointer'
                }`}
              >
                <div className="w-14 sm:w-16 md:w-20 p-1.5 sm:p-2 text-[9px] sm:text-[10px] md:text-xs font-medium text-teal-700 border-r border-teal-200 flex-shrink-0 bg-gradient-to-br from-teal-50 to-cyan-50">
                  <div className="sticky top-0">
                    {formatTime(new Date().setHours(hour, 0, 0, 0))}
                  </div>
                </div>

                <div className="flex-1 p-1.5 sm:p-2">
                  {events.length > 0 && (
                    <div className="space-y-1 sm:space-y-1.5">
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
                            className="text-[10px] sm:text-xs p-1.5 sm:p-2 rounded-lg cursor-pointer hover:shadow-md transition-all"
                            style={{
                              backgroundColor: `${textColor}15`,
                              borderLeft: `4px solid ${textColor}`
                            }}
                          >
                            <div className="font-semibold mb-0.5 sm:mb-1" style={{ color: textColor }}>
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