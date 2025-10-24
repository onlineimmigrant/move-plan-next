'use client';

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { CalendarDaysIcon, ClockIcon, UserIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline';
import { BookingFormData, MeetingType, TimeSlot } from '@/types/meetings';
import MeetingTypeDropdown from './MeetingTypeDropdown';
import { TimeSlotSelector, SelectedSlotInfo } from '../ui';

interface BookingFormProps {
  formData: Partial<BookingFormData>;
  availableSlots: TimeSlot[];
  meetingTypes: MeetingType[];
  onChange: (data: Partial<BookingFormData>) => void;
  onSubmit: (data: BookingFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  errors?: Record<string, string>;
  use24HourFormat?: boolean; // legacy prop: Display times in 24-hour format
  timeFormat24?: boolean; // preferred prop: true = 24h, false = 12h
  timezone?: string; // User's timezone for display (optional)
  isAdmin?: boolean; // whether the current viewer is an admin
  businessHours?: { start: string; end: string }; // Organization business hours for context
  readOnlyEmail?: boolean; // whether email field should be read-only (for customers)
}

export default function BookingForm({
  formData,
  availableSlots,
  meetingTypes,
  onChange,
  onSubmit,
  onCancel,
  isSubmitting = false,
  errors = {},
  use24HourFormat,
  timeFormat24,
  timezone,
  isAdmin = false,
  businessHours,
  readOnlyEmail = false,
}: BookingFormProps) {
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);

  // Determine effective format preference: prefer timeFormat24, fall back to legacy use24HourFormat
  const effective24 = timeFormat24 !== undefined ? timeFormat24 : (use24HourFormat ?? true);

  // Get user's timezone info with friendly display format
  const getUserTimezoneInfo = () => {
    try {
      // Get timezone name (e.g., "America/New_York", "Europe/London")
      const timezoneName = Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      // Get timezone abbreviation (e.g., "EST", "PST", "GMT")
      const now = new Date();
      const shortFormat = new Intl.DateTimeFormat('en-US', {
        timeZone: timezoneName,
        timeZoneName: 'short'
      });
      const parts = shortFormat.formatToParts(now);
      const abbreviation = parts.find(part => part.type === 'timeZoneName')?.value || '';
      
      // Calculate UTC offset (e.g., "-05:00", "+01:00")
      const offsetMin = new Date().getTimezoneOffset();
      const totalMin = -offsetMin; // invert sign: getTimezoneOffset returns minutes behind UTC
      const sign = totalMin >= 0 ? '+' : '-';
      const absMin = Math.abs(totalMin);
      const hh = String(Math.floor(absMin / 60)).padStart(2, '0');
      const mm = String(absMin % 60).padStart(2, '0');
      const offset = `${sign}${hh}:${mm}`;
      
      // Create friendly city name (e.g., "New York" from "America/New_York")
      const cityName = timezoneName.split('/').pop()?.replace(/_/g, ' ') || timezoneName;
      
      return { 
        timezoneName, 
        cityName,
        abbreviation,
        offset 
      };
    } catch (e) {
      return { 
        timezoneName: 'UTC', 
        cityName: 'UTC',
        abbreviation: 'UTC',
        offset: '+00:00' 
      };
    }
  };
  
  const timezoneInfo = getUserTimezoneInfo();

  // Update form data when slot is selected
  useEffect(() => {
    if (selectedSlot) {
      onChange({
        scheduled_at: selectedSlot.start.toISOString(),
        duration_minutes: Math.round((selectedSlot.end.getTime() - selectedSlot.start.getTime()) / (1000 * 60)),
      });
    }
  }, [selectedSlot]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    const missingFields: string[] = [];
    if (!formData.meeting_type_id) missingFields.push('Meeting Type');
    if (!formData.customer_name) missingFields.push('Name');
    if (!formData.customer_email) missingFields.push('Email');
    if (!formData.scheduled_at) missingFields.push('Date & Time');
    
    if (missingFields.length > 0) {
      console.warn('[BookingForm] Missing required fields:', missingFields.join(', '));
      // The form UI will show which fields are required
      return;
    }

    const submitData: BookingFormData = {
      meeting_type_id: formData.meeting_type_id!,
      customer_name: formData.customer_name!,
      customer_email: formData.customer_email!,
      customer_phone: formData.customer_phone || '',
      title: formData.title || `${meetingTypes.find(mt => mt.id === formData.meeting_type_id)?.name} with ${formData.customer_name}`,
      description: formData.description || '',
      scheduled_at: formData.scheduled_at!,
      timezone: formData.timezone || 'UTC',
      duration_minutes: formData.duration_minutes || 30,
      host_user_id: '00000000-0000-0000-0000-000000000001', // Default host for now
    };

    await onSubmit(submitData);
  };

  const selectedMeetingType = meetingTypes.find(mt => mt.id === formData.meeting_type_id);

  return (
    <div className="h-full flex flex-col">
      <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 bg-gradient-to-br from-teal-500 to-cyan-600">
        <h2 className="text-base sm:text-lg md:text-xl font-bold text-white">Schedule</h2>
        <p className="text-xs sm:text-sm text-white/90 mt-0.5">Book a meeting</p>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4 md:space-y-4">
        {/* Time Slot Selection - MOVED TO TOP */}
        <TimeSlotSelector
          availableSlots={availableSlots}
          selectedSlot={selectedSlot}
          onSlotSelect={setSelectedSlot}
          timeFormat24={effective24}
          isAdmin={isAdmin}
          businessHours={businessHours}
          timezoneInfo={timezoneInfo}
          errors={errors}
        />

        {/* Selected slot info */}
        {selectedSlot && (
          <SelectedSlotInfo selectedSlot={selectedSlot} />
        )}

        {/* Meeting Type */}
        <div>
          <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
            Meeting Type *
          </label>
          <MeetingTypeDropdown
            meetingTypes={meetingTypes}
            selectedId={formData.meeting_type_id || null}
            onSelect={(typeId) => onChange({ meeting_type_id: typeId })}
            error={errors.meeting_type_id}
            placeholder="Select a meeting type"
          />
        </div>

        {/* Customer Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
              Customer Name *
            </label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-2 md:top-2.5 h-4 w-4 text-teal-500" />
              <input
                type="text"
                value={formData.customer_name || ''}
                onChange={(e) => onChange({ customer_name: e.target.value })}
                className={`w-full pl-9 pr-3 py-1.5 md:py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors ${
                  errors.customer_name ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-teal-400'
                }`}
                placeholder="Enter customer name"
                required
              />
            </div>
            {errors.customer_name && (
              <p className="mt-1 text-xs text-red-600">{errors.customer_name}</p>
            )}
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
              Email Address * {readOnlyEmail && <span className="text-xs font-normal text-gray-500">(Your email)</span>}
            </label>
            <div className="relative">
              <ChatBubbleLeftIcon className="absolute left-3 top-2 md:top-2.5 h-4 w-4 text-teal-500" />
              <input
                type="email"
                value={formData.customer_email || ''}
                onChange={(e) => !readOnlyEmail && onChange({ customer_email: e.target.value })}
                readOnly={readOnlyEmail}
                className={`w-full pl-9 pr-3 py-1.5 md:py-2 text-sm border rounded-lg transition-colors ${
                  readOnlyEmail 
                    ? 'bg-gray-100 border-gray-300 cursor-not-allowed text-gray-600'
                    : errors.customer_email 
                      ? 'border-red-300 bg-red-50 focus:outline-none focus:ring-2 focus:ring-teal-500' 
                      : 'border-gray-300 hover:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-500'
                }`}
                placeholder="customer@example.com"
                required
              />
            </div>
            {errors.customer_email && (
              <p className="mt-1 text-xs text-red-600">{errors.customer_email}</p>
            )}
          </div>
        </div>

        {/* Phone and Meeting Title Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
              Phone Number <span className="text-gray-500 font-normal">(optional)</span>
            </label>
            <input
              type="tel"
              value={formData.customer_phone || ''}
              onChange={(e) => onChange({ customer_phone: e.target.value })}
              className="w-full px-3 py-1.5 md:py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 hover:border-teal-400 transition-colors"
              placeholder="+1 (555) 123-4567"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
              Meeting Title
            </label>
            <input
              type="text"
              value={formData.title || ''}
              onChange={(e) => onChange({ title: e.target.value })}
              className={`w-full px-3 py-1.5 md:py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors ${
                errors.title ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-teal-400'
              }`}
              placeholder={selectedMeetingType ? `${selectedMeetingType.name} with ${formData.customer_name || 'customer'}` : 'Meeting title'}
            />
            {errors.title && (
              <p className="mt-1 text-xs text-red-600">{errors.title}</p>
            )}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
            Description <span className="text-gray-500 font-normal">(optional)</span>
          </label>
          <textarea
            value={formData.description || ''}
            onChange={(e) => onChange({ description: e.target.value })}
            rows={2}
            className="w-full px-3 py-1.5 md:py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 hover:border-teal-400 transition-colors resize-none"
            placeholder="Add any additional notes or agenda items..."
          />
        </div>

        {/* Form Actions */}
        <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-3 sm:pt-4 md:pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-1.5 md:py-2 text-xs sm:text-sm font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-all disabled:opacity-50"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !selectedSlot}
            className="px-4 py-1.5 md:py-2 text-xs sm:text-sm font-semibold text-white bg-gradient-to-br from-teal-500 to-cyan-600 border border-transparent rounded-lg hover:from-teal-600 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Scheduling...
              </span>
            ) : (
              'Schedule'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}