// app/contact/page.tsx
'use client';

import { memo, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import ContactForm from '@/components/ContactForm';
import { useSettings } from '@/context/SettingsContext';

const ContactPage = memo(() => {
  const { settings } = useSettings();
  const logoImage = settings.image;

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-sky-50/50">
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

        {/* Contact Form Container */}
        <div className="max-w-4xl mx-auto">
          <div className="rounded-2xl shadow-lg border border-gray-200 p-8 backdrop-blur-sm bg-white/95">
            <Suspense
              fallback={
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
                </div>
              }
            >
              <ContactForm />
            </Suspense>
          </div>
        </div>

        {/* Links Section */}
        <div className="mt-12 text-center">
          <div className="inline-flex flex-wrap gap-4 text-sm text-gray-600">
            <Link 
              href="/terms" 
              className="px-3 py-1 rounded-lg hover:bg-sky-50 text-sky-600 hover:text-sky-700 transition-colors duration-200"
            >
              Terms of Service
            </Link>
            <Link 
              href="/privacy-policy" 
              className="px-3 py-1 rounded-lg hover:bg-sky-50 text-sky-600 hover:text-sky-700 transition-colors duration-200"
            >
              Privacy Policy
            </Link>
            <Link 
              href="/cookie-policy" 
              className="px-3 py-1 rounded-lg hover:bg-sky-50 text-sky-600 hover:text-sky-700 transition-colors duration-200"
            >
              Cookie Policy
            </Link>
            <Link 
              href="/delivery-policy" 
              className="px-3 py-1 rounded-lg hover:bg-sky-50 text-sky-600 hover:text-sky-700 transition-colors duration-200"
            >
              Delivery Policy
            </Link>
            <Link 
              href="/return-policy" 
              className="px-3 py-1 rounded-lg hover:bg-sky-50 text-sky-600 hover:text-sky-700 transition-colors duration-200"
            >
              Return Policy
            </Link>
            <Link 
              href="/licensing" 
              className="px-3 py-1 rounded-lg hover:bg-sky-50 text-sky-600 hover:text-sky-700 transition-colors duration-200"
            >
              Licensing Terms
            </Link>
          </div>
        </div>

        {/* Back to Home */}
        <div className="mt-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center text-sky-600 hover:text-sky-700 font-medium transition-colors duration-200"
          >
            <Image src={logoImage} alt="Logo" width={24} height={24} className="mr-2" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
});

ContactPage.displayName = 'ContactPage';

export default ContactPage;