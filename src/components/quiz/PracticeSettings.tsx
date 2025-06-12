// src/components/PracticeSettings.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { styles } from '@/lib/styles';
import { useAuth } from '@/context/AuthContext';
import Button from '@/ui/Button';

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

      console.log('Starting new quiz without clearing previous answers.');

      const quizUrl = getQuizUrl();
      console.log('Navigating to quiz URL:', quizUrl);
      if (quizUrl !== '#') {
        router.push(quizUrl);
      }
    } catch (err) {
      console.error('Error starting quiz:', err);
      setValidationError('An error occurred while starting the quiz. Please try again.');
    }
  };

  const modes = [
    { label: 'Exam', value: true },
    { label: 'Train', value: false },
  ];

  const getSliderPosition = () => {
    const activeIndex = examMode ? 0 : 1;
    if (activeIndex === 0) return 'translate-x-0';
    if (activeIndex === 1) return 'translate-x-[100%]';
    return 'translate-x-0';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4" role="status" aria-live="polite">
        <div className="flex space-x-2">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-4 w-4 animate-bounce rounded-full bg-sky-600"
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
        <div className='mt-2 mb-4 text-center'>
            <span className="sr-only text-md text-sm sm:text-base font-semibold sm:py-1">Test</span>
        </div>
      {/* Mode Selection */}
      <div>
        <div className="hidden sm:block mb-2 text-sm font-semibold text-gray-700">Mode</div>
        <div className="select-none flex justify-center">
          <div className="relative w-full max-w-[480px] h-11 bg-transparent border-2 border-slate-600 rounded-lg cursor-pointer overflow-hidden px-0.5">
            <div
              className={`absolute top-0.5 bottom-0.5 left-0.5 w-[calc(50%-2px)] bg-slate-500 rounded-md transition-transform duration-200 ease-in-out transform ${getSliderPosition()}`}
            ></div>
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

      {/* Topics Selection */}
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
            className="pb-24 max-h-120 overflow-y-auto bg-white gap-y-2 scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-gray-600"
            role="group"
            aria-labelledby="topics-label"
          >
            <label
              htmlFor="topic_all"
              className="sticky top-0 z-10 flex cursor-pointer flex-col shadow rounded-md border-2 border-yellow-100 bg-yellow-50 p-2 px-3 hover:bg-yellow-100 transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <input
                  type="checkbox"
                  id="topic_all"
                  checked={allTopicsSelected}
                  onChange={handleAllTopicsChange}
                  className="custom-checkbox"
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
                className="flex cursor-pointer items-center justify-between p-3 hover:bg-gray-50 transition-all duration-300 group"
              >
                {topic.title !== 'FLK 1' && topic.title !== 'FLK 2' && (
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id={`topic_${topic.id}`}
                    checked={selectedTopics.includes(topic.id)}
                    onChange={() => handleTopicChange(topic.id)}
                    className="custom-checkbox"
                    aria-label={`Select ${topic.title}`}
                    aria-checked={selectedTopics.includes(topic.id)}
                  />
                            
                    <span className="ml-3 text-sm font-medium text-gray-800">{topic.title}</span>
                 
                </div>
                 )}
                {topic.description && (
                  <div className="absolute left-1/2 transform -translate-x-1/2 -mt-12 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-2 px-3 shadow-lg z-20">
                    {topic.description}
                  </div>
                )}
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Quantity and Start Button */}
      <div className="max-w-xl mx-auto px-8 sm:px-0 fixed bottom-0 sm:bottom-8 left-0 right-0 bg-transparent backdrop-blur-sm border-t border-gray-50 shadow sm:shadow-none sm:border-none py-2 sm:py-3 z-10">
        <div className="">
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

        <div className="mb-16 mt-8 sm:mb-2">
          <Button
            variant='start'
            type="button"
            className={` ${isQuizStartDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={handleQuizStart}
            disabled={isQuizStartDisabled}
            aria-label="Start quiz"
            aria-disabled={isQuizStartDisabled}
          >
            Start
          </Button>
        </div>
      </div>

      {/* Custom Checkbox Styles */}
      <style jsx>{`
        .custom-checkbox {
          appearance: none;
          -webkit-appearance: none;
          width: 18px;
          height: 18px;
          border: 2px solid #d1d5db; /* gray-300 */
          border-radius: 4px;
          background-color: #ffffff;
          position: relative;
          cursor: pointer;
          transition: background-color 0.3s ease-in-out, border-color 0.3s ease-in-out;
        }

        .custom-checkbox:hover {
          border-color: #4b5563; /* gray-600 */
          background-color: #f9fafb; /* gray-50 */
        }

        .custom-checkbox:focus {
          outline: none;
          box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.3); /* sky-600 with opacity */
          border-color: #0ea5e9; /* sky-600 */
        }

        .custom-checkbox:checked {
          background-color: #0ea5e9; /* sky-600 */
          border-color: #0ea5e9;
        }

        .custom-checkbox:checked::after {
          content: '';
          position: absolute;
          top: 2px;
          left: 6px;
          width: 5px;
          height: 10px;
          border: solid white;
          border-width: 0 2px 2px 0;
          transform: rotate(45deg);
          opacity: 0;
          animation: checkmarkFade 0.3s ease-in-out forwards;
        }

        @keyframes checkmarkFade {
          0% {
            opacity: 0;
            transform: rotate(45deg) scale(0.5);
          }
          50% {
            opacity: 0.5;
            transform: rotate(45deg) scale(1.2);
          }
          100% {
            opacity: 1;
            transform: rotate(45deg) scale(1);
          }
        }
      `}</style>
    </div>
  );
}