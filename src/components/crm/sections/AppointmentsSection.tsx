'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import MeetingsBookingModal from '@/components/modals/MeetingsModals/MeetingsBookingModal';

interface Booking {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  meeting_type?: {
    name: string;
    color?: string;
  };
  case_id?: string;
  notes?: string;
  customer_email?: string;
  customer_name?: string;
}

interface AppointmentsSectionProps {
  profileId: string;
}

interface Stats {
  total: number;
  upcoming: number;
  completed: number;
  cancelled: number;
}

export default function AppointmentsSection({ profileId }: AppointmentsSectionProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);

  const stats = useMemo<Stats>(() => {
    const now = new Date();
    return {
      total: bookings.length,
      upcoming: bookings.filter(b => {
        const bookingDate = new Date(b.scheduled_at);
        return b.status === 'confirmed' && bookingDate >= now;
      }).length,
      completed: bookings.filter(b => b.status === 'completed').length,
      cancelled: bookings.filter(b => b.status === 'cancelled').length,
    };
  }, [bookings]);

  useEffect(() => {
    loadAppointments();
  }, [profileId]);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/crm/profiles/${profileId}/appointments`);
      if (!response.ok) throw new Error('Failed to load appointments');
      const data = await response.json();
      setBookings(data.bookings || []);
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookAppointment = useCallback((caseId?: string) => {
    setSelectedCaseId(caseId || null);
    setShowBookingModal(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowBookingModal(false);
    setSelectedCaseId(null);
    loadAppointments(); // Reload to show new booking
  }, []);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'confirmed': return '#10b981';
      case 'completed': return '#6366f1';
      case 'cancelled': return '#ef4444';
      case 'pending': return '#f59e0b';
      default: return '#6b7280';
    }
  }, []);

  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  }, []);

  const formatTime = useCallback((timeString: string) => {
    return timeString.substring(0, 5); // HH:MM
  }, []);

  const statsCardStyle = useCallback((gradient: string) => ({
    padding: '16px',
    background: gradient,
    borderRadius: '12px',
    color: '#fff',
    minWidth: '140px',
  }), []);

  const bookingCardStyle = useMemo(() => ({
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
        Loading appointments...
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={statsContainerStyle}>
        <div style={statsCardStyle('linear-gradient(135deg, #667eea 0%, #764ba2 100%)')}>
          <div style={{ fontSize: '28px', fontWeight: 700, marginBottom: '4px' }}>{stats.total}</div>
          <div style={{ fontSize: '13px', opacity: 0.9 }}>Total Bookings</div>
        </div>
        <div style={statsCardStyle('linear-gradient(135deg, #10b981 0%, #059669 100%)')}>
          <div style={{ fontSize: '28px', fontWeight: 700, marginBottom: '4px' }}>{stats.upcoming}</div>
          <div style={{ fontSize: '13px', opacity: 0.9 }}>Upcoming</div>
        </div>
        <div style={statsCardStyle('linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)')}>
          <div style={{ fontSize: '28px', fontWeight: 700, marginBottom: '4px' }}>{stats.completed}</div>
          <div style={{ fontSize: '13px', opacity: 0.9 }}>Completed</div>
        </div>
        <div style={statsCardStyle('linear-gradient(135deg, #ef4444 0%, #dc2626 100%)')}>
          <div style={{ fontSize: '28px', fontWeight: 700, marginBottom: '4px' }}>{stats.cancelled}</div>
          <div style={{ fontSize: '13px', opacity: 0.9 }}>Cancelled</div>
        </div>
      </div>

      <div style={headerStyle}>
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#1a1a1a' }}>
          Appointment History
        </h3>
        <button
          onClick={() => handleBookAppointment()}
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
          + Book Appointment
        </button>
      </div>

      {bookings.length === 0 ? (
        <div style={{ 
          padding: '40px', 
          textAlign: 'center', 
          color: '#666',
          background: '#f9fafb',
          borderRadius: '12px',
          border: '2px dashed #e0e0e0'
        }}>
          <p style={{ margin: 0, fontSize: '16px', marginBottom: '12px' }}>No appointments yet</p>
          <p style={{ margin: 0, fontSize: '14px', color: '#999' }}>
            Click "Book Appointment" to schedule the first meeting
          </p>
        </div>
      ) : (
        <div>
          {bookings.map((booking) => (
            <div
              key={booking.id}
              style={bookingCardStyle}
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
                      {booking.meeting_type?.name || 'Appointment'}
                    </span>
                    <span style={{
                      padding: '4px 12px',
                      fontSize: '12px',
                      fontWeight: 500,
                      color: '#fff',
                      background: getStatusColor(booking.status),
                      borderRadius: '12px',
                    }}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                  </div>
                  <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>
                    📅 {formatDate(booking.scheduled_at)}
                  </div>
                  <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>
                    🕒 {formatTime(booking.scheduled_at)} ({booking.duration_minutes} mins)
                  </div>
                  {booking.case_id && (
                    <div style={{ fontSize: '13px', color: '#667eea', marginTop: '8px' }}>
                      🗂️ Linked to Case #{booking.case_id.substring(0, 8)}
                    </div>
                  )}
                  {booking.notes && (
                    <div style={{ 
                      fontSize: '13px', 
                      color: '#666', 
                      marginTop: '8px',
                      padding: '8px',
                      background: '#f9fafb',
                      borderRadius: '6px',
                      fontStyle: 'italic'
                    }}>
                      "{booking.notes}"
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showBookingModal && (
        <MeetingsBookingModal
          isOpen={showBookingModal}
          onClose={handleCloseModal}
          prefilledData={{
            customerId: profileId,
            caseId: selectedCaseId,
          }}
        />
      )}
    </div>
  );
}
