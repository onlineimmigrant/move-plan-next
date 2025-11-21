'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { useSettings } from '@/context/SettingsContext';
import { useStudentStatus } from '@/lib/StudentContext';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';


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
  const [isScrolled, setIsScrolled] = useState(false);



  const { settings } = useSettings();


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


  return (
    <>
      {/* Top Navbar */}
      <div
        className={`hidden bg-white sm:rounded-lg z-50 transition-all duration-200 ${
          isScrolled ? 'fixed top-0 left-0 right-0 shadow-md' : 'relative'
        } ${className}`}
      >
        <div className="max-w-7xl mx-auto px-8 sm:px-6 lg:px-8 py-2">
          <div className="flex items-center justify-center">
            {/* Course Header */}
            <div className="flex flex-col items-center">
              <span className="hidden sm:block text-white font-semibold text-xs  bg-slate-500 py-0 px-2">{duration}</span>
              <h1 className="text-base sm:text-xl font-bold text-gray-900 relative">
                {courseTitle}
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-16 h-1 bg-sky-600 rounded-full" />
              </h1>
            </div>
          </div>
        </div>
      </div>

    </>
  );
}