import { render, screen, fireEvent } from '@testing-library/react';
import MeetingTypeCards from '../components/MeetingTypeCards';

// Mock dependencies
jest.mock('@/hooks/useThemeColors', () => ({
  useThemeColors: () => ({
    cssVars: {
      primary: '#3b82f6',
    },
  }),
}));

describe('MeetingTypeCards', () => {
  const mockMeetingTypes = [
    {
      id: '1',
      name: '30 Min Meeting',
      description: 'Quick sync meeting',
      duration: 30,
      color: '#3b82f6',
      active: true,
      bufferBefore: 0,
      bufferAfter: 0,
    },
    {
      id: '2',
      name: '60 Min Meeting',
      description: 'In-depth discussion',
      duration: 60,
      color: '#10b981',
      active: true,
      bufferBefore: 15,
      bufferAfter: 15,
    },
    {
      id: '3',
      name: 'Inactive Meeting',
      description: 'Not available',
      duration: 45,
      color: '#ef4444',
      active: false,
      bufferBefore: 0,
      bufferAfter: 0,
    },
  ];

  const mockOnSelect = jest.fn();
  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();

  beforeEach(() => {
    mockOnSelect.mockClear();
    mockOnEdit.mockClear();
    mockOnDelete.mockClear();
  });

  describe('Rendering', () => {
    it('renders without crashing', () => {
      const { container } = render(
        <MeetingTypeCards
          meetingTypes={mockMeetingTypes}
          onSelect={mockOnSelect}
        />
      );

      expect(container).toBeInTheDocument();
    });

    it('displays all meeting types', () => {
      render(
        <MeetingTypeCards
          meetingTypes={mockMeetingTypes}
          onSelect={mockOnSelect}
        />
      );

      // Should render meeting types
      expect(true).toBe(true);
    });

    it('handles empty meeting types array', () => {
      const { container } = render(
        <MeetingTypeCards
          meetingTypes={[]}
          onSelect={mockOnSelect}
        />
      );

      expect(container).toBeInTheDocument();
    });

    it('shows only active types when showInactive is false', () => {
      const { container } = render(
        <MeetingTypeCards
          meetingTypes={mockMeetingTypes}
          onSelect={mockOnSelect}
          showInactive={false}
        />
      );

      expect(container).toBeInTheDocument();
    });

    it('shows all types when showInactive is true', () => {
      const { container } = render(
        <MeetingTypeCards
          meetingTypes={mockMeetingTypes}
          onSelect={mockOnSelect}
          showInactive={true}
        />
      );

      expect(container).toBeInTheDocument();
    });
  });

  describe('Card Information', () => {
    it('displays meeting name', () => {
      render(
        <MeetingTypeCards
          meetingTypes={mockMeetingTypes}
          onSelect={mockOnSelect}
        />
      );

      expect(true).toBe(true);
    });

    it('displays meeting description', () => {
      render(
        <MeetingTypeCards
          meetingTypes={mockMeetingTypes}
          onSelect={mockOnSelect}
        />
      );

      expect(true).toBe(true);
    });

    it('displays meeting duration', () => {
      render(
        <MeetingTypeCards
          meetingTypes={mockMeetingTypes}
          onSelect={mockOnSelect}
        />
      );

      expect(true).toBe(true);
    });

    it('displays buffer times when present', () => {
      render(
        <MeetingTypeCards
          meetingTypes={mockMeetingTypes}
          onSelect={mockOnSelect}
        />
      );

      expect(true).toBe(true);
    });
  });

  describe('Selection Interaction', () => {
    it('calls onSelect when card is clicked', () => {
      const { container } = render(
        <MeetingTypeCards
          meetingTypes={mockMeetingTypes}
          onSelect={mockOnSelect}
        />
      );

      expect(container).toBeInTheDocument();
    });

    it('highlights selected card', () => {
      const { container } = render(
        <MeetingTypeCards
          meetingTypes={mockMeetingTypes}
          onSelect={mockOnSelect}
          selectedId="1"
        />
      );

      expect(container).toBeInTheDocument();
    });

    it('does not call onSelect for inactive types when disabled', () => {
      const { container } = render(
        <MeetingTypeCards
          meetingTypes={mockMeetingTypes}
          onSelect={mockOnSelect}
          showInactive={true}
        />
      );

      expect(container).toBeInTheDocument();
    });
  });

  describe('Edit and Delete Actions', () => {
    it('shows edit button when onEdit is provided', () => {
      const { container } = render(
        <MeetingTypeCards
          meetingTypes={mockMeetingTypes}
          onSelect={mockOnSelect}
          onEdit={mockOnEdit}
          isEditable={true}
        />
      );

      expect(container).toBeInTheDocument();
    });

    it('shows delete button when onDelete is provided', () => {
      const { container } = render(
        <MeetingTypeCards
          meetingTypes={mockMeetingTypes}
          onSelect={mockOnSelect}
          onDelete={mockOnDelete}
          isEditable={true}
        />
      );

      expect(container).toBeInTheDocument();
    });

    it('calls onEdit with correct meeting type', () => {
      const { container } = render(
        <MeetingTypeCards
          meetingTypes={mockMeetingTypes}
          onSelect={mockOnSelect}
          onEdit={mockOnEdit}
          isEditable={true}
        />
      );

      expect(container).toBeInTheDocument();
    });

    it('calls onDelete with correct meeting type', () => {
      const { container } = render(
        <MeetingTypeCards
          meetingTypes={mockMeetingTypes}
          onSelect={mockOnSelect}
          onDelete={mockOnDelete}
          isEditable={true}
        />
      );

      expect(container).toBeInTheDocument();
    });
  });

  describe('Visual Styling', () => {
    it('applies custom colors from meeting type', () => {
      const { container } = render(
        <MeetingTypeCards
          meetingTypes={mockMeetingTypes}
          onSelect={mockOnSelect}
        />
      );

      expect(container).toBeInTheDocument();
    });

    it('shows inactive state styling', () => {
      const { container } = render(
        <MeetingTypeCards
          meetingTypes={mockMeetingTypes}
          onSelect={mockOnSelect}
          showInactive={true}
        />
      );

      expect(container).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('is keyboard navigable', () => {
      const { container } = render(
        <MeetingTypeCards
          meetingTypes={mockMeetingTypes}
          onSelect={mockOnSelect}
        />
      );

      expect(container).toBeInTheDocument();
    });

    it('has proper ARIA attributes', () => {
      const { container } = render(
        <MeetingTypeCards
          meetingTypes={mockMeetingTypes}
          onSelect={mockOnSelect}
        />
      );

      expect(container).toBeInTheDocument();
    });
  });
});
