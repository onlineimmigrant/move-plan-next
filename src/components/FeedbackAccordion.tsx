'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { v4 as uuidv4 } from 'uuid';
import FeedbackForm from './FeedbackForm';

// Interfaces
interface User {
  first_name: string;
  last_name: string;
}

interface Product {
  slug: string;
  name: string;
}

interface Feedback {
  id: string;
  rating: number;
  comment: string;
  submitted_at: string;
  is_visible_to_user: boolean;
  is_approved_by_admin: boolean;
  user: User;
  product?: Product;
}

interface FeedbackAccordionProps {
  type: 'product' | 'all_products';
  slug?: string;
  pageSize?: number;
}

// Star SVG Component (for display)
const Star: React.FC<{
  filled: boolean;
  half?: boolean;
  decimalPart?: number;
  size?: string;
  id?: string;
}> = ({ filled, half = false, decimalPart = 0, size = "5", id }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    className={`w-${size} h-${size} ${filled ? "text-teal-600" : "text-gray-300"} transition-transform duration-200 hover:scale-110`}
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth="2"
  >
    {half ? (
      <>
        <defs>
          <clipPath id={`half-${id}`}>
            <rect x="0" y="0" width={`${decimalPart * 100}%`} height="100%" />
          </clipPath>
        </defs>
        <path
          d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
          clipPath={`url(#half-${id})`}
        />
        <path
          d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
      </>
    ) : (
      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
    )}
  </svg>
);

// Render Stars Function (for display)
const renderStars = (rating: number, isHeader = false) => {
  const fullStars = Math.floor(rating);
  const decimalPart = rating - fullStars;
  const size = "5";

  return (
    <div className="flex space-x-1">
      {Array.from({ length: 5 }, (_, index) => {
        const uniqueId = uuidv4();

        if (index < fullStars) {
          return <Star key={index} filled={true} size={size} />;
        } else if (index === fullStars && decimalPart > 0) {
          return (
            <Star
              key={index}
              filled={true}
              half={true}
              decimalPart={decimalPart}
              size={size}
              id={uniqueId}
            />
          );
        } else {
          return <Star key={index} filled={false} size={size} />;
        }
      })}
    </div>
  );
};

// FeedbackAccordion Component
const FeedbackAccordion: React.FC<FeedbackAccordionProps> = ({ type, slug, pageSize = 10 }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [overallAvgRating, setOverallAvgRating] = useState<number | null>(null);
  const [totalApprovedFeedbacks, setTotalApprovedFeedbacks] = useState(0);
  const [displayedFeedbacks, setDisplayedFeedbacks] = useState(pageSize);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [productId, setProductId] = useState<number | null>(null);
  const [contentHeight, setContentHeight] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchFeedbacks();
  }, [type, slug]);

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [feedbacks, isOpen]);

  const fetchFeedbacks = async (loadMore = false) => {
    if (loadMore) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      let productIdToUse = productId;
      if (type === 'product' && slug && !productIdToUse) {
        const { data: product, error: productError } = await supabase
          .from('product')
          .select('id')
          .eq('slug', slug)
          .single();
        if (productError || !product) throw new Error('Error fetching product or not found');
        setProductId(product.id);
        productIdToUse = product.id;
      }

      const { data: { user } } = await supabase.auth.getUser();

      let countQuery = supabase
        .from('feedback_feedbackproducts')
        .select('*', { count: 'exact', head: true })
        .eq('is_approved_by_admin', true);

      if (type === 'product' && productIdToUse) {
        countQuery = countQuery.eq('product_id', productIdToUse);
      }

      const { count, error: countError } = await countQuery;
      if (countError) throw countError;
      setTotalApprovedFeedbacks(count || 0);

      if (count === 0 && !user) {
        setFeedbacks([]);
        setOverallAvgRating(null);
        return;
      }

      let avgQuery = supabase
        .from('feedback_feedbackproducts')
        .select('rating')
        .eq('is_approved_by_admin', true);

      if (type === 'product' && productIdToUse) {
        avgQuery = avgQuery.eq('product_id', productIdToUse);
      }

      const { data: allFeedbackData, error: allFeedbackError } = await avgQuery;
      if (allFeedbackError) throw allFeedbackError;

      const totalRating = allFeedbackData.reduce((sum, fb) => sum + fb.rating, 0);
      const avgRating = allFeedbackData.length ? totalRating / allFeedbackData.length : null;
      setOverallAvgRating(avgRating);

      const start = loadMore ? feedbacks.length : 0;
      const end = start + pageSize - 1;

      let feedbackQuery = supabase
        .from('feedback_feedbackproducts')
        .select('id, rating, comment, submitted_at, is_visible_to_user, is_approved_by_admin, user_id, user_name, user_surname, product_id')
        .order('submitted_at', { ascending: false })
        .range(start, end);

      if (type === 'product' && productIdToUse) {
        feedbackQuery = feedbackQuery.eq('product_id', productIdToUse);
      }

      if (user) {
        feedbackQuery = feedbackQuery.or(
          `is_approved_by_admin.eq.true,and(is_visible_to_user.eq.true,user_id.eq.${user.id})`
        );
      } else {
        feedbackQuery = feedbackQuery.eq('is_approved_by_admin', true);
      }

      const { data: feedbackData, error: feedbackError } = await feedbackQuery;
      if (feedbackError) throw feedbackError;

      if (!feedbackData || feedbackData.length === 0) {
        if (!loadMore) setFeedbacks([]);
        return;
      }

      const productIds = [...new Set(feedbackData.map(fb => fb.product_id))];
      const { data: productsData, error: productsError } = await supabase
        .from('product')
        .select('id, slug, product_name')
        .in('id', productIds);

      if (productsError) throw productsError;

      const productMap = new Map(
        (productsData || []).map(product => [product.id, { slug: product.slug, name: product.product_name }])
      );

      const newFeedbacks: Feedback[] = feedbackData.map(fb => ({
        id: fb.id.toString(),
        rating: fb.rating,
        comment: fb.comment,
        submitted_at: fb.submitted_at,
        is_visible_to_user: fb.is_visible_to_user,
        is_approved_by_admin: fb.is_approved_by_admin,
        user: {
          first_name: fb.user_name,
          last_name: fb.user_surname,
        },
        product: productMap.get(fb.product_id),
      }));

      setFeedbacks(prev => (loadMore ? [...prev, ...newFeedbacks] : newFeedbacks));
    } catch (error: any) {
      console.error('Error fetching feedbacks:', error);
      setError('Failed to load feedback. Please try again.');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const loadMoreFeedbacks = () => {
    setDisplayedFeedbacks(prev => prev + pageSize);
    fetchFeedbacks(true);
  };

  const toggleAccordion = () => setIsOpen(!isOpen);
  const toggleForm = () => setShowForm(!showForm);

  const handleFormSubmit = () => {
    fetchFeedbacks();
    setShowForm(false);
  };

  if (isLoading) return <p className="text-center text-gray-500 py-12">Loading feedback...</p>;
  if (error) return <p className="text-center text-red-500 py-12">{error}</p>;

  return (
    <section className="py-8 bg-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-0">
        <div className="bg-white rounded-lg shadow-sm">
          <button
            onClick={toggleAccordion}
            className="w-full text-left py-4 px-4 sm:px-6 flex justify-between items-center text-gray-900 hover:bg-gray-50 focus:outline-none focus:ring-2 border-2 border-teal-600 focus:ring-teal-600 transition-colors duration-300 ease-in-out"
            aria-expanded={isOpen}
            aria-controls="feedback-content"
          >
            <div className="flex items-center space-x-1 sm:space-x-4">
              {overallAvgRating ? (
                <div className="flex items-center space-x-1 sm:space-x-4">
                  <span className="text-xl sm:text-3xl font-bold">{overallAvgRating.toFixed(1)}</span>
                  <div className="flex items-center">
                    <div className="ml-2 block sm:hidden">
                      <Star filled={true} size="5" />
                    </div>
                    <div className="ml-2 hidden sm:flex sm:space-x-2">
                      {renderStars(overallAvgRating, true)}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-base sm:text-lg text-gray-500"></p>
              )}
              <span className="ml-2 text-base sm:text-xl font-semibold">Customer Reviews</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="hidden sm:flex text-base sm:text-lg text-gray-600">
                {totalApprovedFeedbacks} {totalApprovedFeedbacks === 1 ? 'review' : 'reviews'}
              </span>
              <ChevronDownIcon
                className={`h-5 w-5 sm:h-6 sm:w-6 text-gray-500 transform transition-transform duration-300 ease-in-out ${
                  isOpen ? 'rotate-180' : ''
                }`}
              />
            </div>
          </button>

          <div
            ref={contentRef}
            id="feedback-content"
            className={`px-4 sm:px-6 py-6 sm:py-8 transition-all duration-300 ease-in-out ${
              isOpen ? 'block' : 'hidden max-h-0 overflow-hidden'
            }`}
            style={{
              maxHeight: isOpen ? `${contentHeight}px` : '0px',
            }}
          >
            {/* Write Review Button: Visible only for type='product' */}
            {type === 'product' && (
              <div className="mb-6 text-center">
                <button
                  onClick={toggleForm}
                  className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 focus:ring-2 focus:ring-teal-600 transition-colors duration-200"
                  aria-label="Open review form modal"
                >
                  Write Review
                </button>
              </div>
            )}

            {/* Feedback Form Modal */}
            <FeedbackForm
              productId={type === 'product' ? productId : null}
              onSubmit={handleFormSubmit}
              isOpen={showForm}
              onClose={toggleForm}
            />

            {feedbacks.length === 0 ? (
              <p className="text-center text-gray-500 py-6">No reviews available.</p>
            ) : (
              <>
                <div className="space-y-6 sm:space-y-8">
                  {feedbacks.map(comment => (
                    <div key={comment.id} className="border-b border-gray-200 pb-6 sm:pb-8">
                      {comment.product && (
                        <p className="text-sm text-teal-500 underline mb-3">
                          <Link href={`/products/${comment.product.slug}`} className="hover:text-teal-700">
                            {comment.product.name}
                          </Link>
                        </p>
                      )}
                      <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-1">{renderStars(comment.rating)}</div>
                        <div className="text-sm text-gray-500">
                          {new Date(comment.submitted_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </div>
                      </div>
                      <p className="mt-3 text-base sm:text-lg text-gray-900 leading-relaxed">{comment.comment}</p>
                      <div className="mt-2 text-sm font-semibold text-gray-600">
                        {comment.user.first_name} {comment.user.last_name}
                      </div>
                    </div>
                  ))}
                </div>

                {feedbacks.length < totalApprovedFeedbacks && (
                  <div className="mt-8 mb-8 text-center">
                    <button
                      onClick={loadMoreFeedbacks}
                      disabled={isLoadingMore}
                      className={`text-teal-500 hover:text-teal-700 focus:ring-2 focus:ring-teal-600 text-sm font-medium flex items-center justify-center mx-auto ${
                        isLoadingMore ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {isLoadingMore ? (
                        <span className="flex items-center">
                          <svg
                            className="animate-spin h-5 w-5 mr-2 text-teal-500"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                          </svg>
                          Loading...
                        </span>
                      ) : (
                        <span className="mb-8">Load more ...</span>
                      )}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeedbackAccordion;