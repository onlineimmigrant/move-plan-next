'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter, useSearchParams } from 'next/navigation';
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
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  
  // Map URL tab parameter to initial view
  const getInitialView = (): 'welcome' | 'conversation' | 'articles' | 'ai' | 'faq' | 'knowledge-base' | 'live-support' => {
    switch (tabParam) {
      case 'faq':
        return 'faq';
      case 'articles':
      case 'knowledge-base':
        return 'articles';
      case 'conversation':
      case 'live-support':
        return 'conversation';
      case 'ai':
      case 'ai_agent':
        return 'ai';
      default:
        return 'welcome';
    }
  };
  
  // Map URL tab parameter to active tab state
  const getInitialTab = (): 'welcome' | 'conversation' | 'ai' => {
    switch (tabParam) {
      case 'conversation':
      case 'live-support':
        return 'conversation';
      case 'ai':
      case 'ai_agent':
        return 'ai';
      default:
        return 'welcome';
    }
  };
  
  const [activeTab, setActiveTab] = useState<'welcome' | 'conversation' | 'ai'>(getInitialTab());
  const [currentView, setCurrentView] = useState<'welcome' | 'conversation' | 'articles' | 'ai' | 'faq' | 'knowledge-base' | 'live-support'>(getInitialView());
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
    // Always return "Help Center" for consistent branding
    return t.helpCenter;
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
        // Use getSession instead of getUser to avoid "Auth session missing" errors
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          // Only log errors that aren't about missing sessions (which is normal for logged-out users)
          if (!error.message.includes('Auth session missing')) {
            console.error('Error getting session:', error);
          }
          setIsAuthenticated(false);
          setUserId(null);
          setAccessToken(null);
        } else if (session?.user) {
          setIsAuthenticated(true);
          setUserId(session.user.id);
          setAccessToken(session.access_token || null);
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

  // Sync URL parameters with component state
  useEffect(() => {
    const newView = getInitialView();
    const newTab = getInitialTab();
    
    if (newView !== currentView) {
      setCurrentView(newView);
    }
    if (newTab !== activeTab) {
      setActiveTab(newTab);
    }
  }, [tabParam]); // Only depend on tabParam, not on currentView or activeTab to avoid loops

  const handleTabChange = (tab: 'welcome' | 'conversation' | 'ai') => {
    // Allow navigation to all tabs - authentication check handled within each tab component
    setActiveTab(tab);
    setCurrentView(tab);
    setError(null);
    
    // Update URL based on tab
    if (tab === 'welcome') {
      router.push('/help-center', { scroll: false });
    } else if (tab === 'conversation') {
      router.push('/help-center?tab=conversation', { scroll: false });
    } else if (tab === 'ai') {
      router.push('/help-center?tab=ai_agent', { scroll: false });
    }
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
      <header className="z-11 px-4 sm:px-8 flex justify-between items-center bg-white/95 backdrop-blur-3xl h-20"
        style={{
          backdropFilter: 'blur(24px) saturate(200%) brightness(105%)',
          WebkitBackdropFilter: 'blur(24px) saturate(200%) brightness(105%)',
        }}
      >
        {/* Logo */}
        <button
          type="button"
          onClick={() => router.push('/')}
          className="cursor-pointer flex items-center text-gray-900 hover:text-sky-600 transition-all duration-150 ease-out mr-8 hover:scale-105 antialiased"
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
        
        {/* Header Title - Clickable to return to welcome */}
        <div className='flex items-center space-x-4'>
          <button
            onClick={() => {
              setActiveTab('welcome');
              setCurrentView('welcome');
              router.push('/help-center', { scroll: false });
            }}
            className="group transition-all duration-150 ease-out hover:scale-105"
          >
            <h1 className="text-lg sm:text-xl font-medium text-gray-900 tracking-[-0.02em] antialiased relative group-hover:text-sky-600 transition-colors">
              {getHeaderTitle()}
              <span className="absolute -bottom-1 sm:-bottom-2 left-1/2 -translate-x-1/2 w-16 h-1 bg-sky-600 rounded-full group-hover:w-20 transition-all duration-150" />
            </h1>
          </button>
        </div>
        
        {/* Language Switcher - Right Side */}
        <div className="relative z-50">
          <ModernLanguageSwitcher zIndex={9999} />
        </div>
      </header>
      
      {/* Apple-style Tab Navigation - Moved to top */}
      <div className="px-4 py-6 bg-gradient-to-b from-gray-50/50 to-white">
        <ChatHelpTabs
          activeTab={activeTab}
          onTabChange={handleTabChange}
          isAuthenticated={isAuthenticated}
          isFullPage={true}
        />
      </div>
      
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
    </div>
  );
}
