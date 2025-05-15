// app/account/edupro/[slug]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '@/context/AuthContext';
import { useStudentStatus } from '@/lib/StudentContext';
import AccountTabEduProCourse from '@/components/AccountTabEduProCourse';
import StudyBooks from '@/components/StudyBooks';
import Practice from '@/components/Practice';
import Toast from '@/components/Toast';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Define the EduProCourse interface
interface EduProCourse {
  id: number;
  slug: string;
  title: string;
  description: string;
}

// Define the EduProTopic interface
interface EduProTopic {
  id: number;
  title: string;
  description: string;
  order: number;
  slug: string;
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

export default function EduProCourseDetail() {
  const [course, setCourse] = useState<EduProCourse | null>(null);
  const [topics, setTopics] = useState<EduProTopic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [activeTab, setActiveTab] = useState<'topics' | 'studyBooks' | 'practice'>('topics');
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
    const fetchCourseAndTopics = async () => {
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
          .select('id, slug, title, description')
          .eq('slug', slug)
          .single();

        if (courseError) {
          throw new Error(`Error fetching course: ${courseError.message}`);
        }

        if (!courseData) {
          throw new Error('Course not found.');
        }

        setCourse(courseData);

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

        const { data: courseTopics, error: courseTopicsError } = await supabase
          .from('edu_pro_coursetopic')
          .select(`
            edu_pro_topic (
              id,
              title,
              description,
              order,
              slug
            )
          `)
          .eq('course_id', courseData.id)
          .order('order', { ascending: true });

        if (courseTopicsError) {
          throw new Error(`Error fetching course topics: ${courseTopicsError.message}`);
        }

        const topicsData = courseTopics
          ? courseTopics.map((ct: any) => ct.edu_pro_topic).filter((topic: EduProTopic | null) => topic !== null)
          : [];
        setTopics(topicsData);
      } catch (err) {
        console.error('EduProCourseDetail: Error:', err);
        setError((err as Error).message);
        setToast({ message: (err as Error).message, type: 'error' });
        router.push('/account/edupro');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourseAndTopics();
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
        <div className="px-6">
          {course ? (
            <div>
              <div>
                {/* Tabbed navigation with proper ARIA roles */}
                <div className="flex sm:justify-center mb-4" role="tablist" aria-label="Course Sections">
                  {/* Topics Tab */}
                  <button
                    id="topics-tab"
                    role="tab"
                    aria-selected={activeTab === 'topics'}
                    aria-controls="topics-panel"
                    onClick={() => setActiveTab('topics')}
                    className={`flex-1 text-center p-3 border-gray-600 border-2 sm:border-none sm:flex-none sm:ml-4 text-md text-sm font-semibold 
                      ${
                        activeTab === 'topics'
                          ? 'bg-gray-100 sm:bg-gray-400 sm:text-white sm:rounded-full sm:shadow-md sm:scale-105 sm:transition-transform sm:px-2 sm:py-1'
                          : 'sm:bg-gray-600 sm:text-white sm:rounded-full sm:px-2 sm:py-1'
                      }`}
                  >
                    Topics
                  </button>
                  {/* Practice Tab */}
                  <button
                    id="practice-tab"
                    role="tab"
                    aria-selected={activeTab === 'practice'}
                    aria-controls="practice-panel"
                    onClick={() => setActiveTab('practice')}
                    className={`flex-1 text-center p-3 border-gray-600 border-2 sm:border-none sm:flex-none sm:ml-4 text-md text-sm font-semibold 
                      ${
                        activeTab === 'practice'
                          ? 'bg-gray-100 sm:bg-gray-400 sm:text-white sm:rounded-full sm:shadow-md sm:scale-105 sm:transition-transform sm:px-2 sm:py-1'
                          : 'sm:bg-gray-600 sm:text-white sm:rounded-full sm:px-2 sm:py-1'
                      }`}
                  >
                    Practice
                  </button>
                  {/* Books Tab */}
                  <button
                    id="studyBooks-tab"
                    role="tab"
                    aria-selected={activeTab === 'studyBooks'}
                    aria-controls="studyBooks-panel"
                    onClick={() => setActiveTab('studyBooks')}
                    className={`flex-1 text-center p-3 border-gray-600 border-2 sm:border-none sm:flex-none sm:ml-4 text-md text-sm font-semibold 
                      ${
                        activeTab === 'studyBooks'
                          ? 'bg-gray-100 sm:bg-gray-400 sm:text-white sm:rounded-full sm:shadow-md sm:scale-105 sm:transition-transform sm:px-2 sm:py-1'
                          : 'sm:bg-gray-600 sm:text-white sm:rounded-full sm:px-2 sm:py-1'
                      }`}
                  >
                    Books
                  </button>
                </div>

                {/* Tab panels */}
                <div>
                  {/* Topics Panel */}
                  <div
                    id="topics-panel"
                    role="tabpanel"
                    aria-labelledby="topics-tab"
                    hidden={activeTab !== 'topics'}
                  >
                    {topics.length > 0 ? (
                      <ul className="mt-2 grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {topics.map((topic) => (
                          <li
                            key={topic.id}
                            className="relative border-l-8 border-sky-600 pl-4 py-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
                          >
                            <span className="absolute top-2 right-2 flex items-center justify-center w-6 h-6 bg-sky-600 text-white text-xs font-medium rounded-full">
                              {topic.order}
                            </span>
                            <Link href={`/account/edupro/${course.slug}/topic/${topic.slug}`}>
                              <h3 className="text-sm font-medium text-gray-900 pr-8 hover:text-sky-600 transition-colors">
                                {topic.title}
                              </h3>
                              <p className="pr-8 text-sm text-gray-600 mt-1">
                                {topic.description || 'No description available.'}
                              </p>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2 text-gray-600 text-center">No topics available for this course.</p>
                    )}
                  </div>

                  {/* Practice Panel */}
                  <div
                    id="practice-panel"
                    role="tabpanel"
                    aria-labelledby="practice-tab"
                    hidden={activeTab !== 'practice'}
                  >
                    <Practice courseId={course.id} courseSlug={course.slug} />
                  </div>

                  {/* StudyBooks Panel */}
                  <div
                    id="studyBooks-panel"
                    role="tabpanel"
                    aria-labelledby="studyBooks-tab"
                    hidden={activeTab !== 'studyBooks'}
                  >
                    <StudyBooks courseId={course.id} />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-gray-600 text-center">No course details available.</p>
          )}
        </div>
      </div>
    </div>
  );
}