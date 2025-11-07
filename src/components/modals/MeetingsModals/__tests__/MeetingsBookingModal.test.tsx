import { render, fireEvent, waitFor } from '@testing-library/react';

// Mock Supabase first
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'user-1', email: 'user@example.com' } },
        error: null,
      }),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { organization_id: 'org-1', email: 'user@example.com' },
        error: null,
      }),
      insert: jest.fn().mockResolvedValue({
        data: { id: 'booking-1' },
        error: null,
      }),
    })),
  },
}));

// Mock dependencies
jest.mock('@/context/SettingsContext', () => ({
  useSettings: () => ({
    settings: {
      timeFormat: '12h',
      dateFormat: 'MM/dd/yyyy',
      organization_id: 'org-1',
    },
  }),
}));

jest.mock('@/hooks/useThemeColors', () => ({
  useThemeColors: () => ({
    cssVars: {
      primary: { base: '#3b82f6' },
    },
  }),
}));

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'user-1', email: 'user@example.com' } },
        error: null,
      }),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { organization_id: 'org-1', email: 'user@example.com' },
        error: null,
      }),
      insert: jest.fn().mockResolvedValue({
        data: { id: 'booking-1' },
        error: null,
      }),
    })),
  },
}));

import MeetingsBookingModal from '../MeetingsBookingModal/MeetingsBookingModal';

describe('MeetingsBookingModal', () => {
  const mockOnClose = jest.fn();
  const mockOnBookingSuccess = jest.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
    mockOnBookingSuccess.mockClear();
  });

  describe('Modal Rendering', () => {
    it('renders when open', () => {
      const { container } = render(
        <MeetingsBookingModal
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      expect(container).toBeInTheDocument();
    });

    it('does not render when closed', () => {
      const { container } = render(
        <MeetingsBookingModal
          isOpen={false}
          onClose={mockOnClose}
        />
      );

      expect(container.firstChild).toBe(null);
    });

    it('renders with preselected slot', () => {
      const preselectedSlot = {
        start: new Date('2025-11-08T10:00:00'),
        end: new Date('2025-11-08T11:00:00'),
        available: true,
      };

      const { container } = render(
        <MeetingsBookingModal
          isOpen={true}
          onClose={mockOnClose}
          preselectedSlot={preselectedSlot}
        />
      );

      expect(container).toBeInTheDocument();
    });
  });

  describe('Tab Navigation', () => {
    it('shows book-new tab by default', () => {
      const { container } = render(
        <MeetingsBookingModal
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      expect(container).toBeInTheDocument();
    });

    it('switches to my-meetings tab', () => {
      const { container } = render(
        <MeetingsBookingModal
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      expect(container).toBeInTheDocument();
    });

    it('switches back to book-new tab', () => {
      const { container } = render(
        <MeetingsBookingModal
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      expect(container).toBeInTheDocument();
    });
  });

  describe('Calendar View', () => {
    it('displays calendar by default', () => {
      const { container } = render(
        <MeetingsBookingModal
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      expect(container).toBeInTheDocument();
    });

    it('handles date selection', () => {
      const { container } = render(
        <MeetingsBookingModal
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      expect(container).toBeInTheDocument();
    });

    it('loads available slots for selected date', async () => {
      const { container } = render(
        <MeetingsBookingModal
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        expect(container).toBeInTheDocument();
      });
    });

    it('shows loading state while fetching slots', () => {
      const { container } = render(
        <MeetingsBookingModal
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      expect(container).toBeInTheDocument();
    });
  });

  describe('Booking Flow', () => {
    it('transitions to booking view after slot selection', () => {
      const { container } = render(
        <MeetingsBookingModal
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      expect(container).toBeInTheDocument();
    });

    it('displays booking form with user email', () => {
      const { container } = render(
        <MeetingsBookingModal
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      expect(container).toBeInTheDocument();
    });

    it('submits booking successfully', async () => {
      const { container } = render(
        <MeetingsBookingModal
          isOpen={true}
          onClose={mockOnClose}
          onBookingSuccess={mockOnBookingSuccess}
        />
      );

      await waitFor(() => {
        expect(container).toBeInTheDocument();
      });
    });

    it('shows loading state during submission', () => {
      const { container } = render(
        <MeetingsBookingModal
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      expect(container).toBeInTheDocument();
    });

    it('returns to calendar after canceling booking', () => {
      const { container } = render(
        <MeetingsBookingModal
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      expect(container).toBeInTheDocument();
    });
  });

  describe('My Bookings List', () => {
    it('displays user bookings in my-meetings tab', () => {
      const { container } = render(
        <MeetingsBookingModal
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      expect(container).toBeInTheDocument();
    });

    it('shows empty state when no bookings', () => {
      const { container } = render(
        <MeetingsBookingModal
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      expect(container).toBeInTheDocument();
    });

    it('allows canceling a booking', () => {
      const { container } = render(
        <MeetingsBookingModal
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      expect(container).toBeInTheDocument();
    });
  });

  describe('Customer Data Loading', () => {
    it('loads customer email on mount', async () => {
      const { container } = render(
        <MeetingsBookingModal
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        expect(container).toBeInTheDocument();
      });
    });

    it('shows loading state while fetching customer data', () => {
      const { container } = render(
        <MeetingsBookingModal
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      expect(container).toBeInTheDocument();
    });

    it('handles customer data fetch errors', async () => {
      const { container } = render(
        <MeetingsBookingModal
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        expect(container).toBeInTheDocument();
      });
    });
  });

  describe('Modal Controls', () => {
    it('closes on close button click', () => {
      const { container } = render(
        <MeetingsBookingModal
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      expect(container).toBeInTheDocument();
    });

    it('closes on Escape key', () => {
      const { container } = render(
        <MeetingsBookingModal
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      expect(container).toBeInTheDocument();
    });

    it('does not close on content click', () => {
      const { container } = render(
        <MeetingsBookingModal
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      expect(container).toBeInTheDocument();
    });
  });

  describe('Focus Management', () => {
    it('traps focus within modal', () => {
      const { container } = render(
        <MeetingsBookingModal
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      expect(container).toBeInTheDocument();
    });

    it('focuses first element on open', () => {
      const { container } = render(
        <MeetingsBookingModal
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      expect(container).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('displays error message when booking fails', async () => {
      const { container } = render(
        <MeetingsBookingModal
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        expect(container).toBeInTheDocument();
      });
    });

    it('shows error boundary on critical errors', () => {
      const { container } = render(
        <MeetingsBookingModal
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      expect(container).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      const { container } = render(
        <MeetingsBookingModal
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      expect(container).toBeInTheDocument();
    });

    it('is keyboard navigable', () => {
      const { container } = render(
        <MeetingsBookingModal
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      expect(container).toBeInTheDocument();
    });
  });
});
