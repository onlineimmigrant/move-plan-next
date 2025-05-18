// app/account/edupro/[slug]/page.tsx
'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import AccountTabEduProCourse from '@/components/AccountTabEduProCourse';
import StudyBooks from '@/components/StudyBooks';
import Practice from '@/components/Practice';
import Toast from '@/components/Toast';
import { useCourseAndTopics } from '@/lib/hooks/useCourseAndTopics';

export default function EduProCourseDetail() {
  const params = useParams();
  const slug = params?.slug as string;
  const { course, topics, isLoading, error, toast, setToast } = useCourseAndTopics(slug);
  const [activeTab, setActiveTab] = useState<'topics' | 'studyBooks' | 'practice'>('topics');

  // Define the tabs for "Topics," "Practice," and "Books"
  const tabs = [
    { label: 'Topics', value: 'topics' },
    { label: 'Practice', value: 'practice' },
    { label: 'Books', value: 'studyBooks' },
  ];

  // Determine the translate-x for the sliding background
  const getSliderPosition = () => {
    const activeIndex = tabs.findIndex((tab) => activeTab === tab.value);
    console.log('Active Tab Index:', activeIndex, 'Active Tab:', activeTab); // Debug log
    if (activeIndex === 0) return 'translate-x-0';
    if (activeIndex === 1) return 'translate-x-[100%]';
    if (activeIndex === 2) return 'translate-x-[200%]';
    return 'translate-x-0'; // Default to first tab
  };

  if (isLoading) {
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
          {course ? (
            <div>
              <div>
                {/* Tabbed navigation */}
                <div className="select-none flex justify-center mb-8" role="tablist" aria-label="Course Sections">
                  <div className="relative w-full max-w-[480px] h-11 bg-transparent border-2 border-transparent rounded-lg cursor-pointer overflow-hidden px-0.5">
                    {/* Sliding Background */}
                    <div
                      className={`absolute top-0.5 bottom-0.5 left-0.5 w-[calc(33.33%-2px)] bg-sky-600 rounded-md transition-transform  duration-200 ease-in-out transform ${getSliderPosition()}`}
                    ></div>
                    {/* Tab Labels */}
                    <div className="relative flex h-full">
                      {tabs.map((tab, index) => (
                        <button
                          key={tab.value}
                          id={`${tab.value}-tab`}
                          role="tab"
                          aria-selected={activeTab === tab.value}
                          aria-controls={`${tab.value}-panel`}
                          onClick={() => setActiveTab(tab.value as 'topics' | 'studyBooks' | 'practice')}
                          className={`flex-1 flex justify-center cursor-pointer items-center text-sky-600 text-sm sm:text-base mona-sans px-0.5 ${
                            activeTab === tab.value ? 'font-semibold text-white z-10' : ''
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Tab panels */}
                <div>
                  <div
                    id="topics-panel"
                    role="tabpanel"
                    aria-labelledby="topics-tab"
                    hidden={activeTab !== 'topics'}
                  >
                    {topics.length > 0 ? (
                      <ul className="mt-2 grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {topics.map((topic) => (
                          <li
                            key={topic.id}
                            className="relative border-l-8 border-sky-600 pl-8 py-8 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
                          >
                            <span className="absolute top-2 right-2 flex items-center justify-center w-6 h-6 bg-sky-600 text-white text-xs font-medium rounded-full">
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
                        ))}
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