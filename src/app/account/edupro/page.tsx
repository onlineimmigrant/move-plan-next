'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '@/context/AuthContext';
import AccountTab from '@/components/AccountTab';
import Toast from '@/components/Toast';
import { useStudentStatus } from '@/lib/StudentContext';

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
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
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

        const { data: activePurchases, error: purchaseError } = await supabase
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
          .eq('profiles_id', session.user.id)
          .eq('is_active', true) as { data: Purchase[] | null; error: any };

        if (purchaseError) {
          throw new Error(`Error fetching active purchases: ${purchaseError.message}`);
        }

        if (!activePurchases || activePurchases.length === 0) {
          setToast({ message: 'No active purchases found.', type: 'error' });
          setCourses([]);
          return;
        }

        console.log('Raw active purchases:', JSON.stringify(activePurchases, null, 2));

        activePurchases.forEach((purchase, index) => {
          const productTypeName = purchase.pricingplan?.product?.product_sub_type?.product_type?.name;
          const eduProCourseSlug = purchase.pricingplan?.product?.edu_pro_course?.slug;
          console.log(
            `Purchase ${index + 1}:`,
            {
              purchaseId: purchase.id,
              productTypeName: productTypeName || 'Not found',
              productName: purchase.pricingplan?.product?.product_name,
              productSlug: purchase.pricingplan?.product?.slug,
              productImage: purchase.pricingplan?.product?.links_to_image,
              pricingPlan: purchase.pricingplan
                ? `${purchase.pricingplan.package} (${purchase.pricingplan.measure})`
                : 'Not found',
              eduProCourseSlug: eduProCourseSlug || 'Not found',
              pricingplan: purchase.pricingplan,
              product: purchase.pricingplan?.product,
              productSubType: purchase.pricingplan?.product?.product_sub_type,
              productType: purchase.pricingplan?.product?.product_sub_type?.product_type,
              eduProCourse: purchase.pricingplan?.product?.edu_pro_course,
            }
          );
        });

        const coursePurchases = activePurchases.filter((purchase) => {
          const productTypeName = purchase.pricingplan?.product?.product_sub_type?.product_type?.name;
          return productTypeName === 'Course';
        });

        console.log('Filtered Course purchases:', JSON.stringify(coursePurchases, null, 2));

        if (!coursePurchases || coursePurchases.length === 0) {
          setToast({ message: 'No active Course purchases found.', type: 'error' });
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

  if (isLoading || studentLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
          <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
          <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
        </div>
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

        {courses.length === 0 ? (
          <p className="mt-4 text-gray-600">No active courses available at this time.</p>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {courses.map((course) => (
              <Link
                key={course.purchaseId}
                href={`/account/edupro/${course.eduProCourseSlug}`}
                className="group flex flex-col items-center justify-center p-6 bgфин-white rounded-lg shadow-sm hover:shadow-md hover:bg-sky-50 transition-all duration-300"
                title={course.product_name}
              >
                <div className="transform group-hover:scale-110 transition-transform">
                  <img
                    src={course.product_image}
                    alt={course.product_name}
                    className="w-16 h-16 object-cover rounded-md"
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