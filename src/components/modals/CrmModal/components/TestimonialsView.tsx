/**
 * TestimonialsView Component
 *
 * Displays and manages testimonials
 * Part of the CRM modal - Testimonials tab
 */

'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Profile } from '../types';
import { MessageSquare, CheckCircle, Clock, XCircle, Star, ChevronDown } from 'lucide-react';
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';
import Image from 'next/image';
import { AccountDetailModal } from './AccountDetailModal';
import { useCrm } from '../context/CrmContext';
import { FilterPanel, FilterGroup } from './shared';


interface TestimonialsViewProps {
  organizationId?: string;
  primary?: { base: string; hover: string };
  searchQuery?: string;
}

export default function TestimonialsView({ organizationId, primary, searchQuery = '' }: TestimonialsViewProps) {
  const { showToast, primary: ctxPrimary, refreshTrigger } = useCrm();
  const effectivePrimary = primary || ctxPrimary;
  const [testimonials, setTestimonials] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'rating'>('name');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [hoveredFilter, setHoveredFilter] = useState<string | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTestimonial, setSelectedTestimonial] = useState<Profile | null>(null);

  const loadTestimonials = useCallback(async () => {
    setLoading(true);
    try {
      const { supabase } = await import('@/lib/supabaseClient');
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        setLoading(false);
        return;
      }

      // Get organization ID
      let orgId = organizationId;
      if (!orgId) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('organization_id')
          .eq('id', user.id)
          .single();
        
        if (!profile?.organization_id) {
          showToast('No organization found', 'error');
          setLoading(false);
          return;
        }
        orgId = profile.organization_id;
      }

      // Direct query for testimonials
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, email, city, postal_code, country, created_at, organization_id, customer')
        .eq('organization_id', orgId)
        .not('customer->>testimonial_text', 'is', null)
        .order('full_name');

      if (error) throw error;

      // Filter for non-empty testimonial text
      const filtered = (data || []).filter(p => 
        p.customer?.testimonial_text && p.customer.testimonial_text.trim() !== ''
      );

      setTestimonials(filtered);
    } catch (error) {
      console.error('Error loading testimonials:', error);
      showToast('Failed to load testimonials', 'error');
    } finally {
      setLoading(false);
    }
  }, [organizationId, showToast]);

  useEffect(() => {
    loadTestimonials();
  }, [loadTestimonials, refreshTrigger]);

  // Pre-calculate filter counts (single-pass)
  const testimonialCounts = useMemo(() => {
    return testimonials.reduce(
      (counts, t) => {
        counts.all++;
        const status = t.customer?.testimonial_status || 'draft';
        if (status === 'approved' || status === 'published') counts.approved++;
        else if (status === 'submitted') counts.pending++;
        else counts.pending++; // draft also counts as pending
        return counts;
      },
      { all: 0, approved: 0, pending: 0 }
    );
  }, [testimonials]);

  const filteredTestimonials = useMemo(() => {
    const q = searchQuery.toLowerCase();
    const hasSearch = searchQuery.length > 0;

    // Single-pass filter with early returns
    const filtered = testimonials.filter(t => {
      // Search filter
      if (hasSearch) {
        const matchesSearch =
          t.full_name?.toLowerCase().includes(q) ||
          t.email?.toLowerCase().includes(q) ||
          t.customer?.testimonial_text?.toLowerCase().includes(q);
        if (!matchesSearch) return false;
      }

      // Status filter
      if (statusFilter !== 'all') {
        const status = t.customer?.testimonial_status || 'pending';
        if (status !== statusFilter) return false;
      }

      return true;
    });

    // Sort
    return filtered.sort((a, b) => {
      if (sortBy === 'name') {
        return (a.full_name || '').localeCompare(b.full_name || '');
      } else if (sortBy === 'date') {
        const dateA = a.customer?.testimonial_approved_at || a.created_at;
        const dateB = b.customer?.testimonial_approved_at || b.created_at;
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      } else if (sortBy === 'rating') {
        return (b.customer?.rating || 0) - (a.customer?.rating || 0);
      }
      return 0;
    });
  }, [testimonials, searchQuery, statusFilter, sortBy]);

  const handleUpdateStatus = useCallback(async (profileId: string, status: string) => {
    try {
      const { supabase } = await import('@/lib/supabaseClient');
      
      const profile = testimonials.find(t => t.id === profileId);
      if (!profile) {
        showToast('Profile not found', 'error');
        return;
      }

      // Direct Supabase update
      const { error } = await supabase
        .from('profiles')
        .update({
          customer: {
            ...profile.customer,
            testimonial_status: status,
            testimonial_approved_at: status === 'approved' ? new Date().toISOString() : null,
            testimonial_approved_by: status === 'approved' ? 'admin' : null,
          },
        })
        .eq('id', profileId);

      if (error) throw error;
      
      showToast(`Testimonial ${status} successfully`, 'success');
      loadTestimonials();
    } catch (error) {
      console.error('Error updating testimonial:', error);
      showToast('Failed to update testimonial', 'error');
    }
  }, [testimonials, showToast, loadTestimonials]);

  const getStatusIcon = useCallback((status?: string) => {
    switch (status) {
      case 'approved':
      case 'published': return <CheckCircle className="w-4 h-4" />;
      case 'submitted': return <Clock className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />; // draft
    }
  }, []);

  const getStatusColor = useCallback((status?: string) => {
    switch (status) {
      case 'approved':
      case 'published': return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      case 'submitted': return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      default: return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'; // draft
    }
  }, []);

  const getInitials = useCallback((name?: string | null) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }, []);

  const handleStatusFilterChange = useCallback((value: string) => {
    setStatusFilter(value);
  }, []);

  const handleSortChange = useCallback((value: string) => {
    setSortBy(value as 'name' | 'date' | 'rating');
  }, []);

  const filterGroups = useMemo(() => [
    {
      id: 'status',
      label: 'Status',
      value: statusFilter,
      options: [
        { value: 'all', label: 'All Statuses', count: testimonialCounts.all },
        { value: 'approved', label: 'Approved', count: testimonialCounts.approved },
        { value: 'pending', label: 'Pending', count: testimonialCounts.pending },
      ],
      onChange: handleStatusFilterChange,
    },
    {
      id: 'sort',
      label: 'Sort By',
      value: sortBy,
      options: [
        { value: 'name', label: 'Name' },
        { value: 'date', label: 'Date' },
        { value: 'rating', label: 'Rating' },
      ],
      onChange: handleSortChange,
    },
  ], [statusFilter, sortBy, testimonialCounts, handleStatusFilterChange, handleSortChange]);

  const handleToggleFilter = useCallback(() => {
    setIsFilterOpen(prev => !prev);
  }, []);

  const handleTestimonialClick = useCallback((testimonial: Profile) => {
    setSelectedTestimonial(testimonial);
    setShowDetailModal(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowDetailModal(false);
    setSelectedTestimonial(null);
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Testimonials Grid */}
      <div className="flex-1 px-6 pt-6 pb-24 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-pulse" />
              <p className="text-gray-600 dark:text-gray-400">Loading testimonials...</p>
            </div>
          </div>
        ) : filteredTestimonials.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {searchQuery ? 'No testimonials found' : 'No testimonials yet'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {searchQuery ? 'Try adjusting your search terms' : 'Testimonials from customers will appear here'}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredTestimonials.map((testimonial) => {
              const customer = testimonial.customer;
              const avatarImage = customer?.image;
              const rating = customer?.rating || 5;
              const testimonialDate = customer?.testimonial_approved_at || testimonial.created_at;

              return (
                <div
                  key={testimonial.id}
                  className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl transition-all flex flex-col cursor-pointer"
                  onClick={() => handleTestimonialClick(testimonial)}
                >
                  {/* Status Badge and Rating */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex gap-1 text-yellow-400">
                      {[...Array(Math.floor(rating))].map((_, i) => (
                        <FaStar key={`full-${testimonial.id}-${i}`} size={16} />
                      ))}
                      {rating % 1 >= 0.5 && <FaStarHalfAlt key={`half-${testimonial.id}`} size={16} />}
                      {[...Array(5 - Math.floor(rating) - (rating % 1 >= 0.5 ? 1 : 0))].map((_, i) => (
                        <FaRegStar key={`empty-${testimonial.id}-${i}`} size={16} />
                      ))}
                    </div>

                    {/* Status Dropdown */}
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const btn = e.currentTarget;
                          const menu = btn.nextElementSibling as HTMLElement;
                          if (menu) {
                            menu.classList.toggle('hidden');
                          }
                        }}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity ${getStatusColor(testimonial.customer?.testimonial_status)}`}
                      >
                        {getStatusIcon(testimonial.customer?.testimonial_status)}
                        {testimonial.customer?.testimonial_status || 'pending'}
                        <ChevronDown className="w-3 h-3 ml-0.5" />
                      </button>
                      <div className="hidden absolute right-0 mt-1 w-32 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpdateStatus(testimonial.id, 'approved');
                            (e.currentTarget.parentElement as HTMLElement).classList.add('hidden');
                          }}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-green-700 dark:text-green-300"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Approved
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpdateStatus(testimonial.id, 'pending');
                            (e.currentTarget.parentElement as HTMLElement).classList.add('hidden');
                          }}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-yellow-700 dark:text-yellow-300"
                        >
                          <Clock className="w-4 h-4" />
                          Pending
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpdateStatus(testimonial.id, 'draft');
                            (e.currentTarget.parentElement as HTMLElement).classList.add('hidden');
                          }}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-gray-700 dark:text-gray-300 rounded-b-lg"
                        >
                          <XCircle className="w-4 h-4" />
                          Draft
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Testimonial Text */}
                  <div className="flex-grow mb-6">
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed italic">
                      "{customer?.testimonial_text}"
                    </p>
                  </div>

                  {/* Customer Info */}
                  <div className="flex items-center gap-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                    {/* Avatar */}
                    {avatarImage ? (
                      <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border-2 border-gray-200 dark:border-gray-600">
                        <Image
                          src={avatarImage}
                          alt={testimonial.full_name || 'User'}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      </div>
                    ) : (
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 text-sm"
                        style={{
                          background: effectivePrimary ? `linear-gradient(135deg, ${effectivePrimary.base}, ${effectivePrimary.hover})` : '#6b7280',
                        }}
                      >
                        {getInitials(testimonial.full_name)}
                      </div>
                    )}

                    {/* Name and Details */}
                    <div className="flex-grow min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white truncate">
                        {testimonial.full_name || testimonial.email}
                      </p>
                      {(customer?.job_title || customer?.company) && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                          {[customer?.job_title, customer?.company]
                            .filter(Boolean)
                            .join(' at ')}
                        </p>
                      )}
                      {testimonialDate && (
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          {new Date(testimonialDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Fixed Bottom Panel with Filter */}
      <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-6 py-4 rounded-b-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Filters Button */}
          <div className="relative w-full sm:w-auto">
            <FilterPanel
              filters={filterGroups}
              isOpen={isFilterOpen}
              onToggle={handleToggleFilter}
              hoveredFilter={hoveredFilter}
              onHoverFilter={setHoveredFilter}
              primaryColor={effectivePrimary.base}
              primaryHover={effectivePrimary.hover}
            />
          </div>
        </div>
      </div>

      {/* Account Detail Modal */}
      <AccountDetailModal
        isOpen={showDetailModal}
        account={selectedTestimonial}
        onClose={handleCloseModal}
        onUpdate={loadTestimonials}
      />
    </div>
  );
}