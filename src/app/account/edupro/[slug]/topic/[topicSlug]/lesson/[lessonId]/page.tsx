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
import EpubViewer from '@/components/edupro/EpubViewer';
import LessonContent from '@/components/edupro/LessonContent';
import { CheckIcon, ArrowLeftIcon, ArrowRightIcon, ArrowUpIcon } from '@heroicons/react/24/outline';
import {
  EduProCourse,
  EduProTopic,
  EduProLesson,
  Purchase,
  StudyMaterial,
  TocItem,
  Tab,
  ToastState,
} from '@/types/edupro';
import ProgressStatisticsCurrent from '@/components/quiz/ProgressStatisticsCurrent';
import Button from '@/ui/Button';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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
          className="w-4 h-4 bg-yellow-600 rounded-full animate-bounce cursor-pointer"
          style={{ animationDelay: `${delay}s` }}
        />
      ))}
    </div>
  </div>
);

const ErrorDisplay = ({ error }: { error: string | null }) => (
  <div className="min-h-screen pb-20 px-4 sm:px-6 lg:px-8">
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
  <Link href={`/account/edupro/${slug}/topic/${topicSlug}`}>
    <div
      className={`mx-auto max-w-7xl relative border-r-4 border-sky-600 px-4 py-2 sm:py-4 rounded-lg shadow-sm mb-4 min-h-[100px] sm:min-h-[120px] flex items-center group hover:bg-sky-50 cursor-pointer transition-colors duration-200 ${
        isTopicCompleted ? 'bg-teal-50' : 'bg-white'
      }`}
    >
      <ArrowUpIcon className="hidden group-hover:block absolute top-2 left-2 w-5 h-5 text-sky-600" aria-hidden="true" />
      <div className="flex flex-col space-y-0 flex-1">
        <div className="flex items-center justify-between">
          <div>
            <span className="sm:text-sm text-sm font-light text-gray-500">Topic</span>
            <h3 className="hidden sm:flex sm:text-base text-sm font-semibold text-gray-900 pr-8 hover:text-sky-600 transition-colors">
              {topic.title}
            </h3>
          </div>
          <span className="absolute top-2 right-2 flex items-center justify-center w-6 h-6 bg-sky-600 text-white text-xs font-medium rounded-full">
            {topic.order}
          </span>
        </div>
      </div>
    </div>
  </Link>
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
    className={`sm:ml-2 relative sm:pl-4 py-2 sm:py-4 mb-4 rounded-lg border-r-4 group min-h-[40px] sm:min-h-[120px] flex items-center ${
      isLessonCompleted ? 'border-teal-600 bg-teal-50' : 'border-sky-600 bg-sky-50'
    }`}
  >
    <div className="flex flex-col space-y-0 flex-1">
      <span className="sr-only text-sm font-light text-gray-500">Lesson</span>
      <div
        onClick={session ? toggleLessonCompletion : undefined}
        className={`hidden absolute top-2 right-2 flex items-center justify-center w-6 h-6 border-2 ${
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
      <div className="my-4">
        <h3 className="text-lg sm:text-xl font-bold text-sky-600 text-center px-4">{lesson.title}</h3>
        {lesson.description && <p className="text-sm text-gray-600 text-center">{lesson.description}</p>}
      </div>
      <div className="hidden absolute bottom-2 right-2 items-center space-x-2">
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
          <span className="absolute top-full right-0 mt-1 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            Next
          </span>
        </button>
      </div>
    </div>
  </div>
);

interface Quiz {
  id: number;
  title: string;
  description: string | null;
  slug: string | null;
  percent_required: number;
}

interface Topic {
  id: number;
  title: string;
}

interface QuizResult {
  id: string;
  quiz_id: number;
  created_at: string;
  exam_mode: boolean;
  questions_attempted: number;
  questions_correct: number;
  percent_correct: number;
  topics: Topic[];
}

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
  <div className="fixed bottom-10 sm:bottom-0 left-0 right-0 bg-white z-10 p-4 shadow-lg">
    <button
      onClick={toggleLessonCompletion}
      className={`w-full py-2 shadow px-4 border-2 ${
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
        <span data-completion-status="completed">
          <p className="text-sm sm:text-xl font-semibold">Lesson Completed</p>
          <p className="text-sm text-gray-400">Click to Mark as Incomplete</p>
        </span>
      ) : (
        <span className="completion-text" data-completion-status="incomplete">
          <p className="text-sm sm:text-xl font-semibold">Incomplete Lesson</p>
          <p className="text-sm text-gray-400">Click to Mark as Complete</p>
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
  const [courseTitle, setCourseTitle] = useState<string>('Loading...');
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLessonCompleted, setIsLessonCompleted] = useState<boolean>(false);
  const [isTopicCompleted, setIsTopicCompleted] = useState<boolean>(false);
  const [isToggling, setIsToggling] = useState<boolean>(false);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [latestQuizResult, setLatestQuizResult] = useState<QuizResult | null>(null);
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

      const lessonProgressMap: Record<number, boolean> = {};
      lessonIds.forEach((id) => {
        lessonProgressMap[id] = false;
      });
      if (progressData) {
        progressData.forEach((progress) => {
          lessonProgressMap[progress.lesson_id] = progress.completed;
        });
      }

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

  // Fetch lesson details, quizzes, and latest quiz attempt
  const fetchLessonDetails = async () => {
    if (studentLoading) return;
    setIsLoading(true);

    try {
      // Validate parameters
      if (!slug || !topicSlug || !lessonId) {
        throw new Error('Invalid URL parameters: slug, topicSlug, or lessonId missing');
      }
      console.log('Params:', { slug, topicSlug, lessonId });
      console.log('Session:', session);
      console.log('IsStudent:', isStudent, 'StudentLoading:', studentLoading);

      if (!session) {
        setError('You must be logged in to access this page.');
        return;
      }
      if (!isStudent) {
        setError('Access denied: You are not enrolled as a student.');
        return;
      }

      const { data: topicData, error: topicError } = await supabase
        .from('edu_pro_topic')
        .select('id, title, description, order, slug')
        .eq('slug', topicSlug)
        .single();
      console.log('TopicData:', topicData, 'TopicError:', topicError);
      if (topicError || !topicData) {
        setError(`Topic with slug "${topicSlug}" not found.`);
        return;
      }
      setTopic(topicData);

      const { data: courseTopicData, error: courseTopicError } = await supabase
        .from('edu_pro_coursetopic')
        .select('course_id')
        .eq('topic_id', topicData.id);
      console.log('CourseTopicData:', courseTopicData, 'CourseTopicError:', courseTopicError);
      if (courseTopicError || !courseTopicData?.length) {
        setError(`No courses found for topic "${topicSlug}".`);
        return;
      }

      const courseIds = courseTopicData.map((ct) => ct.course_id);
      const { data: courseData, error: courseError } = await supabase
        .from('edu_pro_course')
        .select('id, slug, title, description')
        .eq('slug', slug)
        .in('id', courseIds)
        .single();
      console.log('CourseData:', courseData, 'CourseError:', courseError);
      if (courseError || !courseData) {
        const { data: associatedCourse } = await supabase
          .from('edu_pro_course')
          .select('slug')
          .in('id', courseIds)
          .single();
        if (associatedCourse) {
          setToast({ message: `Topic "${topicSlug}" does not belong to course "${slug}". Redirecting.`, type: 'error' });
          router.push(`/account/edupro/${associatedCourse.slug}/topic/${topicSlug}`);
          return;
        }
        setError(`Course with slug "${slug}" not found.`);
        return;
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
      console.log('AllLessonsData:', allLessonsData, 'AllLessonsError:', allLessonsError);
      if (allLessonsError || !allLessonsData) {
        setError(`Error fetching lessons for topic "${topicSlug}": ${allLessonsError?.message}`);
        return;
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
      console.log('LessonData:', lessonData, 'LessonError:', lessonError);
      if (lessonError || !lessonData) {
        setError(`Lesson with ID "${lessonId}" not found or does not belong to topic "${topicSlug}".`);
        return;
      }
      setLesson(lessonData);

      // Fetch quizzes for the course
      const { data: quizzesData, error: quizzesError } = await supabase
        .from('quiz_quizcommon')
        .select('id, title, description, slug, percent_required')
        .eq('course_id', courseData.id);
      console.log('QuizzesData:', quizzesData, 'QuizzesError:', quizzesError);
      if (quizzesError) {
        console.warn('Failed to fetch quizzes:', quizzesError.message);
        setQuizzes([]);
      } else {
        setQuizzes(quizzesData ?? []);
      }

      // Fetch latest quiz attempt for this lesson's quiz, using lesson_id
      if (session?.user?.id && lessonData?.link_to_practice && quizzesData?.length) {
        const quizSlug = lessonData.link_to_practice.split('/').pop();
        const quiz = quizzesData.find(q => q.slug === quizSlug || q.id.toString() === quizSlug);
        const quizId = quiz?.id || quizzesData[0]?.id;
        console.log('Fetching quiz attempt for user:', session.user.id, 'quizId:', quizId, 'lessonId:', lessonId);
        const { data: attemptData, error: attemptError } = await supabase
          .from('quiz_quizstatistic')
          .select('id, quiz_id, created_at, exam_mode, questions_attempted, questions_correct, percent_correct')
          .eq('user_id', session.user.id)
          .eq('quiz_id', quizId)
          .eq('lesson_id', lessonId) // Filter by lesson_id
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        console.log('AttemptData:', attemptData, 'AttemptError:', attemptError);
        if (attemptError && attemptError.code !== 'PGRST116') {
          console.warn('Failed to fetch latest quiz attempt:', attemptError.message);
          setLatestQuizResult(null);
        } else if (attemptData) {
          let topics: Topic[] = [];
          const { data: answerData, error: answerError } = await supabase
            .from('quiz_useranswer')
            .select('topic_id')
            .eq('quiz_statistic_id', attemptData.id)
            .eq('user_id', session.user.id);
          if (answerError) {
            console.warn(`Error fetching topic IDs for attempt ${attemptData.id}: ${answerError.message}`);
          } else if (answerData?.length) {
            const topicIds = [...new Set(answerData.map((answer: any) => answer.topic_id).filter((id: any) => id))];
            if (topicIds.length) {
              const { data: topicData, error: topicError } = await supabase
                .from('edu_pro_quiz_topic')
                .select('id, title')
                .in('id', topicIds);
              if (topicError) {
                console.warn(`Error fetching topic details: ${topicError.message}`);
              } else if (topicData) {
                topics = topicData.map((topic: any) => ({ id: topic.id, title: topic.title }));
              }
            }
          }
          setLatestQuizResult({ ...attemptData, topics });
        } else {
          setLatestQuizResult(null);
        }
      }

      const { data: materialsData, error: materialsError } = await supabase
        .from('study_materials')
        .select('id, lesson_id, file_path, file_type')
        .eq('lesson_id', lessonId);
      console.log('MaterialsData:', materialsData, 'MaterialsError:', materialsError);
      if (materialsError) {
        setError(`Error fetching materials: ${materialsError.message}`);
        return;
      }
      setMaterials(materialsData || []);

      if (materialsData?.length) {
        const { data: tocData, error: tocError } = await supabase
          .from('material_toc')
          .select('id, material_id, topic, page_number, href, order')
          .eq('material_id', materialsData[0].id)
          .order('order', { ascending: true });
        console.log('TocData:', tocData, 'TocError:', tocError);
        if (tocError) {
          setToast({ message: `Error fetching TOC: ${tocError.message}`, type: 'error' });
        } else {
          setToc(tocData || []);
          if (tocData?.length && tocData[0].href) {
            setCurrentSection(tocData[0].href);
          }
        }

        const sasUrl = await fetchSasUrl(materialsData[0].file_path, lessonId, session.access_token);
        console.log('SasUrl:', sasUrl);
        if (sasUrl) setSasUrl(sasUrl);
      }
    } catch (err) {
      const errorMessage = (err as Error).message;
      console.error('EduProLessonDetail: Error:', err);
      setError(errorMessage);
      setToast({ message: errorMessage, type: 'error' });
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

  return (
    <div className="min-h-screen pb-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} aria-live="polite" />}
        <div className="pt-0">
          <AccountTabEduProCourse />
          <TabNavigation tabs={TABS} activeTab={activeTab} setActiveTab={handleTabChange} />
        </div>
        <div className="mt-4 mb-4 grid grid-cols-3">
          {topic && (
          <Link href={`/account/edupro/${slug}/topic/${topicSlug}`} className="flex sm:justify-start justify-center items-center text-gray-600 hover:text-sky-600">
            <ArrowUpIcon className='h-5 w-5'/>
          </Link>
          )}
          <div className="flex-1 flex justify-center items-center space-x-3">
            <span className="text-md text-sm sm:text-base font-semibold sm:py-1" aria-label="Current Lesson Section">
              Lesson
            </span>
            {lesson && (
              <span
                onClick={session ? toggleLessonCompletion : undefined}
                className={`flex items-center justify-center w-6 h-6 border-2 ${
                  isLessonCompleted ? 'bg-teal-600 hover:bg-teal-500 text-white' : 'border-sky-600 text-sky-600'
                } text-xs font-medium rounded-full transition-all duration-200 ${
                  session ? 'cursor-pointer hover:scale-110 hover:bg-teal-50' : 'cursor-default'
                } group-hover:ring-2 group-hover:ring-teal-300 group`}
                aria-label={isLessonCompleted ? 'Mark as Incomplete' : 'Mark as Complete'}
                title={isLessonCompleted ? 'Mark as Incomplete' : 'Mark as Complete'}
              >
                <span className="group-hover:hidden">{lesson.order}</span>
                {session && <CheckIcon className="hidden group-hover:block w-4 h-4" />}
              </span>
            )}
          </div>
          <div className="flex justify-center sm:justify-end items-center space-x-2">
            <button
              onClick={() => previousLesson && navigateToLesson(previousLesson.id)}
              disabled={!previousLesson}
              className="cursor-pointer relative p-1 text-gray-600 hover:text-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 group"
              aria-label="Previous Lesson"
              aria-disabled={!previousLesson}
            >
              <ArrowLeftIcon className="w-5 h-5" />
              <span className="absolute bottom-full right-0 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                Prev
              </span>
            </button>
            <button
              onClick={() => nextLesson && navigateToLesson(nextLesson.id)}
              disabled={!nextLesson}
              className="cursor-pointer relative p-1 text-gray-600 hover:text-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 group"
              aria-label="Next Lesson"
              aria-disabled={!nextLesson}
            >
              <ArrowRightIcon className="w-5 h-5" />
              <span className="absolute bottom-full right-0 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                Next
              </span>
            </button>
          </div>
        </div>
        <div>
          {course && topic && lesson ? (
            <div>
              <div className="grid grid-cols-3 sm:grid-cols-6">
                <div className="hidden sm:block col-span-1 sm:col-span-2">
                  <TopicHeader
                    topic={topic}
                    slug={slug}
                    topicSlug={topicSlug}
                    lesson={lesson}
                    isTopicCompleted={isTopicCompleted}
                  />
                </div>
                <div className="col-span-3 sm:col-span-4">
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
                <div>
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
                <div className="mb-16 py-8  text-center bg-gray-50 px-4 rounded-lg shadow-sm">
                  {latestQuizResult ? (
                    <ProgressStatisticsCurrent quizId={latestQuizResult.quiz_id} lessonId={lessonId} />
                  ) : (
                    <p className="text-gray-600 mb-4"></p>
                  )}
                  {lesson.link_to_practice && (
                    <div className='mx-auto max-w-lg'>
                    <Link
                      href={`${lesson.link_to_practice}&lessonId=${lessonId}`}
                      className='mt-8'
                      onClick={() => console.log('Navigating to quiz with lessonId:', lessonId)}
                    >
                      <Button variant='start'>
                      Start Training
                      </Button>
                    </Link>
                    </div>
                  )}
                  {isAdmin && <LessonContent lesson={lesson} />}
                </div>
              ) : (
                <p className="mt-4 text-gray-600 text-center">
                  {materials.length === 0 ? 'No study materials available.' : 'Missing SAS URL.'}
                </p>
              )}
              {shouldShowCompletionControls() && (
                <CompletionControls
                  isLessonCompleted={isLessonCompleted}
                  toggleLessonCompletion={toggleLessonCompletion}
                  session={session}
                  isToggling={isToggling}
                />
              )}
            </div>
          ) : (
            <p className="mt-4 text-gray-600 text-center">.</p>
          )}
        </div>
      </div>
    </div>
  );
}