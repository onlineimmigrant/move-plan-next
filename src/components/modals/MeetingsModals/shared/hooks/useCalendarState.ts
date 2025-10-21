import { useState, useCallback, useMemo } from 'react';
import { CalendarEvent, CalendarView, TimeSlot } from '../types';

/**
 * Custom hook for managing calendar state
 * Handles date navigation, view switching, and event management
 */
export const useCalendarState = (initialDate?: Date) => {
  const [currentDate, setCurrentDate] = useState(initialDate || new Date());
  const [calendarView, setCalendarView] = useState<CalendarView>('month');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const navigateToDate = useCallback((date: Date) => {
    setCurrentDate(date);
  }, []);

  const navigateToToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  const navigateToNext = useCallback(() => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      switch (calendarView) {
        case 'month':
          newDate.setMonth(prev.getMonth() + 1);
          break;
        case 'week':
          newDate.setDate(prev.getDate() + 7);
          break;
        case 'day':
          newDate.setDate(prev.getDate() + 1);
          break;
      }
      return newDate;
    });
  }, [calendarView]);

  const navigateToPrevious = useCallback(() => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      switch (calendarView) {
        case 'month':
          newDate.setMonth(prev.getMonth() - 1);
          break;
        case 'week':
          newDate.setDate(prev.getDate() - 7);
          break;
        case 'day':
          newDate.setDate(prev.getDate() - 1);
          break;
      }
      return newDate;
    });
  }, [calendarView]);

  const changeView = useCallback((view: CalendarView) => {
    setCalendarView(view);
  }, []);

  const addEvent = useCallback((event: CalendarEvent) => {
    setEvents(prev => [...prev, event]);
  }, []);

  const updateEvent = useCallback((eventId: string, updates: Partial<CalendarEvent>) => {
    setEvents(prev => prev.map(event =>
      event.id === eventId ? { ...event, ...updates } : event
    ));
  }, []);

  const removeEvent = useCallback((eventId: string) => {
    setEvents(prev => prev.filter(event => event.id !== eventId));
  }, []);

  const clearEvents = useCallback(() => {
    setEvents([]);
  }, []);

  // Memoized computed values
  const currentMonthEvents = useMemo(() => {
    if (calendarView !== 'month') return events;
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    return events.filter(event =>
      event.start >= startOfMonth && event.start <= endOfMonth
    );
  }, [events, currentDate, calendarView]);

  const currentWeekEvents = useMemo(() => {
    if (calendarView !== 'week') return events;
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    return events.filter(event =>
      event.start >= startOfWeek && event.start <= endOfWeek
    );
  }, [events, currentDate, calendarView]);

  const currentDayEvents = useMemo(() => {
    if (calendarView !== 'day') return events;
    const startOfDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
    const endOfDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 23, 59, 59);
    return events.filter(event =>
      event.start >= startOfDay && event.start <= endOfDay
    );
  }, [events, currentDate, calendarView]);

  const visibleEvents = useMemo(() => {
    switch (calendarView) {
      case 'month':
        return currentMonthEvents;
      case 'week':
        return currentWeekEvents;
      case 'day':
        return currentDayEvents;
      default:
        return events;
    }
  }, [calendarView, currentMonthEvents, currentWeekEvents, currentDayEvents, events]);

  return {
    currentDate,
    calendarView,
    events,
    visibleEvents,
    isLoading,
    setCurrentDate: navigateToDate,
    setCalendarView: changeView,
    setEvents,
    setIsLoading,
    navigateToToday,
    navigateToNext,
    navigateToPrevious,
    addEvent,
    updateEvent,
    removeEvent,
    clearEvents,
  };
};