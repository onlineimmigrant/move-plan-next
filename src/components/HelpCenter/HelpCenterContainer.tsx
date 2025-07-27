'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { useSettings } from '@/context/SettingsContext';
import ModernLanguageSwitcher from '@/components/ModernLanguageSwitcher';
import { useHelpCenterTranslations } from '@/components/ChatHelpWidget/useHelpCenterTranslations';
import ChatHelpTabs from '@/components/ChatHelpWidget/ChatHelpTabs';
import WelcomeTab from '@/components/ChatHelpWidget/WelcomeTab';
import ConversationTab from '@/components/ChatHelpWidget/ConversationTab';
import ArticlesTab from '@/components/ChatHelpWidget/ArticlesTab';
import AIAgentTab from '@/components/ChatHelpWidget/AIAgentTab';
import FAQView from '@/components/ChatHelpWidget/FAQView';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function HelpCenterContainer() {
  const [activeTab, setActiveTab] = useState<'welcome' | 'conversation' | 'ai'>('welcome');
  const [currentView, setCurrentView] = useState<'welcome' | 'conversation' | 'articles' | 'ai' | 'faq' | 'knowledge-base' | 'live-support'>('welcome');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { settings } = useSettings();
  const { t } = useHelpCenterTranslations();

  // Client-safe favicon URL logic (same as layout-utils but for client components)
  const getFaviconUrl = (favicon?: string | null): string => {
    if (!favicon) return '/images/favicon.ico';
    if (favicon.startsWith('http')) return favicon;
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/favicons/${favicon}`;
  };

  const getHeaderTitle = () => {
    switch (currentView) {
      case 'welcome':
        return t.helpCenter;
      case 'articles':
      case 'knowledge-base':
        return t.knowledgeBase;
      case 'faq':
        return t.faqs;
      case 'conversation':
      case 'live-support':
        return t.liveSupport;
      case 'ai':
        return t.aiAssistant;
      default:
        return t.helpCenter;
    }
  };

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) {
          console.error('Error getting user:', error);
          setIsAuthenticated(false);
          setUserId(null);
          setAccessToken(null);
        } else if (user) {
          setIsAuthenticated(true);
          setUserId(user.id);
          const { data: { session } } = await supabase.auth.getSession();
          setAccessToken(session?.access_token || null);
        } else {
          setIsAuthenticated(false);
          setUserId(null);
          setAccessToken(null);
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        setIsAuthenticated(false);
        setUserId(null);
        setAccessToken(null);
      }
    };

    checkAuthStatus();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setIsAuthenticated(true);
        setUserId(session.user.id);
        setAccessToken(session.access_token);
      } else {
        setIsAuthenticated(false);
        setUserId(null);
        setAccessToken(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleTabChange = (tab: 'welcome' | 'conversation' | 'ai') => {
    // Allow navigation to all tabs - authentication check handled within each tab component
    setActiveTab(tab);
    setCurrentView(tab);
    setError(null);
  };

  const handleSpecialView = (view: 'faq' | 'knowledge-base' | 'live-support') => {
    setCurrentView(view);
  };

  const goToLogin = () => {
    router.push('/login');
  };

  const goToSignup = () => {
    router.push('/register');
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'welcome':
        return (
          <WelcomeTab
            onTabChange={handleTabChange}
            size="fullscreen"
            onShowFAQ={() => handleSpecialView('faq')}
            onShowKnowledgeBase={() => handleSpecialView('knowledge-base')}
            onShowLiveSupport={() => handleSpecialView('live-support')}
          />
        );
      case 'conversation':
      case 'live-support':
        return (
          <ConversationTab
            size="fullscreen"
            isAuthenticated={isAuthenticated}
            userId={userId}
            accessToken={accessToken}
          />
        );
      case 'articles':
      case 'knowledge-base':
        return (
          <ArticlesTab
            size="fullscreen"
            onBackToHelpCenter={() => setCurrentView('welcome')}
          />
        );
      case 'ai':
        return (
          <AIAgentTab
            size="fullscreen"
            isAuthenticated={isAuthenticated}
            userId={userId}
            accessToken={accessToken}
            goToLogin={goToLogin}
            goToRegister={goToSignup}
          />
        );
      case 'faq':
        return (
          <FAQView
            size="fullscreen"
            onBack={() => setCurrentView('welcome')}
          />
        );
      default:
        return (
          <WelcomeTab
            onTabChange={handleTabChange}
            size="fullscreen"
            onShowFAQ={() => handleSpecialView('faq')}
            onShowKnowledgeBase={() => handleSpecialView('knowledge-base')}
            onShowLiveSupport={() => handleSpecialView('live-support')}
          />
        );
    }
  };

  return (
    <div className="w-full h-screen bg-gray-50 flex flex-col">
      {/* Custom Header */}
      <header className="z-11 px-4 sm:px-8 flex justify-between items-center bg-white border-b border-gray-200 h-16">
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
        
        {/* Header Title */}
        <div className='flex items-center space-x-3'>
          <h1 className="text-base sm:text-2xl font-bold text-gray-900">{getHeaderTitle()}</h1>
          <span className="hidden sm:flex ml-3 px-2 py-1 text-xs bg-sky-100 text-sky-700 rounded-full">
            {t.supportKnowledgeBase}
          </span>
        </div>
        
        {/* Language Switcher - Right Side */}
        <div className="relative z-50">
          <ModernLanguageSwitcher zIndex={9999} />
        </div>
      </header>
      
      {/* Main Content */}
      <div className="flex-1 overflow-hidden bg-white">
        {renderCurrentView()}
      </div>
      
      {/* Bottom Navigation Tabs */}
      <div className="bg-white border-t border-gray-200">
        <ChatHelpTabs
          activeTab={activeTab}
          onTabChange={handleTabChange}
          isAuthenticated={isAuthenticated}
          isFullPage={true}
        />
      </div>
    </div>
  );
}
