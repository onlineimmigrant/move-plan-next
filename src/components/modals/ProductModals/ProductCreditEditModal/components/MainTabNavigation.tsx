'use client';

import React from 'react';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Package, Archive, CreditCard, Sparkles } from 'lucide-react';

export type MainTab = 'products' | 'features' | 'inventory' | 'stripe';

interface MainTabNavigationProps {
  activeTab: MainTab;
  onTabChange: (tab: MainTab) => void;
}

export default function MainTabNavigation({
  activeTab,
  onTabChange,
}: MainTabNavigationProps) {
  const themeColors = useThemeColors();
  const primary = themeColors.cssVars.primary;

  const tabs = [
    { id: 'products' as const, label: 'Products', icon: Package },
    { id: 'features' as const, label: 'Features', icon: Sparkles },
    { id: 'inventory' as const, label: 'Inventory', icon: Archive },
    { id: 'stripe' as const, label: 'Stripe', icon: CreditCard },
  ];

  return (
    <div className="px-6 py-4 border-b border-slate-200/50 bg-transparent">
      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full font-medium text-sm transition-all duration-200 whitespace-nowrap shadow-sm"
              style={
                isActive
                  ? {
                      background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`,
                      color: 'white',
                      boxShadow: `0 4px 12px ${primary.base}40`,
                    }
                  : {
                      backgroundColor: 'transparent',
                      color: primary.base,
                      border: '1px solid',
                      borderColor: `${primary.base}40`,
                    }
              }
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
