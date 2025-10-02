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
    <div className="relative bg-gradient-to-r from-gray-50/80 to-white/80 backdrop-blur-sm border border-gray-200/40 rounded-2xl p-6 shadow-lg shadow-gray-100/50 mb-8 transition-all duration-300">
      
      {/* Enhanced Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 lg:gap-0 mb-6">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold text-gray-800 mb-1">Platform Overview</h2>
          <p className="text-sm text-gray-500">Managing {totalSites} organizations across your platform</p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-100/60 backdrop-blur-sm border border-gray-200/40 text-gray-700 text-sm font-medium shadow-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Platform Admin
          </span>
        </div>
      </div>

      {/* Enhanced Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
        {stats.map((stat, index) => (
          <div key={index} className="group bg-white/30 backdrop-blur-sm rounded-xl p-4 sm:p-5 border border-gray-200/20 hover:bg-white/40 hover:border-gray-300/30 transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${stat.bg} flex-shrink-0 shadow-lg group-hover:shadow-xl transition-all duration-300`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xl sm:text-2xl font-bold text-gray-800 mb-1">{stat.value}</p>
                <p className="text-sm text-gray-600 font-medium">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Enhanced Recent Activity Section */}
      <div className="bg-gradient-to-r from-gray-50/80 to-white/80 backdrop-blur-sm rounded-2xl p-5 sm:p-6 border border-gray-200/40 shadow-lg shadow-gray-100/50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Recent Activity</h3>
          {isLoadingActivities && (
            <div className="w-5 h-5 rounded-full border-2 border-gray-300 border-t-blue-600 animate-spin"></div>
          )}
        </div>
        
        {activitiesError && (
          <div className="text-sm text-amber-800 mb-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-amber-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold mb-1">Using Sample Data</div>
                <div className="text-xs text-amber-700">
                  Run database migration to see real activities
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Enhanced Activity List */}
        <div className="relative">
          <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-sky-300 scrollbar-track-gray-100 hover:scrollbar-thumb-sky-400">
            <div className="space-y-3 min-w-max pr-4">
              {activities.length > 0 ? (
                activities.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex items-center gap-4 p-3 rounded-xl bg-white/30 backdrop-blur-sm hover:bg-white/40 border border-gray-200/20 hover:border-gray-300/30 transition-all duration-200">
                    <div className={`w-3 h-3 rounded-full flex-shrink-0 ${getActivityColor(activity.action)} shadow-sm`}></div>
                    <span className="font-medium text-gray-700 flex-shrink-0 text-sm">
                      {activity.details || `${activity.organization_name} ${getActivityText(activity.action)}`}
                    </span>
                    <span className="text-gray-500 text-xs flex-shrink-0 font-normal">
                      {formatRelativeTime(activity.created_at)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-6">
                  <div className="w-10 h-10 rounded-full bg-gray-100/60 backdrop-blur-sm flex items-center justify-center mx-auto mb-3">
                    <ClockIcon className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="text-sm text-gray-500 font-normal">
                    {isLoadingActivities ? 'Loading activities...' : 'No recent activity'}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Enhanced scroll hint for mobile */}
          {activities.length > 0 && (
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white/80 to-transparent pointer-events-none lg:hidden rounded-r-xl"></div>
          )}
        </div>
      </div>
    </div>
  );
}
