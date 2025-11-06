'use client';

import React, { useState } from 'react';
import MeetingsBookingModal from '@/components/modals/MeetingsModals/MeetingsBookingModal/MeetingsBookingModal';
import parse from 'html-react-parser';
import DOMPurify from 'dompurify';
import Button from '@/ui/Button';
import { CalendarIcon, CheckCircleIcon, ClockIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import { useThemeColors } from '@/hooks/useThemeColors';

interface AppointmentSectionProps {
  section: any; // Template section data
}

interface BookingConfirmation {
  email: string;
  scheduledAt: string;
  meetingTitle: string;
}

// Sanitize HTML utility
const sanitizeHTML = (html: string): string => {
  if (typeof window === 'undefined') return '';
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'u', 'span', 'br'],
    ALLOWED_ATTR: ['style', 'class']
  });
};

export default function AppointmentSection({ section }: AppointmentSectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bookingConfirmation, setBookingConfirmation] = useState<BookingConfirmation | null>(null);
  const themeColors = useThemeColors();
  const primary = themeColors.cssVars.primary;

  // Get translated content - for now just use default, can add i18n later
  const sectionTitle = section.section_title || 'Book an Appointment';
  const sectionDescription = section.section_description || 'Schedule a meeting with us';

  const handleBookingSuccess = (booking: any) => {
    // Store booking confirmation details
    setBookingConfirmation({
      email: booking.customer_email,
      scheduledAt: booking.scheduled_at,
      meetingTitle: booking.title
    });
    setIsModalOpen(false);
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  };

  return (
    <div className="w-full py-12">
      <div className="max-w-2xl mx-auto px-4">
        {!bookingConfirmation ? (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Header */}
            <div className="px-8 py-12 text-white text-center" style={{
              background: `linear-gradient(135deg, ${primary.base}, rgb(147, 51, 234))` // primary to purple-600
            }}>
              <CalendarIcon className="w-16 h-16 mx-auto mb-4 opacity-90" />
              {section.section_title && (
                <h2 className="text-3xl font-bold mb-2">
                  {parse(sanitizeHTML(sectionTitle))}
                </h2>
              )}
              {section.section_description && (
                <p className="text-white/90 text-lg">
                  {parse(sanitizeHTML(sectionDescription))}
                </p>
              )}
            </div>

            {/* Content */}
            <div className="p-8">
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
                  <p className="text-gray-700 text-lg leading-relaxed">
                    Click the button below to schedule your appointment. 
                    Choose a convenient time and we'll send you a confirmation email with the meeting link.
                  </p>
                </div>

                <button
                  onClick={() => setIsModalOpen(true)}
                  className="w-full text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                  style={{
                    background: `linear-gradient(135deg, ${primary.base}, rgb(147, 51, 234))` // primary to purple-600
                  }}
                >
                  <CalendarIcon className="w-6 h-6" />
                  Book an Appointment
                </button>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-600">
                  <p className="font-semibold text-gray-900 mb-2">📋 What to expect:</p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>Select your preferred date and time</li>
                    <li>Provide your contact information</li>
                    <li>Receive instant confirmation via email</li>
                    <li>Join the video call 15 minutes before scheduled time</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Success Header */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-8 py-12 text-white text-center">
              <CheckCircleIcon className="w-16 h-16 mx-auto mb-4 opacity-90" />
              <h2 className="text-3xl font-bold mb-2">Appointment Confirmed!</h2>
              <p className="text-green-100 text-lg">Your meeting has been successfully scheduled</p>
            </div>

            {/* Success Content */}
            <div className="p-8">
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <ClockIcon className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
                    <div className="text-left">
                      <p className="font-semibold text-gray-900">Scheduled for:</p>
                      <p className="text-gray-700">{formatDateTime(bookingConfirmation.scheduledAt)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <EnvelopeIcon className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
                    <div className="text-left">
                      <p className="font-semibold text-gray-900">Confirmation sent to:</p>
                      <p className="text-gray-700 break-all">{bookingConfirmation.email}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 text-left">
                  <p className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                    <EnvelopeIcon className="w-5 h-5" />
                    Check your email
                  </p>
                  <p className="text-blue-800 leading-relaxed">
                    We've sent you a confirmation email with the meeting link and details. 
                    You can access the video call <strong>15 minutes before</strong> the scheduled meeting time.
                  </p>
                </div>
                
                <button
                  onClick={() => setBookingConfirmation(null)}
                  className="w-full text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                  style={{
                    background: `linear-gradient(135deg, ${primary.base}, rgb(147, 51, 234))` // primary to purple-600
                  }}
                >
                  <CalendarIcon className="w-5 h-5" />
                  Book Another Appointment
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MeetingsBookingModal - opens when button is clicked */}
      <MeetingsBookingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onBookingSuccess={handleBookingSuccess}
      />
    </div>
  );
}
