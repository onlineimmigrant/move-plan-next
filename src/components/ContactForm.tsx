'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { FaEnvelope, FaPhone, FaTelegramPlane, FaWhatsapp } from 'react-icons/fa'
import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import Toast from './Toast'
import Button from '@/ui/Button'
import { supabase } from '@/lib/supabase'
import { useSettings } from '@/context/SettingsContext'

type ContactFormProps = {
  onSuccess?: () => void
}

export default function ContactForm({ onSuccess }: ContactFormProps) {
  const { settings } = useSettings()
  const orgId = settings.organization_id

  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]
  const [form, setForm] = useState({
    name: '', email: '', phone: '', subject: '', message: '',
    honeypot: '', mathAnswer: '', preferredContact: 'email'
  })
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [dateMode, setDateMode] = useState('any')
  const [showDate, setShowDate] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [math, setMath] = useState({ num1: 0, num2: 0, answer: 0 })
  const [isMounted, setIsMounted] = useState(false)
  const dateRef = useRef<HTMLInputElement>(null)

  // Set mounted state for client-side hydration
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Generate math challenge
  const generateMathChallenge = useCallback(() => {
    const num1 = Math.floor(Math.random() * 10) + 1
    const num2 = Math.ceil(Math.random() * 8) + 1
    setMath({ num1, num2, answer: num1 + num2 })
  }, [])

  useEffect(() => {
    generateMathChallenge()
  }, [generateMathChallenge])

  // Memoized constants
  const timeRanges = useMemo(() => [
    '8:00 AM - 12:00 PM', 
    '12:00 PM - 4:00 PM', 
    '4:00 PM - 8:00 PM', 
    '8:00 PM - 12:00 AM'
  ], [])

  const contacts = useMemo(() => [
    { value: 'email', label: 'Email', icon: <FaEnvelope className="w-4 h-4" />, color: 'text-blue-500' },
    { value: 'phone', label: 'Phone', icon: <FaPhone className="w-4 h-4" />, color: 'text-green-500' },
    { value: 'telegram', label: 'Telegram', icon: <FaTelegramPlane className="w-4 h-4" />, color: 'text-sky-500' },
    { value: 'whatsapp', label: 'WhatsApp', icon: <FaWhatsapp className="w-4 h-4" />, color: 'text-emerald-500' },
  ], [])

  // Enhanced validation with better error messages
  const validate = useCallback(() => {
    const err: Record<string, string> = {}
    
    if (!form.name.trim()) {
      err.name = 'Name is required'
    } else if (form.name.trim().length < 2) {
      err.name = 'Name must be at least 2 characters'
    }
    
    if (!form.email.trim()) {
      err.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      err.email = 'Please enter a valid email address'
    }
    
    if (!form.phone.trim()) {
      err.phone = 'Phone number is required'
    } else if (!/^\+?\d{10,15}$/.test(form.phone.replace(/[\s\-\(\)]/g, ''))) {
      err.phone = 'Please enter a valid phone number (10-15 digits)'
    }
    
    if (!form.subject.trim()) {
      err.subject = 'Subject is required'
    } else if (form.subject.trim().length < 5) {
      err.subject = 'Subject must be at least 5 characters'
    }
    
    if (!form.message.trim()) {
      err.message = 'Message is required'
    } else if (form.message.trim().length < 10) {
      err.message = 'Message must be at least 10 characters'
    }
    
    if (form.honeypot) {
      err.honeypot = 'Bot detected'
    }
    
    if (!form.mathAnswer || parseInt(form.mathAnswer) !== math.answer) {
      err.mathAnswer = 'Please solve the math problem correctly'
    }
    
    return err
  }, [form, math.answer])

  // Optimized form update function
  const updateForm = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    // Clear specific field error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }, [errors])

  // Enhanced date toggle function
  const toggleDate = useCallback((mode: string) => {
    setDateMode(mode)
    if (mode === 'any') {
      setDate('')
      setShowDate(false)
    } else {
      setDate(tomorrow)
      setShowDate(true)
      setTimeout(() => dateRef.current?.focus(), 100)
    }
  }, [tomorrow])

  // Enhanced date update function
  const updateDate = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setDate(e.target.value)
    setShowDate(false)
    if (errors.date) {
      setErrors(prev => ({ ...prev, date: '' }))
    }
  }, [errors.date])

  // Enhanced form reset function
  const resetForm = useCallback(() => {
    setForm({ 
      name: '', 
      email: '', 
      phone: '', 
      subject: '', 
      message: '', 
      honeypot: '', 
      mathAnswer: '', 
      preferredContact: 'email' 
    })
    setDate('')
    setTime('')
    setDateMode('any')
    setShowDate(false)
    setErrors({})
    generateMathChallenge()
  }, [generateMathChallenge])

  // Enhanced submit function with better error handling
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setSuccess(false)

    const validationErrors = validate()
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors)
      if (validationErrors.honeypot) {
        console.log('Bot detected - submission blocked')
      }
      // Focus first error field
      const firstErrorField = Object.keys(validationErrors)[0]
      const element = document.querySelector(`[name="${firstErrorField}"]`) as HTMLElement
      element?.focus()
      return
    }

    setSubmitting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      const payload = {
        organization_id: orgId,
        customer_id: user?.id || null,
        full_name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        subject: form.subject.trim(),
        message: form.message.trim(),
        preferred_contact_method: form.preferredContact,
        preferred_date: date || null,
        preferred_time_range: time || null,
      }

      const res = await fetch('/api/tickets/create', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Network error occurred' }))
        throw new Error(errorData.error || `Server error: ${res.status}`)
      }

      const result = await res.json()
      console.log('Ticket created successfully:', result)

      setSuccess(true)
      resetForm()
      onSuccess?.()
      
      // Auto-hide success message
      setTimeout(() => setSuccess(false), 5000)
      
    } catch (err) {
      console.error('Ticket submission error:', err)
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.'
      setErrors({ submit: errorMessage })
    } finally {
      setSubmitting(false)
    }
  }

  // Don't render until mounted to prevent hydration issues
  if (!isMounted) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded"></div>
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 rounded-xl"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {errors.submit && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 backdrop-blur-sm">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-3 flex-shrink-0" />
            <p className="text-sm text-red-700 font-medium">{errors.submit}</p>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {success && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 backdrop-blur-sm">
          <div className="flex items-center">
            <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
            <p className="text-sm text-green-700 font-medium">
              Ticket submitted successfully! We'll get back to you soon.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={submit} className="space-y-6">
        {/* Personal Information Section */}
        <div className="rounded-2xl shadow-lg border border-gray-200 p-6 backdrop-blur-sm bg-white/95">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={updateForm}
                className={`w-full px-4 py-3 border ${
                  errors.name ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-200 focus:border-sky-500 focus:ring-sky-500/20'
                } rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 bg-white/80 backdrop-blur-sm`}
                placeholder="Enter your full name"
                autoComplete="name"
              />
              {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={updateForm}
                className={`w-full px-4 py-3 border ${
                  errors.email ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-200 focus:border-sky-500 focus:ring-sky-500/20'
                } rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 bg-white/80 backdrop-blur-sm`}
                placeholder="your.email@example.com"
                autoComplete="email"
              />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
            </div>

            {/* Phone Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={updateForm}
                className={`w-full px-4 py-3 border ${
                  errors.phone ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-200 focus:border-sky-500 focus:ring-sky-500/20'
                } rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 bg-white/80 backdrop-blur-sm`}
                placeholder="+44 123 456 7890"
                autoComplete="tel"
              />
              {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
            </div>

            {/* Subject Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="subject"
                value={form.subject}
                onChange={updateForm}
                className={`w-full px-4 py-3 border ${
                  errors.subject ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-200 focus:border-sky-500 focus:ring-sky-500/20'
                } rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 bg-white/80 backdrop-blur-sm`}
                placeholder="Brief description of your inquiry"
              />
              {errors.subject && <p className="mt-1 text-xs text-red-600">{errors.subject}</p>}
            </div>
          </div>
        </div>

        {/* Contact Preferences Section */}
        <div className="rounded-2xl shadow-lg border border-gray-200 p-6 backdrop-blur-sm bg-white/95">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Preferences</h3>
          
          {/* Preferred Contact Method */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Preferred Contact Method
            </label>
            <div className="grid grid-cols-2 gap-3">
              {contacts.map(({ value, label, icon, color }) => (
                <label
                  key={value}
                  className={`flex items-center justify-center p-3 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                    form.preferredContact === value 
                      ? 'border-sky-500 bg-sky-50 shadow-md' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="preferredContact"
                    value={value}
                    checked={form.preferredContact === value}
                    onChange={updateForm}
                    className="sr-only"
                  />
                  <span className={`flex items-center gap-2 text-sm font-medium ${color}`}>
                    {icon} {label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Preferred Date */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Preferred Date
            </label>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <label
                className={`flex items-center justify-center p-3 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                  dateMode === 'any' 
                    ? 'border-sky-500 bg-sky-50 shadow-md' 
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="dateMode"
                  value="any"
                  checked={dateMode === 'any'}
                  onChange={() => toggleDate('any')}
                  className="sr-only"
                />
                <span className="text-sm font-medium text-gray-700">Any Date</span>
              </label>
              <label
                className={`flex items-center justify-center p-3 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                  dateMode === 'choose' 
                    ? 'border-sky-500 bg-sky-50 shadow-md' 
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="dateMode"
                  value="choose"
                  checked={dateMode === 'choose'}
                  onChange={() => toggleDate('choose')}
                  className="sr-only"
                />
                <span className="text-sm font-medium text-gray-700">Choose Date</span>
              </label>
            </div>
            {showDate && (
              <input
                type="date"
                ref={dateRef}
                value={date}
                onChange={updateDate}
                onBlur={() => setShowDate(false)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all duration-200 bg-white/80 backdrop-blur-sm"
                autoFocus
              />
            )}
            {errors.date && <p className="mt-1 text-xs text-red-600">{errors.date}</p>}
          </div>

          {/* Preferred Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Preferred Time Range
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {timeRanges.map(range => (
                <label
                  key={range}
                  className={`flex items-center justify-center p-3 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                    time === range 
                      ? 'border-sky-500 bg-sky-50 shadow-md' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="timeRange"
                    value={range}
                    checked={time === range}
                    onChange={e => {
                      setTime(e.target.value)
                      if (errors.timeRange) {
                        setErrors(prev => ({ ...prev, timeRange: '' }))
                      }
                    }}
                    className="sr-only"
                  />
                  <span className="text-sm font-medium text-gray-700">{range}</span>
                </label>
              ))}
            </div>
            {errors.timeRange && <p className="mt-1 text-xs text-red-600">{errors.timeRange}</p>}
          </div>
        </div>

        {/* Message Section */}
        <div className="rounded-2xl shadow-lg border border-gray-200 p-6 backdrop-blur-sm bg-white/95">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Message</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message <span className="text-red-500">*</span>
            </label>
            <textarea
              name="message"
              value={form.message}
              onChange={updateForm}
              rows={5}
              className={`w-full px-4 py-3 border ${
                errors.message ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-200 focus:border-sky-500 focus:ring-sky-500/20'
              } rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 bg-white/80 backdrop-blur-sm resize-none`}
              placeholder="Please describe your inquiry in detail. How can we help you?"
            />
            {errors.message && <p className="mt-1 text-xs text-red-600">{errors.message}</p>}
            <p className="mt-2 text-xs text-gray-500">
              Characters: {form.message.length} (minimum 10 required)
            </p>
          </div>
        </div>

        {/* Security Section */}
        <div className="rounded-2xl shadow-lg border border-gray-200 p-6 backdrop-blur-sm bg-white/95">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Verification</h3>
          
          {/* Math Challenge */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Security Question <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center space-x-3 mb-3">
              <div className="bg-sky-50 border border-sky-200 rounded-lg px-4 py-2">
                <span className="text-lg font-mono font-bold text-sky-700">
                  {math.num1} + {math.num2} = ?
                </span>
              </div>
            </div>
            <input
              type="number"
              name="mathAnswer"
              value={form.mathAnswer}
              onChange={updateForm}
              className={`w-24 px-4 py-3 border ${
                errors.mathAnswer ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-200 focus:border-sky-500 focus:ring-sky-500/20'
              } rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 bg-white/80 backdrop-blur-sm text-center font-mono`}
              placeholder="Answer"
            />
            {errors.mathAnswer && <p className="mt-1 text-xs text-red-600">{errors.mathAnswer}</p>}
          </div>

          {/* Honeypot Field - Hidden */}
          <div className="hidden">
            <input
              type="text"
              name="honeypot"
              value={form.honeypot}
              onChange={updateForm}
              tabIndex={-1}
              autoComplete="off"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <Button 
            variant="start" 
            type="submit" 
            disabled={submitting} 
            className="w-full py-4 text-base font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:transform-none disabled:shadow-md"
          >
            {submitting ? (
              <span className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                Submitting...
              </span>
            ) : (
              'Submit Ticket'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}