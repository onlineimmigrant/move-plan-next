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

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const router = useRouter();
  const { slug, topicSlug, lessonId } = useParams();
  const { session } = useAuth();
  const { isStudent, isLoading: studentLoading } = useStudentStatus();

  const [activeTab, setActiveTab] = useState<'theory' | 'practice' | 'studyBooks'>('theory');

  const tabs = [
    { label: 'Theory', value: 'theory' },
    { label: 'Practice', value: 'practice' },
    { label: 'Books', value: 'studyBooks' },
  ];

  const handleTabChange: Dispatch<SetStateAction<string>> = (tabValue) => {
    const newTab = typeof tabValue === 'string' ? tabValue : tabValue(activeTab);
    setActiveTab(newTab as 'theory' | 'practice' | 'studyBooks');
    if (newTab === 'practice') {
      router.push(`/account/edupro/${slug}/practice`);
    } else if (newTab === 'studyBooks') {
      // Stay on this page
    } else if (newTab === 'theory') {
      router.push(`/account/edupro/${slug}/topic/${topicSlug}`);
    }
  };

  const isPurchaseActive = (purchase: Purchase) => {
    if (!purchase.is_active) return false;
    const currentDate = new Date();
    const startDate = new Date(purchase.start_date);
    const endDate = purchase.end_date ? new Date(purchase.end_date) : null;
    return currentDate >= startDate && (!endDate || currentDate <= endDate);
  };

  const fetchSasUrl = async (filePath: string, lessonId: string) => {
    try {
      if (!session?.access_token) {
        console.error('No access token available');
        setToast({ message: 'Authentication error: Please log in again', type: 'error' });
        return null;
      }
      console.log('Fetching SAS URL with token:', session.access_token.slice(0, 10) + '...');
      console.log('Request payload:', { filePath, lessonId });
      const response = await fetch('/api/generate-sas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ filePath, lessonId }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('SAS URL fetch failed:', response.status, errorText);
        setToast({ message: `Failed to load study material: ${errorText}`, type: 'error' });
        return null;
      }

      const { sasUrl } = await response.json();
      console.log('Received SAS URL:', sasUrl);
      return sasUrl;
    } catch (err) {
      console.error('SAS URL fetch error:', err);
      setToast({ message: 'Failed to load study material', type: 'error' });
      return null;
    }
  };

  useEffect(() => {
    const fetchLessonDetails = async () => {
      if (studentLoading) return;

      setIsLoading(true);
      console.log('Session:', session);
      console.log('Params:', { slug, topicSlug, lessonId });
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

        // Fetch topic
        const { data: topicDataArray, error: topicError } = await supabase
          .from('edu_pro_topic')
          .select('id, title, description, order, slug')
          .eq('slug', topicSlug);

        if (topicError || !topicDataArray?.length) {
          throw new Error(`Error fetching topic: ${topicError?.message || 'Topic not found'}`);
        }

        const topicData = topicDataArray[0];
        setTopic(topicData);

        // Fetch course
        const { data: courseTopicData, error: courseTopicError } = await supabase
          .from('edu_pro_coursetopic')
          .select('course_id')
          .eq('topic_id', topicData.id);

        if (courseTopicError || !courseTopicData?.length) {
          throw new Error(`Error fetching course-topic relationship: ${courseTopicError?.message || 'No course found'}`);
        }

        const courseIds = courseTopicData.map((ct) => ct.course_id);
        const { data: courseDataArray, error: courseError } = await supabase
          .from('edu_pro_course')
          .select('id, slug, title, description')
          .eq('slug', slug)
          .in('id', courseIds);

        if (courseError || !courseDataArray?.length) {
          const { data: associatedCourses } = await supabase
            .from('edu_pro_course')
            .select('slug')
            .in('id', courseIds)
            .limit(1);

          if (associatedCourses?.length) {
            setToast({
              message: `Topic "${topicSlug}" does not belong to course "${slug}". Redirecting.`,
              type: 'error',
            });
            router.push(`/account/edupro/${associatedCourses[0].slug}/topic/${topicSlug}`);
            return;
          }
          throw new Error(`Course with slug "${slug}" not found.`);
        }

        const courseData = courseDataArray[0];
        setCourse(courseData);

        // Fetch lesson
        const { data: lessonDataArray, error: lessonError } = await supabase
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
          .eq('id', lessonId)
          .eq('topic_id', topicData.id);

        if (lessonError || !lessonDataArray?.length) {
          throw new Error(`Lesson with ID "${lessonId}" not found or does not belong to topic "${topicSlug}".`);
        }

        const lessonData = lessonDataArray[0];
        setLesson(lessonData);

        // Fetch study materials
        const { data: materialsData, error: materialsError } = await supabase
          .from('study_materials')
          .select('id, lesson_id, file_path, file_type')
          .eq('lesson_id', lessonId);

        if (materialsError) {
          throw new Error(`Error fetching materials: ${materialsError.message}`);
        }

        console.log('Study materials:', materialsData);
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
            console.log('TOC data:', tocData);
            setToc(tocData || []);
            if (tocData?.length && tocData[0].href) {
              setCurrentSection(tocData[0].href);
            }
          }

          console.log('Fetching SAS URL for material:', materialsData[0]);
          const sasUrl = await fetchSasUrl(materialsData[0].file_path, lessonId as string);
          console.log('SAS URL result:', sasUrl);
          if (sasUrl) {
            setSasUrl(sasUrl);
          } else {
            console.warn('No SAS URL returned for EPUB');
          }
        } else {
          console.warn('No study materials found for lesson:', lessonId);
        }

        // Verify purchase (this is already securing access to the page)
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

        console.log('Active purchases:', activePurchases);
        const hasAccess = activePurchases.some((purchase) => {
          if (!purchase.pricingplan || !purchase.pricingplan.product) {
            console.warn('Purchase missing pricingplan or product:', purchase);
            return false;
          }
          return isPurchaseActive(purchase) && purchase.pricingplan.product.course_connected_id === courseData.id;
        });

        if (!hasAccess) {
          setToast({ message: 'You do not have access to this course.', type: 'error' });
          router.push('/account/edupro');
          return;
        }
      } catch (err) {
        console.error('EduProLessonDetail: Error:', err);
        setError((err as Error).message);
        setToast({ message: (err as Error).message, type: 'error' });
        router.push(`/account/edupro/${slug}/topic/${topicSlug}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLessonDetails();
  }, [slug, topicSlug, lessonId, session, isStudent, studentLoading, router]);

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
      <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-red-600 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  console.log('Rendering with:', { activeTab, materialsLength: materials.length, sasUrl });
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
          <TabNavigation tabs={tabs} activeTab={activeTab} setActiveTab={handleTabChange} />
        </div>
        <div className="px-6">
          {course && topic && lesson ? (
            <div>
              <Link href={`/account/edupro/${slug}/topic/${topicSlug}`}>
                <div className="mt-4 mx-auto max-w-7xl relative border-l-8 border-sky-600 pl-4 py-4 pt-2 bg-white rounded-lg shadow-sm mb-4 hover:shadow-md transition-shadow">
                  <span className='text-sm font-light text-gray-500'>Topic</span>
                  <span className="absolute top-4 right-4 flex items-center justify-center w-6 h-6 bg-sky-600 text-white text-xs font-medium rounded-full">
                    {topic.order}
                  </span>
                  <h3 className="text-base font-semibold text-gray-900 pr-8 hover:text-sky-600 transition-colors">
                    {topic.title}
                  </h3>
                </div>
              </Link>

            <div className="relative border-l-4 border-sky-600 pl-4 py-4 pt-2 bg-white rounded-lg shadow-sm">
                  <span className='text-sm font-light text-gray-500'>Lesson</span>
                  <span className="absolute top-4 right-4 flex items-center justify-center w-6 h-6 border border-sky-600 text-sky-600 text-xs font-medium rounded-full">
                    {lesson.order}
                  </span>
                  <h3 className="text-base font-medium text-gray-900 pr-8">{lesson.title}</h3>
                  {lesson.description && (
                    <p className="text-sm text-gray-600 mt-2">{lesson.description}</p>
                  )}
                  </div>

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
              ) : activeTab === 'theory' ? (
                <div className="relative border-l-4 border-sky-600 pl-4 py-4 bg-white rounded-lg shadow-sm">
                  <span className="absolute top-2 right-2 flex items-center justify-center w-6 h-6 bg-sky-600 text-white text-xs font-medium rounded-full">
                    {lesson.order}
                  </span>
                  <h3 className="text-lg font-medium text-gray-900 pr-8">{lesson.title}</h3>
                  {lesson.description && (
                    <p className="text-sm text-gray-600 mt-2">{lesson.description}</p>
                  )}
                  {lesson.duration && (
                    <p className="text-sm text-gray-500 mt-2">Duration: {lesson.duration}</p>
                  )}
                  {lesson.content_type && (
                    <p className="text-sm text-gray-500 mt-2">Content Type: {lesson.content_type}</p>
                  )}
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
              ) : activeTab === 'studyBooks' ? (
                <p className="mt-4 text-gray-600 text-center">
                  {materials.length === 0 ? 'No study materials available.' : 'Missing SAS URL.'}
                </p>
              ) : (
                <div className="relative border-l-4 border-sky-600 pl-4 py-4 bg-white rounded-lg shadow-sm">
                  <span className="absolute top-2 right-2 flex items-center justify-center w-6 h-6 bg-sky-600 text-white text-xs font-medium rounded-full">
                    {lesson.order}
                  </span>
                  <h3 className="text-lg font-medium text-gray-900 pr-8">{lesson.title}</h3>
                  {lesson.description && (
                    <p className="text-sm text-gray-600 mt-2">{lesson.description}</p>
                  )}
                  {lesson.duration && (
                    <p className="text-sm text-gray-500 mt-2">Duration: {lesson.duration}</p>
                  )}
                  {lesson.content_type && (
                    <p className="text-sm text-gray-500 mt-2">Content Type: {lesson.content_type}</p>
                  )}
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