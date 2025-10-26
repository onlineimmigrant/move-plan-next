'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSettings } from '@/context/SettingsContext';
import { useHelpCenterTranslations } from '@/components/modals/ChatHelpWidget/useHelpCenterTranslations';
import ChatHelpTabs from '@/components/modals/ChatHelpWidget/ChatHelpTabs';
import WelcomeTab from '@/components/modals/ChatHelpWidget/WelcomeTab';
import ConversationTab from '@/components/modals/ChatHelpWidget/ConversationTab';
import ArticlesTab from '@/components/modals/ChatHelpWidget/ArticlesTab';
import AIAgentTab from '@/components/modals/ChatHelpWidget/AIAgentTab';
import FAQView from '@/components/modals/ChatHelpWidget/FAQView';
import FeaturesView from '@/components/modals/ChatHelpWidget/FeaturesView';
import OfferingsView from '@/components/modals/ChatHelpWidget/OfferingsView';
import { useThemeColors } from '@/hooks/useThemeColors';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function HelpCenterContainer() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const themeColors = useThemeColors();
  
  // Map URL tab parameter to initial view
  const getInitialView = (): 'welcome' | 'conversation' | 'articles' | 'ai' | 'faq' | 'features' | 'offerings' | 'knowledge-base' | 'live-support' => {
    switch (tabParam) {
      case 'faq':
        return 'faq';
      case 'features':
        return 'features';
      case 'offerings':
        return 'offerings';
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
  const [currentView, setCurrentView] = useState<'welcome' | 'conversation' | 'articles' | 'ai' | 'faq' | 'features' | 'offerings' | 'knowledge-base' | 'live-support'>(getInitialView());
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
      case 'features':
        return (
          <FeaturesView
            size="fullscreen"
            onBack={() => setCurrentView('welcome')}
          />
        );
      case 'offerings':
        return (
          <OfferingsView
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
      <header className="z-11 px-4 sm:px-8 flex items-center bg-white/95 backdrop-blur-3xl h-20 relative"
        style={{
          backdropFilter: 'blur(24px) saturate(200%) brightness(105%)',
          WebkitBackdropFilter: 'blur(24px) saturate(200%) brightness(105%)',
        }}
      >
        {/* Logo - Left */}
        <button
          type="button"
          onClick={() => router.push('/')}
          className="cursor-pointer flex items-center text-gray-900 transition-all duration-150 ease-out hover:scale-105 antialiased"
          style={{ 
            color: undefined 
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = themeColors.cssVars.primary.base}
          onMouseLeave={(e) => e.currentTarget.style.color = ''}
          aria-label="Go to homepage"
        >
          {/* Mobile - Use favicon */}
          <img
            src={getFaviconUrl(settings?.favicon || undefined)}
            alt="Logo"
            width={32}
            height={32}
            className="h-8 w-8 sm:hidden rounded-lg"
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
              width={40}
              height={40}
              className="hidden sm:block h-10 w-auto rounded-lg"
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
        
        {/* Header Title - Centered */}
        <div className='absolute left-1/2 -translate-x-1/2'>
          <button
            onClick={() => {
              setActiveTab('welcome');
              setCurrentView('welcome');
              router.push('/help-center', { scroll: false });
            }}
            className="group transition-all duration-150 ease-out hover:scale-105"
          >
            <h1 
              className="text-lg sm:text-xl font-medium text-gray-900 tracking-[-0.02em] antialiased relative transition-colors"
              style={{
                color: undefined
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = themeColors.cssVars.primary.base}
              onMouseLeave={(e) => e.currentTarget.style.color = ''}
            >
              {getHeaderTitle()}
              <span 
                className="absolute -bottom-1 sm:-bottom-2 left-1/2 -translate-x-1/2 w-16 h-1 rounded-full group-hover:w-20 transition-all duration-150" 
                style={{ backgroundColor: themeColors.cssVars.primary.base }}
              />
            </h1>
          </button>
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
      <div className="flex-1 overflow-y-auto relative">
        {/* Glass background container */}
        <div className="absolute inset-0 bg-white/60 backdrop-blur-3xl pointer-events-none"
          style={{
            backdropFilter: 'blur(24px) saturate(200%) brightness(105%)',
            WebkitBackdropFilter: 'blur(24px) saturate(200%) brightness(105%)',
          }}
        />
        
        {/* Content */}
        <div className="relative min-h-full">
          {renderCurrentView()}
        </div>
      </div>
    </div>
  );
}
