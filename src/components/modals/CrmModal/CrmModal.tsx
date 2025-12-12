/**
 * CrmModal - Main Component
 *
 * Modern CRM management modal with glass morphism design
 * Manages Accounts, Customers, Leads, Team Members, Reviews, Testimonials
 *
 * Features:
 * - Tab-based navigation for different CRM entities
 * - CRUD operations for all CRM data
 * - Real-time updates
 * - Responsive design (mobile fullscreen, desktop draggable)
 * - Accessibility compliant
 * - Glass morphism styling
 */

'use client';

import React, { useState, useCallback, lazy, Suspense, useTransition, useRef } from 'react';
import { useThemeColors } from '@/hooks/useThemeColors';
import { CrmModalProps, CrmTab } from './types';
import { ModalContainer, ModalHeader, MainTabNavigation, LoadingState } from './components';
import { CrmProvider } from './context/CrmContext';

// Lazy load heavy tab components
const AccountsView = lazy(() => import('./components/AccountsView'));
const CustomersView = lazy(() => import('./components/CustomersView'));
const LeadsView = lazy(() => import('./components/LeadsView'));
const TeamMembersView = lazy(() => import('./components/TeamMembersView'));
const ReviewsView = lazy(() => import('./components/ReviewsView'));
const TestimonialsView = lazy(() => import('./components/TestimonialsView'));

export default function CrmModal({
  isOpen,
  onClose,
  initialTab = 'accounts',
  organizationId
}: CrmModalProps) {
  const [activeTab, setActiveTab] = useState<CrmTab>(initialTab);
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const themeColors = useThemeColors();
  
  // Track which tabs have loaded data to enable smart caching
  const loadedTabsRef = useRef<Set<CrmTab>>(new Set());

  const handleTabChange = useCallback((tab: CrmTab) => {
    startTransition(() => {
      setActiveTab(tab);
      setSearchQuery(''); // Clear search when switching tabs
    });
  }, []);

  const renderActiveTab = () => {
    const primaryColors = { base: themeColors.cssVars.primary.base, hover: themeColors.cssVars.primary.hover };
    
    switch (activeTab) {
      case 'accounts':
        return <AccountsView organizationId={organizationId} searchQuery={searchQuery} />;
      case 'customers':
        return <CustomersView organizationId={organizationId} />;
      case 'leads':
        return <LeadsView organizationId={organizationId} primary={primaryColors} searchQuery={searchQuery} />;
      case 'team-members':
        return <TeamMembersView organizationId={organizationId} searchQuery={searchQuery} />;
      case 'reviews':
        return <ReviewsView organizationId={organizationId} primary={primaryColors} searchQuery={searchQuery} />;
      case 'testimonials':
        return <TestimonialsView organizationId={organizationId} primary={primaryColors} searchQuery={searchQuery} />;
      default:
        return <AccountsView organizationId={organizationId} searchQuery={searchQuery} />;
    }
  };

  if (!isOpen) return null;

  return (
    <CrmProvider>
      <ModalContainer isOpen={isOpen} onClose={onClose}>
        {/* Header */}
        <ModalHeader
          title="CRM"
          primaryColor={themeColors.cssVars.primary.base}
          onClose={onClose}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchSuggestions={searchSuggestions}
        />

        {/* Tab Navigation */}
        <MainTabNavigation
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <Suspense fallback={<LoadingState />}>
            {renderActiveTab()}
          </Suspense>
        </div>
      </ModalContainer>
    </CrmProvider>
  );
}