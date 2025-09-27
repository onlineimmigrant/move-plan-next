import React, { useState, useEffect } from 'react';
import { 
  GlobeAltIcon, 
  ChartBarIcon, 
  ClockIcon,
  UserGroupIcon 
} from '@heroicons/react/24/outline';
import { Organization } from './types';
import { Activity, formatRelativeTime, getActivityColor, getActivityText } from './activityUtils';

interface PlatformStatsWidgetProps {
  organizations: Organization[];
  profile: any;
  session: any;
}

export default function PlatformStatsWidget({ organizations, profile, session }: PlatformStatsWidgetProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(true);
  const [activitiesError, setActivitiesError] = useState<string | null>(null);

  // Only show for platform organization admins
  if (!profile || profile.role !== 'admin') return null;
  
  const userOrgId = profile.organization_id || profile.current_organization_id;
  const userOrganization = organizations.find(org => org.id === userOrgId);
  
  if (!userOrganization || userOrganization.type !== 'platform') return null;

  // Fetch real activity data
  useEffect(() => {
    const fetchActivities = async () => {
      if (!session?.access_token) return;
      
      try {
        setIsLoadingActivities(true);
        setActivitiesError(null);
        
        const response = await fetch('/api/activities', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error');
          console.warn('Activities API error:', response.status, errorText);
          throw new Error(`Activities API unavailable (${response.status})`);
        }

        const data = await response.json();
        setActivities(data.activities || []);
      } catch (err: any) {
        console.warn('Activities API not available, using sample data:', err.message);
        console.info('💡 To enable real activity tracking, run the database migration: ./run-migration.sh');
        setActivitiesError('Database not configured yet');
        
        // Fallback to sample data based on actual organizations
        const sampleActivities = organizations.slice(0, 3).map((org, index) => {
          const actions: Array<'created' | 'updated' | 'deployed'> = ['created', 'updated', 'deployed'];
          const timeOffsets = [2 * 60 * 60 * 1000, 24 * 60 * 60 * 1000, 3 * 24 * 60 * 60 * 1000]; // 2h, 1d, 3d ago
          
          return {
            id: `sample-${index}`,
            organization_id: org.id,
            organization_name: org.name,
            action: actions[index % actions.length],
            created_at: new Date(Date.now() - timeOffsets[index]).toISOString(),
            user_email: org.created_by_email || 'admin@example.com'
          };
        });
        
        setActivities(sampleActivities);
      } finally {
        setIsLoadingActivities(false);
      }
    };

    fetchActivities();
  }, [session?.access_token]);

  // Calculate stats
  const totalSites = organizations.length;
  const liveSites = organizations.filter(org => org.base_url).length;
  const draftSites = organizations.filter(org => !org.base_url && !org.base_url_local).length;
  const devSites = organizations.filter(org => org.base_url_local && !org.base_url).length;

  const stats = [
    {
      label: 'Total Sites',
      value: totalSites,
      icon: GlobeAltIcon,
      color: 'text-blue-600',
      bg: 'bg-blue-100'
    },
    {
      label: 'Live Sites',
      value: liveSites,
      icon: ChartBarIcon,
      color: 'text-green-600',
      bg: 'bg-green-100'
    },
    {
      label: 'In Development',
      value: devSites,
      icon: ClockIcon,
      color: 'text-orange-600',
      bg: 'bg-orange-100'
    },
    {
      label: 'Draft Sites',
      value: draftSites,
      icon: UserGroupIcon,
      color: 'text-gray-600',
      bg: 'bg-gray-100'
    }
  ];

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/60 rounded-xl p-4 sm:p-6 mb-6">
      {/* Header - Mobile optimized */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-gray-900">Platform Overview</h2>
          <p className="text-sm text-gray-600 truncate">Managing {totalSites} organizations across your platform</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-100 text-blue-700 text-xs font-medium">
            Platform Admin
          </span>
        </div>
      </div>

      {/* Stats Grid - Better mobile layout */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white/70 backdrop-blur-sm rounded-lg p-3 sm:p-4 border border-white/50">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <div className={`p-1.5 sm:p-2 rounded-lg ${stat.bg} flex-shrink-0 self-start sm:self-auto`}>
                <stat.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${stat.color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs sm:text-sm text-gray-600 truncate">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity - Mobile optimized */}
      <div className="bg-white/70 backdrop-blur-sm rounded-lg p-3 sm:p-4 border border-white/50">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-gray-900 text-sm sm:text-base">Recent Activity</h3>
          {isLoadingActivities && (
            <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 border-gray-300 border-t-blue-600 animate-spin"></div>
          )}
        </div>
        
        {activitiesError && (
          <div className="text-xs sm:text-sm text-amber-700 mb-2 p-2 bg-amber-50 border border-amber-200 rounded-md">
            <div className="flex items-start gap-2">
              <span className="flex-shrink-0">⚠️</span>
              <div className="min-w-0">
                <div className="font-medium">Using Sample Data</div>
                <div className="text-xs text-amber-600 truncate">
                  Run database migration to see real activities
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Mobile-friendly scrollable container */}
        <div className="relative">
          <div className="overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            <div className="space-y-2 min-w-max pr-2 sm:pr-4">
              {activities.length > 0 ? (
                activities.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm whitespace-nowrap">
                    <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full flex-shrink-0 ${getActivityColor(activity.action)}`}></div>
                    <span className="font-medium text-gray-900 flex-shrink-0">
                      {activity.details || `${activity.organization_name} ${getActivityText(activity.action)}`}
                    </span>
                    <span className="text-gray-500 text-xs flex-shrink-0">
                      {formatRelativeTime(activity.created_at)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-xs sm:text-sm text-gray-500 text-center py-3">
                  {isLoadingActivities ? 'Loading activities...' : 'No recent activity'}
                </div>
              )}
            </div>
          </div>
          
          {/* Scroll hint for mobile */}
          {activities.length > 0 && (
            <div className="absolute right-0 top-0 bottom-0 w-3 sm:w-4 bg-gradient-to-l from-white/70 to-transparent pointer-events-none sm:hidden"></div>
          )}
        </div>
      </div>
    </div>
  );
}
