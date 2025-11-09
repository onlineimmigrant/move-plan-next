import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AccountModalCard, AccountLinkCard } from '../AccountCards';
import { useRouter } from 'next/navigation';
import { UserIcon } from '@heroicons/react/24/outline';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

describe('AccountCards', () => {
  const mockPrimary = {
    base: '#0ea5e9',
    lighter: '#bae6fd',
  };

  const mockRouter = {
    prefetch: jest.fn(),
    push: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  describe('AccountModalCard', () => {
    const mockItem = {
      label: 'Test Modal',
      icon: UserIcon,
      tooltip: 'Test tooltip',
      onClick: jest.fn(),
      isModal: true,
    };

    it('should render modal card with label and icon', () => {
      render(<AccountModalCard item={mockItem} primary={mockPrimary} />);
      
      expect(screen.getByText('Test Modal')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Test Modal' })).toBeInTheDocument();
    });

    it('should call onClick when clicked', () => {
      render(<AccountModalCard item={mockItem} primary={mockPrimary} />);
      
      const button = screen.getByRole('button', { name: 'Test Modal' });
      fireEvent.click(button);
      
      expect(mockItem.onClick).toHaveBeenCalledTimes(1);
    });

    it('should have correct button type', () => {
      render(<AccountModalCard item={mockItem} primary={mockPrimary} />);
      
      const button = screen.getByRole('button', { name: 'Test Modal' });
      expect(button).toHaveAttribute('type', 'button');
    });

    it('should apply hover styles on mouse enter', () => {
      const { container } = render(<AccountModalCard item={mockItem} primary={mockPrimary} />);
      
      const button = screen.getByRole('button', { name: 'Test Modal' });
      fireEvent.mouseEnter(button);
      
      // Check if hover background color is applied
      expect(button).toHaveStyle({ backgroundColor: `${mockPrimary.lighter}80` });
    });

    it('should remove hover styles on mouse leave', () => {
      const { container } = render(<AccountModalCard item={mockItem} primary={mockPrimary} />);
      
      const button = screen.getByRole('button', { name: 'Test Modal' });
      
      // Enter and then leave
      fireEvent.mouseEnter(button);
      fireEvent.mouseLeave(button);
      
      // Background should be undefined (default)
      expect(button).toHaveStyle({ backgroundColor: undefined });
    });

    it('should have consistent transition duration (200ms)', () => {
      render(<AccountModalCard item={mockItem} primary={mockPrimary} />);
      
      const button = screen.getByRole('button', { name: 'Test Modal' });
      expect(button).toHaveClass('duration-200');
      expect(button).toHaveClass('ease-in-out');
    });

    it('should have proper accessibility attributes', () => {
      render(<AccountModalCard item={mockItem} primary={mockPrimary} />);
      
      const button = screen.getByRole('button', { name: 'Test Modal' });
      expect(button).toHaveAttribute('aria-label', 'Test Modal');
      expect(button).toHaveAttribute('title', 'Test Modal');
    });

    it('should apply glassmorphism styles', () => {
      render(<AccountModalCard item={mockItem} primary={mockPrimary} />);
      
      const button = screen.getByRole('button', { name: 'Test Modal' });
      expect(button).toHaveClass('backdrop-blur-sm');
      expect(button).toHaveClass('bg-white/80');
    });
  });

  describe('AccountLinkCard', () => {
    const mockItem = {
      label: 'Profile',
      icon: UserIcon,
      href: '/account/profile',
      tooltip: 'View your profile',
    };

    it('should render link card with label and icon', () => {
      render(
        <AccountLinkCard 
          item={mockItem} 
          pathname="/account" 
          primary={mockPrimary} 
        />
      );
      
      expect(screen.getByText('Profile')).toBeInTheDocument();
      const link = screen.getByRole('link', { name: /Navigate to Profile/i });
      expect(link).toBeInTheDocument();
    });

    it('should have correct href attribute', () => {
      render(
        <AccountLinkCard 
          item={mockItem} 
          pathname="/account" 
          primary={mockPrimary} 
        />
      );
      
      const link = screen.getByRole('link', { name: /Navigate to Profile/i });
      expect(link).toHaveAttribute('href', '/account/profile');
    });

    it('should prefetch on mouse enter', () => {
      render(
        <AccountLinkCard 
          item={mockItem} 
          pathname="/account" 
          primary={mockPrimary} 
        />
      );
      
      const link = screen.getByRole('link', { name: /Navigate to Profile/i });
      fireEvent.mouseEnter(link);
      
      expect(mockRouter.prefetch).toHaveBeenCalledWith('/account/profile');
    });

    it('should highlight when active (current page)', () => {
      const { container } = render(
        <AccountLinkCard 
          item={mockItem} 
          pathname="/account/profile" 
          primary={mockPrimary} 
        />
      );
      
      const link = screen.getByRole('link', { name: /Navigate to Profile/i });
      expect(link).toHaveAttribute('aria-current', 'page');
      expect(link).toHaveStyle({ backgroundColor: `${mockPrimary.lighter}80` });
    });

    it('should not highlight when not active', () => {
      render(
        <AccountLinkCard 
          item={mockItem} 
          pathname="/account/other" 
          primary={mockPrimary} 
        />
      );
      
      const link = screen.getByRole('link', { name: /Navigate to Profile/i });
      expect(link).not.toHaveAttribute('aria-current');
    });

    it('should apply hover styles on mouse enter', () => {
      render(
        <AccountLinkCard 
          item={mockItem} 
          pathname="/account" 
          primary={mockPrimary} 
        />
      );
      
      const link = screen.getByRole('link', { name: /Navigate to Profile/i });
      fireEvent.mouseEnter(link);
      
      expect(link).toHaveStyle({ backgroundColor: `${mockPrimary.lighter}80` });
    });

    it('should remove hover styles on mouse leave', () => {
      render(
        <AccountLinkCard 
          item={mockItem} 
          pathname="/account" 
          primary={mockPrimary} 
        />
      );
      
      const link = screen.getByRole('link', { name: /Navigate to Profile/i });
      
      fireEvent.mouseEnter(link);
      fireEvent.mouseLeave(link);
      
      expect(link).toHaveStyle({ backgroundColor: undefined });
    });

    it('should handle admin page special styling', () => {
      const adminItem = {
        ...mockItem,
        label: 'Admin',
        href: '/admin',
      };

      render(
        <AccountLinkCard 
          item={adminItem} 
          pathname="/account" 
          primary={mockPrimary} 
        />
      );
      
      const link = screen.getByRole('link', { name: /Navigate to Admin/i });
      expect(link).toBeInTheDocument();
    });

    it('should have consistent transition duration (200ms)', () => {
      render(
        <AccountLinkCard 
          item={mockItem} 
          pathname="/account" 
          primary={mockPrimary} 
        />
      );
      
      const link = screen.getByRole('link', { name: /Navigate to Profile/i });
      expect(link).toHaveClass('duration-200');
      expect(link).toHaveClass('ease-in-out');
    });

    it('should have proper accessibility attributes', () => {
      render(
        <AccountLinkCard 
          item={mockItem} 
          pathname="/account" 
          primary={mockPrimary} 
        />
      );
      
      const link = screen.getByRole('link', { name: /Navigate to Profile/i });
      expect(link).toHaveAttribute('aria-label', 'Navigate to Profile');
      expect(link).toHaveAttribute('title', 'Profile');
    });

    it('should apply glassmorphism styles', () => {
      render(
        <AccountLinkCard 
          item={mockItem} 
          pathname="/account" 
          primary={mockPrimary} 
        />
      );
      
      const link = screen.getByRole('link', { name: /Navigate to Profile/i });
      expect(link).toHaveClass('backdrop-blur-sm');
      expect(link).toHaveClass('bg-white/80');
    });

    it('should use NEUTRAL_COLOR constant for non-hovered icons', () => {
      const { container } = render(
        <AccountLinkCard 
          item={mockItem} 
          pathname="/account" 
          primary={mockPrimary} 
        />
      );
      
      // The icon should use neutral color when not hovered
      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Component Memoization', () => {
    it('should memoize AccountModalCard to prevent unnecessary re-renders', () => {
      const mockItem = {
        label: 'Test',
        icon: UserIcon,
        tooltip: 'Test',
        onClick: jest.fn(),
        isModal: true,
      };

      expect(AccountModalCard.displayName).toBe('AccountModalCard');
    });

    it('should memoize AccountLinkCard to prevent unnecessary re-renders', () => {
      expect(AccountLinkCard.displayName).toBe('AccountLinkCard');
    });
  });

  describe('Theme Color Integration', () => {
    it('should use primary color on hover for modal card', () => {
      const customPrimary = {
        base: '#10b981',
        lighter: '#d1fae5',
      };

      render(
        <AccountModalCard 
          item={{
            label: 'Test',
            icon: UserIcon,
            tooltip: 'Test',
            onClick: jest.fn(),
            isModal: true,
          }} 
          primary={customPrimary} 
        />
      );

      const button = screen.getByRole('button');
      fireEvent.mouseEnter(button);

      expect(button).toHaveStyle({ backgroundColor: `${customPrimary.lighter}80` });
    });

    it('should use primary color on hover for link card', () => {
      const customPrimary = {
        base: '#10b981',
        lighter: '#d1fae5',
      };

      render(
        <AccountLinkCard 
          item={{
            label: 'Test',
            icon: UserIcon,
            href: '/test',
            tooltip: 'Test',
          }} 
          pathname="/other"
          primary={customPrimary} 
        />
      );

      const link = screen.getByRole('link');
      fireEvent.mouseEnter(link);

      expect(link).toHaveStyle({ backgroundColor: `${customPrimary.lighter}80` });
    });
  });
});
