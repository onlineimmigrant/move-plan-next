// app/account/edupro/[slug]/page.tsx
'use client';

import { useState, Dispatch, SetStateAction, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import AccountTabEduProCourse from '@/components/AccountTabEduProCourse';
import StudyBooks from '@/components/StudyBooks';
import Practice from '@/components/Practice';
import Toast from '@/components/Toast';
import TabNavigation from '@/components/TheoryPracticeBooksTabs/TabNavigation';
import { useCourseAndTopics } from '@/lib/hooks/useCourseAndTopics';
import { useAuth } from '@/context/AuthContext';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Define Tab type to match TabNavigation
type Tab = 'theory' | 'practice' | 'studyBooks';

// Define TabOption interface
interface TabOption {
  label: string;
  value: Tab;
}

export default function EduProCourseDetail() {
  const params = useParams();
  const slug = params?.slug as string;
  const { course, topics, isLoading, error, toast, setToast } = useCourseAndTopics(slug);
  const { session } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('theory');
  const [topicCompletion, setTopicCompletion] = useState<Record<number, boolean>>({});

  // Define the tabs for "Theory," "Practice," and "Books"
  const TABS: TabOption[] = [
    { label: 'Theory', value: 'theory' },
    { label: 'Practice', value: 'practice' },
    { label: 'Books', value: 'studyBooks' },
  ] as const;

  // Fetch lesson progress to determine topic completion
  const fetchTopicCompletion = async () => {
    if (!session?.user?.id || !topics.length) return;

    try {
      // Fetch all lessons for the topics
      const topicIds = topics.map((topic) => topic.id);
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('edu_pro_lesson')
        .select('id, topic_id')
        .in('topic_id', topicIds);

      if (lessonsError) throw new Error(`Error fetching lessons: ${lessonsError.message}`);

      if (!lessonsData?.length) {
        // If no lessons, mark all topics as incomplete
        const completionMap: Record<number, boolean> = {};
        topics.forEach((topic) => {
          completionMap[topic.id] = false;
        });
        setTopicCompletion(completionMap);
        return;
      }

      // Fetch lesson progress for the user
      const lessonIds = lessonsData.map((lesson) => lesson.id);
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
      progressData?.forEach((progress) => {
        lessonProgressMap[progress.lesson_id] = progress.completed;
      });

      // Determine topic completion
      const completionMap: Record<number, boolean> = {};
      topics.forEach((topic) => {
        const topicLessons = lessonsData.filter((lesson) => lesson.topic_id === topic.id);
        if (topicLessons.length === 0) {
          completionMap[topic.id] = false; // No lessons means incomplete
        } else {
          const allCompleted = topicLessons.every((lesson) => lessonProgressMap[lesson.id]);
          completionMap[topic.id] = allCompleted;
        }
      });

      setTopicCompletion(completionMap);
    } catch (err) {
      console.error('fetchTopicCompletion: Error:', err);
      setToast({ message: 'Failed to fetch topic completion status', type: 'error' });
    }
  };

  useEffect(() => {
    if (!isLoading && topics.length && session) {
      fetchTopicCompletion();
    }
  }, [isLoading, topics, session]);

  if (isLoading) {
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
          <TabNavigation tabs={TABS} activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>
        <div className="px-4">
          {course ? (
            <div>
              <div>
                {/* Tab panels */}
                <div>
                  <div
                    id="theory-panel"
                    role="tabpanel"
                    aria-labelledby="theory-tab"
                    hidden={activeTab !== 'theory'}
                  >
                    {topics.length > 0 ? (
                    <div>
                        <div className='mt-8 mb-4 text-center'>
                            <span className=" text-md text-sm sm:text-base font-semibold sm:py-1">Topics</span>
                        </div>
                        
                      <ul className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
                        {topics.map((topic) => {
                          const isCompleted = topicCompletion[topic.id];
                          const topicBackground = isCompleted ? 'teal-600' : 'sky-600';
                          return (
                            <li
                              key={topic.id}
                              className={`relative border-l-8 border-${topicBackground} pl-8 py-2 rounded-lg shadow-sm hover:shadow-md transition-shadow ${
                                isCompleted ? 'bg-teal-100' : 'bg-white'
                              }`}
                            >
                              <span
                                className={`absolute bottom-2 right-2 flex items-center justify-center sm:w-6 w-5 sm:h-6 h-5 bg-${topicBackground} text-white text-xs font-medium rounded-full`}
                              >
                                {topic.order}
                              </span>
                              <Link href={`/account/edupro/${course.slug}/topic/${topic.slug}`}>
                                <h3 className="text-base font-medium text-gray-900 pr-8 hover:text-sky-600 transition-colors">
                                  {topic.title}
                                </h3>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                      </div>
                    ) : (
                      <p className="mt-2 text-gray-600 text-center">No topics available for this course.</p>
                    )}
                  </div>

                  <div
                    id="practice-panel"
                    role="tabpanel"
                    aria-labelledby="practice-tab"
                    hidden={activeTab !== 'practice'}
                  >
                    <Practice courseId={course.id} courseSlug={course.slug} />
                  </div>

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