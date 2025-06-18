'use client'

import { useState, useEffect, useRef } from 'react'
import { FaEnvelope, FaPhone, FaTelegramPlane, FaWhatsapp } from 'react-icons/fa'
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
  const dateRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const num1 = Math.floor(Math.random() * 10) + 1
    const num2 = Math.ceil(Math.random() * 8) + 1
    setMath({ num1, num2, answer: num1 + num2 })
  }, [])

  const timeRanges = ['8:00 AM - 12:00 PM', '12:00 PM - 4:00 PM', '4:00 PM - 8:00 PM', '8:00 PM - 12:00 AM']
  const contacts = [
    { value: 'email', label: 'Email', icon: <FaEnvelope /> },
    { value: 'phone', label: 'Phone', icon: <FaPhone /> },
    { value: 'telegram', label: 'Telegram', icon: <FaTelegramPlane /> },
    { value: 'whatsapp', label: 'WhatsApp', icon: <FaWhatsapp /> },
  ]

  const validate = () => {
    const err: Record<string, string> = {}
    if (!form.name.trim()) err.name = 'Name required'
    if (!form.email.trim()) err.email = 'Email required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) err.email = 'Invalid email'
    if (!form.phone.trim()) err.phone = 'Phone required'
    else if (!/^\+?\d{10,15}$/.test(form.phone.replace(/\s/g, ''))) err.phone = 'Invalid phone'
    if (!form.subject.trim()) err.subject = 'Subject required'
    if (!form.message.trim()) err.message = 'Message required'
    if (form.honeypot) err.honeypot = 'Bot detected'
    if (!form.mathAnswer || parseInt(form.mathAnswer) !== math.answer) err.mathAnswer = 'Incorrect answer'
    return err
  }

  const updateForm = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    setErrors(prev => ({ ...prev, [name]: '' }))
  }

  const toggleDate = (mode: string) => {
    setDateMode(mode)
    if (mode === 'any') {
      setDate('')
      setShowDate(false)
    } else {
      setDate(tomorrow)
      setShowDate(true)
      dateRef.current?.focus()
    }
  }

  const updateDate = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDate(e.target.value)
    setShowDate(false)
    setErrors(prev => ({ ...prev, date: '' }))
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setSuccess(false)

    const validationErrors = validate()
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors)
      if (validationErrors.honeypot) console.log('Bot detected')
      return
    }

    setSubmitting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const res = await fetch('/api/tickets/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: orgId,
          customer_id: user?.id || null,
          full_name: form.name,
          email: form.email,
          phone: form.phone,
          subject: form.subject,
          message: form.message,
          preferred_contact_method: form.preferredContact,
          preferred_date: date || null,
          preferred_time_range: time || null,
        })
      })

      if (!res.ok) throw new Error((await res.json()).error || 'Ticket creation failed')

      setSuccess(true)
      setForm({ name: '', email: '', phone: '', subject: '', message: '', honeypot: '', mathAnswer: '', preferredContact: 'email' })
      setDate('')
      setTime('')
      setDateMode('any')
      setShowDate(false)
      setMath({ num1: Math.floor(Math.random() * 10) + 1, num2: Math.ceil(Math.random() * 8) + 1, answer: 0 })
      onSuccess?.()
    } catch (err) {
      console.error('Ticket error:', err)
      setErrors({ submit: (err as Error).message || 'Submission error' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {errors.submit && <p className="text-red-500 text-center">{errors.submit}</p>}
      {success && (
        <Toast
          message="Ticket submitted successfully!"
          type="success"
          onClose={() => setSuccess(false)}
          duration={5000}
        />
      )}

      <form onSubmit={submit} className="space-y-2">
        <div>
          <label className="block text-sm text-gray-700">Name</label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={updateForm}
            className={`w-full px-3 py-2 border ${errors.name ? 'border-red-500' : 'border-gray-200'} rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500`}
            placeholder="Your name"
          />
          {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-sm text-gray-700">Email</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={updateForm}
            className={`w-full px-3 py-2 border ${errors.email ? 'border-red-500' : 'border-gray-200'} rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500`}
            placeholder="example@email.com"
          />
          {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-sm text-gray-700">Phone</label>
          <input
            type="tel"
            name="phone"
            value={form.phone}
            onChange={updateForm}
            className={`w-full px-3 py-2 border ${errors.phone ? 'border-red-500' : 'border-gray-200'} rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500`}
            placeholder="+44 123 456 7890"
          />
          {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
        </div>

        <div>
          <label className="block text-sm text-gray-700">Subject</label>
          <input
            type="text"
            name="subject"
            value={form.subject}
            onChange={updateForm}
            className={`w-full px-3 py-2 border ${errors.subject ? 'border-red-500' : 'border-gray-200'} rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500`}
            placeholder="Your issue"
          />
          {errors.subject && <p className="text-xs text-red-500">{errors.subject}</p>}
        </div>

        <div>
          <label className="block text-sm text-gray-700">Preferred Contact</label>
          <div className="grid grid-cols-2 gap-2">
            {contacts.map(({ value, label, icon }) => (
              <label
                key={value}
                className={`flex items-center justify-center p-2 border ${form.preferredContact === value ? 'border-blue-500 bg-blue-50' : 'border-gray-200'} rounded-lg cursor-pointer hover:bg-blue-50`}
              >
                <input
                  type="radio"
                  name="preferredContact"
                  value={value}
                  checked={form.preferredContact === value}
                  onChange={updateForm}
                  className="hidden"
                />
                <span className="flex items-center gap-2 text-sm text-gray-700">
                  {icon} {label}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-700">Preferred Date</label>
          <div className="grid grid-cols-2 gap-2">
            <label
              className={`flex items-center justify-center p-2 border ${dateMode === 'any' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'} rounded-lg cursor-pointer hover:bg-blue-50`}
            >
              <input
                type="radio"
                name="dateMode"
                value="any"
                checked={dateMode === 'any'}
                onChange={() => toggleDate('any')}
                className="hidden"
              />
              <span className="text-sm text-gray-700">Any Date</span>
            </label>
            <label
              className={`flex items-center justify-center p-2 border ${dateMode === 'choose' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'} rounded-lg cursor-pointer hover:bg-blue-50`}
            >
              <input
                type="radio"
                name="dateMode"
                value="choose"
                checked={dateMode === 'choose'}
                onChange={() => toggleDate('choose')}
                className="hidden"
              />
              <span className="text-sm text-gray-700">Choose Date</span>
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
              className="mt-2 w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              autoFocus
            />
          )}
          {errors.date && <p className="text-xs text-red-500">{errors.date}</p>}
        </div>

        <div>
          <label className="block text-sm text-gray-700">Preferred Time</label>
          <div className="grid grid-cols-2 gap-2">
            {timeRanges.map(range => (
              <label
                key={range}
                className={`flex items-center justify-center p-2 border ${time === range ? 'border-blue-500 bg-blue-50' : 'border-gray-200'} rounded-lg cursor-pointer hover:bg-blue-50`}
              >
                <input
                  type="radio"
                  name="timeRange"
                  value={range}
                  checked={time === range}
                  onChange={e => {
                    setTime(e.target.value)
                    setErrors(prev => ({ ...prev, timeRange: '' }))
                  }}
                  className="hidden"
                />
                <span className="text-sm text-gray-700">{range}</span>
              </label>
            ))}
          </div>
          {errors.timeRange && <p className="text-xs text-red-500">{errors.timeRange}</p>}
        </div>

        <div>
          <label className="block text-sm text-gray-700">Message</label>
          <textarea
            name="message"
            value={form.message}
            onChange={updateForm}
            rows={2}
            className={`w-full px-3 py-2 border ${errors.message ? 'border-red-500' : 'border-gray-200'} rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500`}
            placeholder="How can we help?"
          />
          {errors.message && <p className="text-xs text-red-500">{errors.message}</p>}
        </div>

        <div className="hidden">
          <input
            type="text"
            name="honeypot"
            value={form.honeypot}
            onChange={updateForm}
            className="hidden"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-700">
            What is {math.num1} + {math.num2}?
          </label>
          <input
            type="number"
            name="mathAnswer"
            value={form.mathAnswer}
            onChange={updateForm}
            className={`w-full px-3 py-2 border ${errors.mathAnswer ? 'border-red-500' : 'border-gray-200'} rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500`}
            placeholder="Answer"
          />
          {errors.mathAnswer && <p className="text-xs text-red-500">{errors.mathAnswer}</p>}
        </div>

        <Button variant='start' type="submit" disabled={submitting} className="w-full">
          {submitting ? 'Submitting...' : 'Submit'}
        </Button>
      </form>
    </div>
  )
}