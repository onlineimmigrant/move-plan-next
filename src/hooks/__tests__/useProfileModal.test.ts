import { renderHook, act } from '@testing-library/react';
import { useProfileModal } from '../useProfileModal';

describe('useProfileModal', () => {
  describe('Initial State', () => {
    it('should initialize with modal closed and empty values', () => {
      const { result } = renderHook(() => useProfileModal());

      expect(result.current.isModalOpen).toBe(false);
      expect(result.current.editingField).toBeNull();
      expect(result.current.fieldValue).toBe('');
      expect(result.current.formError).toBeNull();
      expect(result.current.isSubmitting).toBe(false);
    });
  });

  describe('openModal', () => {
    it('should open modal with field and value', () => {
      const { result } = renderHook(() => useProfileModal());

      act(() => {
        result.current.openModal('email', 'test@example.com');
      });

      expect(result.current.isModalOpen).toBe(true);
      expect(result.current.editingField).toBe('email');
      expect(result.current.fieldValue).toBe('test@example.com');
      expect(result.current.formError).toBeNull();
    });

    it('should handle null value by setting empty string', () => {
      const { result } = renderHook(() => useProfileModal());

      act(() => {
        result.current.openModal('city', null);
      });

      expect(result.current.isModalOpen).toBe(true);
      expect(result.current.editingField).toBe('city');
      expect(result.current.fieldValue).toBe('');
    });

    it('should clear previous form errors when opening', () => {
      const { result } = renderHook(() => useProfileModal());

      // Set a form error first
      act(() => {
        result.current.setFormError('Previous error');
      });

      expect(result.current.formError).toBe('Previous error');

      // Open modal should clear error
      act(() => {
        result.current.openModal('username', 'testuser');
      });

      expect(result.current.formError).toBeNull();
    });
  });

  describe('closeModal', () => {
    it('should reset all modal state when closing', () => {
      const { result } = renderHook(() => useProfileModal());

      // Open modal with some state
      act(() => {
        result.current.openModal('full_name', 'John Doe');
        result.current.setFormError('Test error');
        result.current.setIsSubmitting(true);
      });

      // Close modal
      act(() => {
        result.current.closeModal();
      });

      expect(result.current.isModalOpen).toBe(false);
      expect(result.current.editingField).toBeNull();
      expect(result.current.fieldValue).toBe('');
      expect(result.current.formError).toBeNull();
      expect(result.current.isSubmitting).toBe(false);
    });
  });

  describe('setFieldValue', () => {
    it('should update field value', () => {
      const { result } = renderHook(() => useProfileModal());

      act(() => {
        result.current.openModal('email', 'old@example.com');
      });

      act(() => {
        result.current.setFieldValue('new@example.com');
      });

      expect(result.current.fieldValue).toBe('new@example.com');
    });

    it('should allow clearing field value', () => {
      const { result } = renderHook(() => useProfileModal());

      act(() => {
        result.current.openModal('postal_code', '12345');
      });

      act(() => {
        result.current.setFieldValue('');
      });

      expect(result.current.fieldValue).toBe('');
    });
  });

  describe('setFormError', () => {
    it('should set form error message', () => {
      const { result } = renderHook(() => useProfileModal());

      act(() => {
        result.current.setFormError('Invalid email format');
      });

      expect(result.current.formError).toBe('Invalid email format');
    });

    it('should allow clearing form error', () => {
      const { result } = renderHook(() => useProfileModal());

      act(() => {
        result.current.setFormError('Error message');
      });

      expect(result.current.formError).toBe('Error message');

      act(() => {
        result.current.setFormError(null);
      });

      expect(result.current.formError).toBeNull();
    });
  });

  describe('setIsSubmitting', () => {
    it('should set submitting state to true', () => {
      const { result } = renderHook(() => useProfileModal());

      act(() => {
        result.current.setIsSubmitting(true);
      });

      expect(result.current.isSubmitting).toBe(true);
    });

    it('should set submitting state to false', () => {
      const { result } = renderHook(() => useProfileModal());

      act(() => {
        result.current.setIsSubmitting(true);
      });

      act(() => {
        result.current.setIsSubmitting(false);
      });

      expect(result.current.isSubmitting).toBe(false);
    });
  });

  describe('Complete Workflow', () => {
    it('should handle complete edit workflow', () => {
      const { result } = renderHook(() => useProfileModal());

      // Start: modal closed
      expect(result.current.isModalOpen).toBe(false);

      // User clicks edit button
      act(() => {
        result.current.openModal('email', 'current@example.com');
      });

      expect(result.current.isModalOpen).toBe(true);
      expect(result.current.editingField).toBe('email');
      expect(result.current.fieldValue).toBe('current@example.com');

      // User types new value
      act(() => {
        result.current.setFieldValue('new@example.com');
      });

      expect(result.current.fieldValue).toBe('new@example.com');

      // Validation error occurs
      act(() => {
        result.current.setFormError('Email already exists');
      });

      expect(result.current.formError).toBe('Email already exists');

      // User fixes error and submits
      act(() => {
        result.current.setFieldValue('another@example.com');
        result.current.setFormError(null);
        result.current.setIsSubmitting(true);
      });

      expect(result.current.isSubmitting).toBe(true);
      expect(result.current.formError).toBeNull();

      // Submission completes, modal closes
      act(() => {
        result.current.closeModal();
      });

      expect(result.current.isModalOpen).toBe(false);
      expect(result.current.editingField).toBeNull();
      expect(result.current.fieldValue).toBe('');
      expect(result.current.isSubmitting).toBe(false);
    });

    it('should handle cancel workflow', () => {
      const { result } = renderHook(() => useProfileModal());

      // User opens modal and makes changes
      act(() => {
        result.current.openModal('username', 'olduser');
        result.current.setFieldValue('newuser');
      });

      expect(result.current.fieldValue).toBe('newuser');

      // User cancels (closes without submitting)
      act(() => {
        result.current.closeModal();
      });

      // All state should be reset
      expect(result.current.isModalOpen).toBe(false);
      expect(result.current.editingField).toBeNull();
      expect(result.current.fieldValue).toBe('');
    });
  });

  describe('Multiple Field Edits', () => {
    it('should handle editing different fields sequentially', () => {
      const { result } = renderHook(() => useProfileModal());

      // Edit email
      act(() => {
        result.current.openModal('email', 'email@test.com');
      });

      expect(result.current.editingField).toBe('email');
      expect(result.current.fieldValue).toBe('email@test.com');

      act(() => {
        result.current.closeModal();
      });

      // Edit username
      act(() => {
        result.current.openModal('username', 'testuser');
      });

      expect(result.current.editingField).toBe('username');
      expect(result.current.fieldValue).toBe('testuser');
      expect(result.current.formError).toBeNull(); // Previous errors cleared
    });
  });

  describe('Edge Cases', () => {
    it('should handle opening modal multiple times without closing', () => {
      const { result } = renderHook(() => useProfileModal());

      act(() => {
        result.current.openModal('email', 'first@example.com');
      });

      // Open again with different field
      act(() => {
        result.current.openModal('username', 'testuser');
      });

      expect(result.current.editingField).toBe('username');
      expect(result.current.fieldValue).toBe('testuser');
    });

    it('should handle empty string field names', () => {
      const { result } = renderHook(() => useProfileModal());

      act(() => {
        result.current.openModal('', 'value');
      });

      expect(result.current.editingField).toBe('');
      expect(result.current.fieldValue).toBe('value');
    });
  });

  describe('Callback Stability', () => {
    it('should maintain stable callback references', () => {
      const { result, rerender } = renderHook(() => useProfileModal());

      const firstOpenModal = result.current.openModal;
      const firstCloseModal = result.current.closeModal;

      rerender();

      expect(result.current.openModal).toBe(firstOpenModal);
      expect(result.current.closeModal).toBe(firstCloseModal);
    });
  });
});
