'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useHelpCenterTranslations } from './modals/ChatHelpWidget/useHelpCenterTranslations';
import ChatHelpToggleButton from './modals/ChatHelpWidget/ChatHelpToggleButton';
import ChatHelpHeader from './modals/ChatHelpWidget/ChatHelpHeader';
import ChatHelpTabs from './modals/ChatHelpWidget/ChatHelpTabs';
import WelcomeTab from './modals/ChatHelpWidget/WelcomeTab';
import ConversationTab from './modals/ChatHelpWidget/ConversationTab';
import ArticlesTab from './modals/ChatHelpWidget/ArticlesTab';
import AIAgentTab from './modals/ChatHelpWidget/AIAgentTab';
import FAQView from './modals/ChatHelpWidget/FAQView';
import FeaturesView from './modals/ChatHelpWidget/FeaturesView';
import ChatWidget from './modals/ChatWidget/ChatWidget';
import { WidgetSize } from './modals/ChatWidget/types';
import styles from './modals/ChatWidget/ChatWidget.module.css';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const WIDGET_STATE_KEY = 'chatHelpWidget_state';
const WIDGET_MODE_KEY = 'chatWidget_mode'; // 'help' or 'chat'

export default function ChatHelpWidget() {
  const { t, getSafeTranslation } = useHelpCenterTranslations();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'welcome' | 'conversation' | 'ai'>('welcome');
  const [currentView, setCurrentView] = useState<'welcome' | 'conversation' | 'articles' | 'ai' | 'faq' | 'knowledge-base' | 'live-support' | 'features'>('welcome');
  const [size, setSize] = useState<WidgetSize>('initial');
  const [isMobile, setIsMobile] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showChatWidget, setShowChatWidget] = useState(false);
  const [sizeBeforeChatSwitch, setSizeBeforeChatSwitch] = useState<WidgetSize>('initial');
  const [chatWidgetSize, setChatWidgetSize] = useState<WidgetSize>('initial');
  const [isScrolled, setIsScrolled] = useState(false);
  const router = useRouter();

  // Detect scroll on mobile to show/hide widget
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollPosition = window.scrollY;
          const scrollThreshold = 100; // Show after scrolling 100px
          setIsScrolled(scrollPosition > scrollThreshold);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Check stored widget mode on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedMode = localStorage.getItem(WIDGET_MODE_KEY);
      if (storedMode === 'chat') {
        setShowChatWidget(true);
      }
    }
  }, []);

  // Listen for localStorage changes to react to external switches
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === WIDGET_MODE_KEY || e.key === 'chatWidget_isOpen') {
        if (e.key === WIDGET_MODE_KEY && e.newValue === 'chat') {
          setShowChatWidget(true);
          setIsOpen(true);
        }
        if (e.key === 'chatWidget_isOpen' && e.newValue === 'true') {
          setIsOpen(true);
        }
      }
    };

    // Also listen for custom storage events (for same-window changes)
    const handleCustomStorageChange = (e: CustomEvent) => {
      if (e.detail.key === WIDGET_MODE_KEY && e.detail.newValue === 'chat') {
        setShowChatWidget(true);
        setIsOpen(true);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('customStorageChange', handleCustomStorageChange as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('customStorageChange', handleCustomStorageChange as EventListener);
    };
  }, []);

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
        // Only log actual errors, not missing sessions (which is normal for unauthenticated users)
        if (error) {
          console.error('Client auth error:', error.message);
        }
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
    initial: 'w-[400px] h-[750px] bottom-4 right-4 sm:bottom-8 sm:right-8',
    half: isMobile ? styles.mobileHalfContainer : 'w-1/2 h-[750px] bottom-4 right-4 sm:bottom-8 sm:right-8',
    fullscreen: isMobile ? 'top-6 right-4 bottom-10 left-4' : styles.fullscreenContainer,
  };

  const handleTabChange = (tab: 'welcome' | 'conversation' | 'ai') => {
    // Allow navigation to all tabs - authentication check handled within each tab component
    setActiveTab(tab);
    setCurrentView(tab);
    setError(null);
  };

  const handleSpecialView = (view: 'faq' | 'knowledge-base' | 'live-support' | 'features') => {
    setCurrentView(view);
  };

  const goToLogin = () => {
    router.push('/login');
  };

  const goToSignup = () => {
    router.push('/register');
  };

  const handleSwitchToChatWidget = (forceFullscreen = false) => {
    // Store current size before switching to chat widget
    setSizeBeforeChatSwitch(size);
    
    // Calculate the target size for ChatWidget
    const targetChatWidgetSize = forceFullscreen ? 'fullscreen' : size;
    
    // Set the ChatWidget size (separate from help center size)
    setChatWidgetSize(targetChatWidgetSize);
    
    // Ensure the widget is opened when switching to ChatWidget
    setIsOpen(true);
    setShowChatWidget(true);
    
    // Keep the help center size unchanged for when we return
    // (Don't change the 'size' state here)
    
    // Clear any stored ChatWidget closed state after setting the states
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('chatWidget_isOpen'); // Remove old state
        localStorage.setItem('chatWidget_isOpen', 'true'); // Force open
      }
    }, 0);
    
    // Save the chat mode preference
    if (typeof window !== 'undefined') {
      localStorage.setItem(WIDGET_MODE_KEY, 'chat');
    }
  };

  const handleReturnToHelpCenter = () => {
    setShowChatWidget(false);
    // Restore the size that was used before switching to chat widget
    setSize(sizeBeforeChatSwitch);
    // Save the help mode preference
    if (typeof window !== 'undefined') {
      localStorage.setItem(WIDGET_MODE_KEY, 'help');
    }
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
            onShowFeatures={() => handleSpecialView('features')}
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
      case 'features':
        return (
          <FeaturesView
            size={size}
            onBack={() => setCurrentView('welcome')}
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
            onSwitchToChatWidget={handleSwitchToChatWidget}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className={`${showChatWidget ? 'z-[10000003]' : 'z-[9997]'} transition-opacity duration-300`}>
      {showChatWidget ? (
        // Show ChatWidget when in AI Agent mode - it manages its own state
        // Use key to force re-initialization when switching
        <ChatWidget 
          key="chat-widget-open"
          onReturnToHelpCenter={handleReturnToHelpCenter} 
          initialSize={chatWidgetSize}
          initialOpen={true}
          forceHighZIndex={true}
        />
      ) : (
        // Show ChatHelpWidget normally
        <>
          <ChatHelpToggleButton isOpen={isOpen} toggleOpen={() => setIsOpen(!isOpen)} />
          {isOpen && (
            <div
              className={`z-[9999] fixed min-h-[480px] backdrop-blur-2xl bg-white/50 dark:bg-gray-900/50 border-0 rounded-2xl shadow-lg flex flex-col overflow-hidden transition-all duration-300 ease-out ${sizeClasses[size]}`}
              role="dialog"
              aria-labelledby="help-center-title"
              aria-modal="true"
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
              <ChatHelpTabs
                activeTab={activeTab}
                onTabChange={handleTabChange}
                isAuthenticated={isAuthenticated}
              />
              <div className="flex-1 overflow-y-auto overflow-x-hidden">
                {renderActiveTab()}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
