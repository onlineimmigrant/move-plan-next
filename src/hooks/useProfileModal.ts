import { useState, useCallback } from 'react';

/**
 * Custom hook for managing modal state in profile edit scenarios
 * Handles opening/closing modal, field editing, form validation, and submission state
 */
export function useProfileModal() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [fieldValue, setFieldValue] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openModal = useCallback((field: string, value: string | null) => {
    setEditingField(field);
    setFieldValue(value || '');
    setIsModalOpen(true);
    setFormError(null);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingField(null);
    setFieldValue('');
    setFormError(null);
    setIsSubmitting(false);
  }, []);

  return {
    isModalOpen,
    editingField,
    fieldValue,
    setFieldValue,
    formError,
    setFormError,
    isSubmitting,
    setIsSubmitting,
    openModal,
    closeModal,
  };
}
