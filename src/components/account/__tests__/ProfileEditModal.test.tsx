import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ProfileEditModal } from '../ProfileEditModal';

// Mock the useAccountTranslations hook
jest.mock('@/components/accountTranslationLogic/useAccountTranslations', () => ({
  useAccountTranslations: () => ({
    t: {
      save: 'Save',
      cancel: 'Cancel',
      loading: 'Loading...',
    },
  }),
}));

// Mock FocusTrap
jest.mock('focus-trap-react', () => {
  const FocusTrapMock = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
  FocusTrapMock.displayName = 'FocusTrap';
  return FocusTrapMock;
});

const mockPrimary = {
  base: '#0ea5e9',
  lighter: '#bae6fd',
};

const defaultProps = {
  isOpen: true,
  editingField: 'email',
  fieldValue: 'test@example.com',
  formError: null,
  isSubmitting: false,
  primary: mockPrimary,
  onFieldValueChange: jest.fn(),
  onSubmit: jest.fn(),
  onClose: jest.fn(),
  onKeyDown: jest.fn(),
};

describe('ProfileEditModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render when isOpen is true', () => {
      render(<ProfileEditModal {...defaultProps} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Edit Email')).toBeInTheDocument();
    });

    it('should not render when isOpen is false', () => {
      render(<ProfileEditModal {...defaultProps} isOpen={false} />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should not render when editingField is null', () => {
      render(<ProfileEditModal {...defaultProps} editingField={null} />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should display field label correctly', () => {
      render(<ProfileEditModal {...defaultProps} editingField="full_name" />);

      expect(screen.getByText('Edit Full Name')).toBeInTheDocument();
    });

    it('should show current field value in input', () => {
      render(<ProfileEditModal {...defaultProps} />);

      const input = screen.getByPlaceholderText(/enter email/i);
      expect(input).toHaveValue('test@example.com');
    });
  });

  describe('Form Interaction', () => {
    it('should call onFieldValueChange when input changes', () => {
      const onFieldValueChange = jest.fn();
      render(<ProfileEditModal {...defaultProps} onFieldValueChange={onFieldValueChange} />);

      const input = screen.getByPlaceholderText(/enter email/i);
      fireEvent.change(input, { target: { value: 'new@example.com' } });

      expect(onFieldValueChange).toHaveBeenCalledWith('new@example.com');
    });

    it('should call onSubmit when form is submitted', () => {
      const onSubmit = jest.fn((e) => e.preventDefault());
      render(<ProfileEditModal {...defaultProps} onSubmit={onSubmit} />);

      const form = screen.getByRole('dialog').querySelector('form');
      fireEvent.submit(form!);

      expect(onSubmit).toHaveBeenCalled();
    });

    it('should call onClose when close button is clicked', () => {
      const onClose = jest.fn();
      render(<ProfileEditModal {...defaultProps} onClose={onClose} />);

      const closeButton = screen.getByLabelText(/close/i);
      fireEvent.click(closeButton);

      expect(onClose).toHaveBeenCalled();
    });

    it('should call onClose when cancel button is clicked', () => {
      const onClose = jest.fn();
      render(<ProfileEditModal {...defaultProps} onClose={onClose} />);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(onClose).toHaveBeenCalled();
    });

    it('should call onClose when backdrop is clicked', () => {
      const onClose = jest.fn();
      const { container } = render(<ProfileEditModal {...defaultProps} onClose={onClose} />);

      const backdrop = container.querySelector('.fixed.inset-0.bg-black\\/30');
      fireEvent.click(backdrop!);

      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('Input Type Handling', () => {
    it('should use email input type for email field', () => {
      render(<ProfileEditModal {...defaultProps} editingField="email" />);

      const input = screen.getByPlaceholderText(/enter email/i);
      expect(input).toHaveAttribute('type', 'email');
    });

    it('should use text input type for non-email fields', () => {
      render(<ProfileEditModal {...defaultProps} editingField="username" fieldValue="testuser" />);

      const input = screen.getByPlaceholderText(/enter username/i);
      expect(input).toHaveAttribute('type', 'text');
    });

    it('should have correct placeholder for different fields', () => {
      render(<ProfileEditModal {...defaultProps} editingField="city" fieldValue="" />);

      expect(screen.getByPlaceholderText('Enter City...')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should display form error when present', () => {
      render(<ProfileEditModal {...defaultProps} formError="Email already exists" />);

      expect(screen.getByText('Email already exists')).toBeInTheDocument();
    });

    it('should have error alert role and aria-live', () => {
      render(<ProfileEditModal {...defaultProps} formError="Test error" />);

      const errorElement = screen.getByRole('alert');
      expect(errorElement).toHaveAttribute('aria-live', 'polite');
    });

    it('should not display error section when formError is null', () => {
      render(<ProfileEditModal {...defaultProps} formError={null} />);

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should disable buttons when submitting', () => {
      render(<ProfileEditModal {...defaultProps} isSubmitting={true} />);

      const saveButton = screen.getByRole('button', { name: /loading/i });
      const cancelButton = screen.getByRole('button', { name: /cancel/i });

      expect(saveButton).toBeDisabled();
      expect(cancelButton).toBeDisabled();
    });

    it('should show loading text when submitting', () => {
      render(<ProfileEditModal {...defaultProps} isSubmitting={true} />);

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should show save text when not submitting', () => {
      render(<ProfileEditModal {...defaultProps} isSubmitting={false} />);

      expect(screen.getByText('Save')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes on dialog', () => {
      render(<ProfileEditModal {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title');
    });

    it('should have aria-label on close button', () => {
      render(<ProfileEditModal {...defaultProps} />);

      expect(screen.getByLabelText(/close/i)).toBeInTheDocument();
    });

    it('should have aria-label on save button', () => {
      render(<ProfileEditModal {...defaultProps} />);

      expect(screen.getByLabelText('Save changes')).toBeInTheDocument();
    });

    it('should have aria-label on cancel button', () => {
      render(<ProfileEditModal {...defaultProps} />);

      expect(screen.getByLabelText('Cancel')).toBeInTheDocument();
    });

    it('should have aria-describedby on input', () => {
      render(<ProfileEditModal {...defaultProps} />);

      const input = screen.getByPlaceholderText(/enter email/i);
      expect(input).toHaveAttribute('aria-describedby', 'field_value_help');
    });

    it('should have help text with matching id', () => {
      render(<ProfileEditModal {...defaultProps} />);

      const helpText = screen.getByText(/enter a valid email address/i);
      expect(helpText).toHaveAttribute('id', 'field_value_help');
    });

    it('should mark input as required', () => {
      render(<ProfileEditModal {...defaultProps} />);

      const input = screen.getByPlaceholderText(/enter email/i);
      expect(input).toBeRequired();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should call onKeyDown when key is pressed', () => {
      const onKeyDown = jest.fn();
      render(<ProfileEditModal {...defaultProps} onKeyDown={onKeyDown} />);

      const dialog = screen.getByRole('dialog');
      fireEvent.keyDown(dialog, { key: 'Escape' });

      expect(onKeyDown).toHaveBeenCalled();
    });
  });

  describe('Styling and Theme', () => {
    it('should apply primary color to input border', () => {
      const { container } = render(<ProfileEditModal {...defaultProps} />);

      const input = container.querySelector('input');
      expect(input).toHaveStyle({ borderColor: mockPrimary.lighter });
    });

    it('should apply primary color to input outline', () => {
      const { container } = render(<ProfileEditModal {...defaultProps} />);

      const input = container.querySelector('input');
      expect(input).toHaveStyle({ outlineColor: mockPrimary.base });
    });

    it('should apply focus ring color dynamically', () => {
      const { container } = render(<ProfileEditModal {...defaultProps} />);

      const input = container.querySelector('input');
      expect(input).toHaveStyle({ '--focus-ring-color': mockPrimary.base });
    });

    it('should have glassmorphism styling', () => {
      const { container } = render(<ProfileEditModal {...defaultProps} />);

      const backdropBlur = container.querySelector('.backdrop-blur-sm');
      expect(backdropBlur).toBeInTheDocument();
    });

    it('should have transition classes', () => {
      const { container } = render(<ProfileEditModal {...defaultProps} />);

      const input = container.querySelector('input');
      expect(input).toHaveClass('transition');
      expect(input).toHaveClass('duration-150');
    });
  });

  describe('Different Field Types', () => {
    it('should render for username field', () => {
      render(<ProfileEditModal {...defaultProps} editingField="username" fieldValue="user123" />);

      expect(screen.getByText('Edit Username')).toBeInTheDocument();
      expect(screen.getByDisplayValue('user123')).toBeInTheDocument();
    });

    it('should render for full_name field', () => {
      render(<ProfileEditModal {...defaultProps} editingField="full_name" fieldValue="John Doe" />);

      expect(screen.getByText('Edit Full Name')).toBeInTheDocument();
      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
    });

    it('should render for city field', () => {
      render(<ProfileEditModal {...defaultProps} editingField="city" fieldValue="New York" />);

      expect(screen.getByText('Edit City')).toBeInTheDocument();
      expect(screen.getByDisplayValue('New York')).toBeInTheDocument();
    });

    it('should render for postal_code field', () => {
      render(<ProfileEditModal {...defaultProps} editingField="postal_code" fieldValue="12345" />);

      expect(screen.getByText('Edit Postal Code')).toBeInTheDocument();
      expect(screen.getByDisplayValue('12345')).toBeInTheDocument();
    });

    it('should render for country field', () => {
      render(<ProfileEditModal {...defaultProps} editingField="country" fieldValue="USA" />);

      expect(screen.getByText('Edit Country')).toBeInTheDocument();
      expect(screen.getByDisplayValue('USA')).toBeInTheDocument();
    });
  });

  describe('Help Text', () => {
    it('should show email-specific help text for email field', () => {
      render(<ProfileEditModal {...defaultProps} editingField="email" />);

      expect(screen.getByText(/enter a valid email address/i)).toBeInTheDocument();
    });

    it('should show generic help text for non-email fields', () => {
      render(<ProfileEditModal {...defaultProps} editingField="username" fieldValue="" />);

      expect(screen.getByText(/provide the updated value for this field/i)).toBeInTheDocument();
    });
  });

  describe('Focus Management', () => {
    it('should auto-focus input when modal opens', async () => {
      render(<ProfileEditModal {...defaultProps} />);

      await waitFor(() => {
        const input = screen.getByPlaceholderText(/enter email/i);
        expect(input).toHaveFocus();
      });
    });
  });

  describe('Modal Structure', () => {
    it('should have proper modal structure with backdrop', () => {
      const { container } = render(<ProfileEditModal {...defaultProps} />);

      const backdrop = container.querySelector('.fixed.bg-black\\/50.backdrop-blur-sm');
      expect(backdrop).toBeInTheDocument();
    });

    it('should have modal content centered', () => {
      const { container } = render(<ProfileEditModal {...defaultProps} />);

      const modalContent = container.querySelector('.fixed.inset-0.flex.items-center.justify-center');
      expect(modalContent).toBeInTheDocument();
    });

    it('should have close icon in header', () => {
      const { container } = render(<ProfileEditModal {...defaultProps} />);

      const closeIcon = container.querySelector('svg');
      expect(closeIcon).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should have required attribute on input', () => {
      render(<ProfileEditModal {...defaultProps} />);

      const input = screen.getByPlaceholderText(/enter email/i);
      expect(input).toBeRequired();
    });

    it('should prevent form submission when clicking cancel', () => {
      const onSubmit = jest.fn();
      render(<ProfileEditModal {...defaultProps} onSubmit={onSubmit} />);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty field value', () => {
      render(<ProfileEditModal {...defaultProps} fieldValue="" />);

      const input = screen.getByPlaceholderText(/enter email/i);
      expect(input).toHaveValue('');
    });

    it('should handle very long field values', () => {
      const longValue = 'a'.repeat(200);
      render(<ProfileEditModal {...defaultProps} fieldValue={longValue} />);

      const input = screen.getByPlaceholderText(/enter email/i);
      expect(input).toHaveValue(longValue);
    });

    it('should handle special characters in field value', () => {
      render(<ProfileEditModal {...defaultProps} fieldValue="test+alias@example.com" />);

      expect(screen.getByDisplayValue('test+alias@example.com')).toBeInTheDocument();
    });

    it('should handle field names without labels', () => {
      render(<ProfileEditModal {...defaultProps} editingField="unknown_field" fieldValue="test" />);

      expect(screen.getByText('Edit unknown_field')).toBeInTheDocument();
    });
  });

  describe('Multiple Errors', () => {
    it('should update error message dynamically', () => {
      const { rerender } = render(<ProfileEditModal {...defaultProps} formError="Error 1" />);

      expect(screen.getByText('Error 1')).toBeInTheDocument();

      rerender(<ProfileEditModal {...defaultProps} formError="Error 2" />);

      expect(screen.getByText('Error 2')).toBeInTheDocument();
      expect(screen.queryByText('Error 1')).not.toBeInTheDocument();
    });

    it('should clear error when set to null', () => {
      const { rerender } = render(<ProfileEditModal {...defaultProps} formError="Test error" />);

      expect(screen.getByText('Test error')).toBeInTheDocument();

      rerender(<ProfileEditModal {...defaultProps} formError={null} />);

      expect(screen.queryByText('Test error')).not.toBeInTheDocument();
    });
  });

  describe('Button Types', () => {
    it('should have submit type on save button', () => {
      render(<ProfileEditModal {...defaultProps} />);

      const saveButton = screen.getByRole('button', { name: /save/i });
      expect(saveButton).toHaveAttribute('type', 'submit');
    });

    it('should have button type on cancel button', () => {
      render(<ProfileEditModal {...defaultProps} />);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      expect(cancelButton).toHaveAttribute('type', 'button');
    });

    it('should have button type on close icon button', () => {
      render(<ProfileEditModal {...defaultProps} />);

      const closeButton = screen.getByLabelText(/close/i);
      expect(closeButton).toHaveAttribute('type', 'button');
    });
  });
});
