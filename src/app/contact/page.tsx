'use client';

import Link from 'next/link';
import ContactForm from '@/components/ContactForm';
import { useSettings } from '@/context/SettingsContext';

export default function ContactPage() {
  const { settings } = useSettings();

  return (
    <div className="min-h-screen flex">
      {/* Left side: Gradient background */}
      <div className="hidden md:flex w-1/2 bg-gradient-to-b from-sky-400 to-sky-700 items-center justify-center">
        <div className="text-white text-center">
          <h1 className="tracking-widest text-xl sm:text-4xl font-extrabold bg-gradient-to-r from-sky-200 via-sky-300 to-white bg-clip-text text-transparent">
            Contact Us
          </h1>
          <p className="mt-4 text-2xl font-semibold tracking-wide text-white">
            We’re here to answer your questions!
          </p>
        </div>
      </div>

      {/* Right side: Contact form */}
      <div className="w-full md:w-1/2 transparent flex items-center justify-center py-12">
        <div className="w-full max-w-lg p-6 bg-transparent">
          <h1 className="my-8 text-center tracking-tight text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-sky-700 via-sky-500 to-sky-700 bg-clip-text text-transparent">
            Get in Touch
          </h1>

          <ContactForm />

          <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm text-gray-600">
            <Link href="/terms" className="text-sky-600 hover:text-sky-500 cursor-pointer">
              Terms of Service
            </Link>
            <Link href="/privacy-policy" className="text-sky-600 hover:text-sky-500 cursor-pointer">
              Privacy Policy
            </Link>
            <Link href="/cookie-policy" className="text-sky-600 hover:text-sky-500 cursor-pointer">
              Cookie Policy
            </Link>
            <Link href="/delivery-policy" className="text-sky-600 hover:text-sky-500 cursor-pointer">
              Delivery Policy
            </Link>
            <Link href="/return-policy" className="text-sky-600 hover:text-sky-500 cursor-pointer">
              Return Policy
            </Link>
            <Link href="/licensing" className="text-sky-600 hover:text-sky-500 cursor-pointer">
              Licensing Terms
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}