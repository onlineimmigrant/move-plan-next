'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { useStudentStatus } from '@/lib/StudentContext';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Tab {
  label: string;
  href: string;
}

interface AccountTabEduProCourseProps {
  className?: string;
}

interface EduProCourse {
  id: number;
  title: string;
  image: string | null;
}

interface Purchase {
  id: string;
  profiles_id: string;
  is_active: boolean;
  start_date: string;
  end_date: string | null;
  pricingplan: {
    measure: string;
    product: {
      course_connected_id: number;
    };
  };
}

export default function AccountTabEduProCourse({ className = '' }: AccountTabEduProCourseProps) {
  const pathname = usePathname();
  const { slug } = useParams();
  const { isStudent, isLoading: studentLoading } = useStudentStatus();
  const { session } = useAuth();
  const [courseTitle, setCourseTitle] = useState<string>('Loading...');
  const [courseImage, setCourseImage] = useState<string | null>(null);
  const [duration, setDuration] = useState<string>('Loading...');
  const [error, setError] = useState<string | null>(null);

  const fallbackImage = '/images/course-placeholder.svg';

  const isPurchaseActive = (purchase: Purchase) => {
    if (!purchase.is_active) return false;
    const currentDate = new Date();
    const startDate = new Date(purchase.start_date);
    const endDate = purchase.end_date ? new Date(purchase.end_date) : null;
    return currentDate >= startDate && (!endDate || currentDate <= endDate);
  };

  useEffect(() => {
    const fetchCourseData = async () => {
      if (!session || !slug) return;

      try {
        const { data: courseData, error: courseError } = await supabase
          .from('edu_pro_course')
          .select('id, title, image')
          .eq('slug', slug)
          .single();

        if (courseError) {
          throw new Error(`Error fetching course data: ${courseError.message}`);
        }

        if (!courseData) {
          throw new Error('Course not found.');
        }

        setCourseTitle(courseData.title);
        setCourseImage(courseData.image);

        const { data: activePurchases, error: purchaseError } = await supabase
          .from('purchases')
          .select(`
            id,
            profiles_id,
            is_active,
            start_date,
            end_date,
            pricingplan (
              measure,
              product (
                course_connected_id
              )
            )
          `)
          .eq('profiles_id', session.user.id)
          .eq('is_active', true) as { data: Purchase[] | null; error: any };

        if (purchaseError) {
          throw new Error(`Error fetching purchases: ${purchaseError.message}`);
        }

        if (!activePurchases || activePurchases.length === 0) {
          throw new Error('No active purchases found.');
        }

        const matchingPurchase = activePurchases.find((purchase) => {
          const isActive = isPurchaseActive(purchase);
          const courseId = purchase.pricingplan?.product?.course_connected_id;
          return isActive && courseId === courseData.id;
        });

        if (!matchingPurchase) {
          throw new Error('No active purchase found for this course.');
        }

        setDuration(matchingPurchase.pricingplan.measure || 'N/A');
      } catch (err) {
        console.error('AccountTabEduProCourse: Error:', err);
        setError((err as Error).message);
        setCourseTitle('Course Title Not Found');
        setCourseImage(null);
        setDuration('N/A');
      }
    };

    if (slug && session) {
      fetchCourseData();
    }
  }, [slug, session]);

  const tabs: Tab[] = [
    { label: 'Study', href: `/account/edupro/${slug}` },
    { label: 'Plan', href: `/account/edupro/${slug}/study-plan` },
    { label: 'Progress', href: `/account/edupro/${slug}/progress` },
  ];

  // Determine if a tab is active
  const isTabActive = (tab: Tab) => {
    if (tab.label === 'Study') {
      // Active for both exact match and topic subroutes
      return (
        pathname === tab.href ||
        pathname.startsWith(`/account/edupro/${slug}/topic/`) ||
        pathname.startsWith(`/account/edupro/${slug}/practice`)
      );
    }
    return pathname === tab.href;
  };

  // Determine the translate-x for the sliding background
  const getSliderPosition = () => {
    const activeIndex = tabs.findIndex((tab) => isTabActive(tab));
    if (activeIndex === 0) return 'translate-x-0';
    if (activeIndex === 1) return 'translate-x-[100%]';
    if (activeIndex === 2) return 'translate-x-[200%]';
    return 'translate-x-0'; // Default to first tab
  };

  if (studentLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="flex justify-center gap-2">
          <div className="w-4 h-4 bg-sky-600 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
          <div className="w-4 h-4 bg-sky-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
          <div className="w-4 h-4 bg-sky-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-red-600 font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div className={`-mt-2 mb-2 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${className}`}>
      {/* Logo */}
      <Image
        src="/images/logo.svg"
        alt="Logo"
        width={40}
        height={40}
        className="fixed left-4 hidden sm:block h-8 w-auto"
      />
      <Image
        src="/images/logo_collapsed.svg"
        alt="Logo mobile"
        width={40}
        height={40}
        className="fixed left-8 block sm:hidden h-8 w-auto"
      />

      {/* Course Header */}
      <Link href="/account">
        <div className="mt-0 mb-4 sm:mb-6 flex items-center justify-center gap-4">
          <div className="flex justify-between items-center">
            <div className="text-center hover:bg-sky-50 px-4 rounded-md">
              <span className="text-gray-500 font-normal text-sm sm:text-base">{duration}</span>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 relative">
                {courseTitle}
                <span className="absolute -bottom-1 sm:-bottom-2 left-1/2 -translate-x-1/2 w-16 h-1 bg-sky-600 rounded-full" />
              </h1>
            </div>
            {courseImage && (
              <Image
                src={courseImage || fallbackImage}
                alt={`${courseTitle} course image`}
                width={96}
                height={96}
                className="fixed right-8 z-51 top-2 hidden xl:block xl:w-12 xl:h-12  rounded-lg object-cover"
                priority
              />
            )}
          </div>
        </div>
      </Link>

      {/* Navigation Tabs with New Style */}
      <div className="select-none flex justify-center">
        <div className="relative w-full max-w-[480px] h-11 bg-transparent border-2 border-sky-600 rounded-lg cursor-pointer overflow-hidden px-0.5">
          {/* Sliding Background */}
          <div
            className={`absolute top-0.5 bottom-0.5 left-0.5 w-[calc(33.33%-2px)] bg-sky-600 rounded-md transition-transform duration-200 ease-in-out transform ${getSliderPosition()}`}
          ></div>
          {/* Tab Labels */}
          <div className="relative flex h-full">
            {tabs.map((tab, index) => (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex-1 flex justify-center items-center text-sky-600 text-sm sm:text-base mona-sans px-0.5 ${
                  isTabActive(tab) ? 'font-semibold text-white z-10' : ''
                }`}
              >
                {tab.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}