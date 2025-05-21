// app/account/edupro/[slug]/topic/[topicSlug]/page.tsx
'use client';

import { useState, useEffect, Dispatch, SetStateAction } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '@/context/AuthContext';
import { useStudentStatus } from '@/lib/StudentContext';
import AccountTabEduProCourse from '@/components/AccountTabEduProCourse';
import TabNavigation from '@/components/TheoryPracticeBooksTabs/TabNavigation';
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

// Define the EduProLesson interface
interface EduProLesson {
  id: number;
  title: string;
  plan: string | null;
  interactive_elements: any | null;
  assessment_methods: string | null;
  metadata: any | null;
  content_type: string | null;
  created_at: string | null;
  updated_at: string | null;
  topic_id: number;
  image: string | null;
  order: number;
  next_lesson_id: number | null;
  previous_lesson_id: number | null;
  duration: string | null;
  description: string | null;
  links_to_video: string | null;
  video_player: string | null;
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

export default function EduProTopicDetail() {
  const [course, setCourse] = useState<EduProCourse | null>(null);
  const [topic, setTopic] = useState<EduProTopic | null>(null);
  const [lessons, setLessons] = useState<EduProLesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const router = useRouter();
  const { slug, topicSlug } = useParams();
  const { session } = useAuth();
  const { isStudent, isLoading: studentLoading } = useStudentStatus();

  // State for tab navigation
  const [activeTab, setActiveTab] = useState<'theory' | 'practice' | 'studyBooks'>('theory');

  const tabs = [
    { label: 'Theory', value: 'theory' },
    { label: 'Practice', value: 'practice' },
    { label: 'Books', value: 'studyBooks' },
  ];

  // Explicitly type handleTabChange to match Dispatch<SetStateAction<string>>
  const handleTabChange: Dispatch<SetStateAction<string>> = (tabValue) => {
    const newTab = typeof tabValue === 'string' ? tabValue : tabValue(activeTab);
    setActiveTab(newTab as 'theory' | 'practice' | 'studyBooks');
    // Perform navigation after setting the state
    if (newTab === 'practice') {
      router.push(`/account/edupro/${slug}/practice`);
    } else if (newTab === 'studyBooks') {
      router.push(`/account/edupro/${slug}`); // Assuming Books tab is on the main course page
    } else if (newTab === 'theory') {
      router.push(`/account/edupro/${slug}`); // Navigate back to the course page for Theory
    }
  };

  const isPurchaseActive = (purchase: Purchase) => {
    if (!purchase.is_active) return false;
    const currentDate = new Date();
    const startDate = new Date(purchase.start_date);
    const endDate = purchase.end_date ? new Date(purchase.end_date) : null;
    return currentDate >= startDate && (!endDate || currentDate <= endDate);
  };

  useEffect(() => {
    const fetchTopicDetails = async () => {
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

        const { data: topicDataArray, error: topicError } = await supabase
          .from('edu_pro_topic')
          .select('id, title, description, order, slug')
          .eq('slug', topicSlug);

        if (topicError) {
          throw new Error(`Error fetching topic: ${topicError.message}`);
        }

        if (!topicDataArray || topicDataArray.length === 0) {
          throw new Error(`Topic with slug "${topicSlug}" not found.`);
        }

        if (topicDataArray.length > 1) {
          throw new Error('Multiple topics found with the same slug. Please ensure topic slugs are unique.');
        }

        const topicData = topicDataArray[0];
        setTopic(topicData);

        const { data: courseTopicData, error: courseTopicError } = await supabase
          .from('edu_pro_coursetopic')
          .select('course_id')
          .eq('topic_id', topicData.id);

        if (courseTopicError) {
          throw new Error(`Error fetching course-topic relationship: ${courseTopicError.message}`);
        }

        if (!courseTopicData || courseTopicData.length === 0) {
          throw new Error(`No courses found for topic "${topicSlug}".`);
        }

        const courseIds = courseTopicData.map((ct) => ct.course_id);

        const { data: courseDataArray, error: courseError } = await supabase
          .from('edu_pro_course')
          .select('id, slug, title, description')
          .eq('slug', slug)
          .in('id', courseIds);

        if (courseError) {
          throw new Error(`Error fetching course: ${courseError.message}`);
        }

        if (!courseDataArray || courseDataArray.length === 0) {
          const { data: courseCheck, error: courseCheckError } = await supabase
            .from('edu_pro_course')
            .select('id, slug')
            .eq('slug', slug);

          if (courseCheckError) {
            throw new Error(`Error checking course existence: ${courseCheckError.message}`);
          }

          if (!courseCheck || courseCheck.length === 0) {
            throw new Error(`Course with slug "${slug}" not found.`);
          }

          const { data: associatedCourses, error: associatedCoursesError } = await supabase
            .from('edu_pro_course')
            .select('slug')
            .in('id', courseIds)
            .limit(1);

          if (associatedCoursesError) {
            throw new Error(`Error fetching associated courses: ${associatedCoursesError.message}`);
          }

          if (associatedCourses && associatedCourses.length > 0) {
            const correctCourseSlug = associatedCourses[0].slug;
            setToast({
              message: `Topic "${topicSlug}" does not belong to course "${slug}". Redirecting to course "${correctCourseSlug}".`,
              type: 'error',
            });
            router.push(`/account/edupro/${correctCourseSlug}/topic/${topicSlug}`);
            return;
          }

          throw new Error(
            `Topic "${topicSlug}" does not belong to course "${slug}" and no associated courses were found.`
          );
        }

        if (courseDataArray.length > 1) {
          throw new Error('Multiple courses found with the same slug. Please ensure course slugs are unique.');
        }

        const courseData = courseDataArray[0];
        setCourse(courseData);

        const { data: lessonsData, error: lessonsError } = await supabase
          .from('edu_pro_lesson')
          .select(`
            id,
            title,
            plan,
            interactive_elements,
            assessment_methods,
            metadata,
            content_type,
            created_at,
            updated_at,
            topic_id,
            image,
            order,
            next_lesson_id,
            previous_lesson_id,
            duration,
            description,
            links_to_video,
            video_player
          `)
          .eq('topic_id', topicData.id)
          .order('order', { ascending: true });

        if (lessonsError) {
          throw new Error(`Error fetching lessons: ${lessonsError.message}`);
        }

        setLessons(lessonsData || []);

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
        console.error('EduProTopicDetail: Error:', err);
        setError((err as Error).message);
        setToast({ message: (err as Error).message, type: 'error' });
        router.push(`/account/edupro/${slug}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTopicDetails();
  }, [slug, topicSlug, session, isStudent, studentLoading, router]);

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
          <AccountTabEduProCourse />
          <TabNavigation tabs={tabs} activeTab={activeTab} setActiveTab={handleTabChange} />
        </div>
        <div className="pb-24 px-6">
          {course && topic ? (
            <div>
            
              <div className="mx-auto max-w-sm relative border-l-8 border-sky-600 pl-4 py-2 bg-white rounded-lg shadow-sm">
                <span className="absolute top-2 right-2 flex items-center justify-center w-6 h-6 bg-sky-600 text-white text-xs font-medium rounded-full">
                  {topic.order}
                </span>
                <h3 className="text-base font-medium text-gray-900 pr-8">{topic.title}</h3>
              </div>
            
              {/* Lessons Section */}
              <div className="mt-8">
                <div className="text-center mb-4 p-3  sm:flex sm:justify-left sm:border-none sm:p-0">
                  <span className="text-md text-sm sm:text-base font-semibold  sm:py-1 ">
                    Lessons
                  </span>
                </div>
                {lessons.length > 0 ? (
                  <ul className="mt-2 grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {lessons.map((lesson) => (
                      <li
                        key={lesson.id}
                        className="relative border-l-4 border-sky-600 pl-4 py-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
                      >
                        <span className="absolute top-2 right-2 flex items-center justify-center w-5 h-5 border border-sky-600 text-sky-600 text-xs font-medium rounded-full">
                          {lesson.order}
                        </span>
                        <Link href={`/account/edupro/${slug}/topic/${topicSlug}/lesson/${lesson.id}`}>
                          <h3 className="text-sm font-medium text-gray-900 pr-8 hover:text-sky-600 transition-colors">
                            {lesson.title}
                          </h3>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-gray-600 text-center">No lessons available for this topic.</p>
                )}
              </div>
            </div>
          ) : (
            <p className="mt-4 text-gray-600 text-center">No topic details available.</p>
          )}
        </div>
      </div>
    </div>
  );
}