'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import ChatHelpToggleButton from './ChatHelpWidget/ChatHelpToggleButton';
import ChatHelpHeader from './ChatHelpWidget/ChatHelpHeader';
import ChatHelpTabs from './ChatHelpWidget/ChatHelpTabs';
import WelcomeTab from './ChatHelpWidget/WelcomeTab';
import ConversationTab from './ChatHelpWidget/ConversationTab';
import ArticlesTab from './ChatHelpWidget/ArticlesTab';
import AIAgentTab from './ChatHelpWidget/AIAgentTab';
import FAQView from './ChatHelpWidget/FAQView';
import { WidgetSize } from './ChatWidget/types';
import styles from './ChatWidget/ChatWidget.module.css';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const WIDGET_STATE_KEY = 'chatHelpWidget_state';

export default function ChatHelpWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'welcome' | 'conversation' | 'ai'>('welcome');
  const [currentView, setCurrentView] = useState<'welcome' | 'conversation' | 'articles' | 'ai' | 'faq' | 'knowledge-base' | 'live-support'>('welcome');
  const [size, setSize] = useState<WidgetSize>('initial');
  const [isMobile, setIsMobile] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 640;
      setIsMobile(mobile);
      setSize(mobile ? 'half' : 'initial');
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session?.user) {
        setIsAuthenticated(false);
        setAccessToken(null);
        setUserId(null);
        console.error('Client auth error:', error?.message || 'No session found');
      } else {
        setIsAuthenticated(true);
        setAccessToken(session.access_token);
        setUserId(session.user.id);
        console.log('Client access token:', session.access_token);
      }
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session?.user);
      setAccessToken(session?.access_token || null);
      setUserId(session?.user?.id || null);
      console.log('Auth state changed, access token:', session?.access_token);
    });

    return () => subscription.unsubscribe();
  }, []);

  const toggleSize = () => {
    setSize((prev) => {
      if (isMobile) {
        return prev === 'half' ? 'fullscreen' : 'half';
      }
      return prev === 'initial' ? 'half' : prev === 'half' ? 'fullscreen' : 'initial';
    });
  };

  const sizeClasses = {
    initial: 'w-[400px] h-[750px] bottom-8 right-4',
    half: isMobile ? styles.mobileHalfContainer : 'w-1/2 h-[750px] bottom-8 right-4',
    fullscreen: styles.fullscreenContainer,
  };

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

  // Save widget state before language changes
  const saveWidgetState = () => {
    if (typeof window !== 'undefined') {
      const state = {
        isOpen,
        size,
        activeTab,
        currentView,
        timestamp: Date.now()
      };
      sessionStorage.setItem(WIDGET_STATE_KEY, JSON.stringify(state));
    }
  };

  // Restore widget state after language changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedState = sessionStorage.getItem(WIDGET_STATE_KEY);
      if (savedState) {
        try {
          const state = JSON.parse(savedState);
          // Only restore if state is recent (within 5 seconds)
          if (Date.now() - state.timestamp < 5000) {
            setIsOpen(state.isOpen);
            setSize(state.size);
            setActiveTab(state.activeTab);
            setCurrentView(state.currentView);
          }
          // Clear the state after restoring
          sessionStorage.removeItem(WIDGET_STATE_KEY);
        } catch (error) {
          console.error('Error restoring widget state:', error);
        }
      }
    }
  }, []);

  const handleLanguageChange = (newLocale: string) => {
    // Save current widget state
    saveWidgetState();
    
    // Navigate to new locale
    const currentPath = window.location.pathname;
    const segments = currentPath.split('/');
    const pathWithoutLocale = segments.length > 2 && segments[1].length === 2 
      ? segments.slice(2).join('/') 
      : segments.slice(1).join('/');
    
    const newPath = pathWithoutLocale ? `/${newLocale}/${pathWithoutLocale}` : `/${newLocale}`;
    router.push(newPath);
  };

  const renderActiveTab = () => {
    switch (currentView) {
      case 'welcome':
        return (
          <WelcomeTab
            onTabChange={handleTabChange}
            size={size}
            onShowFAQ={() => handleSpecialView('faq')}
            onShowKnowledgeBase={() => handleSpecialView('knowledge-base')}
            onShowLiveSupport={() => handleSpecialView('live-support')}
          />
        );
      case 'conversation':
      case 'live-support':
        return (
          <ConversationTab
            isAuthenticated={isAuthenticated}
            userId={userId}
            accessToken={accessToken}
            size={size}
          />
        );
      case 'faq':
        return (
          <FAQView
            size={size}
            onBack={() => setCurrentView('welcome')}
          />
        );
      case 'knowledge-base':
        return (
          <ArticlesTab
            size={size}
            showBackButton={true}
            onBack={() => setCurrentView('welcome')}
            onBackToHelpCenter={() => setCurrentView('welcome')}
          />
        );
      case 'ai':
        return (
          <AIAgentTab
            isAuthenticated={isAuthenticated}
            userId={userId}
            accessToken={accessToken}
            size={size}
            goToLogin={goToLogin}
            goToRegister={goToSignup}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="z-62">
      <ChatHelpToggleButton isOpen={isOpen} toggleOpen={() => setIsOpen(!isOpen)} />
      {isOpen && (
        <div
          className={`z-63 fixed min-h-[480px] bg-white border-2 border-gray-200 rounded-lg shadow-sm flex flex-col transition-all duration-300 ${sizeClasses[size]}`}
        >
          <ChatHelpHeader
            size={size}
            toggleSize={toggleSize}
            closeWidget={() => setIsOpen(false)}
            isMobile={isMobile}
            currentView={currentView}
            onLanguageChange={handleLanguageChange}
          />
          {error && (
            <div className="text-red-500 mb-2 px-4 py-2 bg-red-50 border-b border-red-200">
              {error}
            </div>
          )}
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            {renderActiveTab()}
          </div>
          <ChatHelpTabs
            activeTab={activeTab}
            onTabChange={handleTabChange}
            isAuthenticated={isAuthenticated}
          />
        </div>
      )}
    </div>
  );
}
