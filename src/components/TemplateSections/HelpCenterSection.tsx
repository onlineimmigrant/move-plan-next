'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import WelcomeTab from '@/components/modals/ChatHelpWidget/WelcomeTab';
import AIAgentTab from '@/components/modals/ChatHelpWidget/AIAgentTab';
import ConversationTab from '@/components/modals/ChatHelpWidget/ConversationTab';
import ChatHelpTabs from '@/components/modals/ChatHelpWidget/ChatHelpTabs';
import { WidgetSize } from '@/components/modals/ChatWidget/types';
import { useAuth } from '@/context/AuthContext';
import { useHelpCenterTranslations } from '@/components/modals/ChatHelpWidget/useHelpCenterTranslations';

// Types - simplified to match TemplateSectionData
interface HelpCenterSectionData {
  id: number;
  section_title: string;
  section_title_translation?: Record<string, string>;
  section_description?: string;
  section_description_translation?: Record<string, string>;
  text_style_variant?: 'default' | 'apple' | 'codedharmony';
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

type TabType = 'welcome' | 'conversation' | 'ai';

const HelpCenterSection: React.FC<HelpCenterSectionProps> = ({ section }) => {
  // Early return to avoid null/undefined issues
  if (!section || !section.is_help_center_section) {
    return null;
  }

  const [activeTab, setActiveTab] = useState<TabType>('welcome');
  const { session, isLoading } = useAuth();
  const { t } = useHelpCenterTranslations();
  const router = useRouter();
  const sectionRef = useRef<HTMLDivElement>(null);
  const tabNavRef = useRef<HTMLDivElement>(null);

  // Scroll to position tab nav below header when switching to conversation or ai tabs
  useEffect(() => {
    if (activeTab === 'conversation' || activeTab === 'ai') {
      if (tabNavRef.current) {
        const headerHeight = 80; // Height of the header from HelpCenterContainer
        const tabNavTop = tabNavRef.current.getBoundingClientRect().top + window.scrollY;
        const scrollToPosition = tabNavTop - headerHeight;
        
        window.scrollTo({
          top: scrollToPosition,
          behavior: 'smooth'
        });
      }
    }
  }, [activeTab]);

  // Handler functions for tab navigation
  const handleTabChange = (tab: 'welcome' | 'conversation' | 'ai') => {
    // Keep user in the same section, just switch tabs internally
    setActiveTab(tab);
  };

  const handleShowFAQ = () => {
    router.push('/help-center?tab=faq');
  };

  const handleShowKnowledgeBase = () => {
    router.push('/help-center?tab=articles');
  };

  const handleShowLiveSupport = () => {
    // Stay in section but switch to conversation tab
    setActiveTab('conversation');
  };

  const handleGoToLogin = () => {
    router.push('/login');
  };

  const handleGoToRegister = () => {
    router.push('/register');
  };

  const handleSwitchToChatWidget = (forceFullscreen?: boolean) => {
    // Stay in section, switch to conversation tab for chat
    setActiveTab('conversation');
  };

  return (
    <section
      ref={sectionRef}
      className={`sm:px-4 py-8 relative ${section.background_color ? `bg-${section.background_color}` : 'bg-gradient-to-br from-blue-50/30 via-purple-50/20 to-pink-50/30'}`}
    >
      {/* Glassmorphism overlay */}
      <div className="absolute inset-0 bg-white/40 backdrop-blur-sm"></div>
      
      <div className={`${section.is_full_width ? 'w-full' : 'max-w-7xl'} mx-auto relative z-10`}>
        {/* Section Header */}
        <div className="text-center mb-3 sm:mb-6 md:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-3 tracking-[-0.02em] antialiased">
            {section.section_title || 'Help Center'}
          </h2>
          <p className="text-base sm:text-[18px] text-gray-600 antialiased max-w-2xl mx-auto leading-relaxed px-4 sm:px-0">
            {section.section_description}
          </p>
        </div>

        {/* Modern Badge-Style Tab Navigation */}
        <div ref={tabNavRef} className="mb-3 sm:mb-4 md:mb-6">
          <ChatHelpTabs
            activeTab={activeTab}
            onTabChange={handleTabChange}
            isAuthenticated={!!(session && !isLoading)}
            isFullPage={true}
          />
        </div>

        {/* Apple-style Tab Content Container */}
        <div className="relative">
          {/* Content background with glass effect */}
          <div className="absolute inset-0 bg-white/60 backdrop-blur-3xl rounded-3xl"
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
          <div className="relative min-h-[300px] p-2 lg:pb-12">
            {activeTab === 'welcome' ? (
              <WelcomeTab
                onTabChange={handleTabChange}
                size="fullscreen"
                onShowFAQ={handleShowFAQ}
                onShowKnowledgeBase={handleShowKnowledgeBase}
                onShowLiveSupport={handleShowLiveSupport}
              />
            ) : activeTab === 'conversation' ? (
              <ConversationTab
                size="fullscreen"
                isAuthenticated={!!(session && !isLoading)}
                userId={session?.user?.id || null}
                accessToken={session?.access_token || null}
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
      </div>
    </section>
  );
};

export default HelpCenterSection;
