// app/contact/page.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import ContactForm from '@/components/ContactForm';
import { useSettings } from '@/context/SettingsContext';

export default function ContactPage() {
  const { settings } = useSettings();
  const logoImage = settings.image;
  const backgroundColor = settings.footer_color;

  return (
    <div className="min-h-screen flex">
      {/* Left side: Gradient background */}
      <div className={`hidden md:flex w-1/2 bg-${backgroundColor} items-center justify-center`}>
        <div className="text-white text-center">
          <Link href="/">
            <h1 className="text-xl sm:text-4xl font-extrabold bg-gradient-to-r from-sky-200 via-sky-300 to-white bg-clip-text text-transparent">
              Contact Us
            </h1>
          </Link>
          <p className="mt-4 text-2xl font-semibold tracking-wide text-white">
            We’re here to answer your questions!
          </p>
        </div>
      </div>

      {/* Right side: Contact form */}
      <div className="w-full md:w-1/2 transparent flex items-center justify-center">
        <div className="w-full max-w-lg px-6 bg-transparent">
          <Link href="/">
            <span className="my-4 flex justify-right">
              <Image src={logoImage} alt="Logo" width={40} height={40} className="h-8 w-auto" />
            </span>
          </Link>
          <h1 className="my-2 text-center tracking-tight text-xl sm:text-2xl font-extrabold text-gray-700 bg-clip-text">
            Get in Touch
          </h1>

          <ContactForm />

          <div className="mt-4 flex flex-wrap justify-center gap-x-4 text-sm text-gray-600">
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