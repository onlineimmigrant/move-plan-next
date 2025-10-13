'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import WelcomeTab from '@/components/ChatHelpWidget/WelcomeTab';
import AIAgentTab from '@/components/ChatHelpWidget/AIAgentTab';
import ConversationTab from '@/components/ChatHelpWidget/ConversationTab';
import { WidgetSize } from '@/components/ChatWidget/types';
import { useAuth } from '@/context/AuthContext';
import { useHelpCenterTranslations } from '@/components/ChatHelpWidget/useHelpCenterTranslations';

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
    if (tab === 'ai') {
      router.push('/help-center?tab=ai_agent');
    } else if (tab === 'conversation') {
      router.push('/help-center?tab=conversation');
    } else {
      // For welcome/browse tab, navigate to help center base page
      router.push('/help-center');
    }
  };

  const handleShowFAQ = () => {
    router.push('/help-center?tab=faq');
  };

  const handleShowKnowledgeBase = () => {
    router.push('/help-center?tab=articles');
  };

  const handleShowLiveSupport = () => {
    router.push('/help-center?tab=conversation');
  };

  const handleGoToLogin = () => {
    router.push('/login');
  };

  const handleGoToRegister = () => {
    router.push('/register');
  };

  const handleSwitchToChatWidget = (forceFullscreen?: boolean) => {
    // Navigate to help center with AI tab and chat widget active
    router.push('/help-center?tab=ai&chat=true');
  };

  return (
    <section
      ref={sectionRef}
      className={`px-4 py-20 ${section.background_color ? `bg-${section.background_color}` : 'bg-gradient-to-b from-gray-50/50 to-white'}`}
    >
            <div className={`${section.is_full_width ? 'w-full' : 'max-w-7xl'} mx-auto`}>
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4 tracking-[-0.02em] antialiased">
            {section.section_title || 'Help Center'}
          </h2>
          <p className="text-[18px] text-gray-600 antialiased max-w-2xl mx-auto leading-relaxed">
            {section.section_description}
          </p>
        </div>

        {/* Apple-style Tab Navigation */}
        <div ref={tabNavRef} className="flex justify-center mb-12 px-2">
          <div className="relative bg-white/80 backdrop-blur-2xl p-1 sm:p-1.5 rounded-2xl border border-gray-200/50 w-full max-w-2xl">
            {/* Background slider */}
            <div 
              className={`absolute top-1 sm:top-1.5 h-[calc(100%-8px)] sm:h-[calc(100%-12px)] bg-white rounded-xl shadow-sm border border-gray-100 transition-all duration-150 ease-out ${
                activeTab === 'welcome' 
                  ? 'left-1 sm:left-1.5 w-[calc(33.333%-4px)] sm:w-[calc(33.333%-6px)]' 
                  : activeTab === 'conversation'
                  ? 'left-[calc(33.333%+1px)] sm:left-[calc(33.333%+1.5px)] w-[calc(33.333%-4px)] sm:w-[calc(33.333%-6px)]'
                  : 'left-[calc(66.666%+1px)] sm:left-[calc(66.666%+1.5px)] w-[calc(33.333%-4px)] sm:w-[calc(33.333%-6px)]'
              }`}
            />
            
            <div className="relative flex">
              <button
                onClick={() => setActiveTab('welcome')}
                className={`relative px-3 sm:px-6 md:px-8 py-2.5 sm:py-3 rounded-xl text-[13px] sm:text-[15px] font-medium transition-all duration-150 ease-out antialiased tracking-[-0.01em] flex-1 ${
                  activeTab === 'welcome'
                    ? 'text-gray-900'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <span className="hidden sm:inline">Browse</span>
                <span className="sm:hidden">Browse</span>
              </button>
              <button
                onClick={() => setActiveTab('conversation')}
                className={`relative px-3 sm:px-6 md:px-8 py-2.5 sm:py-3 rounded-xl text-[13px] sm:text-[15px] font-medium transition-all duration-150 ease-out antialiased tracking-[-0.01em] flex-1 ${
                  activeTab === 'conversation'
                    ? 'text-gray-900'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <span className="hidden sm:inline">Live Chat</span>
                <span className="sm:hidden">Chat</span>
              </button>
              <button
                onClick={() => setActiveTab('ai')}
                className={`relative px-3 sm:px-6 md:px-8 py-2.5 sm:py-3 rounded-xl text-[13px] sm:text-[15px] font-medium transition-all duration-150 ease-out antialiased tracking-[-0.01em] flex-1 ${
                  activeTab === 'ai'
                    ? 'text-gray-900'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <span className="hidden sm:inline">{t.aiAssistant}</span>
                <span className="sm:hidden">AI</span>
              </button>
            </div>
          </div>
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
          <div className="relative min-h-[500px] p-2 lg:p-12">
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
