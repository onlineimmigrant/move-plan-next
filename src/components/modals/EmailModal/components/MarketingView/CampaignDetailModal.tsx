'use client';

import React, { useState } from 'react';
import { X, Mail, Users, Calendar, Eye, Send, BarChart3, Edit, Trash2, Play, Pause, Copy } from 'lucide-react';
import Button from '@/ui/Button';
import { useCampaigns } from '../../hooks/useCampaigns';
import { useEmailLists } from '../../hooks/useEmailLists';

interface CampaignDetailModalProps {
  campaignId: number;
  onClose: () => void;
  onEdit?: (campaignId: number) => void;
  primary: { base: string; hover: string };
}

export default function CampaignDetailModal({ campaignId, onClose, onEdit, primary }: CampaignDetailModalProps) {
  const { campaigns, deleteCampaign, sendCampaign, updateCampaign, duplicateCampaign } = useCampaigns();
  const { lists } = useEmailLists();
  const [showPreview, setShowPreview] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'stats' | 'preview'>('details');

  const campaign = campaigns.find((c) => c.id === campaignId);
  if (!campaign) return null;

  const list = lists.find((l) => l.id === campaign.list_id);
  const openRate = campaign.total_sent > 0 ? (campaign.total_opened / campaign.total_sent) * 100 : 0;
  const clickRate = campaign.total_sent > 0 ? (campaign.total_clicked / campaign.total_sent) * 100 : 0;

  const getStatusColor = (status: string) => {
    const colors = {
      draft: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400',
      scheduled: 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400',
      sending: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400',
      sent: 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400',
      paused: 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400',
    };
    return colors[status as keyof typeof colors] || colors.draft;
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this campaign?')) {
      await deleteCampaign(campaignId);
      onClose();
    }
  };

  const handleSend = async () => {
    if (confirm(`Send this campaign to ${campaign.total_recipients} recipients?`)) {
      await sendCampaign(campaignId);
      onClose();
    }
  };

  const handlePause = async () => {
    await updateCampaign(campaignId, { status: 'paused' });
  };

  const handleResume = async () => {
    await updateCampaign(campaignId, { status: 'sending' });
  };

  const handleDuplicate = async () => {
    const result = await duplicateCampaign(campaignId);
    if (result) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white dark:bg-gray-900 rounded-none sm:rounded-2xl shadow-2xl w-full h-full sm:max-w-4xl sm:w-full sm:max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
              <h2 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white truncate">
                {campaign.name}
              </h2>
              <span className={`px-3 py-1 text-xs sm:text-sm rounded-full w-fit ${getStatusColor(campaign.status)}`}>
                {campaign.status}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              {campaign.subject}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center flex-shrink-0"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6">
          <div className="flex gap-2 sm:gap-4 overflow-x-auto scrollbar-hide">
            {[
              { id: 'details', label: 'Details', icon: Mail },
              { id: 'stats', label: 'Statistics', icon: BarChart3 },
              { id: 'preview', label: 'Preview', icon: Eye },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 border-b-2 transition-all font-medium whitespace-nowrap min-h-[44px] ${
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-600 dark:text-gray-400'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-xs sm:text-sm">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Details Tab */}
          {activeTab === 'details' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-sm text-gray-500 dark:text-gray-400">Campaign Name</label>
                  <p className="text-lg font-medium text-gray-900 dark:text-white">{campaign.name}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500 dark:text-gray-400">Subject Line</label>
                  <p className="text-lg font-medium text-gray-900 dark:text-white">{campaign.subject}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500 dark:text-gray-400">Recipient List</label>
                  <p className="text-lg font-medium text-gray-900 dark:text-white">
                    {list?.name || 'Unknown list'}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500 dark:text-gray-400">Total Recipients</label>
                  <p className="text-lg font-medium text-gray-900 dark:text-white">
                    {campaign.total_recipients.toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500 dark:text-gray-400">Created</label>
                  <p className="text-lg font-medium text-gray-900 dark:text-white">
                    {new Date(campaign.created_at).toLocaleDateString()}
                  </p>
                </div>
                {campaign.scheduled_at && (
                  <div>
                    <label className="text-sm text-gray-500 dark:text-gray-400">Scheduled For</label>
                    <p className="text-lg font-medium text-gray-900 dark:text-white">
                      {new Date(campaign.scheduled_at).toLocaleString()}
                    </p>
                  </div>
                )}
                {campaign.sent_at && (
                  <div>
                    <label className="text-sm text-gray-500 dark:text-gray-400">Sent At</label>
                    <p className="text-lg font-medium text-gray-900 dark:text-white">
                      {new Date(campaign.sent_at).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 dark:text-white mb-3">Quick Stats</h3>
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {campaign.total_sent.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Sent</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {campaign.total_opened.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Opened</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {campaign.total_clicked.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Clicked</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {openRate.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Open Rate</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Statistics Tab */}
          {activeTab === 'stats' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                {/* Performance Metrics */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-blue-500 rounded-lg">
                      <Eye className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-blue-600 dark:text-blue-400">Open Rate</p>
                      <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                        {openRate.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  <div className="text-sm text-blue-600 dark:text-blue-400">
                    {campaign.total_opened} of {campaign.total_sent} emails opened
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-green-500 rounded-lg">
                      <BarChart3 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-green-600 dark:text-green-400">Click Rate</p>
                      <p className="text-3xl font-bold text-green-700 dark:text-green-300">
                        {clickRate.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  <div className="text-sm text-green-600 dark:text-green-400">
                    {campaign.total_clicked} of {campaign.total_sent} emails clicked
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Engagement Breakdown</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600 dark:text-gray-400">Delivered</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {campaign.total_sent} ({campaign.total_recipients > 0 ? ((campaign.total_sent / campaign.total_recipients) * 100).toFixed(1) : 0}%)
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500"
                        style={{ width: `${campaign.total_recipients > 0 ? (campaign.total_sent / campaign.total_recipients) * 100 : 0}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600 dark:text-gray-400">Opened</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {campaign.total_opened} ({openRate.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500" style={{ width: `${openRate}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600 dark:text-gray-400">Clicked</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {campaign.total_clicked} ({clickRate.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-500" style={{ width: `${clickRate}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Preview Tab */}
          {activeTab === 'preview' && (
            <div className="h-full">
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden h-full">
                <iframe
                  srcDoc={`<!DOCTYPE html><html><head><style>* { box-sizing: border-box; margin: 0; padding: 0; }</style></head><body>${campaign.body}</body></html>`}
                  className="w-full h-full min-h-[500px]"
                  sandbox="allow-same-origin"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-2">
            {campaign.status === 'draft' && onEdit && (
              <Button onClick={() => onEdit(campaignId)} variant="light-outline">
                <Edit className="w-4 h-4" />
                Edit
              </Button>
            )}
            <Button onClick={handleDuplicate} variant="light-outline">
              <Copy className="w-4 h-4" />
              Duplicate
            </Button>
            <Button onClick={handleDelete} variant="danger">
              <Trash2 className="w-4 h-4" />
              Delete
            </Button>
          </div>

          <div className="flex gap-2">
            {campaign.status === 'draft' && (
              <Button onClick={handleSend} variant="primary">
                <Send className="w-4 h-4" />
                Send Now
              </Button>
            )}
            {campaign.status === 'sending' && (
              <Button onClick={handlePause} variant="primary">
                <Pause className="w-4 h-4" />
                Pause
              </Button>
            )}
            {campaign.status === 'paused' && (
              <Button onClick={handleResume} variant="primary">
                <Play className="w-4 h-4" />
                Resume
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
