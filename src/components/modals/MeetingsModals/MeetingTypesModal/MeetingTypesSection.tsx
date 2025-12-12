// Meeting Types Section Component for GlobalSettingsModal
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, ClockIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { createClient } from '@supabase/supabase-js';
import { useThemeColors } from '@/hooks/useThemeColors';

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
  const themeColors = useThemeColors();
  const primary = themeColors.cssVars.primary;
  const [meetingTypes, setMeetingTypes] = useState<MeetingType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddButtonHovered, setIsAddButtonHovered] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const loadMeetingTypes = useCallback(async () => {
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
  }, [organizationId]);

  useEffect(() => {
    if (organizationId) {
      loadMeetingTypes();
    }
  }, [organizationId, loadMeetingTypes]);

  // Listen for refresh events
  useEffect(() => {
    const handleRefresh = () => {
      loadMeetingTypes();
    };
    
    window.addEventListener('refreshMeetingTypes', handleRefresh);
    return () => window.removeEventListener('refreshMeetingTypes', handleRefresh);
  }, [loadMeetingTypes]);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this meeting type? This action cannot be undone.')) {
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
  }, [organizationId, loadMeetingTypes]);

  const handleToggleActive = useCallback(async (meetingType: MeetingType) => {
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
  }, [organizationId, loadMeetingTypes]);

  // Memoized event handlers - defined before early returns
  const handleAddButtonMouseEnter = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    setIsAddButtonHovered(true);
    e.currentTarget.style.background = `linear-gradient(135deg, ${primary.hover}, ${primary.active})`;
  }, [primary.hover, primary.active]);

  const handleAddButtonMouseLeave = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    setIsAddButtonHovered(false);
    e.currentTarget.style.background = `linear-gradient(135deg, ${primary.base}, ${primary.hover})`;
  }, [primary.base, primary.hover]);

  const handleCardMouseEnter = useCallback((id: string) => {
    setHoveredCard(id);
  }, []);

  const handleCardMouseLeave = useCallback(() => {
    setHoveredCard(null);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div 
          className="animate-spin rounded-full h-8 w-8 border-b-2" 
          style={{ borderColor: primary.base }}
        ></div>
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
      {/* Header with Add Button */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={onAddClick}
          onMouseEnter={handleAddButtonMouseEnter}
          onMouseLeave={handleAddButtonMouseLeave}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition-all"
          style={{
            background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`
          }}
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
            onMouseEnter={handleAddButtonMouseEnter}
            onMouseLeave={handleAddButtonMouseLeave}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition-all"
            style={{
              background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`
            }}
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
              onMouseEnter={() => handleCardMouseEnter(meetingType.id)}
              onMouseLeave={handleCardMouseLeave}
              className={`p-4 rounded-lg border-2 transition-all backdrop-blur-sm ${
                meetingType.is_active
                  ? 'bg-white/60 dark:bg-gray-800/60 hover:shadow-lg'
                  : 'bg-gray-50/60 dark:bg-gray-700/40 opacity-60'
              }`}
              style={{
                borderColor: hoveredCard === meetingType.id && meetingType.is_active
                  ? primary.base
                  : 'transparent'
              }}
            >
              {/* Header: Name + Color */}
              <div className="flex items-start gap-3 mb-3">
                {meetingType.color && (
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0 mt-1 ring-2 ring-white/50 dark:ring-gray-900/50"
                    style={{ backgroundColor: meetingType.color }}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {meetingType.name}
                  </h4>
                </div>
              </div>

              {/* Badges: Status + Visibility */}
              <div className="flex flex-wrap items-center gap-1.5 mb-2">
                {!meetingType.is_active && (
                  <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-200/80 dark:bg-gray-700/80 backdrop-blur-sm rounded-full">
                    Inactive
                  </span>
                )}
                {!meetingType.is_customer_choice && (
                  <span 
                    className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full backdrop-blur-sm"
                    style={{
                      color: primary.active,
                      backgroundColor: `${primary.base}20`
                    }}
                  >
                    Admin Only
                  </span>
                )}
                {meetingType.is_customer_choice && meetingType.is_active && (
                  <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium text-green-700 dark:text-green-300 bg-green-100/80 dark:bg-green-900/30 backdrop-blur-sm rounded-full">
                    Customer Choice
                  </span>
                )}
              </div>

              {/* Description */}
              {meetingType.description && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                  {meetingType.description}
                </p>
              )}

              {/* Time Details */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-gray-600 dark:text-gray-400 mb-3 pb-3 border-b border-gray-200/50 dark:border-gray-700/50">
                <div className="flex items-center gap-1.5">
                  <ClockIcon className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                  <span className="font-medium text-gray-900 dark:text-white">{meetingType.duration_minutes}</span>
                  <span className="text-gray-500 dark:text-gray-400">min</span>
                </div>
                {meetingType.buffer_minutes > 0 && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-400 dark:text-gray-500">•</span>
                    <span className="font-medium text-gray-900 dark:text-white">{meetingType.buffer_minutes}</span>
                    <span className="text-gray-500 dark:text-gray-400">min buffer</span>
                  </div>
                )}
              </div>

              {/* Actions - Stacked on mobile, row on desktop */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <button
                  onClick={() => onEditClick(meetingType)}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white/60 dark:bg-gray-700/60 backdrop-blur-sm border-2 border-transparent rounded-lg transition-all text-gray-700 dark:text-gray-200"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = primary.base;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'transparent';
                  }}
                >
                  <PencilIcon className="h-3.5 w-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleToggleActive(meetingType)}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg backdrop-blur-sm border-2 border-transparent transition-all"
                  style={{
                    backgroundColor: meetingType.is_active 
                      ? 'rgba(255, 255, 255, 0.6)' 
                      : `${primary.base}20`,
                    color: meetingType.is_active 
                      ? '#374151' 
                      : primary.active
                  }}
                  onMouseEnter={(e) => {
                    if (!meetingType.is_active) {
                      e.currentTarget.style.backgroundColor = `${primary.base}30`;
                    } else {
                      e.currentTarget.style.backgroundColor = 'rgba(243, 244, 246, 0.8)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!meetingType.is_active) {
                      e.currentTarget.style.backgroundColor = `${primary.base}20`;
                    } else {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.6)';
                    }
                  }}
                >
                  {meetingType.is_active ? (
                    <>
                      <XCircleIcon className="h-3.5 w-3.5" />
                      <span>Deactivate</span>
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="h-3.5 w-3.5" />
                      <span>Activate</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleDelete(meetingType.id)}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50/60 dark:bg-red-900/20 backdrop-blur-sm hover:bg-red-100/60 dark:hover:bg-red-900/30 border-2 border-transparent hover:border-red-300 dark:hover:border-red-700 rounded-lg transition-all"
                >
                  <TrashIcon className="h-3.5 w-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

        {/* Help Info */}
        <div 
          className="rounded-lg p-4"
          style={{
            background: `linear-gradient(135deg, ${primary.base}0d, ${primary.base}1a)`,
            border: `1px solid ${primary.base}33`
          }}
        >
          <div className="flex items-start gap-3">
            <svg 
              className="h-5 w-5 flex-shrink-0 mt-0.5" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
              style={{ color: primary.base }}
            >
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
  );
}
