'use client';

import { useState } from 'react';
import { QuestionMarkCircleIcon, DocumentTextIcon, ChatBubbleLeftRightIcon, RocketLaunchIcon } from '@heroicons/react/24/outline';
import { useHelpCenterTranslations } from '@/components/modals/ChatHelpWidget/useHelpCenterTranslations';
import { useSettings } from '@/context/SettingsContext';
import { useRouter } from 'next/navigation';
import ModernLanguageSwitcher from '@/components/ModernLanguageSwitcher';
import WelcomeTab from '@/components/modals/ChatHelpWidget/WelcomeTab';
import ArticlesTab from '@/components/modals/ChatHelpWidget/ArticlesTab';
import FAQView from '@/components/modals/ChatHelpWidget/FAQView';
import ConversationTab from '@/components/modals/ChatHelpWidget/ConversationTab';
import AIAgentTab from '@/components/modals/ChatHelpWidget/AIAgentTab';
import { useThemeColors } from '@/hooks/useThemeColors';

interface HelpCenterPageProps {
  locale: string;
}

type TabType = 'welcome' | 'articles' | 'faq' | 'conversation' | 'ai';

export default function HelpCenterPage({ locale }: HelpCenterPageProps) {
  const [activeTab, setActiveTab] = useState<TabType>('welcome');
  const { t } = useHelpCenterTranslations();
  const { settings } = useSettings();
  const router = useRouter();
  const themeColors = useThemeColors();

  // Client-safe favicon URL logic (same as layout-utils but for client components)
  const getFaviconUrl = (favicon?: string | null): string => {
    if (!favicon) return '/images/favicon.ico';
    if (favicon.startsWith('http')) return favicon;
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/favicons/${favicon}`;
  };

  const getHeaderTitle = () => {
    switch (activeTab) {
      case 'welcome':
        return t.helpCenter;
      case 'articles':
        return t.knowledgeBase;
      case 'faq':
        return t.faqs;
      case 'conversation':
        return t.liveSupport;
      case 'ai':
        return t.aiAssistant;
      default:
        return t.helpCenter;
    }
  };

  const tabs = [
    {
      id: 'welcome' as const,
      label: t.welcome,
      icon: QuestionMarkCircleIcon,
      description: t.welcomeDescription
    },
    {
      id: 'articles' as const,
      label: t.knowledgeBase,
      icon: DocumentTextIcon,
      description: t.knowledgeBaseDescription
    },
    {
      id: 'faq' as const,
      label: t.faqs,
      icon: QuestionMarkCircleIcon,
      description: t.faqsDescription
    },
    {
      id: 'conversation' as const,
      label: t.liveSupport,
      icon: ChatBubbleLeftRightIcon,
      description: t.liveSupportDescription
    },
    {
      id: 'ai' as const,
      label: t.aiAssistant,
      icon: RocketLaunchIcon,
      description: t.aiAssistantDescription
    }
  ];

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'welcome':
        return (
          <WelcomeTab
            onTabChange={handleTabChange}
            size="fullscreen"
            onShowFAQ={() => setActiveTab('faq')}
            onShowKnowledgeBase={() => setActiveTab('articles')}
            onShowLiveSupport={() => setActiveTab('conversation')}
          />
        );
      case 'articles':
        return (
          <ArticlesTab
            size="fullscreen"
            onBackToHelpCenter={() => setActiveTab('welcome')}
          />
        );
      case 'faq':
        return (
          <FAQView
            size="fullscreen"
            onBack={() => setActiveTab('welcome')}
          />
        );
      case 'conversation':
        return (
          <ConversationTab
            size="fullscreen"
            isAuthenticated={false}
            userId={null}
            accessToken={null}
          />
        );
      case 'ai':
        return (
          <AIAgentTab
            size="fullscreen"
            isAuthenticated={false}
            userId={null}
            accessToken={null}
            goToLogin={() => {}}
            goToRegister={() => {}}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50/50 to-white">
      {/* Apple-style Header */}
      <header className="z-11 px-6 sm:px-10 flex justify-between items-center bg-white/95 backdrop-blur-3xl sticky top-0 h-20"
        style={{
          backdropFilter: 'blur(24px) saturate(200%) brightness(105%)',
          WebkitBackdropFilter: 'blur(24px) saturate(200%) brightness(105%)',
        }}
      >
        {/* Logo */}
        <button
          type="button"
          onClick={() => {
            // Preserve current locale when navigating to home page
            const pathSegments = window.location.pathname.split('/');
            const supportedLocales = ['en', 'es', 'fr', 'de', 'ru', 'it', 'pt', 'zh', 'ja', 'pl'];
            const currentLocale = pathSegments[1] && supportedLocales.includes(pathSegments[1]) ? pathSegments[1] : null;
            
            if (currentLocale) {
              router.push(`/${currentLocale}`);
            } else {
              router.push('/');
            }
          }}
          className="cursor-pointer flex items-center text-gray-900 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] mr-8 hover:scale-105 antialiased"
          style={{ color: undefined }}
          onMouseEnter={(e) => e.currentTarget.style.color = themeColors.cssVars.primary.base}
          onMouseLeave={(e) => e.currentTarget.style.color = ''}
          aria-label="Go to homepage"
        >
          {/* Mobile - Use favicon with proper URL logic */}
          <img
            src={getFaviconUrl(settings?.favicon || undefined)}
            alt="Logo"
            width={28}
            height={28}
            className="h-7 w-7 sm:hidden rounded-lg"
            onError={(e) => {
              console.error('Failed to load favicon:', settings?.favicon);
              e.currentTarget.style.display = 'none';
            }}
          />
          
          {/* Desktop - Use main logo */}
          {settings?.image ? (
            <img
              src={settings.image}
              alt="Logo"
              width={36}
              height={36}
              className="hidden sm:block h-9 w-auto rounded-lg"
              onError={(e) => {
                console.error('Failed to load logo:', settings.image);
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <span className="text-gray-500 hidden sm:block font-light text-lg antialiased">Logo</span>
          )}
          
          <span 
            className="sr-only tracking-tight text-xl font-extrabold bg-clip-text text-transparent"
            style={{
              backgroundImage: `linear-gradient(to right, ${themeColors.cssVars.primary.lighter}, ${themeColors.cssVars.primary.base}, ${themeColors.cssVars.primary.hover})`
            }}
          >
            {settings?.site || 'Coded Harmony'}
          </span>
        </button>
        
        <div className='flex items-center space-x-4'>
          <h1 className="text-lg sm:text-3xl font-semibold text-gray-900 tracking-[-0.02em] antialiased">{getHeaderTitle()}</h1>
          <span 
            className="hidden sm:flex ml-4 px-4 py-2 text-[12px] font-medium rounded-full backdrop-blur-sm antialiased"
            style={{
              backgroundColor: `${themeColors.cssVars.primary.lighter}33`,
              color: themeColors.cssVars.primary.hover
            }}
          >
            {t.supportKnowledgeBase}
          </span>
        </div>
        
        {/* Language Switcher - Absolute Right */}
        <div className="relative z-50">
          <ModernLanguageSwitcher zIndex={9999} />
        </div>
      </header>

      {/* Apple-style Mobile Navigation */}
      <div className="bg-white/90 backdrop-blur-2xl sticky top-20 z-10"
        style={{
          backdropFilter: 'blur(16px) saturate(180%)',
          WebkitBackdropFilter: 'blur(16px) saturate(180%)',
        }}
      >
        <div className="px-4 sm:px-6">
          <div className="flex items-center justify-between py-4">
            <div className="flex space-x-2 overflow-x-auto flex-1 scrollbar-hide">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`flex items-center px-4 py-2.5 text-[13px] font-medium rounded-xl whitespace-nowrap transition-all duration-150 ease-out antialiased tracking-[-0.01em] ${
                      isActive
                        ? 'backdrop-blur-sm scale-105'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100/60 hover:scale-102'
                    }`}
                    style={isActive ? {
                      backgroundColor: `${themeColors.cssVars.primary.lighter}33`,
                      color: themeColors.cssVars.primary.hover
                    } : {}}
                  >
                    <tab.icon 
                      className={`mr-2 h-4 w-4 transition-colors duration-150`}
                      style={{ color: isActive ? themeColors.cssVars.primary.base : undefined }}
                    />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="px-4 sm:px-6 lg:px-8 py-12 pt-8">
        {/* Apple-style Breadcrumb */}
        <div className="mb-8">
          <nav className="flex items-center space-x-3 text-[14px] text-gray-500 antialiased">
            <span className="hover:text-gray-700 transition-colors duration-200 cursor-pointer">{t.helpCenter}</span>
            {activeTab !== 'welcome' && (
              <>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span className="text-gray-900 font-medium tracking-[-0.01em]">
                  {tabs.find(tab => tab.id === activeTab)?.label}
                </span>
              </>
            )}
          </nav>
        </div>

        {/* Apple-style Content Container */}
        <div className="relative">
          {/* Glass background container */}
          <div className="absolute inset-0 bg-white/70 backdrop-blur-3xl rounded-3xl"
            style={{
              backdropFilter: 'blur(24px) saturate(200%) brightness(105%)',
              WebkitBackdropFilter: 'blur(24px) saturate(200%) brightness(105%)',
            }}
          />
          
          {/* Subtle top highlight */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent rounded-t-3xl" />
          
          {/* Inner glow for depth */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-transparent rounded-3xl pointer-events-none" />
          
          {/* Content */}
          <div className="relative h-[700px] flex flex-col overflow-hidden rounded-3xl">
            {renderActiveTab()}
          </div>
          
          {/* Bottom accent */}
          <div className="absolute inset-x-8 bottom-0 h-px bg-gradient-to-r from-transparent via-gray-200/60 to-transparent rounded-b-3xl" />
        </div>
      </main>

      {/* Apple-style Footer */}
      <footer className="bg-white/60 backdrop-blur-2xl mt-16"
        style={{
          backdropFilter: 'blur(16px) saturate(180%)',
          WebkitBackdropFilter: 'blur(16px) saturate(180%)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h3 className="text-[18px] font-semibold text-gray-900 mb-3 tracking-[-0.01em] antialiased">
              {t.needMoreHelp}
            </h3>
            <p className="text-[14px] text-gray-600 antialiased max-w-md mx-auto leading-relaxed">
              Our support team is here to help you get the most out of our platform
            </p>
            <button className="mt-6 px-6 py-3 bg-sky-600 hover:bg-sky-700 text-white text-[14px] font-medium rounded-xl transition-all duration-150 ease-out hover:scale-105 antialiased tracking-[-0.01em]">
              Contact Support
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
