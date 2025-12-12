'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';

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
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'bookings' | 'tickets' | 'cases'>('all');

  useEffect(() => {
    loadActivities();
  }, [profileId]);

  const loadActivities = async () => {
    try {
      setLoading(true);
      
      // Fetch all activity types in parallel
      const [bookingsRes, ticketsRes, casesRes] = await Promise.all([
        fetch(`/api/crm/profiles/${profileId}/appointments`),
        fetch(`/api/crm/profiles/${profileId}/tickets`),
        fetch(`/api/crm/profiles/${profileId}/cases`),
      ]);

      const [bookingsData, ticketsData, casesData] = await Promise.all([
        bookingsRes.json(),
        ticketsRes.json(),
        casesRes.json(),
      ]);

      // Transform bookings into activities
      const bookingActivities: Activity[] = (bookingsData.bookings || []).map((b: any) => ({
        id: `booking-${b.id}`,
        type: 'booking' as const,
        timestamp: b.booking_date,
        title: `Appointment: ${b.meeting_type?.name || 'Meeting'}`,
        description: `${b.start_time} - ${b.end_time}`,
        status: b.status,
        metadata: b,
      }));

      // Transform tickets into activities
      const ticketActivities: Activity[] = (ticketsData.tickets || []).map((t: any) => ({
        id: `ticket-${t.id}`,
        type: 'ticket' as const,
        timestamp: t.created_at,
        title: `Support Ticket: ${t.title}`,
        description: t.description,
        status: t.status,
        metadata: t,
      }));

      // Transform cases into activities
      const caseActivities: Activity[] = (casesData.cases || []).flatMap((c: any) => {
        const activities: Activity[] = [
          {
            id: `case-created-${c.id}`,
            type: 'case_created' as const,
            timestamp: c.created_at,
            title: `Case Created: ${c.title}`,
            description: `Case #${c.case_number} - ${c.case_type}`,
            status: c.status,
            metadata: c,
          }
        ];

        // Add case update activity if updated_at is different from created_at
        if (c.updated_at && c.updated_at !== c.created_at) {
          activities.push({
            id: `case-updated-${c.id}`,
            type: 'case_updated' as const,
            timestamp: c.updated_at,
            title: `Case Updated: ${c.title}`,
            description: `Status: ${c.status}`,
            status: c.status,
            metadata: c,
          });
        }

        return activities;
      });

      // Combine and sort all activities by timestamp (most recent first)
      const allActivities = [...bookingActivities, ...ticketActivities, ...caseActivities]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      setActivities(allActivities);
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const filterButtonStyle = useCallback((isActive: boolean) => ({
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: 500,
    color: isActive ? '#fff' : '#666',
    background: isActive ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'transparent',
    border: `1px solid ${isActive ? 'transparent' : '#e0e0e0'}`,
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
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

  const containerStyle = useMemo(() => ({
    width: '100%',
  }), []);

  const filtersContainerStyle = useMemo(() => ({
    display: 'flex',
    gap: '8px',
    marginBottom: '24px',
    flexWrap: 'wrap' as const,
  }), []);

  const timelineContainerStyle = useMemo(() => ({
    position: 'relative' as const,
  }), []);

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
        Loading activity timeline...
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={filtersContainerStyle}>
        <button
          onClick={() => setFilter('all')}
          style={filterButtonStyle(filter === 'all')}
          onMouseEnter={(e) => {
            if (filter !== 'all') {
              e.currentTarget.style.background = '#f9fafb';
            }
          }}
          onMouseLeave={(e) => {
            if (filter !== 'all') {
              e.currentTarget.style.background = 'transparent';
            }
          }}
        >
          All Activity
        </button>
        <button
          onClick={() => setFilter('bookings')}
          style={filterButtonStyle(filter === 'bookings')}
          onMouseEnter={(e) => {
            if (filter !== 'bookings') {
              e.currentTarget.style.background = '#f9fafb';
            }
          }}
          onMouseLeave={(e) => {
            if (filter !== 'bookings') {
              e.currentTarget.style.background = 'transparent';
            }
          }}
        >
          Appointments
        </button>
        <button
          onClick={() => setFilter('tickets')}
          style={filterButtonStyle(filter === 'tickets')}
          onMouseEnter={(e) => {
            if (filter !== 'tickets') {
              e.currentTarget.style.background = '#f9fafb';
            }
          }}
          onMouseLeave={(e) => {
            if (filter !== 'tickets') {
              e.currentTarget.style.background = 'transparent';
            }
          }}
        >
          Support Tickets
        </button>
        <button
          onClick={() => setFilter('cases')}
          style={filterButtonStyle(filter === 'cases')}
          onMouseEnter={(e) => {
            if (filter !== 'cases') {
              e.currentTarget.style.background = '#f9fafb';
            }
          }}
          onMouseLeave={(e) => {
            if (filter !== 'cases') {
              e.currentTarget.style.background = 'transparent';
            }
          }}
        >
          Cases
        </button>
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
        <div style={timelineContainerStyle}>
          {filteredActivities.map((activity, index) => (
            <div
              key={activity.id}
              style={activityCardStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = getActivityColor(activity.type);
                e.currentTarget.style.boxShadow = `0 2px 8px ${getActivityColor(activity.type)}25`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e0e0e0';
                e.currentTarget.style.boxShadow = 'none';
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
              
              <div style={{ flex: 1 }}>
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
          ))}
        </div>
      )}
    </div>
  );
}
