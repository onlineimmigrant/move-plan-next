// src/components/PracticeSettings.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { styles } from '@/lib/styles';
import { useAuth } from '@/context/AuthContext';

interface EduProTopic {
  id: number;
  title: string;
  description: string;
  order: number;
  slug: string;
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
  const { session } = useAuth();
  const router = useRouter();
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
        const { data: quizTopics, error } = await supabase
          .from('quiz_quizcommon')
          .select(`
            id,
            course_id,
            edu_pro_topics_to_quizzes!edu_pro_topics_to_quizzes_quizcommon_id_fkey (
              edu_pro_quiz_topic (
                id,
                title,
                description,
                order,
                slug
              )
            )
          `)
          .eq('course_id', courseId)
          .eq('id', quizId)
          .order('order', { foreignTable: 'edu_pro_topics_to_quizzes.edu_pro_quiz_topic', ascending: true });

        if (error) throw new Error(`Error fetching quiz topics: ${error.message}`);

        const topicsData = quizTopics?.flatMap((quiz: any) =>
          quiz.edu_pro_topics_to_quizzes?.map((topicRelation: any) => topicRelation.edu_pro_quiz_topic).filter(Boolean)
        ) ?? [];

        setTopics(topicsData);
      } catch (err) {
        console.error(`PracticeSettings: Error for courseId ${courseId}, quizId ${quizId}:`, err);
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTopics();
  }, [courseId, quizId]);

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

  const handleQuizStart = async () => {
    if (isQuizStartDisabled) {
      setValidationError('Please select at least one topic to start the quiz.');
      return;
    }

    if (!session?.user?.id) {
      setValidationError('You must be logged in to start the quiz.');
      return;
    }

    if (quantity < 5 || quantity > 120) {
      setValidationError('Number of questions must be between 5 and 120.');
      return;
    }

    try {
      if (examMode) {
        // Fetch topic IDs associated with the quiz
        const { data: topicRelations, error: topicError } = await supabase
          .from('edu_pro_topics_to_quizzes')
          .select('topic_id')
          .eq('quizcommon_id', quizId);

        if (topicError) throw new Error(`Error fetching topic relations: ${topicError.message}`);
        if (!topicRelations || topicRelations.length === 0) {
          setValidationError('No topics available for this quiz.');
          return;
        }

        const quizTopicIds: number[] = topicRelations.map((relation: { topic_id: number }) => relation.topic_id);

        // Fetch question IDs for the associated topics
        let query = supabase
          .from('edu_pro_quiz_question')
          .select('id')
          .in('topic_id', quizTopicIds);

        if (selectedTopics.length > 0) {
          query = query.in('topic_id', selectedTopics.filter((id) => quizTopicIds.includes(id)));
        }

        const { data: questionsData, error: questionsError } = await query;
        if (questionsError) throw new Error(`Error fetching questions: ${questionsError.message}`);
        if (!questionsData || questionsData.length === 0) {
          setValidationError('No questions available for the selected topics.');
          return;
        }

        const questionIds: number[] = questionsData.map((q: { id: number }) => q.id);

        // Clear previous user answers for these questions
        const { error: deleteError } = await supabase
          .from('quiz_useranswer')
          .delete()
          .eq('user_id', session.user.id)
          .in('question_id', questionIds)
          .eq('exam_mode', true);

        if (deleteError) {
          console.error('Error clearing previous answers:', deleteError);
          setValidationError('Failed to start a new quiz session. Please try again.');
          return;
        }
      }

      const quizUrl = getQuizUrl();
      if (quizUrl !== '#') {
        router.push(quizUrl);
      }
    } catch (err) {
      console.error('Error starting quiz:', err);
      setValidationError('An error occurred while starting the quiz. Please try again.');
    }
  };

  // Define the modes for "Exam" and "Train"
  const modes = [
    { label: 'Exam', value: true },
    { label: 'Train', value: false },
  ];

  // Determine the translate-x for the sliding background
  const getSliderPosition = () => {
    const activeIndex = examMode ? 0 : 1; // Exam (true) is 0, Train (false) is 1
    console.log('Active Mode Index:', activeIndex, 'Exam Mode:', examMode); // Debug log
    if (activeIndex === 0) return 'translate-x-0';
    if (activeIndex === 1) return 'translate-x-[100%]';
    return 'translate-x-0'; // Default to "Exam"
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
      <div>
        <div className="hidden sm:block mb-2 text-sm font-semibold text-gray-700">Mode</div>
        <div className="select-none flex justify-center">
          <div className="relative w-full max-w-[480px] h-11 bg-transparent border-2 border-gray-600 rounded-lg cursor-pointer overflow-hidden px-0.5">
            {/* Sliding Background */}
            <div
              className={`absolute top-0.5 bottom-0.5 left-0.5 w-[calc(50%-2px)] bg-gray-600 rounded-md transition-transform duration-200 ease-in-out transform ${getSliderPosition()}`}
            ></div>
            {/* Mode Labels */}
            <div className="relative flex h-full" role="tablist" aria-label="Practice Modes">
              {modes.map((mode, index) => (
                <button
                  key={mode.label}
                  type="button"
                  onClick={() => toggleMode(mode.value)}
                  className={`flex-1 flex justify-center items-center cursor-pointer text-gray-600 text-sm sm:text-base mona-sans px-0.5 ${
                    examMode === mode.value ? 'font-semibold text-white z-10' : ''
                  }`}
                  role="tab"
                  aria-selected={examMode === mode.value}
                  aria-label={`Select ${mode.label} Mode`}
                  aria-pressed={examMode === mode.value}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div>
        <label className="hidden sm:flex text-sm font-semibold text-gray-700" id="topics-label">
          Topics
        </label>
        {topics.length === 0 ? (
          <p className="mt-2 text-sm text-gray-600" role="alert">
            No topics available for this quiz.
          </p>
        ) : (
          <div
            className=" max-h-96 overflow-y-auto   bg-white gap-y-2 scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-gray-600"
            role="group"
            aria-labelledby="topics-label"
          >
            <label
              htmlFor="topic_all"
              className="sticky top-0 z-10 flex cursor-pointer flex-col shadow rounded-md border-2 border-yellow-100  bg-yellow-200 p-2 px-3  hover:bg-gray-100"
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
<div className="px-8 fixed bottom-0 left-0 right-0 bg-transparent backdrop-blur-sm border-t border-gray-50 shadow sm:shadow-none sm:border-none py-2 sm:py-3 z-10">
   
      <div>
        <label htmlFor="quantity" className="text-sm font-semibold text-gray-700">
          Number of Questions
        </label>
        <div id="quantity-value" className="float-right pr-4 font-bold text-sky-600" aria-live="polite">
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
            <span className="hidden">5</span>
            <span className="hidden">120</span>
          </div>
        </div>
      </div>

      {validationError && (
        <div className="text-center text-sm text-red-600" role="alert">
          {validationError}
        </div>
      )}

      <div className='mb-2'>
        <button
          type="button"
          className={`${styles.buttonPrimary} ${isQuizStartDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={handleQuizStart}
          disabled={isQuizStartDisabled}
          aria-label="Start quiz"
          aria-disabled={isQuizStartDisabled}
        >
          Start
        </button>
      </div>
    </div>
    </div>
  );
}