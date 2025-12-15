'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Mail, Users, BarChart3 } from 'lucide-react';
import Button from '@/ui/Button';
import CampaignsList from './CampaignsList';
import ListsManager from './ListsManager';
import SubscriberImporter from './SubscriberImporter';
import CampaignComposer from './CampaignComposer';
import CampaignDetailModal from './CampaignDetailModal';
import AnalyticsDashboard from './AnalyticsDashboard';
import SchedulingCalendar from './SchedulingCalendar';

type TabType = 'campaigns' | 'lists' | 'analytics' | 'calendar';

interface MarketingViewProps {
  primary: { base: string; hover: string };
  globalSearchQuery?: string;
  onMobileActionsChange?: (actions: React.ReactNode) => void;
}

export default function MarketingView({ primary, globalSearchQuery = '', onMobileActionsChange }: MarketingViewProps) {
  const [activeTab, setActiveTab] = useState<TabType>('campaigns');
  const [showComposer, setShowComposer] = useState(false);
  const [editingCampaignId, setEditingCampaignId] = useState<number | null>(null);
  const [viewingCampaignId, setViewingCampaignId] = useState<number | null>(null);

  // Provide action button for footer panel (only in campaigns tab)
  useEffect(() => {
    if (onMobileActionsChange && activeTab === 'campaigns') {
      onMobileActionsChange(
        <div className="flex lg:justify-end">
          <Button
            onClick={() => setShowComposer(true)}
            variant="primary"
            size="sm"
            className="w-full lg:w-auto flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Campaign
          </Button>
        </div>
      );
    } else if (onMobileActionsChange) {
      onMobileActionsChange(null);
    }
    return () => {
      if (onMobileActionsChange) {
        onMobileActionsChange(null);
      }
    };
  }, [activeTab, onMobileActionsChange]);

  const tabs = [
    { id: 'campaigns' as const, label: 'Campaigns', icon: Mail },
    { id: 'lists' as const, label: 'Lists & Subscribers', icon: Users },
    { id: 'calendar' as const, label: 'Schedule', icon: BarChart3 },
    { id: 'analytics' as const, label: 'Analytics', icon: BarChart3 },
  ];

  return (
    <div className="h-full flex flex-col p-3 sm:p-4 lg:p-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-4 sm:mb-6">
        <div className="flex gap-1 sm:gap-2 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 lg:px-4 py-2 sm:py-3 border-b-2 transition-all font-medium whitespace-nowrap min-h-[44px] ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="text-xs sm:text-sm lg:text-base">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'campaigns' && (
          <CampaignsList
            primary={primary}
            searchQuery={globalSearchQuery}
            onCreateCampaign={() => setShowComposer(true)}
            onViewCampaign={(id) => setViewingCampaignId(id)}
            onEditCampaign={(id) => { setEditingCampaignId(id); setShowComposer(true); }}
          />
        )}
        {activeTab === 'lists' && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
            <ListsManager primary={primary} searchQuery={globalSearchQuery} />
            <SubscriberImporter primary={primary} />
          </div>
        )}
        {activeTab === 'calendar' && (
          <SchedulingCalendar
            primary={primary}
            onViewCampaign={(id) => setViewingCampaignId(id)}
            onEditCampaign={(id) => { setEditingCampaignId(id); setShowComposer(true); }}
          />
        )}
        {activeTab === 'analytics' && <AnalyticsDashboard primary={primary} />}
      </div>

      {/* Modals */}
      {showComposer && (
        <CampaignComposer
          primary={primary}
          onClose={() => { setShowComposer(false); setEditingCampaignId(null); }}
          editingCampaignId={editingCampaignId}
        />
      )}

      {viewingCampaignId && (
        <CampaignDetailModal
          campaignId={viewingCampaignId}
          onClose={() => setViewingCampaignId(null)}
          onEdit={(id) => { setViewingCampaignId(null); setEditingCampaignId(id); setShowComposer(true); }}
          primary={primary}
        />
      )}
    </div>
  );
}
