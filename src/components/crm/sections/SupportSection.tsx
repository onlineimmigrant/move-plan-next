'use client';

import { useState, useMemo, useCallback, lazy, Suspense } from 'react';
import { useCRMData } from '@/context/CRMDataContext';
import { useSettings } from '@/context/SettingsContext';
import { useThemeColors } from '@/hooks/useThemeColors';
import Button from '@/ui/Button';
import SkeletonLoader from '../SkeletonLoader';

// Lazy load TicketsAdminModal
const TicketsAdminModal = lazy(() => import('@/components/modals/TicketsModals/TicketsAdminModal/TicketsAdminModal'));

interface Ticket {
  id: string;
  subject: string;
  message: string;
  status: string;
  priority?: string;
  created_at: string;
  updated_at: string;
  case_id?: string;
  assigned_to?: string;
  full_name?: string;
  email: string;
  response_count?: number;
  last_response_at?: string;
  last_message?: string;
  last_message_is_admin?: boolean;
}

interface SupportSectionProps {
  profileId: string;
}

interface Stats {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
}

export default function SupportSection({ profileId }: SupportSectionProps) {
  const { settings } = useSettings();
  const themeColors = useThemeColors();
  const { tickets: ticketsData } = useCRMData();
  const tickets = ticketsData.data;
  const loading = ticketsData.isLoading;
  
  const [showTicketsModal, setShowTicketsModal] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [showNewTicketForm, setShowNewTicketForm] = useState(false);
  const [filter, setFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved'>('all');
  const [newTicket, setNewTicket] = useState({
    subject: '',
    message: '',
    priority: 'medium',
  });

  const stats = useMemo<Stats>(() => {
    return {
      total: tickets.length,
      open: tickets.filter(t => t.status === 'open').length,
      inProgress: tickets.filter(t => t.status === 'in_progress').length,
      resolved: tickets.filter(t => t.status === 'resolved').length,
    };
  }, [tickets]);

  const filteredTickets = useMemo(() => {
    if (filter === 'all') return tickets;
    if (filter === 'open') return tickets.filter(t => t.status === 'open');
    if (filter === 'in_progress') return tickets.filter(t => t.status === 'in_progress');
    if (filter === 'resolved') return tickets.filter(t => t.status === 'resolved');
    return tickets;
  }, [tickets, filter]);

  const handleTicketClick = (ticketId: string) => {
    setSelectedTicketId(ticketId);
    setShowTicketsModal(true);
  };

  const handleCloseTicketsModal = () => {
    setShowTicketsModal(false);
    setSelectedTicketId(null);
    ticketsData.mutate(); // Refresh tickets cache
  };

  const handleCreateTicket = async () => {
    if (!newTicket.subject.trim()) {
      alert('Please enter a ticket subject');
      return;
    }

    try {
      const response = await fetch(`/api/crm/profiles/${profileId}/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: newTicket.subject,
          message: newTicket.message,
          priority: newTicket.priority,
          customer_id: profileId,
          organization_id: settings?.organization_id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create ticket');
      }
      
      setNewTicket({ subject: '', message: '', priority: 'medium' });
      setShowNewTicketForm(false);
      ticketsData.mutate(); // Refresh tickets cache
    } catch (error) {
      console.error('Error creating ticket:', error);
      alert(`Failed to create ticket: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const getPriorityColor = useCallback((priority: string) => {
    switch (priority) {
      case 'urgent': return '#ef4444';
      case 'high': return '#f59e0b';
      case 'medium': return '#3b82f6';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  }, []);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'open': return '#f59e0b';
      case 'in_progress': return '#3b82f6';
      case 'resolved': return '#10b981';
      case 'closed': return '#6b7280';
      default: return '#6b7280';
    }
  }, []);

  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }, []);

  const statsCardStyle = useCallback((gradient: string) => ({
    padding: '16px',
    background: '#f3f4f6',
    borderRadius: '12px',
    color: '#1f2937',
    minWidth: '140px',
  }), []);

  const ticketCardStyle = useMemo(() => ({
    padding: '16px',
    background: '#fff',
    border: '1px solid #e0e0e0',
    borderRadius: '12px',
    marginBottom: '12px',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
  }), []);

  const inputStyle = useMemo(() => ({
    width: '100%',
    padding: '12px',
    fontSize: '15px',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    marginBottom: '12px',
    fontFamily: 'inherit',
  }), []);

  const containerStyle = useMemo(() => ({
    width: '100%',
  }), []);

  const statsContainerStyle = useMemo(() => ({
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
    maxWidth: '800px',
  }), []);

  const headerStyle = useMemo(() => ({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  }), []);

  if (loading) {
    return <SkeletonLoader cards={3} type="ticket" />;
  }

  return (
    <div style={containerStyle}>
      <div style={statsContainerStyle}>
        <div 
          style={{
            ...statsCardStyle(''),
            cursor: 'pointer',
            border: filter === 'all' ? `2px solid ${themeColors.cssVars.primary.base}` : '2px solid transparent',
            background: filter === 'all' ? `${themeColors.cssVars.primary.base}15` : '#f3f4f6',
            transition: 'all 0.2s ease',
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
          <div style={{ fontSize: '13px', opacity: 0.7, fontWeight: 500 }}>Total Tickets</div>
        </div>
        <div 
          style={{
            ...statsCardStyle(''),
            cursor: 'pointer',
            border: filter === 'open' ? `2px solid ${themeColors.cssVars.primary.base}` : '2px solid transparent',
            background: filter === 'open' ? `${themeColors.cssVars.primary.base}15` : '#f3f4f6',
            transition: 'all 0.2s ease',
          }}
          onClick={() => setFilter('open')}
          onMouseEnter={(e) => {
            if (filter !== 'open') e.currentTarget.style.borderColor = '#d1d5db';
          }}
          onMouseLeave={(e) => {
            if (filter !== 'open') e.currentTarget.style.borderColor = 'transparent';
          }}
        >
          <div style={{ fontSize: '28px', fontWeight: 700, marginBottom: '4px', color: '#111827' }}>{stats.open}</div>
          <div style={{ fontSize: '13px', opacity: 0.7, fontWeight: 500 }}>Open</div>
        </div>
        <div 
          style={{
            ...statsCardStyle(''),
            cursor: 'pointer',
            border: filter === 'in_progress' ? `2px solid ${themeColors.cssVars.primary.base}` : '2px solid transparent',
            background: filter === 'in_progress' ? `${themeColors.cssVars.primary.base}15` : '#f3f4f6',
            transition: 'all 0.2s ease',
          }}
          onClick={() => setFilter('in_progress')}
          onMouseEnter={(e) => {
            if (filter !== 'in_progress') e.currentTarget.style.borderColor = '#d1d5db';
          }}
          onMouseLeave={(e) => {
            if (filter !== 'in_progress') e.currentTarget.style.borderColor = 'transparent';
          }}
        >
          <div style={{ fontSize: '28px', fontWeight: 700, marginBottom: '4px', color: '#111827' }}>{stats.inProgress}</div>
          <div style={{ fontSize: '13px', opacity: 0.7, fontWeight: 500 }}>In Progress</div>
        </div>
        <div 
          style={{
            ...statsCardStyle(''),
            cursor: 'pointer',
            border: filter === 'resolved' ? `2px solid ${themeColors.cssVars.primary.base}` : '2px solid transparent',
            background: filter === 'resolved' ? `${themeColors.cssVars.primary.base}15` : '#f3f4f6',
            transition: 'all 0.2s ease',
          }}
          onClick={() => setFilter('resolved')}
          onMouseEnter={(e) => {
            if (filter !== 'resolved') e.currentTarget.style.borderColor = '#d1d5db';
          }}
          onMouseLeave={(e) => {
            if (filter !== 'resolved') e.currentTarget.style.borderColor = 'transparent';
          }}
        >
          <div style={{ fontSize: '28px', fontWeight: 700, marginBottom: '4px', color: '#111827' }}>{stats.resolved}</div>
          <div style={{ fontSize: '13px', opacity: 0.7, fontWeight: 500 }}>Resolved</div>
        </div>
      </div>

      <div style={headerStyle}>
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#1a1a1a' }}>
          History
        </h3>
        <Button
          variant="primary"
          size="default"
          onClick={() => setShowNewTicketForm(!showNewTicketForm)}
        >
          {showNewTicketForm ? 'Cancel' : '+ New Ticket'}
        </Button>
      </div>

      {showNewTicketForm && (
        <div style={{
          padding: '20px',
          background: '#f9fafb',
          borderRadius: '12px',
          marginBottom: '24px',
          border: '1px solid #e0e0e0',
        }}>
          <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600, color: '#1a1a1a' }}>
            Create New Support Ticket
          </h4>
          <input
            type="text"
            placeholder="Subject"
            value={newTicket.subject}
            onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
            style={inputStyle}
          />
          <textarea
            placeholder="Message"
            value={newTicket.message}
            onChange={(e) => setNewTicket({ ...newTicket, message: e.target.value })}
            rows={4}
            style={{ ...inputStyle, resize: 'vertical' as const }}
          />
          <select
            value={newTicket.priority}
            onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
            style={inputStyle}
          >
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
            <option value="urgent">Urgent</option>
          </select>
          <Button
            variant="primary"
            size="default"
            onClick={handleCreateTicket}
          >
            Create Ticket
          </Button>
        </div>
      )}

      {tickets.length === 0 ? (
        <div style={{ 
          padding: '40px', 
          textAlign: 'center', 
          color: '#666',
          background: '#f9fafb',
          borderRadius: '12px',
          border: '2px dashed #e0e0e0'
        }}>
          <p style={{ margin: 0, fontSize: '16px', marginBottom: '12px' }}>No support tickets yet</p>
          <p style={{ margin: 0, fontSize: '14px', color: '#999' }}>
            Click "New Ticket" to create the first support request
          </p>
        </div>
      ) : (
        <div>
          {filteredTickets.map((ticket) => (
            <div
              key={ticket.id}
              style={{
                ...ticketCardStyle,
                cursor: 'pointer',
              }}
              onClick={() => handleTicketClick(ticket.id)}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#667eea';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(102, 126, 234, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e0e0e0';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                    <span style={{ 
                      fontSize: '16px', 
                      fontWeight: 600, 
                      color: '#1a1a1a' 
                    }}>
                      {ticket.subject}
                    </span>
                    {ticket.priority && (
                      <span style={{
                        padding: '4px 12px',
                        fontSize: '12px',
                        fontWeight: 500,
                        color: '#fff',
                        background: getPriorityColor(ticket.priority),
                        borderRadius: '12px',
                      }}>
                        {ticket.priority.toUpperCase()}
                      </span>
                    )}
                    <span style={{
                      padding: '4px 12px',
                      fontSize: '12px',
                      fontWeight: 500,
                      color: '#fff',
                      background: getStatusColor(ticket.status),
                      borderRadius: '12px',
                    }}>
                      {ticket.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  {ticket.last_message && (
                    <div style={{ 
                      fontSize: '14px', 
                      color: ticket.last_message_is_admin ? '#667eea' : '#666',
                      marginBottom: '8px',
                      lineHeight: '1.5',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      paddingLeft: '12px',
                      borderLeft: `3px solid ${ticket.last_message_is_admin ? '#667eea' : '#e0e0e0'}`
                    }}>
                      <span style={{ 
                        fontSize: '12px', 
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        opacity: 0.7,
                        marginRight: '8px'
                      }}>
                        {ticket.last_message_is_admin ? '👤 Support:' : '💬 Customer:'}
                      </span>
                      {ticket.last_message}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '13px', color: '#999', marginTop: '8px' }}>
                    <div>
                      📧 {ticket.email}
                    </div>
                    {ticket.response_count !== undefined && (
                      <div>
                        💬 {ticket.response_count} {ticket.response_count === 1 ? 'reply' : 'replies'}
                      </div>
                    )}
                    <div>
                      🕐 Created {formatDate(ticket.created_at)}
                    </div>
                    {ticket.last_response_at && (
                      <div>
                        ⚡ Last activity {formatDate(ticket.last_response_at)}
                      </div>
                    )}
                  </div>
                  {ticket.case_id && (
                    <div style={{ fontSize: '13px', color: '#667eea', marginTop: '4px' }}>
                      🗂️ Linked to Case #{ticket.case_id.substring(0, 8)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showTicketsModal && (
        <Suspense fallback={<div>Loading...</div>}>
          <TicketsAdminModal
            isOpen={showTicketsModal}
            onClose={handleCloseTicketsModal}
            initialTicketId={selectedTicketId || undefined}
          />
        </Suspense>
      )}
    </div>
  );
}
