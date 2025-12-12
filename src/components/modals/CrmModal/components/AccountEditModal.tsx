/**
 * AccountEditModal Component
 *
 * Modal for creating/editing user accounts
 * Based on TeamMemberEditModal pattern
 */

'use client';

import React, { useState } from 'react';
import { XMarkIcon, PhotoIcon, PlusIcon, MinusIcon } from '@heroicons/react/24/outline';
import { useThemeColors } from '@/hooks/useThemeColors';
import { supabase } from '@/lib/supabaseClient';
import { useCrm } from '../context/CrmContext';
import ImageGalleryModal from '@/components/modals/ImageGalleryModal';
import { accountSchema, teamMemberSchema, customerSchema, validateData } from '@/lib/validations/crm';

interface AccountEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  onSuccess: () => void;
}

export function AccountEditModal({
  isOpen,
  onClose,
  organizationId,
  onSuccess,
}: AccountEditModalProps) {
  const { showToast } = useCrm();
  const themeColors = useThemeColors();
  const primary = themeColors.cssVars.primary;
  const [isSaving, setIsSaving] = useState(false);
  const [showTeamDetails, setShowTeamDetails] = useState(false);
  const [showCustomerDetails, setShowCustomerDetails] = useState(false);
  const [isImageGalleryOpen, setIsImageGalleryOpen] = useState(false);
  const [currentImageField, setCurrentImageField] = useState<'team' | 'customer' | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    username: '',
    city: '',
    postal_code: '',
    country: '',
    role: 'user' as 'user' | 'admin' | 'superadmin',
    user_status: 'free_trial' as 'free_trial' | 'paid' | 'inactive',
    is_student: false,
    is_site_creator: false,
    is_service_provider: false,
    service_title: '',
    hourly_rate: '',
    is_available_for_booking: false,
    // Team member fields
    is_team_member: false,
    team_image: '',
    team_job_title: '',
    team_department: '',
    team_pseudonym: '',
    team_description: '',
    team_skills: '',
    team_bio: '',
    team_experience_years: '',
    team_linkedin_url: '',
    team_twitter_url: '',
    team_github_url: '',
    team_portfolio_url: '',
    // Customer fields
    is_customer: false,
    customer_image: '',
    customer_company: '',
    customer_job_title: '',
    customer_rating: '5',
    customer_testimonial: '',
    customer_company_logo: '',
    customer_linkedin_url: '',
    customer_project_type: '',
    customer_testimonial_date: new Date().toISOString().split('T')[0],
  });

  const handleSave = async () => {
    if (!formData.email || !formData.full_name) {
      showToast('Email and Full Name are required', 'error');
      return;
    }

    // Validate account data
    const accountValidation = validateData(accountSchema, {
      full_name: formData.full_name,
      username: formData.username,
      email: formData.email,
      city: formData.city,
      postal_code: formData.postal_code,
      country: formData.country,
      role: formData.role,
      user_status: formData.user_status,
      is_student: formData.is_student,
      is_site_creator: formData.is_site_creator,
      is_service_provider: formData.is_service_provider,
      service_title: formData.service_title,
      hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : undefined,
      is_available_for_booking: formData.is_available_for_booking,
    });

    if (!accountValidation.success) {
      showToast(accountValidation.errors[0], 'error');
      return;
    }

    // Validate team member data if applicable
    if (formData.is_team_member) {
      const teamValidation = validateData(teamMemberSchema, {
        is_team_member: formData.is_team_member,
        job_title: formData.team_job_title,
        department: formData.team_department,
        image: formData.team_image,
        pseudonym: formData.team_pseudonym,
        description: formData.team_description,
        bio: formData.team_bio,
        skills: formData.team_skills,
        experience_years: formData.team_experience_years ? parseInt(formData.team_experience_years) : undefined,
        linkedin_url: formData.team_linkedin_url,
        twitter_url: formData.team_twitter_url,
        github_url: formData.team_github_url,
        portfolio_url: formData.team_portfolio_url,
      });

      if (!teamValidation.success) {
        showToast(teamValidation.errors[0], 'error');
        return;
      }
    }

    // Validate customer data if applicable
    if (formData.is_customer) {
      const customerValidation = validateData(customerSchema, {
        is_customer: formData.is_customer,
        is_lead: false,
        company: formData.customer_company,
        job_title: formData.customer_job_title,
        image: formData.customer_image,
        rating: formData.customer_rating ? parseFloat(formData.customer_rating) : undefined,
        testimonial_text: formData.customer_testimonial,
        company_logo: formData.customer_company_logo,
        linkedin_url: formData.customer_linkedin_url,
        project_type: formData.customer_project_type,
        testimonial_date: formData.customer_testimonial_date,
      });

      if (!customerValidation.success) {
        showToast(customerValidation.errors[0], 'error');
        return;
      }
    }

    setIsSaving(true);
    try {
      // Get the current session for auth token
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        showToast('No active session. Please log in again.', 'error');
        setIsSaving(false);
        return;
      }

      // Call server-side API to create user account
      const response = await fetch('/api/accounts/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          full_name: formData.full_name,
          username: formData.username || null,
          city: formData.city || null,
          postal_code: formData.postal_code || null,
          country: formData.country || null,
          role: formData.role,
          user_status: formData.user_status,
          organization_id: organizationId,
          is_student: formData.is_student,
          is_site_creator: formData.is_site_creator,
          is_service_provider: formData.is_service_provider,
          service_title: formData.service_title || null,
          hourly_rate: formData.hourly_rate || null,
          is_available_for_booking: formData.is_available_for_booking,
          // Team member data
          is_team_member: formData.is_team_member,
          team_image: formData.team_image || null,
          team_job_title: formData.team_job_title || null,
          team_department: formData.team_department || null,
          team_pseudonym: formData.team_pseudonym || null,
          team_description: formData.team_description || null,
          team_skills: formData.team_skills || null,
          team_bio: formData.team_bio || null,
          team_experience_years: formData.team_experience_years || null,
          team_linkedin_url: formData.team_linkedin_url || null,
          team_twitter_url: formData.team_twitter_url || null,
          team_github_url: formData.team_github_url || null,
          team_portfolio_url: formData.team_portfolio_url || null,
          // Customer data
          is_customer: formData.is_customer,
          customer_image: formData.customer_image || null,
          customer_company: formData.customer_company || null,
          customer_job_title: formData.customer_job_title || null,
          customer_rating: formData.customer_rating || '5',
          customer_testimonial: formData.customer_testimonial || null,
          customer_company_logo: formData.customer_company_logo || null,
          customer_linkedin_url: formData.customer_linkedin_url || null,
          customer_project_type: formData.customer_project_type || null,
          customer_testimonial_date: formData.customer_testimonial_date || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create account');
      }

      // Reset form and close
      setFormData({
        email: '',
        full_name: '',
        username: '',
        city: '',
        postal_code: '',
        country: '',
        role: 'user',
        user_status: 'free_trial',
        is_student: false,
        is_site_creator: false,
        is_service_provider: false,
        service_title: '',
        hourly_rate: '',
        is_available_for_booking: false,
        is_team_member: false,
        team_image: '',
        team_job_title: '',
        team_department: '',
        team_pseudonym: '',
        team_description: '',
        team_skills: '',
        team_bio: '',
        team_experience_years: '',
        team_linkedin_url: '',
        team_twitter_url: '',
        team_github_url: '',
        team_portfolio_url: '',
        is_customer: false,
        customer_image: '',
        customer_company: '',
        customer_job_title: '',
        customer_rating: '5',
        customer_testimonial: '',
        customer_company_logo: '',
        customer_linkedin_url: '',
        customer_project_type: '',
        customer_testimonial_date: new Date().toISOString().split('T')[0],
      });
      
      showToast('Account created successfully', 'success');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating account:', error);
      showToast(error instanceof Error ? error.message : 'Failed to create account. Please try again.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Add New Account
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Basic Info */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                Basic Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="user@example.com"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="John Doe"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="johndoe"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Location */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                Location
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="New York"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    value={formData.postal_code}
                    onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                    placeholder="10001"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Country
                  </label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    placeholder="USA"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Account Settings */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                Account Settings
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Role
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                    <option value="superadmin">Super Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    User Status
                  </label>
                  <select
                    value={formData.user_status}
                    onChange={(e) => setFormData({ ...formData, user_status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="free_trial">Free Trial</option>
                    <option value="paid">Paid</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Flags */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                Account Flags
              </h4>
              <div className="space-y-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_student}
                    onChange={(e) => setFormData({ ...formData, is_student: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Student</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_site_creator}
                    onChange={(e) => setFormData({ ...formData, is_site_creator: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Site Creator</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_service_provider}
                    onChange={(e) => setFormData({ ...formData, is_service_provider: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Service Provider</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_team_member}
                    onChange={(e) => setFormData({ ...formData, is_team_member: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Team Member</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_customer}
                    onChange={(e) => setFormData({ ...formData, is_customer: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Customer</span>
                </label>
              </div>
            </div>

            {/* Team Member Fields */}
            {formData.is_team_member && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                    Team Member Details
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowTeamDetails(!showTeamDetails)}
                    className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                  >
                    {showTeamDetails ? (
                      <>
                        <MinusIcon className="w-4 h-4" />
                        Less
                      </>
                    ) : (
                      <>
                        <PlusIcon className="w-4 h-4" />
                        More
                      </>
                    )}
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Job Title
                    </label>
                    <input
                      type="text"
                      value={formData.team_job_title}
                      onChange={(e) => setFormData({ ...formData, team_job_title: e.target.value })}
                      placeholder="e.g., Senior Developer"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Department
                    </label>
                    <input
                      type="text"
                      value={formData.team_department}
                      onChange={(e) => setFormData({ ...formData, team_department: e.target.value })}
                      placeholder="e.g., Engineering"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                {showTeamDetails && (
                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Profile Image
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={formData.team_image}
                          onChange={(e) => setFormData({ ...formData, team_image: e.target.value })}
                          placeholder="https://..."
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setCurrentImageField('team');
                            setIsImageGalleryOpen(true);
                          }}
                          className="px-3 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                          title="Choose from gallery"
                        >
                          <PhotoIcon className="w-5 h-5" />
                        </button>
                        {formData.team_image && (
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, team_image: '' })}
                            className="px-3 py-2 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                            title="Remove image"
                          >
                            <XMarkIcon className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                      {formData.team_image && (
                        <div className="mt-2">
                          <img
                            src={formData.team_image}
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
                        value={formData.team_pseudonym}
                        onChange={(e) => setFormData({ ...formData, team_pseudonym: e.target.value })}
                        placeholder="Optional display name"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Description
                      </label>
                      <textarea
                        value={formData.team_description}
                        onChange={(e) => setFormData({ ...formData, team_description: e.target.value })}
                        placeholder="Brief description"
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Bio
                      </label>
                      <textarea
                        value={formData.team_bio}
                        onChange={(e) => setFormData({ ...formData, team_bio: e.target.value })}
                        placeholder="Full biography"
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Skills (comma-separated)
                      </label>
                      <input
                        type="text"
                        value={formData.team_skills}
                        onChange={(e) => setFormData({ ...formData, team_skills: e.target.value })}
                        placeholder="React, TypeScript, Node.js"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Experience (years)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={formData.team_experience_years}
                        onChange={(e) => setFormData({ ...formData, team_experience_years: e.target.value })}
                        placeholder="e.g., 5"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Social Links</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">LinkedIn URL</label>
                          <input
                            type="url"
                            value={formData.team_linkedin_url}
                            onChange={(e) => setFormData({ ...formData, team_linkedin_url: e.target.value })}
                            placeholder="https://linkedin.com/in/..."
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Twitter URL</label>
                          <input
                            type="url"
                            value={formData.team_twitter_url}
                            onChange={(e) => setFormData({ ...formData, team_twitter_url: e.target.value })}
                            placeholder="https://twitter.com/..."
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">GitHub URL</label>
                          <input
                            type="url"
                            value={formData.team_github_url}
                            onChange={(e) => setFormData({ ...formData, team_github_url: e.target.value })}
                            placeholder="https://github.com/..."
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Portfolio URL</label>
                          <input
                            type="url"
                            value={formData.team_portfolio_url}
                            onChange={(e) => setFormData({ ...formData, team_portfolio_url: e.target.value })}
                            placeholder="https://..."
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Customer Fields */}
            {formData.is_customer && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                    Customer Details
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowCustomerDetails(!showCustomerDetails)}
                    className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                  >
                    {showCustomerDetails ? (
                      <>
                        <MinusIcon className="w-4 h-4" />
                        Less
                      </>
                    ) : (
                      <>
                        <PlusIcon className="w-4 h-4" />
                        More
                      </>
                    )}
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Company
                    </label>
                    <input
                      type="text"
                      value={formData.customer_company}
                      onChange={(e) => setFormData({ ...formData, customer_company: e.target.value })}
                      placeholder="e.g., Acme Corp"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Job Title
                    </label>
                    <input
                      type="text"
                      value={formData.customer_job_title}
                      onChange={(e) => setFormData({ ...formData, customer_job_title: e.target.value })}
                      placeholder="e.g., CEO"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                {showCustomerDetails && (
                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Profile Image
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={formData.customer_image}
                          onChange={(e) => setFormData({ ...formData, customer_image: e.target.value })}
                          placeholder="https://..."
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setCurrentImageField('customer');
                            setIsImageGalleryOpen(true);
                          }}
                          className="px-3 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                          title="Choose from gallery"
                        >
                          <PhotoIcon className="w-5 h-5" />
                        </button>
                        {formData.customer_image && (
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, customer_image: '' })}
                            className="px-3 py-2 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                            title="Remove image"
                          >
                            <XMarkIcon className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                      {formData.customer_image && (
                        <div className="mt-2">
                          <img
                            src={formData.customer_image}
                            alt="Preview"
                            className="w-20 h-20 rounded-lg object-cover border border-gray-300 dark:border-gray-600"
                          />
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Rating (1-5)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="5"
                        step="0.5"
                        value={formData.customer_rating}
                        onChange={(e) => setFormData({ ...formData, customer_rating: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Testimonial
                      </label>
                      <textarea
                        value={formData.customer_testimonial}
                        onChange={(e) => setFormData({ ...formData, customer_testimonial: e.target.value })}
                        placeholder="Customer testimonial text"
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Testimonial Date
                      </label>
                      <input
                        type="date"
                        value={formData.customer_testimonial_date}
                        onChange={(e) => setFormData({ ...formData, customer_testimonial_date: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Company Logo URL
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={formData.customer_company_logo}
                          onChange={(e) => setFormData({ ...formData, customer_company_logo: e.target.value })}
                          placeholder="https://..."
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setCurrentImageField('customer');
                            setIsImageGalleryOpen(true);
                          }}
                          className="px-3 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                          title="Choose from gallery"
                        >
                          <PhotoIcon className="w-5 h-5" />
                        </button>
                      </div>
                      {formData.customer_company_logo && (
                        <div className="mt-2">
                          <img
                            src={formData.customer_company_logo}
                            alt="Company logo"
                            className="h-16 object-contain border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-800"
                          />
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Project Type
                      </label>
                      <input
                        type="text"
                        value={formData.customer_project_type}
                        onChange={(e) => setFormData({ ...formData, customer_project_type: e.target.value })}
                        placeholder="e.g., Website Development, Mobile App"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        LinkedIn URL
                      </label>
                      <input
                        type="url"
                        value={formData.customer_linkedin_url}
                        onChange={(e) => setFormData({ ...formData, customer_linkedin_url: e.target.value })}
                        placeholder="https://linkedin.com/in/..."
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Service Provider Fields */}
            {formData.is_service_provider && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                  Service Provider Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Service Title
                    </label>
                    <input
                      type="text"
                      value={formData.service_title}
                      onChange={(e) => setFormData({ ...formData, service_title: e.target.value })}
                      placeholder="e.g., Consultant, Developer"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Hourly Rate ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.hourly_rate}
                      onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
                      placeholder="50.00"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.is_available_for_booking}
                        onChange={(e) => setFormData({ ...formData, is_available_for_booking: e.target.checked })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Available for Booking</span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !formData.email || !formData.full_name}
            className="px-4 py-2 text-white rounded-lg font-medium transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`,
            }}
          >
            {isSaving ? 'Creating...' : 'Create Account'}
          </button>
        </div>
      </div>

      {/* Image Gallery Modal */}
      {isImageGalleryOpen && (
        <ImageGalleryModal
          isOpen={isImageGalleryOpen}
          onClose={() => setIsImageGalleryOpen(false)}
          onSelectImage={(imageUrl) => {
            if (currentImageField === 'team') {
              setFormData({ ...formData, team_image: imageUrl });
            } else if (currentImageField === 'customer') {
              // Check if we're editing customer_image or customer_company_logo based on which field is focused
              // For now, use customer_image, but this could be enhanced with more specific tracking
              setFormData({ ...formData, customer_image: imageUrl });
            }
            setIsImageGalleryOpen(false);
          }}
        />
      )}
    </div>
  );
}
