/**
 * ReviewsView Component
 *
 * Displays and manages customer reviews
 * Part of the CRM modal - Reviews tab
 */

'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Review } from '../types';
import { Star, CheckCircle, Clock, Trash2, ChevronDown } from 'lucide-react';
import { useCrm } from '../context/CrmContext';
import { FilterPanel } from './shared';

interface ReviewsViewProps {
  organizationId?: string;
  primary?: { base: string; hover: string };
  searchQuery?: string;
}

export default function ReviewsView({ organizationId, primary: propPrimary, searchQuery = '' }: ReviewsViewProps) {
  const { showToast, primary, refreshTrigger } = useCrm();
  const effectivePrimary = propPrimary || primary;
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [approvalFilter, setApprovalFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'rating'>('date');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [hoveredFilter, setHoveredFilter] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
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

      // Build query with all filters
      let query = supabase
        .from('feedback_feedbackproducts')
        .select('*')
        .eq('organization_id', orgId);

      // Apply filters if needed
      if (approvalFilter === 'approved') {
        query = query.eq('is_approved_by_admin', true);
      } else if (approvalFilter === 'pending') {
        query = query.eq('is_approved_by_admin', false);
      }
      
      if (ratingFilter !== 'all') {
        const minRating = parseInt(ratingFilter);
        query = query.gte('rating', minRating);
      }

      // Sort by date (descending)
      query = query.order('submitted_at', { ascending: false });

      const { data: reviews, error } = await query;

      if (error) throw error;

      setReviews(reviews || []);
    } catch (error) {
      showToast('Error fetching reviews', 'error');
    } finally {
      setLoading(false);
    }
  }, [organizationId, ratingFilter, approvalFilter, showToast]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews, refreshTrigger]);

  // Pre-calculate filter counts (single-pass)
  const reviewCounts = useMemo(() => {
    return reviews.reduce(
      (counts, review) => {
        counts.all++;
        if (review.rating === 5) counts.rating5++;
        if (review.rating >= 4) counts.rating4Plus++;
        if (review.rating >= 3) counts.rating3Plus++;
        if (review.is_approved_by_admin) counts.approved++;
        else counts.pending++;
        return counts;
      },
      { all: 0, rating5: 0, rating4Plus: 0, rating3Plus: 0, approved: 0, pending: 0 }
    );
  }, [reviews]);

  const filteredReviews = useMemo(() => {
    const q = searchQuery.toLowerCase();
    const hasSearch = searchQuery.length > 0;
    const minRating = ratingFilter !== 'all' ? parseInt(ratingFilter) : 0;

    // Single-pass filter with early returns
    const filtered = reviews.filter(review => {
      // Search filter
      if (hasSearch) {
        const matchesSearch =
          review.user_name?.toLowerCase().includes(q) ||
          review.user_surname?.toLowerCase().includes(q) ||
          review.product_name?.toLowerCase().includes(q) ||
          review.comment?.toLowerCase().includes(q);
        if (!matchesSearch) return false;
      }

      // Approval filter
      if (approvalFilter === 'approved' && !review.is_approved_by_admin) return false;
      if (approvalFilter === 'pending' && review.is_approved_by_admin) return false;

      // Rating filter
      if (minRating > 0 && review.rating < minRating) return false;

      return true;
    });

    // Sort
    return filtered.sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime();
      }
      if (sortBy === 'rating') {
        return b.rating - a.rating;
      }
      return 0;
    });
  }, [reviews, searchQuery, approvalFilter, ratingFilter, sortBy]);

  const handleApproveReview = useCallback(async (reviewId: number) => {
    try {
      const { supabase } = await import('@/lib/supabaseClient');
      
      const { error } = await supabase
        .from('feedback_feedbackproducts')
        .update({ is_approved_by_admin: true, approved_at: new Date().toISOString() })
        .eq('id', reviewId);

      if (error) throw error;
      
      showToast('Review approved successfully', 'success');
      fetchReviews();
    } catch (error) {
      showToast('Error approving review', 'error');
    }
  }, [showToast, fetchReviews]);

  const handleRejectReview = useCallback(async (reviewId: number) => {
    try {
      const { supabase } = await import('@/lib/supabaseClient');
      
      const { error } = await supabase
        .from('feedback_feedbackproducts')
        .update({ is_approved_by_admin: false })
        .eq('id', reviewId);

      if (error) throw error;
      
      showToast('Review rejected', 'success');
      fetchReviews();
    } catch (error) {
      showToast('Error rejecting review', 'error');
    }
  }, [showToast, fetchReviews]);

  const handleDeleteReview = useCallback(async (reviewId: number) => {
    if (!confirm('Are you sure you want to delete this review?')) return;
    
    try {
      const { supabase } = await import('@/lib/supabaseClient');
      
      const { error } = await supabase
        .from('feedback_feedbackproducts')
        .delete()
        .eq('id', reviewId);

      if (error) throw error;
      
      showToast('Review deleted successfully', 'success');
      fetchReviews();
    } catch (error) {
      showToast('Error deleting review', 'error');
    }
  }, [showToast, fetchReviews]);

  const getInitials = useCallback((firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return '?';
    const f = firstName?.[0] || '';
    const l = lastName?.[0] || '';
    return (f + l).toUpperCase() || '?';
  }, []);

  const handleRatingFilterChange = useCallback((value: string) => {
    setRatingFilter(value);
  }, []);

  const handleApprovalFilterChange = useCallback((value: string) => {
    setApprovalFilter(value);
  }, []);

  const handleSortChange = useCallback((value: string) => {
    setSortBy(value as 'date' | 'rating');
  }, []);

  const filterGroups = useMemo(() => [
    {
      id: 'rating',
      label: 'Rating',
      value: ratingFilter,
      options: [
        { value: 'all', label: 'All Ratings', count: reviewCounts.all },
        { value: '5', label: '5 Stars', count: reviewCounts.rating5 },
        { value: '4', label: '4+ Stars', count: reviewCounts.rating4Plus },
        { value: '3', label: '3+ Stars', count: reviewCounts.rating3Plus },
      ],
      onChange: handleRatingFilterChange,
    },
    {
      id: 'approval',
      label: 'Status',
      value: approvalFilter,
      options: [
        { value: 'all', label: 'All Reviews', count: reviewCounts.all },
        { value: 'approved', label: 'Approved', count: reviewCounts.approved },
        { value: 'pending', label: 'Pending', count: reviewCounts.pending },
      ],
      onChange: handleApprovalFilterChange,
    },
    {
      id: 'sort',
      label: 'Sort By',
      value: sortBy,
      options: [
        { value: 'date', label: 'Date' },
        { value: 'rating', label: 'Rating' },
      ],
      onChange: handleSortChange,
    },
  ], [ratingFilter, approvalFilter, sortBy, reviewCounts, handleRatingFilterChange, handleApprovalFilterChange, handleSortChange]);

  const handleToggleFilter = useCallback(() => {
    setIsFilterOpen(prev => !prev);
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Reviews Grid */}
      <div className="flex-1 px-6 pt-6 pb-24 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Star className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-pulse" />
              <p className="text-gray-600 dark:text-gray-400">Loading reviews...</p>
            </div>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Star className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {searchQuery ? 'No reviews found' : 'No reviews yet'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {searchQuery ? 'Try adjusting your search terms' : 'Customer reviews will appear here'}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredReviews.map((review) => (
              <div
                key={review.id}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg transition-all"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0"
                      style={{
                        background: effectivePrimary ? `linear-gradient(135deg, ${effectivePrimary.base}, ${effectivePrimary.hover})` : '#6b7280',
                      }}
                    >
                      {getInitials(review.user_name ?? undefined, review.user_surname ?? undefined)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {review.user_name} {review.user_surname}
                      </h3>
                      <div className="relative inline-block">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const btn = e.currentTarget;
                            const menu = btn.nextElementSibling as HTMLElement;
                            if (menu) {
                              menu.classList.toggle('hidden');
                            }
                          }}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity ${
                            review.is_approved_by_admin
                              ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                              : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                          }`}
                        >
                          {review.is_approved_by_admin ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          {review.is_approved_by_admin ? 'Approved' : 'Pending'}
                          <ChevronDown className="w-3 h-3 ml-0.5" />
                        </button>
                        <div className="hidden absolute left-0 mt-1 w-32 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleApproveReview(review.id);
                              (e.currentTarget.parentElement as HTMLElement).classList.add('hidden');
                            }}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-green-700 dark:text-green-300 rounded-t-lg"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Approved
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRejectReview(review.id);
                              (e.currentTarget.parentElement as HTMLElement).classList.add('hidden');
                            }}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-yellow-700 dark:text-yellow-300 rounded-b-lg"
                          >
                            <Clock className="w-4 h-4" />
                            Pending
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {!review.is_approved_by_admin && primary && (
                    <button
                      onClick={() => handleDeleteReview(review.id)}
                      className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Delete review"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Rating and Product */}
                <div className="mb-3">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {review.rating}/5
                    </span>
                  </div>
                  {review.product_name && (
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Product: {review.product_name}
                    </p>
                  )}
                </div>

                {/* Comment */}
                {review.comment && (
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 p-3 bg-gray-50 dark:bg-gray-900 rounded">
                    {review.comment}
                  </p>
                )}

                {/* Date */}
                <p className="text-xs text-gray-500 dark:text-gray-500 mb-3">
                  Submitted {new Date(review.submitted_at).toLocaleDateString()}
                </p>

                {/* Admin Notes */}
                {review.admin_notes && (
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded mb-3">
                    <p className="text-xs text-blue-900 dark:text-blue-300">
                      <strong>Admin Notes:</strong> {review.admin_notes}
                    </p>
                  </div>
                )}

                {/* Status changed via badge dropdown above */}

                {/* Approval Info */}
                {review.is_approved_by_admin && review.approved_at && (
                  <p className="text-xs text-green-600 dark:text-green-400">
                    Approved {new Date(review.approved_at).toLocaleDateString()}
                    {review.approved_by && ` by ${review.approved_by}`}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fixed Bottom Panel */}
      <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-6 py-4 rounded-b-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <FilterPanel
          filters={filterGroups}
          isOpen={isFilterOpen}
          onToggle={handleToggleFilter}
          hoveredFilter={hoveredFilter}
          onHoverFilter={setHoveredFilter}
          primaryColor={effectivePrimary?.base}
          primaryHover={effectivePrimary?.hover}
        />
        </div>
      </div>
    </div>
  );
}
