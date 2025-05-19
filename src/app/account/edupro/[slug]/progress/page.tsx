'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '@/context/AuthContext';
import { useStudentStatus } from '@/lib/StudentContext';
import AccountTabEduProCourse from '@/components/AccountTabEduProCourse';
import Toast from '@/components/Toast';
import PracticeStatistics from '@/components/PracticeStatistics';
import PracticePassRateVisual from '@/components/PracticePassRateVisual';
import PracticeSettingsStatisticsVisuals from '@/components/PracticeSettingsStatisticsVisuals'; // Corrected import

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Define the EduProCourse interface
interface EduProCourse {
  id: number;
  slug: string;
}

// Define the Quiz interface to match PracticePassRateVisualProps
interface Quiz {
  id: number;
  title: string;
  description: string | null;
  slug: string | null;
  percent_required: number;
}

interface Purchase {
  id: string;
  profiles_id: string;
  is_active: boolean;
  start_date: string;
  end_date: string | null;
  purchased_item_id: string;
  pricingplan: {
    product_id: string;
    product: {
      course_connected_id: number;
    };
  };
}

export default function EduProCourseProgress() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [courseData, setCourseData] = useState<EduProCourse | null>(null);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [showFullStats, setShowFullStats] = useState(false); // New state for toggling full stats
  const router = useRouter();
  const { slug } = useParams();
  const { session } = useAuth();
  const { isStudent, isLoading: studentLoading } = useStudentStatus();

  // Check if a purchase is active
  const isPurchaseActive = (purchase: Purchase) => {
    if (!purchase.is_active) return false;
    const currentDate = new Date();
    const startDate = new Date(purchase.start_date);
    const endDate = purchase.end_date ? new Date(purchase.end_date) : null;
    return currentDate >= startDate && (!endDate || currentDate <= endDate);
  };

  useEffect(() => {
    const verifyAccess = async () => {
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

        // Fetch the edu_pro_course record by slug
        const { data: courseData, error: courseError } = await supabase
          .from('edu_pro_course')
          .select('id, slug')
          .eq('slug', slug)
          .single();

        if (courseError) {
          throw new Error(`Error fetching course: ${courseError.message}`);
        }

        if (!courseData) {
          throw new Error('Course not found.');
        }

        // Store courseData in state
        setCourseData(courseData);

        // Fetch quizzes for the course
        const { data: quizzesData, error: quizzesError } = await supabase
          .from('quiz_quizcommon')
          .select('id, title, description, slug, percent_required')
          .eq('course_id', courseData.id);

        if (quizzesError) {
          throw new Error(`Error fetching quizzes: ${quizzesError.message}`);
        }

        // Store quizzes in state (default to empty array if null)
        setQuizzes(quizzesData ?? []);

        // Fetch the user's active purchases to verify access
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

        // Check if the user has an active purchase for this course
        const hasAccess = activePurchases.some((purchase) => {
          const isActive = isPurchaseActive(purchase);
          const courseId = purchase.pricingplan?.product?.course_connected_id;
          return isActive && courseId === courseData.id;
        });

        if (!hasAccess) {
          setToast({ message: 'You do not have access to this course.', type: 'error' });
          router.push('/account/edupro');
          return;
        }
      } catch (err) {
        console.error('EduProCourseProgress: Error:', err);
        setError((err as Error).message);
        setToast({ message: (err as Error).message, type: 'error' });
        router.push('/account/edupro');
      } finally {
        setIsLoading(false);
      }
    };

    verifyAccess();
  }, [slug, session, isStudent, studentLoading, router]);

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

  if (!courseData) {
    return (
      <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-red-600 font-medium">Course data not available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
            aria-live="polite"
          />
        )}
        <div className="pt-8">
          <AccountTabEduProCourse />
        </div>
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-5 gap-6">
          <div className=''>
            {quizzes.length === 0 ? (
              <p className="text-gray-600">No quizzes available for this course.</p>
            ) : (
              quizzes.map((quiz) => (
                <div key={quiz.id} className="mb-6">
                  
                  <PracticePassRateVisual quiz={quiz} />
                  <div className="mt-4">
                    <PracticeSettingsStatisticsVisuals
                      quizId={quiz.id}
                      courseId={courseData.id}
                      courseSlug={courseData.slug}
                      showFullStats={showFullStats}
                      setShowFullStats={setShowFullStats}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
          <div className='col-span-1 sm:col-span-3'>
            <PracticeStatistics courseId={courseData.id} courseSlug={courseData.slug} />
          </div>
          <div className='col-span-1'></div>
        </div>
      </div>
    </div>
  );
}