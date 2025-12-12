'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSettings } from '@/context/SettingsContext';
import { useThemeColors } from '@/hooks/useThemeColors';
import { 
  ClockIcon, 
  CalendarIcon, 
  CheckCircleIcon,
  XCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

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
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLInputElement>(null);
  const lastFocusableRef = useRef<HTMLButtonElement>(null);
  
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
      // Focus first field when modal opens
      setTimeout(() => firstFocusableRef.current?.focus(), 100);
    }
  }, [isOpen, settings?.organization_id]);

  // Focus trap for accessibility
  useEffect(() => {
    if (!isOpen) return;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusableElements = modalRef.current?.querySelectorAll(
        'input:not(:disabled), button:not(:disabled), select:not(:disabled)'
      );
      if (!focusableElements || focusableElements.length === 0) return;

      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTabKey);
    return () => document.removeEventListener('keydown', handleTabKey);
  }, [isOpen]);

  const loadSettings = useCallback(async () => {
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
  }, [settings?.organization_id]);

  const handleSave = useCallback(async () => {
    if (!settings?.organization_id) return;

    try {
      setSaving(true);
      setError(null);

      const response = await fetch('/api/meetings/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(meetingSettings),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      toast.success('Settings saved successfully!');
      setTimeout(() => onClose(), 500);
    } catch (err) {
      console.error('Error saving settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  }, [settings?.organization_id, meetingSettings, onClose]);

  const handleDayToggle = useCallback((day: number) => {
    setMeetingSettings(prev => {
      const currentDays = prev.available_days || [1, 2, 3, 4, 5];
      const days = currentDays.includes(day)
        ? currentDays.filter(d => d !== day)
        : [...currentDays, day].sort();
      
      return { ...prev, available_days: days };
    });
  }, []);

  // Memoized constants
  const dayNames = useMemo(() => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], []);
  const slotDurations = useMemo(() => [15, 30, 45, 60], []);

  // Memoized handlers
  const handleStopPropagation = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  const handleStartTimeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setMeetingSettings(prev => ({
      ...prev,
      business_hours_start: `${e.target.value}:00`
    }));
  }, []);

  const handleEndTimeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setMeetingSettings(prev => ({
      ...prev,
      business_hours_end: `${e.target.value}:00`
    }));
  }, []);

  const handleSlotDurationChange = useCallback((duration: number) => () => {
    setMeetingSettings(prev => ({ ...prev, slot_duration_minutes: duration }));
  }, []);

  const handleMinBookingNoticeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setMeetingSettings(prev => ({
      ...prev,
      min_booking_notice_hours: parseInt(e.target.value) || 0
    }));
  }, []);

  const handleMaxBookingDaysChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setMeetingSettings(prev => ({
      ...prev,
      max_booking_days_ahead: parseInt(e.target.value) || 0
    }));
  }, []);

  const handleAutoConfirmToggle = useCallback(() => {
    setMeetingSettings(prev => ({
      ...prev,
      auto_confirm_bookings: !prev.auto_confirm_bookings
    }));
  }, []);

  const handle24HourToggle = useCallback(() => {
    setMeetingSettings(prev => ({
      ...prev,
      is_24_hours: !prev.is_24_hours
    }));
  }, []);

  const handleDayClick = useCallback((index: number) => () => {
    handleDayToggle(index);
  }, [handleDayToggle]);

  const handleSaveHover = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.backgroundColor = primary.hover;
  }, [primary.hover]);

  const handleSaveLeave = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.backgroundColor = primary.base;
  }, [primary.base]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[10002] p-4 animate-in fade-in duration-200"
      onClick={onClose}
      role="presentation"
    >
      <div 
        ref={modalRef}
        className="backdrop-blur-2xl bg-white/50 dark:bg-gray-900/50 rounded-2xl shadow-2xl border border-white/20 max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-labelledby="settings-modal-title"
        aria-modal="true"
        onClick={handleStopPropagation}
        onKeyDown={(e) => {
          if (e.key === 'Escape' && !saving) {
            onClose();
          }
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/30 dark:bg-gray-800/30">
          <div>
            <div className="flex items-center gap-2">
              <ClockIcon className="w-5 h-5" style={{ color: primary.base }} />
              <h2 id="settings-modal-title" className="text-xl font-semibold text-gray-900 dark:text-white">
                Appointment Settings
              </h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Configure booking options and availability
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            disabled={saving}
            aria-label="Close modal (Esc)"
            title="Close (Esc)"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 bg-white/20 dark:bg-gray-900/20">
        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: primary.base }}></div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50/80 dark:bg-red-900/20 backdrop-blur-sm border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
            <XCircleIcon className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800 dark:text-red-200">Error</p>
              <p className="text-sm text-red-600 dark:text-red-300 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Settings Form */}
        {!loading && (
          <div className="space-y-6">
            {/* Admin Info Banner */}
            <div className="bg-blue-50/80 dark:bg-blue-900/20 backdrop-blur-sm border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <ClockIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                    Admin Scheduling Access
                  </h3>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                    Admins have full 24-hour scheduling access. Business hours below define customer booking windows.
                  </p>
                </div>
              </div>
            </div>

            {/* Business Hours */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Customer Booking Hours</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="start-time" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Start Time <span className="text-red-500" aria-label="required">*</span>
                  </label>
                  <input
                    ref={firstFocusableRef}
                    id="start-time"
                    type="time"
                    value={meetingSettings.business_hours_start?.slice(0, 5) || '09:00'}
                    onChange={handleStartTimeChange}
                    onFocus={() => setFocusedField('start-time')}
                    onBlur={() => setFocusedField(null)}
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none transition-all bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm text-gray-900 dark:text-white"
                    style={focusedField === 'start-time' ? {
                      borderColor: primary.base,
                      boxShadow: `0 0 0 3px ${primary.base}20`
                    } : undefined}
                    aria-required="true"
                  />
                </div>
                <div>
                  <label htmlFor="end-time" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    End Time <span className="text-red-500" aria-label="required">*</span>
                  </label>
                  <input
                    id="end-time"
                    type="time"
                    value={meetingSettings.business_hours_end?.slice(0, 5) || '17:00'}
                    onChange={handleEndTimeChange}
                    onFocus={() => setFocusedField('end-time')}
                    onBlur={() => setFocusedField(null)}
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none transition-all bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm text-gray-900 dark:text-white"
                    style={focusedField === 'end-time' ? {
                      borderColor: primary.base,
                      boxShadow: `0 0 0 3px ${primary.base}20`
                    } : undefined}
                    aria-required="true"
                  />
                </div>
              </div>
            </div>

            {/* Slot Duration */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Time Slot Duration</h3>
              <div className="grid grid-cols-4 gap-3">
                {slotDurations.map(duration => (
                  <button
                    key={duration}
                    type="button"
                    onClick={handleSlotDurationChange(duration)}
                    className="px-4 py-2.5 text-sm font-medium rounded-md border-2 transition-all min-h-[44px] backdrop-blur-sm"
                    style={{
                      borderColor: meetingSettings.slot_duration_minutes === duration ? primary.base : '#e5e7eb',
                      backgroundColor: meetingSettings.slot_duration_minutes === duration 
                        ? `${primary.base}` 
                        : 'rgba(255, 255, 255, 0.6)',
                      color: meetingSettings.slot_duration_minutes === duration ? 'white' : '#374151'
                    }}
                    aria-pressed={meetingSettings.slot_duration_minutes === duration}
                  >
                    {duration} min
                  </button>
                ))}
              </div>
            </div>

            {/* Available Days */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Available Days</h3>
              <div className="grid grid-cols-7 gap-2">
                {dayNames.map((day, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={handleDayClick(index)}
                    className="px-2 sm:px-3 py-2.5 text-xs font-medium rounded-md border-2 transition-all min-h-[44px] backdrop-blur-sm flex items-center justify-center"
                    style={{
                      borderColor: meetingSettings.available_days?.includes(index) ? primary.base : '#e5e7eb',
                      backgroundColor: meetingSettings.available_days?.includes(index) 
                        ? `${primary.base}` 
                        : 'rgba(255, 255, 255, 0.6)',
                      color: meetingSettings.available_days?.includes(index) ? 'white' : '#9ca3af'
                    }}
                    aria-pressed={meetingSettings.available_days?.includes(index)}
                    aria-label={`Toggle ${day}`}
                  >
                    <span className="hidden sm:inline">{day}</span>
                    <span className="sm:hidden">{day[0]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Booking Settings */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Booking Rules</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="min-notice" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Min Notice (hours) <span className="text-red-500" aria-label="required">*</span>
                  </label>
                  <input
                    id="min-notice"
                    type="number"
                    min="0"
                    value={meetingSettings.min_booking_notice_hours || 2}
                    onChange={handleMinBookingNoticeChange}
                    onFocus={() => setFocusedField('min-booking-notice')}
                    onBlur={() => setFocusedField(null)}
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none transition-all bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm text-gray-900 dark:text-white"
                    style={focusedField === 'min-notice' ? {
                      borderColor: primary.base,
                      boxShadow: `0 0 0 3px ${primary.base}20`
                    } : undefined}
                    inputMode="numeric"
                    aria-required="true"
                  />
                </div>
                <div>
                  <label htmlFor="max-days" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Max Days Ahead <span className="text-red-500" aria-label="required">*</span>
                  </label>
                  <input
                    id="max-days"
                    type="number"
                    min="1"
                    value={meetingSettings.max_booking_days_ahead || 90}
                    onChange={handleMaxBookingDaysChange}
                    onFocus={() => setFocusedField('max-booking-days')}
                    onBlur={() => setFocusedField(null)}
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none transition-all bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm text-gray-900 dark:text-white"
                    style={focusedField === 'max-days' ? {
                      borderColor: primary.base,
                      boxShadow: `0 0 0 3px ${primary.base}20`
                    } : undefined}
                    inputMode="numeric"
                    aria-required="true"
                  />
                </div>
              </div>
            </div>

            {/* Auto-confirm */}
            <div className="flex items-center justify-between p-4 bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-gray-700">
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">Auto-confirm Bookings</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Automatically confirm bookings without manual approval
                </p>
              </div>
              <button
                type="button"
                onClick={handleAutoConfirmToggle}
                className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                style={{
                  backgroundColor: meetingSettings.auto_confirm_bookings ? primary.base : '#e5e7eb'
                }}
                role="switch"
                aria-checked={meetingSettings.auto_confirm_bookings}
                aria-label="Toggle auto-confirm bookings"
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    meetingSettings.auto_confirm_bookings ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* 24-Hour Format Toggle */}
            <div className="flex items-center justify-between p-4 bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-gray-700">
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">Use 24-Hour Time Format</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Display times as 13:00 instead of 1:00 PM
                </p>
              </div>
              <button
                type="button"
                onClick={handle24HourToggle}
                className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                style={{
                  backgroundColor: meetingSettings.is_24_hours ? primary.base : '#e5e7eb'
                }}
                role="switch"
                aria-checked={meetingSettings.is_24_hours}
                aria-label="Toggle 24-hour time format"
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    meetingSettings.is_24_hours ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Timezone Info */}
            <div className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-lg p-3.5">
              <div className="flex items-start gap-3">
                <ClockIcon className="h-5 w-5 text-gray-600 dark:text-gray-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">Timezone Information</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Your browser timezone: <span className="font-mono">{Intl.DateTimeFormat().resolvedOptions().timeZone}</span>
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                    All times are displayed in your local timezone
                  </p>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-white/80 dark:hover:bg-gray-800/80 transition-colors min-h-[44px]"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                ref={lastFocusableRef}
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2.5 text-sm font-medium text-white rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 min-h-[44px] backdrop-blur-sm"
                style={{
                  backgroundColor: saving ? undefined : primary.base
                }}
                onMouseEnter={(e) => {
                  if (!saving) {
                    e.currentTarget.style.backgroundColor = primary.hover;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!saving) {
                    e.currentTarget.style.backgroundColor = primary.base;
                  }
                }}
                aria-label={saving ? 'Saving settings' : 'Save settings'}
                aria-live="polite"
                aria-busy={saving}
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
        )}
      </div>
    </div>
    </div>
  );
}
