'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { v4 as uuidv4 } from 'uuid';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/context/AuthContext';
import { useFeedbackTranslations } from './useFeedbackTranslations';

// Interfaces
interface User {
  id: string;
  first_name: string;
  last_name: string;
  role?: string;
}

interface FeedbackFormProps {
  productId: number | null;
  onSubmit: () => void;
  isOpen: boolean;
  onClose: () => void;
  isGlobalReview?: boolean; // New prop to indicate this is for organization-wide reviews
}

// Updated: Star component interface with onMouseEnter and onMouseLeave
const Star: React.FC<{
  filled: boolean;
  half?: boolean;
  decimalPart?: number;
  size?: string;
  id?: string;
  onClick?: () => void;
  clickable?: boolean;
  onMouseEnter?: (event: React.MouseEvent<SVGSVGElement>) => void; // Added
  onMouseLeave?: (event: React.MouseEvent<SVGSVGElement>) => void; // Added
}> = ({ filled, half = false, decimalPart = 0, size = "5", id, onClick, clickable = false, onMouseEnter, onMouseLeave }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    className={`w-${size} h-${size} ${filled ? "text-amber-500" : "text-gray-300"} transition-transform duration-200 ${
      clickable ? 'cursor-pointer hover:scale-110 hover:text-amber-600' : 'hover:scale-110'
    }`}
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth="2"
    onClick={onClick}
    onMouseEnter={onMouseEnter} // Added
    onMouseLeave={onMouseLeave} // Added
    role={clickable ? "button" : undefined}
    aria-label={clickable ? `Rate ${id?.split('-')[1]} stars` : undefined}
    tabIndex={clickable ? 0 : undefined}
    onKeyDown={clickable && onClick ? (e) => (e.key === 'Enter' || e.key === ' ') && onClick() : undefined}
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

const FeedbackForm: React.FC<FeedbackFormProps> = ({ productId, onSubmit, isOpen, onClose, isGlobalReview = false }) => {
  const { t } = useFeedbackTranslations();
  const { isAdmin, session } = useAuth();
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [userSurname, setUserSurname] = useState<string>('');
  const [submittedAt, setSubmittedAt] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [reviewCount, setReviewCount] = useState<number>(0);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const dragStartPos = useRef({ x: 0, y: 0 });

  const modalRef = useRef<HTMLDivElement>(null);
  const firstFocusableElement = useRef<HTMLElement | null>(null);
  const lastFocusableElement = useRef<HTMLElement | null>(null);

  // Parse full_name or email into first_name and last_name (unchanged)
  const parseFullName = (fullName: string): { firstName: string; lastName: string } => {
    if (fullName.includes('@')) {
      const localPart = fullName.split('@')[0];
      const nameParts = localPart.split('.');
      if (nameParts.length >= 2) {
        return {
          firstName: nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1),
          lastName: nameParts[1].charAt(0).toUpperCase() + nameParts[1].slice(1),
        };
      }
      return {
        firstName: localPart.charAt(0).toUpperCase() + localPart.slice(1),
        lastName: '',
      };
    }

    const [firstName, ...lastNameParts] = fullName.trim().split(' ');
    return {
      firstName: firstName || '',
      lastName: lastNameParts.join(' ') || '',
    };
  };

  useEffect(() => {
    const checkAuthAndRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setIsAuthenticated(true);
        const { data: userData, error: userError } = await supabase
          .from('profiles')
          .select('id, full_name, role, organization_id')
          .eq('id', user.id)
          .single();

        if (userError || !userData) {
          setError('Failed to fetch user data.');
          return;
        }

        const { firstName, lastName } = parseFullName(userData.full_name || '');
        setUserName(firstName);
        setUserSurname(lastName);

        if (isAdmin) {
          const now = new Date();
          setSubmittedAt(now.toISOString().slice(0, 16));
        }

        const { count, error: countError } = await supabase
          .from('feedback_feedbackproducts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        if (countError) {
          setError('Failed to fetch review count.');
          return;
        }
        setReviewCount(count || 0);

        if (isAdmin && userData.organization_id) {
          const { data: usersData, error: usersError } = await supabase
            .from('profiles')
            .select('id, full_name')
            .eq('organization_id', userData.organization_id);

          if (usersError) {
            setError('Failed to fetch users from organization.');
            return;
          }

          const mappedUsers = usersData?.map(userProfile => {
            const { firstName, lastName } = parseFullName(userProfile.full_name || '');
            return {
              id: userProfile.id,
              first_name: firstName,
              last_name: lastName,
            };
          }) || [];
          setUsers(mappedUsers);
          
          // Set current user as default selection
          setSelectedUserId(user.id);
          
          console.log('Organization users loaded:', mappedUsers);
          console.log('Current user set as default:', user.id);
        }
      } else {
        setIsAuthenticated(false);
      }
    };

    checkAuthAndRole();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      if (selectedUserId) {
        const selectedUser = users.find(user => user.id === selectedUserId);
        if (selectedUser) {
          setUserName(selectedUser.first_name);
          setUserSurname(selectedUser.last_name);
          console.log('Selected user:', selectedUser);
        } else {
          setUserName('');
          setUserSurname('');
          console.log('No user found for ID:', selectedUserId);
        }
      } else {
        setUserName('');
        setUserSurname('');
        console.log('No user selected');
      }
    }
  }, [selectedUserId, users, isAdmin]);

  // Handle drag start
  const handleDragStart = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    console.log('Drag started');
    if (modalRef.current) {
      setIsDragging(true);
      const rect = modalRef.current.getBoundingClientRect();
      dragStartPos.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
      document.body.style.userSelect = 'none';
    }
  };

  // Handle drag move
  const handleDragMove = useCallback(
    (e: MouseEvent) => {
      if (isDragging && modalRef.current) {
        console.log('Dragging', { clientX: e.clientX, clientY: e.clientY });
        const newX = e.clientX - dragStartPos.current.x;
        const newY = e.clientY - dragStartPos.current.y;

        const maxX = window.innerWidth - modalRef.current.offsetWidth;
        const maxY = window.innerHeight - modalRef.current.offsetHeight;
        const boundedX = Math.max(0, Math.min(newX, maxX));
        const boundedY = Math.max(0, Math.min(newY, maxY));

        setPosition({ x: boundedX, y: boundedY });
      }
    },
    [isDragging]
  );

  // Handle drag end
  const handleDragEnd = () => {
    console.log('Drag ended');
    setIsDragging(false);
    document.body.style.userSelect = '';
  };

  // Add and clean up drag event listeners
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
    };
  }, [isDragging, handleDragMove]);

  // Center modal on open for desktop devices
  useEffect(() => {
    if (isOpen && modalRef.current) {
      const isDesktop = window.innerWidth >= 768;
      if (isDesktop) {
        const modalWidth = modalRef.current.offsetWidth;
        const modalHeight = modalRef.current.offsetHeight;
        const centerX = (window.innerWidth - modalWidth) / 2;
        const centerY = (window.innerHeight - modalHeight) / 2;
        setPosition({ x: centerX, y: centerY });
      } else {
        setPosition({ x: 0, y: 0 });
      }
    }
  }, [isOpen]);

  // Handle Escape key and focus trapping
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }

      if (e.key === 'Tab' && isOpen) {
        const focusableElements = modalRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements && focusableElements.length > 0) {
          firstFocusableElement.current = focusableElements[0];
          lastFocusableElement.current = focusableElements[focusableElements.length - 1];

          if (e.shiftKey && document.activeElement === firstFocusableElement.current) {
            e.preventDefault();
            lastFocusableElement.current?.focus();
          } else if (!e.shiftKey && document.activeElement === lastFocusableElement.current) {
            e.preventDefault();
            firstFocusableElement.current?.focus();
          }
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      const focusableElements = modalRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusableElements && focusableElements.length > 0) {
        focusableElements[0].focus();
      }
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    if (rating < 1 || rating > 5) {
      setError(t.ratingRequired);
      setIsSubmitting(false);
      return;
    }

    if (!comment.trim()) {
      setError(t.commentRequired);
      setIsSubmitting(false);
      return;
    }

    if (comment.length > 500) {
      setError(t.commentTooLong);
      setIsSubmitting(false);
      return;
    }

    if (!userName.trim()) {
      setError(t.firstNameRequired);
      setIsSubmitting(false);
      return;
    }

    if (!isAdmin && reviewCount >= 2) {
      setError('You have reached the limit of 2 reviews.');
      setIsSubmitting(false);
      return;
    }

    if (isAdmin && !selectedUserId) {
      setError(t.pleaseSelectUser);
      setIsSubmitting(false);
      return;
    }

    if (isAdmin && !submittedAt) {
      setError(t.pleaseSelectSubmissionDate);
      setIsSubmitting(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError('You must be logged in to submit a review.');
      setIsSubmitting(false);
      return;
    }

    const userIdToUse = isAdmin && selectedUserId ? selectedUserId : user.id;
    const submittedAtValue = isAdmin ? new Date(submittedAt).toISOString() : new Date().toISOString();
    const productIdToSubmit = isGlobalReview ? 0 : productId; // Use 0 for global reviews

    // Get organization_id from the user who will be associated with this review
    const { data: reviewerData, error: reviewerError } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', userIdToUse)
      .single();

    if (reviewerError || !reviewerData?.organization_id) {
      setError('Failed to get user organization information.');
      setIsSubmitting(false);
      return;
    }

    const { error: insertError } = await supabase
      .from('feedback_feedbackproducts')
      .insert({
        rating,
        comment,
        submitted_at: submittedAtValue,
        is_visible_to_user: true,
        is_approved_by_admin: isAdmin,
        user_id: userIdToUse,
        user_name: userName.trim(),
        user_surname: userSurname.trim(),
        product_id: productIdToSubmit,
        organization_id: reviewerData.organization_id,
      });

    if (insertError) {
      setError(t.submissionError);
      setIsSubmitting(false);
      return;
    }

    // Auto-convert user from lead to customer when submitting review
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('customer')
      .eq('id', userIdToUse)
      .single();

    if (userProfile?.customer?.is_lead) {
      await supabase
        .from('profiles')
        .update({
          customer: {
            ...userProfile.customer,
            is_lead: false,
            is_customer: true,
            converted_at: new Date().toISOString(),
            lead_status: 'converted',
          }
        })
        .eq('id', userIdToUse);
    }

    setSuccess('Review submitted successfully!');
    setRating(0);
    setComment('');
    setUserName(isAdmin ? '' : userName);
    setUserSurname(isAdmin ? '' : userSurname);
    setSubmittedAt(isAdmin ? new Date().toISOString().slice(0, 16) : '');
    setSelectedUserId(null);
    if (!isAdmin) {
      setReviewCount(prev => prev + 1);
    }
    setIsSubmitting(false);
    onSubmit();
  };

  if (!isAuthenticated) {
    return (
      <p className="text-center text-gray-600 py-6 text-base">
        Please <Link href="/login" className="text-sky-600 font-medium hover:text-sky-800 transition-colors duration-200">log in</Link> to submit a review.
      </p>
    );
  }

  if (!isAdmin && reviewCount >= 2) {
    return (
      <p className="text-center text-gray-600 py-6 text-base">
        You have reached the limit of 2 reviews.
      </p>
    );
  }

  if (!productId) {
    return null;
  }

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-auto bg-transparent">
      <div
        ref={modalRef}
        className="absolute bg-white rounded-lg shadow-2xl border border-gray-200 w-full max-w-lg max-h-[90vh] overflow-y-auto"
        style={{ top: `${position.y}px`, left: `${position.x}px` }}
        role="dialog"
        aria-labelledby="modal-title"
        aria-modal="true"
      >
        {/* Modal Header (draggable) */}
        <div
          className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50 rounded-t-lg cursor-move"
          onMouseDown={handleDragStart}
        >
          <h3 id="modal-title" className="text-xl font-bold text-gray-900">
            {isGlobalReview ? t.writeOrganizationReview : t.writeReviewModal}
          </h3>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-sky-500 rounded-full p-1 transition-colors duration-200"
            aria-label={t.closeModal}
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {error && (
            <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3 mb-6" role="alert">
              {error}
            </p>
          )}
          {success && (
            <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md p-3 mb-6" role="status">
              {success}
            </p>
          )}

          {isGlobalReview && (
            <div className="text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-md p-3 mb-6">
              <p><strong>Organization Review:</strong> This review will be associated with all products from this organization and will appear on individual product pages as well as the general product listing.</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Rating Selector */}
            <div>
              <label htmlFor="rating" className="block text-sm font-semibold text-gray-900 mb-3">
                {t.rating}
              </label>
              <div className="flex space-x-2 mb-2">
                {Array.from({ length: 5 }, (_, index) => {
                  const starValue = index + 1;
                  const uniqueId = uuidv4();
                  return (
                    <Star
                      key={index}
                      filled={starValue <= (hoverRating || rating)}
                      size="6"
                      id={`star-${starValue}-${uniqueId}`}
                      clickable={true}
                      onClick={() => setRating(starValue)}
                      onMouseEnter={() => setHoverRating(starValue)}
                      onMouseLeave={() => setHoverRating(0)}
                    />
                  );
                })}
              </div>
              {rating > 0 && (
                <p className="text-sm text-gray-600 mt-1">
                  {t.youRated}: {rating} {rating !== 1 ? t.stars : t.star}
                </p>
              )}
            </div>

            {/* Admin Fields (Submit as User and Submission Date) */}
            {isAdmin && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="user-select" className="block text-sm font-semibold text-gray-800 mb-2">
                    {t.submitAsUser}
                  </label>
                  <select
                    id="user-select"
                    value={selectedUserId || ''}
                    onChange={(e) => {
                      setSelectedUserId(e.target.value || null);
                      console.log('Selected user ID:', e.target.value);
                    }}
                    className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors duration-200"
                    aria-label="Select user to submit review on behalf of"
                  >
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.first_name} {user.last_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="submitted-at" className="block text-sm font-semibold text-gray-800 mb-2">
                    {t.submissionDate}
                  </label>
                  <input
                    id="submitted-at"
                    type="datetime-local"
                    value={submittedAt}
                    onChange={(e) => setSubmittedAt(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors duration-200"
                    aria-required="true"
                  />
                </div>
              </div>
            )}

            {/* User Name and Surname Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="user-name" className="block text-sm font-semibold text-gray-900 mb-2">
                  {t.firstName}
                </label>
                <input
                  id="user-name"
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors duration-200"
                  placeholder={t.enterFirstName}
                  aria-required="true"
                />
              </div>
              <div>
                <label htmlFor="user-surname" className="block text-sm font-semibold text-gray-900 mb-2">
                  {t.lastName}
                </label>
                <input
                  id="user-surname"
                  type="text"
                  value={userSurname}
                  onChange={(e) => setUserSurname(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors duration-200"
                  placeholder={t.enterLastName}
                />
              </div>
            </div>

            {/* Comment Field */}
            <div>
              <label htmlFor="comment" className="block text-sm font-semibold text-gray-900 mb-2">
                {t.comment}
              </label>
              <textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 resize-y transition-colors duration-200"
                rows={5}
                maxLength={500}
                placeholder={t.writeReviewHerePlaceholder}
                aria-required="true"
              />
              <p className="text-sm text-gray-500 mt-2">
                {t.charactersCount.replace('{count}', comment.length.toString())}
              </p>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 transition-all duration-200"
                aria-label="Cancel and close modal"
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-6 py-2 bg-sky-600 text-white rounded-lg shadow-md hover:bg-sky-700 focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 transition-all duration-200 ${
                  isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                aria-label={t.submitReviewAction}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin h-5 w-5 mr-2 text-white"
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
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8H4z"
                      />
                    </svg>
                    Submitting...
                  </span>
                ) : (
                  t.submitReview
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FeedbackForm;