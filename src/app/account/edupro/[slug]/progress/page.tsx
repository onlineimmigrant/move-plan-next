'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '@/context/AuthContext';
import { useStudentStatus } from '@/lib/StudentContext';
import AccountTabEduProCourse from '@/components/edupro/AccountTabEduProCourse';
import Toast from '@/components/Toast';
import PracticeStatistics from '@/components/quiz/PracticeStatistics';
import PracticePassRateVisual from '@/components/quiz/PracticePassRateVisual';
import PracticeSettingsStatisticsVisuals from '@/components/quiz/PracticeSettingsStatisticsVisuals';
import ProgressStatisticsTopics from '@/components/quiz/ProgressStatisticsTopics'; // New import
import ProgressStatisticsCurrent from '@/components/quiz/ProgressStatisticsCurrent'; // New import

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
  const [showFullStats, setShowFullStats] = useState(false);
  const router = useRouter();
  const { slug } = useParams();
  const { session } = useAuth();
  const { isStudent, isLoading: studentLoading } = useStudentStatus();

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

        setCourseData(courseData);

        const { data: quizzesData, error: quizzesError } = await supabase
          .from('quiz_quizcommon')
          .select('id, title, description, slug, percent_required')
          .eq('course_id', courseData.id);

        if (quizzesError) {
          throw new Error(`Error fetching quizzes: ${quizzesError.message}`);
        }

        setQuizzes(quizzesData ?? []);

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
          <div className="w-4 h-4 bg-sky-600 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
          <div className="w-4 h-4 bg-sky-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
          <div className="w-4 h-4 bg-sky-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-red-600 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  if (!courseData) {
    return (
      <div className="min-h-screen pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-red-600 font-medium">Course data not available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto">
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
            aria-live="polite"
          />
        )}
        <div className="">
          <AccountTabEduProCourse />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
          <div className="hidden sm:block">
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
          <div className="col-span-1 md:col-span-1 lg:col-span-3">
           

        <div className="">
            {quizzes.length === 0 ? (
              <p className="text-gray-600"></p>
            ) : (
              quizzes.map((quiz) => (
                <div key={quiz.id} className="mb-6">
                  
                  <div className="">
   
                    {/* Add ProgressStatisticsTopics under PracticeSettingsStatisticsVisuals */}
                    <ProgressStatisticsTopics quizId={quiz.id} />
                  </div>
                </div>
              ))
            )}
          </div>

 <PracticeStatistics courseId={courseData.id} courseSlug={courseData.slug} />



          </div>
          <div className="col-span-1">
            {/* Add ProgressStatisticsCurrent in the third column */}
            {quizzes.map((quiz) => (
              <ProgressStatisticsCurrent key={quiz.id} quizId={quiz.id} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}