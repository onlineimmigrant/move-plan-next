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
                <div className="flex justify-center mb-4" role="tablist" aria-label="Course Sections">
                  <button
                    id="topics-tab"
                    role="tab"
                    aria-selected={activeTab === 'topics'}
                    aria-controls="topics-panel"
                    onClick={() => setActiveTab('topics')}
                    className={`px-2 py-1 mx-4 sm:mx-2 text-sm font-semibold text-white rounded-full transition-transform
                      ${
                        activeTab === 'topics'
                          ? 'bg-sky-600 shadow-md scale-120'
                          : 'bg-gray-600'
                      }`}
                  >
                    Topics
                  </button>
                  <button
                    id="practice-tab"
                    role="tab"
                    aria-selected={activeTab === 'practice'}
                    aria-controls="practice-panel"
                    onClick={() => setActiveTab('practice')}
                    className={`px-2 py-1 mx-4 sm:mx-2 text-sm font-semibold text-white rounded-full transition-transform
                      ${
                        activeTab === 'practice'
                          ? 'bg-sky-600 shadow-md scale-120'
                          : 'bg-gray-600'
                      }`}
                  >
                    Practice
                  </button>
                  <button
                    id="studyBooks-tab"
                    role="tab"
                    aria-selected={activeTab === 'studyBooks'}
                    aria-controls="studyBooks-panel"
                    onClick={() => setActiveTab('studyBooks')}
                    className={`px-2 py-1 mx-4 sm:mx-2 text-sm font-semibold text-white rounded-full transition-transform
                      ${
                        activeTab === 'studyBooks'
                          ? 'bg-sky-600 shadow-md scale-120'
                          : 'bg-gray-600'
                      }`}
                  >
                    Books
                  </button>
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
                            className="relative border-l-8 border-sky-600 pl-4 py-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
                          >
                            <span className="absolute top-2 right-2 flex items-center justify-center w-6 h-6 bg-sky-600 text-white text-xs font-medium rounded-full">
                              {topic.order}
                            </span>
                            <Link href={`/account/edupro/${course.slug}/topic/${topic.slug}`}>
                              <h3 className="text-sm font-medium text-gray-900 pr-8 hover:text-sky-600 transition-colors">
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