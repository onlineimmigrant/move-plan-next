// Meeting Types Section Component for GlobalSettingsModal
'use client';

import React, { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, ClockIcon } from '@heroicons/react/24/outline';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface MeetingType {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  buffer_minutes: number;
  is_active: boolean;
  color: string | null;
  icon: string | null;
  is_customer_choice: boolean;
  created_at: string;
  updated_at: string;
}

interface MeetingTypesProps {
  organizationId: string;
  onAddClick: () => void;
  onEditClick: (meetingType: MeetingType) => void;
}

export default function MeetingTypesSection({ organizationId, onAddClick, onEditClick }: MeetingTypesProps) {
  const [meetingTypes, setMeetingTypes] = useState<MeetingType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMeetingTypes = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/meetings/types?organization_id=${organizationId}&include_inactive=true`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch meeting types');
      }

      const data = await response.json();
      setMeetingTypes(data.meeting_types || []);
    } catch (err) {
      console.error('Error loading meeting types:', err);
      setError('Failed to load meeting types');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (organizationId) {
      loadMeetingTypes();
    }
  }, [organizationId]);

  // Listen for refresh events
  useEffect(() => {
    const handleRefresh = () => {
      loadMeetingTypes();
    };
    
    window.addEventListener('refreshMeetingTypes', handleRefresh);
    return () => window.removeEventListener('refreshMeetingTypes', handleRefresh);
  }, [organizationId]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to deactivate this meeting type?')) {
      return;
    }

    try {
      const response = await fetch(`/api/meetings/types/${id}?organization_id=${organizationId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete meeting type');
      }

      // Reload meeting types
      await loadMeetingTypes();
    } catch (err) {
      console.error('Error deleting meeting type:', err);
      alert('Failed to delete meeting type');
    }
  };

  const handleToggleActive = async (meetingType: MeetingType) => {
    try {
      const response = await fetch(`/api/meetings/types/${meetingType.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...meetingType,
          is_active: !meetingType.is_active,
          organization_id: organizationId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update meeting type');
      }

      // Reload meeting types
      await loadMeetingTypes();
    } catch (err) {
      console.error('Error updating meeting type:', err);
      alert('Failed to update meeting type');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-red-600" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-red-800">Error</p>
          <p className="text-sm text-red-600 mt-1">{error}</p>
          <button
            onClick={loadMeetingTypes}
            className="mt-2 text-xs text-red-600 hover:text-red-800 underline font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Info Banner - No top rounded corners */}
      <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-b-lg p-4 border-b border-x border-teal-200">
        <div className="flex items-start gap-3">
          <ClockIcon className="h-5 w-5 text-teal-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              Meeting Types Management
            </h3>
            <p className="text-xs text-gray-600 mt-1">
              Define different types of meetings with custom durations, colors, and availability. Toggle "Customer Choice" to make types available for customer self-booking.
            </p>
          </div>
        </div>
      </div>

      {/* Content with padding */}
      <div className="px-6 space-y-4">
        {/* Header with Add Button */}
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={onAddClick}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-br from-teal-500 to-cyan-600 rounded-lg hover:from-teal-600 hover:to-cyan-700 transition-all"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Add Type</span>
          </button>
        </div>

      {/* Meeting Types List */}
      {meetingTypes.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-sm font-semibold text-gray-900">No meeting types</h3>
          <p className="mt-2 text-xs text-gray-600">
            Get started by creating your first meeting type.
          </p>
          <button
            onClick={onAddClick}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-br from-teal-500 to-cyan-600 rounded-lg hover:from-teal-600 hover:to-cyan-700 transition-all"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Create Meeting Type</span>
          </button>
        </div>
      ) : (
        <div className="grid gap-3">
          {meetingTypes.map((meetingType) => (
            <div
              key={meetingType.id}
              className={`p-4 rounded-lg border transition-all ${
                meetingType.is_active
                  ? 'border-gray-300 bg-white hover:border-teal-400 hover:shadow-sm'
                  : 'border-gray-200 bg-gray-50 opacity-60'
              }`}
            >
              {/* Header: Name + Color */}
              <div className="flex items-start gap-3 mb-3">
                {meetingType.color && (
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0 mt-1"
                    style={{ backgroundColor: meetingType.color }}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-gray-900 truncate">
                    {meetingType.name}
                  </h4>
                </div>
              </div>

              {/* Badges: Status + Visibility */}
              <div className="flex flex-wrap items-center gap-1.5 mb-2">
                {!meetingType.is_active && (
                  <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium text-gray-600 bg-gray-200 rounded-full">
                    Inactive
                  </span>
                )}
                {!meetingType.is_customer_choice && (
                  <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium text-blue-600 bg-blue-100 rounded-full">
                    Admin Only
                  </span>
                )}
                {meetingType.is_customer_choice && meetingType.is_active && (
                  <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium text-green-600 bg-green-100 rounded-full">
                    Customer Choice
                  </span>
                )}
              </div>

              {/* Description */}
              {meetingType.description && (
                <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                  {meetingType.description}
                </p>
              )}

              {/* Time Details */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-gray-600 mb-3 pb-3 border-b border-gray-200">
                <div className="flex items-center gap-1.5">
                  <ClockIcon className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                  <span className="font-medium">{meetingType.duration_minutes}</span>
                  <span className="text-gray-500">min</span>
                </div>
                {meetingType.buffer_minutes > 0 && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-400">•</span>
                    <span className="font-medium">{meetingType.buffer_minutes}</span>
                    <span className="text-gray-500">min buffer</span>
                  </div>
                )}
              </div>

              {/* Actions - Stacked on mobile, row on desktop */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <button
                  onClick={() => onEditClick(meetingType)}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-teal-400 hover:text-teal-700 transition-colors"
                >
                  <PencilIcon className="h-3.5 w-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleToggleActive(meetingType)}
                  className={`flex-1 sm:flex-initial px-3 py-1.5 text-xs font-medium rounded-lg transition-colors border ${
                    meetingType.is_active
                      ? 'text-gray-700 bg-gray-50 hover:bg-gray-100 border-gray-300'
                      : 'text-teal-700 bg-teal-50 hover:bg-teal-100 border-teal-300'
                  }`}
                >
                  {meetingType.is_active ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

        {/* Help Info */}
        <div className="bg-gradient-to-br from-cyan-50 to-teal-50 rounded-lg p-4 border border-cyan-200">
          <div className="flex items-start gap-3">
            <svg className="h-5 w-5 text-teal-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 className="text-sm font-semibold text-gray-900">Quick Guide</h4>
              <ul className="mt-2 text-xs text-gray-600 space-y-1">
                <li>• <strong>Duration</strong>: Meeting length</li>
                <li>• <strong>Buffer</strong>: Gap before/after to prevent back-to-back bookings</li>
                <li>• <strong>Customer Choice</strong>: Allow customers to select this type</li>
                <li>• <strong>Color</strong>: Visual identifier in calendar views</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
