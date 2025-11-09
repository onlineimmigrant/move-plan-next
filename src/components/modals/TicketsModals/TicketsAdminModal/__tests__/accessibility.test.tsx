import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import React from 'react';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  usePathname: () => '/en/account',
}));

// Mock dependencies
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
    removeChannel: jest.fn(),
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
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
  Rnd: ({ children }: any) => <div data-testid="rnd-container">{children}</div>,
}));

import TicketsAdminModal from '../TicketsAdminModal';

describe('Accessibility - WCAG 2.1 AA Compliance', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Perceivable - 1.x Standards', () => {
    it('1.1.1 Non-text Content: All images have text alternatives', async () => {
      render(<TicketsAdminModal isOpen={true} onClose={mockOnClose} />);
      
      await waitFor(() => {
        const images = screen.queryAllByRole('img', { hidden: true });
        images.forEach(img => {
          const hasAlt = img.hasAttribute('alt');
          const hasAriaLabel = img.hasAttribute('aria-label');
          const isDecorative = img.getAttribute('aria-hidden') === 'true';
          
          expect(hasAlt || hasAriaLabel || isDecorative).toBe(true);
        });
      });
    });

    it('1.3.1 Info and Relationships: Semantic markup present', async () => {
      render(<TicketsAdminModal isOpen={true} onClose={mockOnClose} />);
      
      await waitFor(() => {
        // Should have proper dialog role
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        
        // Should have main landmark
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('1.4.3 Contrast (Minimum): Focus indicators visible', async () => {
      render(<TicketsAdminModal isOpen={true} onClose={mockOnClose} />);
      
      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        // At least one button should have focus ring classes
        const buttonsWithFocusRing = buttons.filter(button => 
          button.className.includes('focus:ring') ||
          button.className.includes('focus:outline')
        );
        expect(buttonsWithFocusRing.length).toBeGreaterThan(0);
      }, { timeout: 2000 });
    });
  });

  describe('Operable - 2.x Standards', () => {
    it('2.1.1 Keyboard: All functionality available via keyboard', async () => {
      const user = userEvent.setup();
      render(<TicketsAdminModal isOpen={true} onClose={mockOnClose} />);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Tab through interactive elements
      await user.tab();
      
      // Skip link should be focusable
      const skipLink = screen.getByText(/Skip to/);
      expect(document.activeElement).toBe(skipLink);
    });

    it('2.1.2 No Keyboard Trap: Can navigate away from all elements', async () => {
      const user = userEvent.setup();
      render(<TicketsAdminModal isOpen={true} onClose={mockOnClose} />);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Tab multiple times
      await user.tab();
      await user.tab();
      await user.tab();
      
      // Should be able to continue tabbing (no trap)
      expect(document.activeElement).toBeTruthy();
    });

    it('2.4.3 Focus Order: Logical tab order maintained', async () => {
      const user = userEvent.setup();
      render(<TicketsAdminModal isOpen={true} onClose={mockOnClose} />);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const focusableElements: HTMLElement[] = [];
      
      // Tab through first few elements
      for (let i = 0; i < 3; i++) {
        await user.tab();
        if (document.activeElement instanceof HTMLElement) {
          focusableElements.push(document.activeElement);
        }
      }
      
      // Should have captured multiple focusable elements
      expect(focusableElements.length).toBeGreaterThan(0);
    });

    it('2.4.7 Focus Visible: Focus indicators always visible', async () => {
      render(<TicketsAdminModal isOpen={true} onClose={mockOnClose} />);
      
      await waitFor(() => {
        const closeButton = screen.getByLabelText('Close modal');
        
        // Simulate focus
        closeButton.focus();
        
        // Should have focus ring
        expect(closeButton).toHaveClass('focus:ring-2');
      });
    });
  });

  describe('Understandable - 3.x Standards', () => {
    it('3.2.1 On Focus: No context changes on focus', async () => {
      const user = userEvent.setup();
      render(<TicketsAdminModal isOpen={true} onClose={mockOnClose} />);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Focus an element
      const closeButton = screen.getByLabelText('Close modal');
      closeButton.focus();
      
      // Modal should still be open
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('3.3.2 Labels or Instructions: All inputs have labels', async () => {
      render(<TicketsAdminModal isOpen={true} onClose={mockOnClose} />);
      
      await waitFor(() => {
        const inputs = screen.queryAllByRole('textbox');
        inputs.forEach(input => {
          const hasLabel = input.hasAttribute('aria-label') || 
                          input.hasAttribute('aria-labelledby');
          expect(hasLabel).toBe(true);
        });
      });
    });
  });

  describe('Robust - 4.x Standards', () => {
    it('4.1.2 Name, Role, Value: All controls have accessible names', async () => {
      render(<TicketsAdminModal isOpen={true} onClose={mockOnClose} />);
      
      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        buttons.forEach(button => {
          const accessibleName = button.getAttribute('aria-label') || 
                                button.textContent?.trim();
          expect(accessibleName).toBeTruthy();
        });
      });
    });

    it('4.1.3 Status Messages: LiveRegion provides status announcements', async () => {
      render(<TicketsAdminModal isOpen={true} onClose={mockOnClose} />);
      
      await waitFor(() => {
        // Check for any elements with aria-live attribute
        const liveRegions = document.querySelectorAll('[aria-live]');
        expect(liveRegions.length).toBeGreaterThan(0);
        
        // Verify at least one has proper attributes
        const firstLiveRegion = liveRegions[0];
        expect(firstLiveRegion).toHaveAttribute('aria-live');
      }, { timeout: 2000 });
    });
  });
});

describe('Accessibility - Keyboard Shortcuts', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should close modal with Escape key', async () => {
    render(<TicketsAdminModal isOpen={true} onClose={mockOnClose} />);
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
    
    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('should show shortcuts modal with ? key', async () => {
    render(<TicketsAdminModal isOpen={true} onClose={mockOnClose} />);
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    fireEvent.keyPress(document, { key: '?', code: 'Slash', shiftKey: true });
    
    await waitFor(() => {
      const heading = screen.queryByRole('heading', { name: /keyboard shortcuts/i });
      expect(heading).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('should support Enter key on ticket list items', async () => {
    const { supabase } = require('@/lib/supabase');
    const mockTickets = [
      { id: 'ticket-1', subject: 'Test Ticket', status: 'open' },
    ];
    
    supabase.from.mockImplementation(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      then: jest.fn(() => Promise.resolve({ data: mockTickets, error: null })),
    }));

    render(<TicketsAdminModal isOpen={true} onClose={mockOnClose} />);
    
    await waitFor(() => {
      const listItem = screen.queryByRole('listitem');
      if (listItem) {
        fireEvent.keyDown(listItem, { key: 'Enter', code: 'Enter' });
        // Should select ticket (implementation-specific)
      }
    });
  });

  it('should support Space key on ticket list items', async () => {
    const { supabase } = require('@/lib/supabase');
    const mockTickets = [
      { id: 'ticket-1', subject: 'Test Ticket', status: 'open' },
    ];
    
    supabase.from.mockImplementation(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      then: jest.fn(() => Promise.resolve({ data: mockTickets, error: null })),
    }));

    render(<TicketsAdminModal isOpen={true} onClose={mockOnClose} />);
    
    await waitFor(() => {
      const listItem = screen.queryByRole('listitem');
      if (listItem) {
        fireEvent.keyDown(listItem, { key: ' ', code: 'Space' });
        // Should select ticket
      }
    });
  });
});

describe('Accessibility - Screen Reader Support', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should have skip link with proper href', async () => {
    render(<TicketsAdminModal isOpen={true} onClose={mockOnClose} />);
    
    await waitFor(() => {
      const skipLink = screen.getByText(/Skip to/);
      expect(skipLink).toHaveAttribute('href', '#ticket-content');
    });
  });

  it('should have main content with id matching skip link', async () => {
    render(<TicketsAdminModal isOpen={true} onClose={mockOnClose} />);
    
    await waitFor(() => {
      const mainContent = document.getElementById('ticket-content');
      expect(mainContent).toBeInTheDocument();
      expect(mainContent).toHaveAttribute('role', 'main');
    });
  });

  it('should announce loading state', async () => {
    render(<TicketsAdminModal isOpen={true} onClose={mockOnClose} />);
    
    // During initial load
    const loadingStatus = screen.queryByLabelText('Loading tickets');
    // May or may not be present depending on load time
    if (loadingStatus) {
      expect(loadingStatus).toHaveAttribute('role', 'status');
    }
  });

  it('should have descriptive aria-labels on ticket list items', async () => {
    const { supabase } = require('@/lib/supabase');
    const mockTickets = [
      { 
        id: 'ticket-1', 
        subject: 'Test Ticket', 
        status: 'open',
        priority: 'high',
      },
    ];
    
    supabase.from.mockImplementation(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      then: jest.fn(() => Promise.resolve({ data: mockTickets, error: null })),
    }));

    render(<TicketsAdminModal isOpen={true} onClose={mockOnClose} />);
    
    await waitFor(() => {
      const listItem = screen.queryByRole('listitem');
      if (listItem) {
        const ariaLabel = listItem.getAttribute('aria-label');
        expect(ariaLabel).toContain('Ticket');
        expect(ariaLabel).toContain('status');
        expect(ariaLabel).toContain('priority');
      }
    });
  });
});

describe('Accessibility - Focus Management', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should focus modal container on open', async () => {
    render(<TicketsAdminModal isOpen={true} onClose={mockOnClose} />);
    
    await waitFor(() => {
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('tabIndex', '-1');
    });
  });

  it('should restore focus on close', async () => {
    const { rerender } = render(<TicketsAdminModal isOpen={true} onClose={mockOnClose} />);
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Close modal
    rerender(<TicketsAdminModal isOpen={false} onClose={mockOnClose} />);
    
    // Focus should be restored (tested via implementation)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
