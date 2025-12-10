/**
 * useOpenCrmModal Hook
 * 
 * Helper hook to open the CRM modal from anywhere in the app
 * Encapsulates the CRM modal opening logic
 */

import { useCrmModal } from '../context';
import { CrmTab } from '../types';

export function useOpenCrmModal() {
  const { openModal } = useCrmModal();

  return {
    openCrmModal: (tab?: CrmTab) => openModal(tab),
    openAccounts: () => openModal('accounts'),
    openCustomers: () => openModal('customers'),
    openLeads: () => openModal('leads'),
    openTeamMembers: () => openModal('team-members'),
    openReviews: () => openModal('reviews'),
    openTestimonials: () => openModal('testimonials'),
  };
}
