// components/ChatHelpWidget/AIAgentTab.tsx
'use client';
import { SparklesIcon, ArrowRightIcon, CheckIcon } from '@heroicons/react/24/outline';
import { WidgetSize } from '../ChatWidget/types';
import { useHelpCenterTranslations } from './useHelpCenterTranslations';

interface AIAgentTabProps {
  isAuthenticated: boolean;
  userId: string | null;
  accessToken: string | null;
  size: WidgetSize;
  goToLogin: () => void;
  goToRegister: () => void;
  onSwitchToChatWidget?: (forceFullscreen?: boolean) => void;
}

interface AIMessage {
  id: number;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

interface AIMessage {
  id: number;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

export default function AIAgentTab({
  isAuthenticated,
  userId,
  accessToken,
  size,
  goToLogin,
  goToRegister,
  onSwitchToChatWidget,
}: AIAgentTabProps) {
  const { t } = useHelpCenterTranslations();

  const aiCapabilities = [
    {
      title: t.executeMainTasks,
      description: t.executeMainTasksDesc,
      icon: '⚡'
    },
    {
      title: t.fillContent,
      description: t.fillContentDesc,
      icon: '✍️'
    },
    {
      title: t.manageAccount,
      description: t.manageAccountDesc,
      icon: '⚙️'
    }
  ];

  const handleSwitchToChatWidget = () => {
    if (onSwitchToChatWidget) {
      // Simple logic: 
      // - If current size is 'initial' (default help center) → Force fullscreen
      // - If current size is 'half' or 'fullscreen' (expanded widget) → Keep current size
      const shouldForceFullscreen = size === 'initial';
      onSwitchToChatWidget(shouldForceFullscreen);
    }
  };

  return (
    <div className={`h-full flex flex-col ${size === 'fullscreen' ? 'max-w-4xl mx-auto' : ''}`}>
      {!isAuthenticated ? (
        <div className="h-full flex flex-col items-center justify-center p-6 sm:p-8 text-center">
          <div className="p-6 bg-gradient-to-br from-blue-50 to-slate-50 rounded-2xl mb-6 shadow-sm border border-slate-200">
            <SparklesIcon className="h-12 w-12 text-blue-500" />
          </div>
          <h3 className="text-xl font-semibold text-slate-800 mb-3">{t.loginRequired}</h3>
          <p className="text-slate-600 mb-8 max-w-sm leading-relaxed">
            {t.pleaseLogin}
          </p>
          <div className="space-y-3 w-full max-w-xs">
            <button
              onClick={goToLogin}
              className="w-full bg-blue-500 text-white px-6 py-3 rounded-xl hover:bg-blue-600 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
            >
              {t.login}
            </button>
            <button
              onClick={goToRegister}
              className="w-full bg-slate-500 text-white px-6 py-3 rounded-xl hover:bg-slate-600 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
            >
              {t.signup}
            </button>
          </div>
        </div>
      ) : (
        <div className="h-full flex flex-col items-center justify-center p-6 sm:p-8 text-center space-y-8">
          {/* AI Agent Header */}
          <div className="text-center space-y-6 w-full max-w-md">
            {/* Benefits Card */}
            <div className="p-5 bg-gradient-to-br from-blue-50 to-slate-50 rounded-2xl shadow-sm border border-slate-200">
              <p className="text-sm text-slate-700 leading-relaxed">
                {t.aiAgentBenefits}
              </p>
            </div>
            
            {/* Switch Button - Enhanced Design */}
            <div className="relative group">
              {/* Glow effect on hover */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl blur opacity-30 group-hover:opacity-50 transition duration-300"></div>
              
              <button
                onClick={handleSwitchToChatWidget}
                className="relative w-full bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 text-white px-8 py-4 rounded-xl hover:from-blue-600 hover:via-blue-700 hover:to-blue-800 transition-all duration-200 font-semibold flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <SparklesIcon className="h-5 w-5 animate-pulse" />
                <span className="text-base">{t.switchToAIAgentMode}</span>
                <ArrowRightIcon className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
              </button>
            </div>
          </div>

          {/* AI Capabilities */}
          <div className="w-full max-w-md space-y-5">
            <h3 className="text-lg font-semibold text-slate-800">{t.aiAgentsCanHelp}</h3>
            <div className="space-y-3">
              {aiCapabilities.map((capability, index) => (
                <div 
                  key={index} 
                  className="flex items-start gap-3 p-4 bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-all duration-200 hover:border-blue-200"
                >
                  <span className="text-2xl flex-shrink-0">{capability.icon}</span>
                  <div className="flex-1 text-left">
                    <h4 className="font-medium text-slate-800 mb-1">{capability.title}</h4>
                    <p className="text-sm text-slate-600 leading-relaxed">{capability.description}</p>
                  </div>
                  <CheckIcon className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
