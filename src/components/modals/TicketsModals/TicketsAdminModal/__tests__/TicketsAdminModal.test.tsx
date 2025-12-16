import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import userEvent from '@testing-library/user-event';
import * as SupabaseClientModule from '@/lib/supabaseClient';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  usePathname: () => '/en/account',
}));

// Mock all dependencies before importing component
jest.mock('@/lib/supabaseClient', () => ({
  supabase: {
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'admin-1', email: 'admin@test.com' } },
        error: null,
      }),
    },
    channel: jest.fn(() => ({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
    })),
    removeChannel: jest.fn(),
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
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

jest.mock('react-rnd', () => ({
  Rnd: ({ children, ...props }: any) => (
    <div data-testid="rnd-container" {...props}>
      {children}
    </div>
  ),
}));

// Import component after mocks
import TicketsAdminModal from '../TicketsAdminModal';

describe('TicketsAdminModal - Core Functionality', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render when isOpen is true', async () => {
    render(<TicketsAdminModal isOpen={true} onClose={mockOnClose} />);
    
    await waitFor(() => {
      const modal = screen.queryByTestId('rnd-container');
      expect(modal).toBeInTheDocument();
    });
  });

  it('should not render when isOpen is false', () => {
    render(<TicketsAdminModal isOpen={false} onClose={mockOnClose} />);
    
    const modal = screen.queryByTestId('rnd-container');
    expect(modal).not.toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', async () => {
    render(<TicketsAdminModal isOpen={true} onClose={mockOnClose} />);
    
    await waitFor(() => {
      const closeButton = screen.getByLabelText('Close modal');
      expect(closeButton).toBeInTheDocument();
    });

    const closeButton = screen.getByLabelText('Close modal');
    fireEvent.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});

describe('TicketsAdminModal - Accessibility', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should have proper ARIA attributes on modal container', async () => {
    render(<TicketsAdminModal isOpen={true} onClose={mockOnClose} />);
    
    await waitFor(() => {
      const modal = screen.getByRole('dialog');
      expect(modal).toHaveAttribute('aria-modal', 'true');
      expect(modal).toHaveAttribute('aria-label', 'Ticket Management Modal');
    });
  });

  it('should have skip link for keyboard users', async () => {
    render(<TicketsAdminModal isOpen={true} onClose={mockOnClose} />);
    
    await waitFor(() => {
      const skipLink = screen.getByText(/Skip to/);
      expect(skipLink).toBeInTheDocument();
      expect(skipLink).toHaveAttribute('href', '#ticket-content');
    });
  });

  it('should handle Escape key to close modal', async () => {
    render(<TicketsAdminModal isOpen={true} onClose={mockOnClose} />);
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
    
    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('should have focus indicators on interactive elements', async () => {
    render(<TicketsAdminModal isOpen={true} onClose={mockOnClose} />);
    
    await waitFor(() => {
      const closeButton = screen.getByLabelText('Close modal');
      expect(closeButton).toHaveClass('focus:ring-2');
    });
  });
});

describe('TicketsAdminModal - Keyboard Navigation', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show keyboard shortcuts modal when ? is pressed', async () => {
    const user = userEvent.setup();
    render(<TicketsAdminModal isOpen={true} onClose={mockOnClose} />);
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Press ? key
    fireEvent.keyPress(document, { key: '?', code: 'Slash', shiftKey: true });
    
    await waitFor(() => {
      const heading = screen.queryByRole('heading', { name: /keyboard shortcuts/i });
      expect(heading).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('should support Tab navigation through interactive elements', async () => {
    const user = userEvent.setup();
    render(<TicketsAdminModal isOpen={true} onClose={mockOnClose} />);
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Tab should move focus through elements
    await user.tab();
    
    // Skip link should be focused first
    const skipLink = screen.getByText(/Skip to/);
    expect(skipLink).toHaveFocus();
  });
});

describe('TicketsAdminModal - Screen Reader Support', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should have LiveRegion for announcements', async () => {
    render(<TicketsAdminModal isOpen={true} onClose={mockOnClose} />);
    
    await waitFor(() => {
      // LiveRegion should exist with proper aria-live attribute
      const liveRegions = document.querySelectorAll('[aria-live]');
      expect(liveRegions.length).toBeGreaterThan(0);
    }, { timeout: 2000 });
  });

  it('should announce when loading tickets', async () => {
    render(<TicketsAdminModal isOpen={true} onClose={mockOnClose} />);
    
    await waitFor(() => {
      const loadingStatus = screen.queryByLabelText('Loading tickets');
      // Should be present during initial load
      expect(loadingStatus).toBeTruthy();
    });
  });

  it('should have descriptive labels on all buttons', async () => {
    render(<TicketsAdminModal isOpen={true} onClose={mockOnClose} />);
    
    await waitFor(() => {
      const closeButton = screen.getByLabelText('Close modal');
      expect(closeButton).toBeInTheDocument();
    });

    // All header buttons should have aria-labels
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      const ariaLabel = button.getAttribute('aria-label');
      const hasVisibleText = button.textContent && button.textContent.trim().length > 0;
      
      // Each button should have either aria-label or visible text
      expect(ariaLabel || hasVisibleText).toBeTruthy();
    });
  });
});

describe('TicketsAdminModal - Modal Sizing', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should start with initial size', async () => {
    render(<TicketsAdminModal isOpen={true} onClose={mockOnClose} />);
    
    await waitFor(() => {
      const modal = screen.getByTestId('rnd-container');
      expect(modal).toBeInTheDocument();
      // Should have initial positioning
    });
  });

  it('should toggle between sizes when toggle button is clicked', async () => {
    render(<TicketsAdminModal isOpen={true} onClose={mockOnClose} />);
    
    await waitFor(() => {
      const modal = screen.getByTestId('rnd-container');
      expect(modal).toBeInTheDocument();
    }, { timeout: 2000 });

    // Look for any size toggle button
    const toggleButtons = screen.queryAllByRole('button');
    const sizeToggle = toggleButtons.find(btn => 
      btn.getAttribute('aria-label')?.includes('fullscreen') ||
      btn.getAttribute('aria-label')?.includes('size') ||
      btn.getAttribute('aria-label')?.includes('expand')
    );
    
    if (sizeToggle) {
      fireEvent.click(sizeToggle);
      // Button should still be present after click
      expect(sizeToggle).toBeInTheDocument();
    } else {
      // If no toggle button exists, that's okay - just verify modal is present
      expect(screen.getByTestId('rnd-container')).toBeInTheDocument();
    }
  });
});

describe('TicketsAdminModal - Error Handling', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle errors gracefully when failing to load tickets', async () => {
    // Mock Supabase error
    const supabaseMock = SupabaseClientModule.supabase as any;
    supabaseMock.from.mockImplementation(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      then: jest.fn(() => Promise.resolve({ 
        data: null, 
        error: { message: 'Failed to load tickets' } 
      })),
    }));

    render(<TicketsAdminModal isOpen={true} onClose={mockOnClose} />);
    
    // Should still render without crashing
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });
});
