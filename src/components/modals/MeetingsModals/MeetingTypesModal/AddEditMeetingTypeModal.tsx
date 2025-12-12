// Add/Edit Meeting Type Modal
'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { XMarkIcon, CheckIcon, ClockIcon } from '@heroicons/react/24/outline';
import { useThemeColors } from '@/hooks/useThemeColors';

interface MeetingType {
  id?: string;
  name: string;
  description: string;
  duration_minutes: number;
  buffer_minutes: number;
  color: string;
  icon: string;
  is_customer_choice: boolean;
  is_active: boolean;
}

interface AddEditMeetingTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  organizationId: string;
  meetingType?: MeetingType | null;
  zIndex?: number;
}

export default function AddEditMeetingTypeModal({
  isOpen,
  onClose,
  onSave,
  organizationId,
  meetingType,
  zIndex = 10003,
}: AddEditMeetingTypeModalProps) {
  const themeColors = useThemeColors();
  const primary = themeColors.cssVars.primary;

  // Focus trap refs
  const modalRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLButtonElement>(null);
  const lastFocusableRef = useRef<HTMLButtonElement>(null);

  const [formData, setFormData] = useState<MeetingType>({
    name: '',
    description: '',
    duration_minutes: 30,
    buffer_minutes: 0,
    color: '#14b8a6',
    icon: 'clock',
    is_customer_choice: true,
    is_active: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditMode = !!meetingType?.id;

  const handleClose = useCallback(() => {
    if (!loading) {
      onClose();
    }
  }, [loading, onClose]);

  const handleChange = useCallback((field: keyof MeetingType, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  // Focus trap implementation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
        return;
      }

      if (e.key === 'Tab') {
        if (e.shiftKey) {
          // Shift+Tab: going backward
          if (document.activeElement === firstFocusableRef.current) {
            e.preventDefault();
            lastFocusableRef.current?.focus();
          }
        } else {
          // Tab: going forward
          if (document.activeElement === lastFocusableRef.current) {
            e.preventDefault();
            firstFocusableRef.current?.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, loading]);

  // Reset form when modal opens/closes or meetingType changes
  useEffect(() => {
    if (isOpen) {
      if (meetingType) {
        setFormData({
          id: meetingType.id,
          name: meetingType.name,
          description: meetingType.description || '',
          duration_minutes: meetingType.duration_minutes,
          buffer_minutes: meetingType.buffer_minutes,
          color: meetingType.color || '#14b8a6',
          icon: meetingType.icon || 'clock',
          is_customer_choice: meetingType.is_customer_choice,
          is_active: meetingType.is_active,
        });
      } else {
        // Reset to defaults for add mode
        setFormData({
          name: '',
          description: '',
          duration_minutes: 30,
          buffer_minutes: 0,
          color: '#14b8a6',
          icon: 'clock',
          is_customer_choice: true,
          is_active: true,
        });
      }
      setError(null);
    }
  }, [isOpen, meetingType]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validation
      if (!formData.name.trim()) {
        throw new Error('Meeting type name is required');
      }
      if (formData.duration_minutes <= 0) {
        throw new Error('Duration must be greater than 0');
      }
      if (formData.buffer_minutes < 0) {
        throw new Error('Buffer time cannot be negative');
      }

      const url = isEditMode
        ? `/api/meetings/types/${formData.id}`
        : `/api/meetings/types?organization_id=${organizationId}`;

      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          duration_minutes: formData.duration_minutes,
          buffer_minutes: formData.buffer_minutes,
          color: formData.color,
          icon: formData.icon,
          is_customer_choice: formData.is_customer_choice,
          is_active: formData.is_active,
          organization_id: organizationId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save meeting type');
      }

      // Success
      onSave();
      onClose();
    } catch (err: any) {
      console.error('Error saving meeting type:', err);
      setError(err.message || 'Failed to save meeting type');
    } finally {
      setLoading(false);
    }
  }, [formData, isEditMode, organizationId, onSave, onClose]);

  const commonDurations = useMemo(() => [15, 30, 45, 60, 90, 120], []);
  
  const commonColors = useMemo(() => [
    { name: 'Teal', value: '#14b8a6' },
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Purple', value: '#a855f7' },
    { name: 'Pink', value: '#ec4899' },
    { name: 'Orange', value: '#f97316' },
    { name: 'Green', value: '#22c55e' },
  ], []);

  const handleDurationClick = useCallback((duration: number) => {
    handleChange('duration_minutes', duration);
  }, [handleChange]);

  const handleColorClick = useCallback((color: string) => {
    handleChange('color', color);
  }, [handleChange]);

  const handleToggleCustomerChoice = useCallback(() => {
    handleChange('is_customer_choice', !formData.is_customer_choice);
  }, [handleChange, formData.is_customer_choice]);

  const handleToggleActive = useCallback(() => {
    handleChange('is_active', !formData.is_active);
  }, [handleChange, formData.is_active]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center p-4 animate-in fade-in duration-200"
      style={{ zIndex }}
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div 
        ref={modalRef}
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-white/50 dark:bg-gray-900/50 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/20 animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center gap-3">
            <ClockIcon 
              className="w-6 h-6" 
              style={{ color: primary.base }}
            />
            <h2 
              id="modal-title"
              className="text-xl font-semibold text-gray-900 dark:text-white"
            >
              {isEditMode ? 'Edit Meeting Type' : 'Add Meeting Type'}
            </h2>
          </div>
          <button
            ref={firstFocusableRef}
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Close modal (Esc)"
            title="Close (Esc)"
            disabled={loading}
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-white/20 dark:bg-gray-900/20">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50/80 dark:bg-red-900/20 backdrop-blur-sm border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}

            {/* Name */}
            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-medium text-gray-900 dark:text-white">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="e.g., Consultation, Demo, Support Call"
                className="w-full px-4 py-2.5 text-sm bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:border-transparent transition-all text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                style={{ '--tw-ring-color': primary.base } as React.CSSProperties}
                required
                disabled={loading}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-900 dark:text-white">
                Description
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Brief description of this meeting type..."
                rows={3}
                className="w-full px-4 py-2.5 text-sm bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:border-transparent transition-all resize-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                style={{ '--tw-ring-color': primary.base } as React.CSSProperties}
                disabled={loading}
              />
            </div>

            {/* Duration */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Duration (minutes) <span className="text-red-500">*</span>
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {commonDurations.map((duration) => (
                  <button
                    key={duration}
                    type="button"
                    onClick={() => handleDurationClick(duration)}
                    className={`px-4 py-2.5 text-sm font-medium rounded-lg border-2 transition-all ${
                      formData.duration_minutes === duration
                        ? 'bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm shadow-sm'
                        : 'bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm hover:bg-white/60 dark:hover:bg-gray-800/60'
                    }`}
                    style={{
                      borderColor: formData.duration_minutes === duration ? primary.base : 'transparent',
                      color: formData.duration_minutes === duration ? primary.base : undefined
                    }}
                    disabled={loading}
                  >
                    {duration} min
                  </button>
                ))}
              </div>
              <input
                type="number"
                id="duration"
                value={formData.duration_minutes}
                onChange={(e) => handleChange('duration_minutes', parseInt(e.target.value))}
                min="1"
                placeholder="Custom duration"
                className="w-full px-4 py-2.5 text-sm bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:border-transparent transition-all text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                style={{ '--tw-ring-color': primary.base } as React.CSSProperties}
                required
                disabled={loading}
              />
            </div>

            {/* Buffer Time */}
            <div className="space-y-2">
              <label htmlFor="buffer" className="block text-sm font-medium text-gray-900 dark:text-white">
                Buffer Time (minutes)
              </label>
              <input
                type="number"
                id="buffer"
                value={formData.buffer_minutes}
                onChange={(e) => handleChange('buffer_minutes', parseInt(e.target.value))}
                min="0"
                placeholder="0"
                className="w-full px-4 py-2.5 text-sm bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:border-transparent transition-all text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                style={{ '--tw-ring-color': primary.base } as React.CSSProperties}
                disabled={loading}
              />
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Time before/after meeting to prevent back-to-back bookings
              </p>
            </div>

            {/* Color */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Color</h3>
              <div className="flex gap-2 flex-wrap">
                {commonColors.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => handleColorClick(color.value)}
                    className="w-12 h-12 rounded-lg border-2 backdrop-blur-sm transition-all hover:scale-105"
                    style={{
                      backgroundColor: color.value,
                      borderColor: formData.color === color.value ? primary.base : 'transparent',
                      boxShadow: formData.color === color.value ? `0 0 0 2px ${primary.base}40` : 'none'
                    }}
                    title={color.name}
                    disabled={loading}
                  />
                ))}
                <div className="relative">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => handleChange('color', e.target.value)}
                    className="w-12 h-12 rounded-lg border-2 border-gray-300 dark:border-gray-600 cursor-pointer hover:border-gray-400 dark:hover:border-gray-500 transition-all backdrop-blur-sm"
                    disabled={loading}
                    title="Custom color"
                  />
                </div>
              </div>
            </div>

            {/* Toggles */}
            <div className="space-y-3 pt-4">
              <div className="flex items-center justify-between p-4 bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">Customer Choice</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Allow customers to select this type when booking
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleToggleCustomerChoice}
                  className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 backdrop-blur-sm"
                  style={{
                    backgroundColor: formData.is_customer_choice ? primary.base : '#e5e7eb',
                    '--tw-ring-color': primary.base
                  } as React.CSSProperties}
                  disabled={loading}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      formData.is_customer_choice ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">Active</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Inactive types won't be available for booking
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleToggleActive}
                  className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 backdrop-blur-sm"
                  style={{
                    backgroundColor: formData.is_active ? primary.base : '#e5e7eb',
                    '--tw-ring-color': primary.base
                  } as React.CSSProperties}
                  disabled={loading}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      formData.is_active ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-6">
              <button
                type="button"
                onClick={handleClose}
                className="w-full sm:w-auto px-6 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                ref={lastFocusableRef}
                type="submit"
                className="w-full sm:w-auto px-6 py-2.5 text-sm font-medium text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
                style={{
                  background: loading ? '#9ca3af' : `linear-gradient(to bottom right, ${primary.base}, ${primary.hover})`
                }}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckIcon className="w-4 h-4" />
                    {isEditMode ? 'Save Changes' : 'Create Meeting Type'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
