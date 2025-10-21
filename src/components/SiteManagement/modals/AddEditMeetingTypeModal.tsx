// Add/Edit Meeting Type Modal
'use client';

import React, { useState, useEffect } from 'react';
import { BaseModal } from '../../modals/_shared/BaseModal';

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
}

export default function AddEditMeetingTypeModal({
  isOpen,
  onClose,
  onSave,
  organizationId,
  meetingType,
}: AddEditMeetingTypeModalProps) {
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

  const handleChange = (field: keyof MeetingType, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  const commonDurations = [15, 30, 45, 60, 90, 120];
  const commonColors = [
    { name: 'Teal', value: '#14b8a6' },
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Purple', value: '#a855f7' },
    { name: 'Pink', value: '#ec4899' },
    { name: 'Orange', value: '#f97316' },
    { name: 'Green', value: '#22c55e' },
  ];

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditMode ? 'Edit Meeting Type' : 'Add Meeting Type'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Name */}
        <div className="space-y-3">
          <label htmlFor="name" className="block text-xs font-medium text-gray-700 mb-1">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="e.g., Consultation, Demo, Support Call"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            required
            disabled={loading}
          />
        </div>

        {/* Description */}
        <div className="space-y-3">
          <label htmlFor="description" className="block text-xs font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Brief description of this meeting type..."
            rows={3}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
            disabled={loading}
          />
        </div>

        {/* Duration */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-900">Duration (minutes) <span className="text-red-500">*</span></h3>
          <div className="grid grid-cols-3 gap-2">
            {commonDurations.map((duration) => (
              <button
                key={duration}
                type="button"
                onClick={() => handleChange('duration_minutes', duration)}
                className={`px-4 py-2 text-sm font-medium rounded-lg border-2 transition-colors ${
                  formData.duration_minutes === duration
                    ? 'border-teal-600 bg-teal-50 text-teal-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
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
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            required
            disabled={loading}
          />
        </div>

        {/* Buffer Time */}
        <div className="space-y-3">
          <label htmlFor="buffer" className="block text-xs font-medium text-gray-700 mb-1">
            Buffer Time (minutes)
          </label>
          <input
            type="number"
            id="buffer"
            value={formData.buffer_minutes}
            onChange={(e) => handleChange('buffer_minutes', parseInt(e.target.value))}
            min="0"
            placeholder="0"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            disabled={loading}
          />
          <p className="text-xs text-gray-500">
            Time before/after meeting to prevent back-to-back bookings
          </p>
        </div>

        {/* Color */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-900">Color</h3>
          <div className="flex gap-2 flex-wrap">
            {commonColors.map((color) => (
              <button
                key={color.value}
                type="button"
                onClick={() => handleChange('color', color.value)}
                className={`w-10 h-10 rounded-lg border-2 transition-all ${
                  formData.color === color.value
                    ? 'border-gray-900 ring-2 ring-teal-500 ring-offset-2'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                style={{ backgroundColor: color.value }}
                title={color.name}
                disabled={loading}
              />
            ))}
            <div className="relative">
              <input
                type="color"
                value={formData.color}
                onChange={(e) => handleChange('color', e.target.value)}
                className="w-10 h-10 rounded-lg border-2 border-gray-300 cursor-pointer hover:border-gray-400 transition-colors"
                disabled={loading}
                title="Custom color"
              />
            </div>
          </div>
        </div>

        {/* Toggles */}
        <div className="space-y-3 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Customer Choice</h3>
              <p className="text-xs text-gray-600 mt-1">
                Allow customers to select this type when booking
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleChange('is_customer_choice', !formData.is_customer_choice)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-2 ${
                formData.is_customer_choice ? 'bg-teal-600' : 'bg-gray-200'
              }`}
              disabled={loading}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  formData.is_customer_choice ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Active</h3>
              <p className="text-xs text-gray-600 mt-1">
                Inactive types won't be available for booking
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleChange('is_active', !formData.is_active)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-2 ${
                formData.is_active ? 'bg-teal-600' : 'bg-gray-200'
              }`}
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
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-br from-teal-500 to-cyan-600 rounded-lg hover:from-teal-600 hover:to-cyan-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Saving...
              </>
            ) : (
              isEditMode ? 'Save Changes' : 'Create Meeting Type'
            )}
          </button>
        </div>
      </form>
    </BaseModal>
  );
}
