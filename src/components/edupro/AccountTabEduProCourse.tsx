'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { useSettings } from '@/context/SettingsContext';
import { useStudentStatus } from '@/lib/StudentContext';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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
  const [isScrolled, setIsScrolled] = useState(false);
  const [showBottomNavbar, setShowBottomNavbar] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const fallbackImage = '/images/course-placeholder.png';
  const { settings } = useSettings();
  const companyLogo = settings?.image || '/images/default-logo.png';

  const isPurchaseActive = (purchase: Purchase): boolean => {
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

        if (courseError) throw new Error(`Course error: ${courseError.message}`);
        if (!courseData) throw new Error('Course not found.');

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

        if (purchaseError) throw new Error(`Purchase error: ${purchaseError.message}`);
        if (!activePurchases || activePurchases.length === 0) throw new Error('No active purchases found.');

        const matchingPurchase = activePurchases.find((purchase) => {
          const isActive = isPurchaseActive(purchase);
          const courseId = purchase.pricingplan?.product?.course_connected_id;
          return isActive && courseId === courseData.id;
        });

        if (!matchingPurchase) throw new Error('No active purchase for this course.');

        setDuration(matchingPurchase.pricingplan.measure || 'N/A');
      } catch (err) {
        console.error('AccountTabEduProCourse: Error:', err);
        setError((err as Error).message);
        setCourseTitle('Course Not Found');
        setCourseImage(null);
        setDuration('N/A');
      }
    };

    if (slug && session) fetchCourseData();
  }, [slug, session]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollThreshold = window.innerHeight * 0.5;

      // Update top navbar scroll state
      setIsScrolled(currentScrollY > scrollThreshold);

      // Determine scroll direction
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down
        setShowBottomNavbar(false);
      } else {
        // Scrolling up
        setShowBottomNavbar(true);
      }

      // Update last scroll position
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const tabs: Tab[] = [
    { label: courseTitle, href: `/account/edupro/${slug}` },
    { label: 'Plan', href: `/account/edupro/${slug}/study-plan` },
    { label: 'Progress', href: `/account/edupro/${slug}/progress` },
  ];

  const isTabActive = (tab: Tab): boolean => {
    if (tab.label === courseTitle) {
      return (
        pathname === tab.href ||
        pathname.startsWith(`/account/edupro/${slug}/topic/`) ||
        pathname.startsWith(`/account/edupro/${slug}/practice`)
      );
    }
    return pathname === tab.href;
  };

  const getSliderPosition = (): string => {
    const activeIndex = tabs.findIndex((tab) => isTabActive(tab));
    return `translate-x-[${activeIndex * 100}%]`;
  };



  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-red-600 font-medium">{error}</p>
      </div>
    );
  }

  return (
    <>
      {/* Top Navbar */}
      <div
        className={`bg-white sm:rounded-lg z-50 transition-all duration-200 ${
          isScrolled ? 'fixed top-0 left-0 right-0 shadow-md px-4' : 'relative'
        } ${className}`}
      >
        <div className="max-w-7xl mx-auto  sm:px-6 lg:px-8 py-2">
          <div className="flex items-center justify-center sm:justify-between">
            {/* Logo on Desktop */}
            <Link href="/account" className="hidden sm:block">
              <Image
                src={companyLogo}
                alt="Company Logo"
                width={40}
                height={40}
                className="h-10 w-auto rounded-full hover:scale-110 transition-transform duration-200"
              />
            </Link>
            {/* Navigation Tabs */}
            <div className="select-none flex justify-center w-full sm:w-[480px] mx-auto">
              <div className="relative w-full sm:w-[480px] h-11 bg-transparent border-2 border-sky-600 rounded-lg cursor-pointer px-0.5 overflow-hidden">
                <div
                  className={`absolute top-0.5 bottom-0.5 left-0.5 w-[calc(33.33%-2px)] bg-sky-600 rounded-md transition-transform duration-200 ease-in-out transform ${getSliderPosition()}`}
                />
                <div className="relative flex h-full">
                  {tabs.map((tab) => (
                    <Link
                      key={tab.href}
                      href={tab.href}
                      className={`flex-1 px-0.5 flex justify-center items-center text-sky-600 text-sm sm:text-sm font-medium font-mona-sans ${
                        isTabActive(tab) ? 'font-semibold text-white z-10' : ''
                      }`}
                    >
                      {tab.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
            {/* Empty div to balance flex on desktop */}
            <div className="hidden sm:block  pl-12  py-2 "><Link className="text-sm font-medium bg-amber-200 p-2 ring-amber-400 rounded-full" href="/account/edupro/memory-hub">Memory Hub</Link></div>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Navbar with Logo on Mobile */}
      <div
        className={`fixed bottom-0 left-0 right-0 bg-white shadow-md z-61 sm:hidden transition-transform duration-300 ${
          showBottomNavbar ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 py-2 flex justify-between items-center">
          <Link href="/account">
            <Image
              src={companyLogo}
              alt="Company Logo"
              width={40}
              height={40}
              className="h-10 w-auto rounded-full hover:scale-110 transition-transform duration-200"
            />
          </Link>
          <Link href="/account/edupro/memory-hub"  className="text-sm font-medium bg-amber-200 p-2 ring-amber-400 rounded-full">Memory Hub</Link>
        </div>
      </div>
    </>
  );
}