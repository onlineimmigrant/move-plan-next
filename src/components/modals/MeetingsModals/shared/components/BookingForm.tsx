'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { format } from 'date-fns/format';
import { 
  CalendarDaysIcon, 
  ClockIcon, 
  UserIcon, 
  ChatBubbleLeftIcon,
  ChevronLeftIcon,
  CheckIcon,
  ArrowRightIcon,
  PhoneIcon,
  PencilIcon,
  DocumentTextIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { BookingFormData, MeetingType, TimeSlot } from '@/types/meetings';
import MeetingTypeDropdown from './MeetingTypeDropdown';
import MeetingTypeCards from './MeetingTypeCards';
import { TimeSlotSelector, SelectedSlotInfo, TimeSlotsLoading, BookingSubmissionLoading } from '../ui';
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
  isLoadingSlots?: boolean;
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
  isLoadingSlots = false,
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
  
  // Validation states
  const [emailValidation, setEmailValidation] = useState<{ isValid: boolean; message: string }>({ isValid: true, message: '' });
  const [nameValidation, setNameValidation] = useState<{ isValid: boolean; message: string }>({ isValid: true, message: '' });
  
  // Refs for auto-focus
  const nameInputRef = React.useRef<HTMLInputElement>(null);

  // Determine effective format preference: prefer timeFormat24, fall back to legacy use24HourFormat
  const effective24 = timeFormat24 !== undefined ? timeFormat24 : (use24HourFormat ?? true);

  // Get user's timezone info with friendly display format (memoized - expensive computation)
  const getUserTimezoneInfo = useCallback(() => {
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
  }, []);
  
  const timezoneInfo = useMemo(() => getUserTimezoneInfo(), [getUserTimezoneInfo]);
  
  // Validation functions (memoized)
  const validateEmail = useCallback((email: string) => {
    if (!email) return { isValid: true, message: '' };
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(email)) {
      return { isValid: false, message: 'Please enter a valid email address' };
    }
    return { isValid: true, message: '' };
  }, []);
  
  const validateName = useCallback((name: string) => {
    if (!name) return { isValid: true, message: '' };
    if (name.length < 2) {
      return { isValid: false, message: 'Name is too short' };
    }
    if (name.length > 100) {
      return { isValid: false, message: 'Name is too long' };
    }
    return { isValid: true, message: '' };
  }, []);
  
  const formatPhoneNumber = useCallback((value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  }, []);
  
  const capitalizeName = useCallback((name: string) => {
    return name
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }, []);

  // Detect if selected meeting type is "Blocked Time" (system type)
  const isBlockedTimeType = useMemo(() => {
    if (!formData.meeting_type_id) return false;
    const selectedType = meetingTypes.find(mt => mt.id === formData.meeting_type_id);
    return selectedType?.is_system_type === true || selectedType?.name === 'Blocked Time';
  }, [formData.meeting_type_id, meetingTypes]);

  // Auto-fill customer fields when "Blocked Time" is selected (admin only)
  useEffect(() => {
    if (isBlockedTimeType && isAdmin) {
      onChange({
        customer_email: 'system-blocked@internal.local',
        customer_name: 'Blocked Time',
        title: 'Blocked Time - Unavailable',
      });
    }
  }, [isBlockedTimeType, isAdmin, onChange]);

  // Update form data when slot is selected
  useEffect(() => {
    if (selectedSlot) {
      onChange({
        scheduled_at: selectedSlot.start.toISOString(),
        duration_minutes: Math.round((selectedSlot.end.getTime() - selectedSlot.start.getTime()) / (1000 * 60)),
      });
    }
  }, [selectedSlot, onChange]);
  
  // Auto-focus name field when step 3 is shown
  useEffect(() => {
    if (currentStep === 3) {
      setTimeout(() => nameInputRef.current?.focus(), 100);
    }
  }, [currentStep]);

  // Memoize selectedMeetingType before handleSubmit uses it
  const selectedMeetingType = useMemo(
    () => meetingTypes.find(mt => mt.id === formData.meeting_type_id),
    [meetingTypes, formData.meeting_type_id]
  );

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    const missingFields: string[] = [];
    if (!formData.meeting_type_id) missingFields.push('Appointment Type');
    // For blocked time, customer fields are auto-filled, so skip validation
    if (!isBlockedTimeType) {
      if (!formData.customer_name) missingFields.push('Name');
      if (!formData.customer_email) missingFields.push('Email');
    }
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
      timezone: formData.timezone || timezoneInfo.timezoneName, // Use detected browser timezone
      duration_minutes: selectedMeetingType?.duration_minutes || formData.duration_minutes || 30,
      host_user_id: '00000000-0000-0000-0000-000000000001', // Default host for now
    };

    await onSubmit(submitData);
  }, [formData, isBlockedTimeType, meetingTypes, selectedMeetingType, timezoneInfo.timezoneName, onSubmit]);
  
  // Auto-generate title if empty (after selectedMeetingType is defined)
  useEffect(() => {
    if (!formData.title && formData.customer_name && selectedMeetingType) {
      const autoTitle = `${selectedMeetingType.name} - ${formData.customer_name}`;
      onChange({ title: autoTitle });
    }
  }, [formData.customer_name, formData.title, selectedMeetingType, onChange]);

  // Step validation (memoized)
  const canProceedToStep2 = useMemo(() => selectedSlot !== null, [selectedSlot]);
  const canProceedToStep3 = useMemo(
    () => canProceedToStep2 && formData.meeting_type_id !== undefined,
    [canProceedToStep2, formData.meeting_type_id]
  );
  const canSubmit = useMemo(
    () => canProceedToStep3 && (
      isBlockedTimeType || (formData.customer_name && formData.customer_email)
    ),
    [canProceedToStep3, isBlockedTimeType, formData.customer_name, formData.customer_email]
  );

  // Memoized event handlers for step navigation and form interactions
  const handleStepClick = useCallback((step: number, enabled: boolean) => {
    if (enabled) setCurrentStep(step);
  }, []);

  const handleNextStep = useCallback(() => {
    setCurrentStep(prev => prev + 1);
  }, []);

  const handlePrevStep = useCallback(() => {
    setCurrentStep(prev => prev - 1);
  }, []);

  const handleNameChange = useCallback((value: string) => {
    onChange({ customer_name: value });
    setNameValidation(validateName(value));
  }, [onChange, validateName]);

  const handleNameBlur = useCallback(() => {
    if (formData.customer_name) {
      onChange({ customer_name: capitalizeName(formData.customer_name) });
    }
    setFocusedField(null);
  }, [formData.customer_name, onChange, capitalizeName]);

  const handleEmailChange = useCallback((value: string) => {
    if (!readOnlyEmail) {
      onChange({ customer_email: value });
      setEmailValidation(validateEmail(value));
    }
  }, [readOnlyEmail, onChange, validateEmail]);

  const handlePhoneChange = useCallback((value: string) => {
    const formatted = formatPhoneNumber(value);
    onChange({ customer_phone: formatted });
  }, [onChange, formatPhoneNumber]);

  const handleFieldFocus = useCallback((field: string) => {
    if (field !== 'customer_email' || !readOnlyEmail) {
      setFocusedField(field);
    }
  }, [readOnlyEmail]);

  const handleFieldBlur = useCallback(() => {
    setFocusedField(null);
  }, []);

  const handleHoverChange = useCallback((hovered: boolean) => {
    setIsHovered(hovered);
  }, []);

  // Memoize step configuration for performance
  const steps = useMemo(() => [
    { num: 1, label: 'Time', enabled: true },
    { num: 2, label: 'Type', enabled: canProceedToStep2 },
    { num: 3, label: 'Details', enabled: canProceedToStep3 }
  ], [canProceedToStep2, canProceedToStep3]);

  // Memoize step styles to prevent style object recreation
  const getStepStyle = useCallback((step: { num: number; enabled: boolean }) => {
    const isActive = currentStep === step.num;
    
    if (isActive) {
      return {
        background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`,
        color: 'white',
        boxShadow: isHovered 
          ? `0 4px 12px ${primary.base}40` 
          : `0 2px 4px ${primary.base}30`
      };
    }
    
    return {
      backgroundColor: 'transparent',
      color: step.enabled ? (isHovered ? primary.hover : primary.base) : '#9ca3af',
      borderWidth: '1px',
      borderStyle: 'solid' as const,
      borderColor: step.enabled ? (isHovered ? `${primary.base}80` : `${primary.base}40`) : '#e5e7eb',
      cursor: step.enabled ? 'pointer' : 'not-allowed',
      opacity: step.enabled ? 1 : 0.6
    };
  }, [currentStep, primary.base, primary.hover, isHovered]);

  // Memoize step badge style
  const getStepBadgeStyle = useCallback((stepNum: number) => ({
    backgroundColor: currentStep === stepNum 
      ? 'rgba(255,255,255,0.25)' 
      : currentStep > stepNum 
        ? `${primary.base}20`
        : 'transparent'
  }), [currentStep, primary.base]);

  // Memoize input field styles
  const getInputStyle = useCallback((fieldName: string, hasError?: boolean) => {
    if (hasError) return undefined;
    if (focusedField === fieldName) {
      return {
        borderColor: primary.base,
        ['--tw-ring-color' as string]: primary.base,
      };
    }
    return undefined;
  }, [focusedField, primary.base]);

  // Memoize button transform handlers
  const handleButtonMouseEnter = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.transform = 'translateY(-1px)';
  }, []);

  const handleButtonMouseLeave = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.transform = 'translateY(0)';
  }, []);

  // Memoize gradient button style
  const gradientButtonStyle = useMemo(() => ({
    background: `linear-gradient(to right, ${primary.base}, ${primary.hover})`
  }), [primary.base, primary.hover]);

  // Memoize hover gradient style
  const hoverGradientStyle = useMemo(() => ({
    background: `linear-gradient(to right, ${primary.hover}, ${primary.active})`
  }), [primary.hover, primary.active]);

  // Show booking submission skeleton when submitting
  if (isSubmitting) {
    return (
      <div className="h-full">
        <BookingSubmissionLoading />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="h-full flex flex-col relative">
      {/* Progress Steps */}
      <div className="flex-shrink-0 px-4 py-3">
        <nav className="flex gap-3" aria-label="Booking steps">
          {steps.map((step) => (
            <button
              key={step.num}
              type="button"
              onClick={() => handleStepClick(step.num, step.enabled)}
              disabled={!step.enabled}
              onMouseEnter={() => handleHoverChange(step.enabled)}
              onMouseLeave={() => handleHoverChange(false)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all duration-300 shadow-sm"
              style={getStepStyle(step)}
              aria-pressed={currentStep === step.num}
              aria-label={`Step ${step.num}: ${step.label}`}
            >
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold"
                style={getStepBadgeStyle(step.num)}
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
            {isLoadingSlots ? (
              <TimeSlotsLoading />
            ) : (
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
            )}
          </div>
        )}

        {/* Step 2: Meeting Type Selection */}
        {currentStep === 2 && (
          <div className="p-4 space-y-4">
            <div>
              <MeetingTypeCards
                meetingTypes={meetingTypes}
                selectedId={formData.meeting_type_id || null}
                onSelect={(typeId) => onChange({ meeting_type_id: typeId })}
                error={errors.meeting_type_id}
                selectedSlot={selectedSlot}
                timeFormat24={effective24}
              />
            </div>

            {/* Selected Meeting Type Details - Now redundant with cards, but keep for now */}
            {selectedMeetingType && false && (
              <div 
                className="p-3 rounded-lg border"
                style={{ 
                  borderColor: primary.lighter,
                  backgroundColor: `${primary.base}08`
                }}
              >
                <h4 className="text-xs font-bold text-gray-900 mb-1">{selectedMeetingType?.name}</h4>
                {selectedMeetingType?.description && (
                  <p className="text-xs text-gray-600">{selectedMeetingType?.description}</p>
                )}
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-600">
                  <span className="inline-flex items-center gap-1">
                    <ClockIcon className="w-3.5 h-3.5" />
                    {selectedMeetingType?.duration_minutes} min
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Customer Details */}
        {currentStep === 3 && (
          <div className="p-4 space-y-4 sm:space-y-5">
            {/* Blocked Time Info Message */}
            {isBlockedTimeType && isAdmin && (
              <div 
                className="p-3 rounded-lg border flex items-start gap-2"
                style={{ 
                  borderColor: primary.base,
                  backgroundColor: `${primary.base}10`
                }}
              >
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: primary.base }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm">
                  <p className="font-medium" style={{ color: primary.base }}>Blocking Time Slot</p>
                  <p className="text-xs text-gray-600 mt-0.5">This will block the selected time from customer bookings. Customer fields are auto-filled with system values.</p>
                </div>
              </div>
            )}

            {/* Required Section */}
            <div className="space-y-2.5 sm:space-y-3">
              
              {/* Two-column grid for Name and Email on desktop */}
              {!isBlockedTimeType && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Full Name */}
                <div>
                <label htmlFor="customer-name" className="block text-xs font-semibold text-gray-500 mb-1.5">
                  Full Name *
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-3 h-5 w-5" style={{ color: primary.base }} aria-hidden="true" />
                  <input
                    ref={nameInputRef}
                    id="customer-name"
                    type="text"
                    autoComplete="name"
                    autoCapitalize="words"
                    spellCheck="false"
                    maxLength={100}
                    value={formData.customer_name || ''}
                    onChange={(e) => handleNameChange(e.target.value)}
                    onFocus={() => handleFieldFocus('customer_name')}
                    onBlur={handleNameBlur}
                    className={`w-full pl-10 pr-10 py-3 text-sm sm:text-base border-2 rounded-lg focus:outline-none transition-all duration-200 focus:ring-2 focus:ring-offset-1 bg-white dark:bg-gray-50 ${
                      errors.customer_name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    style={getInputStyle('customer_name', !!errors.customer_name)}
                    placeholder="John Smith"
                    required
                    aria-required="true"
                    aria-invalid={!!errors.customer_name}
                    aria-describedby={errors.customer_name ? 'name-error' : 'name-help'}
                  />
                  {formData.customer_name && !errors.customer_name && nameValidation.isValid && (
                    <CheckCircleIcon 
                      className="absolute right-3 top-3 h-5 w-5 text-green-500"
                      aria-label="Valid"
                    />
                  )}
                </div>
                <p id="name-help" className="mt-1 text-xs text-gray-500 hidden sm:block">
                  Enter your legal name as it appears on documents
                </p>
                {!nameValidation.isValid && (
                  <p className="mt-1 text-xs text-amber-600" role="alert">
                    {nameValidation.message}
                  </p>
                )}
                {errors.customer_name && (
                  <p id="name-error" className="mt-1 text-xs text-red-600" role="alert">
                    {errors.customer_name}
                  </p>
                )}
              </div>

              {/* Email Address */}
              <div>
                <label htmlFor="customer-email" className="block text-xs font-semibold text-gray-500 mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <ChatBubbleLeftIcon className="absolute left-3 top-3 h-5 w-5" style={{ color: primary.base }} aria-hidden="true" />
                  <input
                    id="customer-email"
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    spellCheck="false"
                    maxLength={255}
                    value={formData.customer_email || ''}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    onFocus={() => handleFieldFocus('customer_email')}
                    onBlur={handleFieldBlur}
                    readOnly={readOnlyEmail}
                    className={`w-full pl-10 pr-10 py-3 text-sm sm:text-base border-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                      readOnlyEmail 
                        ? 'bg-gray-100 border-gray-300 cursor-not-allowed text-gray-600'
                        : errors.customer_email 
                          ? 'border-red-300 bg-red-50' 
                          : 'border-gray-300 bg-white dark:bg-gray-50'
                    }`}
                    style={!readOnlyEmail ? getInputStyle('customer_email', !!errors.customer_email) : undefined}
                    placeholder="john@example.com"
                    required
                    aria-required="true"
                    aria-invalid={!!errors.customer_email}
                    aria-describedby={errors.customer_email ? 'email-error' : 'email-help'}
                  />
                  {formData.customer_email && emailValidation.isValid && formData.customer_email.length > 0 && !readOnlyEmail && (
                    <CheckCircleIcon 
                      className="absolute right-3 top-3 h-5 w-5 text-green-500"
                      aria-label="Valid email"
                    />
                  )}
                </div>
                <p id="email-help" className="mt-1 text-xs text-gray-500 hidden sm:block">
                  We'll send booking confirmation to this address
                </p>
                {!emailValidation.isValid && (
                  <p className="mt-1 text-xs text-amber-600" role="alert">
                    {emailValidation.message}
                  </p>
                )}
                {errors.customer_email && (
                  <p id="email-error" className="mt-1 text-xs text-red-600" role="alert">
                    {errors.customer_email}
                  </p>
                )}
              </div>
              </div>
              )}
            </div>

            {/* Optional Section */}
            <div className="space-y-2.5 sm:space-y-3">

              {/* Two-column grid for Phone and Title on desktop */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Phone Number */}
                <div>
                <label htmlFor="customer-phone" className="block text-xs font-semibold text-gray-500 mb-1.5">
                  Phone Number
                </label>
                <div className="relative">
                  <PhoneIcon className="absolute left-3 top-3 h-5 w-5" style={{ color: primary.base }} aria-hidden="true" />
                  <input
                    id="customer-phone"
                    type="tel"
                    autoComplete="tel"
                    inputMode="tel"
                    maxLength={20}
                    value={formData.customer_phone || ''}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    onFocus={() => handleFieldFocus('customer_phone')}
                    onBlur={handleFieldBlur}
                    className="w-full pl-10 pr-3 py-3 text-sm sm:text-base border-2 border-gray-300 rounded-lg focus:outline-none transition-all duration-200 focus:ring-2 focus:ring-offset-1 bg-white dark:bg-gray-50"
                    style={getInputStyle('customer_phone')}
                    placeholder="+1 234 567 8900"
                    aria-describedby="phone-help"
                  />
                </div>
              </div>

              {/* Appointment Title */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="appointment-title" className="block text-xs font-semibold text-gray-500">
                    Appointment Title
                  </label>
                  <span className="text-xs text-gray-400 sm:hidden">
                    {formData.title?.length || 0}/200
                  </span>
                </div>
                <div className="relative">
                  <PencilIcon className="absolute left-3 top-3 h-5 w-5" style={{ color: primary.base }} aria-hidden="true" />
                  <input
                    id="appointment-title"
                    type="text"
                    autoComplete="off"
                    maxLength={200}
                    value={formData.title || ''}
                    onChange={(e) => onChange({ title: e.target.value })}
                    onFocus={() => handleFieldFocus('title')}
                    onBlur={handleFieldBlur}
                    className={`w-full pl-10 pr-3 py-3 text-sm sm:text-base border-2 rounded-lg focus:outline-none transition-all duration-200 focus:ring-2 focus:ring-offset-1 bg-white dark:bg-gray-50 ${
                      errors.title ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    style={getInputStyle('title', !!errors.title)}
                    placeholder="Initial consultation"
                  />
                </div>
                <div className="hidden sm:flex items-center justify-between mt-1">
                  <span className="text-xs text-gray-400">
                    {formData.title?.length || 0}/200
                  </span>
                </div>
                {errors.title && (
                  <p className="mt-1 text-xs text-red-600" role="alert">
                    {errors.title}
                  </p>
                )}
              </div>
              </div>

              {/* Notes - Full width on all screens */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="appointment-notes" className="block text-xs font-semibold text-gray-500">
                    Notes
                  </label>
                  <span className={`text-xs sm:hidden ${
                    (formData.description?.length || 0) > 900 
                      ? 'text-amber-600 font-semibold' 
                      : 'text-gray-400'
                  }`}>
                    {formData.description?.length || 0}/1000
                  </span>
                </div>
                <div className="relative">
                  <DocumentTextIcon className="absolute left-3 top-3 h-5 w-5" style={{ color: primary.base }} aria-hidden="true" />
                  <textarea
                    id="appointment-notes"
                    autoComplete="off"
                    spellCheck="true"
                    maxLength={1000}
                    value={formData.description || ''}
                    onChange={(e) => onChange({ description: e.target.value })}
                    onFocus={() => setFocusedField('description')}
                    onBlur={() => setFocusedField(null)}
                    rows={3}
                    className="w-full pl-10 pr-3 py-3 text-sm sm:text-base border-2 border-gray-300 rounded-lg focus:outline-none transition-all duration-200 resize-none focus:ring-2 focus:ring-offset-1 bg-white dark:bg-gray-50"
                    style={getInputStyle('description')}
                    placeholder="e.g., Questions about work permits"
                    aria-describedby="notes-help"
                  />
                </div>
                <div className="hidden sm:flex items-center justify-between mt-1">
                  <span id="notes-help" className="text-xs text-gray-500">
                    Describe your needs or questions
                  </span>
                  <span className={`text-xs ${
                    (formData.description?.length || 0) > 900 
                      ? 'text-amber-600 font-semibold' 
                      : 'text-gray-400'
                  }`}>
                    {formData.description?.length || 0}/1000
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Fixed Footer with Action Buttons - Absolute positioning */}
      <div className="absolute bottom-0 left-0 right-0 px-4 py-2">
        {/* Step 1: Back to Calendar, Badge center (if selected), Continue button */}
        {currentStep === 1 && (
          <div className="flex items-center justify-between">
            {/* Left: Back to Calendar button (always present) */}
            {onBackToCalendar ? (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onBackToCalendar();
                }}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
              >
                <ChevronLeftIcon className="w-4 h-4" />
                <span>Back</span>
              </button>
            ) : (
              <div style={{ width: '100px' }}></div>
            )}

            {/* Right: Next button (only if slot selected) */}
            <div style={{ width: '100px' }} className="flex justify-end">
              {selectedSlot && (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg transition-all shadow-md hover:shadow-lg"
                  style={gradientButtonStyle}
                  onMouseEnter={handleButtonMouseEnter}
                  onMouseLeave={handleButtonMouseLeave}
                >
                  <span>Next</span>
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
              onClick={handlePrevStep}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
            >
              <ChevronLeftIcon className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              type="button"
              onClick={handleNextStep}
              disabled={!formData.meeting_type_id}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              style={formData.meeting_type_id ? gradientButtonStyle : undefined}
              onMouseEnter={formData.meeting_type_id ? handleButtonMouseEnter : undefined}
              onMouseLeave={formData.meeting_type_id ? handleButtonMouseLeave : undefined}
            >
              <span>Next</span>
              <ArrowRightIcon className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step 3: Back, Badge center, Schedule Appointment */}
        {currentStep === 3 && (
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handlePrevStep}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
            >
              <ChevronLeftIcon className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !canSubmit}
              onMouseEnter={() => handleHoverChange(true)}
              onMouseLeave={() => handleHoverChange(false)}
              className="inline-flex items-center gap-2 px-6 py-3 text-base font-semibold text-white rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              style={
                isSubmitting || !canSubmit 
                  ? undefined 
                  : isHovered 
                    ? hoverGradientStyle
                    : gradientButtonStyle
              }
              onMouseOver={canSubmit && !isSubmitting ? handleButtonMouseEnter : undefined}
              onMouseOut={canSubmit && !isSubmitting ? handleButtonMouseLeave : undefined}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Booking...</span>
                </>
              ) : (
                <>
                  <CheckIcon className="w-5 h-5" />
                  <span>
                    Book - {selectedSlot ? format(selectedSlot.start, effective24 ? 'MMM d, HH:mm' : 'MMM d, h:mm a') : ''}
                  </span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </form>
  );
}