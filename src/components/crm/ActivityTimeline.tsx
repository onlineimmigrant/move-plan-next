'use client';

import { useState, useMemo, useCallback } from 'react';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useCRMData } from '@/context/CRMDataContext';
import { FixedSizeList as List } from 'react-window';
import SkeletonLoader from './SkeletonLoader';

interface Activity {
  id: string;
  type: 'booking' | 'ticket' | 'case_created' | 'case_updated';
  timestamp: string;
  title: string;
  description?: string;
  status?: string;
  metadata?: Record<string, any>;
}

interface ActivityTimelineProps {
  profileId: string;
}

export default function ActivityTimeline({ profileId }: ActivityTimelineProps) {
  const themeColors = useThemeColors();
  const { bookings, tickets, cases } = useCRMData();
  const [filter, setFilter] = useState<'all' | 'bookings' | 'tickets' | 'cases'>('all');

  const loading = bookings.isLoading || tickets.isLoading || cases.isLoading;

  // Memoize activity transformation - only recalculates when source data changes
  const activities = useMemo(() => {
    const allActivities: Activity[] = [];

    // Transform bookings
    bookings.data.forEach((b: any) => {
      allActivities.push({
        id: `booking-${b.id}`,
        type: 'booking' as const,
        timestamp: b.scheduled_at,
        title: `Appointment: ${b.meeting_type?.name || 'Meeting'}`,
        description: b.notes || `Duration: ${b.duration_minutes} minutes`,
        status: b.status,
        metadata: b,
      });
    });

    // Transform tickets
    tickets.data.forEach((t: any) => {
      allActivities.push({
        id: `ticket-${t.id}`,
        type: 'ticket' as const,
        timestamp: t.created_at,
        title: `Support Ticket: ${t.subject || 'Untitled'}`,
        description: t.message,
        status: t.status,
        metadata: t,
      });
    });

    // Transform cases
    cases.data.forEach((c: any) => {
      allActivities.push({
        id: `case-created-${c.id}`,
        type: 'case_created' as const,
        timestamp: c.created_at,
        title: `Case Created: ${c.title}`,
        description: `Case #${c.case_number} - ${c.case_type}`,
        status: c.status,
        metadata: c,
      });

      if (c.updated_at && c.updated_at !== c.created_at) {
        allActivities.push({
          id: `case-updated-${c.id}`,
          type: 'case_updated' as const,
          timestamp: c.updated_at,
          title: `Case Updated: ${c.title}`,
          description: `Status: ${c.status}`,
          status: c.status,
          metadata: c,
        });
      }
    });

    // Sort by timestamp descending
    return allActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [bookings.data, tickets.data, cases.data]);

  const stats = useMemo(() => {
    return {
      total: activities.length,
      bookings: activities.filter(a => a.type === 'booking').length,
      tickets: activities.filter(a => a.type === 'ticket').length,
      cases: activities.filter(a => a.type === 'case_created' || a.type === 'case_updated').length,
    };
  }, [activities]);

  const filteredActivities = useMemo(() => {
    if (filter === 'all') return activities;
    if (filter === 'bookings') return activities.filter(a => a.type === 'booking');
    if (filter === 'tickets') return activities.filter(a => a.type === 'ticket');
    if (filter === 'cases') return activities.filter(a => a.type === 'case_created' || a.type === 'case_updated');
    return activities;
  }, [activities, filter]);

  const getActivityIcon = useCallback((type: string) => {
    switch (type) {
      case 'booking': return '📅';
      case 'ticket': return '🎫';
      case 'case_created': return '📁';
      case 'case_updated': return '🔄';
      default: return '📌';
    }
  }, []);

  const getActivityColor = useCallback((type: string) => {
    switch (type) {
      case 'booking': return '#667eea';
      case 'ticket': return '#f59e0b';
      case 'case_created': return '#10b981';
      case 'case_updated': return '#3b82f6';
      default: return '#6b7280';
    }
  }, []);

  const formatTimestamp = useCallback((timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      if (hours === 0) {
        const minutes = Math.floor(diffMs / (1000 * 60));
        return minutes <= 1 ? 'Just now' : `${minutes} minutes ago`;
      }
      return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
    }
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined 
    });
  }, []);

  // Activity row component for virtual list
  const ActivityRow = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const activity = filteredActivities[index];
    
    return (
      <div style={{...style, paddingBottom: '20px'}}>
        <div
          style={{
            display: 'flex',
            gap: '12px',
            padding: '16px',
            paddingBottom: '20px',
            background: '#fff',
            border: '1px solid #e0e0e0',
            borderRadius: '12px',
            transition: 'all 0.2s ease',
          }}
        >
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: `${getActivityColor(activity.type)}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            flexShrink: 0,
          }}>
            {getActivityIcon(activity.type)}
          </div>
          
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ 
              fontSize: '15px', 
              fontWeight: 600, 
              color: '#1a1a1a',
              marginBottom: '4px',
            }}>
              {activity.title}
            </div>
            
            {activity.description && (
              <div style={{ 
                fontSize: '14px', 
                color: '#666',
                marginBottom: '6px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {activity.description}
              </div>
            )}
            
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              fontSize: '13px',
              color: '#999',
            }}>
              <span>{formatTimestamp(activity.timestamp)}</span>
              {activity.status && (
                <>
                  <span>•</span>
                  <span style={{ 
                    color: getActivityColor(activity.type),
                    fontWeight: 500,
                  }}>
                    {activity.status.replace('_', ' ').toUpperCase()}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }, [filteredActivities, getActivityIcon, getActivityColor, formatTimestamp]);

  const statsCardStyle = useCallback((isActive: boolean) => ({
    padding: '16px',
    background: isActive ? `${themeColors.cssVars.primary.base}15` : '#f3f4f6',
    borderRadius: '12px',
    color: '#1f2937',
    minWidth: '140px',
    cursor: 'pointer',
    border: isActive ? `2px solid ${themeColors.cssVars.primary.base}` : '2px solid transparent',
    transition: 'all 0.2s ease',
  }), [themeColors]);

  const containerStyle = useMemo(() => ({
    width: '100%',
  }), []);

  const activityCardStyle = useMemo(() => ({
    display: 'flex',
    gap: '12px',
    padding: '16px',
    background: '#fff',
    border: '1px solid #e0e0e0',
    borderRadius: '12px',
    marginBottom: '12px',
    transition: 'all 0.2s ease',
  }), []);

  const statsContainerStyle = useMemo(() => ({
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
    maxWidth: '800px',
  }), []);

  const timelineContainerStyle = useMemo(() => ({
    position: 'relative' as const,
  }), []);

  if (loading) {
    return <SkeletonLoader cards={5} type="activity" />;
  }

  return (
    <div style={containerStyle}>
      <div style={statsContainerStyle}>
        <div 
          style={{
            ...statsCardStyle(filter === 'all'),
          }}
          onClick={() => setFilter('all')}
          onMouseEnter={(e) => {
            if (filter !== 'all') e.currentTarget.style.borderColor = '#d1d5db';
          }}
          onMouseLeave={(e) => {
            if (filter !== 'all') e.currentTarget.style.borderColor = 'transparent';
          }}
        >
          <div style={{ fontSize: '28px', fontWeight: 700, marginBottom: '4px', color: '#111827' }}>{stats.total}</div>
          <div style={{ fontSize: '13px', opacity: 0.7, fontWeight: 500 }}>All Activities</div>
        </div>
        <div 
          style={{
            ...statsCardStyle(filter === 'bookings'),
          }}
          onClick={() => setFilter('bookings')}
          onMouseEnter={(e) => {
            if (filter !== 'bookings') e.currentTarget.style.borderColor = '#d1d5db';
          }}
          onMouseLeave={(e) => {
            if (filter !== 'bookings') e.currentTarget.style.borderColor = 'transparent';
          }}
        >
          <div style={{ fontSize: '28px', fontWeight: 700, marginBottom: '4px', color: '#111827' }}>{stats.bookings}</div>
          <div style={{ fontSize: '13px', opacity: 0.7, fontWeight: 500 }}>Appointments</div>
        </div>
        <div 
          style={{
            ...statsCardStyle(filter === 'tickets'),
          }}
          onClick={() => setFilter('tickets')}
          onMouseEnter={(e) => {
            if (filter !== 'tickets') e.currentTarget.style.borderColor = '#d1d5db';
          }}
          onMouseLeave={(e) => {
            if (filter !== 'tickets') e.currentTarget.style.borderColor = 'transparent';
          }}
        >
          <div style={{ fontSize: '28px', fontWeight: 700, marginBottom: '4px', color: '#111827' }}>{stats.tickets}</div>
          <div style={{ fontSize: '13px', opacity: 0.7, fontWeight: 500 }}>Support Tickets</div>
        </div>
        <div 
          style={{
            ...statsCardStyle(filter === 'cases'),
          }}
          onClick={() => setFilter('cases')}
          onMouseEnter={(e) => {
            if (filter !== 'cases') e.currentTarget.style.borderColor = '#d1d5db';
          }}
          onMouseLeave={(e) => {
            if (filter !== 'cases') e.currentTarget.style.borderColor = 'transparent';
          }}
        >
          <div style={{ fontSize: '28px', fontWeight: 700, marginBottom: '4px', color: '#111827' }}>{stats.cases}</div>
          <div style={{ fontSize: '13px', opacity: 0.7, fontWeight: 500 }}>Cases</div>
        </div>
      </div>

      {filteredActivities.length === 0 ? (
        <div style={{ 
          padding: '40px', 
          textAlign: 'center', 
          color: '#666',
          background: '#f9fafb',
          borderRadius: '12px',
          border: '2px dashed #e0e0e0'
        }}>
          <p style={{ margin: 0, fontSize: '16px', marginBottom: '12px' }}>No activities yet</p>
          <p style={{ margin: 0, fontSize: '14px', color: '#999' }}>
            Activity will appear here as appointments are booked, tickets are created, and cases are managed
          </p>
        </div>
      ) : (
        <List
          height={500}
          itemCount={filteredActivities.length}
          itemSize={120}
          width="100%"
        >
          {ActivityRow}
        </List>
      )}
    </div>
  );
}
