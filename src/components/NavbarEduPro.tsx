// src/components/NavbarEduPro.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';

export default function NavbarEduPro() {
  const { session } = useAuth();
  const params = useParams();
  const slug = params?.slug as string;
  const [courseTitle, setCourseTitle] = useState<string>('EduPro'); // Fallback title

  useEffect(() => {
    const fetchCourseTitle = async () => {
      if (!slug) return;

      try {
        const { data, error } = await supabase
          .from('edu_pro_course')
          .select('title')
          .eq('slug', slug)
          .single();

        if (error) {
          console.error('Error fetching course title:', error);
          return;
        }

        if (data?.title) {
          setCourseTitle(data.title);
        }
      } catch (err) {
        console.error('Unexpected error:', err);
      }
    };

    fetchCourseTitle();
  }, [slug]);

  return (
    <nav className="fixed top-0 left-0 right-0 bg-transparent z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link href={`/account/edupro/${slug}`}>
              <span className="px-4 text-base font-medium text-gray-300 hover:text-gray-700">{courseTitle}</span>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-4">
            <Link
              href={`/account/edupro/${slug}`}
              className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
            >
              Practice
            </Link>
          </div>

          {/* Mobile Menu (Simplified) */}
          <div className="sm:hidden flex items-center">
            <button
              type="button"
              className="text-gray-600 hover:text-gray-900 focus:outline-none"
              aria-label="Toggle menu"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}