'use client';

import React, { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, UserIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { supabase } from '@/lib/supabaseClient';
import { cn } from '@/lib/utils';
import ImageGalleryModal from '@/components/modals/ImageGalleryModal';

interface Profile {
  id: string;
  full_name: string;
  email: string;
  team?: any;
  customer?: any;
}

interface ProfileDataManagerProps {
  sectionId: number;
  type: 'team' | 'testimonials';
}

export default function ProfileDataManager({ sectionId, type }: ProfileDataManagerProps) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isImageGalleryOpen, setIsImageGalleryOpen] = useState(false);
  const [currentImageField, setCurrentImageField] = useState<'image' | 'company_logo' | null>(null);
  
  // Team member form data
  const [teamData, setTeamData] = useState({
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
    assigned_sections: [sectionId],
  });

  // Testimonial form data
  const [testimonialData, setTestimonialData] = useState({
    is_customer: true,
    image: '',
    testimonial_text: '',
    rating: 5,
    pseudonym: '',
    company: '',
    company_logo: '',
    job_title: '',
    project_type: '',
    description: '',
    testimonial_date: new Date().toISOString().split('T')[0],
    linkedin_url: '',
    is_featured: false,
    display_order: '',
    assigned_sections: [sectionId],
  });

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, team, customer')
        .order('full_name', { ascending: true });

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error('Error fetching profiles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileSelect = (profileId: string) => {
    setSelectedProfileId(profileId);
    const profile = profiles.find(p => p.id === profileId);
    
    if (profile) {
      if (type === 'team' && profile.team) {
        // Load existing team data
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
          assigned_sections: profile.team.assigned_sections || [sectionId],
        });
      } else if (type === 'testimonials' && profile.customer) {
        // Load existing customer data
        setTestimonialData({
          is_customer: profile.customer.is_customer || true,
          image: profile.customer.image || '',
          testimonial_text: profile.customer.testimonial_text || '',
          rating: profile.customer.rating || 5,
          pseudonym: profile.customer.pseudonym || '',
          company: profile.customer.company || '',
          company_logo: profile.customer.company_logo || '',
          job_title: profile.customer.job_title || '',
          project_type: profile.customer.project_type || '',
          description: profile.customer.description || '',
          testimonial_date: profile.customer.testimonial_date || new Date().toISOString().split('T')[0],
          linkedin_url: profile.customer.linkedin_url || '',
          is_featured: profile.customer.is_featured || false,
          display_order: profile.customer.display_order?.toString() || '',
          assigned_sections: profile.customer.assigned_sections || [sectionId],
        });
      }
    }
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!selectedProfileId) return;

    setIsSaving(true);
    try {
      const updateData = type === 'team' 
        ? {
            ...teamData,
            experience_years: teamData.experience_years ? parseInt(teamData.experience_years) : null,
            years_of_experience: teamData.years_of_experience ? parseInt(teamData.years_of_experience) : null,
            skills: teamData.skills ? teamData.skills.split(',').map(s => s.trim()).filter(Boolean) : [],
            certifications: teamData.certifications ? teamData.certifications.split('\n').map(s => s.trim()).filter(Boolean) : [],
            achievements: teamData.achievements ? teamData.achievements.split('\n').map(s => s.trim()).filter(Boolean) : [],
            display_order: teamData.display_order ? parseInt(teamData.display_order) : null,
          }
        : {
            ...testimonialData,
            display_order: testimonialData.display_order ? parseInt(testimonialData.display_order) : null,
          };

      const { error } = await supabase
        .from('profiles')
        .update({
          [type === 'team' ? 'team' : 'customer']: updateData
        })
        .eq('id', selectedProfileId);

      if (error) throw error;

      alert(`${type === 'team' ? 'Team member' : 'Testimonial'} updated successfully!`);
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

  const handleRemoveFromSection = async (profileId: string) => {
    if (!confirm('Remove this entry from this section?')) return;

    setIsSaving(true);
    try {
      const profile = profiles.find(p => p.id === profileId);
      if (!profile) return;

      const dataField = type === 'team' ? profile.team : profile.customer;
      if (!dataField) return;

      const currentSections = dataField.assigned_sections || [];
      const newSections = currentSections.filter((id: number) => id !== sectionId);

      const { error } = await supabase
        .from('profiles')
        .update({
          [type === 'team' ? 'team' : 'customer']: {
            ...dataField,
            assigned_sections: newSections,
          }
        })
        .eq('id', profileId);

      if (error) throw error;

      await fetchProfiles();
    } catch (error) {
      console.error('Error removing from section:', error);
      alert('Failed to remove. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageSelect = (imageUrl: string) => {
    if (currentImageField === 'image') {
      if (type === 'team') {
        setTeamData({ ...teamData, image: imageUrl });
      } else {
        setTestimonialData({ ...testimonialData, image: imageUrl });
      }
    } else if (currentImageField === 'company_logo') {
      setTestimonialData({ ...testimonialData, company_logo: imageUrl });
    }
    setIsImageGalleryOpen(false);
    setCurrentImageField(null);
  };

  const openImageGallery = (field: 'image' | 'company_logo') => {
    setCurrentImageField(field);
    setIsImageGalleryOpen(true);
  };

  const assignedProfiles = profiles.filter(p => {
    const data = type === 'team' ? p.team : p.customer;
    if (!data) return false;
    const isActive = type === 'team' ? data.is_team_member : data.is_customer;
    if (!isActive) return false;
    
    const sections = data.assigned_sections || [];
    return sections.length === 0 || sections.includes(sectionId);
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-medium text-gray-900">
          {type === 'team' ? 'Team Members' : 'Testimonials'} in this Section
        </h3>
        <button
          onClick={() => {
            setSelectedProfileId('');
            setShowForm(true);
          }}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-lg transition-colors"
        >
          <PlusIcon className="w-4 h-4" />
          Add {type === 'team' ? 'Member' : 'Testimonial'}
        </button>
      </div>

      {/* Current entries */}
      {assignedProfiles.length > 0 && (
        <div className="grid gap-3">
          {assignedProfiles.map(profile => {
            const data = type === 'team' ? profile.team : profile.customer;
            return (
              <div key={profile.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-3">
                  {data?.image ? (
                    <img src={data.image} alt={profile.full_name} className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <UserIcon className="w-5 h-5 text-gray-400" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-900">{data?.pseudonym || profile.full_name}</p>
                    <p className="text-sm text-gray-600">{data?.job_title || profile.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleProfileSelect(profile.id)}
                    className="p-2 text-gray-600 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleRemoveFromSection(profile.id)}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {assignedProfiles.length === 0 && (
        <div className="text-center py-8 text-gray-500 text-sm">
          No {type === 'team' ? 'team members' : 'testimonials'} assigned to this section yet.
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="border-t border-gray-200 pt-4 mt-4">
          <h4 className="text-sm font-medium text-gray-900 mb-4">
            {selectedProfileId ? 'Edit' : 'Add'} {type === 'team' ? 'Team Member' : 'Testimonial'}
          </h4>

          {/* Profile Selector */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Select User Profile
            </label>
            <select
              value={selectedProfileId}
              onChange={(e) => handleProfileSelect(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
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
            <>
              {type === 'team' ? (
                /* Team Member Fields */
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Image URL</label>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={teamData.image}
                          onChange={(e) => setTeamData({ ...teamData, image: e.target.value })}
                          placeholder="https://..."
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                        />
                        <button
                          type="button"
                          onClick={() => openImageGallery('image')}
                          className="px-3 py-2 bg-sky-50 text-sky-600 border border-sky-200 rounded-lg hover:bg-sky-100 transition-colors"
                          title="Choose from gallery"
                        >
                          <PhotoIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Display Name (Pseudonym)</label>
                      <input
                        type="text"
                        value={teamData.pseudonym}
                        onChange={(e) => setTeamData({ ...teamData, pseudonym: e.target.value })}
                        placeholder="Optional display name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Job Title *</label>
                      <input
                        type="text"
                        value={teamData.job_title}
                        onChange={(e) => setTeamData({ ...teamData, job_title: e.target.value })}
                        placeholder="Software Engineer"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Department</label>
                      <input
                        type="text"
                        value={teamData.department}
                        onChange={(e) => setTeamData({ ...teamData, department: e.target.value })}
                        placeholder="Engineering"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Description/Bio</label>
                    <textarea
                      value={teamData.description}
                      onChange={(e) => setTeamData({ ...teamData, description: e.target.value })}
                      rows={3}
                      placeholder="Brief bio..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Experience (years)</label>
                      <input
                        type="number"
                        value={teamData.experience_years}
                        onChange={(e) => setTeamData({ ...teamData, experience_years: e.target.value })}
                        placeholder="5"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Display Order</label>
                      <input
                        type="number"
                        value={teamData.display_order}
                        onChange={(e) => setTeamData({ ...teamData, display_order: e.target.value })}
                        placeholder="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Skills (comma-separated)</label>
                    <input
                      type="text"
                      value={teamData.skills}
                      onChange={(e) => setTeamData({ ...teamData, skills: e.target.value })}
                      placeholder="React, Node.js, TypeScript"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">LinkedIn URL</label>
                      <input
                        type="url"
                        value={teamData.linkedin_url}
                        onChange={(e) => setTeamData({ ...teamData, linkedin_url: e.target.value })}
                        placeholder="https://linkedin.com/in/..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Twitter URL</label>
                      <input
                        type="url"
                        value={teamData.twitter_url}
                        onChange={(e) => setTeamData({ ...teamData, twitter_url: e.target.value })}
                        placeholder="https://twitter.com/..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">GitHub URL</label>
                      <input
                        type="url"
                        value={teamData.github_url}
                        onChange={(e) => setTeamData({ ...teamData, github_url: e.target.value })}
                        placeholder="https://github.com/..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Portfolio URL</label>
                      <input
                        type="url"
                        value={teamData.portfolio_url}
                        onChange={(e) => setTeamData({ ...teamData, portfolio_url: e.target.value })}
                        placeholder="https://..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                  </div>

                  {/* Resume/Profile Information Section */}
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Resume Information (for modal)</h4>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Bio / About</label>
                        <textarea
                          value={teamData.bio}
                          onChange={(e) => setTeamData({ ...teamData, bio: e.target.value })}
                          placeholder="Professional bio or summary..."
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">Years of Experience</label>
                          <input
                            type="number"
                            value={teamData.years_of_experience}
                            onChange={(e) => setTeamData({ ...teamData, years_of_experience: e.target.value })}
                            placeholder="e.g., 5"
                            min="0"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">Education</label>
                          <input
                            type="text"
                            value={teamData.education}
                            onChange={(e) => setTeamData({ ...teamData, education: e.target.value })}
                            placeholder="e.g., BS in Computer Science, MIT"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Certifications <span className="text-xs text-gray-500">(one per line)</span>
                        </label>
                        <textarea
                          value={teamData.certifications}
                          onChange={(e) => setTeamData({ ...teamData, certifications: e.target.value })}
                          placeholder="AWS Solutions Architect&#10;Google Cloud Professional&#10;PMP Certified"
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 font-mono text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Achievements <span className="text-xs text-gray-500">(one per line)</span>
                        </label>
                        <textarea
                          value={teamData.achievements}
                          onChange={(e) => setTeamData({ ...teamData, achievements: e.target.value })}
                          placeholder="Led team to 200% revenue growth&#10;Published 5 research papers&#10;Won Hackathon 2024"
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 font-mono text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="team-featured"
                      checked={teamData.is_featured}
                      onChange={(e) => setTeamData({ ...teamData, is_featured: e.target.checked })}
                      className="w-4 h-4 text-sky-600 border-gray-300 rounded focus:ring-sky-500"
                    />
                    <label htmlFor="team-featured" className="text-sm font-medium text-gray-700">
                      Featured Member (highlight/show first)
                    </label>
                  </div>
                </div>
              ) : (
                /* Testimonial Fields */
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Image URL</label>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={testimonialData.image}
                          onChange={(e) => setTestimonialData({ ...testimonialData, image: e.target.value })}
                          placeholder="https://..."
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                        />
                        <button
                          type="button"
                          onClick={() => openImageGallery('image')}
                          className="px-3 py-2 bg-sky-50 text-sky-600 border border-sky-200 rounded-lg hover:bg-sky-100 transition-colors"
                          title="Choose from gallery"
                        >
                          <PhotoIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Display Name (Pseudonym)</label>
                      <input
                        type="text"
                        value={testimonialData.pseudonym}
                        onChange={(e) => setTestimonialData({ ...testimonialData, pseudonym: e.target.value })}
                        placeholder="Optional display name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Testimonial Text *</label>
                    <textarea
                      value={testimonialData.testimonial_text}
                      onChange={(e) => setTestimonialData({ ...testimonialData, testimonial_text: e.target.value })}
                      rows={4}
                      placeholder="Great service! Highly recommend..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Rating *</label>
                      <select
                        value={testimonialData.rating}
                        onChange={(e) => setTestimonialData({ ...testimonialData, rating: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                      >
                        {[5, 4, 3, 2, 1].map(rating => (
                          <option key={rating} value={rating}>{rating} Stars</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Date</label>
                      <input
                        type="date"
                        value={testimonialData.testimonial_date}
                        onChange={(e) => setTestimonialData({ ...testimonialData, testimonial_date: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Company</label>
                      <input
                        type="text"
                        value={testimonialData.company}
                        onChange={(e) => setTestimonialData({ ...testimonialData, company: e.target.value })}
                        placeholder="Tech Corp"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Job Title</label>
                      <input
                        type="text"
                        value={testimonialData.job_title}
                        onChange={(e) => setTestimonialData({ ...testimonialData, job_title: e.target.value })}
                        placeholder="CTO"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Company Logo URL</label>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={testimonialData.company_logo}
                          onChange={(e) => setTestimonialData({ ...testimonialData, company_logo: e.target.value })}
                          placeholder="https://..."
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                        />
                        <button
                          type="button"
                          onClick={() => openImageGallery('company_logo')}
                          className="px-3 py-2 bg-sky-50 text-sky-600 border border-sky-200 rounded-lg hover:bg-sky-100 transition-colors"
                          title="Choose from gallery"
                        >
                          <PhotoIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Project Type</label>
                      <input
                        type="text"
                        value={testimonialData.project_type}
                        onChange={(e) => setTestimonialData({ ...testimonialData, project_type: e.target.value })}
                        placeholder="Web Development"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Additional Description</label>
                    <textarea
                      value={testimonialData.description}
                      onChange={(e) => setTestimonialData({ ...testimonialData, description: e.target.value })}
                      rows={2}
                      placeholder="Additional context..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">LinkedIn URL</label>
                      <input
                        type="url"
                        value={testimonialData.linkedin_url}
                        onChange={(e) => setTestimonialData({ ...testimonialData, linkedin_url: e.target.value })}
                        placeholder="https://linkedin.com/in/..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Display Order</label>
                      <input
                        type="number"
                        value={testimonialData.display_order}
                        onChange={(e) => setTestimonialData({ ...testimonialData, display_order: e.target.value })}
                        placeholder="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="testimonial-featured"
                      checked={testimonialData.is_featured}
                      onChange={(e) => setTestimonialData({ ...testimonialData, is_featured: e.target.checked })}
                      className="w-4 h-4 text-sky-600 border-gray-300 rounded focus:ring-sky-500"
                    />
                    <label htmlFor="testimonial-featured" className="text-sm font-medium text-gray-700">
                      Featured Testimonial (highlight/show first)
                    </label>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-3 mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setSelectedProfileId('');
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Image Gallery Modal */}
      <ImageGalleryModal
        isOpen={isImageGalleryOpen}
        onClose={() => {
          setIsImageGalleryOpen(false);
          setCurrentImageField(null);
        }}
        onSelectImage={handleImageSelect}
      />
    </div>
  );
}
