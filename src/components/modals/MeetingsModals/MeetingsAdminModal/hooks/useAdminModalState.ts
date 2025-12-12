/**
 * useAdminModalState Hook
 * 
 * Manages the state for the Admin Modal including:
 * - Current view state (calendar/booking/manage-bookings)
 * - Loading and error states
 * - Modal visibility states for child modals
 * - UI interaction states (hover, 24-hour format)
 * - Active booking count
 * 
 * @example
 * ```tsx
 * const {
 *   currentView,
 *   setCurrentView,
 *   loading,
 *   error,
 *   showSettingsModal,
 *   toggleSettingsModal
 * } = useAdminModalState();
 * ```
 */

import { useState, useCallback } from 'react';

export type AdminView = 'calendar' | 'booking' | 'manage-bookings';

export interface AdminModalState {
  // View state
  currentView: AdminView;
  setCurrentView: (view: AdminView) => void;
  
  // Loading states
  loading: boolean;
  setLoading: (loading: boolean) => void;
  loadingSlots: boolean;
  setLoadingSlots: (loading: boolean) => void;
  submitting: boolean;
  setSubmitting: (submitting: boolean) => void;
  loadingEventDetails: boolean;
  setLoadingEventDetails: (loading: boolean) => void;
  
  // Error state
  error: string | null;
  setError: (error: string | null) => void;
  
  // Child modal states
  showSettingsModal: boolean;
  toggleSettingsModal: () => void;
  showTypesModal: boolean;
  toggleTypesModal: () => void;
  showInstantMeetingModal: boolean;
  toggleInstantMeetingModal: () => void;
  showEventDetailsModal: boolean;
  toggleEventDetailsModal: () => void;
  
  // UI states
  use24Hour: boolean;
  setUse24Hour: (use24Hour: boolean) => void;
  hoveredTab: string | null;
  setHoveredTab: (tab: string | null) => void;
  
  // Event state
  selectedEvent: any | null;
  setSelectedEvent: (event: any | null) => void;
  
  // Reset function
  resetState: () => void;
}

/**
 * Custom hook to manage admin modal state
 */
export function useAdminModalState(): AdminModalState {
  // View state
  const [currentView, setCurrentView] = useState<AdminView>('calendar');
  
  // Loading states - Initialize as false for instant UI render
  const [loading, setLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingEventDetails, setLoadingEventDetails] = useState(false);
  
  // Error state
  const [error, setError] = useState<string | null>(null);
  
  // Child modal states
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showTypesModal, setShowTypesModal] = useState(false);
  const [showInstantMeetingModal, setShowInstantMeetingModal] = useState(false);
  const [showEventDetailsModal, setShowEventDetailsModal] = useState(false);
  
  // UI states
  const [use24Hour, setUse24Hour] = useState<boolean>(true);
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);
  
  // Event state
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  
  // Toggle functions
  const toggleSettingsModal = useCallback(() => {
    setShowSettingsModal(prev => !prev);
  }, []);
  
  const toggleTypesModal = useCallback(() => {
    setShowTypesModal(prev => !prev);
  }, []);
  
  const toggleInstantMeetingModal = useCallback(() => {
    setShowInstantMeetingModal(prev => !prev);
  }, []);
  
  const toggleEventDetailsModal = useCallback(() => {
    setShowEventDetailsModal(prev => !prev);
  }, []);
  
  // Reset state when modal closes
  const resetState = useCallback(() => {
    setCurrentView('calendar');
    setError(null);
    setSelectedEvent(null);
    setShowSettingsModal(false);
    setShowTypesModal(false);
    setShowInstantMeetingModal(false);
    setShowEventDetailsModal(false);
  }, []);
  
  return {
    // View state
    currentView,
    setCurrentView,
    
    // Loading states
    loading,
    setLoading,
    loadingSlots,
    setLoadingSlots,
    submitting,
    setSubmitting,
    loadingEventDetails,
    setLoadingEventDetails,
    
    // Error state
    error,
    setError,
    
    // Child modal states
    showSettingsModal,
    toggleSettingsModal,
    showTypesModal,
    toggleTypesModal,
    showInstantMeetingModal,
    toggleInstantMeetingModal,
    showEventDetailsModal,
    toggleEventDetailsModal,
    
    // UI states
    use24Hour,
    setUse24Hour,
    hoveredTab,
    setHoveredTab,
    
    // Event state
    selectedEvent,
    setSelectedEvent,
    
    // Reset function
    resetState,
  };
}
