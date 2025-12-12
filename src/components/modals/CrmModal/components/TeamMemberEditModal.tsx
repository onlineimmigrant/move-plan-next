/**
 * TeamMemberEditModal Component
 *
 * Modal for editing/adding team members
 */

'use client';

import React from 'react';
import { XMarkIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Profile, TeamProfile } from '../types';

interface TeamMemberEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProfileId: string;
  profiles: Profile[];
  teamData: Partial<TeamProfile>;
  onProfileSelect: (profileId: string) => void;
  onDataChange: (data: Partial<TeamProfile>) => void;
  onSave: () => void;
  onOpenImageGallery: () => void;
  isSaving: boolean;
}

export function TeamMemberEditModal({
  isOpen,
  onClose,
  selectedProfileId,
  profiles,
  teamData,
  onProfileSelect,
  onDataChange,
  onSave,
  onOpenImageGallery,
  isSaving,
}: TeamMemberEditModalProps) {
  const { primary, secondary } = useThemeColors();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4 animate-in fade-in duration-200">
      {/* Backdrop - dims the CRM modal behind */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal - cleaner style like Shop sub-modals */}
      <div
        className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col animate-in zoom-in-95 duration-200"
      >
        {/* Header - matches Shop sub-modal style */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            {selectedProfileId ? 'Edit' : 'Add'} Team Member
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content - scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Profile Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select User Profile *
            </label>
            <select
              value={selectedProfileId}
              onChange={(e) => onProfileSelect(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Choose a user...</option>
              {profiles.map(profile => (
                <option key={profile.id} value={profile.id}>
                  {profile.full_name} ({profile.email})
                </option>
              ))}
            </select>
          </div>

          {/* Show form fields always */}
          <div className="space-y-6">{/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Profile Image
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={teamData.image || ''}
                      onChange={(e) => onDataChange({ ...teamData, image: e.target.value })}
                      placeholder="https://..."
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={onOpenImageGallery}
                      className="px-3 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                      title="Choose from gallery"
                    >
                      <PhotoIcon className="w-5 h-5" />
                    </button>
                    {teamData.image && (
                      <button
                        type="button"
                        onClick={() => onDataChange({ ...teamData, image: '' })}
                        className="px-3 py-2 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                        title="Remove image"
                      >
                        <XMarkIcon className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                  {teamData.image && (
                    <div className="mt-2">
                      <img
                        src={teamData.image}
                        alt="Preview"
                        className="w-20 h-20 rounded-lg object-cover border border-gray-300 dark:border-gray-600"
                      />
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Display Name (Pseudonym)
                  </label>
                  <input
                    type="text"
                    value={teamData.pseudonym || ''}
                    onChange={(e) => onDataChange({ ...teamData, pseudonym: e.target.value })}
                    placeholder="Optional display name"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Job Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Job Title *
                  </label>
                  <input
                    type="text"
                    value={teamData.job_title || ''}
                    onChange={(e) => onDataChange({ ...teamData, job_title: e.target.value })}
                    placeholder="Software Engineer"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Department
                  </label>
                  <input
                    type="text"
                    value={teamData.department || ''}
                    onChange={(e) => onDataChange({ ...teamData, department: e.target.value })}
                    placeholder="Engineering"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Short Description
                </label>
                <textarea
                  value={teamData.description || ''}
                  onChange={(e) => onDataChange({ ...teamData, description: e.target.value })}
                  rows={3}
                  placeholder="Brief description..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              {/* Detailed Bio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Detailed Bio
                </label>
                <textarea
                  value={teamData.bio || ''}
                  onChange={(e) => onDataChange({ ...teamData, bio: e.target.value })}
                  rows={5}
                  placeholder="Detailed biography and background..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              {/* Experience & Display */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Years of Experience
                  </label>
                  <input
                    type="number"
                    value={teamData.experience_years || ''}
                    onChange={(e) => onDataChange({ ...teamData, experience_years: e.target.value ? parseInt(e.target.value) : null })}
                    placeholder="5"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Years of Experience (alt)
                  </label>
                  <input
                    type="number"
                    value={teamData.years_of_experience || ''}
                    onChange={(e) => onDataChange({ ...teamData, years_of_experience: e.target.value })}
                    placeholder="5"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={teamData.display_order || ''}
                    onChange={(e) => onDataChange({ ...teamData, display_order: e.target.value ? parseInt(e.target.value) : 0 })}
                    placeholder="1"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Skills */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Skills (comma-separated)
                </label>
                <input
                  type="text"
                  value={teamData.skills || ''}
                  onChange={(e) => onDataChange({ ...teamData, skills: e.target.value })}
                  placeholder="React, Node.js, TypeScript"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              {/* Education */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Education
                </label>
                <textarea
                  value={teamData.education || ''}
                  onChange={(e) => onDataChange({ ...teamData, education: e.target.value })}
                  rows={2}
                  placeholder="Educational background..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              {/* Certifications */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Certifications (one per line)
                </label>
                <textarea
                  value={teamData.certifications || ''}
                  onChange={(e) => onDataChange({ ...teamData, certifications: e.target.value })}
                  rows={3}
                  placeholder="IBM AI&#10;AWS Certified&#10;Google Cloud"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              {/* Achievements */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Achievements (one per line)
                </label>
                <textarea
                  value={teamData.achievements || ''}
                  onChange={(e) => onDataChange({ ...teamData, achievements: e.target.value })}
                  rows={3}
                  placeholder="100% project success rate&#10;Led team of 10&#10;Published author"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              {/* Social Links */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    LinkedIn URL
                  </label>
                  <input
                    type="url"
                    value={teamData.linkedin_url || ''}
                    onChange={(e) => onDataChange({ ...teamData, linkedin_url: e.target.value })}
                    placeholder="https://linkedin.com/in/..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Twitter URL
                  </label>
                  <input
                    type="url"
                    value={teamData.twitter_url || ''}
                    onChange={(e) => onDataChange({ ...teamData, twitter_url: e.target.value })}
                    placeholder="https://x.com/..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    GitHub URL
                  </label>
                  <input
                    type="url"
                    value={teamData.github_url || ''}
                    onChange={(e) => onDataChange({ ...teamData, github_url: e.target.value })}
                    placeholder="https://github.com/..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Portfolio URL
                  </label>
                  <input
                    type="url"
                    value={teamData.portfolio_url || ''}
                    onChange={(e) => onDataChange({ ...teamData, portfolio_url: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Featured */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_featured"
                  checked={teamData.is_featured || false}
                  onChange={(e) => onDataChange({ ...teamData, is_featured: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="is_featured" className="text-sm text-gray-700 dark:text-gray-300">
                  Featured team member
                </label>
              </div>

              {/* Assigned Sections */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Assigned Sections (comma-separated)
                </label>
                <input
                  type="text"
                  value={(teamData.assigned_sections || []).join(', ')}
                  onChange={(e) => onDataChange({
                    ...teamData,
                    assigned_sections: e.target.value
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })}
                  placeholder="Homepage, Engineering, Blog"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              {/* Team member flag */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_team_member"
                  checked={teamData.is_team_member || false}
                  onChange={(e) => onDataChange({ ...teamData, is_team_member: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="is_team_member" className="text-sm text-gray-700 dark:text-gray-300">
                  Mark as team member
                </label>
              </div>
            </div>
        </div>

        {/* Footer - fixed at bottom with better styling */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={isSaving || !selectedProfileId || !teamData.job_title}
            className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            title={!selectedProfileId ? 'Please select a profile' : !teamData.job_title ? 'Job title is required' : ''}
          >
            {isSaving ? 'Saving...' : 'Save Member'}
          </button>
        </div>
      </div>
    </div>
  );
}
