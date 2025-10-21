import { useState, useCallback } from 'react';
import { BookingFormData, TimeSlot } from '../types';

/**
 * Custom hook for managing booking form state
 * Handles form data, validation, and submission state
 */
export const useBookingState = (initialData: Partial<BookingFormData> = {}) => {
  const [formData, setFormData] = useState<Partial<BookingFormData>>(initialData);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateFormData = useCallback((updates: Partial<BookingFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
    // Clear errors for updated fields
    const updatedFields = Object.keys(updates);
    setErrors(prev => {
      const newErrors = { ...prev };
      updatedFields.forEach(field => delete newErrors[field]);
      return newErrors;
    });
  }, []);

  const resetForm = useCallback((preserveData?: Partial<BookingFormData>) => {
    setFormData(preserveData || {});
    setSelectedSlot(null);
    setAvailableSlots([]);
    setErrors({});
    setIsSubmitting(false);
  }, []);

  const setFormErrors = useCallback((fieldErrors: Record<string, string>) => {
    setErrors(fieldErrors);
  }, []);

  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.customer_name?.trim()) {
      newErrors.customer_name = 'Name is required';
    }

    if (!formData.customer_email?.trim()) {
      newErrors.customer_email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customer_email)) {
      newErrors.customer_email = 'Please enter a valid email address';
    }

    if (!formData.meeting_type_id) {
      newErrors.meeting_type_id = 'Please select a meeting type';
    }

    if (!selectedSlot) {
      newErrors.scheduled_at = 'Please select a time slot';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, selectedSlot]);

  return {
    formData,
    availableSlots,
    selectedSlot,
    isSubmitting,
    errors,
    updateFormData,
    setAvailableSlots,
    setSelectedSlot,
    setIsSubmitting,
    resetForm,
    setFormErrors,
    validateForm,
  };
};