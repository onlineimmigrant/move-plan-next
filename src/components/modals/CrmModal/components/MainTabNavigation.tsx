'use client';

import React from 'react';
import { useThemeColors } from '@/hooks/useThemeColors';
import {
  Users,
  UserCheck,
  Target,
  Users as UserGroup,
  Star,
  MessageSquare
} from 'lucide-react';
import { CrmTab } from '../types';

interface MainTabNavigationProps {
  activeTab: CrmTab;
  onTabChange: (tab: CrmTab) => void;
}

export function MainTabNavigation({
  activeTab,
  onTabChange,
}: MainTabNavigationProps) {
  const themeColors = useThemeColors();
  const primary = themeColors.cssVars.primary;

  const tabs = [
    { id: 'accounts' as const, label: 'Accounts', icon: Users },
    { id: 'customers' as const, label: 'Customers', icon: UserCheck },
    { id: 'leads' as const, label: 'Leads', icon: Target },
    { id: 'team-members' as const, label: 'Team Members', icon: UserGroup },
    { id: 'reviews' as const, label: 'Reviews', icon: Star },
    { id: 'testimonials' as const, label: 'Testimonials', icon: MessageSquare },
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
                      background: 'rgba(255, 255, 255, 0.1)',
                      color: 'rgba(0, 0, 0, 0.7)',
                      border: '1px solid rgba(0, 0, 0, 0.1)',
                    }
              }
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}