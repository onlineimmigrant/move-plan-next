import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ParentMenu from '../ParentMenu';
import { usePathname } from 'next/navigation';
import { useSettings } from '@/context/SettingsContext';
import { useModal } from '@/context/ModalContext';

// Mock dependencies
jest.mock('next/navigation');
jest.mock('@/context/SettingsContext');
jest.mock('@/context/ModalContext');
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt }: any) => <img src={src} alt={alt} />,
}));

const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;
const mockUseSettings = useSettings as jest.MockedFunction<typeof useSettings>;
const mockUseModal = useModal as jest.MockedFunction<typeof useModal>;

describe('ParentMenu', () => {
  const mockSetIsCollapsed = jest.fn();
  const mockSetActiveSection = jest.fn();
  const mockSetIsTablesHovered = jest.fn();
  const mockSetIsPaletteModalOpen = jest.fn();

  const defaultProps = {
    isCollapsed: true,
    setIsCollapsed: mockSetIsCollapsed,
    setActiveSection: mockSetActiveSection,
    setIsTablesHovered: mockSetIsTablesHovered,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePathname.mockReturnValue('/admin');
    mockUseSettings.mockReturnValue({
      settings: {
        image: '/test-logo.png',
        primary_color: 'blue',
        secondary_color: 'gray',
      } as any,
      setSettings: jest.fn(),
    });
    mockUseModal.mockReturnValue({
      setIsPaletteModalOpen: mockSetIsPaletteModalOpen,
    } as any);
  });

  describe('Rendering', () => {
    it('should render parent menu with logo', () => {
      render(<ParentMenu {...defaultProps} />);
      const logo = screen.getByRole('img', { name: 'Logo' });
      expect(logo).toBeInTheDocument();
      expect(logo).toHaveAttribute('src', '/test-logo.png');
    });

    it('should render all menu items', () => {
      render(<ParentMenu {...defaultProps} />);
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Tables')).toBeInTheDocument();
      expect(screen.getByText('App')).toBeInTheDocument();
      expect(screen.getByText('Reports')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('should render special settings items when on settings page', () => {
      mockUsePathname.mockReturnValue('/admin/settings');
      render(<ParentMenu {...defaultProps} />);
      expect(screen.getByText('Palette')).toBeInTheDocument();
    });

    it('should not render palette item on non-settings pages', () => {
      mockUsePathname.mockReturnValue('/admin/dashboard');
      render(<ParentMenu {...defaultProps} />);
      expect(screen.queryByText('Palette')).not.toBeInTheDocument();
    });
  });

  describe('Collapse/Expand Behavior', () => {
    it('should expand menu on mouse enter', async () => {
      render(<ParentMenu {...defaultProps} />);
      const menu = screen.getByRole('navigation').parentElement;
      
      fireEvent.mouseEnter(menu!);
      
      expect(mockSetIsCollapsed).toHaveBeenCalledWith(false);
    });

    it('should collapse menu on mouse leave after delay', async () => {
      jest.useFakeTimers();
      render(<ParentMenu {...defaultProps} isCollapsed={false} />);
      const menu = screen.getByRole('navigation').parentElement;
      
      fireEvent.mouseLeave(menu!);
      
      // Should not collapse immediately
      expect(mockSetIsCollapsed).not.toHaveBeenCalled();
      
      // Should collapse after 200ms delay
      jest.advanceTimersByTime(200);
      expect(mockSetIsCollapsed).toHaveBeenCalledWith(true);
      
      jest.useRealTimers();
    });
  });

  describe('Navigation', () => {
    it('should navigate to dashboard when clicking Dashboard link', () => {
      render(<ParentMenu {...defaultProps} />);
      const dashboardLink = screen.getByText('Dashboard').closest('a');
      expect(dashboardLink).toHaveAttribute('href', '/admin');
    });

    it('should set active section when clicking Tables', () => {
      render(<ParentMenu {...defaultProps} />);
      const tablesLink = screen.getByText('Tables');
      
      fireEvent.click(tablesLink);
      
      expect(mockSetActiveSection).toHaveBeenCalledWith('tables');
    });

    it('should set active section when clicking Reports', () => {
      render(<ParentMenu {...defaultProps} />);
      const reportsLink = screen.getByText('Reports');
      
      fireEvent.click(reportsLink);
      
      expect(mockSetActiveSection).toHaveBeenCalledWith('reports');
    });

    it('should clear active section when clicking non-submenu items', () => {
      render(<ParentMenu {...defaultProps} />);
      const dashboardLink = screen.getByText('Dashboard');
      
      fireEvent.click(dashboardLink);
      
      expect(mockSetActiveSection).toHaveBeenCalledWith('');
    });
  });

  describe('Tables Hover Behavior', () => {
    it('should set tables hovered to true when hovering Tables item', () => {
      render(<ParentMenu {...defaultProps} />);
      const tablesLink = screen.getByText('Tables');
      
      fireEvent.mouseEnter(tablesLink);
      
      expect(mockSetIsTablesHovered).toHaveBeenCalledWith(true);
    });

    it('should set tables hovered to false when hovering non-Tables items', () => {
      render(<ParentMenu {...defaultProps} />);
      const dashboardLink = screen.getByText('Dashboard');
      
      fireEvent.mouseEnter(dashboardLink);
      
      expect(mockSetIsTablesHovered).toHaveBeenCalledWith(false);
    });
  });

  describe('Active State Styling', () => {
    it('should highlight active menu item based on pathname', () => {
      mockUsePathname.mockReturnValue('/admin/tables');
      render(<ParentMenu {...defaultProps} />);
      
      const tablesLink = screen.getByText('Tables').closest('a');
      expect(tablesLink).toHaveClass('bg-gradient-to-r');
    });

    it('should not highlight inactive menu items', () => {
      mockUsePathname.mockReturnValue('/admin/tables');
      render(<ParentMenu {...defaultProps} />);
      
      const dashboardLink = screen.getByText('Dashboard').closest('a');
      expect(dashboardLink).not.toHaveClass('from-sky-50');
    });
  });

  describe('Settings Page Special Items', () => {
    it('should open palette modal when clicking Palette button', () => {
      mockUsePathname.mockReturnValue('/admin/settings');
      render(<ParentMenu {...defaultProps} />);
      
      const paletteButton = screen.getByText('Palette');
      fireEvent.click(paletteButton);
      
      expect(mockSetIsPaletteModalOpen).toHaveBeenCalledWith(true);
    });
  });

  describe('Accessibility', () => {
    it('should have proper semantic HTML structure', () => {
      render(<ParentMenu {...defaultProps} />);
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    it('should have accessible link labels', () => {
      render(<ParentMenu {...defaultProps} />);
      const tablesLink = screen.getByText('Tables').closest('a');
      expect(tablesLink).toHaveAttribute('title', 'Tables');
    });
  });

    describe('Logo Link', () => {
    it('should render logo with correct link to admin dashboard', () => {
      render(<ParentMenu {...defaultProps} />);
      const logoLink = screen.getByRole('link', { name: /logo/i });
      const logo = screen.getByRole('img', { name: 'Logo' });
      
      expect(logoLink).toHaveAttribute('href', '/en/admin');
      expect(logo).toBeInTheDocument();
    });

    it('should have correct locale in admin link', () => {
      render(<ParentMenu {...defaultProps} />);
      const logoLink = screen.getByRole('link', { name: /logo/i });
      expect(logoLink).toHaveAttribute('href', '/en/admin');
    });

    it('should render logo with correct src from settings', () => {
      render(<ParentMenu {...defaultProps} />);
      const logo = screen.getByRole('img', { name: 'Logo' });
      expect(logo).toHaveAttribute('src', '/test-logo.png');
    });
  });
});
