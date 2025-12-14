'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useEmailModalStore } from './EmailModalManager';
import { EmailProvider } from './context/EmailContext';
import { 
  Inbox, 
  Send, 
  Megaphone, 
  FileText, 
  Settings,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useThemeColors } from '@/hooks/useThemeColors';
import { ModalContainer } from '@/components/modals/ShopModal/components/ModalContainer';
import EmailModalHeader from '@/components/modals/EmailModal/components/Shared/EmailModalHeader';
import { EmailErrorBoundary } from './components/EmailErrorBoundary';

// Tab components
import InboxView from '@/components/modals/EmailModal/components/InboxView/InboxView';
import TransactionalView from './components/TransactionalView/TransactionalView';
import MarketingView from './components/MarketingView';
import TemplatesView from './components/TemplatesView/TemplatesView';
import SettingsView from './components/SettingsView/SettingsView';

type EmailTab = 'inbox' | 'transactional' | 'marketing' | 'templates' | 'settings';

const tabs: { id: EmailTab; label: string; icon: React.ComponentType<any> }[] = [
  { id: 'inbox', label: 'Inbox', icon: Inbox },
  { id: 'transactional', label: 'Transactional', icon: Send },
  { id: 'marketing', label: 'Marketing', icon: Megaphone },
  { id: 'templates', label: 'Templates', icon: FileText },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function EmailModal() {
  const { isOpen, activeTab, setActiveTab, closeEmailModal } = useEmailModalStore();
  const themeColors = useThemeColors();
  const primary = themeColors.cssVars.primary;
  const [searchQuery, setSearchQuery] = useState('');
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [mobileActionButtons, setMobileActionButtons] = useState<React.ReactNode>(null);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);

  // Reset filters modal when tab changes
  React.useEffect(() => {
    setShowFiltersModal(false);
    setMobileActionButtons(null); // Clear action buttons when changing tabs
  }, [activeTab]);

  // Find portal container for action buttons - update when tab changes
  React.useEffect(() => {
    const containerId = activeTab === 'settings' 
      ? 'settings-mobile-actions-container' 
      : 'email-modal-actions-container';
    const container = document.getElementById(containerId);
    setPortalContainer(container);
  }, [activeTab]);

  if (!isOpen) return null;

  const handleOpenFilters = () => {
    setShowFiltersModal(true);
  };

  const handleCloseFilters = () => {
    setShowFiltersModal(false);
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'inbox':
        return (
          <InboxView
            globalSearchQuery={searchQuery}
            showFiltersModal={showFiltersModal}
            onCloseFilters={handleCloseFilters}
            primary={primary}
          />
        );
      case 'transactional':
        return <TransactionalView primary={primary} globalSearchQuery={searchQuery} onMobileActionsChange={setMobileActionButtons} />;
      case 'marketing':
        return <MarketingView primary={primary} globalSearchQuery={searchQuery} onMobileActionsChange={setMobileActionButtons} />;
      case 'templates':
        return <TemplatesView primary={primary} globalSearchQuery={searchQuery} onMobileActionsChange={setMobileActionButtons} />;
      case 'settings':
        return <SettingsView primary={primary} />;
      default:
        return <InboxView globalSearchQuery={searchQuery} primary={primary} />;
    }
  };

  return (
    <EmailProvider>
      {/* Portal action buttons to footer container */}
      {portalContainer && mobileActionButtons && createPortal(mobileActionButtons, portalContainer)}
      
      <ModalContainer isOpen={isOpen} onClose={closeEmailModal}>
        <EmailErrorBoundary onReset={() => setActiveTab('inbox')}>
          {/* Header - mirrors Shop/CRM header with advanced search */}
          <EmailModalHeader
          title="Email"
          subtitle={
            activeTab === 'inbox'
              ? 'Inbox'
              : activeTab === 'transactional'
              ? 'Transactional'
              : activeTab === 'marketing'
              ? 'Marketing'
              : activeTab === 'templates'
              ? 'Templates'
              : 'Settings'
          }
          primaryColor={primary.base}
          onClose={closeEmailModal}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchSuggestions={[
            'from:customer',
            'subject:invoice',
            'has:attachments',
            'status:unread',
          ]}
        />

        {/* Tab Navigation - gradient styling like Shop */}
        <div className="px-6 py-3 border-b border-slate-200/50 bg-transparent">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full font-medium text-sm transition-all duration-200 whitespace-nowrap shadow-sm"
                  style={
                    isActive
                      ? {
                          background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`,
                          color: 'white',
                          boxShadow: `0 4px 12px ${primary.base}40`,
                        }
                      : {
                          backgroundColor: 'transparent',
                          color: primary.base,
                          border: '1px solid',
                          borderColor: `${primary.base}40`,
                        }
                  }
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className={`flex-1 overflow-auto bg-white/10 dark:bg-gray-800/10 ${activeTab === 'settings' ? 'pb-16' : 'pb-24'}`}>
          {renderActiveTab()}
        </div>

        {/* Bottom Toolbar - Fixed with Rounded Bottom (Shop/CRM Style) */}
        <div className="fixed bottom-0 left-0 right-0 border-t border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-b-2xl z-10">
          {/* Main Controls Row */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between px-5 py-3 gap-3">
            {activeTab === 'inbox' ? (
              /* Filters Button for Inbox tab */
              <div className="flex flex-col sm:flex-row gap-2 md:flex-1">
                <button
                  onClick={handleOpenFilters}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 shadow-sm border w-full sm:w-auto"
                  style={{ 
                    color: showFiltersModal ? 'white' : primary.base,
                    background: showFiltersModal 
                      ? `linear-gradient(135deg, ${primary.base}, ${primary.hover})` 
                      : 'white',
                    borderColor: showFiltersModal ? primary.base : '#e5e7eb',
                  }}
                >
                  <SlidersHorizontal className="h-5 w-5" />
                  <span>Filters</span>
                  {showFiltersModal ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </button>
              </div>
            ) : (
              /* Settings/Templates/Marketing/Transactional Action Buttons */
              <div className="w-full" id={activeTab === 'settings' ? 'settings-mobile-actions-container' : 'email-modal-actions-container'} />
            )}
          </div>
        </div>
      </EmailErrorBoundary>
      </ModalContainer>
    </EmailProvider>
  );
}
