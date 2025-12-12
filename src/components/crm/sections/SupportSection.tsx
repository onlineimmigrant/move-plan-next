'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';

interface Ticket {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  case_id?: string;
  assigned_to?: string;
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
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewTicketForm, setShowNewTicketForm] = useState(false);
  const [newTicket, setNewTicket] = useState({
    title: '',
    description: '',
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

  useEffect(() => {
    loadTickets();
  }, [profileId]);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/crm/profiles/${profileId}/tickets`);
      if (!response.ok) throw new Error('Failed to load tickets');
      const data = await response.json();
      setTickets(data.tickets || []);
    } catch (error) {
      console.error('Error loading tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async () => {
    if (!newTicket.title.trim()) {
      alert('Please enter a ticket title');
      return;
    }

    try {
      const response = await fetch(`/api/crm/profiles/${profileId}/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newTicket,
          customer_id: profileId,
        }),
      });

      if (!response.ok) throw new Error('Failed to create ticket');
      
      setNewTicket({ title: '', description: '', priority: 'medium' });
      setShowNewTicketForm(false);
      loadTickets();
    } catch (error) {
      console.error('Error creating ticket:', error);
      alert('Failed to create ticket');
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
    background: gradient,
    borderRadius: '12px',
    color: '#fff',
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

  const buttonStyle = useMemo(() => ({
    padding: '12px 24px',
    fontSize: '15px',
    fontWeight: 600,
    color: '#fff',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
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
    display: 'flex',
    gap: '16px',
    marginBottom: '24px',
    flexWrap: 'wrap' as const,
  }), []);

  const headerStyle = useMemo(() => ({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  }), []);

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
        Loading support tickets...
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={statsContainerStyle}>
        <div style={statsCardStyle('linear-gradient(135deg, #667eea 0%, #764ba2 100%)')}>
          <div style={{ fontSize: '28px', fontWeight: 700, marginBottom: '4px' }}>{stats.total}</div>
          <div style={{ fontSize: '13px', opacity: 0.9 }}>Total Tickets</div>
        </div>
        <div style={statsCardStyle('linear-gradient(135deg, #f59e0b 0%, #d97706 100%)')}>
          <div style={{ fontSize: '28px', fontWeight: 700, marginBottom: '4px' }}>{stats.open}</div>
          <div style={{ fontSize: '13px', opacity: 0.9 }}>Open</div>
        </div>
        <div style={statsCardStyle('linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)')}>
          <div style={{ fontSize: '28px', fontWeight: 700, marginBottom: '4px' }}>{stats.inProgress}</div>
          <div style={{ fontSize: '13px', opacity: 0.9 }}>In Progress</div>
        </div>
        <div style={statsCardStyle('linear-gradient(135deg, #10b981 0%, #059669 100%)')}>
          <div style={{ fontSize: '28px', fontWeight: 700, marginBottom: '4px' }}>{stats.resolved}</div>
          <div style={{ fontSize: '13px', opacity: 0.9 }}>Resolved</div>
        </div>
      </div>

      <div style={headerStyle}>
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#1a1a1a' }}>
          Support History
        </h3>
        <button
          onClick={() => setShowNewTicketForm(!showNewTicketForm)}
          style={buttonStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          {showNewTicketForm ? 'Cancel' : '+ New Ticket'}
        </button>
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
            placeholder="Ticket title"
            value={newTicket.title}
            onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
            style={inputStyle}
          />
          <textarea
            placeholder="Description (optional)"
            value={newTicket.description}
            onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
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
          <button onClick={handleCreateTicket} style={buttonStyle}>
            Create Ticket
          </button>
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
          {tickets.map((ticket) => (
            <div
              key={ticket.id}
              style={ticketCardStyle}
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ 
                      fontSize: '16px', 
                      fontWeight: 600, 
                      color: '#1a1a1a' 
                    }}>
                      {ticket.title}
                    </span>
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
                  {ticket.description && (
                    <div style={{ 
                      fontSize: '14px', 
                      color: '#666', 
                      marginBottom: '8px',
                      lineHeight: '1.5'
                    }}>
                      {ticket.description}
                    </div>
                  )}
                  <div style={{ fontSize: '13px', color: '#999', marginTop: '8px' }}>
                    Created {formatDate(ticket.created_at)}
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
    </div>
  );
}
