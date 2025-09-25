// app/contact/ContactPageClient.tsx
'use client';

import { memo, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import ContactForm from '@/components/contact/ContactForm';
import { useSettings } from '@/context/SettingsContext';

const ContactPageClient = memo(() => {
  const { settings } = useSettings();
  const logoImage = settings.image;

  return (
    <div className="mt-8  bg-gradient-to-br from-sky-50 via-white to-sky-50/50">
      <div className="container mx-auto px-4 py-8 sm:py-12">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-500 to-sky-600 shadow-lg mb-6">
            <ChatBubbleLeftRightIcon className="w-8 h-8 text-white" />
          </div>
          
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Contact Us
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Have a question or need support? We're here to help you with any inquiries about our services.
          </p>
        </div>

        {/* Contact Information Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {/* Email Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Email</h3>
            <p className="text-gray-600 mb-3">Send us an email and we'll get back to you within 24 hours.</p>
            <a href="mailto:contact@metexam.co.uk" className="text-sky-600 hover:text-sky-700 font-medium">
              contact@metexam.co.uk
            </a>
          </div>

          {/* Phone Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Phone</h3>
            <p className="text-gray-600 mb-3">Call us during business hours for immediate assistance.</p>
            <a href="tel:+442073281234" className="text-sky-600 hover:text-sky-700 font-medium">
              +44 207 328 1234
            </a>
          </div>

          {/* Support Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Support</h3>
            <p className="text-gray-600 mb-3">Access our help center for FAQs and documentation.</p>
            <Link href="/support" className="text-sky-600 hover:text-sky-700 font-medium">
              Help Center →
            </Link>
          </div>
        </div>

        {/* Contact Form Section */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Send us a message</h2>
              <p className="text-gray-600">
                Fill out the form below and we'll get back to you as soon as possible.
              </p>
            </div>
            
            <Suspense fallback={
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-24 bg-gray-200 rounded"></div>
                <div className="h-10 bg-gray-200 rounded w-1/3"></div>
              </div>
            }>
              <ContactForm />
            </Suspense>
          </div>
        </div>

        {/* Footer Note */}
        <div className="text-center mt-12 max-w-2xl mx-auto">
          <p className="text-gray-600">
            By contacting us, you agree to our{' '}
            <Link href="/privacy-policy" className="text-sky-600 hover:text-sky-700 underline">
              Privacy Policy
            </Link>{' '}
            and{' '}
            <Link href="/terms-of-service" className="text-sky-600 hover:text-sky-700 underline">
              Terms of Service
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
});

ContactPageClient.displayName = 'ContactPageClient';

export default ContactPageClient;
