'use client';

import { useState, useEffect, useRef } from 'react';
import { FaEnvelope, FaPhone, FaTelegramPlane, FaWhatsapp } from 'react-icons/fa';
//import emailjs from '@emailjs/browser';
import Toast from './Toast';
import Button from '@/ui/Button';

interface ContactFormProps {
  onSuccess?: () => void;
}

export default function ContactForm({ onSuccess }: ContactFormProps) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultTomorrowDate = tomorrow.toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
    honeypot: '',
    mathAnswer: '',
    preferredContact: 'email',
  });
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTimeRange, setSelectedTimeRange] = useState('');
  const [dateMode, setDateMode] = useState('any');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [mathQuestion, setMathQuestion] = useState({ num1: 0, num2: 0, answer: 0 });
  const datePickerRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.ceil(Math.random() * 8) + 1;
    setMathQuestion({ num1, num2, answer: num1 + num2 });
  }, []);

  const timeRanges = ['8:00 AM - 12:00 PM', '12:00 PM - 4:00 PM', '4:00 PM - 8:00 PM', '8:00 PM - 12:00 AM'];

  const contactMethods = [
    { value: 'email', label: 'Email', icon: <FaEnvelope className="text-lg" /> },
    { value: 'phone', label: 'Phone', icon: <FaPhone className="text-lg" /> },
    { value: 'telegram', label: 'Telegram', icon: <FaTelegramPlane className="text-lg" /> },
    { value: 'whatsapp', label: 'WhatsApp', icon: <FaWhatsapp className="text-lg" /> },
  ];

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\+?\d{10,15}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Invalid phone number format';
    }
    if (!formData.message.trim()) newErrors.message = 'Message is required';
    if (formData.honeypot) newErrors.honeypot = 'Bot detected';
    if (!formData.mathAnswer || parseInt(formData.mathAnswer) !== mathQuestion.answer) {
      newErrors.mathAnswer = 'Incorrect answer. Please try again.';
    }
    return newErrors;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleDateModeChange = (mode: string) => {
    setDateMode(mode);
    if (mode === 'any') {
      setSelectedDate('');
      setShowDatePicker(false);
    } else if (mode === 'choose') {
      setSelectedDate(defaultTomorrowDate);
      setShowDatePicker(true);
      setTimeout(() => datePickerRef.current?.focus(), 0);
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
    setShowDatePicker(false);
    if (errors.date) setErrors((prev) => ({ ...prev, date: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setShowSuccessToast(false);

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      if (validationErrors.honeypot) console.log('Bot detected via honeypot');
      return;
    }

    setIsSubmitting(true);
    try {
      const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
      const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
      const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;
      const recipientEmail = process.env.NEXT_PUBLIC_EMAILJS_RECIPIENT_EMAIL || 'support@metexam.co.uk';

      if (!serviceId || !templateId || !publicKey) {
        throw new Error('EmailJS environment variables are not defined');
      }

      const formattedDate = selectedDate
        ? new Date(selectedDate).toLocaleDateString('en-US', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          })
        : 'No preference';
      const timeRange = selectedTimeRange || 'No preference';

      const enhancedMessage = `${formData.message}\n\nPreferred Contact Method: ${formData.preferredContact}\nPreferred Date: ${formattedDate}\nPreferred Time Range: ${timeRange}`;

      const templateParams = {
        from_name: formData.name,
        from_email: formData.email,
        phone: formData.phone,
        message: enhancedMessage,
        to_email: recipientEmail,
        preferredContact: formData.preferredContact, // Added for template
        formattedDate: formattedDate, // Added for template
        timeRange: timeRange, // Added for template
      };

      console.log('Sending EmailJS request with params:', {
        serviceId,
        templateId,
        publicKey,
        templateParams,
      });

      const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: serviceId,
          template_id: templateId,
          user_id: publicKey,
          template_params: templateParams,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('EmailJS API error:', errorText);
        throw new Error(errorText || 'Failed to send email');
      }

      setShowSuccessToast(true);
      setFormData({ name: '', email: '', phone: '', message: '', honeypot: '', mathAnswer: '', preferredContact: 'email' });
      setSelectedDate('');
      setDateMode('any');
      setShowDatePicker(false);
      setSelectedTimeRange('');
      const num1 = Math.floor(Math.random() * 10) + 1;
      const num2 = Math.ceil(Math.random() * 8) + 1;
      setMathQuestion({ num1, num2, answer: num1 + num2 });
      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error('Error sending email:', {
        message: error.message,
        stack: error.stack,
      });
      let errorMessage = 'An error occurred while sending. Please try again.';
      if (error.message.includes('Service not found')) errorMessage = 'Invalid Service ID.';
      else if (error.message.includes('Template not found')) errorMessage = 'Invalid Template ID.';
      else if (error.message.includes('User not found')) errorMessage = 'Invalid Public Key.';
      else if (error.message.includes('Rate limit')) errorMessage = 'Rate limit exceeded. Try later.';
      else if (error.message.includes('recipients address')) errorMessage = 'Recipient email is missing. Please contact support.';
      setErrors({ submit: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {errors.submit && <p className="text-red-500 text-center">{errors.submit}</p>}
      {showSuccessToast && (
        <Toast
          message="Message sent successfully! We’ll get back to you soon."
          type="success"
          onClose={() => setShowSuccessToast(false)}
          duration={5000}
        />
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={`w-full px-4 py-2 border ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            } rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500`}
            placeholder="Your name"
          />
          {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={`w-full px-4 py-2 border ${
              errors.email ? 'border-red-500' : 'border-gray-300'
            } rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500`}
            placeholder="example@email.com"
          />
          {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
            Phone
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className={`w-full px-4 py-2 border ${
              errors.phone ? 'border-red-500' : 'border-gray-300'
            } rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500`}
            placeholder="+44 123 456 7890"
          />
          {errors.phone && <p className="mt-1 text-sm text-red-500">{errors.phone}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Preferred Contact Method (Optional)
          </label>
          <div className="grid grid-cols-2 gap-2">
            {contactMethods.map((method, index) => (
              <label
                key={method.value}
                className={`flex items-center justify-center px-4 py-2 border ${
                  errors[method.value] ? 'border-red-500' : 'border-gray-300'
                } rounded-md cursor-pointer transition-colors ${
                  formData.preferredContact === method.value
                    ? 'bg-sky-100 border-sky-500'
                    : 'bg-white hover:bg-sky-50'
                }`}
              >
                <input
                  type="radio"
                  name="preferredContact"
                  value={method.value}
                  checked={formData.preferredContact === method.value}
                  onChange={handleChange}
                  className="sr-only"
                />
                <div className="flex items-center space-x-2">
                  {method.icon}
                  <span className="text-sm text-gray-700">{method.label}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Preferred Date (Optional)
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label
              className={`flex items-center justify-center px-4 py-2 border ${
                errors['any'] ? 'border-red-500' : 'border-gray-300'
              } rounded-md cursor-pointer transition-colors ${
                dateMode === 'any' ? 'bg-sky-100 border-sky-500' : 'bg-white hover:bg-sky-50'
              }`}
            >
              <input
                type="radio"
                name="dateMode"
                value="any"
                checked={dateMode === 'any'}
                onChange={() => handleDateModeChange('any')}
                className="sr-only"
              />
              <span className="text-sm text-gray-700">Any Date</span>
            </label>
            <label
              className={`flex items-center justify-center px-4 py-2 border ${
                errors['choose'] ? 'border-red-500' : 'border-gray-300'
              } rounded-md cursor-pointer transition-colors ${
                dateMode === 'choose' ? 'bg-sky-100 border-sky-500' : 'bg-white hover:bg-sky-50'
              }`}
            >
              <input
                type="radio"
                name="dateMode"
                value="choose"
                checked={dateMode === 'choose'}
                onChange={() => handleDateModeChange('choose')}
                className="sr-only"
              />
              <span className="text-sm text-gray-700">Choose Date</span>
            </label>
          </div>
          {showDatePicker && (
            <input
              type="date"
              ref={datePickerRef}
              value={selectedDate}
              onChange={handleDateChange}
              onBlur={() => setShowDatePicker(false)}
              min={new Date().toISOString().split('T')[0]}
              className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
              autoFocus
            />
          )}
          {errors.date && <p className="mt-1 text-sm text-red-500">{errors.date}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Preferred Time Range (Optional)
          </label>
          <div className="grid grid-cols-2 gap-2">
            {timeRanges.map((range, index) => (
              <label
                key={range}
                className={`flex items-center justify-center px-4 py-2 border ${
                  errors[range] ? 'border-red-500' : 'border-gray-300'
                } rounded-md cursor-pointer transition-colors ${
                  selectedTimeRange === range ? 'bg-sky-100 border-sky-500' : 'bg-white hover:bg-sky-50'
                }`}
              >
                <input
                  type="radio"
                  name="timeRange"
                  value={range}
                  checked={selectedTimeRange === range}
                  onChange={(e) => {
                    setSelectedTimeRange(e.target.value);
                    if (errors.timeRange) setErrors((prev) => ({ ...prev, timeRange: '' }));
                  }}
                  className="sr-only"
                />
                <span className="text-sm text-gray-700">{range}</span>
              </label>
            ))}
          </div>
          {errors.timeRange && <p className="mt-1 text-sm text-red-500">{errors.timeRange}</p>}
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700">
            Message
          </label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            rows={2}
            className={`w-full px-4 py-2 border ${
              errors.message ? 'border-red-500' : 'border-gray-300'
            } rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500`}
            placeholder="Tell us how we can help..."
          />
          {errors.message && <p className="mt-1 text-sm text-red-500">{errors.message}</p>}
        </div>

        <div className="hidden">
          <label htmlFor="honeypot" className="sr-only">
            Leave this field empty
          </label>
          <input
            type="text"
            id="honeypot"
            name="honeypot"
            value={formData.honeypot}
            onChange={handleChange}
            className="hidden"
          />
        </div>

        <div>
          <label htmlFor="mathAnswer" className="block text-sm font-medium text-gray-700">
            What is {mathQuestion.num1} + {mathQuestion.num2}?
          </label>
          <input
            type="number"
            id="mathAnswer"
            name="mathAnswer"
            value={formData.mathAnswer}
            onChange={handleChange}
            className={`w-full px-4 py-2 border ${
              errors.mathAnswer ? 'border-red-500' : 'border-gray-300'
            } rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500`}
            placeholder="Enter answer"
          />
          {errors.mathAnswer && <p className="mt-1 text-sm text-red-500">{errors.mathAnswer}</p>}
        </div>

        <div className="text-center">
          <Button
            type="submit"
            variant='start'
            disabled={isSubmitting}
                     >
            {isSubmitting ? 'Sending...' : 'Send Message'}
          </Button>
        </div>
      </form>
    </div>
  );
}