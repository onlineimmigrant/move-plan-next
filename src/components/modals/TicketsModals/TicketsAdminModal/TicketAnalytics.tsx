import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Users,
  MessageSquare,
  Calendar,
  Download,
  RefreshCw,
  BarChart3,
  PieChartIcon
} from 'lucide-react';
import { useThemeColors } from '@/hooks/useThemeColors';

interface Ticket {
  id: string;
  subject: string;
  message: string;
  status: string;
  priority?: string;
  created_at: string;
  full_name?: string;
  email: string;
  assigned_to?: string | null;
  ticket_responses: Array<{
    id: string;
    message: string;
    is_admin: boolean;
    created_at: string;
    created_by?: string | null;
  }>;
  tags?: Array<{ id: string; name: string; color: string }>;
}

interface AdminUser {
  id: string;
  email: string;
  full_name?: string;
}

interface TicketAnalyticsProps {
  tickets: Ticket[];
  adminUsers: AdminUser[];
  onClose: () => void;
}

interface Metrics {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  closedTickets: number;
  avgResponseTime: number;
  medianResponseTime: number;
  avgResolutionTime: number;
  responseRate: number;
  ticketsToday: number;
  ticketsThisWeek: number;
  ticketsThisMonth: number;
  highPriorityCount: number;
  mediumPriorityCount: number;
  lowPriorityCount: number;
}

interface AdminPerformance {
  adminId: string;
  adminName: string;
  ticketsHandled: number;
  avgResponseTime: number;
  responseRate: number;
  closedTickets: number;
}

export const TicketAnalytics: React.FC<TicketAnalyticsProps> = ({ tickets, adminUsers, onClose }) => {
  const themeColors = useThemeColors();
  const primary = themeColors.cssVars.primary;
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [selectedTab, setSelectedTab] = useState<'overview' | 'performance' | 'trends'>('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filter tickets by date range
  const filteredTickets = useMemo(() => {
    if (dateRange === 'all') return tickets;
    
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
    }
    
    return tickets.filter(ticket => new Date(ticket.created_at) >= cutoffDate);
  }, [tickets, dateRange]);

  // Calculate metrics
  const metrics = useMemo((): Metrics => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setMonth(today.getMonth() - 1);

    let totalResponseTime = 0;
    const responseTimes: number[] = [];
    let totalResolutionTime = 0;
    let resolutionCount = 0;
    let ticketsWithResponse = 0;

    filteredTickets.forEach(ticket => {
      const ticketDate = new Date(ticket.created_at);
      
      // First response time
      if (ticket.ticket_responses.length > 0) {
        const firstAdminResponse = ticket.ticket_responses.find(r => r.is_admin);
        if (firstAdminResponse) {
          const responseTime = new Date(firstAdminResponse.created_at).getTime() - ticketDate.getTime();
          totalResponseTime += responseTime;
          responseTimes.push(responseTime);
          ticketsWithResponse++;
        }
      }

      // Resolution time (for closed tickets)
      if (ticket.status === 'closed' && ticket.ticket_responses.length > 0) {
        const lastResponse = ticket.ticket_responses[ticket.ticket_responses.length - 1];
        const resolutionTime = new Date(lastResponse.created_at).getTime() - ticketDate.getTime();
        totalResolutionTime += resolutionTime;
        resolutionCount++;
      }
    });

    // Calculate median response time
    responseTimes.sort((a, b) => a - b);
    const medianResponseTime = responseTimes.length > 0
      ? responseTimes[Math.floor(responseTimes.length / 2)]
      : 0;

    const statusCounts = {
      open: filteredTickets.filter(t => t.status === 'open').length,
      inProgress: filteredTickets.filter(t => t.status === 'in progress').length,
      closed: filteredTickets.filter(t => t.status === 'closed').length,
    };

    const priorityCounts = {
      high: filteredTickets.filter(t => t.priority === 'high').length,
      medium: filteredTickets.filter(t => t.priority === 'medium').length,
      low: filteredTickets.filter(t => t.priority === 'low' || !t.priority).length,
    };

    return {
      totalTickets: filteredTickets.length,
      openTickets: statusCounts.open,
      inProgressTickets: statusCounts.inProgress,
      closedTickets: statusCounts.closed,
      avgResponseTime: ticketsWithResponse > 0 ? totalResponseTime / ticketsWithResponse : 0,
      medianResponseTime,
      avgResolutionTime: resolutionCount > 0 ? totalResolutionTime / resolutionCount : 0,
      responseRate: filteredTickets.length > 0 ? (ticketsWithResponse / filteredTickets.length) * 100 : 0,
      ticketsToday: tickets.filter(t => new Date(t.created_at) >= today).length,
      ticketsThisWeek: tickets.filter(t => new Date(t.created_at) >= weekAgo).length,
      ticketsThisMonth: tickets.filter(t => new Date(t.created_at) >= monthAgo).length,
      highPriorityCount: priorityCounts.high,
      mediumPriorityCount: priorityCounts.medium,
      lowPriorityCount: priorityCounts.low,
    };
  }, [filteredTickets, tickets]);

  // Calculate admin performance
  const adminPerformance = useMemo((): AdminPerformance[] => {
    const performanceMap = new Map<string, AdminPerformance>();

    adminUsers.forEach(admin => {
      performanceMap.set(admin.id, {
        adminId: admin.id,
        adminName: admin.full_name || admin.email,
        ticketsHandled: 0,
        avgResponseTime: 0,
        responseRate: 0,
        closedTickets: 0,
      });
    });

    filteredTickets.forEach(ticket => {
      if (ticket.assigned_to && performanceMap.has(ticket.assigned_to)) {
        const perf = performanceMap.get(ticket.assigned_to)!;
        perf.ticketsHandled++;

        if (ticket.status === 'closed') {
          perf.closedTickets++;
        }

        // Check if admin responded
        const adminResponse = ticket.ticket_responses.find(r => 
          r.is_admin && r.created_by === ticket.assigned_to
        );

        if (adminResponse) {
          const responseTime = new Date(adminResponse.created_at).getTime() - new Date(ticket.created_at).getTime();
          perf.avgResponseTime = (perf.avgResponseTime * (perf.ticketsHandled - 1) + responseTime) / perf.ticketsHandled;
        }
      }
    });

    // Calculate response rates
    performanceMap.forEach((perf) => {
      if (perf.ticketsHandled > 0) {
        const ticketsWithResponse = filteredTickets.filter(t => 
          t.assigned_to === perf.adminId && 
          t.ticket_responses.some(r => r.is_admin && r.created_by === perf.adminId)
        ).length;
        perf.responseRate = (ticketsWithResponse / perf.ticketsHandled) * 100;
      }
    });

    return Array.from(performanceMap.values())
      .filter(perf => perf.ticketsHandled > 0)
      .sort((a, b) => b.ticketsHandled - a.ticketsHandled);
  }, [filteredTickets, adminUsers]);

  // Format time duration
  const formatDuration = (ms: number): string => {
    if (ms === 0) return 'N/A';
    
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours === 0) return `${minutes}m`;
    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes}m`;
  };

  // Export to CSV
  const handleExport = () => {
    const csvData = [
      ['Metric', 'Value'],
      ['Total Tickets', metrics.totalTickets],
      ['Open Tickets', metrics.openTickets],
      ['In Progress', metrics.inProgressTickets],
      ['Closed Tickets', metrics.closedTickets],
      ['Avg Response Time', formatDuration(metrics.avgResponseTime)],
      ['Median Response Time', formatDuration(metrics.medianResponseTime)],
      ['Avg Resolution Time', formatDuration(metrics.avgResolutionTime)],
      ['Response Rate', `${metrics.responseRate.toFixed(1)}%`],
      ['', ''],
      ['Admin Performance', ''],
      ['Admin', 'Tickets Handled', 'Closed', 'Avg Response Time', 'Response Rate'],
      ...adminPerformance.map(perf => [
        perf.adminName,
        perf.ticketsHandled,
        perf.closedTickets,
        formatDuration(perf.avgResponseTime),
        `${perf.responseRate.toFixed(1)}%`
      ])
    ];

    const csv = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ticket-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Handle refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10002] flex items-center justify-center p-4">
      <div className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/20 w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 dark:border-gray-700/20 bg-white/30 dark:bg-gray-800/30 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="p-2">
              <BarChart3 className="h-6 w-6" style={{ color: primary.base }} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Ticket Analytics</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 hidden sm:block">Insights and performance metrics</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/30 dark:hover:bg-gray-700/30 rounded-lg transition-colors"
            >
              <svg className="h-5 w-5 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-4 border-b border-white/10 dark:border-gray-700/20 bg-white/20 dark:bg-gray-900/20">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'performance', label: 'Team Performance', icon: Users },
            { id: 'trends', label: 'Trends', icon: TrendingUp },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as typeof selectedTab)}
              className={`flex items-center gap-2 px-4 py-3 font-medium text-sm transition-colors relative ${
                selectedTab === tab.id
                  ? 'text-gray-900 dark:text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
              style={selectedTab === tab.id ? { color: primary.base } : undefined}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
              {selectedTab === tab.id && (
                <div 
                  className="absolute bottom-0 left-0 right-0 h-0.5" 
                  style={{ backgroundColor: primary.base }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-white/20 dark:bg-gray-900/20">
          {selectedTab === 'overview' && (
            <div className="space-y-6">
              {/* Key Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Tickets */}
                <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-4 border border-white/20 dark:border-gray-700/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Total Tickets</span>
                    <MessageSquare className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="text-3xl font-bold text-blue-900">{metrics.totalTickets}</div>
                  <div className="text-xs text-blue-700 mt-1">
                    {metrics.ticketsToday} today • {metrics.ticketsThisWeek} this week
                  </div>
                </div>

                {/* Response Time */}
                <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-4 border border-white/20 dark:border-gray-700/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Avg Response Time</span>
                    <Clock className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">{formatDuration(metrics.avgResponseTime)}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Median: {formatDuration(metrics.medianResponseTime)}
                  </div>
                </div>

                {/* Resolution Time */}
                <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-4 border border-white/20 dark:border-gray-700/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Avg Resolution Time</span>
                    <CheckCircle className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">{formatDuration(metrics.avgResolutionTime)}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {metrics.closedTickets} closed tickets
                  </div>
                </div>

                {/* Response Rate */}
                <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-4 border border-white/20 dark:border-gray-700/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Response Rate</span>
                    <TrendingUp className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">{metrics.responseRate.toFixed(1)}%</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {Math.round(metrics.totalTickets * metrics.responseRate / 100)} responded
                  </div>
                </div>
              </div>

              {/* Status Distribution */}
              <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl border border-white/20 dark:border-gray-700/20 p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Status Distribution</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{metrics.openTickets}</div>
                    <div className="text-sm text-slate-600 mt-1">Open</div>
                    <div className="text-xs text-slate-500">
                      {metrics.totalTickets > 0 ? ((metrics.openTickets / metrics.totalTickets) * 100).toFixed(1) : 0}%
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">{metrics.inProgressTickets}</div>
                    <div className="text-sm text-slate-600 mt-1">In Progress</div>
                    <div className="text-xs text-slate-500">
                      {metrics.totalTickets > 0 ? ((metrics.inProgressTickets / metrics.totalTickets) * 100).toFixed(1) : 0}%
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-slate-600">{metrics.closedTickets}</div>
                    <div className="text-sm text-slate-600 mt-1">Closed</div>
                    <div className="text-xs text-slate-500">
                      {metrics.totalTickets > 0 ? ((metrics.closedTickets / metrics.totalTickets) * 100).toFixed(1) : 0}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Priority Distribution */}
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Priority Distribution</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{metrics.highPriorityCount}</div>
                    <div className="text-sm text-slate-600 mt-1">High Priority</div>
                    <div className="text-xs text-slate-500">
                      {metrics.totalTickets > 0 ? ((metrics.highPriorityCount / metrics.totalTickets) * 100).toFixed(1) : 0}%
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">{metrics.mediumPriorityCount}</div>
                    <div className="text-sm text-slate-600 mt-1">Medium Priority</div>
                    <div className="text-xs text-slate-500">
                      {metrics.totalTickets > 0 ? ((metrics.mediumPriorityCount / metrics.totalTickets) * 100).toFixed(1) : 0}%
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{metrics.lowPriorityCount}</div>
                    <div className="text-sm text-slate-600 mt-1">Low Priority</div>
                    <div className="text-xs text-slate-500">
                      {metrics.totalTickets > 0 ? ((metrics.lowPriorityCount / metrics.totalTickets) * 100).toFixed(1) : 0}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedTab === 'performance' && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">Admin</th>
                      <th className="text-center px-6 py-3 text-xs font-medium text-slate-500 uppercase">Tickets</th>
                      <th className="text-center px-6 py-3 text-xs font-medium text-slate-500 uppercase">Closed</th>
                      <th className="text-center px-6 py-3 text-xs font-medium text-slate-500 uppercase">Avg Response</th>
                      <th className="text-center px-6 py-3 text-xs font-medium text-slate-500 uppercase">Response Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {adminPerformance.map(perf => (
                      <tr key={perf.adminId} className="hover:bg-slate-50">
                        <td className="px-6 py-4 text-sm font-medium text-slate-900">{perf.adminName}</td>
                        <td className="px-6 py-4 text-sm text-center text-slate-600">{perf.ticketsHandled}</td>
                        <td className="px-6 py-4 text-sm text-center text-slate-600">{perf.closedTickets}</td>
                        <td className="px-6 py-4 text-sm text-center text-slate-600">{formatDuration(perf.avgResponseTime)}</td>
                        <td className="px-6 py-4 text-sm text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            perf.responseRate >= 90 ? 'bg-green-100 text-green-800' :
                            perf.responseRate >= 70 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {perf.responseRate.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                    {adminPerformance.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                          No admin performance data available for selected period
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {selectedTab === 'trends' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Volume Trends</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-slate-900">{metrics.ticketsToday}</div>
                    <div className="text-sm text-slate-600 mt-1">Today</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-slate-900">{metrics.ticketsThisWeek}</div>
                    <div className="text-sm text-slate-600 mt-1">This Week</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-slate-900">{metrics.ticketsThisMonth}</div>
                    <div className="text-sm text-slate-600 mt-1">This Month</div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900 mb-1">Advanced Charts Coming Soon</h4>
                    <p className="text-sm text-blue-700">
                      Interactive line graphs, trend analysis, and comparison charts will be added in the next update. 
                      This will include day-by-day breakdowns, hour-by-hour patterns, and predictive analytics.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Bottom Panel with Controls */}
        <div className="flex items-center justify-between p-4 border-t border-white/10 dark:border-gray-700/20 bg-white/30 dark:bg-gray-800/30 backdrop-blur-md">
          <div className="flex items-center gap-3">
            {/* Date Range Selector */}
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as typeof dateRange)}
              className="px-3 py-2 text-sm border border-white/20 dark:border-gray-700/20 rounded-lg focus:outline-none focus:ring-2 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm text-gray-900 dark:text-white"
              style={{ '--focus-ring-color': primary.base } as React.CSSProperties}
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="all">All Time</option>
            </select>

            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              className={`p-2 hover:bg-white/30 dark:hover:bg-gray-700/30 rounded-lg transition-colors ${isRefreshing ? 'animate-spin' : ''}`}
              title="Refresh"
            >
              <RefreshCw className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            </button>

            {/* Export Button */}
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors"
              style={{ 
                background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`,
              }}
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export CSV</span>
              <span className="sm:hidden">Export</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
