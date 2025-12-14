'use client';

import { useState, useMemo, useCallback, lazy, Suspense, useEffect } from 'react';
import { useCRMData } from '@/context/CRMDataContext';
import MeetingsBookingModal from '@/components/modals/MeetingsModals/MeetingsBookingModal';
import { useMeetingLauncher } from '@/hooks/useMeetingLauncher';
import { useSettings } from '@/context/SettingsContext';
import { useThemeColors } from '@/hooks/useThemeColors';
import Button from '@/ui/Button';
import SkeletonLoader from '../SkeletonLoader';
import { formatDate, formatTime, formatTimeRange } from '@/utils/dateHelpers';

// Lazy load EventDetailsModal
const EventDetailsModal = lazy(() => import('@/components/modals/MeetingsModals/EventDetailsModal').then(m => ({ default: m.EventDetailsModal })));

interface Booking {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  meeting_type?: {
    id: string;
    name: string;
    color?: string;
    duration_minutes: number;
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
  const { bookings: bookingsData } = useCRMData();
  const bookings = bookingsData.data;
  const loading = bookingsData.isLoading;
  
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [showEventDetailsModal, setShowEventDetailsModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed' | 'cancelled'>('all');
  
  const { launchFromBooking, isLaunching } = useMeetingLauncher();
  const { settings } = useSettings();
  const themeColors = useThemeColors();

  // Memoize enriched bookings with meeting state to avoid recalculating on every render
  const enrichedBookings = useMemo(() => {
    const now = new Date();
    return bookings.map(booking => {
      const meetingStart = new Date(booking.scheduled_at);
      const fifteenMinsBefore = new Date(meetingStart.getTime() - 15 * 60000);
      const meetingEnd = new Date(meetingStart.getTime() + booking.duration_minutes * 60000);
      
      return {
        ...booking,
        _meetingState: {
          canStart: now >= fifteenMinsBefore && now <= meetingEnd && booking.status !== 'cancelled' && booking.status !== 'completed',
          isUpcomingSoon: meetingStart > now && now < fifteenMinsBefore && booking.status !== 'cancelled' && booking.status !== 'completed',
          isPast: meetingEnd < now || booking.status === 'completed',
        }
      };
    });
  }, [bookings]);

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

  const filteredBookings = useMemo(() => {
    if (filter === 'all') return enrichedBookings;
    const now = new Date();
    if (filter === 'upcoming') {
      return enrichedBookings.filter(b => {
        const bookingDate = new Date(b.scheduled_at);
        return b.status === 'confirmed' && bookingDate >= now;
      });
    }
    if (filter === 'completed') return enrichedBookings.filter(b => b.status === 'completed');
    if (filter === 'cancelled') return enrichedBookings.filter(b => b.status === 'cancelled');
    return enrichedBookings;
  }, [enrichedBookings, filter]);

  const handleBookAppointment = useCallback((caseId?: string) => {
    setSelectedCaseId(caseId || null);
    setShowBookingModal(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowBookingModal(false);
    setSelectedCaseId(null);
    bookingsData.mutate(); // Revalidate bookings cache
  }, [bookingsData]);

  const handleBookingClick = useCallback((booking: Booking) => {
    setSelectedBooking(booking);
    setShowEventDetailsModal(true);
  }, []);

  const handleCloseEventDetails = useCallback(() => {
    setShowEventDetailsModal(false);
    setSelectedBooking(null);
    bookingsData.mutate(); // Refresh bookings cache
  }, [bookingsData]);

  // These functions now just read pre-calculated state
  const canStartMeeting = useCallback((booking: any) => booking._meetingState.canStart, []);
  const isUpcomingSoon = useCallback((booking: any) => booking._meetingState.isUpcomingSoon, []);
  const isPastMeeting = useCallback((booking: any) => booking._meetingState.isPast, []);

  const handleStartMeeting = useCallback(async (booking: Booking, e: React.MouseEvent) => {
    e.stopPropagation();
    // launchFromBooking only needs the booking ID
    await launchFromBooking({ bookingId: booking.id });
  }, [launchFromBooking]);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'confirmed': return '#10b981';
      case 'completed': return '#6366f1';
      case 'cancelled': return '#ef4444';
      case 'pending': return '#f59e0b';
      default: return '#6b7280';
    }
  }, []);

  // Get primary color for gradients
  const primaryGradient = useMemo(() => {
    const baseColor = themeColors.cssVars.primary.base;
    const hoverColor = themeColors.cssVars.primary.hover;
    return `linear-gradient(135deg, ${baseColor} 0%, ${hoverColor} 100%)`;
  }, [themeColors]);

  const statsCardStyle = useCallback((gradient: string) => ({
    padding: '16px',
    background: '#f3f4f6',
    borderRadius: '12px',
    color: '#1f2937',
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
    return (
      <div style={{ 
        padding: '60px 40px', 
        textAlign: 'center', 
        color: '#666',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid #f3f4f6',
          borderTop: `4px solid ${themeColors.cssVars.primary.base}`,
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />
        <div style={{ fontSize: '15px', fontWeight: 500 }}>Loading appointments...</div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
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
          <div style={{ fontSize: '13px', opacity: 0.7, fontWeight: 500 }}>Total Bookings</div>
        </div>
        <div 
          style={{
            ...statsCardStyle(''),
            cursor: 'pointer',
            border: filter === 'upcoming' ? `2px solid ${themeColors.cssVars.primary.base}` : '2px solid transparent',
            background: filter === 'upcoming' ? `${themeColors.cssVars.primary.base}15` : '#f3f4f6',
            transition: 'all 0.2s ease',
          }}
          onClick={() => setFilter('upcoming')}
          onMouseEnter={(e) => {
            if (filter !== 'upcoming') e.currentTarget.style.borderColor = '#d1d5db';
          }}
          onMouseLeave={(e) => {
            if (filter !== 'upcoming') e.currentTarget.style.borderColor = 'transparent';
          }}
        >
          <div style={{ fontSize: '28px', fontWeight: 700, marginBottom: '4px', color: '#111827' }}>{stats.upcoming}</div>
          <div style={{ fontSize: '13px', opacity: 0.7, fontWeight: 500 }}>Upcoming</div>
        </div>
        <div 
          style={{
            ...statsCardStyle(''),
            cursor: 'pointer',
            border: filter === 'completed' ? `2px solid ${themeColors.cssVars.primary.base}` : '2px solid transparent',
            background: filter === 'completed' ? `${themeColors.cssVars.primary.base}15` : '#f3f4f6',
            transition: 'all 0.2s ease',
          }}
          onClick={() => setFilter('completed')}
          onMouseEnter={(e) => {
            if (filter !== 'completed') e.currentTarget.style.borderColor = '#d1d5db';
          }}
          onMouseLeave={(e) => {
            if (filter !== 'completed') e.currentTarget.style.borderColor = 'transparent';
          }}
        >
          <div style={{ fontSize: '28px', fontWeight: 700, marginBottom: '4px', color: '#111827' }}>{stats.completed}</div>
          <div style={{ fontSize: '13px', opacity: 0.7, fontWeight: 500 }}>Completed</div>
        </div>
        <div 
          style={{
            ...statsCardStyle(''),
            cursor: 'pointer',
            border: filter === 'cancelled' ? `2px solid ${themeColors.cssVars.primary.base}` : '2px solid transparent',
            background: filter === 'cancelled' ? `${themeColors.cssVars.primary.base}15` : '#f3f4f6',
            transition: 'all 0.2s ease',
          }}
          onClick={() => setFilter('cancelled')}
          onMouseEnter={(e) => {
            if (filter !== 'cancelled') e.currentTarget.style.borderColor = '#d1d5db';
          }}
          onMouseLeave={(e) => {
            if (filter !== 'cancelled') e.currentTarget.style.borderColor = 'transparent';
          }}
        >
          <div style={{ fontSize: '28px', fontWeight: 700, marginBottom: '4px', color: '#111827' }}>{stats.cancelled}</div>
          <div style={{ fontSize: '13px', opacity: 0.7, fontWeight: 500 }}>Cancelled</div>
        </div>
      </div>

      <div style={headerStyle}>
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#1a1a1a' }}>
          History
        </h3>
        <Button
          variant="primary"
          size="default"
          onClick={() => handleBookAppointment()}
        >
          + New
        </Button>
      </div>

      {filteredBookings.length === 0 ? (
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
            Click "+ New" to schedule the first meeting
          </p>
        </div>
      ) : (
        <div>
          {filteredBookings.map((booking) => (
            <div
              key={booking.id}
              style={{ ...bookingCardStyle, cursor: 'pointer' }}
              onClick={() => handleBookingClick(booking)}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = themeColors.cssVars.primary.base;
                e.currentTarget.style.boxShadow = `0 2px 8px ${themeColors.cssVars.primary.base}20`;
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
                    🕒 {formatTimeRange(booking.scheduled_at, booking.duration_minutes)}
                  </div>
                  {booking.case_id && (
                    <div style={{ fontSize: '13px', color: themeColors.cssVars.primary.base, marginTop: '8px' }}>
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
                  
                  {/* Start Meeting Button */}
                  {!isPastMeeting(booking) && (
                    <div style={{ marginTop: '12px' }}>
                      <Button
                        variant={canStartMeeting(booking) ? 'primary' : 'light-outline'}
                        size="default"
                        onClick={(e) => handleStartMeeting(booking, e)}
                        disabled={!canStartMeeting(booking) || isLaunching}
                        loading={isLaunching}
                        loadingText="Starting..."
                        className={canStartMeeting(booking) ? '' : ''}
                      >
                        {canStartMeeting(booking) ? 'Start Meeting' : isUpcomingSoon(booking) ? 'Available in 15 mins' : 'Starts soon'}
                      </Button>
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

      {showEventDetailsModal && selectedBooking && (
        <Suspense fallback={<div>Loading...</div>}>
          <EventDetailsModal
            isOpen={showEventDetailsModal}
            onClose={handleCloseEventDetails}
            event={{
              id: selectedBooking.id,
              title: selectedBooking.meeting_type?.name || 'Appointment',
              scheduled_at: selectedBooking.scheduled_at,
              duration_minutes: selectedBooking.duration_minutes || 60,
              status: selectedBooking.status as 'confirmed' | 'waiting' | 'in_progress' | 'completed' | 'cancelled',
              customer_name: selectedBooking.customer_name || '',
              customer_email: selectedBooking.customer_email || '',
              notes: selectedBooking.notes,
              meeting_type: selectedBooking.meeting_type,
              created_at: selectedBooking.scheduled_at,
              updated_at: selectedBooking.scheduled_at,
            }}
          />
        </Suspense>
      )}
    </div>
  );
}
