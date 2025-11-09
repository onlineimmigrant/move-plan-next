import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ProfileTable } from '../ProfileTable';

// Mock the useAccountTranslations hook
jest.mock('@/components/accountTranslationLogic/useAccountTranslations', () => ({
  useAccountTranslations: () => ({
    t: {
      edit: 'Edit',
    },
  }),
}));

const mockProfile = {
  id: '1',
  uuid: 'uuid-123',
  username: 'testuser',
  full_name: 'Test User',
  created_at: '2024-01-01T00:00:00Z',
  email: 'test@example.com',
  city: 'New York',
  postal_code: '10001',
  country: 'USA',
  role: 'user',
  updated_at: '2024-01-02T00:00:00Z',
};

const mockProfileEntries: [keyof typeof mockProfile, string | null][] = [
  ['username', 'testuser'],
  ['full_name', 'Test User'],
  ['email', 'test@example.com'],
  ['city', 'New York'],
  ['postal_code', '10001'],
  ['country', 'USA'],
  ['role', 'user'],
];

describe('ProfileTable', () => {
  describe('Rendering', () => {
    it('should render table with correct structure', () => {
      const onEdit = jest.fn();
      render(<ProfileTable profile={mockProfile} profileEntries={mockProfileEntries} onEdit={onEdit} />);

      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getByLabelText('Profile information')).toBeInTheDocument();
    });

    it('should render table headers correctly', () => {
      const onEdit = jest.fn();
      render(<ProfileTable profile={mockProfile} profileEntries={mockProfileEntries} onEdit={onEdit} />);

      expect(screen.getByRole('columnheader', { name: /field/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /value/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /action/i })).toBeInTheDocument();
    });

    it('should render all profile entries', () => {
      const onEdit = jest.fn();
      render(<ProfileTable profile={mockProfile} profileEntries={mockProfileEntries} onEdit={onEdit} />);

      expect(screen.getByText('testuser')).toBeInTheDocument();
      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
      expect(screen.getByText('New York')).toBeInTheDocument();
    });

    it('should display N/A for null values', () => {
      const onEdit = jest.fn();
      const entriesWithNull: [keyof typeof mockProfile, string | null][] = [
        ['username', 'testuser'],
        ['full_name', null],
      ];
      
      render(<ProfileTable profile={mockProfile} profileEntries={entriesWithNull} onEdit={onEdit} />);

      const naCells = screen.getAllByText('N/A');
      expect(naCells.length).toBeGreaterThan(0);
    });
  });

  describe('Edit Functionality', () => {
    it('should show edit button for editable fields', () => {
      const onEdit = jest.fn();
      render(<ProfileTable profile={mockProfile} profileEntries={mockProfileEntries} onEdit={onEdit} />);

      // Username should be editable
      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      expect(editButtons.length).toBeGreaterThan(0);
    });

    it('should not show edit button for role field', () => {
      const onEdit = jest.fn();
      render(<ProfileTable profile={mockProfile} profileEntries={[['role', 'user']]} onEdit={onEdit} />);

      expect(screen.queryByRole('button', { name: /edit role/i })).not.toBeInTheDocument();
      expect(screen.getByLabelText('Not editable')).toBeInTheDocument();
    });

    it('should call onEdit when edit button is clicked', () => {
      const onEdit = jest.fn();
      render(<ProfileTable profile={mockProfile} profileEntries={mockProfileEntries} onEdit={onEdit} />);

      const editButton = screen.getByRole('button', { name: /edit username/i });
      fireEvent.click(editButton);

      expect(onEdit).toHaveBeenCalledWith('username', 'testuser');
    });

    it('should call onEdit with null value for empty fields', () => {
      const onEdit = jest.fn();
      const entriesWithNull: [keyof typeof mockProfile, string | null][] = [
        ['city', null],
      ];
      
      render(<ProfileTable profile={mockProfile} profileEntries={entriesWithNull} onEdit={onEdit} />);

      const editButton = screen.getByRole('button', { name: /edit city/i });
      fireEvent.click(editButton);

      expect(onEdit).toHaveBeenCalledWith('city', null);
    });

    it('should have correct aria-label for edit buttons', () => {
      const onEdit = jest.fn();
      render(<ProfileTable profile={mockProfile} profileEntries={[['email', 'test@example.com']]} onEdit={onEdit} />);

      expect(screen.getByLabelText('Edit Email')).toBeInTheDocument();
    });
  });

  describe('Styling and Classes', () => {
    it('should have glassmorphism styling', () => {
      const onEdit = jest.fn();
      const { container } = render(
        <ProfileTable profile={mockProfile} profileEntries={mockProfileEntries} onEdit={onEdit} />
      );

      const tableContainer = container.querySelector('.backdrop-blur-sm');
      expect(tableContainer).toBeInTheDocument();
    });

    it('should have transition classes on rows', () => {
      const onEdit = jest.fn();
      const { container } = render(
        <ProfileTable profile={mockProfile} profileEntries={mockProfileEntries} onEdit={onEdit} />
      );

      const row = container.querySelector('tbody tr');
      expect(row).toHaveClass('transition');
      expect(row).toHaveClass('duration-150');
    });

    it('should have correct transition duration on edit buttons', () => {
      const onEdit = jest.fn();
      const { container } = render(
        <ProfileTable profile={mockProfile} profileEntries={[['username', 'testuser']]} onEdit={onEdit} />
      );

      const editButton = container.querySelector('button');
      expect(editButton).toHaveClass('duration-200');
      expect(editButton).toHaveClass('transition-all');
    });

    it('should have hover states', () => {
      const onEdit = jest.fn();
      const { container } = render(
        <ProfileTable profile={mockProfile} profileEntries={mockProfileEntries} onEdit={onEdit} />
      );

      const row = container.querySelector('tbody tr');
      expect(row).toHaveClass('hover:bg-gray-50/50');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA roles', () => {
      const onEdit = jest.fn();
      render(<ProfileTable profile={mockProfile} profileEntries={mockProfileEntries} onEdit={onEdit} />);

      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getAllByRole('row').length).toBeGreaterThan(0);
      expect(screen.getAllByRole('columnheader')).toHaveLength(3);
    });

    it('should have aria-label on table', () => {
      const onEdit = jest.fn();
      render(<ProfileTable profile={mockProfile} profileEntries={mockProfileEntries} onEdit={onEdit} />);

      expect(screen.getByLabelText('Profile information')).toBeInTheDocument();
    });

    it('should have aria-hidden on icons', () => {
      const onEdit = jest.fn();
      const { container } = render(
        <ProfileTable profile={mockProfile} profileEntries={[['username', 'testuser']]} onEdit={onEdit} />
      );

      const icon = container.querySelector('svg');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });

    it('should have proper scope on header cells', () => {
      const onEdit = jest.fn();
      render(<ProfileTable profile={mockProfile} profileEntries={mockProfileEntries} onEdit={onEdit} />);

      const headers = screen.getAllByRole('columnheader');
      headers.forEach(header => {
        expect(header).toHaveAttribute('scope', 'col');
      });
    });
  });

  describe('Responsive Design', () => {
    it('should have sticky positioning classes', () => {
      const onEdit = jest.fn();
      const { container } = render(
        <ProfileTable profile={mockProfile} profileEntries={mockProfileEntries} onEdit={onEdit} />
      );

      const stickyElements = container.querySelectorAll('.sticky');
      expect(stickyElements.length).toBeGreaterThan(0);
    });

    it('should have overflow-x-auto for mobile scrolling', () => {
      const onEdit = jest.fn();
      const { container } = render(
        <ProfileTable profile={mockProfile} profileEntries={mockProfileEntries} onEdit={onEdit} />
      );

      const tableContainer = container.querySelector('.overflow-x-auto');
      expect(tableContainer).toBeInTheDocument();
    });

    it('should have minimum width classes', () => {
      const onEdit = jest.fn();
      const { container } = render(
        <ProfileTable profile={mockProfile} profileEntries={mockProfileEntries} onEdit={onEdit} />
      );

      const minWidthCell = container.querySelector('.min-w-48');
      expect(minWidthCell).toBeInTheDocument();
    });
  });

  describe('Field Labels', () => {
    it('should display formatted field labels', () => {
      const onEdit = jest.fn();
      render(<ProfileTable profile={mockProfile} profileEntries={[['full_name', 'Test User']]} onEdit={onEdit} />);

      expect(screen.getByText('Full Name')).toBeInTheDocument();
    });

    it('should display raw field name if no label defined', () => {
      const onEdit = jest.fn();
      const customEntries: [keyof typeof mockProfile, string | null][] = [
        ['id', '1'],
      ];
      
      render(<ProfileTable profile={mockProfile} profileEntries={customEntries} onEdit={onEdit} />);

      expect(screen.getByText('id')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty profile entries', () => {
      const onEdit = jest.fn();
      render(<ProfileTable profile={mockProfile} profileEntries={[]} onEdit={onEdit} />);

      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.queryByRole('row')).toBeInTheDocument(); // Header row still exists
    });

    it('should handle profile entries with special characters', () => {
      const onEdit = jest.fn();
      const specialEntries: [keyof typeof mockProfile, string | null][] = [
        ['username', 'user@123!'],
      ];
      
      render(<ProfileTable profile={mockProfile} profileEntries={specialEntries} onEdit={onEdit} />);

      expect(screen.getByText('user@123!')).toBeInTheDocument();
    });

    it('should handle very long values', () => {
      const onEdit = jest.fn();
      const longValue = 'A'.repeat(100);
      const longEntries: [keyof typeof mockProfile, string | null][] = [
        ['username', longValue],
      ];
      
      render(<ProfileTable profile={mockProfile} profileEntries={longEntries} onEdit={onEdit} />);

      expect(screen.getByText(longValue)).toBeInTheDocument();
    });
  });

  describe('Multiple Edit Buttons', () => {
    it('should render multiple edit buttons for different fields', () => {
      const onEdit = jest.fn();
      render(<ProfileTable profile={mockProfile} profileEntries={mockProfileEntries} onEdit={onEdit} />);

      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      expect(editButtons.length).toBeGreaterThan(1);
    });

    it('should call onEdit with different parameters for different fields', () => {
      const onEdit = jest.fn();
      render(<ProfileTable profile={mockProfile} profileEntries={mockProfileEntries} onEdit={onEdit} />);

      const usernameEditButton = screen.getByRole('button', { name: /edit username/i });
      const emailEditButton = screen.getByRole('button', { name: /edit email/i });

      fireEvent.click(usernameEditButton);
      expect(onEdit).toHaveBeenCalledWith('username', 'testuser');

      fireEvent.click(emailEditButton);
      expect(onEdit).toHaveBeenCalledWith('email', 'test@example.com');
    });
  });

  describe('Dark Mode Support', () => {
    it('should have dark mode classes', () => {
      const onEdit = jest.fn();
      const { container } = render(
        <ProfileTable profile={mockProfile} profileEntries={mockProfileEntries} onEdit={onEdit} />
      );

      const darkClasses = container.querySelector('.dark\\:bg-gray-800\\/80');
      expect(darkClasses).toBeInTheDocument();
    });
  });
});
