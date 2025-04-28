'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

// TypeScript Interfaces
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
  is_approved_by_admin: boolean;
  user: User;
  product?: Product;
}

interface FeedbackAccordionProps {
  type: 'product' | 'all_products' | 'about-us';
  slug?: string;
}

const FeedbackAccordion: React.FC<FeedbackAccordionProps> = ({ type, slug }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [overallAvgRating, setOverallAvgRating] = useState<number | null>(null);
  const [totalApprovedFeedbacks, setTotalApprovedFeedbacks] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFeedbacks();
  }, [type, slug]);

  const fetchFeedbacks = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch feedbacks
      let feedbackQuery = supabase
        .from('feedback_feedbackproducts')
        .select(`
          id, rating, comment, submitted_at, is_approved_by_admin, user_name, user_surname, product_id
        `)
        .eq('is_approved_by_admin', true)
        .order('submitted_at', { ascending: false });

      if (type === 'product' && slug) {
        const { data: product, error: productError } = await supabase
          .from('product')
          .select('id')
          .eq('slug', slug)
          .single();

        if (productError || !product) throw new Error('Error fetching product or not found');

        feedbackQuery = feedbackQuery.eq('product_id', product.id);
      }

      const { data: feedbackData, error: feedbackError } = await feedbackQuery;

      if (feedbackError) throw feedbackError;

      if (!feedbackData || feedbackData.length === 0) {
        setFeedbacks([]);
        setOverallAvgRating(null);
        setTotalApprovedFeedbacks(0);
        return;
      }

      const productIds = [...new Set(feedbackData.map((fb: any) => fb.product_id))];
      const { data: productsData, error: productsError } = await supabase
        .from('product')
        .select('id, slug, product_name')
        .in('id', productIds);

      if (productsError) throw productsError;

      const productMap = new Map(
        productsData.map((product: any) => [
          product.id,
          { slug: product.slug, name: product.product_name },
        ])
      );

      const data: Feedback[] = feedbackData.map((fb: any) => ({
        id: fb.id.toString(),
        rating: fb.rating,
        comment: fb.comment,
        submitted_at: fb.submitted_at,
        is_approved_by_admin: fb.is_approved_by_admin,
        user: {
          first_name: fb.user_name,
          last_name: fb.user_surname,
        },
        product: productMap.get(fb.product_id),
      }));

      setFeedbacks(data);

      const totalRating = data.reduce((sum, fb) => sum + fb.rating, 0);
      const avgRating = data.length ? totalRating / data.length : null;

      setOverallAvgRating(avgRating);
      setTotalApprovedFeedbacks(data.length);
    } catch (error: any) {
      console.error('Error fetching feedbacks:', error);
      setError('Failed to load feedback. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAccordion = () => setIsOpen(!isOpen);

  const renderStars = (rating: number, isHeader = false) => {
    const fullStars = Math.floor(rating);
    const decimalPart = rating - fullStars;
    const starSize = isHeader ? 'text-xl sm:text-2xl' : 'text-lg';

    return (
      <>
        {Array.from({ length: 5 }, (_, index) => {
          if (index < fullStars) {
            return (
              <span key={index} className={`${starSize} text-teal-500 drop-shadow-sm`}>
                ★
              </span>
            );
          } else if (index === fullStars && decimalPart > 0) {
            return (
              <span
                key={index}
                className={`${starSize} relative inline-block text-gray-300`}
                style={{ width: '1em' }}
              >
                ★
                <span
                  className="absolute inset-0 text-teal-500 drop-shadow-sm overflow-hidden"
                  style={{ width: `${decimalPart * 100}%` }}
                >
                  ★
                </span>
              </span>
            );
          } else {
            return (
              <span key={index} className={`${starSize} text-gray-300`}>
                ★
              </span>
            );
          }
        })}
      </>
    );
  };

  if (isLoading) {
    return <p className="text-center text-gray-500 py-12">Loading feedback...</p>;
  }

  if (error) {
    return <p className="text-center text-red-500 py-12">{error}</p>;
  }

  return (
    <section className="py-12 bg-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-0">
        <div className="bg-white rounded-lg shadow-sm">
          <button
            onClick={toggleAccordion}
            className="w-full text-left py-4 px-4 sm:py-5 sm:px-6 flex justify-between items-center text-gray-900 hover:bg-gray-50 focus:outline-none transition-colors duration-200"
          >
            <div className="flex items-center space-x-2 sm:space-x-3">
              {overallAvgRating ? (
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <span className="text-xl sm:text-2xl font-bold">{overallAvgRating.toFixed(1)}</span>
                  <div className="flex items-center">
                    <span className="block sm:hidden text-teal-500 text-xl sm:text-2xl">★</span>
                    <div className="hidden sm:flex sm:space-x-1">{renderStars(overallAvgRating, true)}</div>
                  </div>
                </div>
              ) : (
                <p className="text-base sm:text-lg text-gray-500">No ratings yet</p>
              )}
              <span className="text-base sm:text-xl font-semibold">Customer Reviews</span>
            </div>
            <div className="flex items-center space-x-1 sm:space-x-2">
              <span className="text-base sm:text-lg text-gray-600">
                {totalApprovedFeedbacks} {totalApprovedFeedbacks === 1 ? 'review' : 'reviews'}
              </span>
              <ChevronDownIcon
                className={`h-5 w-5 sm:h-6 sm:w-6 text-gray-500 transform transition-transform duration-200 ${
                  isOpen ? 'rotate-180' : ''
                }`}
              />
            </div>
          </button>

          <div className={`${isOpen ? 'block' : 'hidden'} px-4 sm:px-6 pb-4 sm:pb-6`}>
            {feedbacks.length === 0 ? (
              <p className="text-center text-gray-500 py-6">No reviews available.</p>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {feedbacks.map((comment) => (
                  <div
                    key={comment.id}
                    className="border border-gray-200 rounded-md p-4 sm:p-5 bg-gray-50/50 hover:bg-gray-50 transition-colors duration-200"
                  >
                    {comment.product && (
                      <p className="text-xs sm:text-sm text-gray-600">
                        <Link
                          href={`/products/${comment.product.slug}`}
                          className="underline text-sky-600 hover:text-sky-800 transition-colors duration-200"
                        >
                          {comment.product.name}
                        </Link>
                      </p>
                    )}
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mt-1 sm:mt-2 gap-2">
                      <div className="flex items-center space-x-1">{renderStars(comment.rating)}</div>
                      <div className="text-xs sm:text-sm text-gray-500">
                        {new Date(comment.submitted_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </div>
                    </div>
                    <p className="mt-2 sm:mt-3 text-sm sm:text-base text-gray-700 leading-relaxed">
                      {comment.comment}
                    </p>
                    <div className="mt-1 sm:mt-2 text-xs sm:text-sm font-medium text-gray-900">
                      {comment.user.first_name} {comment.user.last_name}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeedbackAccordion;
