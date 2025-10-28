// components/ChatHelpWidget/AIAgentTab.tsx
'use client';
import { SparklesIcon, ArrowRightIcon, BoltIcon, PencilSquareIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { WidgetSize } from '../ChatWidget/types';
import { useHelpCenterTranslations } from './useHelpCenterTranslations';
import { useThemeColors } from '@/hooks/useThemeColors';

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

interface AICapability {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
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
  const themeColors = useThemeColors();

  const aiCapabilities: AICapability[] = [
    {
      title: t.executeMainTasks,
      description: t.executeMainTasksDesc,
      icon: BoltIcon
    },
    {
      title: t.fillContent,
      description: t.fillContentDesc,
      icon: PencilSquareIcon
    },
    {
      title: t.manageAccount,
      description: t.manageAccountDesc,
      icon: Cog6ToothIcon
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
          {/* Icon Container - Rounded Full */}
          <div 
            className="w-20 h-20 rounded-full mb-6 shadow-lg flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${themeColors.cssVars.primary.lighter}40, ${themeColors.cssVars.primary.lighter}80)`
            }}
          >
            <SparklesIcon 
              className="h-10 w-10"
              style={{ color: themeColors.cssVars.primary.base }}
            />
          </div>
          <h3 className="text-xl font-semibold text-slate-800 mb-3">{t.loginRequired}</h3>
          <p className="text-slate-600 mb-8 max-w-sm leading-relaxed">
            {t.pleaseLogin}
          </p>
          <div className="space-y-3 w-full max-w-xs">
            <button
              onClick={goToLogin}
              className="w-full text-white px-6 py-3 rounded-xl transition-all duration-200 font-medium shadow-sm hover:shadow-md"
              style={{ backgroundColor: themeColors.cssVars.primary.base }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = themeColors.cssVars.primary.hover}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = themeColors.cssVars.primary.base}
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
          {/* AI Capabilities - Glass Effect Cards */}
          <div className="w-full max-w-md space-y-6">
            <h3 className="text-lg font-semibold text-slate-800">{t.aiAgentBenefits}</h3>
            <div className="space-y-3">
              {aiCapabilities.map((capability, index) => {
                const Icon = capability.icon;
                return (
                  <div key={index} className="group relative">
                    {/* Glass backdrop */}
                    <div 
                      className="absolute inset-0 bg-white/60 backdrop-blur-2xl rounded-3xl group-hover:bg-white/80 group-hover:shadow-xl transition-all duration-300"
                      style={{
                        backdropFilter: 'blur(24px) saturate(200%)',
                        WebkitBackdropFilter: 'blur(24px) saturate(200%)',
                      }}
                    />
                    {/* Hover gradient */}
                    <div 
                      className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{
                        background: `linear-gradient(135deg, ${themeColors.cssVars.primary.lighter}30, white 20%, ${themeColors.cssVars.primary.lighter}20)`
                      }}
                    />
                    {/* Content */}
                    <div className="relative flex items-start gap-4 p-6">
                      {/* Icon Circle */}
                      <div 
                        className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center shadow-sm"
                        style={{ backgroundColor: `${themeColors.cssVars.primary.lighter}60` }}
                      >
                        <Icon 
                          className="h-6 w-6"
                          style={{ color: themeColors.cssVars.primary.base }}
                        />
                      </div>
                      {/* Text */}
                      <div className="flex-1 text-left pt-1">
                        <h4 className="font-medium text-slate-800 mb-1.5">{capability.title}</h4>
                        <p className="text-sm text-slate-600 leading-relaxed">{capability.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Switch Button - Rounded Full at Bottom */}
          <div className="w-full max-w-md">
            <button
              onClick={handleSwitchToChatWidget}
              className="w-full text-white px-6 py-3.5 rounded-full transition-all duration-300 font-medium flex items-center justify-center gap-2.5 shadow-md hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
              style={{
                backgroundColor: themeColors.cssVars.primary.base
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = themeColors.cssVars.primary.hover;
                e.currentTarget.style.transform = 'scale(1.02)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = themeColors.cssVars.primary.base;
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <SparklesIcon className="h-5 w-5 animate-pulse" />
              <span>{t.switchToAIAgentMode}</span>
              <ArrowRightIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
