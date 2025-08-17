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

  const handleSwitchToChatWidget = () => {
    // Switch the existing ChatHelpWidget to chat mode using localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('chatWidget_mode', 'chat'); // Set mode to chat
      localStorage.setItem('chatWidget_isOpen', 'true'); // Force open
      
      // Dispatch a custom event to notify the ChatHelpWidget (storage events don't fire in same window)
      window.dispatchEvent(new CustomEvent('customStorageChange', {
        detail: {
          key: 'chatWidget_mode',
          newValue: 'chat'
        }
      }));
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
            onSwitchToChatWidget={handleSwitchToChatWidget}
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
    <div className="w-full h-screen bg-gradient-to-b from-gray-50/50 to-white flex flex-col">
      {/* Apple-style Header */}
      <header className="z-11 px-4 sm:px-8 flex justify-between items-center bg-white/95 backdrop-blur-3xl border-b border-gray-200/30 h-20 shadow-[0_1px_20px_rgba(0,0,0,0.08)]"
        style={{
          backdropFilter: 'blur(24px) saturate(200%) brightness(105%)',
          WebkitBackdropFilter: 'blur(24px) saturate(200%) brightness(105%)',
        }}
      >
        {/* Logo */}
        <button
          type="button"
          onClick={() => router.push('/')}
          className="cursor-pointer flex items-center text-gray-900 hover:text-sky-600 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] mr-8 hover:scale-105 antialiased"
          aria-label="Go to homepage"
        >
          {/* Mobile - Use favicon with proper URL logic */}
          <img
            src={getFaviconUrl(settings?.favicon || undefined)}
            alt="Logo"
            width={28}
            height={28}
            className="h-7 w-7 sm:hidden rounded-lg "
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
              className="hidden sm:block h-9 w-auto rounded-lg "
              onError={(e) => {
                console.error('Failed to load logo:', settings.image);
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <span className="text-gray-500 hidden sm:block font-light text-lg antialiased">Logo</span>
          )}
          
          <span className="sr-only tracking-tight text-xl font-extrabold bg-gradient-to-r from-sky-400 via-sky-500 to-sky-600 bg-clip-text text-transparent">
            {settings?.site || 'Coded Harmony'}
          </span>
        </button>
        
        {/* Header Title */}
        <div className='flex items-center space-x-4'>
          <h1 className="text-lg sm:text-xl font-medium text-gray-900 tracking-[-0.02em] antialiased">{getHeaderTitle()}</h1>
          <span className="hidden sm:flex ml-4 px-4 py-2 text-[12px] font-medium bg-sky-50/80 text-sky-600 rounded-full border border-sky-200/50 backdrop-blur-sm antialiased">
            {t.supportKnowledgeBase}
          </span>
        </div>
        
        {/* Language Switcher - Right Side */}
        <div className="relative z-50">
          <ModernLanguageSwitcher zIndex={9999} />
        </div>
      </header>
      
      {/* Apple-style Main Content */}
      <div className="flex-1 overflow-hidden relative">
        {/* Glass background container */}
        <div className="absolute inset-0 bg-white/60 backdrop-blur-3xl"
          style={{
            backdropFilter: 'blur(24px) saturate(200%) brightness(105%)',
            WebkitBackdropFilter: 'blur(24px) saturate(200%) brightness(105%)',
          }}
        />
        
        {/* Content */}
        <div className="relative h-full">
          {renderCurrentView()}
        </div>
      </div>
      
      {/* Apple-style Bottom Navigation Tabs */}
      <div className="bg-white/90 backdrop-blur-2xl border-t border-gray-200/40 shadow-[0_-1px_10px_rgba(0,0,0,0.04)]"
        style={{
          backdropFilter: 'blur(16px) saturate(180%)',
          WebkitBackdropFilter: 'blur(16px) saturate(180%)',
        }}
      >
        {/* Subtle top highlight */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />
        
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
