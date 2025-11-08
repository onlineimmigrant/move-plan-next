/**
 * useBookingForm Hook
 * 
 * Manages booking form state and slot loading:
 * - Form data state
 * - Available time slots
 * - Slot loading logic
 * 
 * @example
 * ```tsx
 * const {
 *   bookingFormData,
 *   availableSlots,
 *   loadingSlots,
 *   handleFormChange,
 *   loadAvailableSlots,
 *   resetForm
 * } = useBookingForm(organizationId);
 * ```
 */

import { useState, useCallback } from 'react';
import { BookingFormData, TimeSlot } from '../../shared/types';

export interface UseBookingFormReturn {
  bookingFormData: Partial<BookingFormData>;
  setBookingFormData: (data: Partial<BookingFormData>) => void;
  availableSlots: TimeSlot[];
  setAvailableSlots: (slots: TimeSlot[]) => void;
  loadingSlots: boolean;
  setLoadingSlots: (loading: boolean) => void;
  handleFormChange: (data: Partial<BookingFormData>) => void;
  loadAvailableSlots: (date: Date, organizationId: string) => Promise<void>;
  resetForm: () => void;
}

/**
 * Custom hook to manage booking form state
 */
export function useBookingForm(): UseBookingFormReturn {
  const [bookingFormData, setBookingFormData] = useState<Partial<BookingFormData>>({});
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Handle form data changes
  const handleFormChange = useCallback((data: Partial<BookingFormData>) => {
    setBookingFormData(prev => ({ ...prev, ...data }));
  }, []);

  // Load available time slots for a given date
  const loadAvailableSlots = useCallback(async (date: Date, organizationId: string) => {
    if (!organizationId) return;

    try {
      setLoadingSlots(true);
      const now = new Date();
      
      // Don't load slots for dates in the past
      if (date < new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
        setAvailableSlots([]);
        return;
      }

      // Format date as YYYY-MM-DD in LOCAL timezone (not UTC)
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;

      // Fetch available slots from API (admins get 24-hour access if enabled)
      const response = await fetch(
        `/api/meetings/available-slots?organization_id=${organizationId}&date=${formattedDate}&is_admin=true`,
        {
          headers: {
            'Cache-Control': 'max-age=60', // Cache for 1 minute
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch available slots');
      }

      const data = await response.json();
      
      // Convert ISO string dates back to Date objects and filter past times
      const slots: TimeSlot[] = data.slots
        .map((slot: { 
          start: string; 
          end: string; 
          available: boolean;
          is_business_hours?: boolean;
          isBusinessHours?: boolean;
        }) => ({
          start: new Date(slot.start),
          end: new Date(slot.end),
          available: slot.available,
          isBusinessHours: slot.isBusinessHours ?? slot.is_business_hours ?? false,
        }))
        .filter((slot: TimeSlot) => {
          // Filter out past time slots
          return slot.start.getTime() >= now.getTime();
        });

      setAvailableSlots(slots);
    } catch (err) {
      console.error('Error loading slots:', err);
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }, []);

  // Reset form to initial state
  const resetForm = useCallback(() => {
    setBookingFormData({});
    setAvailableSlots([]);
    setLoadingSlots(false);
  }, []);

  return {
    bookingFormData,
    setBookingFormData,
    availableSlots,
    setAvailableSlots,
    loadingSlots,
    setLoadingSlots,
    handleFormChange,
    loadAvailableSlots,
    resetForm,
  };
}
