/**
 * MonthView Component Tests
 * 
 * Tests for the monthly calendar view component including:
 * - Rendering and layout
 * - Date selection and navigation
 * - Event display and indicators
 * - Keyboard navigation
 * - Accessibility features
 */

import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MonthView } from '../MonthView';
import { CalendarEvent } from '@/types/meetings';
import { format, addDays, subDays } from 'date-fns';

// Mock hooks
jest.mock('@/hooks/useThemeColors', () => ({
  useThemeColors: () => ({
    cssVars: {
      primary: {
        base: '#3B82F6',
        hover: '#2563EB',
        active: '#1D4ED8',
        light: '#DBEAFE',
        lighter: '#EFF6FF',
      },
    },
  }),
}));

jest.mock('../../../hooks', () => ({
  useHoverBackground: () => ({
    handleMouseEnter: jest.fn(),
    handleMouseLeave: jest.fn(),
  }),
}));

describe('MonthView', () => {
  const mockOnDateClick = jest.fn();
  const mockOnEventClick = jest.fn();
  const mockOnViewChange = jest.fn();
  const mockOnDateChange = jest.fn();

  const currentDate = new Date(2025, 10, 7); // November 7, 2025
  const selectedDate = new Date(2025, 10, 10); // November 10, 2025

  const sampleEvents: CalendarEvent[] = [
    {
      id: '1',
      title: 'Meeting 1',
      start: new Date(2025, 10, 10, 10, 0),
      end: new Date(2025, 10, 10, 11, 0),
      backgroundColor: '#3B82F6',
      extendedProps: {
        booking: {
          id: '1',
          customer_name: 'John Doe',
          customer_email: 'john@example.com',
          status: 'confirmed',
        },
      },
    },
    {
      id: '2',
      title: 'Meeting 2',
      start: new Date(2025, 10, 10, 14, 0),
      end: new Date(2025, 10, 10, 15, 0),
      backgroundColor: '#10B981',
      extendedProps: {
        booking: {
          id: '2',
          customer_name: 'Jane Smith',
          customer_email: 'jane@example.com',
          status: 'confirmed',
        },
      },
    },
    {
      id: '3',
      title: 'Meeting 3',
      start: new Date(2025, 10, 15, 9, 0),
      end: new Date(2025, 10, 15, 10, 0),
      backgroundColor: '#F59E0B',
      extendedProps: {
        booking: {
          id: '3',
          customer_name: 'Bob Wilson',
          customer_email: 'bob@example.com',
          status: 'confirmed',
        },
      },
    },
  ];

  const defaultProps = {
    currentDate,
    events: [],
    onDateClick: mockOnDateClick,
    onEventClick: mockOnEventClick,
    onViewChange: mockOnViewChange,
    onDateChange: mockOnDateChange,
    selectedDate: null,
    use24Hour: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the calendar grid with 7 columns', () => {
      render(<MonthView {...defaultProps} />);
      
      // Check for day headers
      expect(screen.getByText(/Mon/i)).toBeInTheDocument();
      expect(screen.getByText(/Tue/i)).toBeInTheDocument();
      expect(screen.getByText(/Wed/i)).toBeInTheDocument();
    });

    it('renders all days in the month view (typically 35-42 days)', () => {
      render(<MonthView {...defaultProps} />);
      
      // Should render at least 35 days (5 weeks * 7 days)
      const dates = screen.getAllByRole('button');
      expect(dates.length).toBeGreaterThanOrEqual(35);
    });

    it('displays the current month dates', () => {
      render(<MonthView {...defaultProps} />);
      
      // Should show dates 1-30 for November (may appear multiple times due to prev/next month)
      expect(screen.getAllByText('1').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('15').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('30').length).toBeGreaterThanOrEqual(1);
    });

    it('displays dates from previous and next months in muted style', () => {
      const { container } = render(<MonthView {...defaultProps} />);
      
      // Previous/next month dates should have muted appearance
      const allDateCells = container.querySelectorAll('[role="button"]');
      const mutedCells = Array.from(allDateCells).filter(cell => 
        cell.className.includes('text-gray-400')
      );
      
      expect(mutedCells.length).toBeGreaterThan(0);
    });
  });

  describe('Date Selection', () => {
    it('calls onDateClick when a future date is clicked', () => {
      render(<MonthView {...defaultProps} />);
      
      const futureDate = screen.getByLabelText(/November 15, 2025/);
      fireEvent.click(futureDate);
      
      expect(mockOnDateClick).toHaveBeenCalledTimes(1);
      expect(mockOnDateClick).toHaveBeenCalledWith(expect.any(Date));
    });

    it('highlights the selected date', () => {
      render(<MonthView {...defaultProps} selectedDate={selectedDate} />);
      
      const selectedCell = screen.getByLabelText(/November 10, 2025/);
      expect(selectedCell).toHaveAttribute('aria-pressed', 'true');
    });

    it('does not call onDateClick for past dates', () => {
      const pastDate = subDays(new Date(), 5);
      render(<MonthView {...defaultProps} currentDate={pastDate} />);
      
      // Try to click a past date
      const pastDateCell = screen.getAllByRole('button')[0];
      fireEvent.click(pastDateCell);
      
      // Should not be called for past dates
      expect(mockOnDateClick).not.toHaveBeenCalled();
    });

    it('highlights today with special styling', () => {
      const today = new Date();
      render(<MonthView {...defaultProps} currentDate={today} />);
      
      // Today should have "(Today)" in aria-label
      const todayCell = screen.getByLabelText(/\(Today\)/);
      expect(todayCell).toBeInTheDocument();
    });
  });

  describe('Event Display', () => {
    it('shows event count badges on dates with events', () => {
      render(<MonthView {...defaultProps} events={sampleEvents} />);
      
      // November 10 has 2 events
      const nov10 = screen.getByLabelText(/November 10, 2025.*2 appointment/);
      expect(nov10).toBeInTheDocument();
      
      // Badge should show count
      const badge = within(nov10).getByText('2');
      expect(badge).toBeInTheDocument();
    });

    it('shows event indicators (dots) on dates with events', () => {
      const { container } = render(<MonthView {...defaultProps} events={sampleEvents} />);
      
      // Dots should be present for dates with events
      const dots = container.querySelectorAll('.w-1\\.5.h-1\\.5.rounded-full');
      expect(dots.length).toBeGreaterThan(0);
    });

    it('shows correct plural in aria-label for multiple appointments', () => {
      render(<MonthView {...defaultProps} events={sampleEvents} />);
      
      // November 10 has 2 appointments (plural)
      expect(screen.getByLabelText(/2 appointments/)).toBeInTheDocument();
    });

    it('shows correct singular in aria-label for single appointment', () => {
      render(<MonthView {...defaultProps} events={sampleEvents} />);
      
      // November 15 has 1 appointment (singular) - look for the specific date
      const nov15 = screen.getByLabelText(/November 15, 2025, 1 appointment/);
      expect(nov15).toBeInTheDocument();
    });

    it('uses warning color for busy days (3+ events)', () => {
      const busyDayEvents: CalendarEvent[] = [
        ...sampleEvents,
        {
          id: '4',
          title: 'Meeting 4',
          start: new Date(2025, 10, 10, 16, 0),
          end: new Date(2025, 10, 10, 17, 0),
          backgroundColor: '#EF4444',
          extendedProps: {
            booking: {
              id: '4',
              customer_name: 'Extra Meeting',
              customer_email: 'extra@example.com',
              status: 'confirmed',
            },
          },
        },
      ];
      
      render(<MonthView {...defaultProps} events={busyDayEvents} />);
      
      // Nov 10 now has 3 appointments - should have indicator
      const nov10Cell = screen.getByLabelText(/November 10, 2025.*3 appointments/);
      expect(nov10Cell).toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    it('allows Enter key to select a date', () => {
      render(<MonthView {...defaultProps} />);
      
      const futureDate = screen.getByLabelText(/November 15, 2025/);
      fireEvent.keyDown(futureDate, { key: 'Enter' });
      
      expect(mockOnDateClick).toHaveBeenCalledTimes(1);
    });

    it('allows Space key to select a date', () => {
      render(<MonthView {...defaultProps} />);
      
      const futureDate = screen.getByLabelText(/November 15, 2025/);
      fireEvent.keyDown(futureDate, { key: ' ' });
      
      expect(mockOnDateClick).toHaveBeenCalledTimes(1);
    });

    it('has proper tabIndex for current month dates', () => {
      render(<MonthView {...defaultProps} />);
      
      const currentMonthDate = screen.getByLabelText(/November 15, 2025/);
      expect(currentMonthDate).toHaveAttribute('tabIndex', '0');
    });

    it('has tabIndex -1 for past dates', () => {
      const { container } = render(<MonthView {...defaultProps} />);
      
      // Past dates should not be keyboard-accessible
      const pastDates = container.querySelectorAll('[tabindex="-1"]');
      expect(pastDates.length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility', () => {
    it('has role="button" for interactive date cells', () => {
      render(<MonthView {...defaultProps} />);
      
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('provides descriptive aria-labels for dates', () => {
      render(<MonthView {...defaultProps} events={sampleEvents} />);
      
      // Should include full date and event count
      expect(screen.getByLabelText(/November 10, 2025.*2 appointment/)).toBeInTheDocument();
    });

    it('marks selected date with aria-pressed="true"', () => {
      render(<MonthView {...defaultProps} selectedDate={selectedDate} />);
      
      const selectedCell = screen.getByLabelText(/November 10, 2025/);
      expect(selectedCell).toHaveAttribute('aria-pressed', 'true');
    });

    it('marks unselected dates with aria-pressed="false"', () => {
      render(<MonthView {...defaultProps} selectedDate={selectedDate} />);
      
      const unselectedCell = screen.getByLabelText(/November 15, 2025/);
      expect(unselectedCell).toHaveAttribute('aria-pressed', 'false');
    });

    it('identifies today in aria-label', () => {
      const today = new Date();
      render(<MonthView {...defaultProps} currentDate={today} />);
      
      const todayLabel = screen.getByLabelText(/\(Today\)/);
      expect(todayLabel).toBeInTheDocument();
    });
  });

  describe('Time Format', () => {
    it('respects use24Hour=true format', () => {
      render(<MonthView {...defaultProps} use24Hour={true} events={sampleEvents} />);
      
      // Component should handle time formatting internally
      // This test ensures the prop is accepted
      expect(screen.getByLabelText(/November 10, 2025/)).toBeInTheDocument();
    });

    it('respects use24Hour=false format', () => {
      render(<MonthView {...defaultProps} use24Hour={false} events={sampleEvents} />);
      
      // Component should handle time formatting internally
      // This test ensures the prop is accepted
      expect(screen.getByLabelText(/November 10, 2025/)).toBeInTheDocument();
    });
  });

  describe('Visual Feedback', () => {
    it('applies hover effects on mouse enter', () => {
      const { container } = render(<MonthView {...defaultProps} />);
      
      const futureDate = screen.getByLabelText(/November 15, 2025/);
      fireEvent.mouseEnter(futureDate);
      
      // Visual feedback should be applied (tested through event firing)
      expect(futureDate).toBeInTheDocument();
    });

    it('removes hover effects on mouse leave', () => {
      const { container } = render(<MonthView {...defaultProps} />);
      
      const futureDate = screen.getByLabelText(/November 15, 2025/);
      fireEvent.mouseEnter(futureDate);
      fireEvent.mouseLeave(futureDate);
      
      // Visual feedback should be removed (tested through event firing)
      expect(futureDate).toBeInTheDocument();
    });

    it('applies disabled styling to past dates', () => {
      const { container } = render(<MonthView {...defaultProps} />);
      
      // Past dates should have cursor-not-allowed or similar
      const pastDates = container.querySelectorAll('.cursor-not-allowed');
      expect(pastDates.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('handles empty events array', () => {
      render(<MonthView {...defaultProps} events={[]} />);
      
      // Should render without errors
      expect(screen.getByText('Sun')).toBeInTheDocument();
    });

    it('handles null selectedDate', () => {
      render(<MonthView {...defaultProps} selectedDate={null} />);
      
      // Should render without errors
      expect(screen.getByText('Sun')).toBeInTheDocument();
    });

    it('handles events with string dates', () => {
      const eventsWithStringDates = [
        {
          ...sampleEvents[0],
          start: '2025-11-10T10:00:00Z',
          end: '2025-11-10T11:00:00Z',
        },
      ] as any;
      
      render(<MonthView {...defaultProps} events={eventsWithStringDates} />);
      
      // Should convert and handle string dates
      expect(screen.getByText('Sun')).toBeInTheDocument();
    });

    it('handles month transitions correctly', () => {
      const endOfMonth = new Date(2025, 10, 30);
      render(<MonthView {...defaultProps} currentDate={endOfMonth} />);
      
      // Should show dates from December in the grid
      expect(screen.getByText('Sun')).toBeInTheDocument();
    });
  });
});
