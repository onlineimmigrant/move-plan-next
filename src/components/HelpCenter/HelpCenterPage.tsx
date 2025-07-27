'use client';

import { useState } from 'react';
import { QuestionMarkCircleIcon, DocumentTextIcon, ChatBubbleLeftRightIcon, RocketLaunchIcon } from '@heroicons/react/24/outline';
import { useHelpCenterTranslations } from '@/components/ChatHelpWidget/useHelpCenterTranslations';
import { useSettings } from '@/context/SettingsContext';
import { useRouter } from 'next/navigation';
import ModernLanguageSwitcher from '@/components/ModernLanguageSwitcher';
import WelcomeTab from '@/components/ChatHelpWidget/WelcomeTab';
import ArticlesTab from '@/components/ChatHelpWidget/ArticlesTab';
import FAQView from '@/components/ChatHelpWidget/FAQView';
import ConversationTab from '@/components/ChatHelpWidget/ConversationTab';
import AIAgentTab from '@/components/ChatHelpWidget/AIAgentTab';

interface HelpCenterPageProps {
  locale: string;
}

type TabType = 'welcome' | 'articles' | 'faq' | 'conversation' | 'ai';

export default function HelpCenterPage({ locale }: HelpCenterPageProps) {
  const [activeTab, setActiveTab] = useState<TabType>('welcome');
  const { t } = useHelpCenterTranslations();
  const { settings } = useSettings();
  const router = useRouter();

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="z-11 px-4 sm:px-8 flex justify-between items-center bg-white border-b border-gray-200 sticky top-0  h-16">
       
        
           
              {/* Logo */}
              <button
                type="button"
                onClick={() => router.push('/')}
                className="cursor-pointer flex items-center text-gray-900 hover:text-sky-600 transition-all duration-200 mr-6"
                aria-label="Go to homepage"
              >
                {/* Mobile - Use favicon with proper URL logic */}
                <img
                  src={getFaviconUrl(settings?.favicon || undefined)}
                  alt="Logo"
                  width={24}
                  height={24}
                  className="h-6 w-6 sm:hidden"
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
                    width={30}
                    height={30}
                    className="hidden sm:block h-8 w-auto"
                    onError={(e) => {
                      console.error('Failed to load logo:', settings.image);
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <span className="text-gray-500 hidden sm:block">Logo</span>
                )}
                
                <span className="sr-only tracking-tight text-xl font-extrabold bg-gradient-to-r from-sky-400 via-sky-500 to-sky-600 bg-clip-text text-transparent">
                  {settings?.site || 'Coded Harmony'}
                </span>
              </button>
              
              <div className='flex items-center space-x-3'>
              <h1 className="text-base sm:text-2xl font-bold text-gray-900">{getHeaderTitle()}</h1>
              <span className="hidden sm:flex ml-3 px-2 py-1 text-xs bg-sky-100 text-sky-700 rounded-full">
                {t.supportKnowledgeBase}
              </span>
              </div>
            
            
            

              
              {/* Language Switcher - Absolute Right */}
              <div className="  relative z-50">
                <ModernLanguageSwitcher zIndex={9999} />
              </div>
            
          
       
      </header>

      {/* Mobile Navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-10">
        <div className="px-4 sm:px-6">
          <div className="flex items-center justify-between py-3">
            <div className="flex space-x-1 overflow-x-auto flex-1">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`flex items-center px-3 py-2 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                      isActive
                        ? 'bg-sky-100 text-sky-700'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <tab.icon className={`mr-1 h-3 w-3 ${isActive ? 'text-sky-600' : 'text-gray-400'}`} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
  
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="px-4 sm:px-6 lg:px-8 py-8 pt-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <nav className="flex items-center space-x-2 text-sm text-gray-500">
            <span>{t.helpCenter}</span>
            {activeTab !== 'welcome' && (
              <>
                <span>/</span>
                <span className="text-gray-900 font-medium">
                  {tabs.find(tab => tab.id === activeTab)?.label}
                </span>
              </>
            )}
          </nav>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-[700px] flex flex-col relative">
          {renderActiveTab()}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-sm text-gray-500">
            <p>{t.needMoreHelp}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
