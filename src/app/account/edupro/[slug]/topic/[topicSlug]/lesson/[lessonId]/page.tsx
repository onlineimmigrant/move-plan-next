// app/account/edupro/[slug]/topic/[topicSlug]/lesson/[lessonId]/page.tsx
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
          className="w-4 h-4 bg-sky-600 rounded-full animate-bounce"
          style={{ animationDelay: `${delay}s` }}
        />
      ))}
    </div>
  </div>
);

const ErrorDisplay = ({ error }: { error: string | null }) => (
  <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
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
}: {
  topic: EduProTopic;
  slug: string;
  topicSlug: string;
  lesson: EduProLesson;
}) => (
  <Link href={`/account/edupro/${slug}/topic/${topicSlug}`}>
    <div className="mx-auto max-w-7xl relative border-l-8 border-sky-600 px-4 py-4 bg-white rounded-lg shadow-sm mb-4 hover:shadow-md transition-shadow">
      <div className="flex flex-col space-y-0">
        <div>
          <span className="absolute top-4 right-4 flex items-center justify-center w-6 h-6 bg-sky-600 text-white text-xs font-medium rounded-full">
            {topic.order}
          </span>
          <h3 className="text-base font-semibold text-gray-900 pr-8 hover:text-sky-600 transition-colors">
            {topic.title}
          </h3>
        </div>
        <LessonHeaderDesktop lesson={lesson} />
      </div>
    </div>
  </Link>
);

const LessonHeaderDesktop = ({ lesson }: { lesson: EduProLesson }) => (
  <div className="hidden sm:flex justify-center items-center bg-white">
    <div className="flex items-center space-x-2 px-4 max-w-md">
      <span className="flex-shrink-0 text-sm font-light text-gray-500">Lesson</span>
      <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 border border-sky-600 text-sky-600 text-xs font-medium rounded-full">
        {lesson.order}
      </span>
      <h3 className="pl-8 text-base font-medium text-gray-900 max-w-full truncate">{lesson.title}</h3>
      {lesson.description && <p className="text-sm text-gray-600 max-w-full truncate">{lesson.description}</p>}
    </div>
  </div>
);

const LessonHeader = ({ lesson }: { lesson: EduProLesson }) => (
  <div className="sm:hidden relative pl-4 py-4 pt-2 bg-white rounded-lg">
    <span className="text-sm font-light text-gray-500">Lesson</span>
    <span className="absolute top-4 right-4 flex items-center justify-center w-6 h-6 border border-sky-600 text-sky-600 text-xs font-medium rounded-full">
      {lesson.order}
    </span>
    <h3 className="text-base font-medium text-gray-900 pr-8">{lesson.title}</h3>
    {lesson.description && <p className="text-sm text-gray-600 mt-2">{lesson.description}</p>}
  </div>
);

const LessonContent = ({ lesson }: { lesson: EduProLesson }) => (
  <div className="relative pl-4 py-4 bg-white rounded-lg shadow-sm">
    <span className="absolute top-2 right-2 flex items-center justify-center w-6 h-6 bg-sky-600 text-white text-xs font-medium rounded-full">
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
          className="text-sky-600 hover:underline"
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
          className="text-sky-600 hover:underline"
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
          className="text-sky-600 hover:underline"
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

export default function EduProLessonDetail() {
  const [course, setCourse] = useState<EduProCourse | null>(null);
  const [topic, setTopic] = useState<EduProTopic | null>(null);
  const [lesson, setLesson] = useState<EduProLesson | null>(null);
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [toc, setToc] = useState<TocItem[]>([]);
  const [sasUrl, setSasUrl] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [currentSection, setCurrentSection] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
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

  // Fetch lesson details
  const fetchLessonDetails = async () => {
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

      // Fetch course
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

      // Fetch lesson
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

      // Fetch study materials
      const { data: materialsData, error: materialsError } = await supabase
        .from('study_materials')
        .select('id, lesson_id, file_path, file_type')
        .eq('lesson_id', lessonId);

      if (materialsError) throw new Error(`Error fetching materials: ${materialsError.message}`);
      setMaterials(materialsData || []);

      // Fetch TOC and SAS URL
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

  useEffect(() => {
    if (session) {
      fetchUserRole();
      fetchLessonDetails();
    }
  }, [slug, topicSlug, lessonId, session, isStudent, studentLoading]);

  if (isLoading || studentLoading) return <LoadingSpinner />;
  if (error) return <ErrorDisplay error={error} />;

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} aria-live="polite" />}
        <div className="pt-8">
          <AccountTabEduProCourse />
          <TabNavigation tabs={TABS} activeTab={activeTab} setActiveTab={handleTabChange} />
        </div>
        <div className="px-4">
          {course && topic && lesson ? (
            <div>
              <TopicHeader topic={topic} slug={slug} topicSlug={topicSlug} lesson={lesson} />
              <LessonHeader lesson={lesson} />
              {activeTab === 'theory' && materials.length > 0 && sasUrl ? (
                <div className="mt-4">
                  {materials[0].file_type === 'epub' ? (
                    <EpubViewer
                      epubUrl={sasUrl}
                      currentPage={currentPage}
                      setCurrentPage={setCurrentPage}
                      toc={toc}
                      setCurrentSection={setCurrentSection}
                    />
                  ) : (
                    <p className="text-red-600">Unsupported file type: {materials[0].file_type}</p>
                  )}
                </div>
              ) : activeTab === 'theory' || activeTab === 'practice' ? (
                <div className="mt-16 text-center">
                  {lesson.link_to_practice && (
                    <Link
                      href={lesson.link_to_practice}
                      className="inline-block text-base mb-4 bg-sky-500 text-white px-16 py-3 font-medium rounded-md hover:bg-sky-700 transition-colors"
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
            </div>
          ) : (
            <p className="mt-4 text-gray-600 text-center">No lesson details available.</p>
          )}
        </div>
      </div>
    </div>
  );
}