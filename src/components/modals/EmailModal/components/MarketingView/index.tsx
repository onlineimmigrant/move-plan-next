'use client';

import React, { useState } from 'react';
import CampaignsList from './CampaignsList';
import ListsManager from './ListsManager';
import SubscriberImporter from './SubscriberImporter';
import { Mail, Users, BarChart3 } from 'lucide-react';

type TabType = 'campaigns' | 'lists' | 'analytics';

interface MarketingViewProps {
  primary: { base: string; hover: string };
  globalSearchQuery?: string;
}

export default function MarketingView({ primary, globalSearchQuery = '' }: MarketingViewProps) {
  const [activeTab, setActiveTab] = useState<TabType>('campaigns');

  const tabs = [
    { id: 'campaigns' as const, label: 'Campaigns', icon: Mail },
    { id: 'lists' as const, label: 'Lists & Subscribers', icon: Users },
    { id: 'analytics' as const, label: 'Analytics', icon: BarChart3 },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <div className="flex gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all font-medium ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'campaigns' && <CampaignsList primary={primary} searchQuery={globalSearchQuery} />}
        {activeTab === 'lists' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ListsManager primary={primary} searchQuery={globalSearchQuery} />
            <SubscriberImporter primary={primary} />
          </div>
        )}
        {activeTab === 'analytics' && (
          <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl rounded-xl border border-white/20 p-12 text-center">
            <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Campaign Analytics
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Detailed analytics and reporting coming soon
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
