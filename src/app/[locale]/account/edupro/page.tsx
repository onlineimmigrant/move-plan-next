'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '@/context/AuthContext';
import AccountTab from '@/components/AccountTab';
import Toast from '@/components/Toast';
import { useStudentStatus } from '@/lib/StudentContext';
import Loading from '@/ui/Loading';
import Tooltip from '@/components/Tooltip';
import { FiRefreshCw } from 'react-icons/fi';
import { useAccountTranslations } from '@/components/accountTranslationLogic/useAccountTranslations';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Define TypeScript interfaces for the Supabase query response
interface EduProCourse {
  id: number;
  slug: string;
}

interface Product {
  id: string;
  course_connected_id: number;
  product_name: string;
  slug: string;
  links_to_image: string;
  product_sub_type: {
    product_type_name: string;
    product_type: {
      name: string;
    };
  };
  edu_pro_course: EduProCourse;
}

interface PricingPlan {
  product_id: string;
  package: string;
  measure: string;
  product: Product;
}

interface Purchase {
  id: string;
  profiles_id: string;
  is_active: boolean;
  start_date: string;
  end_date: string | null;
  purchased_item_id: string;
  pricingplan: PricingPlan;
}

interface Course {
  purchaseId: string;
  id: string;
  product_name: string;
  product_slug: string;
  product_image: string;
  pricing_plan: string;
  purchased_item_id: string;
  is_active: boolean;
  start_date: string;
  end_date: string | null;
  eduProCourseSlug: string;
}

export default function EduPro() {
  const { t } = useAccountTranslations();
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [showAllCourses, setShowAllCourses] = useState(false); // State for toggling active/all courses
  const router = useRouter();
  const { isStudent, isLoading: studentLoading } = useStudentStatus();
  const { session } = useAuth();

  // Format date for end_date (e.g., "01 May 2025") or return "Permanent"
  const formatShortDate = (date: string | null) => {
    if (!date) return 'Permanent';
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(date));
  };

  // Check if a purchase is active
  const isPurchaseActive = (course: Course) => {
    if (!course.is_active) return false;
    const currentDate = new Date();
    const startDate = new Date(course.start_date);
    const endDate = course.end_date ? new Date(course.end_date) : null;
    return currentDate >= startDate && (!endDate || currentDate <= endDate);
  };

  // Sync purchases with Stripe
  const syncAndFetchPurchases = useCallback(async () => {
    if (!session) return;

    setIsLoading(true);
    setError(null);
    try {
      // Sync transactions with Stripe
      const syncResponse = await fetch('/api/transactions/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!syncResponse.ok) {
        const errorData = await syncResponse.json();
        throw new Error(errorData.error || 'Failed to sync transactions with Stripe');
      }

      // Fetch updated purchases after sync
      const { data: purchases, error: purchaseError } = await supabase
        .from('purchases')
        .select(`
          id,
          profiles_id,
          is_active,
          start_date,
          end_date,
          purchased_item_id,
          pricingplan (
            product_id,
            package,
            measure,
            product (
              id,
              product_name,
              slug,
              links_to_image,
              course_connected_id,
              product_sub_type (
                product_type_name,
                product_type (
                  name
                )
              ),
              edu_pro_course!course_connected_id (
                id,
                slug
              )
            )
          )
        `)
        .eq('profiles_id', session.user.id) as { data: Purchase[] | null; error: any };

      if (purchaseError) {
        throw new Error(`Error fetching purchases: ${purchaseError.message}`);
      }

      if (!purchases || purchases.length === 0) {
        setToast({ message: 'No purchases found.', type: 'error' });
        setCourses([]);
        return;
      }

      const coursePurchases = purchases.filter((purchase) => {
        const productTypeName = purchase.pricingplan?.product?.product_sub_type?.product_type?.name;
        return productTypeName === 'Course';
      });

      if (!coursePurchases || coursePurchases.length === 0) {
        setToast({ message: 'No Course purchases found.', type: 'error' });
        setCourses([]);
        return;
      }

      const mappedCourses: Course[] = coursePurchases.map((purchase) => {
        const pricingplan = purchase.pricingplan;
        const product = pricingplan?.product;
        const eduProCourse = product?.edu_pro_course;
        if (!pricingplan || !product || !eduProCourse) {
          throw new Error(`Pricing plan, product, or edu_pro_course not found for purchase ${purchase.id}`);
        }
        return {
          purchaseId: purchase.id,
          id: product.id,
          product_name: product.product_name,
          product_slug: product.slug,
          product_image: product.links_to_image,
          pricing_plan: `${pricingplan.package} (${pricingplan.measure})`,
          purchased_item_id: purchase.purchased_item_id,
          is_active: purchase.is_active,
          start_date: purchase.start_date,
          end_date: purchase.end_date,
          eduProCourseSlug: eduProCourse.slug,
        };
      });

      setCourses(mappedCourses);
      setToast({ message: 'Courses synced successfully', type: 'success' });
    } catch (err) {
      console.error('EduPro: Error:', err);
      setError((err as Error).message);
      setToast({ message: (err as Error).message || 'Failed to sync courses', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  useEffect(() => {
    const checkStudentStatus = async () => {
      if (studentLoading) return;

      setIsLoading(true);
      try {
        if (!session) {
          setToast({ message: 'You must be logged in to access this page.', type: 'error' });
          router.push('/login');
          return;
        }

        if (!isStudent) {
          setToast({ message: 'Access denied: You are not enrolled as a student.', type: 'error' });
          router.push('/account');
          return;
        }

        const { data: purchases, error: purchaseError } = await supabase
          .from('purchases')
          .select(`
            id,
            profiles_id,
            is_active,
            start_date,
            end_date,
            purchased_item_id,
            pricingplan (
              product_id,
              package,
              measure,
              product (
                id,
                product_name,
                slug,
                links_to_image,
                course_connected_id,
                product_sub_type (
                  product_type_name,
                  product_type (
                    name
                  )
                ),
                edu_pro_course!course_connected_id (
                  id,
                  slug
                )
              )
            )
          `)
          .eq('profiles_id', session.user.id) as { data: Purchase[] | null; error: any };

        if (purchaseError) {
          throw new Error(`Error fetching purchases: ${purchaseError.message}`);
        }

        if (!purchases || purchases.length === 0) {
          setToast({ message: 'No purchases found.', type: 'error' });
          setCourses([]);
          return;
        }

        console.log('Raw purchases:', JSON.stringify(purchases, null, 2));

        const coursePurchases = purchases.filter((purchase) => {
          const productTypeName = purchase.pricingplan?.product?.product_sub_type?.product_type?.name;
          return productTypeName === 'Course';
        });

        console.log('Filtered Course purchases:', JSON.stringify(coursePurchases, null, 2));

        if (!coursePurchases || coursePurchases.length === 0) {
          setToast({ message: 'No Course purchases found.', type: 'error' });
          setCourses([]);
          return;
        }

        const mappedCourses: Course[] = coursePurchases.map((purchase) => {
          const pricingplan = purchase.pricingplan;
          const product = pricingplan?.product;
          const eduProCourse = product?.edu_pro_course;
          if (!pricingplan || !product || !eduProCourse) {
            throw new Error(`Pricing plan, product, or edu_pro_course not found for purchase ${purchase.id}`);
          }
          return {
            purchaseId: purchase.id,
            id: product.id,
            product_name: product.product_name,
            product_slug: product.slug,
            product_image: product.links_to_image,
            pricing_plan: `${pricingplan.package} (${pricingplan.measure})`,
            purchased_item_id: purchase.purchased_item_id,
            is_active: purchase.is_active,
            start_date: purchase.start_date,
            end_date: purchase.end_date,
            eduProCourseSlug: eduProCourse.slug,
          };
        });

        console.log('Mapped courses:', JSON.stringify(mappedCourses, null, 2));
        setCourses(mappedCourses);
      } catch (err) {
        console.error('EduPro: Error:', err);
        setError((err as Error).message);
        setToast({ message: (err as Error).message, type: 'error' });
        router.push('/account');
      } finally {
        setIsLoading(false);
      }
    };

    checkStudentStatus();
  }, [router, isStudent, studentLoading, session]);

  // Handle sync and show toast
  const handleSync = async () => {
    try {
      await syncAndFetchPurchases();
    } catch (error) {
      setToast({ message: (error as Error).message || 'Failed to sync courses', type: 'error' });
    }
  };

  // Filter courses based on showAllCourses state
  const displayedCourses = showAllCourses
    ? courses
    : courses.filter((course) => isPurchaseActive(course));

  // Check if there are any expired courses
  const hasExpiredCourses = courses.some((course) => !isPurchaseActive(course));

  if (isLoading || studentLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loading />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-red-600 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
            aria-live="polite"
          />
        )}
        <div className="pt-8">
          <AccountTab />
        </div>

        <div className="mt-6 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Tooltip content="Sync Courses with Stripe">
              <button
                onClick={handleSync}
                className="cursor-pointer text-sky-600 hover:text-gray-700 transition duration-150"
                aria-label="Sync courses"
                disabled={isLoading}
              >
                {isLoading ? (
                  <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8 8 8 0 01-8-8z" />
                  </svg>
                ) : (
                  <FiRefreshCw className="h-6 w-6" />
                )}
              </button>
            </Tooltip>
            <h2 className="text-lg font-medium text-gray-900">
              {showAllCourses ? 'All Courses' : 'Active Courses'}
            </h2>
          </div>
          {hasExpiredCourses && (
            <Tooltip content="Show Active/All Courses">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={showAllCourses}
                  onChange={() => setShowAllCourses(!showAllCourses)}
                  className="sr-only peer"
                  aria-label="Toggle between active and all courses"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-sky-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
              </label>
            </Tooltip>
          )}
        </div>

        {displayedCourses.length === 0 ? (
          <div className="mt-4 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {showAllCourses ? 'No courses found' : 'No active courses found'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {showAllCourses
                ? 'You haven’t purchased any courses yet.'
                : 'You don’t have any active courses at this time.'}
            </p>
            <div className="mt-4 max-w-sm mx-auto">
              <button
                onClick={handleSync}
                className="bg-sky-600 text-white hover:bg-sky-700 focus:ring-sky-500 rounded-md px-4 py-2 text-sm font-medium transition duration-150"
                aria-label="Sync courses"
                disabled={isLoading}
              >
                Sync Courses
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-8 sm:gap-x-16 sm:grid-cols-2 lg:grid-cols-4">
            {displayedCourses.map((course) => (
              <Link
                key={course.purchaseId}
                href={`/account/edupro/${course.eduProCourseSlug}`}
                className="group flex flex-col items-center justify-center p-6 bg-white rounded-lg shadow-sm hover:shadow-md hover:bg-sky-50 transition-all duration-300"
                title={course.product_name}
              >
                <div className="transform group-hover:scale-110 transition-transform">
                  <img
                    src={course.product_image}
                    alt={course.product_name}
                    className="w-auto h-16 object-cover rounded-md"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder-image.jpg';
                    }}
                  />
                </div>
                <span className="mt-3 text-sm font-medium text-gray-800 group-hover:text-sky-600 text-center">
                  {course.product_name}
                </span>
                <span className="mt-1 text-xs text-gray-500 text-center">
                  {course.pricing_plan}
                </span>
                <span className="mt-1 text-xs font-medium text-gray-700 text-center">
                  {formatShortDate(course.end_date)}
                </span>
                {isPurchaseActive(course) ? (
                  <span className="mt-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Active
                  </span>
                ) : (
                  <span className="mt-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-50 text-gray-400">
                    Expired
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}