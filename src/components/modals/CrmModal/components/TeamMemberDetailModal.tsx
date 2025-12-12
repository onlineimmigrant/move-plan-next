/**
 * TeamMemberDetailModal Component
 * 
 * Displays and allows inline editing of team member details
 * Positioned above CRM modal with higher z-index
 * Similar to CustomerDetailModal
 */

'use client';

import React, { useState, useEffect } from 'react';
import { X, User, Mail, Briefcase, Award, Star, Linkedin, Twitter, Github, Globe2 } from 'lucide-react';
import { PhotoIcon } from '@heroicons/react/24/outline';
import { supabase } from '@/lib/supabaseClient';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useCrm } from '../context/CrmContext';
import ImageGalleryModal from '@/components/modals/ImageGalleryModal';
import { Profile } from '../types';
import { teamMemberSchema, validateData } from '@/lib/validations/crm';

interface TeamMemberDetailModalProps {
  isOpen: boolean;
  member: Profile | null;
  onClose: () => void;
  onUpdate?: () => void;
}

export function TeamMemberDetailModal({ isOpen, member, onClose, onUpdate }: TeamMemberDetailModalProps) {
  const { showToast } = useCrm();
  const themeColors = useThemeColors();
  const primary = themeColors.cssVars.primary;
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedData, setEditedData] = useState<any>({});
  const [isImageGalleryOpen, setIsImageGalleryOpen] = useState(false);

  useEffect(() => {
    if (member?.team) {
      setEditedData({
        image: member.team.image || '',
        pseudonym: member.team.pseudonym || '',
        job_title: member.team.job_title || '',
        department: member.team.department || '',
        description: member.team.description || '',
        bio: member.team.bio || '',
        experience_years: member.team.experience_years || '',
        years_of_experience: member.team.years_of_experience || '',
        education: member.team.education || '',
        certifications: Array.isArray(member.team.certifications) 
          ? member.team.certifications.join('\n') 
          : (member.team.certifications || ''),
        achievements: Array.isArray(member.team.achievements) 
          ? member.team.achievements.join('\n') 
          : (member.team.achievements || ''),
        skills: Array.isArray(member.team.skills)
          ? member.team.skills.join(', ')
          : (member.team.skills || ''),
        linkedin_url: member.team.linkedin_url || '',
        twitter_url: member.team.twitter_url || '',
        github_url: member.team.github_url || '',
        portfolio_url: member.team.portfolio_url || '',
        is_featured: member.team.is_featured || false,
        display_order: member.team.display_order || '',
      });
    }
  }, [member]);

  const handleToggleFeatured = async () => {
    if (!member) return;

    const newFeaturedStatus = !editedData.is_featured;
    
    // Optimistic update
    setEditedData({ ...editedData, is_featured: newFeaturedStatus });

    try {
      const updateData = {
        ...member.team,
        is_featured: newFeaturedStatus,
      };

      const { error } = await supabase
        .from('profiles')
        .update({
          team: updateData
        })
        .eq('id', member.id);

      if (error) throw error;

      // Refresh parent data and close modal to show updated view
      onUpdate?.();
      onClose();
    } catch (error) {
      console.error('Error toggling featured status:', error);
      // Revert on error
      setEditedData({ ...editedData, is_featured: !newFeaturedStatus });
      showToast('Failed to update featured status. Please try again.', 'error');
    }
  };

  const handleSave = async () => {
    if (!member) return;

    // Validate team member data
    const validation = validateData(teamMemberSchema, {
      is_team_member: true,
      job_title: editedData.job_title,
      department: editedData.department,
      image: editedData.image,
      pseudonym: editedData.pseudonym,
      description: editedData.description,
      bio: editedData.bio,
      skills: editedData.skills,
      experience_years: editedData.experience_years ? parseInt(editedData.experience_years) : undefined,
      linkedin_url: editedData.linkedin_url,
      twitter_url: editedData.twitter_url,
      github_url: editedData.github_url,
      portfolio_url: editedData.portfolio_url,
      is_featured: editedData.is_featured,
    });

    if (!validation.success) {
      showToast(validation.errors[0], 'error');
      return;
    }

    setIsSaving(true);
    try {
      const updateData = {
        ...member.team,
        ...editedData,
        image: editedData.image || '',
        skills: editedData.skills 
          ? editedData.skills.split(',').map((s: string) => s.trim()).filter(Boolean) 
          : [],
        certifications: editedData.certifications 
          ? editedData.certifications.split('\n').map((s: string) => s.trim()).filter(Boolean) 
          : [],
        achievements: editedData.achievements 
          ? editedData.achievements.split('\n').map((s: string) => s.trim()).filter(Boolean) 
          : [],
      };

      const { error } = await supabase
        .from('profiles')
        .update({
          team: updateData
        })
        .eq('id', member.id);

      if (error) throw error;

      showToast('Team member updated successfully', 'success');
      setIsEditing(false);
      onUpdate?.();
    } catch (error) {
      console.error('Error updating team member:', error);
      showToast('Failed to update. Please try again.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !member) return null;

  const team = member.team!;
  const skillsArray = typeof team.skills === 'string' 
    ? team.skills.split(',').map(s => s.trim()).filter(s => s) 
    : Array.isArray(team.skills) ? team.skills : [];

  return (
    <div className="fixed inset-0 md:inset-4 z-[10004] flex items-center justify-center pointer-events-none">
      <div
        className="relative w-full h-full md:h-auto md:max-h-[90vh] md:max-w-4xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Avatar with Edit Option */}
              <div className="relative group">
                {team.image || editedData.image ? (
                  <img
                    src={editedData.image || team.image}
                    alt={team.pseudonym || member.full_name || 'Team member'}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${primary.base}20` }}
                  >
                    <User className="w-8 h-8" style={{ color: primary.base }} />
                  </div>
                )}
                {isEditing && (
                  <button
                    onClick={() => setIsImageGalleryOpen(true)}
                    className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition-colors"
                    title="Change image"
                  >
                    <PhotoIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {team.pseudonym || member.full_name || 'Anonymous'}
                </h2>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedData.job_title}
                    onChange={(e) => setEditedData({ ...editedData, job_title: e.target.value })}
                    className="text-sm px-2 py-1 border border-gray-300 rounded"
                    placeholder="Job Title"
                  />
                ) : (
                  team.job_title && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {team.job_title}
                      {team.department && ` • ${team.department}`}
                    </p>
                  )
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 rounded-lg font-medium transition-colors"
                  style={{
                    backgroundColor: `${primary.base}20`,
                    color: primary.base,
                  }}
                >
                  Edit
                </button>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditedData({});
                    }}
                    className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-4 py-2 rounded-lg text-white font-medium transition-colors disabled:opacity-50"
                    style={{
                      background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`,
                    }}
                  >
                    {isSaving ? 'Saving...' : 'Save'}
                  </button>
                </>
              )}
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Close"
              >
                <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </div>

          {/* Featured Badge Toggle */}
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={handleToggleFeatured}
              className={`px-3 py-1 text-xs font-medium rounded-full flex items-center gap-1.5 transition-all ${
                editedData.is_featured
                  ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-900/40'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              title="Toggle featured status"
            >
              <Star className={`w-3 h-3 ${editedData.is_featured ? 'fill-current' : ''}`} />
              {editedData.is_featured ? 'Featured Team Member' : 'Not Featured'}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Contact & Info */}
            <div className="lg:col-span-1 space-y-4">
              {/* Contact Information */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Mail className="w-4 h-4" style={{ color: primary.base }} />
                  Contact
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                    <p className="text-sm text-gray-900 dark:text-white break-all">{member.email}</p>
                  </div>
                </div>
              </div>

              {/* Department & Experience */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Briefcase className="w-4 h-4" style={{ color: primary.base }} />
                  Work Info
                </h3>
                <div className="space-y-3">
                  {isEditing ? (
                    <>
                      <div>
                        <label className="text-xs text-gray-500 dark:text-gray-400">Department</label>
                        <input
                          type="text"
                          value={editedData.department}
                          onChange={(e) => setEditedData({ ...editedData, department: e.target.value })}
                          className="w-full mt-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 dark:text-gray-400">Display Name (Pseudonym)</label>
                        <input
                          type="text"
                          value={editedData.pseudonym}
                          onChange={(e) => setEditedData({ ...editedData, pseudonym: e.target.value })}
                          className="w-full mt-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder="Optional display name"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 dark:text-gray-400">Years of Experience</label>
                        <input
                          type="number"
                          value={editedData.experience_years}
                          onChange={(e) => setEditedData({ ...editedData, experience_years: e.target.value })}
                          className="w-full mt-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      {team.department && (
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Department</p>
                          <p className="text-sm text-gray-900 dark:text-white">{team.department}</p>
                        </div>
                      )}
                      {team.experience_years && (
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Experience</p>
                          <p className="text-sm text-gray-900 dark:text-white">{team.experience_years} years</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Social Links */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  Social Links
                </h3>
                {isEditing ? (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <Linkedin className="w-3 h-3" />
                        LinkedIn
                      </label>
                      <input
                        type="url"
                        value={editedData.linkedin_url}
                        onChange={(e) => setEditedData({ ...editedData, linkedin_url: e.target.value })}
                        className="w-full mt-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="https://linkedin.com/in/..."
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <Twitter className="w-3 h-3" />
                        Twitter/X
                      </label>
                      <input
                        type="url"
                        value={editedData.twitter_url}
                        onChange={(e) => setEditedData({ ...editedData, twitter_url: e.target.value })}
                        className="w-full mt-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="https://x.com/..."
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <Github className="w-3 h-3" />
                        GitHub
                      </label>
                      <input
                        type="url"
                        value={editedData.github_url}
                        onChange={(e) => setEditedData({ ...editedData, github_url: e.target.value })}
                        className="w-full mt-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="https://github.com/..."
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <Globe2 className="w-3 h-3" />
                        Portfolio/Website
                      </label>
                      <input
                        type="url"
                        value={editedData.portfolio_url}
                        onChange={(e) => setEditedData({ ...editedData, portfolio_url: e.target.value })}
                        className="w-full mt-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {team.linkedin_url && (
                      <a
                        href={team.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm hover:underline"
                        style={{ color: primary.base }}
                      >
                        <Linkedin className="w-4 h-4" />
                        LinkedIn
                      </a>
                    )}
                    {team.twitter_url && (
                      <a
                        href={team.twitter_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm hover:underline"
                        style={{ color: primary.base }}
                      >
                        <Twitter className="w-4 h-4" />
                        Twitter
                      </a>
                    )}
                    {team.github_url && (
                      <a
                        href={team.github_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm hover:underline"
                        style={{ color: primary.base }}
                      >
                        <Github className="w-4 h-4" />
                        GitHub
                      </a>
                    )}
                    {team.portfolio_url && (
                      <a
                        href={team.portfolio_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm hover:underline"
                        style={{ color: primary.base }}
                      >
                        <Globe2 className="w-4 h-4" />
                        Portfolio
                      </a>
                    )}
                    {!team.linkedin_url && !team.twitter_url && !team.github_url && !team.portfolio_url && (
                      <p className="text-sm text-gray-500">No social links added</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Details */}
            <div className="lg:col-span-2 space-y-4">
              {/* Description/Bio */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  About
                </h3>
                {isEditing ? (
                  <textarea
                    value={editedData.description}
                    onChange={(e) => setEditedData({ ...editedData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    rows={4}
                    placeholder="Description"
                  />
                ) : (
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {team.description || 'No description available'}
                  </p>
                )}
              </div>

              {/* Skills */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Award className="w-4 h-4" style={{ color: primary.base }} />
                  Skills
                </h3>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedData.skills}
                    onChange={(e) => setEditedData({ ...editedData, skills: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    placeholder="Skill 1, Skill 2, Skill 3"
                  />
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {skillsArray.length > 0 ? (
                      skillsArray.map((skill, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-sm rounded-full"
                        >
                          {skill}
                        </span>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">No skills listed</p>
                    )}
                  </div>
                )}
              </div>

              {/* Bio */}
              {team.bio && (
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                    Detailed Bio
                  </h3>
                  {isEditing ? (
                    <textarea
                      value={editedData.bio}
                      onChange={(e) => setEditedData({ ...editedData, bio: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                      rows={6}
                    />
                  ) : (
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {team.bio}
                    </p>
                  )}
                </div>
              )}

              {/* Education */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  Education
                </h3>
                {isEditing ? (
                  <textarea
                    value={editedData.education}
                    onChange={(e) => setEditedData({ ...editedData, education: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    rows={3}
                    placeholder="Educational background..."
                  />
                ) : (
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {team.education || 'No education information'}
                  </p>
                )}
              </div>

              {/* Certifications */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  Certifications
                </h3>
                {isEditing ? (
                  <textarea
                    value={editedData.certifications}
                    onChange={(e) => setEditedData({ ...editedData, certifications: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    rows={4}
                    placeholder="One certification per line..."
                  />
                ) : (
                  <div className="space-y-1">
                    {(Array.isArray(team.certifications) ? team.certifications : (team.certifications || '').split('\n')).filter(Boolean).map((cert: string, index: number) => (
                      <p key={index} className="text-sm text-gray-700 dark:text-gray-300">
                        • {cert}
                      </p>
                    ))}
                    {!(team.certifications && (Array.isArray(team.certifications) ? team.certifications.length : team.certifications)) && (
                      <p className="text-sm text-gray-500">No certifications listed</p>
                    )}
                  </div>
                )}
              </div>

              {/* Achievements */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  Achievements
                </h3>
                {isEditing ? (
                  <textarea
                    value={editedData.achievements}
                    onChange={(e) => setEditedData({ ...editedData, achievements: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    rows={4}
                    placeholder="One achievement per line..."
                  />
                ) : (
                  <div className="space-y-1">
                    {(Array.isArray(team.achievements) ? team.achievements : (team.achievements || '').split('\n')).filter(Boolean).map((achievement: string, index: number) => (
                      <p key={index} className="text-sm text-gray-700 dark:text-gray-300">
                        • {achievement}
                      </p>
                    ))}
                    {!(team.achievements && (Array.isArray(team.achievements) ? team.achievements.length : team.achievements)) && (
                      <p className="text-sm text-gray-500">No achievements listed</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Gallery Modal */}
      {isImageGalleryOpen && (
        <ImageGalleryModal
          isOpen={isImageGalleryOpen}
          onClose={() => setIsImageGalleryOpen(false)}
          onSelectImage={(imageUrl) => {
            setEditedData({ ...editedData, image: imageUrl });
            setIsImageGalleryOpen(false);
          }}
        />
      )}
    </div>
  );
}
