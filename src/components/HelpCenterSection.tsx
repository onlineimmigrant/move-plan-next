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
      className={`px-4 py-20 ${section.background_color ? `bg-${section.background_color}` : 'bg-gradient-to-b from-gray-50/50 to-white'}`}
    >
      <div className={`${section.is_full_width ? 'w-full' : 'max-w-7xl'} mx-auto`}>
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-[32px] font-bold text-gray-900 mb-4 tracking-[-0.02em] antialiased">
            {section.section_title || 'Help Center'}
          </h2>
          {section.section_description && (
            <p className="text-[18px] text-gray-600 antialiased max-w-2xl mx-auto leading-relaxed">
              {section.section_description}
            </p>
          )}
        </div>

        {/* Apple-style Tab Navigation */}
        <div className="flex justify-center mb-12">
          <div className="relative bg-white/80 backdrop-blur-2xl p-1.5 rounded-2xl border border-gray-200/50 shadow-lg">
            {/* Background slider */}
            <div 
              className={`absolute top-1.5 h-[calc(100%-12px)] bg-white rounded-xl shadow-sm transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                activeTab === 'welcome' ? 'left-1.5 w-[calc(50%-6px)]' : 'left-[calc(50%+1.5px)] w-[calc(50%-6px)]'
              }`}
            />
            
            <div className="relative flex">
              <button
                onClick={() => setActiveTab('welcome')}
                className={`relative px-8 py-3 rounded-xl text-[15px] font-medium transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] antialiased tracking-[-0.01em] min-w-[140px] ${
                  activeTab === 'welcome'
                    ? 'text-gray-900 shadow-none'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {t.helpCenter}
              </button>
              <button
                onClick={() => setActiveTab('ai')}
                className={`relative px-8 py-3 rounded-xl text-[15px] font-medium transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] antialiased tracking-[-0.01em] min-w-[140px] ${
                  activeTab === 'ai'
                    ? 'text-gray-900 shadow-none'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {t.aiAssistant}
              </button>
            </div>
          </div>
        </div>

        {/* Apple-style Tab Content Container */}
        <div className="relative">
          {/* Content background with glass effect */}
          <div className="absolute inset-0 bg-white/60 backdrop-blur-3xl border border-gray-200/30 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.08)]"
            style={{
              backdropFilter: 'blur(24px) saturate(200%) brightness(105%)',
              WebkitBackdropFilter: 'blur(24px) saturate(200%) brightness(105%)',
            }}
          />
          
          {/* Subtle top highlight */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent rounded-t-3xl" />
          
          {/* Inner glow for depth */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-transparent rounded-3xl pointer-events-none" />
          
          {/* Tab Content */}
          <div className="relative min-h-[500px] p-2 lg:p-12">
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
          
          {/* Bottom accent */}
          <div className="absolute inset-x-8 bottom-0 h-px bg-gradient-to-r from-transparent via-gray-200/60 to-transparent rounded-b-3xl" />
        </div>
      </div>
    </section>
  );
};

export default HelpCenterSection;
