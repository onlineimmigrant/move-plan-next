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
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Interfaces
interface EduProCourse {
  id: number;
  slug: string;
  title: string;
  description: string;
}

interface EduProTopic {
  id: number;
  title: string;
  description: string;
  order: number;
  slug: string;
}

interface EduProLesson {
  id: number;
  title: string;
  plan: string | null;
  interactive_elements: unknown | null;
  assessment_methods: string | null;
  metadata: unknown | null;
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

interface EduProLessonProgress {
  id: string;
  lesson_id: number;
  user_id: string;
  completed: boolean;
  completion_date: string | null;
  created_at: string;
  updated_at: string;
}

// Types
type Tab = 'theory' | 'practice' | 'studyBooks';
type ToastState = { message: string; type: 'success' | 'error' } | null;

// Constants
const TABS: { label: string; value: Tab }[] = [
  { label: 'Theory', value: 'theory' },
  { label: 'Practice', value: 'practice' },
  { label: 'Books', value: 'studyBooks' },
] as const;

// Utility Functions
const isPurchaseActive = (purchase: Purchase): boolean => {
  if (!purchase.is_active) return false;
  const currentDate = new Date();
  const startDate = new Date(purchase.start_date);
  const endDate = purchase.end_date ? new Date(purchase.end_date) : null;
  return currentDate >= startDate && (!endDate || currentDate <= endDate);
};

// Components
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="flex items-center space-x-2">
      {[0, 0.2, 0.4].map((delay) => (
        <div
          key={delay}
          className="w-4 h-4 bg-sky-600 rounded-full animate-bounce"
          style={{ animationDelay: `${delay}s` }}
        />
      ))}
    </div>
  </div>
);

const ErrorDisplay = ({ error }: { error: string }) => (
  <div className="min-h-screen pb-8 px-4 sm:px-6 lg:px-8">
    <div className="max-w-7xl mx-auto text-center">
      <p className="text-red-600 font-medium">{error}</p>
    </div>
  </div>
);

const TopicHeader = ({ topic }: { topic: EduProTopic }) => (
<div >
    <div className='mt-8 mb-4 text-center'>
        <span className=" text-md text-sm sm:text-base font-semibold sm:py-1">Topic</span>
    </div>
  <div className="sm:flex items-center mx-auto max-w-7xl relative border-l-8 border-sky-600 pl-4 py-4 bg-white rounded-lg">
    <span className="absolute top-2 right-2 flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 bg-sky-600 text-white text-xs sm:text-base font-medium rounded-full">
      {topic.order}
    </span>
    <h3 className="text-base font-medium text-gray-900 pr-8">{topic.title}</h3>
    <span className="text-sm sm:text-base font-light text-gray-500">{topic.description}</span>
  </div>
  </div>
);

const LessonsList = ({
  lessons,
  slug,
  topicSlug,
  lessonProgress,
}: {
  lessons: EduProLesson[];
  slug: string;
  topicSlug: string;
  lessonProgress: Record<number, boolean>;
}) => (
  <div className="mt-8">
    <div className="text-center mb-4 p-3 sm:border-none sm:p-0">
      <span className="text-md text-sm sm:text-base font-semibold sm:py-1">Lessons</span>
    </div>
    {lessons.length > 0 ? (
      <ul className="mt-2 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {lessons.map((lesson) => (
          <li
            key={lesson.id}
            className={`relative border-l-4 border-sky-600 pl-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-shadow ${
              lessonProgress[lesson.id] ? 'bg-teal-100' : 'bg-white'
            }`}
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
);

export default function EduProTopicDetail() {
  const [course, setCourse] = useState<EduProCourse | null>(null);
  const [topic, setTopic] = useState<EduProTopic | null>(null);
  const [lessons, setLessons] = useState<EduProLesson[]>([]);
  const [lessonProgress, setLessonProgress] = useState<Record<number, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>(null);
  const router = useRouter();
  const { slug, topicSlug } = useParams() as { slug: string; topicSlug: string };
  const { session } = useAuth();
  const { isStudent, isLoading: studentLoading } = useStudentStatus();
  const [activeTab, setActiveTab] = useState<Tab>('theory');

  // Handle tab navigation
  const handleTabChange: Dispatch<SetStateAction<Tab>> = (tabValue) => {
    const newTab = typeof tabValue === 'string' ? tabValue : tabValue(activeTab);
    setActiveTab(newTab as Tab);
    const routes: Record<Tab, string> = {
      theory: `/account/edupro/${slug}/topic/${topicSlug}`,
      practice: `/account/edupro/${slug}/practice`,
      studyBooks: `/account/edupro/${slug}`,
    };
    router.push(routes[newTab as Tab]);
  };

  // Fetch lesson completion status
  const fetchLessonProgress = async (lessonIds: number[]) => {
    if (!session?.user?.id || !lessonIds.length) return;
    try {
      const { data, error } = await supabase
        .from('edu_pro_lessonprogress')
        .select('lesson_id, completed')
        .in('lesson_id', lessonIds)
        .eq('user_id', session.user.id);

      if (error) throw new Error(`Error fetching lesson progress: ${error.message}`);
      const progressMap: Record<number, boolean> = {};
      lessonIds.forEach((id) => {
        progressMap[id] = false; // Default to false if no progress record
      });
      data?.forEach((progress) => {
        progressMap[progress.lesson_id] = progress.completed;
      });
      setLessonProgress(progressMap);
    } catch (err) {
      console.error('fetchLessonProgress: Error:', err);
      setToast({ message: 'Failed to fetch lesson completion status', type: 'error' });
    }
  };

  // Fetch topic details
  const fetchTopicDetails = async () => {
    if (studentLoading) return;
    setIsLoading(true);

    try {
      if (!session) throw new Error('You must be logged in to access this page.');
      if (!isStudent) throw new Error('Access denied: You are not enrolled as a student.');

      // Fetch topic
      const { data: topicData, error: topicError } = await supabase
        .from('edu_pro_topic')
        .select('id, title, description, order, slug')
        .eq('slug', topicSlug)
        .single();

      if (topicError || !topicData) throw new Error(`Topic with slug "${topicSlug}" not found.`);
      setTopic(topicData);

      // Fetch course-topic relationship
      const { data: courseTopicData, error: courseTopicError } = await supabase
        .from('edu_pro_coursetopic')
        .select('course_id')
        .eq('topic_id', topicData.id);

      if (courseTopicError || !courseTopicData?.length) {
        throw new Error(`No courses found for topic "${topicSlug}".`);
      }

      const courseIds = courseTopicData.map((ct) => ct.course_id);

      // Fetch course
      const { data: courseData, error: courseError } = await supabase
        .from('edu_pro_course')
        .select('id, slug, title, description')
        .eq('slug', slug)
        .in('id', courseIds)
        .single();

      if (courseError || !courseData) {
        const { data: associatedCourse } = await supabase
          .from('edu_pro_course')
          .select('slug')
          .in('id', courseIds)
          .single();

        if (associatedCourse) {
          setToast({
            message: `Topic "${topicSlug}" does not belong to course "${slug}". Redirecting to course "${associatedCourse.slug}".`,
            type: 'error',
          });
          router.push(`/account/edupro/${associatedCourse.slug}/topic/${topicSlug}`);
          return;
        }
        throw new Error(`Course with slug "${slug}" not found.`);
      }
      setCourse(courseData);

      // Fetch lessons
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('edu_pro_lesson')
        .select(`
          id, title, plan, interactive_elements, assessment_methods, metadata,
          content_type, created_at, updated_at, topic_id, image, order,
          next_lesson_id, previous_lesson_id, duration, description,
          links_to_video, video_player
        `)
        .eq('topic_id', topicData.id)
        .order('order', { ascending: true });

      if (lessonsError) throw new Error(`Error fetching lessons: ${lessonsError.message}`);
      setLessons(lessonsData || []);

      // Fetch lesson progress
      if (lessonsData?.length) {
        const lessonIds = lessonsData.map((lesson) => lesson.id);
        await fetchLessonProgress(lessonIds);
      }

      // Fetch purchases
      const { data: activePurchases, error: purchaseError } = await supabase
        .from('purchases')
        .select(`
          id, profiles_id, is_active, start_date, end_date, purchased_item_id,
          pricingplan (product_id, product (course_connected_id))
        `)
        .eq('profiles_id', session.user.id)
        .eq('is_active', true) as { data: Purchase[] | null; error: any };

      if (purchaseError || !activePurchases?.length) {
        throw new Error('No active purchases found.');
      }

      const hasAccess = activePurchases.some(
        (purchase) =>
          isPurchaseActive(purchase) &&
          purchase.pricingplan?.product?.course_connected_id === courseData.id
      );

      if (!hasAccess) throw new Error('You do not have access to this course.');
    } catch (err) {
      const errorMessage = (err as Error).message;
      console.error('EduProTopicDetail: Error:', err);
      setError(errorMessage);
      setToast({ message: errorMessage, type: 'error' });
      router.push(`/account/edupro/${slug}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTopicDetails();
  }, [slug, topicSlug, session, isStudent, studentLoading]);

  if (isLoading || studentLoading) return <LoadingSpinner />;
  if (error) return <ErrorDisplay error={error} />;

  return (
    <div className="min-h-screen pb-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        <div className="pt-8">
          <AccountTabEduProCourse />
          <TabNavigation tabs={TABS} activeTab={activeTab} setActiveTab={handleTabChange} />
        </div>
        <div className="pb-24 px-2">
          {course && topic ? (
            <>
              <TopicHeader topic={topic} />
              <LessonsList lessons={lessons} slug={slug} topicSlug={topicSlug} lessonProgress={lessonProgress} />
            </>
          ) : (
            <p className="mt-4 text-gray-600 text-center">No topic details available.</p>
          )}
        </div>
      </div>
    </div>
  );
}