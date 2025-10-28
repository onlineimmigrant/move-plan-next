'use client';

import React, { useState, useEffect } from 'react';
import { BaseModal } from '@/components/modals/_shared/BaseModal';
import { useSettings } from '@/context/SettingsContext';
import { useThemeColors } from '@/hooks/useThemeColors';
import { 
  ClockIcon, 
  CalendarIcon, 
  CheckCircleIcon,
  XCircleIcon 
} from '@heroicons/react/24/outline';

interface MeetingsSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MeetingSettings {
  organization_id: string;
  slot_duration_minutes: number;
  business_hours_start: string;
  business_hours_end: string;
  available_days: number[];
  min_booking_notice_hours: number;
  max_booking_days_ahead: number;
  auto_confirm_bookings: boolean;
  is_24_hours?: boolean; // Display time in 24-hour format (server-side preference)
}

export default function MeetingsSettingsModal({ isOpen, onClose }: MeetingsSettingsModalProps) {
  const { settings } = useSettings();
  const themeColors = useThemeColors();
  const primary = themeColors.cssVars.primary;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [meetingSettings, setMeetingSettings] = useState<MeetingSettings>({
    organization_id: settings?.organization_id || '',
    slot_duration_minutes: 30,
    business_hours_start: '09:00',
    business_hours_end: '17:00',
    available_days: [1, 2, 3, 4, 5],
    min_booking_notice_hours: 24,
    max_booking_days_ahead: 30,
    auto_confirm_bookings: false,
    is_24_hours: true,
  });

  useEffect(() => {
    if (isOpen && settings?.organization_id) {
      loadSettings();
    }
  }, [isOpen, settings?.organization_id]);

  const loadSettings = async () => {
    if (!settings?.organization_id) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/meetings/settings?organization_id=${settings.organization_id}`
      );

      if (!response.ok) {
        throw new Error('Failed to load settings');
      }

      const data = await response.json();
      setMeetingSettings({ ...data, organization_id: settings.organization_id });
    } catch (err) {
      console.error('Error loading settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings?.organization_id) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      const response = await fetch('/api/meetings/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(meetingSettings),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleDayToggle = (day: number) => {
    setMeetingSettings(prev => {
      const currentDays = prev.available_days || [1, 2, 3, 4, 5];
      const days = currentDays.includes(day)
        ? currentDays.filter(d => d !== day)
        : [...currentDays, day].sort();
      
      return { ...prev, available_days: days };
    });
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Appointment Settings"
      subtitle="Configure booking options and availability"
      size="lg"
      adminBadge={true}
      adminBadgeColor={primary.base}
    >
      <div className="space-y-6">
        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: primary.base }}></div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <XCircleIcon className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">Error</p>
              <p className="text-sm text-red-600 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
            <CheckCircleIcon className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-green-800">Settings saved successfully!</p>
            </div>
          </div>
        )}

        {/* Settings Form */}
        {!loading && (
          <div className="space-y-6">
            {/* Admin Info Banner - No top rounded corners */}
            <div 
              className="rounded-b-lg p-4"
              style={{
                background: `linear-gradient(135deg, ${primary.base}0d, ${primary.base}1a)`,
                borderBottom: `1px solid ${primary.base}33`,
                borderLeft: `1px solid ${primary.base}33`,
                borderRight: `1px solid ${primary.base}33`
              }}
            >
              <div className="flex items-start gap-3">
                            <ClockIcon 
              className="h-4 w-4 flex-shrink-0" 
              style={{ color: primary.base }}
            />
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    Admin Scheduling Access
                  </h3>
                  <p className="text-xs text-gray-600 mt-1">
                    Admins have full 24-hour scheduling access by default. Business hours below define the booking window for customers. In the admin view, customer business hours will be visually highlighted.
                  </p>
                </div>
              </div>
            </div>

            {/* Form content with padding */}
            <div className="px-6 space-y-6">

            {/* Business Hours */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900">Customer Booking Hours</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={meetingSettings.business_hours_start?.slice(0, 5) || '09:00'}
                    onChange={(e) => setMeetingSettings(prev => ({
                      ...prev,
                      business_hours_start: `${e.target.value}:00`
                    }))}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = primary.base;
                      e.currentTarget.style.boxShadow = `0 0 0 3px ${primary.base}33`;
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '';
                      e.currentTarget.style.boxShadow = '';
                    }}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={meetingSettings.business_hours_end?.slice(0, 5) || '17:00'}
                    onChange={(e) => setMeetingSettings(prev => ({
                      ...prev,
                      business_hours_end: `${e.target.value}:00`
                    }))}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = primary.base;
                      e.currentTarget.style.boxShadow = `0 0 0 3px ${primary.base}33`;
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '';
                      e.currentTarget.style.boxShadow = '';
                    }}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Slot Duration */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900">Time Slot Duration</h3>
              <div className="grid grid-cols-4 gap-3">
                {[15, 30, 45, 60].map(duration => (
                  <button
                    key={duration}
                    onClick={() => setMeetingSettings(prev => ({ ...prev, slot_duration_minutes: duration }))}
                    className="px-4 py-2 text-sm font-medium rounded-lg border-2 transition-colors"
                    style={{
                      borderColor: meetingSettings.slot_duration_minutes === duration ? primary.base : '#e5e7eb',
                      backgroundColor: meetingSettings.slot_duration_minutes === duration ? `${primary.base}1a` : 'white',
                      color: meetingSettings.slot_duration_minutes === duration ? primary.active : '#374151'
                    }}
                  >
                    {duration} min
                  </button>
                ))}
              </div>
            </div>

            {/* Available Days */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900">Available Days</h3>
              <div className="grid grid-cols-7 gap-2">
                {dayNames.map((day, index) => (
                  <button
                    key={index}
                    onClick={() => handleDayToggle(index)}
                    className="px-3 py-2 text-xs font-medium rounded-lg border-2 transition-colors"
                    style={{
                      borderColor: meetingSettings.available_days?.includes(index) ? primary.base : '#e5e7eb',
                      backgroundColor: meetingSettings.available_days?.includes(index) ? `${primary.base}1a` : 'white',
                      color: meetingSettings.available_days?.includes(index) ? primary.active : '#9ca3af'
                    }}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            {/* Booking Settings */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900">Booking Rules</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Min Notice (hours)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={meetingSettings.min_booking_notice_hours || 2}
                    onChange={(e) => setMeetingSettings(prev => ({
                      ...prev,
                      min_booking_notice_hours: parseInt(e.target.value) || 0
                    }))}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = primary.base;
                      e.currentTarget.style.boxShadow = `0 0 0 3px ${primary.base}33`;
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '';
                      e.currentTarget.style.boxShadow = '';
                    }}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Max Days Ahead
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={meetingSettings.max_booking_days_ahead || 90}
                    onChange={(e) => setMeetingSettings(prev => ({
                      ...prev,
                      max_booking_days_ahead: parseInt(e.target.value) || 1
                    }))}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = primary.base;
                      e.currentTarget.style.boxShadow = `0 0 0 3px ${primary.base}33`;
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '';
                      e.currentTarget.style.boxShadow = '';
                    }}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Auto-confirm */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Auto-confirm Bookings</h3>
                <p className="text-xs text-gray-600 mt-1">
                  Automatically confirm bookings without manual approval
                </p>
              </div>
              <button
                onClick={() => setMeetingSettings(prev => ({
                  ...prev,
                  auto_confirm_bookings: !prev.auto_confirm_bookings
                }))}
                onFocus={(e) => {
                  e.currentTarget.style.boxShadow = `0 0 0 3px ${primary.base}33`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.boxShadow = '';
                }}
                className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
                style={{
                  backgroundColor: meetingSettings.auto_confirm_bookings ? primary.base : '#e5e7eb'
                }}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    meetingSettings.auto_confirm_bookings ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* 24-Hour Format Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Use 24-Hour Time Format</h3>
                <p className="text-xs text-gray-600 mt-1">
                  Display times as 13:00 instead of 1:00 PM (applies to admin views)
                </p>
              </div>
              <button
                onClick={() => setMeetingSettings(prev => ({
                  ...prev,
                  is_24_hours: !prev.is_24_hours
                }))}
                onFocus={(e) => {
                  e.currentTarget.style.boxShadow = `0 0 0 3px ${primary.base}33`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.boxShadow = '';
                }}
                className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
                style={{
                  backgroundColor: meetingSettings.is_24_hours ? primary.base : '#e5e7eb'
                }}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    meetingSettings.is_24_hours ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Timezone Info */}
            <div 
              className="p-4 rounded-lg"
              style={{
                background: `linear-gradient(135deg, ${primary.base}0d, ${primary.base}1a)`,
                border: `1px solid ${primary.base}33`
              }}
            >
              <div className="flex items-center space-x-2">
                <ClockIcon 
                  className="h-5 w-5" 
                  style={{ color: primary.base }}
                />
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Timezone Information</h3>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Your browser timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    All times are displayed in your local timezone
                  </p>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                onMouseEnter={(e) => {
                  if (!saving) {
                    e.currentTarget.style.background = `linear-gradient(135deg, ${primary.hover}, ${primary.active})`;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!saving) {
                    e.currentTarget.style.background = `linear-gradient(135deg, ${primary.base}, ${primary.hover})`;
                  }
                }}
                className="px-6 py-2 text-sm font-medium text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                style={{
                  background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`
                }}
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Saving...
                  </>
                ) : (
                  'Save Settings'
                )}
              </button>
            </div>
            </div>
          </div>
        )}
      </div>
    </BaseModal>
  );
}
