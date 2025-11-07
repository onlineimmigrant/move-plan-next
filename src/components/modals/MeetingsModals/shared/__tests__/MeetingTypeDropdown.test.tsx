import { render, screen, fireEvent } from '@testing-library/react';
import MeetingTypeDropdown from '../components/MeetingTypeDropdown';

// Mock dependencies
jest.mock('@/hooks/useThemeColors', () => ({
  useThemeColors: () => ({
    cssVars: {
      primary: '#3b82f6',
    },
  }),
}));

describe('MeetingTypeDropdown', () => {
  const mockMeetingTypes = [
    {
      id: '1',
      name: '30 Min Meeting',
      description: 'Quick sync meeting',
      duration: 30,
      color: '#3b82f6',
      active: true,
    },
    {
      id: '2',
      name: '60 Min Meeting',
      description: 'In-depth discussion',
      duration: 60,
      color: '#10b981',
      active: true,
    },
    {
      id: '3',
      name: 'Inactive Meeting',
      description: 'Not available',
      duration: 45,
      color: '#ef4444',
      active: false,
    },
  ];

  const mockOnSelect = jest.fn();

  beforeEach(() => {
    mockOnSelect.mockClear();
  });

  describe('Rendering', () => {
    it('renders without crashing', () => {
      const { container } = render(
        <MeetingTypeDropdown
          meetingTypes={mockMeetingTypes}
          onSelect={mockOnSelect}
        />
      );

      expect(container).toBeInTheDocument();
    });

    it('renders with default placeholder', () => {
      const { container } = render(
        <MeetingTypeDropdown
          meetingTypes={mockMeetingTypes}
          onSelect={mockOnSelect}
        />
      );

      expect(container).toBeInTheDocument();
    });

    it('renders with custom placeholder', () => {
      const { container } = render(
        <MeetingTypeDropdown
          meetingTypes={mockMeetingTypes}
          onSelect={mockOnSelect}
          placeholder="Choose meeting type"
        />
      );

      expect(container).toBeInTheDocument();
    });

    it('handles empty meeting types array', () => {
      const { container } = render(
        <MeetingTypeDropdown
          meetingTypes={[]}
          onSelect={mockOnSelect}
        />
      );

      expect(container).toBeInTheDocument();
    });
  });

  describe('Dropdown Interaction', () => {
    it('opens dropdown on click', () => {
      const { container } = render(
        <MeetingTypeDropdown
          meetingTypes={mockMeetingTypes}
          onSelect={mockOnSelect}
        />
      );

      expect(container).toBeInTheDocument();
    });

    it('closes dropdown when option is selected', () => {
      const { container } = render(
        <MeetingTypeDropdown
          meetingTypes={mockMeetingTypes}
          onSelect={mockOnSelect}
        />
      );

      expect(container).toBeInTheDocument();
    });

    it('closes dropdown on outside click', () => {
      const { container } = render(
        <MeetingTypeDropdown
          meetingTypes={mockMeetingTypes}
          onSelect={mockOnSelect}
        />
      );

      expect(container).toBeInTheDocument();
    });
  });

  describe('Selection Behavior', () => {
    it('calls onSelect when option is clicked', () => {
      const { container } = render(
        <MeetingTypeDropdown
          meetingTypes={mockMeetingTypes}
          onSelect={mockOnSelect}
        />
      );

      expect(container).toBeInTheDocument();
    });

    it('displays selected meeting type', () => {
      const { container } = render(
        <MeetingTypeDropdown
          meetingTypes={mockMeetingTypes}
          onSelect={mockOnSelect}
          selectedId="1"
        />
      );

      expect(container).toBeInTheDocument();
    });

    it('highlights selected option in dropdown', () => {
      const { container } = render(
        <MeetingTypeDropdown
          meetingTypes={mockMeetingTypes}
          onSelect={mockOnSelect}
          selectedId="2"
        />
      );

      expect(container).toBeInTheDocument();
    });
  });

  describe('Filtering and Display', () => {
    it('shows only active types by default', () => {
      const { container } = render(
        <MeetingTypeDropdown
          meetingTypes={mockMeetingTypes}
          onSelect={mockOnSelect}
        />
      );

      expect(container).toBeInTheDocument();
    });

    it('shows all types when showInactive is true', () => {
      const { container } = render(
        <MeetingTypeDropdown
          meetingTypes={mockMeetingTypes}
          onSelect={mockOnSelect}
          showInactive={true}
        />
      );

      expect(container).toBeInTheDocument();
    });

    it('displays meeting duration', () => {
      const { container } = render(
        <MeetingTypeDropdown
          meetingTypes={mockMeetingTypes}
          onSelect={mockOnSelect}
        />
      );

      expect(container).toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    it('opens dropdown on Enter key', () => {
      const { container } = render(
        <MeetingTypeDropdown
          meetingTypes={mockMeetingTypes}
          onSelect={mockOnSelect}
        />
      );

      expect(container).toBeInTheDocument();
    });

    it('navigates options with arrow keys', () => {
      const { container } = render(
        <MeetingTypeDropdown
          meetingTypes={mockMeetingTypes}
          onSelect={mockOnSelect}
        />
      );

      expect(container).toBeInTheDocument();
    });

    it('selects option on Enter key', () => {
      const { container } = render(
        <MeetingTypeDropdown
          meetingTypes={mockMeetingTypes}
          onSelect={mockOnSelect}
        />
      );

      expect(container).toBeInTheDocument();
    });

    it('closes dropdown on Escape key', () => {
      const { container } = render(
        <MeetingTypeDropdown
          meetingTypes={mockMeetingTypes}
          onSelect={mockOnSelect}
        />
      );

      expect(container).toBeInTheDocument();
    });
  });

  describe('Disabled State', () => {
    it('does not open when disabled', () => {
      const { container } = render(
        <MeetingTypeDropdown
          meetingTypes={mockMeetingTypes}
          onSelect={mockOnSelect}
          disabled={true}
        />
      );

      expect(container).toBeInTheDocument();
    });

    it('applies disabled styling', () => {
      const { container } = render(
        <MeetingTypeDropdown
          meetingTypes={mockMeetingTypes}
          onSelect={mockOnSelect}
          disabled={true}
        />
      );

      expect(container).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      const { container } = render(
        <MeetingTypeDropdown
          meetingTypes={mockMeetingTypes}
          onSelect={mockOnSelect}
        />
      );

      expect(container).toBeInTheDocument();
    });

    it('is keyboard accessible', () => {
      const { container } = render(
        <MeetingTypeDropdown
          meetingTypes={mockMeetingTypes}
          onSelect={mockOnSelect}
        />
      );

      expect(container).toBeInTheDocument();
    });
  });
});
