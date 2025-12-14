'use client';

import React, { useState } from 'react';
import { useCampaigns } from '../../hooks/useCampaigns';
import { useEmailLists } from '../../hooks/useEmailLists';
import { 
  Plus,
  Search,
  Filter,
  Mail,
  Users,
  Calendar,
  BarChart3,
  Send,
  Pause,
  Play,
  Trash2,
  Eye
} from 'lucide-react';
import { LoadingState, EmptyState } from '@/components/modals/ShopModal/components';

interface CampaignsListProps {
  primary: { base: string; hover: string };
  searchQuery?: string;
}

export default function CampaignsList({ primary, searchQuery = '' }: CampaignsListProps) {
  const { campaigns, isLoading, deleteCampaign, sendCampaign } = useCampaigns();
  const { lists } = useEmailLists();
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedCampaign, setSelectedCampaign] = useState<number | null>(null);

  const getStatusColor = (status: string) => {
    const colors = {
      draft: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-700',
      scheduled: 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
      sending: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
      sent: 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800',
      paused: 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800',
    };
    return colors[status as keyof typeof colors] || colors.draft;
  };

  const getListName = (listId: number | null) => {
    if (!listId) return 'No list';
    const list = lists.find((l) => l.id === listId);
    return list?.name || 'Unknown list';
  };

  const filteredCampaigns = campaigns
    .filter((campaign) => {
      if (statusFilter !== 'all' && campaign.status !== statusFilter) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          campaign.name.toLowerCase().includes(query) ||
          campaign.subject.toLowerCase().includes(query)
        );
      }
      return true;
    });

  const handleSend = async (id: number) => {
    if (confirm('Are you sure you want to send this campaign?')) {
      await sendCampaign(id);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this campaign?')) {
      await deleteCampaign(id);
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading campaigns..." />;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Email Campaigns
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Create and manage marketing email campaigns
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="scheduled">Scheduled</option>
            <option value="sending">Sending</option>
            <option value="sent">Sent</option>
            <option value="paused">Paused</option>
          </select>
        </div>
      </div>

      {/* Campaigns List */}
      {filteredCampaigns.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredCampaigns.map((campaign) => (
            <div
              key={campaign.id}
              className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl rounded-xl border border-white/20 p-4 hover:bg-white/60 dark:hover:bg-gray-800/60 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                      {campaign.name}
                    </h4>
                    <span className={`px-2 py-0.5 text-xs rounded-full border ${getStatusColor(campaign.status)}`}>
                      {campaign.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                    {campaign.subject}
                  </p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 mb-3 py-3 border-y border-gray-200 dark:border-gray-700">
                <div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500 mb-1">
                    <Users className="w-3 h-3" />
                    Recipients
                  </div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {campaign.total_recipients.toLocaleString()}
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500 mb-1">
                    <Send className="w-3 h-3" />
                    Sent
                  </div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {campaign.total_sent.toLocaleString()}
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500 mb-1">
                    <Eye className="w-3 h-3" />
                    Opens
                  </div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {campaign.total_opened.toLocaleString()}
                    {campaign.total_sent > 0 && (
                      <span className="text-xs text-gray-500 ml-1">
                        ({Math.round((campaign.total_opened / campaign.total_sent) * 100)}%)
                      </span>
                    )}
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500 mb-1">
                    <BarChart3 className="w-3 h-3" />
                    Clicks
                  </div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {campaign.total_clicked.toLocaleString()}
                    {campaign.total_sent > 0 && (
                      <span className="text-xs text-gray-500 ml-1">
                        ({Math.round((campaign.total_clicked / campaign.total_sent) * 100)}%)
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Meta Info */}
              <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-500 mb-3">
                <div className="flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  {getListName(campaign.list_id)}
                </div>
                {campaign.scheduled_at && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(campaign.scheduled_at).toLocaleDateString()}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                {campaign.status === 'draft' && (
                  <button
                    onClick={() => handleSend(campaign.id)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg transition-colors font-medium"
                    style={{
                      background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`,
                      color: 'white'
                    }}
                  >
                    <Send className="w-3 h-3" />
                    Send
                  </button>
                )}
                {campaign.status === 'paused' && (
                  <button className="flex items-center gap-1 px-3 py-1.5 text-xs bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium">
                    <Play className="w-3 h-3" />
                    Resume
                  </button>
                )}
                {campaign.status === 'sending' && (
                  <button className="flex items-center gap-1 px-3 py-1.5 text-xs bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors font-medium">
                    <Pause className="w-3 h-3" />
                    Pause
                  </button>
                )}
                <button className="flex items-center gap-1 px-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors font-medium">
                  <Eye className="w-3 h-3" />
                  View
                </button>
                <button
                  onClick={() => handleDelete(campaign.id)}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors font-medium"
                >
                  <Trash2 className="w-3 h-3" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl rounded-xl border border-white/20 p-12 text-center">
          <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {searchQuery || statusFilter !== 'all' ? 'No campaigns found' : 'No campaigns yet'}
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {searchQuery || statusFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Create your first marketing campaign to get started'}
          </p>
          {!searchQuery && statusFilter === 'all' && (
            <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium" style={{
              background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`,
              color: 'white'
            }}>
              <Plus className="w-4 h-4" />
              Create Campaign
            </button>
          )}
        </div>
      )}
    </div>
  );
}
