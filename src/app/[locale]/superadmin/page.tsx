'use client';

import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

interface Stats {
  totalOrganizations: number;
  totalSystemModels: number;
  activeModels: number;
  totalUsage: number;
}

export default function SuperadminDashboard() {
  const { isSuperadmin } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalOrganizations: 0,
    totalSystemModels: 0,
    activeModels: 0,
    totalUsage: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isSuperadmin) {
      fetchStats();
    }
  }, [isSuperadmin]);

  async function fetchStats() {
    try {
      setLoading(true);

      // Fetch organizations count
      const { count: orgCount } = await supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true });

      // Fetch system models
      const { data: models } = await supabase
        .from('ai_models_system')
        .select('is_active');

      // Fetch usage count
      const { count: usageCount } = await supabase
        .from('ai_model_usage')
        .select('*', { count: 'exact', head: true });

      setStats({
        totalOrganizations: orgCount || 0,
        totalSystemModels: models?.length || 0,
        activeModels: models?.filter(m => m.is_active).length || 0,
        totalUsage: usageCount || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Card */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-8">
        <h2 className="text-3xl font-bold text-purple-900 mb-2">
          Welcome to Superadmin Portal 👑
        </h2>
        <p className="text-purple-700 text-lg">
          You have system-wide access to manage all organizations and global resources.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Organizations"
          value={stats.totalOrganizations}
          icon="🏢"
          color="blue"
          href="/superadmin/organizations"
        />
        <StatCard
          title="System Models"
          value={stats.totalSystemModels}
          icon="🤖"
          color="purple"
          href="/superadmin/system-models"
        />
        <StatCard
          title="Active Models"
          value={stats.activeModels}
          icon="✅"
          color="green"
          href="/superadmin/system-models"
        />
        <StatCard
          title="Total Usage"
          value={stats.totalUsage}
          icon="📊"
          color="orange"
          href="/superadmin/usage"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <QuickActionCard
            title="Manage System Models"
            description="Create and configure global AI model templates"
            icon="🤖"
            href="/superadmin/system-models"
            color="purple"
          />
          <QuickActionCard
            title="View All Organizations"
            description="Browse and manage all tenant organizations"
            icon="🏢"
            href="/superadmin/organizations"
            color="blue"
          />
          <QuickActionCard
            title="Usage Analytics"
            description="Monitor system-wide usage and performance"
            icon="📊"
            href="/superadmin/usage"
            color="green"
          />
          <QuickActionCard
            title="Organization Switcher"
            description="Switch context to view any organization"
            icon="🔄"
            href="/superadmin/organizations"
            color="indigo"
          />
          <QuickActionCard
            title="System Settings"
            description="Configure global system settings"
            icon="⚙️"
            href="/superadmin/settings"
            color="gray"
          />
          <QuickActionCard
            title="Back to Admin"
            description="Return to your organization's admin panel"
            icon="🏠"
            href="/admin"
            color="slate"
          />
        </div>
      </div>

      {/* Recent Activity (Placeholder) */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold mb-4">Recent Activity</h3>
        <div className="text-center py-12 text-gray-500">
          <p>Activity tracking coming soon...</p>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color, href }: {
  title: string;
  value: number;
  icon: string;
  color: string;
  href: string;
}) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    purple: 'from-purple-500 to-purple-600',
    green: 'from-green-500 to-green-600',
    orange: 'from-orange-500 to-orange-600',
  }[color];

  return (
    <Link href={href} className="block group">
      <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
        <div className="flex items-center justify-between mb-3">
          <span className="text-4xl">{icon}</span>
          <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${colorClasses} flex items-center justify-center text-white font-bold text-lg`}>
            {value}
          </div>
        </div>
        <h4 className="text-gray-600 text-sm font-medium">{title}</h4>
        <p className="text-xs text-gray-500 mt-1 group-hover:text-gray-700">
          Click to view →
        </p>
      </div>
    </Link>
  );
}

function QuickActionCard({ title, description, icon, href, color }: {
  title: string;
  description: string;
  icon: string;
  href: string;
  color: string;
}) {
  const colorClasses = {
    purple: 'border-purple-200 hover:border-purple-400 hover:bg-purple-50',
    blue: 'border-blue-200 hover:border-blue-400 hover:bg-blue-50',
    green: 'border-green-200 hover:border-green-400 hover:bg-green-50',
    indigo: 'border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50',
    gray: 'border-gray-200 hover:border-gray-400 hover:bg-gray-50',
    slate: 'border-slate-200 hover:border-slate-400 hover:bg-slate-50',
  }[color];

  return (
    <Link href={href} className="block">
      <div className={`border-2 rounded-lg p-4 transition-all ${colorClasses}`}>
        <div className="flex items-start gap-3">
          <span className="text-3xl">{icon}</span>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 mb-1">{title}</h4>
            <p className="text-sm text-gray-600">{description}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}
