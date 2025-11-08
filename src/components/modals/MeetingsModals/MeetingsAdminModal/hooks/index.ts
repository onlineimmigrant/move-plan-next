/**
 * Admin Modal Hooks
 * 
 * Exports all custom hooks for the Admin Modal
 */

export { useAdminModalState } from './useAdminModalState';
export type { AdminModalState, AdminView } from './useAdminModalState';

export { useAdminBookings } from './useAdminBookings';
export type { UseAdminBookingsReturn } from './useAdminBookings';

export { useMeetingTypesData } from './useMeetingTypesData';
export type { UseMeetingTypesDataReturn, MeetingSettings } from './useMeetingTypesData';

export { useBookingForm } from './useBookingForm';
export type { UseBookingFormReturn } from './useBookingForm';
