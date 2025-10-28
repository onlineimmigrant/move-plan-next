'use client';

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { 
  CalendarDaysIcon, 
  ClockIcon, 
  UserIcon, 
  ChatBubbleLeftIcon,
  ChevronLeftIcon,
  CheckIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { BookingFormData, MeetingType, TimeSlot } from '@/types/meetings';
import MeetingTypeDropdown from './MeetingTypeDropdown';
import { TimeSlotSelector, SelectedSlotInfo } from '../ui';
import { useThemeColors } from '@/hooks/useThemeColors';

interface BookingFormProps {
  formData: Partial<BookingFormData>;
  availableSlots: TimeSlot[];
  meetingTypes: MeetingType[];
  onChange: (data: Partial<BookingFormData>) => void;
  onSubmit: (data: BookingFormData) => Promise<void>;
  onCancel: () => void;
  onBackToCalendar?: () => void; // Callback to return to calendar view
  isSubmitting?: boolean;
  errors?: Record<string, string>;
  use24HourFormat?: boolean; // legacy prop: Display times in 24-hour format
  timeFormat24?: boolean; // preferred prop: true = 24h, false = 12h
  timezone?: string; // User's timezone for display (optional)
  isAdmin?: boolean; // whether the current viewer is an admin
  businessHours?: { start: string; end: string }; // Organization business hours for context
  readOnlyEmail?: boolean; // whether email field should be read-only (for customers)
  selectedSlot?: TimeSlot | null; // Currently selected time slot for display in footer
}

export default function BookingForm({
  formData,
  availableSlots,
  meetingTypes,
  onChange,
  onSubmit,
  onCancel,
  onBackToCalendar,
  isSubmitting = false,
  errors = {},
  use24HourFormat,
  timeFormat24,
  timezone,
  isAdmin = false,
  businessHours,
  readOnlyEmail = false,
  selectedSlot: propSelectedSlot,
}: BookingFormProps) {
  const themeColors = useThemeColors();
  const primary = themeColors.cssVars.primary;
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(propSelectedSlot || null);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [currentStep, setCurrentStep] = useState(1); // Tab state: 1 = Time, 2 = Type, 3 = Details

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
    if (!formData.meeting_type_id) missingFields.push('Appointment Type');
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

  // Step validation
  const canProceedToStep2 = selectedSlot !== null;
  const canProceedToStep3 = canProceedToStep2 && formData.meeting_type_id !== undefined;
  const canSubmit = canProceedToStep3 && formData.customer_name && formData.customer_email;

  return (
    <form onSubmit={handleSubmit} className="h-full flex flex-col relative">
      {/* Progress Steps */}
      <div className="flex-shrink-0 px-4 py-3">
        <nav className="flex gap-3" aria-label="Booking steps">
          {[
            { num: 1, label: 'Slot', enabled: true },
            { num: 2, label: 'Type', enabled: canProceedToStep2 },
            { num: 3, label: 'Details', enabled: canProceedToStep3 }
          ].map((step) => (
            <button
              key={step.num}
              type="button"
              onClick={() => step.enabled && setCurrentStep(step.num)}
              disabled={!step.enabled}
              onMouseEnter={() => step.enabled && setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all duration-300 shadow-sm"
              style={
                currentStep === step.num
                  ? {
                      background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`,
                      color: 'white',
                      boxShadow: isHovered 
                        ? `0 4px 12px ${primary.base}40` 
                        : `0 2px 4px ${primary.base}30`
                    }
                  : {
                      backgroundColor: step.enabled && isHovered ? `${primary.lighter}33` : 'white',
                      color: step.enabled ? (isHovered ? primary.hover : primary.base) : '#9ca3af',
                      borderWidth: '1px',
                      borderStyle: 'solid',
                      borderColor: step.enabled ? (isHovered ? `${primary.base}80` : `${primary.base}40`) : '#e5e7eb',
                      cursor: step.enabled ? 'pointer' : 'not-allowed',
                      opacity: step.enabled ? 1 : 0.6
                    }
              }
              aria-pressed={currentStep === step.num}
              aria-label={`Step ${step.num}: ${step.label}`}
            >
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold"
                style={{
                  backgroundColor: currentStep === step.num 
                    ? 'rgba(255,255,255,0.25)' 
                    : currentStep > step.num 
                      ? `${primary.base}20`
                      : 'transparent'
                }}
              >
                {currentStep > step.num ? <CheckIcon className="w-3 h-3" /> : step.num}
              </span>
              <span>{step.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto pb-16">
        {/* Step 1: Time Slot Selection */}
        {currentStep === 1 && (
          <div className="p-4">
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
          </div>
        )}

        {/* Step 2: Meeting Type Selection */}
        {currentStep === 2 && (
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Appointment Type *
              </label>
              <MeetingTypeDropdown
                meetingTypes={meetingTypes}
                selectedId={formData.meeting_type_id || null}
                onSelect={(typeId) => onChange({ meeting_type_id: typeId })}
                error={errors.meeting_type_id}
                placeholder="Select an appointment type"
              />
            </div>

            {/* Selected Meeting Type Details */}
            {selectedMeetingType && (
              <div 
                className="p-3 rounded-lg border"
                style={{ 
                  borderColor: primary.lighter,
                  backgroundColor: `${primary.base}08`
                }}
              >
                <h4 className="text-xs font-bold text-gray-900 mb-1">{selectedMeetingType.name}</h4>
                {selectedMeetingType.description && (
                  <p className="text-xs text-gray-600">{selectedMeetingType.description}</p>
                )}
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-600">
                  <span className="inline-flex items-center gap-1">
                    <ClockIcon className="w-3.5 h-3.5" />
                    {selectedMeetingType.duration_minutes} min
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Customer Details */}
        {currentStep === 3 && (
          <div className="p-4 space-y-4">
            {/* Customer Name and Email */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Full Name *
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-2.5 h-4 w-4" style={{ color: primary.base }} />
                  <input
                    type="text"
                    value={formData.customer_name || ''}
                    onChange={(e) => onChange({ customer_name: e.target.value })}
                    onFocus={() => setFocusedField('customer_name')}
                    onBlur={() => setFocusedField(null)}
                    className={`w-full pl-10 pr-3 py-2 text-sm border rounded-lg focus:outline-none transition-all ${
                      errors.customer_name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    style={focusedField === 'customer_name' && !errors.customer_name ? {
                      borderColor: primary.base,
                      boxShadow: `0 0 0 3px ${primary.base}15`
                    } : undefined}
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                {errors.customer_name && (
                  <p className="mt-1 text-xs text-red-600">{errors.customer_name}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Email Address * {readOnlyEmail && <span className="text-xs font-normal text-gray-500">(Your email)</span>}
                </label>
                <div className="relative">
                  <ChatBubbleLeftIcon className="absolute left-3 top-2.5 h-4 w-4" style={{ color: primary.base }} />
                  <input
                    type="email"
                    value={formData.customer_email || ''}
                    onChange={(e) => !readOnlyEmail && onChange({ customer_email: e.target.value })}
                    onFocus={() => !readOnlyEmail && setFocusedField('customer_email')}
                    onBlur={() => setFocusedField(null)}
                    readOnly={readOnlyEmail}
                    className={`w-full pl-10 pr-3 py-2 text-sm border rounded-lg transition-all focus:outline-none ${
                      readOnlyEmail 
                        ? 'bg-gray-100 border-gray-300 cursor-not-allowed text-gray-600'
                        : errors.customer_email 
                          ? 'border-red-300 bg-red-50' 
                          : 'border-gray-300'
                    }`}
                    style={!readOnlyEmail && focusedField === 'customer_email' && !errors.customer_email ? {
                      borderColor: primary.base,
                      boxShadow: `0 0 0 3px ${primary.base}15`
                    } : undefined}
                    placeholder="your.email@example.com"
                    required
                  />
                </div>
                {errors.customer_email && (
                  <p className="mt-1 text-xs text-red-600">{errors.customer_email}</p>
                )}
              </div>

              {/* Phone Number (Optional) */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Phone Number <span className="text-xs text-gray-500 font-normal">(optional)</span>
                </label>
                <input
                  type="tel"
                  value={formData.customer_phone || ''}
                  onChange={(e) => onChange({ customer_phone: e.target.value })}
                  onFocus={() => setFocusedField('customer_phone')}
                  onBlur={() => setFocusedField(null)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none transition-all"
                  style={focusedField === 'customer_phone' ? {
                    borderColor: primary.base,
                    boxShadow: `0 0 0 3px ${primary.base}15`
                  } : undefined}
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              {/* Appointment Title (Optional) */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Appointment Title <span className="text-xs text-gray-500 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={formData.title || ''}
                  onChange={(e) => onChange({ title: e.target.value })}
                  onFocus={() => setFocusedField('title')}
                  onBlur={() => setFocusedField(null)}
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none transition-all ${
                    errors.title ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  style={focusedField === 'title' && !errors.title ? {
                    borderColor: primary.base,
                    boxShadow: `0 0 0 3px ${primary.base}15`
                  } : undefined}
                  placeholder={selectedMeetingType ? `${selectedMeetingType.name} with ${formData.customer_name || 'customer'}` : 'Appointment title'}
                />
                {errors.title && (
                  <p className="mt-1 text-xs text-red-600">{errors.title}</p>
                )}
              </div>

              {/* Description (Optional) */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Notes <span className="text-xs text-gray-500 font-normal">(optional)</span>
                </label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => onChange({ description: e.target.value })}
                  onFocus={() => setFocusedField('description')}
                  onBlur={() => setFocusedField(null)}
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none transition-all resize-none"
                  style={focusedField === 'description' ? {
                    borderColor: primary.base,
                    boxShadow: `0 0 0 3px ${primary.base}15`
                  } : undefined}
                  placeholder="Add any additional notes or agenda items..."
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Fixed Footer with Action Buttons - Absolute positioning */}
      <div className="absolute bottom-0 left-0 right-0 bg-white px-4 py-2">
        {/* Step 1: Back to Calendar, Badge center (if selected), Continue button */}
        {currentStep === 1 && (
          <div className="flex items-center justify-between">
            {/* Left: Back to Calendar button (always present) */}
            {onBackToCalendar ? (
              <button
                type="button"
                onClick={onBackToCalendar}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
              >
                <ChevronLeftIcon className="w-4 h-4" />
                <span>Calendar</span>
              </button>
            ) : (
              <div style={{ width: '100px' }}></div>
            )}

            {/* Center: Selected Date/Time Badge (only if slot selected) */}
            <div className="absolute left-1/2 transform -translate-x-1/2">
              {selectedSlot && (
                <div 
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border-2 text-xs font-semibold transition-all"
                  style={{ 
                    borderColor: primary.base,
                    color: primary.base,
                    backgroundColor: '#ffffff'
                  }}
                >
                  <span>
                    {format(selectedSlot.start, effective24 ? 'MMM d, HH:mm' : 'MMM d, h:mm a')}
                  </span>
                </div>
              )}
            </div>

            {/* Right: Continue button (only if slot selected) */}
            <div style={{ width: '100px' }} className="flex justify-end">
              {selectedSlot && (
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg transition-all shadow-md hover:shadow-lg"
                  style={{ 
                    background: `linear-gradient(to right, ${primary.base}, ${primary.hover})` 
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <span>Continue</span>
                  <ArrowRightIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Back, Badge center, Continue */}
        {currentStep === 2 && (
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
            >
              <ChevronLeftIcon className="w-4 h-4" />
              <span>Back</span>
            </button>

            {/* Selected Date/Time Badge - Centered */}
            {selectedSlot && (
              <div 
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border-2 text-xs font-semibold transition-all"
                style={{ 
                  borderColor: primary.base,
                  color: primary.base,
                  backgroundColor: '#ffffff'
                }}
              >
                <span>
                  {format(selectedSlot.start, effective24 ? 'MMM d, HH:mm' : 'MMM d, h:mm a')}
                </span>
              </div>
            )}

            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              disabled={!formData.meeting_type_id}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ 
                background: formData.meeting_type_id 
                  ? `linear-gradient(to right, ${primary.base}, ${primary.hover})` 
                  : undefined
              }}
              onMouseEnter={(e) => formData.meeting_type_id && (e.currentTarget.style.transform = 'translateY(-1px)')}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <span>Continue</span>
              <ArrowRightIcon className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step 3: Back, Badge center, Schedule Appointment */}
        {currentStep === 3 && (
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
            >
              <ChevronLeftIcon className="w-4 h-4" />
              <span>Back</span>
            </button>

            {/* Selected Date/Time Badge - Centered */}
            {selectedSlot && (
              <div 
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border-2 text-xs font-semibold transition-all"
                style={{ 
                  borderColor: primary.base,
                  color: primary.base,
                  backgroundColor: '#ffffff'
                }}
              >
                <span>
                  {format(selectedSlot.start, effective24 ? 'MMM d, HH:mm' : 'MMM d, h:mm a')}
                </span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !canSubmit}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: isSubmitting || !canSubmit 
                  ? undefined 
                  : isHovered 
                    ? `linear-gradient(to right, ${primary.hover}, ${primary.active})` 
                    : `linear-gradient(to right, ${primary.base}, ${primary.hover})`
              }}
              onMouseOver={(e) => canSubmit && !isSubmitting && (e.currentTarget.style.transform = 'translateY(-1px)')}
              onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Scheduling...</span>
                </>
              ) : (
                <>
                  <CheckIcon className="w-4 h-4" />
                  <span>Schedule Appointment</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </form>
  );
}