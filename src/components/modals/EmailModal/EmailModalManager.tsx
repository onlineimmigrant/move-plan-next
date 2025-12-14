import { create } from 'zustand';

interface EmailModalState {
  isOpen: boolean;
  activeTab: 'inbox' | 'transactional' | 'marketing' | 'templates' | 'settings';
  selectedThreadId: string | null;
  selectedCampaignId: string | null;
  openEmailModal: (tab?: EmailModalState['activeTab']) => void;
  closeEmailModal: () => void;
  setActiveTab: (tab: EmailModalState['activeTab']) => void;
  setSelectedThread: (threadId: string | null) => void;
  setSelectedCampaign: (campaignId: string | null) => void;
}

export const useEmailModalStore = create<EmailModalState>((set) => ({
  isOpen: false,
  activeTab: 'inbox',
  selectedThreadId: null,
  selectedCampaignId: null,
  
  openEmailModal: (tab = 'inbox') => 
    set({ isOpen: true, activeTab: tab }),
  
  closeEmailModal: () => 
    set({ 
      isOpen: false, 
      selectedThreadId: null,
      selectedCampaignId: null 
    }),
  
  setActiveTab: (tab) => 
    set({ activeTab: tab }),
  
  setSelectedThread: (threadId) => 
    set({ selectedThreadId: threadId }),
  
  setSelectedCampaign: (campaignId) => 
    set({ selectedCampaignId: campaignId }),
}));
