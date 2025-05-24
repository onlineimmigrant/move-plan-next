// app/account/edupro/[slug]/page.tsx
'use client';

import { useState, Dispatch, SetStateAction } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import AccountTabEduProCourse from '@/components/AccountTabEduProCourse';
import StudyBooks from '@/components/StudyBooks';
import Practice from '@/components/Practice';
import Toast from '@/components/Toast';
import TabNavigation from '@/components/TheoryPracticeBooksTabs/TabNavigation';
import { useCourseAndTopics } from '@/lib/hooks/useCourseAndTopics';

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
  const [activeTab, setActiveTab] = useState<Tab>('practice');

  // Define the tabs for "Theory," "Practice," and "Books"
  const TABS: TabOption[] = [
    { label: 'Theory', value: 'theory' },
    { label: 'Practice', value: 'practice' },
    { label: 'Books', value: 'studyBooks' },
  ] as const;

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
        <div className="">
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
                      <ul className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {topics.map((topic) => {
                          const topicBackground = topic.background_color || 'sky-600';
                          return (
                            <li
                              key={topic.id}
                              className={`relative border-l-8 border-${topicBackground} pl-8 py-12 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow`}
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
                                <p className="pr-8 text-sm text-gray-600 mt-1">
                                  {topic.description || 'No description available.'}
                                </p>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
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