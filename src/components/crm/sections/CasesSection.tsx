'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';

interface Case {
  id: string;
  case_number: string;
  title: string;
  description?: string;
  status: string;
  case_type: string;
  priority: string;
  created_at: string;
  updated_at: string;
  deadline?: string;
  assigned_to?: string;
  billing_status?: string;
  total_billed?: number;
  booking_count?: number;
  ticket_count?: number;
}

interface CasesSectionProps {
  profileId: string;
}

interface Stats {
  total: number;
  active: number;
  pending: number;
  closed: number;
}

export default function CasesSection({ profileId }: CasesSectionProps) {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCaseId, setExpandedCaseId] = useState<string | null>(null);

  const stats = useMemo<Stats>(() => {
    return {
      total: cases.length,
      active: cases.filter(c => c.status === 'active').length,
      pending: cases.filter(c => c.status === 'pending').length,
      closed: cases.filter(c => c.status === 'closed').length,
    };
  }, [cases]);

  useEffect(() => {
    loadCases();
  }, [profileId]);

  const loadCases = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/crm/profiles/${profileId}/cases`);
      if (!response.ok) throw new Error('Failed to load cases');
      const data = await response.json();
      setCases(data.cases || []);
    } catch (error) {
      console.error('Error loading cases:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = useCallback((caseId: string) => {
    setExpandedCaseId(prev => prev === caseId ? null : caseId);
  }, []);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'under_review': return '#3b82f6';
      case 'closed': return '#6b7280';
      case 'on_hold': return '#ef4444';
      default: return '#6b7280';
    }
  }, []);

  const getPriorityColor = useCallback((priority: string) => {
    switch (priority) {
      case 'urgent': return '#ef4444';
      case 'high': return '#f59e0b';
      case 'medium': return '#3b82f6';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  }, []);

  const formatDate = useCallback((dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }, []);

  const formatCurrency = useCallback((amount: number | undefined) => {
    if (amount === undefined || amount === null) return '$0.00';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  }, []);

  const statsCardStyle = useCallback((gradient: string) => ({
    padding: '16px',
    background: gradient,
    borderRadius: '12px',
    color: '#fff',
    minWidth: '140px',
  }), []);

  const caseCardStyle = useCallback((isExpanded: boolean) => ({
    padding: '20px',
    background: '#fff',
    border: '2px solid #e0e0e0',
    borderRadius: '12px',
    marginBottom: '16px',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
    boxShadow: isExpanded ? '0 4px 12px rgba(102, 126, 234, 0.15)' : 'none',
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
        Loading cases...
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={statsContainerStyle}>
        <div style={statsCardStyle('linear-gradient(135deg, #667eea 0%, #764ba2 100%)')}>
          <div style={{ fontSize: '28px', fontWeight: 700, marginBottom: '4px' }}>{stats.total}</div>
          <div style={{ fontSize: '13px', opacity: 0.9 }}>Total Cases</div>
        </div>
        <div style={statsCardStyle('linear-gradient(135deg, #10b981 0%, #059669 100%)')}>
          <div style={{ fontSize: '28px', fontWeight: 700, marginBottom: '4px' }}>{stats.active}</div>
          <div style={{ fontSize: '13px', opacity: 0.9 }}>Active</div>
        </div>
        <div style={statsCardStyle('linear-gradient(135deg, #f59e0b 0%, #d97706 100%)')}>
          <div style={{ fontSize: '28px', fontWeight: 700, marginBottom: '4px' }}>{stats.pending}</div>
          <div style={{ fontSize: '13px', opacity: 0.9 }}>Pending</div>
        </div>
        <div style={statsCardStyle('linear-gradient(135deg, #6b7280 0%, #4b5563 100%)')}>
          <div style={{ fontSize: '28px', fontWeight: 700, marginBottom: '4px' }}>{stats.closed}</div>
          <div style={{ fontSize: '13px', opacity: 0.9 }}>Closed</div>
        </div>
      </div>

      <div style={headerStyle}>
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#1a1a1a' }}>
          Case Management
        </h3>
      </div>

      {cases.length === 0 ? (
        <div style={{ 
          padding: '40px', 
          textAlign: 'center', 
          color: '#666',
          background: '#f9fafb',
          borderRadius: '12px',
          border: '2px dashed #e0e0e0'
        }}>
          <p style={{ margin: 0, fontSize: '16px', marginBottom: '12px' }}>No cases yet</p>
          <p style={{ margin: 0, fontSize: '14px', color: '#999' }}>
            Cases will appear here when created by your legal team
          </p>
        </div>
      ) : (
        <div>
          {cases.map((caseItem) => {
            const isExpanded = expandedCaseId === caseItem.id;
            return (
              <div
                key={caseItem.id}
                style={caseCardStyle(isExpanded)}
                onClick={() => toggleExpand(caseItem.id)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#667eea';
                }}
                onMouseLeave={(e) => {
                  if (!isExpanded) {
                    e.currentTarget.style.borderColor = '#e0e0e0';
                  }
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <span style={{ 
                        fontSize: '12px', 
                        fontWeight: 600, 
                        color: '#667eea',
                        background: 'rgba(102, 126, 234, 0.1)',
                        padding: '4px 8px',
                        borderRadius: '6px',
                      }}>
                        #{caseItem.case_number}
                      </span>
                      <span style={{
                        padding: '4px 12px',
                        fontSize: '12px',
                        fontWeight: 500,
                        color: '#fff',
                        background: getStatusColor(caseItem.status),
                        borderRadius: '12px',
                      }}>
                        {caseItem.status.replace('_', ' ').toUpperCase()}
                      </span>
                      <span style={{
                        padding: '4px 12px',
                        fontSize: '12px',
                        fontWeight: 500,
                        color: '#fff',
                        background: getPriorityColor(caseItem.priority),
                        borderRadius: '12px',
                      }}>
                        {caseItem.priority.toUpperCase()}
                      </span>
                    </div>
                    
                    <h4 style={{ 
                      margin: '0 0 8px 0', 
                      fontSize: '18px', 
                      fontWeight: 600, 
                      color: '#1a1a1a' 
                    }}>
                      {caseItem.title}
                    </h4>

                    <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>
                      📋 {caseItem.case_type.replace('_', ' ').toUpperCase()}
                    </div>

                    {isExpanded && (
                      <div style={{ marginTop: '16px' }}>
                        {caseItem.description && (
                          <div style={{ 
                            padding: '12px', 
                            background: '#f9fafb', 
                            borderRadius: '8px',
                            marginBottom: '12px',
                            fontSize: '14px',
                            color: '#666',
                            lineHeight: '1.6'
                          }}>
                            {caseItem.description}
                          </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                          <div style={{ padding: '12px', background: '#f9fafb', borderRadius: '8px' }}>
                            <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>Created</div>
                            <div style={{ fontSize: '14px', fontWeight: 600, color: '#1a1a1a' }}>
                              {formatDate(caseItem.created_at)}
                            </div>
                          </div>
                          <div style={{ padding: '12px', background: '#f9fafb', borderRadius: '8px' }}>
                            <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>Deadline</div>
                            <div style={{ fontSize: '14px', fontWeight: 600, color: caseItem.deadline ? '#ef4444' : '#999' }}>
                              {formatDate(caseItem.deadline)}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                          <div style={{ 
                            padding: '12px', 
                            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)', 
                            borderRadius: '8px',
                            textAlign: 'center'
                          }}>
                            <div style={{ fontSize: '24px', fontWeight: 700, color: '#667eea', marginBottom: '4px' }}>
                              {caseItem.booking_count || 0}
                            </div>
                            <div style={{ fontSize: '12px', color: '#666' }}>Appointments</div>
                          </div>
                          <div style={{ 
                            padding: '12px', 
                            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)', 
                            borderRadius: '8px',
                            textAlign: 'center'
                          }}>
                            <div style={{ fontSize: '24px', fontWeight: 700, color: '#667eea', marginBottom: '4px' }}>
                              {caseItem.ticket_count || 0}
                            </div>
                            <div style={{ fontSize: '12px', color: '#666' }}>Tickets</div>
                          </div>
                          <div style={{ 
                            padding: '12px', 
                            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%)', 
                            borderRadius: '8px',
                            textAlign: 'center'
                          }}>
                            <div style={{ fontSize: '18px', fontWeight: 700, color: '#10b981', marginBottom: '4px' }}>
                              {formatCurrency(caseItem.total_billed)}
                            </div>
                            <div style={{ fontSize: '12px', color: '#666' }}>Total Billed</div>
                          </div>
                        </div>

                        {caseItem.billing_status && (
                          <div style={{ 
                            padding: '8px 12px', 
                            background: '#fff3cd', 
                            border: '1px solid #ffc107',
                            borderRadius: '8px',
                            fontSize: '13px',
                            color: '#856404'
                          }}>
                            💰 Billing Status: <strong>{caseItem.billing_status.replace('_', ' ').toUpperCase()}</strong>
                          </div>
                        )}
                      </div>
                    )}

                    {!isExpanded && (
                      <div style={{ fontSize: '13px', color: '#999', marginTop: '12px' }}>
                        Click to expand • {formatDate(caseItem.created_at)} • {caseItem.booking_count || 0} appointments • {caseItem.ticket_count || 0} tickets
                      </div>
                    )}
                  </div>

                  <div style={{ marginLeft: '16px', fontSize: '20px', color: '#667eea' }}>
                    {isExpanded ? '▼' : '▶'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
