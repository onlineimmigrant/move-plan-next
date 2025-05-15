'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { styles } from '@/lib/styles';

interface EduProTopic {
  id: number;
  title: string;
  description: string;
  order: number;
  slug: string;
}

interface CourseTopicResponse {
  edu_pro_topic: EduProTopic[]; // Changed to an array of EduProTopic
}

interface PracticeSettingsProps {
  courseId: number;
  quizId: number;
  quizSlug: string;
  courseSlug: string;
}

const getInitialExamMode = () => {
  if (typeof window === 'undefined') return true;
  const storedMode = localStorage.getItem('examMode');
  return storedMode !== null ? JSON.parse(storedMode) : true;
};

export default function PracticeSettings({ courseId, quizId, quizSlug, courseSlug }: PracticeSettingsProps) {
  const [topics, setTopics] = useState<EduProTopic[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<number[]>([]);
  const [quantity, setQuantity] = useState(10);
  const [examMode, setExamMode] = useState(getInitialExamMode);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const allTopicsSelected = topics.length > 0 && selectedTopics.length === topics.length;
  const isQuizStartDisabled = selectedTopics.length === 0;
  const isPartialSelection = selectedTopics.length > 0 && selectedTopics.length < topics.length;

  useEffect(() => {
    const fetchTopics = async () => {
      setIsLoading(true);
      try {
        const { data: courseTopics, error } = await supabase
          .from('edu_pro_coursetopic')
          .select('edu_pro_topic (id, title, description, order, slug)')
          .eq('course_id', courseId)
          .order('order', { ascending: true });

        if (error) throw new Error(`Error fetching course topics: ${error.message}`);

        // Flatten the array of arrays into a single array of topics
        const topicsData = courseTopics?.flatMap((ct: CourseTopicResponse) => ct.edu_pro_topic).filter(Boolean) ?? [];
        setTopics(topicsData);
      } catch (err) {
        console.error(`PracticeSettings: Error for courseId ${courseId}:`, err);
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTopics();
  }, [courseId]);

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuantity(Number(e.target.value));
  };

  const toggleMode = (isExamMode: boolean) => {
    setExamMode(isExamMode);
    localStorage.setItem('examMode', JSON.stringify(isExamMode));
  };

  const handleTopicChange = (topicId: number) => {
    setSelectedTopics((prev) =>
      prev.includes(topicId) ? prev.filter((id) => id !== topicId) : [...prev, topicId]
    );
    setValidationError(null);
  };

  const handleAllTopicsChange = () => {
    const accelerators = allTopicsSelected ? [] : topics.map((topic) => topic.id);
    setSelectedTopics(accelerators);
    setValidationError(null);
  };

  const getQuizUrl = () => {
    if (isQuizStartDisabled) return '#';
    const params = new URLSearchParams({
      ...(selectedTopics.length > 0 && { topics: selectedTopics.join(',') }),
      quantity: String(quantity),
      mode: examMode ? 'exam' : 'train',
    });
    return `/account/edupro/${courseSlug}/quiz/${quizSlug}${params.toString() ? `?${params}` : ''}`;
  };

  const handleQuizStart = () => {
    if (isQuizStartDisabled) {
      setValidationError('Please select at least one topic to start the quiz.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4" role="status" aria-live="polite">
        <div className="flex space-x-2">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-4 w-4 animate-bounce rounded-full bg-blue-500"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
        <span className="sr-only">Loading topics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-4 text-center" role="alert">
        <p className="font-medium text-red-600">
          Failed to load topics. Please try again later.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 text-left">
      {/* Mode Toggle Section */}
      <div>
        <div className="mb-2 text-sm font-semibold text-gray-700">Mode</div>
        <div className="flex w-full space-x-3">
          <button
            type="button"
            onClick={() => toggleMode(true)}
            className={styles.buttonToggle(examMode)}
            aria-label="Select Exam Mode"
            aria-pressed={examMode}
          >
            Exam
          </button>
          <button
            type="button"
            onClick={() => toggleMode(false)}
            className={styles.buttonToggle(!examMode)}
            aria-label="Select Train Mode"
            aria-pressed={!examMode}
          >
            Train
          </button>
        </div>
      </div>

      {/* Quantity Slider Section */}
      <div>
        <label htmlFor="quantity" className="text-sm font-semibold text-gray-700">
          Number of Questions
        </label>
        <div id="quantity-value" className="float-right pr-4 font-semibold text-gray-600" aria-live="polite">
          {quantity}
        </div>
        <div className="relative mt-2">
          <input
            type="range"
            className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400"
            name="quantity"
            min="5"
            max="120"
            value={quantity}
            onChange={handleQuantityChange}
            id="quantity"
            aria-label="Select number of questions"
            aria-valuenow={quantity}
            aria-valuemin={5}
            aria-valuemax={120}
          />
          <div className="mt-1 flex justify-between text-xs text-gray-500">
            <span>5</span>
            <span>120</span>
          </div>
        </div>
      </div>

      {/* Topics Section */}
      <div>
        <label className="text-sm font-semibold text-gray-700" id="topics-label">
          Topics
        </label>
        {topics.length === 0 ? (
          <p className="mt-2 text-sm text-gray-600" role="alert">
            No topics available for this course.
          </p>
        ) : (
          <div
            className="mt-4 max-h-64 overflow-y-auto rounded-lg border border-gray-300 bg-white shadow-sm scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-gray-600"
            role="group"
            aria-labelledby="topics-label"
          >
            <label
              htmlFor="topic_all"
              className="sticky top-0 z-10 flex cursor-pointer flex-col border-b border-gray-300 bg-gray-50 p-3 hover:bg-gray-100"
            >
              <div className="flex items-center justify-between">
                <input
                  type="checkbox"
                  id="topic_all"
                  checked={allTopicsSelected}
                  onChange={handleAllTopicsChange}
                  className={styles.checkbox}
                  aria-label="Select all topics"
                  aria-checked={allTopicsSelected}
                />
                <span className="ml-3 font-semibold text-gray-800">All Topics</span>
              </div>
              {isPartialSelection && (
                <span className={styles.partialSelectionText} aria-live="polite">
                  {selectedTopics.length} of {topics.length} topics selected
                </span>
              )}
            </label>
            {topics.map((topic) => (
              <label
                key={topic.id}
                htmlFor={`topic_${topic.id}`}
                className={styles.topicLabel}
              >
                <input
                  type="checkbox"
                  id={`topic_${topic.id}`}
                  checked={selectedTopics.includes(topic.id)}
                  onChange={() => handleTopicChange(topic.id)}
                  className={styles.checkbox}
                  aria-label={`Select ${topic.title}`}
                  aria-checked={selectedTopics.includes(topic.id)}
                />
                <span className="ml-3 text-sm font-medium text-gray-800">{topic.title}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Validation Error */}
      {validationError && (
        <div className="text-center text-sm text-red-600" role="alert">
          {validationError}
        </div>
      )}

      {/* Start Quiz Button */}
      <div>
        <Link href={getQuizUrl()}>
          <button
            type="button"
            className={`${styles.buttonPrimary} ${isQuizStartDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={handleQuizStart}
            disabled={isQuizStartDisabled}
            aria-label="Start quiz"
            aria-disabled={isQuizStartDisabled}
          >
            Start Quiz
          </button>
        </Link>
      </div>
    </div>
  );
}