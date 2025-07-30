// components/ChatHelpWidget/AIAgentTab.tsx
'use client';
import { useState, useRef, useEffect } from 'react';
import { PaperAirplaneIcon, SparklesIcon, UserIcon, ArrowRightIcon, CheckIcon } from '@heroicons/react/24/outline';
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
        <div className="h-full flex flex-col items-center justify-center p-4 sm:p-6 text-center">
          <div className="p-4 bg-sky-100 rounded-full mb-4">
            <SparklesIcon className="h-8 w-8 text-sky-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">{t.loginRequired}</h3>
          <p className="text-gray-600 mb-6 max-w-sm">
            {t.pleaseLogin}
          </p>
          <div className="space-y-3 w-full max-w-xs">
            <button
              onClick={goToLogin}
              className="w-full bg-sky-500 text-white px-4 py-2 rounded-lg hover:bg-sky-600 transition-colors font-medium"
            >
              {t.login}
            </button>
            <button
              onClick={goToRegister}
              className="w-full bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors font-medium"
            >
              {t.signup}
            </button>
          </div>
        </div>
      ) : (
        <div className="h-full flex flex-col items-center justify-center p-4 sm:p-6 text-center space-y-6">
          {/* AI Agent Header */}
          <div className="text-center space-y-4">

        {/* Benefits */}
          <div className="w-full max-w-md p-4 bg-sky-50 rounded-lg border border-sky-200">
            <p className="text-sm text-sky-800 leading-relaxed">
              {t.aiAgentBenefits}
            </p>
          </div>
                    {/* Switch Button */}
          <button
            onClick={handleSwitchToChatWidget}
            className="w-full max-w-md bg-gradient-to-r from-sky-500 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-sky-600 hover:to-blue-700 transition-all duration-200 font-medium flex items-center justify-center space-x-2 shadow-lg"
          >
            <span>{t.switchToAIAgentMode}</span>
            <ArrowRightIcon className="h-5 w-5" />
          </button>
          </div>

          {/* AI Capabilities */}
          <div className="w-full max-w-md space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">{t.aiAgentsCanHelp}</h3>
            <div className="space-y-3">
              {aiCapabilities.map((capability, index) => (
                <div key={index} className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <span className="text-2xl">{capability.icon}</span>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-800">{capability.title}</h4>
                    <p className="text-sm text-gray-600">{capability.description}</p>
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
