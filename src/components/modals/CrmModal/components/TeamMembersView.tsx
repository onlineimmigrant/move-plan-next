/**
 * TeamMembersView Component
 *
 * Displays and manages team member data from profiles table
 * Part of the CRM modal - Team Members tab
 * Migrated from ProfileDataManager with enhanced CRM features
 */

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  PlusIcon,
  PencilIcon,
  UserIcon,
  StarIcon as Star,
  ArrowTopRightOnSquareIcon as ExternalLink,
} from '@heroicons/react/24/outline';
import { Search, Users, UserPlus } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useCrm } from '../context/CrmContext';
import { useTeamMembersData } from '../hooks/useTeamMembersData';
import ImageGalleryModal from '@/components/modals/ImageGalleryModal';
import { TeamMemberEditModal } from './TeamMemberEditModal';
import { TeamMemberDetailModal } from './TeamMemberDetailModal';
import { Profile, TeamProfile } from '../types';
import { FilterPanel } from './shared';

const DEFAULT_TEAM_DATA: TeamProfile = {
  is_team_member: true,
  image: '',
  job_title: '',
  pseudonym: '',
  department: '',
  description: '',
  bio: '',
  experience_years: null,
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
  display_order: 0,
  assigned_sections: [],
};

interface TeamMembersViewProps {
  organizationId?: string;
  searchQuery?: string;
}

export default function TeamMembersView({ organizationId, searchQuery = '' }: TeamMembersViewProps) {
  const { showToast } = useCrm();
  const { profiles, allProfiles, isLoading, errorMessage, fetchTeamMembers, refreshTeamMembers, setProfiles, setAllProfiles } = useTeamMembersData({
    organizationId,
    onToast: showToast,
  });
  
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isImageGalleryOpen, setIsImageGalleryOpen] = useState(false);
  const [currentImageField, setCurrentImageField] = useState<'image' | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'featured' | 'regular'>('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [hoveredFilter, setHoveredFilter] = useState<string | null>(null);

  const themeColors = useThemeColors();
  const primary = themeColors.cssVars.primary;

  // Team member form data
  const [teamData, setTeamData] = useState<TeamProfile>(DEFAULT_TEAM_DATA);

  useEffect(() => {
    fetchTeamMembers();
  }, [fetchTeamMembers]);

  const filteredProfiles = useMemo(() => {
    const searchLower = searchQuery.toLowerCase();
    return profiles.filter(profile => {
      if (!profile.team?.is_team_member) return false;
      
      // Apply status filter
      if (statusFilter === 'featured' && !profile.team.is_featured) return false;
      if (statusFilter === 'regular' && profile.team.is_featured) return false;
      
      // Apply search filter
      if (searchQuery) {
        return (
          profile.full_name?.toLowerCase().includes(searchLower) ||
          profile.email?.toLowerCase().includes(searchLower) ||
          profile.team.job_title?.toLowerCase().includes(searchLower) ||
          profile.team.department?.toLowerCase().includes(searchLower)
        );
      }
      
      return true;
    });
  }, [profiles, searchQuery, statusFilter]);

  const handleCardClick = useCallback((profile: Profile) => {
    setSelectedProfile(profile);
    setShowDetailModal(true);
  }, []);

  const handleProfileSelect = useCallback((profileId: string) => {
    setSelectedProfileId(profileId);
    const profile = allProfiles.find(p => p.id === profileId);

    if (profile?.team) {
      setTeamData({
        is_team_member: profile.team.is_team_member || true,
        image: profile.team.image || '',
        job_title: profile.team.job_title || '',
        pseudonym: profile.team.pseudonym || '',
        department: profile.team.department || '',
        description: profile.team.description || '',
        bio: profile.team.bio || '',
        experience_years: profile.team.experience_years ?? null,
        years_of_experience: profile.team.years_of_experience?.toString() || '',
        education: profile.team.education || '',
        certifications: Array.isArray(profile.team.certifications) ? profile.team.certifications.join('\n') : (profile.team.certifications || ''),
        achievements: Array.isArray(profile.team.achievements) ? profile.team.achievements.join('\n') : (profile.team.achievements || ''),
        skills: Array.isArray(profile.team.skills) ? profile.team.skills.join(', ') : (profile.team.skills || ''),
        linkedin_url: profile.team.linkedin_url || '',
        twitter_url: profile.team.twitter_url || '',
        github_url: profile.team.github_url || '',
        portfolio_url: profile.team.portfolio_url || '',
        is_featured: profile.team.is_featured || false,
        display_order: profile.team.display_order ?? 0,
        assigned_sections: profile.team.assigned_sections || [],
      });
    } else {
      // For new team members, set defaults
      setTeamData(DEFAULT_TEAM_DATA);
    }
    setShowForm(true);
  }, [allProfiles]);

  const handleSave = useCallback(async () => {
    if (!selectedProfileId) return;

    setIsSaving(true);
    try {
      const updateData = {
        ...teamData,
        experience_years: teamData.experience_years,
        years_of_experience: teamData.years_of_experience ? parseInt(teamData.years_of_experience) : null,
        skills: teamData.skills ? (typeof teamData.skills === 'string' ? teamData.skills.split(',').map(s => s.trim()).filter(Boolean) : teamData.skills) : [],
        certifications: teamData.certifications ? teamData.certifications.split('\n').map(s => s.trim()).filter(Boolean) : [],
        achievements: teamData.achievements ? teamData.achievements.split('\n').map(s => s.trim()).filter(Boolean) : [],
        display_order: teamData.display_order,
        assigned_sections: teamData.assigned_sections || [],
      };

      const { error } = await supabase
        .from('profiles')
        .update({
          team: updateData
        })
        .eq('id', selectedProfileId);

      if (error) throw error;

      showToast('Team member updated successfully!', 'success');
      await refreshTeamMembers();
      setShowForm(false);
      setSelectedProfileId('');
    } catch (error) {
      console.error('Error updating profile:', error);
      showToast('Failed to update. Please try again.', 'error');
    } finally {
      setIsSaving(false);
    }
  }, [selectedProfileId, teamData, showToast, refreshTeamMembers]);

  const handleImageSelect = useCallback((imageUrl: string) => {
    setTeamData(prev => ({ ...prev, image: imageUrl }));
    setIsImageGalleryOpen(false);
    setCurrentImageField(null);
  }, []);

  const openImageGallery = useCallback(() => {
    setCurrentImageField('image');
    setIsImageGalleryOpen(true);
  }, []);

  const handleToggleFilter = useCallback(() => {
    setIsFilterOpen(!isFilterOpen);
  }, [isFilterOpen]);

  // Memoize profile counts for filter options (separate from filterOptions)
  const profileCounts = useMemo(() => ({
    total: profiles.filter(p => p.team?.is_team_member).length,
    featured: profiles.filter(p => p.team?.is_featured).length,
    regular: profiles.filter(p => p.team?.is_team_member && !p.team?.is_featured).length,
  }), [profiles]);

  const filterOptions = useMemo(() => [{
    id: 'status',
    label: 'Member Status',
    value: statusFilter,
    options: [
      { value: 'all', label: 'All Members', count: profileCounts.total },
      { value: 'featured', label: 'Featured', count: profileCounts.featured },
      { value: 'regular', label: 'Regular', count: profileCounts.regular },
    ],
    onChange: (value: string) => setStatusFilter(value as 'all' | 'featured' | 'regular'),
  }], [statusFilter, profileCounts]);

  const handleAddMember = useCallback(() => {
    setSelectedProfileId('');
    setTeamData({ ...DEFAULT_TEAM_DATA, is_featured: true });
    setShowForm(true);
  }, []);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading team members...</p>
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
            <Users className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Unable to load team members
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{errorMessage}</p>
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={refreshTeamMembers}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (profiles.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-4">
            <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No Team Members Yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Get started by adding your first team member.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Team Members List */}
      <div className="flex-1 overflow-y-auto px-6 pt-6 py-4" style={{ paddingBottom: '160px' }}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProfiles.map((profile) => {
            const team = profile.team!;
            const skillsArray = typeof team.skills === 'string' 
              ? team.skills.split(',').map(s => s.trim()).filter(s => s) 
              : Array.isArray(team.skills) ? team.skills : [];
            
            return (
              <div
                key={profile.id}
                onClick={() => handleCardClick(profile)}
                className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg transition-all cursor-pointer hover:scale-[1.02] bg-white dark:bg-gray-800"
              >
                {/* Member Header */}
                <div className="flex items-start gap-3 mb-3">
                  {team.image ? (
                    <img
                      src={team.image}
                      alt={team.pseudonym || profile.full_name || 'Team member'}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                      {team.pseudonym || profile.full_name || 'Anonymous'}
                    </h4>
                    {team.job_title && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {team.job_title}
                      </p>
                    )}
                  </div>
                  {team.is_featured && (
                    <div className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs rounded-full">
                      Featured
                    </div>
                  )}
                </div>

                {/* Member Info */}
                <div className="space-y-2 text-sm">
                  {profile.email && (
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 truncate">
                      <span className="truncate">{profile.email}</span>
                    </div>
                  )}
                  {team.department && (
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <span className="truncate">{team.department}</span>
                    </div>
                  )}
                </div>

                {/* Skills */}
                {skillsArray.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
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
                )}

                {/* Experience and Links */}
                <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
                  {team.experience_years && (
                    <span>{team.experience_years} yrs</span>
                  )}
                  {team.linkedin_url && (
                    <a
                      href={team.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1 hover:text-blue-600"
                    >
                      LinkedIn <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Fixed Bottom Panel with Filter and Add Button */}
      <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-6 py-4 rounded-b-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Filters Button */}
          <div className="relative w-full sm:w-auto">
            <FilterPanel
              filters={filterOptions}
              isOpen={isFilterOpen}
              onToggle={handleToggleFilter}
              hoveredFilter={hoveredFilter}
              onHoverFilter={setHoveredFilter}
              primaryColor={primary.base}
              primaryHover={primary.hover}
            />
          </div>

          {/* Add Member Button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <button
              onClick={handleAddMember}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-white font-medium hover:opacity-90 transition-opacity text-sm"
              style={{
                background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`,
              }}
            >
              <UserPlus className="w-4 h-4" />
              Add Member
            </button>
          </div>
        </div>
      </div>

      {/* Team Member Detail Modal */}
      <TeamMemberDetailModal
        isOpen={showDetailModal}
        member={selectedProfile}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedProfile(null);
        }}
        onUpdate={refreshTeamMembers}
      />

      {/* Team Member Add/Edit Modal */}
      <TeamMemberEditModal
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setSelectedProfileId('');
        }}
        selectedProfileId={selectedProfileId}
        profiles={allProfiles.filter(p => p.team?.is_team_member === true && p.team?.is_featured !== true)}
        teamData={teamData}
        onProfileSelect={handleProfileSelect}
        onDataChange={(data) => setTeamData(data as any)}
        onSave={handleSave}
        onOpenImageGallery={openImageGallery}
        isSaving={isSaving}
      />

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