// app/account/edupro/[slug]/topic/[topicSlug]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '@/context/AuthContext';
import { useStudentStatus } from '@/lib/StudentContext';
import AccountTabEduProCourse from '@/components/AccountTabEduProCourse';
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

        console.log('Fetching topic with slug:', topicSlug);
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
        console.log('Topic data:', topicData);
        setTopic(topicData);

        console.log('Fetching course-topic relationships for topic_id:', topicData.id);
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
        console.log('Associated course IDs for this topic:', courseIds);

        console.log('Fetching course with slug:', slug, 'and course IDs:', courseIds);
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
        console.log('Course data:', courseData);
        setCourse(courseData);

        console.log('Fetching lessons for topic_id:', topicData.id);
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

        console.log('Lessons data:', lessonsData);
        setLessons(lessonsData || []);

        console.log('Fetching purchases for user:', session.user.id);
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
          {course && topic ? (
            <div>
              {/* Responsive topic header: bordered on mobile, badge on larger screens */}
              <div className="sm:ml-4 text-center mb-4 p-3 border-sky-600 border-2 sm:flex sm:justify-left sm:border-none sm:p-0">
                <span className="text-sm font-semibold text-gray-900 sm:inline-block sm:bg-sky-600 sm:text-white 
                sm:px-2 sm:py-1 sm:rounded-full">
                  Topics 
                </span>
              </div>
              <div className="relative border-l-8 border-sky-600 pl-4 py-4 bg-white rounded-lg shadow-sm">
                <span className="absolute top-2 right-2 flex items-center justify-center w-6 h-6 bg-sky-600 text-white text-xs font-medium rounded-full">
                  {topic.order}
                </span>
                <h3 className="text-lg font-medium text-gray-900 pr-8">{topic.title}</h3>
                <p className="text-sm text-gray-600 mt-2">{topic.description || 'No description available.'}</p>
              </div>

              {/* Lessons Section with responsive styling */}
              <div className="mt-8">
                <div className="sm:ml-4 text-center mb-4 p-3 border-sky-600 border-2 sm:flex sm:justify-left sm:border-none sm:p-0">
                  <span className="text-md text-sm font-semibold text-gray-900 sm:inline-block sm:bg-sky-600 sm:text-white 
                  sm:px-2 sm:py-1 sm:rounded-full">
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
                        <span className="absolute top-2 right-2 flex items-center justify-center w-5 h-5 bg-sky-600 text-white text-xs font-medium rounded-full">
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