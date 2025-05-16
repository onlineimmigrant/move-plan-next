// src/components/NavbarEduPro.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { HiCog } from "react-icons/hi";
import Tooltip from './Tooltip';
import Image from 'next/image';

export default function NavbarEduPro() {
  const { session } = useAuth();
  const params = useParams();
  const slug = params?.slug as string;
  const [courseTitle, setCourseTitle] = useState<string>('EduPro');
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

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

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const viewportHeight = window.innerHeight;
      const scrollThreshold = viewportHeight * 0.1; // 5% of viewport height

      // Hide navbar if scrolled past 5% and scrolling down
      if (scrollY > scrollThreshold && scrollY > lastScrollY) {
        setIsVisible(false);
      }
      // Show navbar if near top or scrolling up
      else if (scrollY <= scrollThreshold || scrollY < lastScrollY) {
        setIsVisible(true);
      }

      setLastScrollY(scrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <nav
      className={`fixed top-0 left-0  right-0 sm:bg-transparent bg-transparent backdrop-blur-sm z-50 transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      <div className="max-w-7xl mx-auto px-8">
        <div className="flex justify-between h-12 items-center">
         <Image src="/images/logo.svg" alt="Logo" width={40} height={40} className="hidden sm:block h-8 w-auto" />
          {/* Course Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link href={`/account/edupro/${slug}`}>
              <span className="sm:text-xl text-base font-medium sm:font-semibold text-gray-900 relative tracking-tighter">
                {courseTitle}
                <span className="absolute -bottom-2 sm:-bottom-2 left-1/2 -translate-x-1/2 w-16 h-1 bg-sky-600 rounded-full" />
              </span>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center space-x-4">
            <Tooltip content="Settings">
              <Link
                href={`/account/edupro/${slug}/practice`}
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-xl"
              >
                <HiCog />
              </Link>
            </Tooltip>
          </div>
        </div>
      </div>
    </nav>
  );
}