// app/account/edupro/[slug]/topic/[topicSlug]/page.tsx
'use client';

import { useState, useEffect, Dispatch, SetStateAction } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '@/context/AuthContext';
import { useStudentStatus } from '@/lib/StudentContext';
import AccountTabEduProCourse from '@/components/edupro/AccountTabEduProCourse';
import TabNavigation from '@/components/edupro/TheoryPracticeBooksTabs/TabNavigation';
import Toast from '@/components/Toast';
import { CheckIcon, ArrowUpIcon, ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

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

// Interface for Supabase query response
interface CourseTopicResponse {
  topic_id: number;
  order: number;
  topic: EduProTopic;
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

const CourseHeader = ({
  course,
  slug,
}: {
  course: EduProCourse;
  slug: string;
}) => (
  <Link href={`/account/edupro/${slug}`}>
    <div
      className="mx-auto max-w-7xl relative border-r-4 border-sky-600 px-4 py-2 sm:py-4 rounded-lg shadow-sm mb-4 min-h-[100px] sm:min-h-[120px] flex items-center group hover:bg-blue-50 cursor-pointer transition-colors duration-200 bg-white"
    >
      <ArrowUpIcon
        className="hidden group-hover:block absolute top-2 left-2 w-5 h-5 text-sky-600"
        aria-hidden="true"
      />
      <div className="hidden sm:flex sm:flex-col space-y-0 flex-1 items-center justify-center">
      
         
              <h3 className="  sm:text-xl text-sm font-semibold text-gray-900  hover:text-sky-600 transition-colors">
              Course
            </h3>
            <span className="sm:text-sm text-sm font-light text-gray-500 ">Topics</span>

          
      
      </div>
    </div>
  </Link>
);

const TopicHeader = ({
  topic,
  isTopicCompleted,
  toggleTopicCompletion,
  session,
}: {
  topic: EduProTopic;
  isTopicCompleted: boolean;
  toggleTopicCompletion: () => void;
  session: any;
}) => (
  <div
    className={`sm:ml-2 relative sm:pl-4 py-2 sm:py-4 mb-4 rounded-lg border-r-4 group min-h-[100px] sm:min-h-[120px] flex items-center ${
      isTopicCompleted ? 'border-teal-600 bg-teal-50' : 'border-sky-600 bg-blue-50'
    }`}
  >
    <div className="flex flex-col space-y-0 flex-1">
      <span className="sr-only text-sm font-light text-gray-500">Topic</span>

      <div className="my-4">
        <h3 className="text-lg sm:text-xl font-bold text-sky-600 text-center px-4">{topic.title}</h3>
        {topic.description && (
          <p className="hidden sm:block text-sm text-gray-600 text-center">{topic.description}</p>
        )}
      </div>
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
  <div className="mt-4 sm:mt-8">
    <div className="text-center mb-2 sm:mb-4 p-3 sm:border-none sm:p-0">
      <span className="text-md text-sm sm:text-base font-semibold sm:py-1">Lessons</span>
    </div>
    {lessons.length > 0 ? (
      <ul className="mt-2 grid grid-cols-1 lg:grid-cols-3 gap-8 sm:gap-x-16">
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
  const [allTopics, setAllTopics] = useState<CourseTopicResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>(null);
  const [isTopicCompleted, setIsTopicCompleted] = useState<boolean>(false);
  const [courseTitle, setCourseTitle] = useState<string>('Loading...');
  const [isToggling, setIsToggling] = useState<boolean>(false);
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
        progressMap[progress.lesson_id] = true;
      });
      console.log('Lesson progress map:', progressMap);
      setLessonProgress(progressMap);

      // Check if all lessons are completed to set topic completion status
      const allCompleted = lessonIds.length > 0 && lessonIds.every((id) => progressMap[id]);
      setIsTopicCompleted(allCompleted);
    } catch (err) {
      console.error('fetchLessonProgress: Error:', err);
      setToast({ message: 'Failed to fetch lesson progress', type: 'error' });
    }
  };

  // Toggle topic completion status
  const toggleTopicCompletion = async () => {
    if (!session?.user?.id || !topic?.id || isToggling) return;
    setIsToggling(true);
    try {
      const newCompletedStatus = !isTopicCompleted;

      // Update all lessons' completion status
      const lessonIds = lessons.map((lesson) => lesson.id);
      if (newCompletedStatus) {
        // Mark all lessons as complete
        for (const lessonId of lessonIds) {
          const { data: existingProgress, error: fetchError } = await supabase
            .from('edu_pro_lessonprogress')
            .select('id')
            .eq('lesson_id', lessonId)
            .eq('user_id', session.user.id)
            .single();

          if (fetchError && fetchError.code !== 'PGRST116') {
            throw new Error(`Error checking existing lesson progress: ${fetchError.message}`);
          }

          if (existingProgress) {
            const { error: updateError } = await supabase
              .from('edu_pro_lessonprogress')
              .update({
                completed: true,
                completion_date: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq('id', existingProgress.id);

            if (updateError) {
              throw new Error(`Error updating lesson completion: ${updateError.message}`);
            }
          } else {
            const { error: insertError } = await supabase
              .from('edu_pro_lessonprogress')
              .insert({
                lesson_id: lessonId,
                user_id: session.user.id,
                completed: true,
                completion_date: new Date().toISOString(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              });

            if (insertError) {
              throw new Error(`Error inserting lesson completion: ${insertError.message}`);
            }
          }
        }
      } else {
        // Mark all lessons as incomplete
        for (const lessonId of lessonIds) {
          const { data: existingProgress, error: fetchError } = await supabase
            .from('edu_pro_lessonprogress')
            .select('id')
            .eq('lesson_id', lessonId)
            .eq('user_id', session.user.id)
            .single();

          if (fetchError && fetchError.code !== 'PGRST116') {
            throw new Error(`Error checking existing lesson progress: ${fetchError.message}`);
          }

          if (existingProgress) {
            const { error: updateError } = await supabase
              .from('edu_pro_lessonprogress')
              .update({
                completed: false,
                completion_date: null,
                updated_at: new Date().toISOString(),
              })
              .eq('id', existingProgress.id);

            if (updateError) {
              throw new Error(`Error updating lesson completion: ${updateError.message}`);
            }
          }
        }
      }

      setIsTopicCompleted(newCompletedStatus);
      setLessonProgress((prev) => {
        const newProgress = { ...prev };
        lessonIds.forEach((id) => {
          newProgress[id] = newCompletedStatus;
        });
        return newProgress;
      });

      setToast({
        message: newCompletedStatus ? 'Topic marked as complete' : 'Topic marked as incomplete',
        type: 'success',
      });
    } catch (err) {
      console.error('toggleTopicCompletion: Error:', err);
      setToast({ message: 'Failed to update topic completion status', type: 'error' });
    } finally {
      setIsToggling(false);
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
      console.log('Fetched topic:', topicData);
      setTopic(topicData);

      // Fetch course-topic relationship
      const { data: courseTopicData, error: courseTopicError } = await supabase
        .from('edu_pro_coursetopic')
        .select('course_id, order')
        .eq('topic_id', topicData.id);

      if (courseTopicError || !courseTopicData?.length) {
        throw new Error(`No courses found for topic "${topicSlug}".`);
      }
      console.log('Course-topic data:', courseTopicData);

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
      console.log('Fetched course:', courseData);
      setCourse(courseData);

      // Fetch all topics for the course
      const { data: allTopicsData, error: allTopicsError } = await supabase
        .from('edu_pro_coursetopic')
        .select(`
          topic_id,
          order,
          topic:edu_pro_topic (
            id,
            title,
            description,
            order,
            slug
          )
        `)
        .eq('course_id', courseData.id)
        .order('order', { ascending: true }) as { data: CourseTopicResponse[] | null; error: any };

      if (allTopicsError) throw new Error(`Error fetching topics: ${allTopicsError.message}`);
      console.log('All topics data:', allTopicsData);

      if (!allTopicsData || allTopicsData.length === 0) {
        console.warn('No topics found for course ID:', courseData.id);
        setAllTopics([]);
      } else {
        const topics = allTopicsData
          .filter((ct) => ct.topic !== null)
          .map((ct) => ({
            topic_id: ct.topic_id,
            order: ct.order,
            topic: ct.topic!,
          }))
          .sort((a, b) => a.order - b.order); // Explicitly sort by course topic order
        console.log('Mapped and sorted topics:', topics);
        setAllTopics(topics);
      }

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
      console.log('Fetched lessons:', lessonsData);
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
      console.log('Active purchases:', activePurchases);

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

  // Navigate to a topic by slug
  const navigateToTopic = (targetTopicSlug: string) => {
    const targetTopic = allTopics.find((t) => t.topic.slug === targetTopicSlug);
    if (!targetTopic) {
      console.warn('Navigation failed: Topic slug not found:', targetTopicSlug);
      setToast({ message: 'Topic not found.', type: 'error' });
      return;
    }
    console.log('Navigating to topic:', targetTopicSlug);
    router.push(`/account/edupro/${slug}/topic/${targetTopicSlug}`);
  };

  useEffect(() => {
    fetchTopicDetails();
  }, [slug, topicSlug, session, isStudent, studentLoading]);

  // Determine previous and next topics based on order
  const currentTopicIndex = allTopics.findIndex((t) => t.topic.slug === topicSlug);
  const previousTopic = currentTopicIndex > 0 ? allTopics[currentTopicIndex - 1] : null;
  const nextTopic = currentTopicIndex < allTopics.length - 1 ? allTopics[currentTopicIndex + 1] : null;
  console.log('Current topic index:', currentTopicIndex, 'Previous topic:', previousTopic, 'Next topic:', nextTopic);

  if (isLoading || studentLoading) return <LoadingSpinner />;
  if (error) return <ErrorDisplay error={error} />;

  return (
    <div className="min-h-screen pb-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        <div className="">
          <AccountTabEduProCourse />
          <TabNavigation tabs={TABS} activeTab={activeTab} setActiveTab={handleTabChange} />
        </div>
        <div className="mt-4 mb-4 grid grid-cols-3">
          
          <Link
            href={`/account/edupro/${slug}`}
            className="flex sm:justify-start justify-center text-gray-600 hover:text-sky-600 p-1"
            aria-label="Up to Course"
          >
           
              
              <ArrowUpIcon className=" w-5 h-5" />
              
           
            <span className="absolute bottom-full w-24 left-0 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              Up to Course
            </span>
          </Link>
          <div className="flex-1 flex justify-center items-center space-x-3">
            <span
              className="text-md sm:text-lg font-semibold text-gray-900"
              aria-label="Current Topic Section"
            >
              Topic
            </span>
            {topic && (
                <div
                  onClick={session ? toggleTopicCompletion : undefined}
                  className={`flex items-center justify-center w-6 h-6 border-2 ${
                    isTopicCompleted ? 'bg-teal-600 hover:bg-teal-500 text-white' : 'border-sky-600 text-sky-600'
                  } text-xs font-medium rounded-full transition-all duration-200 ${
                    session ? 'cursor-pointer hover:scale-110 hover:bg-teal-50' : 'cursor-default'
                  } group-hover:ring-2 group-hover:ring-teal-300 group`}
                  aria-label={isTopicCompleted ? 'Mark as Incomplete' : 'Mark as Complete'}
                  title={isTopicCompleted ? 'Mark as Incomplete' : 'Mark as Complete'}
                >
                  <span className="group-hover:hidden">{topic.order}</span>
                  {session && <CheckIcon className="hidden group-hover:block w-4 h-4" />}
                </div>
            )}
          </div>
          <div className="flex justify-center sm:justify-end items-center space-x-2">
            <button
              onClick={() => previousTopic && navigateToTopic(previousTopic.topic.slug)}
              disabled={!previousTopic}
              className="cursor-pointer relative p-1 text-gray-600 hover:text-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 group"
              aria-label="Previous Topic"
              aria-disabled={!previousTopic}
            >
              <ArrowLeftIcon className="w-5 h-5" />
              <span className="absolute bottom-full right-0 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                Previous 
              </span>
            </button>
            <button
              onClick={() => nextTopic && navigateToTopic(nextTopic.topic.slug)}
              disabled={!nextTopic}
              className="cursor-pointer relative p-1 text-gray-600 hover:text-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 group"
              aria-label="Next Topic"
              aria-disabled={!nextTopic}
            >
              <ArrowRightIcon className="w-5 h-5" />
              <span className="absolute bottom-full right-0 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                Next
              </span>
            </button>
          </div>
        </div>
        <div className=" pb-24 px-2">
          {course && topic ? (
            <div>
              <div className="grid grid-cols-3 sm:grid-cols-6">
                <div className="hidden sm:block col-span-1 sm:col-span-2">
                  <CourseHeader course={course} slug={slug} />
                </div>
                <div className="col-span-3 sm:col-span-4">
                  <TopicHeader
                    topic={topic}
                    isTopicCompleted={isTopicCompleted}
                    toggleTopicCompletion={toggleTopicCompletion}
                    session={session}
                  />
                </div>
              </div>
              <LessonsList lessons={lessons} slug={slug} topicSlug={topicSlug} lessonProgress={lessonProgress} />
            </div>
          ) : (
            <p className="mt-4 text-gray-600 text-center">No topic details available.</p>
          )}
        </div>
      </div>
    </div>
  );
}