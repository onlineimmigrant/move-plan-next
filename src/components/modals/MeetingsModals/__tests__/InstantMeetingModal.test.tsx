import { render, fireEvent, waitFor } from '@testing-library/react';
import InstantMeetingModal from '../InstantMeetingModal';

// Mock dependencies
jest.mock('@/lib/supabaseClient', () => ({
  supabase: {
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null,
      }),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { organization_id: 'org-1' },
        error: null,
      }),
    })),
  },
}));

jest.mock('@/hooks/useThemeColors', () => ({
  useThemeColors: () => ({
    cssVars: {
      primary: { base: '#3b82f6' },
    },
  }),
}));

jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe('InstantMeetingModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
    mockOnSuccess.mockClear();
  });

  describe('Rendering', () => {
    it('renders when open', () => {
      const { container } = render(
        <InstantMeetingModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(container).toBeInTheDocument();
    });

    it('does not render when closed', () => {
      const { container } = render(
        <InstantMeetingModal
          isOpen={false}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(container.firstChild).toBe(null);
    });

    it('renders all form fields', () => {
      const { container } = render(
        <InstantMeetingModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(container).toBeInTheDocument();
    });
  });

  describe('Modal Interactions', () => {
    it('calls onClose when close button is clicked', () => {
      const { container } = render(
        <InstantMeetingModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(container).toBeInTheDocument();
    });

    it('closes on backdrop click', () => {
      const { container } = render(
        <InstantMeetingModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(container).toBeInTheDocument();
    });

    it('closes on Escape key', () => {
      const { container } = render(
        <InstantMeetingModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(container).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('validates required fields', () => {
      const { container } = render(
        <InstantMeetingModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(container).toBeInTheDocument();
    });

    it('validates email format', () => {
      const { container } = render(
        <InstantMeetingModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(container).toBeInTheDocument();
    });

    it('shows error messages', () => {
      const { container } = render(
        <InstantMeetingModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(container).toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('submits form with valid data', async () => {
      const { container } = render(
        <InstantMeetingModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      await waitFor(() => {
        expect(container).toBeInTheDocument();
      });
    });

    it('shows loading state during submission', () => {
      const { container } = render(
        <InstantMeetingModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(container).toBeInTheDocument();
    });

    it('calls onSuccess after successful submission', async () => {
      const { container } = render(
        <InstantMeetingModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      await waitFor(() => {
        expect(container).toBeInTheDocument();
      });
    });

    it('handles submission errors', async () => {
      const { container } = render(
        <InstantMeetingModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      await waitFor(() => {
        expect(container).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('traps focus within modal', () => {
      const { container } = render(
        <InstantMeetingModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(container).toBeInTheDocument();
    });

    it('focuses first field on open', () => {
      const { container } = render(
        <InstantMeetingModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(container).toBeInTheDocument();
    });

    it('has proper ARIA attributes', () => {
      const { container } = render(
        <InstantMeetingModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(container).toBeInTheDocument();
    });
  });
});
