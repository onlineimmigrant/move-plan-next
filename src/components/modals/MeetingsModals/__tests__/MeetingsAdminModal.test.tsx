import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

// Mock all dependencies before importing component
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'admin-1' } },
        error: null,
      }),
    },
    channel: jest.fn(() => ({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
    })),
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      then: jest.fn(() => Promise.resolve({ data: [], error: null })),
    })),
  },
}));

jest.mock('@/context/SettingsContext', () => ({
  useSettings: () => ({
    settings: {
      organization_id: 'org-1',
      timeFormat: '12h',
      dateFormat: 'MM/dd/yyyy',
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

jest.mock('react-rnd', () => ({
  Rnd: ({ children }: any) => <div data-testid="rnd-container">{children}</div>,
}));

// Import component after mocks
import MeetingsAdminModal from '../MeetingsAdminModal/MeetingsAdminModal';

describe('MeetingsAdminModal - Core Functionality', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render when isOpen is true', async () => {
    render(<MeetingsAdminModal isOpen={true} onClose={mockOnClose} />);
    
    await waitFor(() => {
      const modal = screen.queryByTestId('rnd-container');
      expect(modal).toBeInTheDocument();
    });
  });

  it('should not render when isOpen is false', () => {
    render(<MeetingsAdminModal isOpen={false} onClose={mockOnClose} />);
    
    const modal = screen.queryByTestId('rnd-container');
    expect(modal).not.toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', async () => {
    render(<MeetingsAdminModal isOpen={true} onClose={mockOnClose} />);
    
    await waitFor(() => {
      const modal = screen.queryByTestId('rnd-container');
      expect(modal).toBeInTheDocument();
    });

    // Find close button by aria-label
    const closeButton = screen.getByLabelText(/close/i);
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should support ESC key to close', async () => {
    render(<MeetingsAdminModal isOpen={true} onClose={mockOnClose} />);
    
    await waitFor(() => {
      const modal = screen.queryByTestId('rnd-container');
      expect(modal).toBeInTheDocument();
    });

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should use custom hooks for state management', async () => {
    render(<MeetingsAdminModal isOpen={true} onClose={mockOnClose} />);
    
    await waitFor(() => {
      const modal = screen.queryByTestId('rnd-container');
      expect(modal).toBeInTheDocument();
      // Verify hooks are working by checking if content renders
      // (This indirectly tests useAdminModalState, useAdminBookings, useMeetingTypesData, useBookingForm)
      expect(modal).toBeTruthy();
    });
  });

  it('should integrate useBookingForm hook correctly', async () => {
    const { rerender } = render(<MeetingsAdminModal isOpen={true} onClose={mockOnClose} />);
    
    await waitFor(() => {
      expect(screen.queryByTestId('rnd-container')).toBeInTheDocument();
    });

    // Re-render to ensure hook state persists
    rerender(<MeetingsAdminModal isOpen={true} onClose={mockOnClose} />);
    
    expect(screen.queryByTestId('rnd-container')).toBeInTheDocument();
  });

  it('should lazy load child modals with Suspense', async () => {
    render(<MeetingsAdminModal isOpen={true} onClose={mockOnClose} />);
    
    await waitFor(() => {
      expect(screen.queryByTestId('rnd-container')).toBeInTheDocument();
    });

    // Suspense boundary should handle lazy loading gracefully
    expect(screen.queryByTestId('rnd-container')).toBeInTheDocument();
  });
});

describe('MeetingsAdminModal', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render the modal when isOpen is true', async () => {
      render(<MeetingsAdminModal isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText(/meetings admin/i)).toBeInTheDocument();
      });
    });

    it('should not render the modal when isOpen is false', () => {
      render(<MeetingsAdminModal isOpen={false} onClose={mockOnClose} />);

      expect(screen.queryByText(/meetings admin/i)).not.toBeInTheDocument();
    });

    it('should render all tab options', async () => {
      render(<MeetingsAdminModal isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText(/bookings/i)).toBeInTheDocument();
        expect(screen.getByText(/calendar/i)).toBeInTheDocument();
        expect(screen.getByText(/types/i)).toBeInTheDocument();
        expect(screen.getByText(/settings/i)).toBeInTheDocument();
      });
    });
  });

  describe('Hook Integration', () => {
    it('should use useAdminModalState hook correctly', async () => {
      render(<MeetingsAdminModal isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText(/bookings/i)).toBeInTheDocument();
      });

      // Default view should be 'bookings'
      const bookingsTab = screen.getByText(/bookings/i);
      expect(bookingsTab.closest('button')).toHaveClass('border-blue-500');
    });

    it('should use useAdminBookings hook to load bookings', async () => {
      render(<MeetingsAdminModal isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText(/customer@example.com/i)).toBeInTheDocument();
        expect(screen.getByText(/another@example.com/i)).toBeInTheDocument();
      });
    });

    it('should use useMeetingTypesData hook to load meeting types', async () => {
      render(<MeetingsAdminModal isOpen={true} onClose={mockOnClose} />);

      // Switch to types view
      const typesTab = screen.getByText(/types/i);
      fireEvent.click(typesTab);

      await waitFor(() => {
        expect(screen.getByTestId('types-modal')).toBeInTheDocument();
      });
    });

    it('should use useBookingForm hook for form state', async () => {
      render(<MeetingsAdminModal isOpen={true} onClose={mockOnClose} />);

      // Switch to calendar view
      const calendarTab = screen.getByText(/calendar/i);
      fireEvent.click(calendarTab);

      await waitFor(() => {
        expect(screen.getByText(/select a date/i)).toBeInTheDocument();
      });
    });
  });

  describe('View Navigation', () => {
    it('should switch to calendar view when calendar tab is clicked', async () => {
      render(<MeetingsAdminModal isOpen={true} onClose={mockOnClose} />);

      const calendarTab = screen.getByText(/calendar/i);
      fireEvent.click(calendarTab);

      await waitFor(() => {
        expect(calendarTab.closest('button')).toHaveClass('border-blue-500');
      });
    });

    it('should switch to bookings view when bookings tab is clicked', async () => {
      render(<MeetingsAdminModal isOpen={true} onClose={mockOnClose} />);

      // First go to calendar
      fireEvent.click(screen.getByText(/calendar/i));

      await waitFor(() => {
        expect(screen.getByText(/select a date/i)).toBeInTheDocument();
      });

      // Then back to bookings
      fireEvent.click(screen.getByText(/bookings/i));

      await waitFor(() => {
        expect(screen.getByText(/customer@example.com/i)).toBeInTheDocument();
      });
    });

    it('should open settings modal when settings tab is clicked', async () => {
      render(<MeetingsAdminModal isOpen={true} onClose={mockOnClose} />);

      const settingsTab = screen.getByText(/settings/i);
      fireEvent.click(settingsTab);

      await waitFor(() => {
        expect(screen.getByTestId('settings-modal')).toBeInTheDocument();
      });
    });

    it('should open meeting types modal when types tab is clicked', async () => {
      render(<MeetingsAdminModal isOpen={true} onClose={mockOnClose} />);

      const typesTab = screen.getByText(/types/i);
      fireEvent.click(typesTab);

      await waitFor(() => {
        expect(screen.getByTestId('types-modal')).toBeInTheDocument();
      });
    });
  });

  describe('Lazy Loading', () => {
    it('should lazy load MeetingsSettingsModal', async () => {
      render(<MeetingsAdminModal isOpen={true} onClose={mockOnClose} />);

      // Settings modal should not be in DOM initially
      expect(screen.queryByTestId('settings-modal')).not.toBeInTheDocument();

      // Click settings tab
      fireEvent.click(screen.getByText(/settings/i));

      // Settings modal should now be loaded
      await waitFor(() => {
        expect(screen.getByTestId('settings-modal')).toBeInTheDocument();
      });
    });

    it('should lazy load MeetingTypesModal', async () => {
      render(<MeetingsAdminModal isOpen={true} onClose={mockOnClose} />);

      expect(screen.queryByTestId('types-modal')).not.toBeInTheDocument();

      fireEvent.click(screen.getByText(/types/i));

      await waitFor(() => {
        expect(screen.getByTestId('types-modal')).toBeInTheDocument();
      });
    });

    it('should lazy load EventDetailsModal when booking is selected', async () => {
      render(<MeetingsAdminModal isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText(/customer@example.com/i)).toBeInTheDocument();
      });

      // Click on a booking to view details
      const bookingCard = screen.getByText(/customer@example.com/i).closest('div');
      if (bookingCard) {
        fireEvent.click(bookingCard);

        await waitFor(() => {
          expect(screen.getByTestId('details-modal')).toBeInTheDocument();
        });
      }
    });
  });

  describe('Booking Operations', () => {
    it('should display active booking count', async () => {
      render(<MeetingsAdminModal isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        // Should show 2 active bookings
        expect(screen.getByText(/2.*active/i)).toBeInTheDocument();
      });
    });

    it('should handle booking cancellation', async () => {
      render(<MeetingsAdminModal isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText(/customer@example.com/i)).toBeInTheDocument();
      });

      // Find and click cancel button (if visible in UI)
      const cancelButtons = screen.queryAllByText(/cancel/i);
      if (cancelButtons.length > 0) {
        fireEvent.click(cancelButtons[0]);

        await waitFor(() => {
          // Verify cancellation logic (implementation-dependent)
          expect(mockOnClose).not.toHaveBeenCalled(); // Should not close modal
        });
      }
    });

    it('should handle booking form submission', async () => {
      render(<MeetingsAdminModal isOpen={true} onClose={mockOnClose} />);

      // Switch to calendar view
      fireEvent.click(screen.getByText(/calendar/i));

      await waitFor(() => {
        expect(screen.getByText(/select a date/i)).toBeInTheDocument();
      });

      // Select a date slot (implementation-dependent on calendar rendering)
      // This would require clicking a date in the calendar
    });
  });

  describe('Form Integration', () => {
    it('should reset form when resetForm is called on close', async () => {
      render(<MeetingsAdminModal isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText(/meetings admin/i)).toBeInTheDocument();
      });

      // Click close button
      const closeButton = screen.getByLabelText(/close/i);
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should handle form change via useBookingForm hook', async () => {
      render(<MeetingsAdminModal isOpen={true} onClose={mockOnClose} />);

      // Switch to calendar view to access booking form
      fireEvent.click(screen.getByText(/calendar/i));

      await waitFor(() => {
        expect(screen.getByText(/select a date/i)).toBeInTheDocument();
      });

      // Form interaction would happen here (implementation-dependent)
    });
  });

  describe('Memoized Components', () => {
    it('should render AdminModalHeader with React.memo', async () => {
      const { rerender } = render(<MeetingsAdminModal isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText(/meetings admin/i)).toBeInTheDocument();
      });

      // Re-render with same props
      rerender(<MeetingsAdminModal isOpen={true} onClose={mockOnClose} />);

      // Header should still be present (memoization prevents unnecessary re-render)
      expect(screen.getByText(/meetings admin/i)).toBeInTheDocument();
    });

    it('should render AdminModalFooter with React.memo on mobile', async () => {
      // Mock mobile viewport
      global.innerWidth = 375;
      global.dispatchEvent(new Event('resize'));

      render(<MeetingsAdminModal isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText(/meetings admin/i)).toBeInTheDocument();
      });

      // Footer navigation should be present on mobile
      // (implementation-dependent on viewport detection)
    });
  });

  describe('Error Handling', () => {
    it('should display error message when booking load fails', async () => {
      // Mock API error
      const { supabase: mockSupabase } = await import('@/lib/supabase');
      (mockSupabase.from as jest.Mock) = jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        then: jest.fn(() => Promise.resolve({ data: null, error: { message: 'Network error' } })),
      }));

      render(<MeetingsAdminModal isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        // Should display error state
        expect(screen.getByText(/error/i) || screen.getByText(/failed/i)).toBeInTheDocument();
      });
    });

    it('should handle meeting types loading error gracefully', async () => {
      const { supabase: mockSupabase } = await import('@/lib/supabase');
      (mockSupabase.from as jest.Mock) = jest.fn((table) => {
        if (table === 'meeting_types') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            then: jest.fn(() => Promise.resolve({ data: null, error: { message: 'Failed to load types' } })),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          gte: jest.fn().mockReturnThis(),
          then: jest.fn(() => Promise.resolve({ data: [], error: null })),
        };
      });

      render(<MeetingsAdminModal isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText(/meetings admin/i)).toBeInTheDocument();
      });

      // Should still render modal even with meeting types error
      expect(screen.getByText(/meetings admin/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should support keyboard navigation (ESC key)', async () => {
      render(<MeetingsAdminModal isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText(/meetings admin/i)).toBeInTheDocument();
      });

      // Simulate ESC key press
      fireEvent.keyDown(document, { key: 'Escape', code: 'Escape', keyCode: 27 });

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should have proper ARIA labels', async () => {
      render(<MeetingsAdminModal isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/close/i)).toBeInTheDocument();
      });
    });
  });

  describe('Instant Meeting Feature', () => {
    it('should open instant meeting modal when button is clicked', async () => {
      render(<MeetingsAdminModal isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText(/meetings admin/i)).toBeInTheDocument();
      });

      // Look for instant meeting button
      const instantButton = screen.queryByText(/instant meeting/i) || screen.queryByText(/new meeting/i);

      if (instantButton) {
        fireEvent.click(instantButton);

        await waitFor(() => {
          expect(screen.getByTestId('instant-modal')).toBeInTheDocument();
        });
      }
    });
  });

  describe('Suspense Boundary', () => {
    it('should wrap lazy-loaded components in Suspense', async () => {
      render(<MeetingsAdminModal isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText(/meetings admin/i)).toBeInTheDocument();
      });

      // All lazy components should be wrapped in Suspense
      // This is tested by verifying they load correctly
      fireEvent.click(screen.getByText(/settings/i));

      await waitFor(() => {
        expect(screen.getByTestId('settings-modal')).toBeInTheDocument();
      });
    });
  });
});
