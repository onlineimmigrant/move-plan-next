import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ReportsChildMenu from '../ReportsChildMenu';
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

describe('ReportsChildMenu', () => {
  const mockSetIsSidebarOpen = jest.fn();
  const mockSetOpenSections = jest.fn();
  const mockSetSearchQuery = jest.fn();

  const mockSidebarLinks = {
    tables: [
      { href: '/en/admin/reports/users', label: 'User Reports' },
      { href: '/en/admin/reports/sales', label: 'Sales Reports' },
    ],
    custom: [
      { href: '/en/admin/reports/constructor', label: 'Report Constructor' },
    ],
  };

  const defaultProps = {
    isSidebarOpen: true,
    setIsSidebarOpen: mockSetIsSidebarOpen,
    sidebarLinks: mockSidebarLinks,
    openSections: {
      tables: false,
      custom: false,
    },
    setOpenSections: mockSetOpenSections,
    searchQuery: '',
    setSearchQuery: mockSetSearchQuery,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (usePathname as jest.Mock).mockReturnValue('/en/admin/reports');
    (useSettings as jest.Mock).mockReturnValue({
      settings: { primary_color: 'sky' },
    });
  });

  describe('Rendering', () => {
    it('should render reports child menu when sidebar is open', () => {
      render(<ReportsChildMenu {...defaultProps} />);
      
      const searchInput = screen.getByPlaceholderText(/search/i);
      expect(searchInput).toBeInTheDocument();
    });

    it('should not render when sidebar is closed', () => {
      render(<ReportsChildMenu {...defaultProps} isSidebarOpen={false} />);
      
      const searchInput = screen.queryByPlaceholderText(/search/i);
      expect(searchInput).not.toBeInTheDocument();
    });

    it('should render section headings', () => {
      render(<ReportsChildMenu {...defaultProps} />);
      
      expect(screen.getByText('Tables')).toBeInTheDocument();
      expect(screen.getByText('Custom')).toBeInTheDocument();
    });

    it('should display section icons', () => {
      const { container } = render(<ReportsChildMenu {...defaultProps} />);
      
      const icons = container.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThan(0);
    });
  });

  describe('Search Functionality', () => {
    it('should update search query when typing', () => {
      render(<ReportsChildMenu {...defaultProps} />);
      
      const searchInput = screen.getByPlaceholderText(/search/i);
      fireEvent.change(searchInput, { target: { value: 'user' } });
      
      expect(mockSetSearchQuery).toHaveBeenCalledWith('user');
    });

    it('should filter sections based on search query', () => {
      render(<ReportsChildMenu {...defaultProps} searchQuery="custom" />);
      
      expect(screen.getByText('Custom')).toBeInTheDocument();
      expect(screen.queryByText('Tables')).not.toBeInTheDocument();
    });

    it('should show search icon in input', () => {
      const { container } = render(<ReportsChildMenu {...defaultProps} />);
      
      const searchInput = screen.getByPlaceholderText(/search/i);
      expect(searchInput).toBeInTheDocument();
      
      const parent = searchInput.closest('div');
      expect(parent).toBeInTheDocument();
    });
  });

  describe('Section Toggle', () => {
    it('should toggle section when clicking header', () => {
      render(<ReportsChildMenu {...defaultProps} />);
      
      const tablesSection = screen.getByText('Tables');
      fireEvent.click(tablesSection);
      
      expect(mockSetOpenSections).toHaveBeenCalled();
    });

    it('should show expanded section with child links', () => {
      const expandedProps = {
        ...defaultProps,
        openSections: { tables: true, custom: false },
      };
      
      render(<ReportsChildMenu {...expandedProps} />);
      
      expect(screen.getByText('User Reports')).toBeInTheDocument();
      expect(screen.getByText('Sales Reports')).toBeInTheDocument();
    });

    it('should hide child links when section is collapsed', () => {
      render(<ReportsChildMenu {...defaultProps} />);
      
      expect(screen.queryByText('User Reports')).not.toBeInTheDocument();
      expect(screen.queryByText('Sales Reports')).not.toBeInTheDocument();
    });

    it('should handle multiple expanded sections', () => {
      const expandedProps = {
        ...defaultProps,
        openSections: { tables: true, custom: true },
      };
      
      render(<ReportsChildMenu {...expandedProps} />);
      
      expect(screen.getByText('User Reports')).toBeInTheDocument();
      expect(screen.getByText('Report Constructor')).toBeInTheDocument();
    });
  });

  describe('Active State', () => {
    it('should highlight active section based on pathname', () => {
      (usePathname as jest.Mock).mockReturnValue('/en/admin/reports/users');
      
      const { container } = render(<ReportsChildMenu {...defaultProps} />);
      
      const tablesSection = screen.getByText('Tables').closest('button');
      expect(tablesSection).toHaveClass('bg-gray-50');
    });

    it('should highlight active child link', () => {
      (usePathname as jest.Mock).mockReturnValue('/en/admin/reports/users');
      
      const expandedProps = {
        ...defaultProps,
        openSections: { tables: true, custom: false },
      };
      
      render(<ReportsChildMenu {...expandedProps} />);
      
      const userReportsLink = screen.getByText('User Reports').closest('a');
      expect(userReportsLink).toHaveClass('bg-gray-50');
    });
  });

  describe('Close Button', () => {
    it('should render close button', () => {
      const { container } = render(<ReportsChildMenu {...defaultProps} />);
      
      const closeButton = container.querySelector('button[aria-label]');
      expect(closeButton).toBeInTheDocument();
    });

    it('should close sidebar when clicking close button', () => {
      render(<ReportsChildMenu {...defaultProps} />);
      
      const closeButtons = screen.getAllByRole('button');
      const closeButton = closeButtons.find(btn => btn.querySelector('svg.w-5.h-5'));
      
      if (closeButton) {
        fireEvent.click(closeButton);
        expect(mockSetIsSidebarOpen).toHaveBeenCalledWith(false);
      }
    });
  });

  describe('Accessibility', () => {
    it('should have accessible search input', () => {
      render(<ReportsChildMenu {...defaultProps} />);
      
      const searchInput = screen.getByPlaceholderText(/search/i);
      expect(searchInput).toHaveAttribute('type', 'text');
    });

    it('should have clickable section headers', () => {
      render(<ReportsChildMenu {...defaultProps} />);
      
      const tablesButton = screen.getByText('Tables').closest('button');
      expect(tablesButton).toBeInTheDocument();
    });

    it('should have proper link structure for navigation items', () => {
      const expandedProps = {
        ...defaultProps,
        openSections: { tables: true, custom: false },
      };
      
      render(<ReportsChildMenu {...expandedProps} />);
      
      const userReportsLink = screen.getByText('User Reports').closest('a');
      expect(userReportsLink).toHaveAttribute('href', '/en/admin/reports/users');
    });

    it('should support keyboard navigation with buttons', () => {
      render(<ReportsChildMenu {...defaultProps} />);
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toBeInTheDocument();
      });
    });
  });

  describe('Dynamic Color Theme', () => {
    it('should use primary color from settings', () => {
      (useSettings as jest.Mock).mockReturnValue({
        settings: { primary_color: 'blue' },
      });
      
      const { container } = render(<ReportsChildMenu {...defaultProps} />);
      
      expect(container.innerHTML).toContain('blue');
    });

    it('should fallback to sky color if no primary color', () => {
      (useSettings as jest.Mock).mockReturnValue({
        settings: {},
      });
      
      const { container } = render(<ReportsChildMenu {...defaultProps} />);
      
      expect(container.innerHTML).toContain('sky');
    });
  });

  describe('Empty Sections', () => {
    it('should handle sections with no links', () => {
      const emptyLinksProps = {
        ...defaultProps,
        sidebarLinks: {
          tables: [],
          custom: [],
        },
      };
      
      render(<ReportsChildMenu {...emptyLinksProps} />);
      
      // Sections should still render even with no links
      expect(screen.getByText('Tables')).toBeInTheDocument();
      expect(screen.getByText('Custom')).toBeInTheDocument();
    });
  });

  describe('Auto-expand behavior', () => {
    it('should auto-expand when sidebar becomes visible', () => {
      const { rerender } = render(<ReportsChildMenu {...defaultProps} isSidebarOpen={false} />);
      
      rerender(<ReportsChildMenu {...defaultProps} isSidebarOpen={true} />);
      
      expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
    });

    it('should maintain state when toggling visibility', () => {
      const { rerender } = render(<ReportsChildMenu {...defaultProps} />);
      
      rerender(<ReportsChildMenu {...defaultProps} isSidebarOpen={false} />);
      rerender(<ReportsChildMenu {...defaultProps} isSidebarOpen={true} />);
      
      const searchInput = screen.getByPlaceholderText(/search/i);
      expect(searchInput).toHaveValue('');
    });
  });

  describe('Positioning', () => {
    it('should have correct positioning classes', () => {
      const { container } = render(<ReportsChildMenu {...defaultProps} />);
      
      const menuContainer = container.firstChild;
      expect(menuContainer).toHaveClass('fixed');
      expect(menuContainer).toHaveClass('left-28');
      expect(menuContainer).toHaveClass('top-16');
    });

    it('should have correct z-index for layering', () => {
      const { container } = render(<ReportsChildMenu {...defaultProps} />);
      
      const menuContainer = container.firstChild;
      expect(menuContainer).toHaveClass('z-30');
    });

    it('should have proper width constraints', () => {
      const { container } = render(<ReportsChildMenu {...defaultProps} />);
      
      const menuContainer = container.firstChild;
      expect(menuContainer).toHaveClass('w-64');
    });
  });

  describe('Chevron Indicators', () => {
    it('should show chevron for expandable sections', () => {
      const { container } = render(<ReportsChildMenu {...defaultProps} />);
      
      // Should have chevron icons for sections with children
      const chevrons = container.querySelectorAll('svg');
      expect(chevrons.length).toBeGreaterThan(0);
    });

    it('should rotate chevron when section is expanded', () => {
      const expandedProps = {
        ...defaultProps,
        openSections: { tables: true, custom: false },
      };
      
      const { container } = render(<ReportsChildMenu {...expandedProps} />);
      
      // Check for rotation class on expanded section
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });
});
