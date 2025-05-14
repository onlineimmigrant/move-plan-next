// components/AccountTabEduProCourse.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { useStudentStatus } from '@/lib/StudentContext';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '@/context/AuthContext';

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

// Define the EduProCourse interface (minimal for fetching the title)
interface EduProCourse {
  title: string; // Adjust this field name based on the actual column name in edu_pro_course
}

// Define the Purchase interface for fetching the pricing plan measure
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
  const { slug } = useParams(); // Get the slug from the URL
  const { isStudent, isLoading: studentLoading } = useStudentStatus();
  const { session } = useAuth();
  const [courseTitle, setCourseTitle] = useState<string>('Loading...');
  const [duration, setDuration] = useState<string>('Loading...');
  const [error, setError] = useState<string | null>(null);

  // Check if a purchase is active
  const isPurchaseActive = (purchase: Purchase) => {
    if (!purchase.is_active) return false;
    const currentDate = new Date();
    const startDate = new Date(purchase.start_date);
    const endDate = purchase.end_date ? new Date(purchase.end_date) : null;
    return currentDate >= startDate && (!endDate || currentDate <= endDate);
  };

  // Fetch the course title and duration based on the slug
  useEffect(() => {
    const fetchCourseData = async () => {
      if (!session || !slug) return;

      try {
        // Step 1: Fetch the edu_pro_course record to get the title and id
        const { data: courseData, error: courseError } = await supabase
          .from('edu_pro_course')
          .select('id, title') // Adjust the field name if necessary
          .eq('slug', slug)
          .single();

        if (courseError) {
          throw new Error(`Error fetching course title: ${courseError.message}`);
        }

        if (!courseData) {
          throw new Error('Course not found.');
        }

        setCourseTitle(courseData.title);

        // Step 2: Fetch the user's active purchases to get the pricing plan measure
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

        // Find the purchase that matches this course
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
        setDuration('N/A');
      }
    };

    if (slug && session) {
      fetchCourseData();
    }
  }, [slug, session]);

  const tabs: Tab[] = [
    { label: 'Content', href: `/account/edupro/${slug}` },
    { label: 'Study Plan', href: `/account/edupro/${slug}/study-plan` },
   // { label: 'Progress', href: `/account/edupro/${slug}/progress` },
  //  { label: 'Info', href: `/account/edupro/${slug}/info` },

  ];

  if (studentLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="flex justify-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
          <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
          <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
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
    <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${className}`}>
      <Link href="/account">
        <div className="mt-6 sm:mt-8 mb-4 sm:mb-6 text-center text-base">
          <span className="text-gray-500 font-light">{duration}</span>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 relative">
            {courseTitle}
            <span className="absolute -bottom-1 sm:-bottom-2 left-1/2 -translate-x-1/2 w-16 h-1 bg-sky-600 rounded-full" />
          </h1>
        </div>
      </Link>
      <nav className="flex flex-col sm:flex-row sm:gap-6 border-gray-200 pb-2">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`px-4 py-3 sm:px-3 sm:py-2 text-sm font-medium text-center sm:text-left  sm:rounded-none mb-2 sm:mb-0 transition ${
                isActive
                  ? 'bg-sky-50 text-sky-600 border-b-2 border-sky-600 sm:bg-transparent'
                  : 'text-gray-600 hover:bg-sky-50 hover:text-sky-600 hover:border-b-2 hover:border-sky-200'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}