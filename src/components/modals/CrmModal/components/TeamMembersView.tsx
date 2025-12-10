/**
 * TeamMembersView Component
 *
 * Displays and manages team member data from profiles table
 * Part of the CRM modal - Team Members tab
 * Migrated from ProfileDataManager with enhanced CRM features
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  UserIcon,
  PhotoIcon,
  MagnifyingGlassIcon as Search,
  FunnelIcon as Filter,
  StarIcon as Star,
  ArrowTopRightOnSquareIcon as ExternalLink
} from '@heroicons/react/24/outline';
import { supabase } from '@/lib/supabaseClient';
import { useThemeColors } from '@/hooks/useThemeColors';
import ImageGalleryModal from '@/components/modals/ImageGalleryModal';
import { Profile, TeamProfile } from '../types';

interface TeamMembersViewProps {
  organizationId?: string;
}

export default function TeamMembersView({ organizationId }: TeamMembersViewProps) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [filteredProfiles, setFilteredProfiles] = useState<Profile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isImageGalleryOpen, setIsImageGalleryOpen] = useState(false);
  const [currentImageField, setCurrentImageField] = useState<'image' | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);

  const themeColors = useThemeColors();

  // Team member form data
  const [teamData, setTeamData] = useState<TeamProfile>({
    is_team_member: true,
    image: '',
    job_title: '',
    pseudonym: '',
    department: '',
    description: '',
    bio: '',
    experience_years: '',
    years_of_experience: '',
    education: '',
    certifications: '',
    achievements: '',
    skills: '',
    linkedin_url: '',
    twitter_url: '',
    github_url: '',
    portfolio_url: '',
    is_featured: false,
    display_order: '',
    assigned_sections: [],
  });

  useEffect(() => {
    fetchProfiles();
  }, []);

  useEffect(() => {
    filterProfiles();
  }, [profiles, searchTerm, showFeaturedOnly]);

  const fetchProfiles = async () => {
    setIsLoading(true);
    try {
      // Get the current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        console.error('No active session');
        setIsLoading(false);
        return;
      }

      // Fetch team members through the API route (server-side organization filtering)
      const response = await fetch('/api/team-members', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch team members: ${response.status}`);
      }

      const data = await response.json();
      setProfiles(data);
    } catch (error) {
      console.error('Error fetching profiles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterProfiles = useCallback(() => {
    let filtered = profiles.filter(profile => profile.team?.is_team_member);

    if (searchTerm) {
      filtered = filtered.filter(profile =>
        profile.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        profile.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        profile.team?.job_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        profile.team?.department?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (showFeaturedOnly) {
      filtered = filtered.filter(profile => profile.team?.is_featured);
    }

    setFilteredProfiles(filtered);
  }, [profiles, searchTerm, showFeaturedOnly]);

  const handleProfileSelect = (profileId: string) => {
    setSelectedProfileId(profileId);
    const profile = profiles.find(p => p.id === profileId);

    if (profile?.team) {
      setTeamData({
        is_team_member: profile.team.is_team_member || true,
        image: profile.team.image || '',
        job_title: profile.team.job_title || '',
        pseudonym: profile.team.pseudonym || '',
        department: profile.team.department || '',
        description: profile.team.description || '',
        bio: profile.team.bio || '',
        experience_years: profile.team.experience_years?.toString() || '',
        years_of_experience: profile.team.years_of_experience?.toString() || '',
        education: profile.team.education || '',
        certifications: Array.isArray(profile.team.certifications) ? profile.team.certifications.join('\n') : '',
        achievements: Array.isArray(profile.team.achievements) ? profile.team.achievements.join('\n') : '',
        skills: Array.isArray(profile.team.skills) ? profile.team.skills.join(', ') : '',
        linkedin_url: profile.team.linkedin_url || '',
        twitter_url: profile.team.twitter_url || '',
        github_url: profile.team.github_url || '',
        portfolio_url: profile.team.portfolio_url || '',
        is_featured: profile.team.is_featured || false,
        display_order: profile.team.display_order?.toString() || '',
        assigned_sections: profile.team.assigned_sections || [],
      });
    }
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!selectedProfileId) return;

    setIsSaving(true);
    try {
      const updateData = {
        ...teamData,
        experience_years: teamData.experience_years ? parseInt(teamData.experience_years) : null,
        years_of_experience: teamData.years_of_experience ? parseInt(teamData.years_of_experience) : null,
        skills: teamData.skills ? teamData.skills.split(',').map(s => s.trim()).filter(Boolean) : [],
        certifications: teamData.certifications ? teamData.certifications.split('\n').map(s => s.trim()).filter(Boolean) : [],
        achievements: teamData.achievements ? teamData.achievements.split('\n').map(s => s.trim()).filter(Boolean) : [],
        display_order: teamData.display_order ? parseInt(teamData.display_order) : null,
      };

      const { error } = await supabase
        .from('profiles')
        .update({
          team: updateData
        })
        .eq('id', selectedProfileId);

      if (error) throw error;

      alert('Team member updated successfully!');
      await fetchProfiles();
      setShowForm(false);
      setSelectedProfileId('');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageSelect = (imageUrl: string) => {
    setTeamData({ ...teamData, image: imageUrl });
    setIsImageGalleryOpen(false);
    setCurrentImageField(null);
  };

  const openImageGallery = () => {
    setCurrentImageField('image');
    setIsImageGalleryOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
          <span className="text-sm font-medium">Loading team members...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200/50">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Team Members
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Manage your organization's team members
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedProfileId('');
            setShowForm(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-sm"
        >
          <PlusIcon className="w-4 h-4" />
          Add Member
        </button>
      </div>

      {/* Filters */}
      <div className="px-6 py-4 border-b border-gray-200/50">
        <div className="flex gap-4 items-center">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search team members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showFeaturedOnly}
              onChange={(e) => setShowFeaturedOnly(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Featured only</span>
          </label>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {!showForm ? (
          /* Team Members List */
          <div className="space-y-4">
            {filteredProfiles.length > 0 ? (
              filteredProfiles.map(profile => {
                const team = profile.team!;
                return (
                  <div
                    key={profile.id}
                    className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-200/50 p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-4">
                      {team.image ? (
                        <img
                          src={team.image}
                          alt={team.pseudonym || profile.full_name || 'Team member'}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                          <UserIcon className="w-8 h-8 text-gray-400" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {team.pseudonym || profile.full_name}
                              {team.is_featured && (
                                <Star className="w-4 h-4 text-yellow-500 inline ml-2" />
                              )}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {team.job_title} {team.department && `• ${team.department}`}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                              {profile.email}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleProfileSelect(profile.id)}
                              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                              title="Edit member"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {team.description && (
                          <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 line-clamp-2">
                            {team.description}
                          </p>
                        )}

                        {team.skills && (() => {
                          const skillsArray = typeof team.skills === 'string' 
                            ? team.skills.split(',').map(s => s.trim()).filter(s => s) 
                            : Array.isArray(team.skills) ? team.skills : [];
                          return skillsArray.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {skillsArray.slice(0, 3).map((skill, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs rounded-full"
                                >
                                  {skill}
                                </span>
                              ))}
                              {skillsArray.length > 3 && (
                                <span className="text-xs text-gray-500">
                                  +{skillsArray.length - 3} more
                                </span>
                              )}
                            </div>
                          );
                        })()}

                        <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                          {team.experience_years && (
                            <span>{team.experience_years} years experience</span>
                          )}
                          {team.linkedin_url && (
                            <a
                              href={team.linkedin_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 hover:text-blue-600"
                            >
                              LinkedIn <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12">
                <UserIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No team members found
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {searchTerm || showFeaturedOnly
                    ? 'Try adjusting your filters'
                    : 'Get started by adding your first team member'
                  }
                </p>
              </div>
            )}
          </div>
        ) : (
          /* Edit Form */
          <div className="max-w-2xl mx-auto">
            <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-200/50 p-6">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                {selectedProfileId ? 'Edit' : 'Add'} Team Member
              </h4>

              {/* Profile Selector */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select User Profile *
                </label>
                <select
                  value={selectedProfileId}
                  onChange={(e) => handleProfileSelect(e.target.value)}
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

              {selectedProfileId && (
                <div className="space-y-6">
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Profile Image
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={teamData.image}
                          onChange={(e) => setTeamData({ ...teamData, image: e.target.value })}
                          placeholder="https://..."
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                        <button
                          type="button"
                          onClick={openImageGallery}
                          className="px-3 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                          title="Choose from gallery"
                        >
                          <PhotoIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Display Name (Pseudonym)
                      </label>
                      <input
                        type="text"
                        value={teamData.pseudonym}
                        onChange={(e) => setTeamData({ ...teamData, pseudonym: e.target.value })}
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
                        value={teamData.job_title}
                        onChange={(e) => setTeamData({ ...teamData, job_title: e.target.value })}
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
                        value={teamData.department}
                        onChange={(e) => setTeamData({ ...teamData, department: e.target.value })}
                        placeholder="Engineering"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Description/Bio
                    </label>
                    <textarea
                      value={teamData.description}
                      onChange={(e) => setTeamData({ ...teamData, description: e.target.value })}
                      rows={4}
                      placeholder="Brief bio and description..."
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
                        value={teamData.experience_years}
                        onChange={(e) => setTeamData({ ...teamData, experience_years: e.target.value })}
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
                        value={teamData.display_order}
                        onChange={(e) => setTeamData({ ...teamData, display_order: e.target.value })}
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
                      value={teamData.skills}
                      onChange={(e) => setTeamData({ ...teamData, skills: e.target.value })}
                      placeholder="React, Node.js, TypeScript"
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
                        value={teamData.linkedin_url}
                        onChange={(e) => setTeamData({ ...teamData, linkedin_url: e.target.value })}
                        placeholder="https://linkedin.com/in/..."
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        GitHub URL
                      </label>
                      <input
                        type="url"
                        value={teamData.github_url}
                        onChange={(e) => setTeamData({ ...teamData, github_url: e.target.value })}
                        placeholder="https://github.com/..."
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Featured */}
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="is_featured"
                      checked={teamData.is_featured}
                      onChange={(e) => setTeamData({ ...teamData, is_featured: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="is_featured" className="text-sm text-gray-700 dark:text-gray-300">
                      Featured team member
                    </label>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => setShowForm(false)}
                      className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isSaving ? 'Saving...' : 'Save Member'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Image Gallery Modal */}
      {isImageGalleryOpen && (
        <ImageGalleryModal
          isOpen={isImageGalleryOpen}
          onClose={() => setIsImageGalleryOpen(false)}
          onSelectImage={handleImageSelect}
        />
      )}
    </div>
  );
}