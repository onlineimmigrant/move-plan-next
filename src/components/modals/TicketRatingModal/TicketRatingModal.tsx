'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { XMarkIcon, StarIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'
import { supabase } from '@/lib/supabase'
import { useSettings } from '@/context/SettingsContext'
import Button from '@/ui/Button'

interface TicketRatingModalProps {
  isOpen: boolean
  onClose: () => void
  ticketId: string
  ticketSubject: string
  adminId?: string | null
  adminName?: string
  onRatingSubmitted?: () => void
}

interface RatingCategory {
  id: 'response_time' | 'helpfulness' | 'professionalism'
  label: string
  description: string
}

const ratingCategories: RatingCategory[] = [
  {
    id: 'response_time',
    label: 'Response Time',
    description: 'How quickly did we respond to your ticket?'
  },
  {
    id: 'helpfulness',
    label: 'Helpfulness',
    description: 'How helpful was our support in resolving your issue?'
  },
  {
    id: 'professionalism',
    label: 'Professionalism',
    description: 'How professional was our communication?'
  }
]

export default function TicketRatingModal({
  isOpen,
  onClose,
  ticketId,
  ticketSubject,
  adminId,
  adminName,
  onRatingSubmitted
}: TicketRatingModalProps) {
  const { settings } = useSettings()
  const [mounted, setMounted] = useState(false)
  
  // Overall rating
  const [overallRating, setOverallRating] = useState(0)
  const [hoveredStar, setHoveredStar] = useState(0)
  
  // Category ratings
  const [categoryRatings, setCategoryRatings] = useState<Record<string, number>>({
    response_time: 0,
    helpfulness: 0,
    professionalism: 0
  })
  const [hoveredCategoryStar, setHoveredCategoryStar] = useState<Record<string, number>>({})
  
  // Feedback
  const [feedback, setFeedback] = useState('')
  const [allowPublic, setAllowPublic] = useState(false)
  
  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState('')
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setOverallRating(0)
      setCategoryRatings({
        response_time: 0,
        helpfulness: 0,
        professionalism: 0
      })
      setFeedback('')
      setAllowPublic(false)
      setIsSuccess(false)
      setError('')
    }
  }, [isOpen])
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (overallRating === 0) {
      setError('Please select an overall rating')
      return
    }
    
    setIsSubmitting(true)
    setError('')
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('You must be logged in to submit a rating')
      }
      
      // Determine sentiment based on overall rating
      const sentiment = 
        overallRating >= 4 ? 'positive' :
        overallRating === 3 ? 'neutral' :
        'negative'
      
      const { error: insertError } = await supabase
        .from('ticket_ratings')
        .insert({
          ticket_id: ticketId,
          organization_id: settings?.organization_id,
          rating: overallRating,
          feedback: feedback.trim() || null,
          response_time_rating: categoryRatings.response_time || null,
          helpfulness_rating: categoryRatings.helpfulness || null,
          professionalism_rating: categoryRatings.professionalism || null,
          sentiment,
          rated_by: user.id,
          admin_id: adminId || null,
          is_public: allowPublic,
          is_published: false // Admin must approve
        })
      
      if (insertError) throw insertError
      
      setIsSuccess(true)
      onRatingSubmitted?.()
      
      // Close modal after 2 seconds
      setTimeout(() => {
        onClose()
      }, 2000)
      
    } catch (err) {
      console.error('Error submitting rating:', err)
      setError(err instanceof Error ? err.message : 'Failed to submit rating')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const renderStars = (
    currentRating: number,
    onRate: (rating: number) => void,
    hovered: number,
    onHover: (rating: number) => void,
    size: 'large' | 'small' = 'large'
  ) => {
    const sizeClass = size === 'large' ? 'w-12 h-12' : 'w-6 h-6'
    
    return (
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((star) => {
          const isActive = star <= (hovered || currentRating)
          
          return (
            <button
              key={star}
              type="button"
              onClick={() => onRate(star)}
              onMouseEnter={() => onHover(star)}
              onMouseLeave={() => onHover(0)}
              className="transition-transform duration-200 hover:scale-110 focus:outline-none"
            >
              {isActive ? (
                <StarIconSolid 
                  className={`${sizeClass} ${
                    star <= overallRating 
                      ? 'text-yellow-400' 
                      : 'text-yellow-300'
                  }`}
                />
              ) : (
                <StarIcon className={`${sizeClass} text-gray-300`} />
              )}
            </button>
          )
        })}
      </div>
    )
  }
  
  if (!mounted || !isOpen) return null
  
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div 
        className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
              {isSuccess ? '✅ Thank You!' : '⭐ Rate Your Experience'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {isSuccess 
                ? 'Your feedback helps us improve our support'
                : `How was your support experience?`
              }
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isSuccess ? (
            /* Success State */
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircleIcon className="w-12 h-12 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Rating Submitted!
              </h3>
              <p className="text-gray-600 max-w-md">
                Thank you for taking the time to share your feedback. 
                Your input helps us provide better support to all our customers.
              </p>
              {allowPublic && (
                <p className="text-sm text-blue-600 mt-4">
                  📣 You've allowed us to use your feedback as a testimonial (pending approval)
                </p>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Ticket Info */}
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-600 mb-1">Ticket</p>
                <p className="font-medium text-gray-900">{ticketSubject}</p>
                {adminName && (
                  <p className="text-sm text-gray-500 mt-1">
                    Handled by <span className="font-medium">{adminName}</span>
                  </p>
                )}
              </div>
              
              {/* Overall Rating */}
              <div className="text-center">
                <label className="block text-lg font-semibold text-gray-900 mb-2">
                  Overall Experience
                </label>
                <p className="text-sm text-gray-600 mb-6">
                  How would you rate your overall experience?
                </p>
                <div className="flex justify-center mb-4">
                  {renderStars(
                    overallRating,
                    setOverallRating,
                    hoveredStar,
                    setHoveredStar,
                    'large'
                  )}
                </div>
                {overallRating > 0 && (
                  <p className="text-sm text-gray-600 animate-in fade-in duration-300">
                    {overallRating === 5 && '🎉 Outstanding!'}
                    {overallRating === 4 && '😊 Great!'}
                    {overallRating === 3 && '👍 Good'}
                    {overallRating === 2 && '😐 Could be better'}
                    {overallRating === 1 && '😞 Not satisfied'}
                  </p>
                )}
              </div>
              
              {/* Category Ratings */}
              {overallRating > 0 && (
                <div className="space-y-6 animate-in slide-in-from-top-4 duration-500">
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Rate Specific Areas (Optional)
                    </h3>
                    <div className="space-y-4">
                      {ratingCategories.map((category) => (
                        <div 
                          key={category.id}
                          className="bg-gray-50 rounded-xl p-4"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex-1">
                              <label className="block text-sm font-medium text-gray-900">
                                {category.label}
                              </label>
                              <p className="text-xs text-gray-600 mt-0.5">
                                {category.description}
                              </p>
                            </div>
                            <div className="ml-4">
                              {renderStars(
                                categoryRatings[category.id],
                                (rating) => setCategoryRatings(prev => ({ ...prev, [category.id]: rating })),
                                hoveredCategoryStar[category.id] || 0,
                                (rating) => setHoveredCategoryStar(prev => ({ ...prev, [category.id]: rating })),
                                'small'
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Feedback */}
                  <div className="border-t border-gray-200 pt-6">
                    <label className="block text-lg font-semibold text-gray-900 mb-2">
                      Additional Feedback (Optional)
                    </label>
                    <p className="text-sm text-gray-600 mb-4">
                      Share more details about your experience
                    </p>
                    <textarea
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      rows={4}
                      maxLength={500}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
                      placeholder="Tell us what we did well or how we can improve..."
                    />
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-gray-500">
                        {feedback.length}/500 characters
                      </p>
                    </div>
                  </div>
                  
                  {/* Public Testimonial Opt-in */}
                  {overallRating >= 4 && (
                    <div className="border-t border-gray-200 pt-6">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={allowPublic}
                          onChange={(e) => setAllowPublic(e.target.checked)}
                          className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <div>
                          <span className="text-sm font-medium text-gray-900">
                            Allow us to use my feedback as a testimonial
                          </span>
                          <p className="text-xs text-gray-600 mt-1">
                            Your name and feedback may be displayed publicly (subject to approval)
                          </p>
                        </div>
                      </label>
                    </div>
                  )}
                </div>
              )}
              
              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
            </form>
          )}
        </div>
        
        {/* Footer */}
        {!isSuccess && (
          <div className="border-t border-gray-200 p-6 bg-gray-50">
            <div className="flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                Skip for Now
              </button>
              <Button
                type="submit"
                variant="start"
                disabled={overallRating === 0 || isSubmitting}
                onClick={handleSubmit}
                className="px-8"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
                    <span>Submitting...</span>
                  </div>
                ) : (
                  'Submit Rating'
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
