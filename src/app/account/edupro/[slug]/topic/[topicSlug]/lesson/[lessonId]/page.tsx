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
import EpubViewer from '@/components/EpubViewer';
import { CheckIcon, ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

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
  link_to_practice: string | null;
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

interface StudyMaterial {
  id: string;
  lesson_id: number;
  file_path: string;
  file_type: 'pdf' | 'epub';
}

interface TocItem {
  id: string;
  material_id: string;
  topic: string;
  page_number: number | null;
  href: string | null;
  order: number;
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

const fetchSasUrl = async (filePath: string, lessonId: string, accessToken: string | undefined) => {
  try {
    if (!accessToken) return null;
    const response = await fetch('/api/generate-sas', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ filePath, lessonId }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('SAS URL fetch failed:', response.status, errorText);
      return null;
    }

    const { sasUrl } = await response.json();
    return sasUrl;
  } catch (err) {
    console.error('SAS URL fetch error:', err);
    return null;
  }
};

// Components
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="flex items-center space-x-2">
      {[0, 0.2, 0.4].map((delay) => (
        <div
          key={delay}
          className="w-4 h-4 bg-sky-600 rounded-full animate-bounce cursor-pointer"
          style={{ animationDelay: `${delay}s` }}
        />
      ))}
    </div>
  </div>
);

const ErrorDisplay = ({ error }: { error: string | null }) => (
  <div className="min-h-screen pb-8 px-4 sm:px-6 lg:px-8">
    <div className="max-w-7xl mx-auto text-center">
      <p className="text-red-600 font-medium">{error || 'An error occurred'}</p>
    </div>
  </div>
);

const TopicHeader = ({
  topic,
  slug,
  topicSlug,
  lesson,
  isTopicCompleted,
}: {
  topic: EduProTopic;
  slug: string;
  topicSlug: string;
  lesson: EduProLesson;
  isTopicCompleted: boolean;
}) => (
  <div
    className={`mx-auto max-w-7xl relative border-r-4 border-sky-600 px-4 py-2 sm:py-4 rounded-lg shadow-sm mb-4 min-h-[100px] sm:min-h-[120px] flex items-center ${
      isTopicCompleted ? 'bg-teal-50' : 'bg-white'
    }`}
  >
    <div className="flex flex-col space-y-0 flex-1">
      <div className="flex items-center justify-between">
        <Link href={`/account/edupro/${slug}/topic/${topicSlug}`}>
          <span className="sm:text-sm text-sm font-light text-gray-500">Topic</span>
          <h3 className="sm:text-base text-sm font-semibold text-gray-900 pr-8 hover:text-sky-600 transition-colors cursor-pointer">
            {topic.title}
          </h3>
        </Link>
        <span className="absolute top-2 right-2 flex items-center justify-center w-6 h-6 bg-sky-600 text-white text-xs font-medium rounded-full cursor-pointer">
          {topic.order}
        </span>
      </div>
    </div>
  </div>
);

const LessonHeader = ({
  lesson,
  isLessonCompleted,
  toggleLessonCompletion,
  session,
  previousLesson,
  nextLesson,
  navigateToLesson,
}: {
  lesson: EduProLesson;
  isLessonCompleted: boolean;
  toggleLessonCompletion: () => void;
  session: any;
  previousLesson: EduProLesson | null;
  nextLesson: EduProLesson | null;
  navigateToLesson: (lessonId: number) => void;
}) => (
  <div
    className={`ml-2 relative pl-4 py-2 sm:py-4 rounded-lg border-r-4 group min-h-[100px] sm:min-h-[120px] flex items-center ${
      isLessonCompleted ? 'border-teal-600 bg-teal-50' : 'border-sky-600'
    }`}
  >
    <div className="flex flex-col space-y-0 flex-1">
      <span className="text-sm font-light text-gray-500">Lesson</span>
      <div
        onClick={session ? toggleLessonCompletion : undefined}
        className={`absolute top-2 right-2 flex items-center justify-center w-6 h-6 border-2 ${
          isLessonCompleted ? 'bg-teal-600 hover:bg-teal-500 text-white' : 'border-sky-600 text-sky-600'
        } text-xs font-medium rounded-full transition-all duration-200 ${
          session ? 'cursor-pointer hover:scale-110 hover:bg-teal-50' : 'cursor-default'
        } group-hover:ring-2 group-hover:ring-teal-300 group`}
        aria-label={isLessonCompleted ? 'Mark as Incomplete' : 'Mark as Complete'}
        title={isLessonCompleted ? 'Mark as Incomplete' : 'Mark as Complete'}
      >
        <span className="group-hover:hidden">{lesson.order}</span>
        {session && <CheckIcon className="hidden group-hover:block w-4 h-4" />}
      </div>
      <h3 className="text-sm sm:text-base font-medium text-gray-900 pr-8">{lesson.title}</h3>
      {lesson.description && <p className="text-sm text-gray-600">{lesson.description}</p>}
      <div className="absolute bottom-2 right-2 flex items-center space-x-2">
        <button
          onClick={() => previousLesson && navigateToLesson(previousLesson.id)}
          disabled={!previousLesson}
          className="cursor-pointer relative p-1 text-gray-600 hover:text-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          aria-label="Previous Lesson"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          <span className="absolute top-full right-0 mt-1 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            Prev
          </span>
        </button>
        <button
          onClick={() => nextLesson && navigateToLesson(nextLesson.id)}
          disabled={!nextLesson}
          className="cursor-pointer relative p-1 text-gray-600 hover:text-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          aria-label="Next Lesson"
        >
          <ArrowRightIcon className="w-5 h-5" />
          <span className=" absolute top-full right-0 mt-1 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            Next
          </span>
        </button>
      </div>
    </div>
  </div>
);

const LessonContent = ({ lesson }: { lesson: EduProLesson }) => (
  <div className="relative pl-4 py-4 bg-white rounded-lg shadow-sm">
    <span className="absolute top-2 right-2 flex items-center justify-center w-6 h-6 bg-sky-600 text-white text-xs font-medium rounded-full cursor-pointer">
      {lesson.order}
    </span>
    <h3 className="text-lg font-medium text-gray-900 pr-8">{lesson.title}</h3>
    {lesson.description && <p className="text-sm text-gray-600 mt-2">{lesson.description}</p>}
    {lesson.duration && <p className="text-sm text-gray-500 mt-2">Duration: {lesson.duration}</p>}
    {lesson.content_type && <p className="text-sm text-gray-500 mt-2">Content Type: {lesson.content_type}</p>}
    {lesson.links_to_video && (
      <div className="mt-2">
        <p className="text-sm text-gray-500">Video Link:</p>
        <a
          href={lesson.links_to_video}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sky-600 hover:underline cursor-pointer"
        >
          {lesson.links_to_video}
        </a>
      </div>
    )}
    {lesson.video_player && (
      <div className="mt-2">
        <p className="text-sm text-gray-500">Video Player URL:</p>
        <a
          href={lesson.video_player}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sky-600 hover:underline cursor-pointer"
        >
          {lesson.video_player}
        </a>
      </div>
    )}
    {lesson.image && (
      <div className="mt-2">
        <p className="text-sm text-gray-500">Image URL:</p>
        <a
          href={lesson.image}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sky-600 hover:underline cursor-pointer"
        >
          {lesson.image}
        </a>
      </div>
    )}
    {lesson.assessment_methods && (
      <p className="text-sm text-gray-500 mt-2">Assessment Methods: {lesson.assessment_methods}</p>
    )}
    {lesson.plan && (
      <div className="mt-2">
        <p className="text-sm text-gray-500">Lesson Plan:</p>
        <p className="text-sm text-gray-600">{lesson.plan}</p>
      </div>
    )}
    {lesson.created_at && (
      <p className="text-sm text-gray-400 mt-2">
        Created At: {new Date(lesson.created_at).toLocaleString()}
      </p>
    )}
    {lesson.updated_at && (
      <p className="text-sm text-gray-400 mt-2">
        Updated At: {new Date(lesson.updated_at).toLocaleString()}
      </p>
    )}
  </div>
);

const CompletionControls = ({
  isLessonCompleted,
  toggleLessonCompletion,
  session,
  isToggling,
}: {
  isLessonCompleted: boolean;
  toggleLessonCompletion: () => void;
  session: any;
  isToggling: boolean;
}) => (
  <div className="mt-4">
    <button
      onClick={toggleLessonCompletion}
      className={`w-full py-8 sm:py-16 shadow px-4 border-2 ${
        isLessonCompleted
          ? 'border-teal-600 text-teal-600 bg-teal-50 hover:bg-white'
          : 'border-sky-600 text-sky-600 hover:bg-sky-50'
      } rounded-md font-medium text-center transition-all duration-200 ${
        isToggling || !session ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      }`}
      disabled={!session || isToggling}
      aria-label={isLessonCompleted ? 'Mark as Incomplete' : 'Mark as Complete'}
    >
      {isLessonCompleted ? (
        <span  data-completion-status="completed">
          <p className="text-2xl font-semibold">Lesson Completed  </p>
          <p className='text-gray-400'>Click to Mark as Incomplete</p>
        </span>
      ) : (
        <span className="completion-text" data-completion-status="incomplete">
           <p className="text-2xl font-semibold">Incomplete Lesson  </p>
          <p className='text-gray-400'>Click to Mark as Complete</p>
        </span>
      )}
    </button>
  </div>
);

export default function EduProLessonDetail() {
  const [course, setCourse] = useState<EduProCourse | null>(null);
  const [topic, setTopic] = useState<EduProTopic | null>(null);
  const [lesson, setLesson] = useState<EduProLesson | null>(null);
  const [allLessons, setAllLessons] = useState<EduProLesson[]>([]);
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [toc, setToc] = useState<TocItem[]>([]);
  const [sasUrl, setSasUrl] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [currentSection, setCurrentSection] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLessonCompleted, setIsLessonCompleted] = useState<boolean>(false);
  const [isTopicCompleted, setIsTopicCompleted] = useState<boolean>(false);
  const [isToggling, setIsToggling] = useState<boolean>(false);
  const router = useRouter();
  const { slug, topicSlug, lessonId } = useParams() as { slug: string; topicSlug: string; lessonId: string };
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
      studyBooks: `/account/edupro/${slug}/topic/${topicSlug}/lesson/${lessonId}`,
    };
    router.push(routes[newTab as Tab]);
  };

  // Fetch user role to determine admin status
  const fetchUserRole = async () => {
    if (!session?.user?.id) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (error) throw new Error(`Error fetching user role: ${error.message}`);
      setIsAdmin(data?.role === 'admin');
    } catch (err) {
      console.error('fetchUserRole: Error:', err);
      setToast({ message: 'Failed to verify user role', type: 'error' });
    }
  };

  // Fetch lesson completion status
  const fetchLessonCompletionStatus = async () => {
    if (!session?.user?.id || !lessonId) return;
    try {
      const { data, error } = await supabase
        .from('edu_pro_lessonprogress')
        .select('completed')
        .eq('lesson_id', lessonId)
        .eq('user_id', session.user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw new Error(`Error fetching lesson completion status: ${error.message}`);
      }
      setIsLessonCompleted(data?.completed || false);
    } catch (err) {
      console.error('fetchLessonCompletionStatus: Error:', err);
      setToast({ message: 'Failed to fetch lesson completion status', type: 'error' });
    }
  };

  // Fetch topic completion status
  const fetchTopicCompletionStatus = async (topicId: number) => {
    if (!session?.user?.id || !allLessons.length || !topicId) {
      setIsTopicCompleted(false);
      return;
    }
    try {
      const lessonIds = allLessons.map((lesson) => lesson.id);
      const { data: progressData, error: progressError } = await supabase
        .from('edu_pro_lessonprogress')
        .select('lesson_id, completed')
        .in('lesson_id', lessonIds)
        .eq('user_id', session.user.id);

      if (progressError) throw new Error(`Error fetching lesson progress: ${progressError.message}`);

      // Create a map of lesson completion status
      const lessonProgressMap: Record<number, boolean> = {};
      lessonIds.forEach((id) => {
        lessonProgressMap[id] = false; // Default to false if no progress record
      });
      if (progressData) {
        progressData.forEach((progress) => {
          lessonProgressMap[progress.lesson_id] = progress.completed;
        });
      }

      // Check if all lessons are completed
      const allCompleted = lessonIds.length > 0 && lessonIds.every((id) => lessonProgressMap[id]);
      setIsTopicCompleted(allCompleted);
    } catch (err) {
      console.error('fetchTopicCompletionStatus: Error:', err);
      setToast({ message: 'Failed to fetch topic completion status', type: 'error' });
      setIsTopicCompleted(false);
    }
  };

  // Toggle lesson completion status
  const toggleLessonCompletion = async () => {
    if (!session?.user?.id || !lessonId || isToggling) return;
    setIsToggling(true);
    try {
      const newCompletedStatus = !isLessonCompleted;
      const completionDate = newCompletedStatus ? new Date().toISOString() : null;

      const { data: existingRecord, error: fetchError } = await supabase
        .from('edu_pro_lessonprogress')
        .select('id')
        .eq('lesson_id', lessonId)
        .eq('user_id', session.user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw new Error(`Error checking existing lesson progress: ${fetchError.message}`);
      }

      if (existingRecord) {
        const { error: updateError } = await supabase
          .from('edu_pro_lessonprogress')
          .update({
            completed: newCompletedStatus,
            completion_date: completionDate,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingRecord.id);

        if (updateError) {
          throw new Error(`Error updating lesson completion status: ${updateError.message}`);
        }
      } else {
        const { error: insertError } = await supabase
          .from('edu_pro_lessonprogress')
          .insert({
            lesson_id: lessonId,
            user_id: session.user.id,
            completed: newCompletedStatus,
            completion_date: completionDate,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (insertError) {
          throw new Error(`Error inserting lesson completion status: ${insertError.message}`);
        }
      }

      setIsLessonCompleted(newCompletedStatus);
      setToast({
        message: newCompletedStatus ? 'Lesson marked as complete' : 'Lesson marked as incomplete',
        type: 'success',
      });

      // Re-fetch topic completion status after toggling
      if (topic?.id) {
        await fetchTopicCompletionStatus(topic.id);
      }
    } catch (err) {
      console.error('toggleLessonCompletion: Error:', err);
      setToast({ message: 'Failed to update lesson completion status', type: 'error' });
    } finally {
      setIsToggling(false);
    }
  };

  // Fetch lesson details
  const fetchLessonDetails = async () => {
    if (studentLoading) return;
    setIsLoading(true);

    try {
      if (!session) throw new Error('You must be logged in to access this page.');
      if (!isStudent) throw new Error('Access denied: You are not enrolled as a student.');

      const { data: topicData, error: topicError } = await supabase
        .from('edu_pro_topic')
        .select('id, title, description, order, slug')
        .eq('slug', topicSlug)
        .single();

      if (topicError || !topicData) throw new Error(`Topic with slug "${topicSlug}" not found.`);
      setTopic(topicData);

      const { data: courseTopicData, error: courseTopicError } = await supabase
        .from('edu_pro_coursetopic')
        .select('course_id')
        .eq('topic_id', topicData.id);

      if (courseTopicError || !courseTopicData?.length) {
        throw new Error(`No courses found for topic "${topicSlug}".`);
      }

      const courseIds = courseTopicData.map((ct) => ct.course_id);
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
            message: `Topic "${topicSlug}" does not belong to course "${slug}". Redirecting.`,
            type: 'error',
          });
          router.push(`/account/edupro/${associatedCourse.slug}/topic/${topicSlug}`);
          return;
        }
        throw new Error(`Course with slug "${slug}" not found.`);
      }
      setCourse(courseData);

      const { data: allLessonsData, error: allLessonsError } = await supabase
        .from('edu_pro_lesson')
        .select(`
          id, title, plan, interactive_elements, assessment_methods, metadata,
          content_type, created_at, updated_at, topic_id, image, order,
          next_lesson_id, previous_lesson_id, duration, description,
          links_to_video, video_player, link_to_practice
        `)
        .eq('topic_id', topicData.id)
        .order('order', { ascending: true });

      if (allLessonsError || !allLessonsData) {
        throw new Error(`Error fetching lessons for topic "${topicSlug}": ${allLessonsError?.message}`);
      }
      setAllLessons(allLessonsData);

      const { data: lessonData, error: lessonError } = await supabase
        .from('edu_pro_lesson')
        .select(`
          id, title, plan, interactive_elements, assessment_methods, metadata,
          content_type, created_at, updated_at, topic_id, image, order,
          next_lesson_id, previous_lesson_id, duration, description,
          links_to_video, video_player, link_to_practice
        `)
        .eq('id', lessonId)
        .eq('topic_id', topicData.id)
        .single();

      if (lessonError || !lessonData) {
        throw new Error(`Lesson with ID "${lessonId}" not found or does not belong to topic "${topicSlug}".`);
      }
      setLesson(lessonData);

      const { data: materialsData, error: materialsError } = await supabase
        .from('study_materials')
        .select('id, lesson_id, file_path, file_type')
        .eq('lesson_id', lessonId);

      if (materialsError) throw new Error(`Error fetching materials: ${materialsError.message}`);
      setMaterials(materialsData || []);

      if (materialsData?.length) {
        const { data: tocData, error: tocError } = await supabase
          .from('material_toc')
          .select('id, material_id, topic, page_number, href, order')
          .eq('material_id', materialsData[0].id)
          .order('order', { ascending: true });

        if (tocError) {
          setToast({ message: `Error fetching TOC: ${tocError.message}`, type: 'error' });
        } else {
          setToc(tocData || []);
          if (tocData?.length && tocData[0].href) {
            setCurrentSection(tocData[0].href);
          }
        }

        const sasUrl = await fetchSasUrl(materialsData[0].file_path, lessonId, session.access_token);
        if (sasUrl) setSasUrl(sasUrl);
      }
    } catch (err) {
      const errorMessage = (err as Error).message;
      console.error('EduProLessonDetail: Error:', err);
      setError(errorMessage);
      setToast({ message: errorMessage, type: 'error' });
      router.push(`/account/edupro/${slug}/topic/${topicSlug}`);
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToLesson = (lessonId: number) => {
    router.push(`/account/edupro/${slug}/topic/${topicSlug}/lesson/${lessonId}`);
  };

  useEffect(() => {
    if (session) {
      fetchUserRole();
      fetchLessonDetails();
    }
  }, [slug, topicSlug, lessonId, session, isStudent, studentLoading]);

  useEffect(() => {
    if (lessonId && session?.user?.id) {
      fetchLessonCompletionStatus();
    }
    if (topic?.id && allLessons.length && session?.user?.id) {
      fetchTopicCompletionStatus(topic.id);
    }
  }, [lessonId, topic, allLessons, session]);

  const currentLessonIndex = allLessons.findIndex((l) => l.id === Number(lessonId));
  const previousLesson = currentLessonIndex > 0 ? allLessons[currentLessonIndex - 1] : null;
  const nextLesson = currentLessonIndex < allLessons.length - 1 ? allLessons[currentLessonIndex + 1] : null;

  const shouldShowCompletionControls = () => {
    if (activeTab === 'theory' && materials.length > 0 && sasUrl && materials[0].file_type === 'epub') {
      return currentPage >= totalPages;
    }
    return true;
  };

  if (isLoading || studentLoading) return <LoadingSpinner />;
  if (error) return <ErrorDisplay error={error} />;

  return (
    <div className="min-h-screen pb-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} aria-live="polite" />}
        <div className="pt-8">
          <AccountTabEduProCourse />
          <TabNavigation tabs={TABS} activeTab={activeTab} setActiveTab={handleTabChange} />
        </div>
            <div className='mt-4 mb-4 text-center'>
                    <span className=" text-md text-sm sm:text-base font-semibold sm:py-1">Lesson</span>
            </div>
        <div className="px-2">
          {course && topic && lesson ? (
            <div>
              <div className="grid grid-cols-6">
                <div className="col-span-3">
                  <TopicHeader
                    topic={topic}
                    slug={slug}
                    topicSlug={topicSlug}
                    lesson={lesson}
                    isTopicCompleted={isTopicCompleted}
                  />
                </div>
                <div className="col-span-3">
                  <LessonHeader
                    lesson={lesson}
                    isLessonCompleted={isLessonCompleted}
                    toggleLessonCompletion={toggleLessonCompletion}
                    session={session}
                    previousLesson={previousLesson}
                    nextLesson={nextLesson}
                    navigateToLesson={navigateToLesson}
                  />
                </div>
              </div>
              {activeTab === 'theory' && materials.length > 0 && sasUrl ? (
                <div className="">
                  {materials[0].file_type === 'epub' ? (
                    <EpubViewer
                      epubUrl={sasUrl}
                      currentPage={currentPage}
                      setCurrentPage={setCurrentPage}
                      setTotalPages={setTotalPages}
                      toc={toc}
                      setCurrentSection={setCurrentSection}
                    />
                  ) : (
                    <p className="text-red-600">Unsupported file type: {materials[0].file_type}</p>
                  )}
                </div>
              ) : activeTab === 'theory' || activeTab === 'practice' ? (
                <div className="my-24 text-center">
                  {lesson.link_to_practice && (
                    <Link
                      href={lesson.link_to_practice}
                      className="inline-block text-base mb-4 bg-gradient-to-r from-sky-600 to-sky-700 text-white px-36 py-3 font-medium rounded-md shadow-md hover:from-sky-700 hover:to-sky-800 transition-all duration-200 cursor-pointer"
                    >
                      Start
                    </Link>
                  )}
                  {isAdmin && <LessonContent lesson={lesson} />}
                </div>
              ) : (
                <p className="mt-4 text-gray-600 text-center">
                  {materials.length === 0 ? 'No study materials available.' : 'Missing SAS URL.'}
                </p>
              )}

              {shouldShowCompletionControls() && (
                <div className="">
                  <CompletionControls
                    isLessonCompleted={isLessonCompleted}
                    toggleLessonCompletion={toggleLessonCompletion}
                    session={session}
                    isToggling={isToggling}
                  />
                </div>
              )}
            </div>
          ) : (
            <p className="mt-4 text-gray-600 text-center">No lesson details available.</p>
          )}
        </div>
      </div>
    </div>
  );
}