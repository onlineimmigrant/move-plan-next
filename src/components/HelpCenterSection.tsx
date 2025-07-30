'use client';

import React, { useState } from 'react';
import WelcomeTab from './ChatHelpWidget/WelcomeTab';
import AIAgentTab from './ChatHelpWidget/AIAgentTab';
import { WidgetSize } from './ChatWidget/types';
import { useAuth } from '@/context/AuthContext';
import { useHelpCenterTranslations } from './ChatHelpWidget/useHelpCenterTranslations';

// Types - simplified to match TemplateSectionData
interface HelpCenterSectionData {
  id: number;
  section_title: string;
  section_title_translation?: Record<string, string>;
  section_description?: string;
  section_description_translation?: Record<string, string>;
  text_style_variant?: 'default' | 'apple';
  background_color?: string;
  is_full_width: boolean;
  is_section_title_aligned_center: boolean;
  is_section_title_aligned_right: boolean;
  is_help_center_section?: boolean;
  organization_id: string | null;
}

interface HelpCenterSectionProps {
  section: HelpCenterSectionData;
}

type TabType = 'welcome' | 'ai';

const HelpCenterSection: React.FC<HelpCenterSectionProps> = ({ section }) => {
  // Early return to avoid null/undefined issues
  if (!section || !section.is_help_center_section) {
    return null;
  }

  const [activeTab, setActiveTab] = useState<TabType>('welcome');
  const { session, isLoading } = useAuth();
  const { t } = useHelpCenterTranslations();

  // Handler functions for tab navigation
  const handleTabChange = (tab: 'welcome' | 'conversation' | 'ai') => {
    if (tab === 'ai') {
      setActiveTab('ai');
    } else {
      // For other tabs, navigate to full help center page
      window.location.href = `/help-center?tab=${tab}`;
    }
  };

  const handleShowFAQ = () => {
    window.location.href = '/help-center?tab=faq';
  };

  const handleShowKnowledgeBase = () => {
    window.location.href = '/help-center?tab=articles';
  };

  const handleShowLiveSupport = () => {
    window.location.href = '/help-center?tab=conversation';
  };

  const handleGoToLogin = () => {
    window.location.href = '/login';
  };

  const handleGoToRegister = () => {
    window.location.href = '/register';
  };

  const handleSwitchToChatWidget = (forceFullscreen?: boolean) => {
    // Navigate to help center with AI tab and chat widget active
    window.location.href = '/help-center?tab=ai&chat=true';
  };

  return (
    <section
      className={`px-4 py-16 ${section.background_color ? `bg-${section.background_color}` : 'bg-white'}`}
    >
      <div className={`${section.is_full_width ? 'w-full' : 'max-w-7xl'} mx-auto`}>
        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-gray-100 p-1 rounded-lg flex space-x-1">
            <button
              onClick={() => setActiveTab('welcome')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                activeTab === 'welcome'
                  ? 'bg-white text-sky-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {t.helpCenter}
            </button>
            <button
              onClick={() => setActiveTab('ai')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                activeTab === 'ai'
                  ? 'bg-white text-sky-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {t.aiAssistant}
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="min-h-[500px]">
          {activeTab === 'welcome' ? (
            <WelcomeTab
              onTabChange={handleTabChange}
              size="fullscreen"
              onShowFAQ={handleShowFAQ}
              onShowKnowledgeBase={handleShowKnowledgeBase}
              onShowLiveSupport={handleShowLiveSupport}
            />
          ) : (
            <AIAgentTab
              isAuthenticated={!!session && !isLoading}
              userId={session?.user?.id || null}
              accessToken={session?.access_token || null}
              size="fullscreen"
              goToLogin={handleGoToLogin}
              goToRegister={handleGoToRegister}
              onSwitchToChatWidget={handleSwitchToChatWidget}
            />
          )}
        </div>
      </div>
    </section>
  );
};

export default HelpCenterSection;
