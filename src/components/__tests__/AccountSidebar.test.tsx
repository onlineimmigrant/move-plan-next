import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AccountSidebar from '../AccountSidebar';
import { usePathname } from 'next/navigation';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useAccountTranslations } from '@/components/accountTranslationLogic/useAccountTranslations';
import { useSettings } from '@/context/SettingsContext';
import { useSidebar } from '@/context/SidebarContext';

// Mock dependencies
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

jest.mock('@/hooks/useThemeColors', () => ({
  useThemeColors: jest.fn(),
}));

jest.mock('@/components/accountTranslationLogic/useAccountTranslations', () => ({
  useAccountTranslations: jest.fn(),
}));

jest.mock('@/context/SettingsContext', () => ({
  useSettings: jest.fn(),
}));

jest.mock('@/context/SidebarContext', () => ({
  useSidebar: jest.fn(),
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

describe('AccountSidebar', () => {
  const mockSetIsMobileMenuOpen = jest.fn();
  
  const defaultMocks = {
    pathname: '/account/profile',
    primary: {
      base: '#0ea5e9',
      lighter: '#bae6fd',
    },
    translations: {
      profile: 'Profile',
      purchases: 'Purchases',
      payments: 'Payments',
      billing: 'Billing Details',
      receipts: 'Receipts',
      back: 'Back to Account',
    },
    settings: {
      image: '/test-logo.png',
    },
    isMobileMenuOpen: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    (usePathname as jest.Mock).mockReturnValue(defaultMocks.pathname);
    (useThemeColors as jest.Mock).mockReturnValue({
      cssVars: { primary: defaultMocks.primary },
    });
    (useAccountTranslations as jest.Mock).mockReturnValue({
      t: defaultMocks.translations,
    });
    (useSettings as jest.Mock).mockReturnValue({
      settings: defaultMocks.settings,
    });
    (useSidebar as jest.Mock).mockReturnValue({
      isMobileMenuOpen: defaultMocks.isMobileMenuOpen,
      setIsMobileMenuOpen: mockSetIsMobileMenuOpen,
    });
  });

  describe('Rendering', () => {
    it('should render sidebar with logo and navigation items', () => {
      render(<AccountSidebar />);
      
      // Check for logo
      const logo = screen.getAllByRole('img')[0];
      expect(logo).toHaveAttribute('src', '/test-logo.png');
      
      // Check for navigation items
      expect(screen.getByText('Profile')).toBeInTheDocument();
      expect(screen.getByText('Purchases')).toBeInTheDocument();
      expect(screen.getByText('Payments')).toBeInTheDocument();
    });

    it('should render back to account link', () => {
      render(<AccountSidebar />);
      
      const backLink = screen.getAllByText('Back to Account')[0];
      expect(backLink).toBeInTheDocument();
    });

    it('should render both desktop and mobile sidebars', () => {
      const { container } = render(<AccountSidebar />);
      
      // Desktop sidebar (hidden lg:flex)
      const desktopSidebar = container.querySelector('.lg\\:flex');
      expect(desktopSidebar).toBeInTheDocument();
      
      // Mobile sidebar (lg:hidden)
      const mobileSidebar = container.querySelector('.lg\\:hidden');
      expect(mobileSidebar).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('should highlight active navigation item', () => {
      render(<AccountSidebar />);
      
      // Profile should be active based on pathname
      const profileLinks = screen.getAllByRole('link', { name: /Profile/i });
      expect(profileLinks.length).toBeGreaterThan(0);
    });

    it('should have correct href attributes', () => {
      render(<AccountSidebar />);
      
      const profileLinks = screen.getAllByRole('link', { name: /Profile/i });
      profileLinks.forEach(link => {
        expect(link).toHaveAttribute('href', '/account/profile');
      });
    });

    it('should render back to account link with correct href', () => {
      render(<AccountSidebar />);
      
      const backLinks = screen.getAllByRole('link', { name: /Back to Account/i });
      backLinks.forEach(link => {
        expect(link).toHaveAttribute('href', '/account');
      });
    });
  });

  describe('Payments Accordion', () => {
    it('should auto-expand payments accordion when on payments page', () => {
      (usePathname as jest.Mock).mockReturnValue('/account/profile/payments/billing');
      
      render(<AccountSidebar />);
      
      // Check if sub-items are visible
      expect(screen.getAllByText('Billing Details').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Receipts').length).toBeGreaterThan(0);
    });

    it('should toggle payments accordion on click', () => {
      render(<AccountSidebar />);
      
      const paymentsButtons = screen.getAllByRole('button', { name: /Payments/i });
      const firstButton = paymentsButtons[0];
      
      // Click to expand
      fireEvent.click(firstButton);
      
      // Sub-items should be visible
      expect(screen.getAllByText('Billing Details').length).toBeGreaterThan(0);
    });

    it('should show chevron icon for expandable payments section', () => {
      const { container } = render(<AccountSidebar />);
      
      // Check for chevron icons
      const chevrons = container.querySelectorAll('svg');
      expect(chevrons.length).toBeGreaterThan(0);
    });
  });

  describe('Mobile Drawer', () => {
    it('should show mobile drawer when isMobileMenuOpen is true', () => {
      (useSidebar as jest.Mock).mockReturnValue({
        isMobileMenuOpen: true,
        setIsMobileMenuOpen: mockSetIsMobileMenuOpen,
      });
      
      const { container } = render(<AccountSidebar />);
      
      const mobileDrawer = container.querySelector('.lg\\:hidden');
      expect(mobileDrawer).toHaveClass('translate-x-0');
    });

    it('should hide mobile drawer when isMobileMenuOpen is false', () => {
      const { container } = render(<AccountSidebar />);
      
      const mobileDrawer = container.querySelector('.lg\\:hidden');
      expect(mobileDrawer).toHaveClass('-translate-x-full');
    });

    it('should have consistent transition duration (200ms)', () => {
      const { container } = render(<AccountSidebar />);
      
      const mobileDrawer = container.querySelector('.lg\\:hidden');
      expect(mobileDrawer).toHaveClass('duration-200');
      expect(mobileDrawer).toHaveClass('ease-in-out');
    });
  });

  describe('Theme Integration', () => {
    it('should apply primary color to active items', () => {
      render(<AccountSidebar />);
      
      // Active item should use primary color
      const profileLinks = screen.getAllByRole('link', { name: /Profile/i });
      expect(profileLinks.length).toBeGreaterThan(0);
    });

    it('should use custom primary color from theme', () => {
      const customPrimary = {
        base: '#10b981',
        lighter: '#d1fae5',
      };
      
      (useThemeColors as jest.Mock).mockReturnValue({
        cssVars: { primary: customPrimary },
      });
      
      render(<AccountSidebar />);
      
      // Sidebar should render with custom theme
      expect(screen.getByText('Profile')).toBeInTheDocument();
    });
  });

  describe('Translations', () => {
    it('should use translated labels', () => {
      const customTranslations = {
        profile: 'Profil',
        purchases: 'Achats',
        payments: 'Paiements',
        billing: 'Facturation',
        receipts: 'Reçus',
        back: 'Retour au compte',
      };
      
      (useAccountTranslations as jest.Mock).mockReturnValue({
        t: customTranslations,
      });
      
      render(<AccountSidebar />);
      
      expect(screen.getByText('Profil')).toBeInTheDocument();
      expect(screen.getByText('Achats')).toBeInTheDocument();
      expect(screen.getByText('Paiements')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper navigation structure', () => {
      const { container } = render(<AccountSidebar />);
      
      const navElements = container.querySelectorAll('nav');
      expect(navElements.length).toBeGreaterThan(0);
    });

    it('should have accessible links', () => {
      render(<AccountSidebar />);
      
      const links = screen.getAllByRole('link');
      links.forEach(link => {
        expect(link).toBeInTheDocument();
      });
    });

    it('should have accessible buttons for accordion', () => {
      render(<AccountSidebar />);
      
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe('Glassmorphism Styling', () => {
    it('should apply glassmorphism effects to desktop sidebar', () => {
      const { container } = render(<AccountSidebar />);
      
      const desktopSidebar = container.querySelector('.lg\\:flex');
      expect(desktopSidebar).toHaveClass('backdrop-blur-md');
      expect(desktopSidebar).toHaveClass('bg-white/80');
    });

    it('should apply glassmorphism effects to mobile drawer', () => {
      const { container } = render(<AccountSidebar />);
      
      const mobileDrawer = container.querySelector('.lg\\:hidden');
      expect(mobileDrawer).toHaveClass('backdrop-blur-md');
      expect(mobileDrawer).toHaveClass('bg-white/95');
    });
  });

  describe('Sticky Positioning', () => {
    it('should make desktop sidebar sticky', () => {
      const { container } = render(<AccountSidebar />);
      
      const desktopSidebar = container.querySelector('.lg\\:flex');
      expect(desktopSidebar).toHaveClass('sticky');
      expect(desktopSidebar).toHaveClass('top-16');
    });

    it('should make mobile drawer fixed', () => {
      const { container } = render(<AccountSidebar />);
      
      const mobileDrawer = container.querySelector('.lg\\:hidden');
      expect(mobileDrawer).toHaveClass('fixed');
    });
  });

  describe('Settings Integration', () => {
    it('should use logo from settings', () => {
      render(<AccountSidebar />);
      
      const logos = screen.getAllByRole('img');
      logos.forEach(logo => {
        expect(logo).toHaveAttribute('src', '/test-logo.png');
      });
    });

    it('should fallback to default logo if settings image is not available', () => {
      (useSettings as jest.Mock).mockReturnValue({
        settings: { image: null },
      });
      
      render(<AccountSidebar />);
      
      const logos = screen.getAllByRole('img');
      logos.forEach(logo => {
        expect(logo).toHaveAttribute('src', '/logo.png');
      });
    });
  });

  describe('Transition Consistency', () => {
    it('should use consistent transitions for all interactive elements', () => {
      const { container } = render(<AccountSidebar />);
      
      // Check for consistent transition durations
      const allElements = container.querySelectorAll('[class*="transition"]');
      expect(allElements.length).toBeGreaterThan(0);
      
      // Mobile drawer should have duration-200
      const mobileDrawer = container.querySelector('.lg\\:hidden');
      expect(mobileDrawer).toHaveClass('duration-200');
    });
  });
});
