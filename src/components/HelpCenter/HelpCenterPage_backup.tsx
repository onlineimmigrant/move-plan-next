'use client';

import { useState } from 'react';
import { QuestionMarkCircleIcon, DocumentTextIcon, ChatBubbleLeftRightIcon, RocketLaunchIcon } from '@heroicons/react/24/outline';
import { useHelpCenterTranslations } from '@/components/ChatHelpWidget/useHelpCenterTranslations';
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 relative">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">{t.helpCenter}</h1>
              <span className="ml-3 px-2 py-1 text-xs bg-sky-100 text-sky-700 rounded-full">
                {t.supportKnowledgeBase}
              </span>
            </div>
            
            <div className="flex items-center justify-between flex-1 relative z-0">
              {/* Navigation Tabs */}
              <nav className="hidden xl:flex space-x-8 ml-8">
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      className={`group flex items-center px-1 py-2 text-sm font-medium border-b-2 transition-colors ${
                        isActive
                          ? 'border-sky-500 text-sky-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                      title={tab.description}
                    >
                      <tab.icon className={`mr-2 h-4 w-4 ${isActive ? 'text-sky-600' : 'text-gray-400 group-hover:text-gray-500'}`} />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
              
              {/* Language Switcher - Absolute Right */}
              <div className="hidden xl:flex mr-4 relative z-50">
                <ModernLanguageSwitcher zIndex={9999} />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <div className="xl:hidden bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
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
            
            {/* Language Switcher for Mobile - Absolute Right */}
            <div className="mr-4 flex-shrink-0 relative z-50">
              <ModernLanguageSwitcher zIndex={9999} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <nav className="flex items-center space-x-2 text-sm text-gray-500">
            <span>Help Center</span>
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

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 min-h-[700px] overflow-hidden">
          {renderActiveTab()}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-sm text-gray-500">
            <p>Need more help? Contact our support team for personalized assistance.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
