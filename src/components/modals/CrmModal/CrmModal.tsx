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

import React, { useState, useCallback, lazy, Suspense } from 'react';
import { X } from 'lucide-react';
import { useThemeColors } from '@/hooks/useThemeColors';
import { CrmModalProps, CrmTab } from './types';
import { MainTabNavigation } from './components/MainTabNavigation';
import { ModalContainer } from './components/ModalContainer';
import { LoadingState } from './components/LoadingState';

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
  const themeColors = useThemeColors();

  const handleTabChange = useCallback((tab: CrmTab) => {
    setActiveTab(tab);
  }, []);

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'accounts':
        return <AccountsView organizationId={organizationId} />;
      case 'customers':
        return <CustomersView organizationId={organizationId} />;
      case 'leads':
        return <LeadsView organizationId={organizationId} />;
      case 'team-members':
        return <TeamMembersView organizationId={organizationId} />;
      case 'reviews':
        return <ReviewsView organizationId={organizationId} />;
      case 'testimonials':
        return <TestimonialsView organizationId={organizationId} />;
      default:
        return <AccountsView organizationId={organizationId} />;
    }
  };

  if (!isOpen) return null;

  return (
    <ModalContainer onClose={onClose}>
      {/* Header */}
      <div
        className="flex items-center justify-between p-6 border-b border-white/30"
        style={{
          background: `linear-gradient(135deg, ${themeColors.cssVars.primary.base}10, ${themeColors.cssVars.primary.hover}05)`,
          backdropFilter: 'blur(20px)',
        }}
      >
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            CRM Management
          </h2>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-white/20 dark:hover:bg-gray-800/50 transition-colors"
        >
          <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
        </button>
      </div>

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
  );
}