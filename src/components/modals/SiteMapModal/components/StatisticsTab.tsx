/**
 * StatisticsTab Component
 * Displays sitemap statistics with visual charts
 * Matching HeaderEditModal design patterns
 */

'use client';

import React from 'react';
import { 
  ChartBarIcon, 
  ClockIcon, 
  SignalIcon,
  DocumentTextIcon,
  HomeIcon,
  NewspaperIcon,
  SparklesIcon,
  ShoppingBagIcon
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface SiteMapStats {
  total: number;
  byPriority: Record<string, number>;
  byChangeFreq: Record<string, number>;
  byType: Record<string, number>;
}

interface StatisticsTabProps {
  stats: SiteMapStats;
  primaryColor: string;
}

export function StatisticsTab({ stats, primaryColor }: StatisticsTabProps) {
  // Calculate percentages
  const getPercentage = (count: number) => {
    return stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
  };

  // Type icons
  const typeIcons: Record<string, any> = {
    home: HomeIcon,
    static: DocumentTextIcon,
    blog: NewspaperIcon,
    feature: SparklesIcon,
    product: ShoppingBagIcon,
  };

  // Priority colors
  const getPriorityColor = (priority: string) => {
    const p = parseFloat(priority);
    if (p >= 0.9) return 'bg-green-500';
    if (p >= 0.7) return 'bg-blue-500';
    if (p >= 0.5) return 'bg-yellow-500';
    return 'bg-gray-500';
  };

  // Change frequency colors
  const getFreqColor = (freq: string) => {
    const colors: Record<string, string> = {
      always: 'bg-red-500',
      hourly: 'bg-orange-500',
      daily: 'bg-yellow-500',
      weekly: 'bg-green-500',
      monthly: 'bg-blue-500',
      yearly: 'bg-purple-500',
      never: 'bg-gray-500',
    };
    return colors[freq] || 'bg-gray-500';
  };

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Pages - Primary Color Border */}
        <div 
          className="p-4 rounded-lg border-2 transition-all duration-200 hover:shadow-lg"
          style={{ 
            borderColor: primaryColor,
            backgroundColor: `${primaryColor}10`
          }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div 
              className="p-2 rounded-lg"
              style={{ backgroundColor: `${primaryColor}20` }}
            >
              <ChartBarIcon 
                className="w-5 h-5"
                style={{ color: primaryColor }}
              />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.total}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Total Pages</div>
            </div>
          </div>
        </div>

        {/* Page Types */}
        <div 
          className="p-4 rounded-lg border-2 transition-all duration-200 hover:shadow-lg"
          style={{ 
            borderColor: `${primaryColor}40`,
            backgroundColor: `${primaryColor}05`
          }}
        >
          <div className="flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${primaryColor}20` }}
            >
              <DocumentTextIcon className="w-6 h-6" style={{ color: primaryColor }} />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Page Types</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{Object.keys(stats.byType).length}</p>
            </div>
          </div>
        </div>

        {/* Update Frequencies */}
        <div className="p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200 hover:shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <ClockIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Update Frequencies</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{Object.keys(stats.byChangeFreq).length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Page Types Breakdown */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white/50 dark:bg-gray-800/50">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <ChartBarIcon className="w-5 h-5" />
          Pages by Type
        </h3>
        <div className="space-y-3">
          {Object.entries(stats.byType)
            .sort(([, a], [, b]) => b - a)
            .map(([type, count]) => {
              const Icon = typeIcons[type] || DocumentTextIcon;
              const percentage = getPercentage(count);
              
              return (
                <div key={type} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-gray-500" />
                      <span className="font-medium text-gray-900 dark:text-white capitalize">
                        {type}
                      </span>
                    </div>
                    <span className="text-gray-600 dark:text-gray-400">
                      {count} ({percentage}%)
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full transition-all duration-500 rounded-full"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: primaryColor,
                      }}
                    />
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Priority Distribution */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white/50 dark:bg-gray-800/50">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <SignalIcon className="w-5 h-5" />
            Priority Distribution
          </h3>
          <div className="space-y-3">
            {Object.entries(stats.byPriority)
              .sort(([a], [b]) => parseFloat(b) - parseFloat(a))
              .map(([priority, count]) => {
                const percentage = getPercentage(count);
                const colorClass = getPriorityColor(priority);
                
                return (
                  <div key={priority} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-900 dark:text-white">
                        Priority {priority}
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">
                        {count} ({percentage}%)
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={cn('h-full transition-all duration-500', colorClass)}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Change Frequency Distribution */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white/50 dark:bg-gray-800/50">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <ClockIcon className="w-5 h-5" />
            Update Frequency
          </h3>
          <div className="space-y-3">
            {Object.entries(stats.byChangeFreq)
              .sort(([, a], [, b]) => b - a)
              .map(([freq, count]) => {
                const percentage = getPercentage(count);
                const colorClass = getFreqColor(freq);
                
                return (
                  <div key={freq} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-900 dark:text-white capitalize">
                        {freq}
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">
                        {count} ({percentage}%)
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={cn('h-full transition-all duration-500', colorClass)}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}
