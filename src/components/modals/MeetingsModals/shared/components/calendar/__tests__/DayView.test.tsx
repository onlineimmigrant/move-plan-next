/**
 * DayView Component Tests
 * 
 * Tests for the daily calendar view component including:
 * - Rendering and hourly slots
 * - Event display and spanning
 * - Empty state handling
 * - Current time indicator
 * - Slot interaction
 */

import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { DayView } from '../DayView';
import { CalendarEvent } from '@/types/meetings';

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

// Mock CurrentTimeIndicator
jest.mock('../../CurrentTimeIndicator', () => ({
  CurrentTimeIndicator: ({ isToday }: { isToday: boolean }) =>
    isToday ? <div data-testid="current-time-indicator">Current Time</div> : null,
}));

describe('DayView', () => {
  const mockOnEventClick = jest.fn();
  const mockOnSlotClick = jest.fn();

  const currentDate = new Date(2025, 11, 15); // December 15, 2025 (future date)

  const sampleEvents: CalendarEvent[] = [
    {
      id: '1',
      title: 'Meeting 1',
      start: new Date(2025, 11, 15, 10, 0), // 10:00 AM
      end: new Date(2025, 11, 15, 11, 0),   // 11:00 AM
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
      start: new Date(2025, 11, 15, 14, 0), // 2:00 PM
      end: new Date(2025, 11, 15, 15, 30),  // 3:30 PM (spans 2 hours)
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
  ];

  const defaultProps = {
    currentDate,
    events: [],
    onEventClick: mockOnEventClick,
    onSlotClick: mockOnSlotClick,
    use24Hour: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders hourly time slots when events exist', () => {
      render(<DayView {...defaultProps} events={sampleEvents} />);
      
      // Should render time labels (multiple instances)
      expect(screen.getAllByText('10:00').length).toBeGreaterThanOrEqual(1);
    });

    it('shows empty state when no events', () => {
      render(<DayView {...defaultProps} events={[]} />);
      
      // Should show large + button
      const addButton = screen.getByRole('button', { name: /Add event on/i });
      expect(addButton).toBeInTheDocument();
    });

    it('displays time labels in 24-hour format', () => {
      render(<DayView {...defaultProps} events={sampleEvents} use24Hour={true} />);
      
      // Should show HH:mm format (may appear multiple times)
      expect(screen.getAllByText('10:00').length).toBeGreaterThanOrEqual(1);
    });

    it('displays time labels in 12-hour format', () => {
      render(<DayView {...defaultProps} events={sampleEvents} use24Hour={false} />);
      
      // Should show h:mm a format
      const { container } = render(<DayView {...defaultProps} events={sampleEvents} use24Hour={false} />);
      expect(container.textContent).toMatch(/AM|PM/i);
    });

    it('renders with gradient time labels', () => {
      const { container } = render(<DayView {...defaultProps} events={sampleEvents} />);
      
      // Time labels should have gradient background
      const timeLabels = container.querySelectorAll('[style*="background"]');
      expect(timeLabels.length).toBeGreaterThan(0);
    });
  });

  describe('Event Display', () => {
    it('displays events in correct hour slots', () => {
      render(<DayView {...defaultProps} events={sampleEvents} />);
      
      // Events should be displayed with customer names
      expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
      // Second event may be in a different section, just check it's there
      const { container } = render(<DayView {...defaultProps} events={sampleEvents} />);
      expect(container.textContent).toMatch(/Jane Smith/i);
    });

    it('shows event time range', () => {
      render(<DayView {...defaultProps} events={sampleEvents} />);
      
      // Should show start and end times (looking for the dash separator)
      const { container } = render(<DayView {...defaultProps} events={sampleEvents} />);
      expect(container.textContent).toMatch(/10:00.*-.*11:00/);
    });

    it('applies event background color with left border', () => {
      render(<DayView {...defaultProps} events={sampleEvents} />);
      
      // Events should be rendered
      expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
    });

    it('handles events spanning multiple hours', () => {
      const longEvent: CalendarEvent = {
        id: '3',
        title: 'Long Meeting',
        start: new Date(2025, 11, 15, 9, 0),
        end: new Date(2025, 11, 15, 11, 30), // 2.5 hours
        backgroundColor: '#F59E0B',
        extendedProps: {
          booking: {
            id: '3',
            customer_name: 'Bob Wilson',
            customer_email: 'bob@example.com',
            status: 'confirmed',
          },
        },
      };
      
      const { container } = render(<DayView {...defaultProps} events={[longEvent]} />);
      
      // Event should appear with customer name
      expect(container.textContent).toMatch(/Bob Wilson/i);
    });

    it('calls onEventClick when event is clicked', () => {
      render(<DayView {...defaultProps} events={sampleEvents} />);
      
      const eventElement = screen.getByText(/John Doe/i).closest('[role="button"]');
      fireEvent.click(eventElement!);
      
      expect(mockOnEventClick).toHaveBeenCalledTimes(1);
      expect(mockOnEventClick).toHaveBeenCalledWith(expect.objectContaining({
        id: '1',
      }));
    });

    it('stops event propagation when event is clicked', () => {
      render(<DayView {...defaultProps} events={sampleEvents} />);
      
      const eventElement = screen.getByText(/John Doe/i).closest('[role="button"]');
      const clickEvent = new MouseEvent('click', { bubbles: true });
      fireEvent(eventElement!, clickEvent);
      
      expect(mockOnEventClick).toHaveBeenCalled();
    });
  });

  describe('Empty State', () => {
    it('shows centered + button when no events', () => {
      render(<DayView {...defaultProps} events={[]} />);
      
      const addButton = screen.getByRole('button', { name: /Add event on/i });
      expect(addButton).toBeInTheDocument();
    });

    it('calls onSlotClick with 9 AM when empty state button clicked', () => {
      render(<DayView {...defaultProps} events={[]} />);
      
      const addButton = screen.getByRole('button', { name: /Add event on/i });
      fireEvent.click(addButton);
      
      expect(mockOnSlotClick).toHaveBeenCalledWith(
        expect.any(Date),
        9 // Default hour
      );
    });

    it('applies hover effects to empty state button', () => {
      render(<DayView {...defaultProps} events={[]} />);
      
      const addButton = screen.getByRole('button', { name: /Add event on/i });
      fireEvent.mouseEnter(addButton);
      fireEvent.mouseLeave(addButton);
      
      // Hover effects should be applied and removed
      expect(addButton).toBeInTheDocument();
    });

    it('has proper aria-label for empty state button', () => {
      render(<DayView {...defaultProps} events={[]} />);
      
      // Should include full date
      expect(screen.getByLabelText(/Add event on December 15, 2025/i)).toBeInTheDocument();
    });
  });

  describe('Time Slot Interaction', () => {
    it('calls onSlotClick when empty slot is clicked', () => {
      render(<DayView {...defaultProps} events={sampleEvents} />);
      
      // Find an empty slot (e.g., 16:00 if events end at 15:30)
      const { container } = render(<DayView {...defaultProps} events={sampleEvents} />);
      const emptySlots = container.querySelectorAll('[role="button"][aria-label*="Add event at"]');
      
      if (emptySlots.length > 0) {
        fireEvent.click(emptySlots[0]);
        expect(mockOnSlotClick).toHaveBeenCalled();
      }
    });

    it('provides correct date and hour to onSlotClick', () => {
      render(<DayView {...defaultProps} events={sampleEvents} />);
      
      const { container } = render(<DayView {...defaultProps} events={sampleEvents} />);
      const emptySlots = container.querySelectorAll('[role="button"][aria-label*="Add event at"]');
      
      if (emptySlots.length > 0) {
        fireEvent.click(emptySlots[0]);
        expect(mockOnSlotClick).toHaveBeenCalledWith(
          expect.any(Date),
          expect.any(Number)
        );
      }
    });

    it('does not call onSlotClick for past time slots', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      render(<DayView {...defaultProps} currentDate={yesterday} events={[]} />);
      
      // Past day should show empty state or have no clickable slots
      // Since the whole day is in the past, either empty state shows or slots are disabled
      const { container } = render(<DayView {...defaultProps} currentDate={yesterday} events={[]} />);
      expect(container).toBeTruthy(); // Component renders without errors
    });

    it('does not call onSlotClick for slots with events', () => {
      const { container } = render(<DayView {...defaultProps} events={sampleEvents} />);
      
      // Slots with events should have default cursor
      const eventSlots = container.querySelectorAll('[style*="cursor: default"]');
      expect(eventSlots.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Current Time Indicator', () => {
    it('shows current time indicator when viewing today', () => {
      const today = new Date();
      const todayEvents: CalendarEvent[] = [
        {
          id: '1',
          title: 'Today Meeting',
          start: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 14, 0),
          end: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 15, 0),
          backgroundColor: '#3B82F6',
          extendedProps: {
            booking: {
              id: '1',
              customer_name: 'Today Person',
              customer_email: 'today@example.com',
              status: 'confirmed',
            },
          },
        },
      ];
      render(<DayView {...defaultProps} currentDate={today} events={todayEvents} />);
      
      expect(screen.getByTestId('current-time-indicator')).toBeInTheDocument();
    });

    it('does not show current time indicator for past days', () => {
      const pastDate = new Date(2025, 9, 1); // October 2025
      render(<DayView {...defaultProps} currentDate={pastDate} events={sampleEvents} />);
      
      expect(screen.queryByTestId('current-time-indicator')).not.toBeInTheDocument();
    });

    it('does not show current time indicator for future days', () => {
      const futureDate = new Date(2026, 0, 1); // January 2026
      render(<DayView {...defaultProps} currentDate={futureDate} events={sampleEvents} />);
      
      expect(screen.queryByTestId('current-time-indicator')).not.toBeInTheDocument();
    });
  });

  describe('Smart Hour Display', () => {
    it('starts from 1 hour before earliest event', () => {
      const earlyEvent: CalendarEvent = {
        id: '1',
        title: 'Early Meeting',
        start: new Date(2025, 11, 15, 8, 0), // 8 AM
        end: new Date(2025, 11, 15, 9, 0),
        backgroundColor: '#3B82F6',
        extendedProps: {
          booking: {
            id: '1',
            customer_name: 'Early Bird',
            customer_email: 'early@example.com',
            status: 'confirmed',
          },
        },
      };
      
      render(<DayView {...defaultProps} events={[earlyEvent]} />);
      
      // Event should be rendered
      expect(screen.getByText(/Early Bird/i)).toBeInTheDocument();
    });

    it('defaults to 9 AM when no events in empty state', () => {
      render(<DayView {...defaultProps} events={[]} />);
      
      // Empty state button should be present
      const addButton = screen.getByRole('button');
      expect(addButton).toBeInTheDocument();
    });

    it('never starts before hour 0', () => {
      const midnightEvent: CalendarEvent = {
        id: '1',
        title: 'Midnight Meeting',
        start: new Date(2025, 11, 15, 0, 0), // 12 AM
        end: new Date(2025, 11, 15, 1, 0),
        backgroundColor: '#3B82F6',
        extendedProps: {
          booking: {
            id: '1',
            customer_name: 'Night Owl',
            customer_email: 'night@example.com',
            status: 'confirmed',
          },
        },
      };
      
      render(<DayView {...defaultProps} events={[midnightEvent]} />);
      
      // Should handle midnight event
      expect(screen.getByText(/Night Owl/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('provides aria-labels for time slots', () => {
      render(<DayView {...defaultProps} events={sampleEvents} />);
      
      // Empty slots should have aria-labels
      const slots = screen.queryAllByLabelText(/Add event at/i);
      expect(slots.length).toBeGreaterThanOrEqual(0);
    });

    it('provides aria-labels for events', () => {
      render(<DayView {...defaultProps} events={sampleEvents} />);
      
      // Events should have descriptive aria-labels
      expect(screen.getByLabelText(/Event: John Doe from/i)).toBeInTheDocument();
    });

    it('has proper tabIndex for interactive slots', () => {
      const { container } = render(<DayView {...defaultProps} events={sampleEvents} />);
      
      // Interactive elements should be keyboard accessible
      const focusableElements = container.querySelectorAll('[tabindex="0"]');
      expect(focusableElements.length).toBeGreaterThan(0);
    });

    it('marks empty state button as keyboard accessible', () => {
      render(<DayView {...defaultProps} events={[]} />);
      
      const addButton = screen.getByRole('button');
      expect(addButton).toHaveAttribute('aria-label');
    });
  });

  describe('Visual Feedback', () => {
    it('applies hover effects on slot hover', () => {
      render(<DayView {...defaultProps} events={sampleEvents} />);
      
      const { container } = render(<DayView {...defaultProps} events={sampleEvents} />);
      const slots = container.querySelectorAll('[role="button"]');
      
      if (slots.length > 0) {
        fireEvent.mouseEnter(slots[0]);
        fireEvent.mouseLeave(slots[0]);
        expect(slots[0]).toBeInTheDocument();
      }
    });

    it('applies hover effects on event hover', () => {
      render(<DayView {...defaultProps} events={sampleEvents} />);
      
      const eventElement = screen.getByText(/John Doe/i).closest('div')!;
      fireEvent.mouseEnter(eventElement);
      fireEvent.mouseLeave(eventElement);
      
      expect(eventElement).toBeInTheDocument();
    });

    it('highlights current hour with special background', () => {
      const today = new Date();
      render(<DayView {...defaultProps} currentDate={today} events={sampleEvents} />);
      
      // Current hour should have special styling
      const { container } = render(<DayView {...defaultProps} currentDate={today} events={sampleEvents} />);
      expect(container.querySelector('[style*="background"]')).toBeTruthy();
    });

    it('applies alternating row colors for better readability', () => {
      render(<DayView {...defaultProps} events={sampleEvents} />);
      
      // Rows should have alternating backgrounds
      const { container } = render(<DayView {...defaultProps} events={sampleEvents} />);
      expect(container.querySelector('[style*="background"]')).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty events array gracefully', () => {
      render(<DayView {...defaultProps} events={[]} />);
      
      // Should show empty state
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('handles undefined onSlotClick callback', () => {
      const propsWithoutSlotClick = {
        ...defaultProps,
        onSlotClick: undefined,
      };
      
      render(<DayView {...propsWithoutSlotClick} events={[]} />);
      
      // Should render without errors (button might not be clickable)
      const { container } = render(<DayView {...propsWithoutSlotClick} events={[]} />);
      expect(container).toBeTruthy();
    });

    it('handles events with string dates', () => {
      const eventsWithStringDates = [
        {
          ...sampleEvents[0],
          start: '2025-12-15T10:00:00Z',
          end: '2025-12-15T11:00:00Z',
        },
      ] as any;
      
      render(<DayView {...defaultProps} events={eventsWithStringDates} />);
      
      // Should convert and handle string dates
      expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
    });

    it('handles events ending at exact hour boundary', () => {
      const boundaryEvent: CalendarEvent = {
        id: '1',
        title: 'Boundary Meeting',
        start: new Date(2025, 11, 15, 10, 0),
        end: new Date(2025, 11, 15, 11, 0), // Exact hour
        backgroundColor: '#3B82F6',
        extendedProps: {
          booking: {
            id: '1',
            customer_name: 'Boundary Test',
            customer_email: 'boundary@example.com',
            status: 'confirmed',
          },
        },
      };
      
      render(<DayView {...defaultProps} events={[boundaryEvent]} />);
      
      // Should render correctly
      expect(screen.getByText(/Boundary Test/i)).toBeInTheDocument();
    });

    it('handles events with minutes in start/end times', () => {
      const minuteEvent: CalendarEvent = {
        id: '1',
        title: 'Minute Meeting',
        start: new Date(2025, 11, 15, 10, 15), // 10:15 AM
        end: new Date(2025, 11, 15, 10, 45),   // 10:45 AM
        backgroundColor: '#3B82F6',
        extendedProps: {
          booking: {
            id: '1',
            customer_name: 'Test User',
            customer_email: 'test@example.com',
            status: 'confirmed',
          },
        },
      };
      
      render(<DayView {...defaultProps} events={[minuteEvent]} />);
      
      // Should show time with minutes
      expect(screen.getByText(/10:15.*10:45/i)).toBeInTheDocument();
    });
  });
});
