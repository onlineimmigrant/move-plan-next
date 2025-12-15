'use client';

import React, { useState, useMemo } from 'react';
import { useCampaigns } from '../../hooks/useCampaigns';
import { BarChart3, TrendingUp, Mail, Eye, MousePointer, Calendar, Download } from 'lucide-react';
import Button from '@/ui/Button';

interface AnalyticsDashboardProps {
  primary: { base: string; hover: string };
}

export default function AnalyticsDashboard({ primary }: AnalyticsDashboardProps) {
  const { campaigns } = useCampaigns();
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  const filteredCampaigns = useMemo(() => {
    const now = new Date();
    const cutoffDate = new Date();
    
    switch (dateRange) {
      case '7d':
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        cutoffDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        cutoffDate.setDate(now.getDate() - 90);
        break;
      default:
        return campaigns.filter((c) => c.status === 'sent');
    }

    return campaigns.filter((c) => {
      if (c.status !== 'sent') return false;
      if (!c.sent_at) return false;
      return new Date(c.sent_at) >= cutoffDate;
    });
  }, [campaigns, dateRange]);

  const stats = useMemo(() => {
    const totalCampaigns = filteredCampaigns.length;
    const totalSent = filteredCampaigns.reduce((sum, c) => sum + c.total_sent, 0);
    const totalOpened = filteredCampaigns.reduce((sum, c) => sum + c.total_opened, 0);
    const totalClicked = filteredCampaigns.reduce((sum, c) => sum + c.total_clicked, 0);
    
    const avgOpenRate = totalSent > 0 ? (totalOpened / totalSent) * 100 : 0;
    const avgClickRate = totalSent > 0 ? (totalClicked / totalSent) * 100 : 0;

    return {
      totalCampaigns,
      totalSent,
      totalOpened,
      totalClicked,
      avgOpenRate,
      avgClickRate,
    };
  }, [filteredCampaigns]);

  const topCampaigns = useMemo(() => {
    return [...filteredCampaigns]
      .map((c) => ({
        ...c,
        openRate: c.total_sent > 0 ? (c.total_opened / c.total_sent) * 100 : 0,
        clickRate: c.total_sent > 0 ? (c.total_clicked / c.total_sent) * 100 : 0,
      }))
      .sort((a, b) => b.openRate - a.openRate)
      .slice(0, 5);
  }, [filteredCampaigns]);

  const exportToCSV = () => {
    const headers = ['Campaign Name', 'Subject', 'Sent', 'Opened', 'Open Rate', 'Clicked', 'Click Rate', 'Sent Date'];
    const rows = filteredCampaigns.map((c) => {
      const openRate = c.total_sent > 0 ? ((c.total_opened / c.total_sent) * 100).toFixed(2) : '0';
      const clickRate = c.total_sent > 0 ? ((c.total_clicked / c.total_sent) * 100).toFixed(2) : '0';
      return [
        c.name,
        c.subject,
        c.total_sent,
        c.total_opened,
        `${openRate}%`,
        c.total_clicked,
        `${clickRate}%`,
        c.sent_at ? new Date(c.sent_at).toLocaleDateString() : 'Not sent',
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `campaign-analytics-${dateRange}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Date Range Filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Campaign Analytics</h3>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Button onClick={exportToCSV} variant="light-outline" size="sm" className="min-h-[44px]">
            <Download className="w-4 h-4" />
            <span className="ml-2 hidden sm:inline">Export CSV</span>
            <span className="ml-2 sm:hidden">Export</span>
          </Button>
          {[
            { value: '7d', label: 'Last 7 Days' },
            { value: '30d', label: 'Last 30 Days' },
            { value: '90d', label: 'Last 90 Days' },
            { value: 'all', label: 'All Time' },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setDateRange(option.value as any)}
              className={`px-3 py-2 text-xs sm:text-sm rounded-lg transition-all min-h-[44px] whitespace-nowrap ${
                dateRange === option.value
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <span className="hidden sm:inline">{option.label}</span>
              <span className="sm:hidden">{option.value.toUpperCase()}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-4 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <div className="p-1.5 sm:p-2 bg-blue-500 rounded-lg">
              <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <p className="text-xs sm:text-sm text-blue-600 dark:text-blue-400">Campaigns Sent</p>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-blue-700 dark:text-blue-300">
            {stats.totalCampaigns}
          </p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-4 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <div className="p-1.5 sm:p-2 bg-green-500 rounded-lg">
              <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <p className="text-xs sm:text-sm text-green-600 dark:text-green-400">Avg Open Rate</p>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-green-700 dark:text-green-300">
            {stats.avgOpenRate.toFixed(1)}%
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-4 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <div className="p-1.5 sm:p-2 bg-purple-500 rounded-lg">
              <MousePointer className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <p className="text-xs sm:text-sm text-purple-600 dark:text-purple-400">Avg Click Rate</p>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-purple-700 dark:text-purple-300">
            {stats.avgClickRate.toFixed(1)}%
          </p>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-xl p-4 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <div className="p-1.5 sm:p-2 bg-orange-500 rounded-lg">
              <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <p className="text-xs sm:text-sm text-orange-600 dark:text-orange-400">Total Emails Sent</p>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-orange-700 dark:text-orange-300">
            {stats.totalSent.toLocaleString()}
          </p>
        </div>

        <div className="bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-900/20 dark:to-teal-800/20 rounded-xl p-4 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <div className="p-1.5 sm:p-2 bg-teal-500 rounded-lg">
              <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <p className="text-xs sm:text-sm text-teal-600 dark:text-teal-400">Total Opens</p>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-teal-700 dark:text-teal-300">
            {stats.totalOpened.toLocaleString()}
          </p>
        </div>

        <div className="bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20 rounded-xl p-4 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <div className="p-1.5 sm:p-2 bg-pink-500 rounded-lg">
              <MousePointer className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <p className="text-xs sm:text-sm text-pink-600 dark:text-pink-400">Total Clicks</p>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-pink-700 dark:text-pink-300">
            {stats.totalClicked.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Top Performing Campaigns */}
      <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl rounded-xl border border-white/20 p-6">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
            Top Performing Campaigns
          </h4>
        </div>

        {topCampaigns.length > 0 ? (
          <div className="space-y-4">
            {topCampaigns.map((campaign, index) => (
              <div
                key={campaign.id}
                className="flex items-center gap-4 p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary-hover text-white font-bold text-sm">
                  {index + 1}
                </div>

                <div className="flex-1 min-w-0">
                  <h5 className="font-medium text-gray-900 dark:text-white truncate">
                    {campaign.name}
                  </h5>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {campaign.subject}
                  </p>
                </div>

                <div className="flex gap-6 text-sm">
                  <div className="text-center">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {campaign.total_sent.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">Sent</p>
                  </div>

                  <div className="text-center">
                    <p className="font-semibold text-green-600 dark:text-green-400">
                      {campaign.openRate.toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-500">Opens</p>
                  </div>

                  <div className="text-center">
                    <p className="font-semibold text-purple-600 dark:text-purple-400">
                      {campaign.clickRate.toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-500">Clicks</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              No campaigns sent in this period
            </p>
          </div>
        )}
      </div>

      {/* Engagement Over Time (Placeholder for future chart) */}
      <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl rounded-xl border border-white/20 p-6">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Engagement Trends
        </h4>
        <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-lg">
          <div className="text-center">
            <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-3" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Interactive charts coming soon
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
