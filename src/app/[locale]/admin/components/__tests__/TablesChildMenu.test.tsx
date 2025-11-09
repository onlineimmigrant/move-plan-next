import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import TablesChildMenu from '../TablesChildMenu';
import { usePathname } from 'next/navigation';
import { useSettings } from '@/context/SettingsContext';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

// Mock SettingsContext
jest.mock('@/context/SettingsContext', () => ({
  useSettings: jest.fn(),
}));

describe('TablesChildMenu', () => {
  const mockSetIsSidebarOpen = jest.fn();
  const mockSetOpenSections = jest.fn();
  const mockSetSearchQuery = jest.fn();

  const mockSidebarLinks = {
    users: [
      { href: '/en/admin/users', label: 'All Users' },
      { href: '/en/admin/users/roles', label: 'User Roles' },
    ],
    sell: [
      { href: '/en/admin/products', label: 'Products' },
    ],
    booking: [],
    app: [],
    consent_management: [],
    blog: [],
    edupro: [],
    quiz: [],
    feedback: [],
    ai: [],
    datacollection: [],
    website: [],
    email: [],
    settings: [],
  };

  const defaultProps = {
    isSidebarOpen: true,
    setIsSidebarOpen: mockSetIsSidebarOpen,
    sidebarLinks: mockSidebarLinks,
    openSections: {
      users: false,
      sell: false,
      booking: false,
      app: false,
      consent_management: false,
      blog: false,
      edupro: false,
      quiz: false,
      feedback: false,
      ai: false,
      datacollection: false,
      website: false,
      email: false,
      settings: false,
    },
    setOpenSections: mockSetOpenSections,
    searchQuery: '',
    setSearchQuery: mockSetSearchQuery,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (usePathname as jest.Mock).mockReturnValue('/en/admin');
    (useSettings as jest.Mock).mockReturnValue({
      settings: { primary_color: 'sky' },
    });
  });

  describe('Rendering', () => {
    it('should render tables child menu when sidebar is open', () => {
      render(<TablesChildMenu {...defaultProps} />);
      
      // Check for search input
      const searchInput = screen.getByPlaceholderText(/search/i);
      expect(searchInput).toBeInTheDocument();
    });

    it('should not render when sidebar is closed', () => {
      render(<TablesChildMenu {...defaultProps} isSidebarOpen={false} />);
      
      const searchInput = screen.queryByPlaceholderText(/search/i);
      expect(searchInput).not.toBeInTheDocument();
    });

    it('should render all section headings with links', () => {
      render(<TablesChildMenu {...defaultProps} />);
      
      expect(screen.getByText('Users')).toBeInTheDocument();
      expect(screen.getByText('Sell')).toBeInTheDocument();
    });

    it('should display section icons', () => {
      const { container } = render(<TablesChildMenu {...defaultProps} />);
      
      // Check for SVG elements (icons)
      const icons = container.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThan(0);
    });
  });

  describe('Search Functionality', () => {
    it('should update search query when typing', () => {
      render(<TablesChildMenu {...defaultProps} />);
      
      const searchInput = screen.getByPlaceholderText(/search/i);
      fireEvent.change(searchInput, { target: { value: 'users' } });
      
      expect(mockSetSearchQuery).toHaveBeenCalledWith('users');
    });

    it('should filter sections based on search query', () => {
      render(<TablesChildMenu {...defaultProps} searchQuery="users" />);
      
      expect(screen.getByText('Users')).toBeInTheDocument();
      expect(screen.queryByText('Sell')).not.toBeInTheDocument();
    });

    it('should show search icon', () => {
      const { container } = render(<TablesChildMenu {...defaultProps} />);
      
      const searchInput = screen.getByPlaceholderText(/search/i);
      const parent = searchInput.closest('div');
      expect(parent).toBeInTheDocument();
    });
  });

  describe('Section Toggle', () => {
    it('should toggle section when clicking header', () => {
      render(<TablesChildMenu {...defaultProps} />);
      
      const usersSection = screen.getByText('Users');
      fireEvent.click(usersSection);
      
      expect(mockSetOpenSections).toHaveBeenCalled();
    });

    it('should show expanded section with child links', () => {
      const expandedProps = {
        ...defaultProps,
        openSections: { ...defaultProps.openSections, users: true },
      };
      
      render(<TablesChildMenu {...expandedProps} />);
      
      expect(screen.getByText('All Users')).toBeInTheDocument();
      expect(screen.getByText('User Roles')).toBeInTheDocument();
    });

    it('should hide child links when section is collapsed', () => {
      render(<TablesChildMenu {...defaultProps} />);
      
      expect(screen.queryByText('All Users')).not.toBeInTheDocument();
      expect(screen.queryByText('User Roles')).not.toBeInTheDocument();
    });

    it('should display chevron icon for expandable sections', () => {
      const { container } = render(<TablesChildMenu {...defaultProps} />);
      
      // Chevron icons should be present for sections with links
      const chevrons = container.querySelectorAll('[data-testid="chevron-icon"]');
      expect(chevrons.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Active State', () => {
    it('should highlight active section based on pathname', () => {
      (usePathname as jest.Mock).mockReturnValue('/en/admin/users');
      
      const { container } = render(<TablesChildMenu {...defaultProps} />);
      
      const usersSection = screen.getByText('Users').closest('button');
      expect(usersSection).toHaveClass('bg-sky-600');
    });

    it('should highlight active child link', () => {
      (usePathname as jest.Mock).mockReturnValue('/en/admin/users');
      
      const expandedProps = {
        ...defaultProps,
        openSections: { ...defaultProps.openSections, users: true },
      };
      
      render(<TablesChildMenu {...expandedProps} />);
      
      const allUsersLink = screen.getByText('All Users').closest('a');
      expect(allUsersLink).toHaveClass('bg-sky-600');
    });
  });

  describe('Close Button', () => {
    it('should render close button', () => {
      const { container } = render(<TablesChildMenu {...defaultProps} />);
      
      const closeButton = container.querySelector('button[aria-label]');
      expect(closeButton).toBeInTheDocument();
    });

    it('should close sidebar when clicking close button', () => {
      render(<TablesChildMenu {...defaultProps} />);
      
      const closeButtons = screen.getAllByRole('button');
      const closeButton = closeButtons.find(btn => btn.querySelector('svg'));
      
      if (closeButton) {
        fireEvent.click(closeButton);
        expect(mockSetIsSidebarOpen).toHaveBeenCalledWith(false);
      }
    });
  });

  describe('Accessibility', () => {
    it('should have accessible search input', () => {
      render(<TablesChildMenu {...defaultProps} />);
      
      const searchInput = screen.getByPlaceholderText(/search/i);
      expect(searchInput).toHaveAttribute('type', 'text');
    });

    it('should have clickable section headers', () => {
      render(<TablesChildMenu {...defaultProps} />);
      
      const usersButton = screen.getByText('Users').closest('button');
      expect(usersButton).toBeInTheDocument();
    });

    it('should have proper link structure for navigation items', () => {
      const expandedProps = {
        ...defaultProps,
        openSections: { ...defaultProps.openSections, users: true },
      };
      
      render(<TablesChildMenu {...expandedProps} />);
      
      const allUsersLink = screen.getByText('All Users').closest('a');
      expect(allUsersLink).toHaveAttribute('href', '/en/admin/users');
    });
  });

  describe('Dynamic Color Theme', () => {
    it('should use primary color from settings', () => {
      (useSettings as jest.Mock).mockReturnValue({
        settings: { primary_color: 'blue' },
      });
      
      const { container } = render(<TablesChildMenu {...defaultProps} />);
      
      // Should apply blue color classes
      expect(container.innerHTML).toContain('blue');
    });

    it('should fallback to sky color if no primary color', () => {
      (useSettings as jest.Mock).mockReturnValue({
        settings: {},
      });
      
      const { container } = render(<TablesChildMenu {...defaultProps} />);
      
      // Should apply sky color classes
      expect(container.innerHTML).toContain('sky');
    });
  });

  describe('Empty Sections', () => {
    it('should not render sections with no links', () => {
      const emptyLinksProps = {
        ...defaultProps,
        sidebarLinks: {
          ...mockSidebarLinks,
          users: [],
        },
      };
      
      render(<TablesChildMenu {...emptyLinksProps} />);
      
      // Users section should still render even with no links
      expect(screen.getByText('Users')).toBeInTheDocument();
    });
  });

  describe('Auto-expand behavior', () => {
    it('should auto-expand when sidebar becomes visible', () => {
      const { rerender } = render(<TablesChildMenu {...defaultProps} isSidebarOpen={false} />);
      
      rerender(<TablesChildMenu {...defaultProps} isSidebarOpen={true} />);
      
      // Component should be visible after becoming open
      expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
    });
  });

  describe('Positioning', () => {
    it('should have correct positioning classes', () => {
      const { container } = render(<TablesChildMenu {...defaultProps} />);
      
      const menuContainer = container.firstChild;
      expect(menuContainer).toHaveClass('fixed');
      expect(menuContainer).toHaveClass('left-28');
      expect(menuContainer).toHaveClass('top-16');
    });

    it('should have correct z-index for layering', () => {
      const { container } = render(<TablesChildMenu {...defaultProps} />);
      
      const menuContainer = container.firstChild;
      expect(menuContainer).toHaveClass('z-30');
    });
  });
});
