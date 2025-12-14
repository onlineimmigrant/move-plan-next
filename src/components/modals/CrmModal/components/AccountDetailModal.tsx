/**
 * AccountDetailModal Component
 * 
 * Displays and allows inline editing of user account details
 * Positioned above CRM modal with higher z-index
 * Based on TeamMemberDetailModal
 */

'use client';

import React, { useState, useEffect } from 'react';
import { X, User, Mail, MapPin, Building2, Phone, Calendar, Shield, Briefcase, Star, Trash2, CheckCircle, Clock, ShoppingCart, Award, Package, MessageSquare, Activity, Edit2 } from 'lucide-react';
import { PhotoIcon, PlusIcon, MinusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { supabase } from '@/lib/supabaseClient';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useCrm } from '../context/CrmContext';
import { Profile, Review } from '../types';
import ImageGalleryModal from '@/components/modals/ImageGalleryModal';
import { Toast } from '@/components/ui/Toast';
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';
import { accountSchema, teamMemberSchema, customerSchema, validateData } from '@/lib/validations/crm';
import { CRMDataProvider } from '@/context/CRMDataContext';
import AppointmentsSection from '@/components/crm/sections/AppointmentsSection';
import SupportSection from '@/components/crm/sections/SupportSection';
import CasesSection from '@/components/crm/sections/CasesSection';
import ActivityTimeline from '@/components/crm/ActivityTimeline';

interface Purchase {
  id: string;
  purchased_item_id: string;
  transaction_id: string | null;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
  pricingplan: {
    package: string | null;
    price: number | null;
    currency_symbol: string | null;
    product: {
      product_name: string;
    } | null;
  } | null;
}

interface AccountDetailModalProps {
  isOpen: boolean;
  account: Profile | null;
  onClose: () => void;
  onUpdate?: () => void;
  showToast?: (message: string, type: 'success' | 'error') => void;
}

export function AccountDetailModal({ isOpen, account, onClose, onUpdate, showToast: propShowToast }: AccountDetailModalProps) {
  // Try to get context, but allow it to be null (for use outside CRM modal)
  let contextShowToast: ((message: string, type: 'success' | 'error') => void) | undefined;
  try {
    const { showToast: crmShowToast } = useCrm();
    contextShowToast = crmShowToast;
  } catch (e) {
    // Context not available, will use prop or fallback
  }
  
  const showToast = propShowToast || contextShowToast || ((msg: string, type: 'success' | 'error') => {
    console.log(`[${type.toUpperCase()}]`, msg);
  });
  
  const themeColors = useThemeColors();
  const primary = themeColors.cssVars.primary;
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLastAdmin, setIsLastAdmin] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('error');
  const [editedData, setEditedData] = useState<any>({});
  const [showTeamDetails, setShowTeamDetails] = useState(false);
  const [showCustomerDetails, setShowCustomerDetails] = useState(false);
  const [isImageGalleryOpen, setIsImageGalleryOpen] = useState(false);
  const [currentImageField, setCurrentImageField] = useState<'team' | 'customer' | null>(null);
  const [userReviews, setUserReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loadingPurchases, setLoadingPurchases] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'appointments' | 'support' | 'cases' | 'activity'>('details');

  useEffect(() => {
    if (account) {
      fetchUserReviews();
      fetchPurchases();
      setEditedData({
        full_name: account.full_name || '',
        username: account.username || '',
        email: account.email || '',
        city: account.city || '',
        postal_code: account.postal_code || '',
        country: account.country || '',
        role: account.role || 'user',
        user_status: account.user_status || 'free_trial',
        is_student: account.is_student || false,
        is_site_creator: account.is_site_creator || false,
        is_service_provider: account.is_service_provider || false,
        service_title: account.service_title || '',
        hourly_rate: account.hourly_rate || '',
        is_available_for_booking: account.is_available_for_booking || false,
        // Team member fields
        is_team_member: account.team?.is_team_member || false,
        team_is_featured: account.team?.is_featured || false,
        team_job_title: account.team?.job_title || '',
        team_department: account.team?.department || '',
        team_image: account.team?.image || '',
        team_pseudonym: account.team?.pseudonym || '',
        team_description: account.team?.description || '',
        team_skills: Array.isArray(account.team?.skills) ? account.team.skills.join(', ') : (account.team?.skills || ''),
        team_bio: account.team?.bio || '',
        team_experience_years: account.team?.experience_years?.toString() || '',
        team_linkedin_url: account.team?.linkedin_url || '',
        team_twitter_url: account.team?.twitter_url || '',
        team_github_url: account.team?.github_url || '',
        team_portfolio_url: account.team?.portfolio_url || '',
        // Customer fields
        is_customer: account.customer?.is_customer || false,
        customer_company: account.customer?.company || '',
        customer_job_title: account.customer?.job_title || '',
        customer_image: account.customer?.image || '',
        customer_rating: account.customer?.rating || 5,
        customer_testimonial: account.customer?.testimonial_text || '',
        customer_company_logo: account.customer?.company_logo || '',
        customer_linkedin_url: account.customer?.linkedin_url || '',
        customer_project_type: account.customer?.project_type || '',
        customer_testimonial_date: account.customer?.testimonial_date || new Date().toISOString().split('T')[0],
        // Lead fields
        is_lead: account.customer?.is_lead || false,
        lead_status: account.customer?.lead_status || 'new',
        lead_source: account.customer?.lead_source || '',
        lead_score: account.customer?.lead_score || 0,
        lead_notes: account.customer?.lead_notes || '',
        // Testimonial fields
        testimonial_status: account.customer?.testimonial_status || 'pending',
        rating: account.customer?.rating || 5,
      });
    }
  }, [account]);

  // Fetch purchases for this user
  const fetchPurchases = async () => {
    if (!account?.id) return;
    
    setLoadingPurchases(true);
    try {
      const { data, error } = await supabase
        .from('purchases')
        .select(`
          id,
          purchased_item_id,
          transaction_id,
          start_date,
          end_date,
          is_active,
          created_at,
          pricingplan:purchased_item_id (
            package,
            price,
            currency_symbol,
            product:product_id (
              product_name
            )
          )
        `)
        .eq('profiles_id', account.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform data - handle both object and array structures from Supabase
      const transformedPurchases = (data || []).map((item: any) => {
        const pricingplan = Array.isArray(item.pricingplan) 
          ? item.pricingplan[0] 
          : item.pricingplan;
          
        const product = pricingplan?.product
          ? (Array.isArray(pricingplan.product) ? pricingplan.product[0] : pricingplan.product)
          : null;
        
        return {
          id: item.id,
          purchased_item_id: item.purchased_item_id,
          transaction_id: item.transaction_id,
          start_date: item.start_date,
          end_date: item.end_date,
          is_active: item.is_active,
          created_at: item.created_at,
          pricingplan: pricingplan ? {
            package: pricingplan.package,
            price: pricingplan.price,
            currency_symbol: pricingplan.currency_symbol,
            product: product ? { product_name: product.product_name } : null
          } : null
        };
      });
      
      setPurchases(transformedPurchases);
    } catch (error) {
      console.error('Error fetching purchases:', error);
    } finally {
      setLoadingPurchases(false);
    }
  };

  // Fetch reviews for this user
  const fetchUserReviews = async () => {
    if (!account?.id) return;
    
    setLoadingReviews(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/reviews?user_id=${account.id}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserReviews(data.reviews || []);
      }
    } catch (error) {
      console.error('Error fetching user reviews:', error);
    } finally {
      setLoadingReviews(false);
    }
  };

  // Check if this account is the last admin/superadmin in the org
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        if (!account?.id) {
          setIsLastAdmin(false);
          return;
        }
        const res = await fetch('/api/accounts/is-last-admin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accountId: account.id }),
        });
        if (!res.ok) {
          setIsLastAdmin(false);
          return;
        }
        const json = await res.json();
        setIsLastAdmin(!!json.isLastAdmin);
      } catch {
        setIsLastAdmin(false);
      }
    };
    checkAdminStatus();
  }, [account?.id]);

  const handleToggleFeatured = async () => {
    if (!account || !account.team) return;

    const newFeaturedStatus = !editedData.team_is_featured;
    
    // Optimistic update
    setEditedData({ ...editedData, team_is_featured: newFeaturedStatus });

    try {
      const updateData = {
        ...account.team,
        is_featured: newFeaturedStatus,
      };

      const { error } = await supabase
        .from('profiles')
        .update({
          team: updateData
        })
        .eq('id', account.id);

      if (error) throw error;

      // Refresh parent data
      onUpdate?.();
    } catch (error) {
      console.error('Error toggling featured status:', error);
      // Revert on error
      setEditedData({ ...editedData, team_is_featured: !newFeaturedStatus });
      showToast('Failed to update featured status. Please try again.', 'error');
    }
  };

  const handleSave = async () => {
    if (!account) return;

    // Validate account data
    const accountValidation = validateData(accountSchema, {
      full_name: editedData.full_name,
      username: editedData.username,
      email: account.email, // Email can't be edited
      city: editedData.city,
      postal_code: editedData.postal_code,
      country: editedData.country,
      role: editedData.role,
      user_status: editedData.user_status,
      is_student: editedData.is_student,
      is_site_creator: editedData.is_site_creator,
      is_service_provider: editedData.is_service_provider,
      service_title: editedData.service_title,
      hourly_rate: editedData.hourly_rate ? parseFloat(editedData.hourly_rate) : undefined,
      is_available_for_booking: editedData.is_available_for_booking,
    });

    if (!accountValidation.success) {
      showToast(accountValidation.errors[0], 'error');
      return;
    }

    // Validate team member data if applicable
    if (editedData.is_team_member) {
      const teamValidation = validateData(teamMemberSchema, {
        is_team_member: editedData.is_team_member,
        job_title: editedData.team_job_title,
        department: editedData.team_department,
        image: editedData.team_image,
        pseudonym: editedData.team_pseudonym,
        description: editedData.team_description,
        bio: editedData.team_bio,
        skills: editedData.team_skills,
        experience_years: editedData.team_experience_years ? parseInt(editedData.team_experience_years) : undefined,
        linkedin_url: editedData.team_linkedin_url,
        twitter_url: editedData.team_twitter_url,
        github_url: editedData.team_github_url,
        portfolio_url: editedData.team_portfolio_url,
        is_featured: editedData.team_is_featured,
      });

      if (!teamValidation.success) {
        showToast(teamValidation.errors[0], 'error');
        return;
      }
    }

    // Validate customer data if applicable
    if (editedData.is_customer || editedData.is_lead) {
      const customerValidation = validateData(customerSchema, {
        is_customer: editedData.is_customer,
        is_lead: editedData.is_lead,
        company: editedData.customer_company,
        job_title: editedData.customer_job_title,
        image: editedData.customer_image,
        rating: editedData.customer_rating ? parseFloat(editedData.customer_rating) : undefined,
        testimonial_text: editedData.customer_testimonial,
        testimonial_date: editedData.customer_testimonial_date,
        testimonial_status: editedData.testimonial_status,
        company_logo: editedData.customer_company_logo,
        linkedin_url: editedData.customer_linkedin_url,
        project_type: editedData.customer_project_type,
        lead_status: editedData.lead_status,
        lead_source: editedData.lead_source,
        lead_score: editedData.lead_score ? parseInt(editedData.lead_score) : undefined,
        lead_notes: editedData.lead_notes,
      });

      if (!customerValidation.success) {
        showToast(customerValidation.errors[0], 'error');
        return;
      }
    }

    setIsSaving(true);
    try {
      const updateData: any = {
        full_name: editedData.full_name,
        username: editedData.username || null,
        city: editedData.city || null,
        postal_code: editedData.postal_code || null,
        country: editedData.country || null,
        role: editedData.role,
        user_status: editedData.user_status,
        is_student: editedData.is_student,
        is_site_creator: editedData.is_site_creator,
        is_service_provider: editedData.is_service_provider,
        service_title: editedData.service_title || null,
        hourly_rate: editedData.hourly_rate ? parseFloat(editedData.hourly_rate) : null,
        is_available_for_booking: editedData.is_available_for_booking,
      };

      // Update team data
      if (editedData.is_team_member) {
        updateData.team = {
          ...(account.team || {}),
          is_team_member: true,
          is_featured: editedData.team_is_featured || false,
          job_title: editedData.team_job_title || '',
          department: editedData.team_department || '',
          image: editedData.team_image || null,
          pseudonym: editedData.team_pseudonym || null,
          description: editedData.team_description || '',
          skills: editedData.team_skills ? editedData.team_skills.split(',').map((s: string) => s.trim()) : [],
          bio: editedData.team_bio || '',
          experience_years: editedData.team_experience_years ? parseInt(editedData.team_experience_years) : null,
          linkedin_url: editedData.team_linkedin_url || null,
          twitter_url: editedData.team_twitter_url || null,
          github_url: editedData.team_github_url || null,
          portfolio_url: editedData.team_portfolio_url || null,
        };
      } else if (account.team) {
        // If unchecked, set is_team_member to false but keep other data
        updateData.team = {
          ...account.team,
          is_team_member: false,
        };
      }

      // Update customer data
      if (editedData.is_customer || editedData.is_lead) {
        // Enforce mutual exclusivity: only one can be true
        const hasTestimonial = editedData.customer_testimonial && editedData.customer_testimonial.trim().length > 0;
        const finalIsLead = hasTestimonial ? false : editedData.is_lead;
        const finalIsCustomer = hasTestimonial ? true : editedData.is_customer;
        
        // If user has testimonial, auto-convert to customer
        if (hasTestimonial && editedData.is_lead) {
          setToastMessage('User automatically converted to customer (has testimonial)');
          setToastType('success');
        }

        updateData.customer = {
          ...(account.customer || {}),
          is_customer: finalIsCustomer,
          is_lead: finalIsLead,
          company: editedData.customer_company || '',
          job_title: editedData.customer_job_title || '',
          image: editedData.customer_image || null,
          rating: editedData.customer_rating ? parseFloat(editedData.customer_rating) : 5,
          testimonial_text: editedData.customer_testimonial || '',
          company_logo: editedData.customer_company_logo || null,
          linkedin_url: editedData.customer_linkedin_url || null,
          project_type: editedData.customer_project_type || '',
          testimonial_date: editedData.customer_testimonial_date || null,
          // Lead fields
          lead_status: finalIsLead ? (editedData.lead_status || 'new') : 'converted',
          lead_source: editedData.lead_source || '',
          lead_score: editedData.lead_score ? parseInt(editedData.lead_score) : 0,
          lead_notes: editedData.lead_notes || '',
          // Testimonial fields
          testimonial_status: editedData.testimonial_status || 'pending',
        };
      } else if (account.customer) {
        // If unchecked, set is_customer to false but keep other data
        updateData.customer = {
          ...account.customer,
          is_customer: false,
          is_lead: false,
        };
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', account.id);

      if (error) throw error;

      showToast('Account updated successfully', 'success');
      setIsEditing(false);
      onUpdate?.();
    } catch (error) {
      console.error('Error updating account:', error);
      showToast('Failed to update. Please try again.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!account?.id) return;

    setIsDeleting(true);
    try {
      // Always use the admin API to delete both auth user and profile safely
      const response = await fetch('/api/accounts/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId: account.id }),
      });

      if (!response.ok) {
        const result = await response.json();
        // Show a small toast for server-side guards (e.g., 409 last admin)
        if (response.status === 409) {
          setToastType('error');
          setToastMessage(result.error || 'This account is protected and cannot be deleted.');
        } else {
          setToastType('error');
          setToastMessage(result.error || 'Failed to delete account.');
        }
        throw new Error(result.error || 'Failed to delete account');
      }

      setToastType('success');
      setToastMessage('Account deleted successfully.');
      onUpdate?.();
      onClose();
    } catch (error: any) {
      // Surface server guard (e.g., last admin) clearly
      const msg = error?.message || 'Failed to delete account';
      console.error(msg);
      // Optional: could show a non-blocking toast here
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (!isOpen || !account) return null;

  const getInitials = (name?: string | null) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const accountImage = account.team?.image || account.customer?.image || null;

  return (
    <div className="fixed inset-0 z-[10004] flex items-center justify-center animate-in fade-in duration-200">
      {/* Backdrop - Fully opaque to hide CRM modal */}
      <div
        className="absolute inset-0 bg-white dark:bg-gray-900"
        onClick={onClose}
        aria-hidden="true"
      />
      
      <div
        className="relative w-full h-full sm:h-[90vh] sm:max-w-6xl bg-white dark:bg-gray-900 sm:rounded-2xl shadow-2xl flex flex-col pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setToastMessage(null)}
          autoDismissMs={3000}
        />
        {/* Header */}
        <div className="relative px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between gap-3">
            {/* Avatar Section */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {accountImage ? (
                <img
                  src={accountImage}
                  alt={account.full_name || 'Account'}
                  className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-semibold flex-shrink-0"
                  style={{
                    background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`,
                  }}
                >
                  {getInitials(account.full_name)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white truncate">
                  {account.full_name || 'Unnamed'}
                </h2>
                {account.username && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    @{account.username}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0"
              aria-label="Close"
            >
              <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          {/* Account Badges */}
          <div className="flex items-center gap-2 mt-3">
            {account.team?.is_team_member && (
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-medium rounded-full">
                Team Member
              </span>
            )}
            {(account.customer?.is_lead === true && account.customer?.is_customer !== true) && (
              <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs font-medium rounded-full">
                Lead
              </span>
            )}
            {account.customer?.is_customer === true && (
              <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium rounded-full">
                Customer
              </span>
            )}
            {account.is_service_provider && (
              <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs font-medium rounded-full">
                Service Provider
              </span>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 py-4 border-b border-slate-200/50 dark:border-gray-700/50">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide py-3">
            <button
              onClick={() => setActiveTab('details')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full font-medium text-sm transition-all duration-200 whitespace-nowrap shadow-sm"
              style={activeTab === 'details'
                ? {
                    background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`,
                    color: 'white',
                    boxShadow: `0 4px 12px ${primary.base}40`,
                  }
                : {
                    backgroundColor: 'transparent',
                    color: primary.base,
                    border: '1px solid',
                    borderColor: `${primary.base}40`,
                  }
              }
            >
              <User className="w-4 h-4" />
              <span>Details</span>
            </button>
            <button
              onClick={() => setActiveTab('appointments')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full font-medium text-sm transition-all duration-200 whitespace-nowrap shadow-sm"
              style={activeTab === 'appointments'
                ? {
                    background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`,
                    color: 'white',
                    boxShadow: `0 4px 12px ${primary.base}40`,
                  }
                : {
                    backgroundColor: 'transparent',
                    color: primary.base,
                    border: '1px solid',
                    borderColor: `${primary.base}40`,
                  }
              }
            >
              <Calendar className="w-4 h-4" />
              <span>Appointments</span>
            </button>
            <button
              onClick={() => setActiveTab('support')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full font-medium text-sm transition-all duration-200 whitespace-nowrap shadow-sm"
              style={activeTab === 'support'
                ? {
                    background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`,
                    color: 'white',
                    boxShadow: `0 4px 12px ${primary.base}40`,
                  }
                : {
                    backgroundColor: 'transparent',
                    color: primary.base,
                    border: '1px solid',
                    borderColor: `${primary.base}40`,
                  }
              }
            >
              <MessageSquare className="w-4 h-4" />
              <span>Support</span>
            </button>
            <button
              onClick={() => setActiveTab('cases')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full font-medium text-sm transition-all duration-200 whitespace-nowrap shadow-sm"
              style={activeTab === 'cases'
                ? {
                    background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`,
                    color: 'white',
                    boxShadow: `0 4px 12px ${primary.base}40`,
                  }
                : {
                    backgroundColor: 'transparent',
                    color: primary.base,
                    border: '1px solid',
                    borderColor: `${primary.base}40`,
                  }
              }
            >
              <Briefcase className="w-4 h-4" />
              <span>Cases</span>
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full font-medium text-sm transition-all duration-200 whitespace-nowrap shadow-sm"
              style={activeTab === 'activity'
                ? {
                    background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`,
                    color: 'white',
                    boxShadow: `0 4px 12px ${primary.base}40`,
                  }
                : {
                    backgroundColor: 'transparent',
                    color: primary.base,
                    border: '1px solid',
                    borderColor: `${primary.base}40`,
                  }
              }
            >
              <Activity className="w-4 h-4" />
              <span>Activity</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6 max-h-[70vh] overflow-y-auto">
          {activeTab === 'details' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Contact & Info */}
            <div className="lg:col-span-1 space-y-4">
              {/* Contact Info */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <User className="w-4 h-4" style={{ color: primary.base }} />
                  Contact Information
                </h3>
                <div className="space-y-3">
                  {isEditing ? (
                    <>
                      <div>
                        <label className="text-xs text-gray-500 dark:text-gray-400">Full Name</label>
                        <input
                          type="text"
                          value={editedData.full_name}
                          onChange={(e) => setEditedData({ ...editedData, full_name: e.target.value })}
                          className="w-full mt-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 dark:text-gray-400">Username</label>
                        <input
                          type="text"
                          value={editedData.username}
                          onChange={(e) => setEditedData({ ...editedData, username: e.target.value })}
                          className="w-full mt-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-900 dark:text-white">{account.email}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Location */}
              {(account.city || account.country || isEditing) && (
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4" style={{ color: primary.base }} />
                    Location
                  </h3>
                  {isEditing ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editedData.city}
                        onChange={(e) => setEditedData({ ...editedData, city: e.target.value })}
                        placeholder="City"
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                      <input
                        type="text"
                        value={editedData.postal_code}
                        onChange={(e) => setEditedData({ ...editedData, postal_code: e.target.value })}
                        placeholder="Postal Code"
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                      <input
                        type="text"
                        value={editedData.country}
                        onChange={(e) => setEditedData({ ...editedData, country: e.target.value })}
                        placeholder="Country"
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  ) : (
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {[account.city, account.country].filter(Boolean).join(', ')}
                    </p>
                  )}
                </div>
              )}

              {/* Account Status */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4" style={{ color: primary.base }} />
                  Account Status
                </h3>
                {isEditing ? (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-400">Role</label>
                      <select
                        value={editedData.role}
                        onChange={(e) => setEditedData({ ...editedData, role: e.target.value })}
                        className="w-full mt-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-400">Status</label>
                      <select
                        value={editedData.user_status}
                        onChange={(e) => setEditedData({ ...editedData, user_status: e.target.value })}
                        className="w-full mt-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="free_trial">Free Trial</option>
                        <option value="paid">Paid</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Role</p>
                      <p className="text-sm text-gray-900 dark:text-white capitalize">{account.role}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
                      <p className="text-sm text-gray-900 dark:text-white capitalize">{account.user_status?.replace('_', ' ')}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Account Info */}
              {account.created_at && (
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4" style={{ color: primary.base }} />
                    Account Info
                  </h3>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Member Since</p>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {new Date(account.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Account Stats */}
              {!account.team?.is_team_member && (
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Award className="w-4 h-4" style={{ color: primary.base }} />
                    Account Stats
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-2 bg-white dark:bg-gray-900 rounded-lg">
                      <p className="text-2xl font-bold" style={{ color: primary.base }}>
                        {purchases.length}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Total Orders</p>
                    </div>
                    <div className="text-center p-2 bg-white dark:bg-gray-900 rounded-lg">
                      <p className="text-2xl font-bold" style={{ color: primary.base }}>
                        {purchases.filter(p => p.is_active && (!p.end_date || new Date(p.end_date) > new Date())).length}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Active</p>
                    </div>
                    <div className="col-span-2 text-center p-2 bg-white dark:bg-gray-900 rounded-lg">
                      <p className="text-2xl font-bold" style={{ color: primary.base }}>
                        {purchases.find(p => p.pricingplan?.currency_symbol)?.pricingplan?.currency_symbol || '$'}
                        {purchases.reduce((sum, p) => sum + ((p.pricingplan?.price || 0) / 100), 0).toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Total Spent</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Details */}
            <div className="lg:col-span-2 space-y-4">
              {/* Account Flags */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  Account Flags
                </h3>
                {isEditing ? (
                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editedData.is_student}
                        onChange={(e) => setEditedData({ ...editedData, is_student: e.target.checked })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Student</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editedData.is_site_creator}
                        onChange={(e) => setEditedData({ ...editedData, is_site_creator: e.target.checked })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Site Creator</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editedData.is_service_provider}
                        onChange={(e) => setEditedData({ ...editedData, is_service_provider: e.target.checked })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Service Provider</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editedData.is_team_member}
                        onChange={(e) => setEditedData({ ...editedData, is_team_member: e.target.checked })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Team Member</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editedData.is_customer}
                        onChange={(e) => setEditedData({ ...editedData, is_customer: e.target.checked })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Customer</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editedData.is_lead}
                        onChange={(e) => setEditedData({ ...editedData, is_lead: e.target.checked })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Lead</span>
                    </label>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {account.is_student && (
                      <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-sm rounded-full">
                        Student
                      </span>
                    )}
                    {account.is_site_creator && (
                      <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-sm rounded-full">
                        Site Creator
                      </span>
                    )}
                    {account.is_service_provider && (
                      <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 text-sm rounded-full">
                        Service Provider
                      </span>
                    )}
                    {account.team?.is_team_member && (
                      <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-sm rounded-full">
                        Team Member
                      </span>
                    )}
                    {account.customer?.is_customer && (
                      <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-sm rounded-full">
                        Customer
                      </span>
                    )}
                    {!account.is_student && !account.is_site_creator && !account.is_service_provider && !account.team?.is_team_member && !account.customer?.is_customer && (
                      <p className="text-sm text-gray-500">No special flags</p>
                    )}
                  </div>
                )}
              </div>

              {/* Team Member Details */}
              {(editedData.is_team_member || account.team?.is_team_member) && (
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <Briefcase className="w-4 h-4" style={{ color: primary.base }} />
                        Team Member Details
                      </h3>
                      <button
                        onClick={handleToggleFeatured}
                        disabled={isEditing}
                        className={`px-2 py-0.5 text-xs font-medium rounded-full flex items-center gap-1 transition-all ${
                          editedData.team_is_featured
                            ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-900/40'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                        title="Toggle featured status"
                      >
                        <Star className={`w-3 h-3 ${editedData.team_is_featured ? 'fill-current' : ''}`} />
                        {editedData.team_is_featured ? 'Featured' : 'Not Featured'}
                      </button>
                    </div>
                    {isEditing && (
                      <button
                        type="button"
                        onClick={() => setShowTeamDetails(!showTeamDetails)}
                        className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                      >
                        {showTeamDetails ? (
                          <>
                            <MinusIcon className="w-3 h-3" />
                            Less
                          </>
                        ) : (
                          <>
                            <PlusIcon className="w-3 h-3" />
                            More
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  {isEditing ? (
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-gray-500 dark:text-gray-400">Job Title</label>
                        <input
                          type="text"
                          value={editedData.team_job_title}
                          onChange={(e) => setEditedData({ ...editedData, team_job_title: e.target.value })}
                          className="w-full mt-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 dark:text-gray-400">Department</label>
                        <input
                          type="text"
                          value={editedData.team_department}
                          onChange={(e) => setEditedData({ ...editedData, team_department: e.target.value })}
                          className="w-full mt-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                      
                      {showTeamDetails && (
                        <>
                          <div>
                            <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Profile Image</label>
                            <div className="flex gap-2">
                              <input
                                type="url"
                                value={editedData.team_image}
                                onChange={(e) => setEditedData({ ...editedData, team_image: e.target.value })}
                                placeholder="https://..."
                                className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  setCurrentImageField('team');
                                  setIsImageGalleryOpen(true);
                                }}
                                className="px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                              >
                                <PhotoIcon className="w-4 h-4" />
                              </button>
                              {editedData.team_image && (
                                <button
                                  type="button"
                                  onClick={() => setEditedData({ ...editedData, team_image: '' })}
                                  className="px-2 py-1 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                                >
                                  <XMarkIcon className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                            {editedData.team_image && (
                              <img
                                src={editedData.team_image}
                                alt="Preview"
                                className="w-16 h-16 rounded-lg object-cover border border-gray-300 dark:border-gray-600 mt-2"
                              />
                            )}
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 dark:text-gray-400">Display Name (Pseudonym)</label>
                            <input
                              type="text"
                              value={editedData.team_pseudonym}
                              onChange={(e) => setEditedData({ ...editedData, team_pseudonym: e.target.value })}
                              placeholder="Optional"
                              className="w-full mt-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 dark:text-gray-400">Description</label>
                            <textarea
                              value={editedData.team_description}
                              onChange={(e) => setEditedData({ ...editedData, team_description: e.target.value })}
                              rows={2}
                              className="w-full mt-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 dark:text-gray-400">Skills (comma-separated)</label>
                            <input
                              type="text"
                              value={editedData.team_skills}
                              onChange={(e) => setEditedData({ ...editedData, team_skills: e.target.value })}
                              placeholder="React, TypeScript, Node.js"
                              className="w-full mt-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 dark:text-gray-400">Bio</label>
                            <textarea
                              value={editedData.team_bio}
                              onChange={(e) => setEditedData({ ...editedData, team_bio: e.target.value })}
                              rows={3}
                              placeholder="Full biography"
                              className="w-full mt-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 dark:text-gray-400">Experience (years)</label>
                            <input
                              type="number"
                              min="0"
                              value={editedData.team_experience_years}
                              onChange={(e) => setEditedData({ ...editedData, team_experience_years: e.target.value })}
                              placeholder="e.g., 5"
                              className="w-full mt-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Social Links</label>
                            <div className="space-y-2">
                              <input
                                type="url"
                                value={editedData.team_linkedin_url}
                                onChange={(e) => setEditedData({ ...editedData, team_linkedin_url: e.target.value })}
                                placeholder="LinkedIn URL"
                                className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              />
                              <input
                                type="url"
                                value={editedData.team_twitter_url}
                                onChange={(e) => setEditedData({ ...editedData, team_twitter_url: e.target.value })}
                                placeholder="Twitter URL"
                                className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              />
                              <input
                                type="url"
                                value={editedData.team_github_url}
                                onChange={(e) => setEditedData({ ...editedData, team_github_url: e.target.value })}
                                placeholder="GitHub URL"
                                className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              />
                              <input
                                type="url"
                                value={editedData.team_portfolio_url}
                                onChange={(e) => setEditedData({ ...editedData, team_portfolio_url: e.target.value })}
                                placeholder="Portfolio URL"
                                className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              />
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {account.team?.image && (
                        <div className="mb-2">
                          <img
                            src={account.team.image}
                            alt={account.full_name || 'Team member'}
                            className="w-16 h-16 rounded-lg object-cover border border-gray-300 dark:border-gray-600"
                          />
                        </div>
                      )}
                      {account.team?.bio && (
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Bio</p>
                          <p className="text-sm text-gray-900 dark:text-white">{account.team.bio}</p>
                        </div>
                      )}
                      {account.team?.experience_years && (
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Experience</p>
                          <p className="text-sm text-gray-900 dark:text-white">{account.team.experience_years} years</p>
                        </div>
                      )}
                      {account.team?.pseudonym && (
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Display Name</p>
                          <p className="text-sm text-gray-900 dark:text-white">{account.team.pseudonym}</p>
                        </div>
                      )}
                      {account.team?.job_title && (
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Job Title</p>
                          <p className="text-sm text-gray-900 dark:text-white">{account.team.job_title}</p>
                        </div>
                      )}
                      {account.team?.department && (
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Department</p>
                          <p className="text-sm text-gray-900 dark:text-white">{account.team.department}</p>
                        </div>
                      )}
                      {account.team?.description && (
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Description</p>
                          <p className="text-sm text-gray-900 dark:text-white">{account.team.description}</p>
                        </div>
                      )}
                      {account.team?.skills && (Array.isArray(account.team.skills) ? account.team.skills.length > 0 : account.team.skills) && (
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Skills</p>
                          <p className="text-sm text-gray-900 dark:text-white">
                            {Array.isArray(account.team.skills) ? account.team.skills.join(', ') : account.team.skills}
                          </p>
                        </div>
                      )}
                      {(account.team?.linkedin_url || account.team?.twitter_url || account.team?.github_url || account.team?.portfolio_url) && (
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Social Links</p>
                          <div className="flex flex-wrap gap-2">
                            {account.team?.linkedin_url && (
                              <a href={account.team.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">LinkedIn</a>
                            )}
                            {account.team?.twitter_url && (
                              <a href={account.team.twitter_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">Twitter</a>
                            )}
                            {account.team?.github_url && (
                              <a href={account.team.github_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">GitHub</a>
                            )}
                            {account.team?.portfolio_url && (
                              <a href={account.team.portfolio_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">Portfolio</a>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Customer Details */}
              {(editedData.is_customer || account.customer?.is_customer) && (
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <Building2 className="w-4 h-4" style={{ color: primary.base }} />
                      Customer Details
                    </h3>
                    {isEditing && (
                      <button
                        type="button"
                        onClick={() => setShowCustomerDetails(!showCustomerDetails)}
                        className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                      >
                        {showCustomerDetails ? (
                          <>
                            <MinusIcon className="w-3 h-3" />
                            Less
                          </>
                        ) : (
                          <>
                            <PlusIcon className="w-3 h-3" />
                            More
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  {isEditing ? (
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-gray-500 dark:text-gray-400">Company</label>
                        <input
                          type="text"
                          value={editedData.customer_company}
                          onChange={(e) => setEditedData({ ...editedData, customer_company: e.target.value })}
                          className="w-full mt-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 dark:text-gray-400">Job Title</label>
                        <input
                          type="text"
                          value={editedData.customer_job_title}
                          onChange={(e) => setEditedData({ ...editedData, customer_job_title: e.target.value })}
                          className="w-full mt-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>

                      {showCustomerDetails && (
                        <>
                          <div>
                            <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Profile Image</label>
                            <div className="flex gap-2">
                              <input
                                type="url"
                                value={editedData.customer_image}
                                onChange={(e) => setEditedData({ ...editedData, customer_image: e.target.value })}
                                placeholder="https://..."
                                className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  setCurrentImageField('customer');
                                  setIsImageGalleryOpen(true);
                                }}
                                className="px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                              >
                                <PhotoIcon className="w-4 h-4" />
                              </button>
                              {editedData.customer_image && (
                                <button
                                  type="button"
                                  onClick={() => setEditedData({ ...editedData, customer_image: '' })}
                                  className="px-2 py-1 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                                >
                                  <XMarkIcon className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                            {editedData.customer_image && (
                              <img
                                src={editedData.customer_image}
                                alt="Preview"
                                className="w-16 h-16 rounded-lg object-cover border border-gray-300 dark:border-gray-600 mt-2"
                              />
                            )}
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 dark:text-gray-400">Rating (1-5)</label>
                            <input
                              type="number"
                              min="1"
                              max="5"
                              step="0.5"
                              value={editedData.customer_rating}
                              onChange={(e) => setEditedData({ ...editedData, customer_rating: e.target.value })}
                              className="w-full mt-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 dark:text-gray-400">Testimonial</label>
                            <textarea
                              value={editedData.customer_testimonial}
                              onChange={(e) => setEditedData({ ...editedData, customer_testimonial: e.target.value })}
                              rows={2}
                              className="w-full mt-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 dark:text-gray-400">Testimonial Date</label>
                            <input
                              type="date"
                              value={editedData.customer_testimonial_date}
                              onChange={(e) => setEditedData({ ...editedData, customer_testimonial_date: e.target.value })}
                              className="w-full mt-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 dark:text-gray-400">Company Logo URL</label>
                            <div className="flex gap-2 mt-1">
                              <input
                                type="url"
                                value={editedData.customer_company_logo}
                                onChange={(e) => setEditedData({ ...editedData, customer_company_logo: e.target.value })}
                                placeholder="https://..."
                                className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  setCurrentImageField('customer');
                                  setIsImageGalleryOpen(true);
                                }}
                                className="px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                              >
                                <PhotoIcon className="w-4 h-4" />
                              </button>
                            </div>
                            {editedData.customer_company_logo && (
                              <img
                                src={editedData.customer_company_logo}
                                alt="Company logo"
                                className="h-12 object-contain border border-gray-300 dark:border-gray-600 rounded p-1 bg-white dark:bg-gray-800 mt-2"
                              />
                            )}
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 dark:text-gray-400">Project Type</label>
                            <input
                              type="text"
                              value={editedData.customer_project_type}
                              onChange={(e) => setEditedData({ ...editedData, customer_project_type: e.target.value })}
                              placeholder="e.g., Website Development"
                              className="w-full mt-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 dark:text-gray-400">LinkedIn URL</label>
                            <input
                              type="url"
                              value={editedData.customer_linkedin_url}
                              onChange={(e) => setEditedData({ ...editedData, customer_linkedin_url: e.target.value })}
                              placeholder="https://linkedin.com/in/..."
                              className="w-full mt-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {account.customer?.image && (
                        <div className="mb-2">
                          <img
                            src={account.customer.image}
                            alt={account.full_name || 'Customer'}
                            className="w-16 h-16 rounded-lg object-cover border border-gray-300 dark:border-gray-600"
                          />
                        </div>
                      )}
                      {account.customer?.company_logo && (
                        <div className="mb-2">
                          <p className="text-xs text-gray-500 dark:text-gray-400">Company Logo</p>
                          <img
                            src={account.customer.company_logo}
                            alt="Company logo"
                            className="h-12 object-contain border border-gray-300 dark:border-gray-600 rounded p-1 bg-white dark:bg-gray-800"
                          />
                        </div>
                      )}
                      {account.customer?.company && (
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Company</p>
                          <p className="text-sm text-gray-900 dark:text-white">{account.customer.company}</p>
                        </div>
                      )}
                      {account.customer?.job_title && (
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Job Title</p>
                          <p className="text-sm text-gray-900 dark:text-white">{account.customer.job_title}</p>
                        </div>
                      )}
                      {account.customer?.rating && (
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Rating</p>
                          <p className="text-sm text-gray-900 dark:text-white">{account.customer.rating} / 5</p>
                        </div>
                      )}
                      {account.customer?.testimonial_text && (
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Testimonial</p>
                          <p className="text-sm text-gray-900 dark:text-white">{account.customer.testimonial_text}</p>
                        </div>
                      )}
                      {account.customer?.testimonial_date && (
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Testimonial Date</p>
                          <p className="text-sm text-gray-900 dark:text-white">
                            {new Date(account.customer.testimonial_date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      )}
                      {account.customer?.project_type && (
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Project Type</p>
                          <p className="text-sm text-gray-900 dark:text-white">{account.customer.project_type}</p>
                        </div>
                      )}
                      {account.customer?.linkedin_url && (
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">LinkedIn</p>
                          <a href={account.customer.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                            {account.customer.linkedin_url}
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* User Reviews Section */}
              {account.id && userReviews.length > 0 && (
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Star className="w-4 h-4" style={{ color: primary.base }} />
                    User Reviews ({userReviews.length})
                  </h3>
                  <div className="space-y-3">
                    {userReviews.map((review) => {
                      const fullStars = Math.floor(review.rating);
                      const hasHalfStar = review.rating % 1 >= 0.5;
                      const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

                      return (
                        <div
                          key={review.id}
                          className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <div className="flex items-center gap-0.5">
                                  {[...Array(fullStars)].map((_, i) => (
                                    <FaStar key={`full-${i}`} className="w-3 h-3" style={{ color: primary.base }} />
                                  ))}
                                  {hasHalfStar && (
                                    <FaStarHalfAlt className="w-3 h-3" style={{ color: primary.base }} />
                                  )}
                                  {[...Array(emptyStars)].map((_, i) => (
                                    <FaRegStar key={`empty-${i}`} className="w-3 h-3" style={{ color: primary.base }} />
                                  ))}
                                </div>
                                <span className="text-xs font-medium text-gray-900 dark:text-white">
                                  {review.rating.toFixed(1)}
                                </span>
                              </div>
                              {review.product_name && (
                                <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                  {review.product_name}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {review.is_approved_by_admin ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                                  <CheckCircle className="w-3 h-3" />
                                  Approved
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400">
                                  <Clock className="w-3 h-3" />
                                  Pending
                                </span>
                              )}
                            </div>
                          </div>
                          {review.comment && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 italic">
                              "{review.comment}"
                            </p>
                          )}
                          <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                            <p className="text-xs text-gray-500 dark:text-gray-500">
                              {new Date(review.submitted_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Purchase History */}
              {account.id && !account.team?.is_team_member && (
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4" style={{ color: primary.base }} />
                    Purchase History ({purchases.length})
                  </h3>
                  
                  {loadingPurchases ? (
                    <div className="text-center py-8">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: primary.base }} />
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Loading purchases...</p>
                    </div>
                  ) : purchases.length === 0 ? (
                    <div className="text-center py-8">
                      <Package className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">No purchases yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {purchases.map((purchase) => (
                        <div
                          key={purchase.id}
                          className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                                {purchase.pricingplan?.product?.product_name || 'Unknown Product'}
                              </h4>
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                {purchase.pricingplan?.package || 'N/A'}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-gray-900 dark:text-white">
                                {purchase.pricingplan?.currency_symbol || '$'}
                                {((purchase.pricingplan?.price || 0) / 100).toFixed(2)}
                              </p>
                              <span
                                className={`inline-block px-2 py-0.5 text-xs rounded-full ${(() => {
                                  const isActive = purchase.is_active && (!purchase.end_date || new Date(purchase.end_date) > new Date());
                                  return isActive
                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400';
                                })()}`}
                              >
                                {(() => {
                                  const isActive = purchase.is_active && (!purchase.end_date || new Date(purchase.end_date) > new Date());
                                  return isActive ? 'Active' : 'Inactive';
                                })()}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(purchase.created_at).toLocaleDateString()}
                            </div>
                            {purchase.transaction_id && (
                              <div className="flex items-center gap-1">
                                <span>ID:</span>
                                <span className="font-mono">{purchase.transaction_id.slice(0, 8)}...</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Lead Details */}
              {(account.customer?.is_lead || isEditing) && editedData.is_lead && (
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                  {isEditing ? (
                    <div className="space-y-3">
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                        Lead Details
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-gray-500 dark:text-gray-400">Lead Status</label>
                          <select
                            value={editedData.lead_status}
                            onChange={(e) => setEditedData({ ...editedData, lead_status: e.target.value })}
                            className="w-full mt-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          >
                            <option value="new">New</option>
                            <option value="contacted">Contacted</option>
                            <option value="qualified">Qualified</option>
                            <option value="converted">Converted</option>
                            <option value="lost">Lost</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 dark:text-gray-400">Lead Source</label>
                          <input
                            type="text"
                            value={editedData.lead_source}
                            onChange={(e) => setEditedData({ ...editedData, lead_source: e.target.value })}
                            placeholder="e.g., Website, Referral"
                            className="w-full mt-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 dark:text-gray-400">Lead Score (0-10)</label>
                          <input
                            type="number"
                            min="0"
                            max="10"
                            value={editedData.lead_score}
                            onChange={(e) => setEditedData({ ...editedData, lead_score: e.target.value })}
                            className="w-full mt-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="text-xs text-gray-500 dark:text-gray-400">Lead Notes</label>
                          <textarea
                            value={editedData.lead_notes}
                            onChange={(e) => setEditedData({ ...editedData, lead_notes: e.target.value })}
                            placeholder="Notes about this lead..."
                            rows={3}
                            className="w-full mt-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-3">
                        Lead Details
                      </h3>
                      {account.customer?.lead_status && (
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
                          <p className="text-sm text-gray-900 dark:text-white capitalize">{account.customer.lead_status}</p>
                        </div>
                      )}
                      {account.customer?.lead_source && (
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Source</p>
                          <p className="text-sm text-gray-900 dark:text-white">{account.customer.lead_source}</p>
                        </div>
                      )}
                      {account.customer?.lead_score !== undefined && (
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Score</p>
                          <p className="text-sm text-gray-900 dark:text-white">{account.customer.lead_score}/10</p>
                        </div>
                      )}
                      {account.customer?.lead_notes && (
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Notes</p>
                          <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">{account.customer.lead_notes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Service Provider Details */}
              {(account.is_service_provider || isEditing) && editedData.is_service_provider && (
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Building2 className="w-4 h-4" style={{ color: primary.base }} />
                    Service Provider Details
                  </h3>
                  {isEditing ? (
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-gray-500 dark:text-gray-400">Service Title</label>
                        <input
                          type="text"
                          value={editedData.service_title}
                          onChange={(e) => setEditedData({ ...editedData, service_title: e.target.value })}
                          className="w-full mt-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 dark:text-gray-400">Hourly Rate ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={editedData.hourly_rate}
                          onChange={(e) => setEditedData({ ...editedData, hourly_rate: e.target.value })}
                          className="w-full mt-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={editedData.is_available_for_booking}
                          onChange={(e) => setEditedData({ ...editedData, is_available_for_booking: e.target.checked })}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Available for Booking</span>
                      </label>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {account.service_title && (
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Service Title</p>
                          <p className="text-sm text-gray-900 dark:text-white">{account.service_title}</p>
                        </div>
                      )}
                      {account.hourly_rate && (
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Hourly Rate</p>
                          <p className="text-sm text-gray-900 dark:text-white">${account.hourly_rate}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Booking Status</p>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {account.is_available_for_booking ? 'Available' : 'Not Available'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          )}

          {/* New CRM Tabs Content */}
          {account?.id && (activeTab === 'appointments' || activeTab === 'support' || activeTab === 'cases' || activeTab === 'activity') && (
            <CRMDataProvider profileId={account.id}>
              {activeTab === 'appointments' && (
                <AppointmentsSection profileId={account.id} />
              )}

              {activeTab === 'support' && (
                <SupportSection profileId={account.id} />
              )}

              {activeTab === 'cases' && (
                <CasesSection profileId={account.id} />
              )}

              {activeTab === 'activity' && (
                <ActivityTimeline profileId={account.id} />
              )}
            </CRMDataProvider>
          )}
        </div>

        {/* Footer - Fixed with minimal height */}
        <div className="mt-auto px-6 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between gap-4">
          {isEditing ? (
            <>
              <div className="flex-1" />
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditedData({});
                  }}
                  className="px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity text-sm"
                  style={{
                    backgroundColor: '#f3f4f6',
                    color: primary.base,
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-lg text-white font-medium hover:opacity-90 transition-opacity text-sm disabled:opacity-50"
                  style={{
                    background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`,
                  }}
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  if (isLastAdmin) return;
                  setShowDeleteConfirm(true);
                }}
                disabled={isLastAdmin}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-opacity text-sm ${
                  isLastAdmin
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:opacity-90'
                }`}
                style={{
                  backgroundColor: isLastAdmin ? '#f3f4f6' : '#fee2e2',
                  color: isLastAdmin ? '#9ca3af' : '#dc2626',
                }}
                title={isLastAdmin ? 'This is the last admin/superadmin and cannot be deleted.' : 'Delete account'}
              >
                <Trash2 className="w-4 h-4" />
                {isLastAdmin ? 'Protected' : 'Delete'}
              </button>
              
              <div className="flex-1 text-center text-xs text-gray-500 dark:text-gray-400 hidden md:block">
                Member since {new Date(account.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
              
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 rounded-lg flex items-center gap-2 text-white font-medium hover:opacity-90 transition-opacity text-sm"
                style={{
                  background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`,
                }}
              >
                <Edit2 className="w-4 h-4" />
                <span>Edit Profile</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Image Gallery Modal */}
      {isImageGalleryOpen && (
        <ImageGalleryModal
          isOpen={isImageGalleryOpen}
          onClose={() => setIsImageGalleryOpen(false)}
          onSelectImage={(imageUrl) => {
            if (currentImageField === 'team') {
              setEditedData({ ...editedData, team_image: imageUrl });
            } else if (currentImageField === 'customer') {
              setEditedData({ ...editedData, customer_image: imageUrl });
            }
            setIsImageGalleryOpen(false);
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div 
          className="absolute inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm flex items-center justify-center z-10 rounded-2xl pointer-events-auto"
          onClick={(e) => {
            // Only close if clicking the backdrop, not the dialog content
            if (e.target === e.currentTarget) {
              setShowDeleteConfirm(false);
            }
          }}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-w-md mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Delete Account
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Are you sure you want to delete <strong>{account?.full_name || account?.email}</strong>? 
                  This action cannot be undone and will permanently remove all account data.
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting || isLastAdmin}
                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLastAdmin ? 'Protected (Last Admin)' : (isDeleting ? 'Deleting...' : 'Delete')}
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isDeleting}
                    className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                </div>
                {isLastAdmin && (
                  <p className="mt-3 text-xs text-red-600 dark:text-red-400">
                    This account is the last admin/superadmin in the organization and cannot be removed.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
