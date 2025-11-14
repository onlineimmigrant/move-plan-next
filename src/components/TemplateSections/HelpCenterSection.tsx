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
import { getBackgroundStyle } from '@/utils/gradientHelper';
import HelpCenterErrorBoundary from './HelpCenterErrorBoundary';

// Constants
const HEADER_HEIGHT = 80;
const MIN_CONTENT_HEIGHT = 300;

// Types - simplified to match TemplateSectionData
interface HelpCenterSectionData {
  id: number;
  section_title: string;
  section_title_translation?: Record<string, string>;
  section_description?: string;
  section_description_translation?: Record<string, string>;
  text_style_variant?:
    | 'default'
    | 'apple'
    | 'codedharmony'
    | 'magazine'
    | 'startup'
    | 'elegant'
    | 'brutalist'
    | 'modern'
    | 'playful';
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

/**
 * HelpCenterSection Component
 * 
 * A full-featured help center section with tabbed navigation for:
 * - Welcome/Explore tab with quick actions
 * - Live chat conversation
 * - AI assistant
 * 
 * Features:
 * - Multi-layer glassmorphism effect for depth and visual hierarchy
 * - Auto-scroll to position tabs below header on tab change
 * - Authentication-aware content
 * - Responsive design with mobile optimizations
 * - Keyboard shortcuts support (Cmd/Ctrl + 1/2/3)
 * 
 * @param section - Section configuration including title, description, styling
 */
const HelpCenterSection: React.FC<HelpCenterSectionProps> = ({ section }) => {
  // Early return to avoid null/undefined issues
  if (!section || !section.is_help_center_section) {
    return null;
  }

  const [activeTab, setActiveTab] = useState<TabType>('welcome');
  const [isLoading, setIsLoading] = useState(true);
  const { session, isLoading: authLoading } = useAuth();
  const { t } = useHelpCenterTranslations();
  const router = useRouter();
  const sectionRef = useRef<HTMLDivElement>(null);
  const tabNavRef = useRef<HTMLDivElement>(null);

  // Set loading to false once auth is initialized
  useEffect(() => {
    if (!authLoading) {
      setIsLoading(false);
    }
  }, [authLoading]);

  // Keyboard shortcuts: Cmd/Ctrl + 1/2/3 for tab navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && ['1', '2', '3'].includes(e.key)) {
        e.preventDefault();
        const tabs: TabType[] = ['welcome', 'conversation', 'ai'];
        const index = parseInt(e.key) - 1;
        if (tabs[index]) {
          setActiveTab(tabs[index]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Scroll to position tab nav below header when switching to conversation or ai tabs
  useEffect(() => {
    if (activeTab === 'conversation' || activeTab === 'ai') {
      if (tabNavRef.current) {
        const tabNavTop = tabNavRef.current.getBoundingClientRect().top + window.scrollY;
        const scrollToPosition = tabNavTop - HEADER_HEIGHT;
        
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

  // Get text alignment class
  const getAlignmentClass = () => {
    if (section.is_section_title_aligned_right) return 'text-right';
    if (section.is_section_title_aligned_center) return 'text-center';
    return 'text-left';
  };

  // Get text style variant classes
  const getTitleClass = () => {
    switch (section.text_style_variant) {
      case 'apple':
        return 'text-3xl sm:text-4xl font-light text-gray-900 tracking-tight';
      case 'codedharmony':
        return 'text-4xl sm:text-5xl font-bold text-gray-900 tracking-tight';
      default:
        return 'text-2xl sm:text-3xl font-bold text-gray-900 tracking-[-0.02em]';
    }
  };

  const getDescriptionClass = () => {
    switch (section.text_style_variant) {
      case 'apple':
        return 'text-lg sm:text-xl font-light text-gray-600';
      case 'codedharmony':
        return 'text-xl sm:text-2xl font-medium text-gray-600';
      default:
        return 'text-base sm:text-[18px] text-gray-600';
    }
  };

  // Calculate background style (gradient or solid color)
  const backgroundStyle = section.background_color
    ? getBackgroundStyle(false, undefined, section.background_color)
    : undefined;

  // Default gradient background classes if no custom background
  const defaultBackgroundClass = !section.background_color 
    ? 'bg-gradient-to-br from-blue-50/30 via-purple-50/20 to-pink-50/30' 
    : '';

  // Show loading state while auth initializes
  if (isLoading) {
    return (
      <section className="sm:px-4 py-8 relative bg-gradient-to-br from-blue-50/30 via-purple-50/20 to-pink-50/30">
  <div className="absolute inset-0 backdrop-blur-sm"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm text-gray-600">Loading help center...</span>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      ref={sectionRef}
      className={`sm:px-4 py-8 relative ${defaultBackgroundClass}`}
      style={backgroundStyle}
      aria-label={section.section_title || 'Help Center'}
      role="region"
    >
  {/* Glassmorphism overlay */}
  <div className="absolute inset-0 backdrop-blur-sm"></div>
      
      <div className={`${section.is_full_width ? 'w-full' : 'max-w-7xl'} mx-auto relative z-10`}>
        {/* Section Header */}
        <div className={`${getAlignmentClass()} mb-3 sm:mb-6 md:mb-8`}>
          <h2 className={`${getTitleClass()} mb-2 sm:mb-3 antialiased`}>
            {section.section_title || 'Help Center'}
          </h2>
          {section.section_description && (
            <p className={`${getDescriptionClass()} antialiased max-w-2xl ${section.is_section_title_aligned_center ? 'mx-auto' : ''} ${section.is_section_title_aligned_right ? 'ml-auto' : ''} leading-relaxed px-4 sm:px-0`}>
              {section.section_description}
            </p>
          )}
        </div>

        {/* Modern Badge-Style Tab Navigation */}
        <div ref={tabNavRef} className="mb-3 sm:mb-4 md:mb-6" role="tablist" aria-label="Help center navigation">
          <ChatHelpTabs
            activeTab={activeTab}
            onTabChange={handleTabChange}
            isAuthenticated={!!(session && !authLoading)}
            isFullPage={true}
          />
        </div>

        {/* Apple-style Tab Content Container with multi-layer glassmorphism */}
        <div className="relative">
          {/* Layer 1: Content background with strong glass effect (60% white, blur-3xl) */}
          <div 
            className="absolute inset-0 bg-white/60 backdrop-blur-3xl rounded-3xl"
            style={{
              backdropFilter: 'blur(24px) saturate(200%) brightness(105%)',
              WebkitBackdropFilter: 'blur(24px) saturate(200%) brightness(105%)',
            }}
          />
          
          {/* Layer 2: Subtle top highlight for depth */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent rounded-t-3xl" />
          
          {/* Layer 3: Inner glow gradient for enhanced depth perception */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-transparent rounded-3xl pointer-events-none" />
          
          {/* Tab Content - relative positioning for stacking above glass layers */}
          <div 
            className="relative p-2 lg:pb-12"
            style={{ minHeight: `${MIN_CONTENT_HEIGHT}px` }}
            role="tabpanel"
            aria-label={`${activeTab} tab content`}
          >
            <HelpCenterErrorBoundary>
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
                  isAuthenticated={!!(session && !authLoading)}
                  userId={session?.user?.id || null}
                  accessToken={session?.access_token || null}
                />
              ) : (
                <AIAgentTab
                  isAuthenticated={!!session && !authLoading}
                  userId={session?.user?.id || null}
                  accessToken={session?.access_token || null}
                  size="fullscreen"
                  goToLogin={handleGoToLogin}
                  goToRegister={handleGoToRegister}
                  onSwitchToChatWidget={handleSwitchToChatWidget}
                />
              )}
            </HelpCenterErrorBoundary>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HelpCenterSection;
