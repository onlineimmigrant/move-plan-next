import { render, screen } from '@testing-library/react';
import { TimeSlotSelector } from '../ui/TimeSlotSelector';
import { TimeSlot } from '../types';

// Mock dependencies
jest.mock('@/hooks/useThemeColors', () => ({
  useThemeColors: () => ({
    cssVars: {
      primary: '#3b82f6',
    },
  }),
}));

describe('TimeSlotSelector', () => {
  const mockSlots: TimeSlot[] = [
    { start: new Date('2025-11-08T09:00:00'), end: new Date('2025-11-08T10:00:00'), available: true },
    { start: new Date('2025-11-08T10:00:00'), end: new Date('2025-11-08T11:00:00'), available: true },
    { start: new Date('2025-11-08T11:00:00'), end: new Date('2025-11-08T12:00:00'), available: false },
    { start: new Date('2025-11-08T14:00:00'), end: new Date('2025-11-08T15:00:00'), available: true },
    { start: new Date('2025-11-08T15:00:00'), end: new Date('2025-11-08T16:00:00'), available: true },
  ];

  const mockOnSlotSelect = jest.fn();

  beforeEach(() => {
    mockOnSlotSelect.mockClear();
  });

  describe('Rendering', () => {
    it('renders without crashing', () => {
      const { container } = render(
        <TimeSlotSelector
          availableSlots={mockSlots}
          selectedSlot={null}
          onSlotSelect={mockOnSlotSelect}
        />
      );

      expect(container).toBeInTheDocument();
    });

    it('handles empty slots array', () => {
      const { container } = render(
        <TimeSlotSelector
          availableSlots={[]}
          selectedSlot={null}
          onSlotSelect={mockOnSlotSelect}
        />
      );

      expect(container).toBeInTheDocument();
    });

    it('renders with timezone information', () => {
      const { container } = render(
        <TimeSlotSelector
          availableSlots={mockSlots}
          selectedSlot={null}
          onSlotSelect={mockOnSlotSelect}
          timezoneInfo={{
            abbreviation: 'PST',
            offset: '-08:00',
            cityName: 'Los Angeles',
          }}
        />
      );

      expect(container).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('renders in loading state', () => {
      const { container } = render(
        <TimeSlotSelector
          availableSlots={mockSlots}
          selectedSlot={null}
          onSlotSelect={mockOnSlotSelect}
          isLoading={true}
        />
      );

      expect(container).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('renders with error message', () => {
      const { container } = render(
        <TimeSlotSelector
          availableSlots={mockSlots}
          selectedSlot={null}
          onSlotSelect={mockOnSlotSelect}
          error="Failed to load time slots"
        />
      );

      expect(container).toBeInTheDocument();
    });

    it('renders with retry callback', () => {
      const mockRetry = jest.fn();
      const { container } = render(
        <TimeSlotSelector
          availableSlots={mockSlots}
          selectedSlot={null}
          onSlotSelect={mockOnSlotSelect}
          error="Failed to load"
          onRetry={mockRetry}
        />
      );

      expect(container).toBeInTheDocument();
    });
  });
});
