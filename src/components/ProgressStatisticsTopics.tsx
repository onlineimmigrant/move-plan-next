// src/components/ProgressStatisticsTopics.tsx
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface TopicStats {
  topic_id: number;
  topic_title: string;
  questions_attempted: number;
  questions_correct: number;
  percent_correct: number;
}

interface ProgressStatisticsTopicsProps {
  quizId: number;
}

export default function ProgressStatisticsTopics({ quizId }: ProgressStatisticsTopicsProps) {
  const { session } = useAuth();
  const router = useRouter();
  const [topicStats, setTopicStats] = useState<TopicStats[]>([]);
  const [quizSlug, setQuizSlug] = useState<string | null>(null);
  const [courseSlug, setCourseSlug] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'percent' | 'name'>('percent');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterLowPerformance, setFilterLowPerformance] = useState(false);

  useEffect(() => {
    const fetchTopicStats = async () => {
      if (!session?.user?.id) {
        setError('User not authenticated');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const { data: quizData, error: quizError } = await supabase
          .from('quiz_quizcommon')
          .select('slug, course_id')
          .eq('id', quizId)
          .single();

        if (quizError) throw new Error(`Error fetching quiz: ${quizError.message}`);
        if (!quizData) throw new Error('Quiz not found');

        setQuizSlug(quizData.slug);

        const { data: courseData, error: courseError } = await supabase
          .from('edu_pro_course')
          .select('slug')
          .eq('id', quizData.course_id)
          .single();

        if (courseError) throw new Error(`Error fetching course: ${courseError.message}`);
        if (!courseData) throw new Error('Course not found');

        setCourseSlug(courseData.slug);

        const { data: topicData, error: topicError } = await supabase
          .from('edu_pro_topics_to_quizzes')
          .select(`
            topic_id,
            edu_pro_quiz_topic (
              id,
              title
            )
          `)
          .eq('quizcommon_id', quizId);

        if (topicError) throw new Error(`Error fetching topics: ${topicError.message}`);
        if (!topicData || topicData.length === 0) {
          setTopicStats([]);
          setIsLoading(false);
          return;
        }

        const topics = topicData.map((t: any) => ({
          topic_id: t.topic_id,
          topic_title: t.edu_pro_quiz_topic.title,
        }));

        const topicIds = topics.map((t: any) => t.topic_id);

        const { data: answersData, error: answersError } = await supabase
          .from('quiz_useranswer')
          .select('question_id, is_correct, topic_id')
          .eq('user_id', session.user.id)
          .eq('exam_mode', true)
          .in('topic_id', topicIds);

        if (answersError) throw new Error(`Error fetching answers: ${answersError.message}`);

        const stats: TopicStats[] = topics.map((topic: any) => {
          const topicAnswers = answersData?.filter((answer: any) => answer.topic_id === topic.topic_id) || [];
          const questionsAttempted = [...new Set(topicAnswers.map((answer: any) => answer.question_id))].length;
          const questionsCorrect = topicAnswers.filter((answer: any) => answer.is_correct).length;
          const percentCorrect = questionsAttempted > 0 ? (questionsCorrect / questionsAttempted) * 100 : 0;

          return {
            topic_id: topic.topic_id,
            topic_title: topic.topic_title,
            questions_attempted: questionsAttempted,
            questions_correct: questionsCorrect,
            percent_correct: percentCorrect,
          };
        });

        setTopicStats(stats);
      } catch (err) {
        console.error('ProgressStatisticsTopics: Error:', err);
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTopicStats();
  }, [quizId, session]);

  const handleImproveClick = (topicId: number) => {
    if (!quizSlug || !courseSlug) return;

    const params = new URLSearchParams({
      topics: topicId.toString(),
      quantity: '10',
      mode: 'exam',
    });

    router.push(`/account/edupro/${courseSlug}/quiz/${quizSlug}?${params.toString()}`);
  };

  const handleSort = (criteria: 'percent' | 'name') => {
    if (sortBy === criteria) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(criteria);
      setSortOrder('asc');
    }
  };

  // Sort topics based on the selected criteria and order
  const sortedTopics = [...topicStats].sort((a, b) => {
    if (sortBy === 'percent') {
      return sortOrder === 'asc'
        ? a.percent_correct - b.percent_correct
        : b.percent_correct - a.percent_correct;
    } else {
      return sortOrder === 'asc'
        ? a.topic_title.localeCompare(b.topic_title)
        : b.topic_title.localeCompare(a.topic_title);
    }
  });

  // Filter topics if the low-performance toggle is active
  const filteredTopics = filterLowPerformance
    ? sortedTopics.filter((stat) => stat.percent_correct < 70)
    : sortedTopics;

  const circumference = 2 * Math.PI * 36; // Adjusted for larger circle (radius 36)

  if (isLoading) {
    return (
      <div className="py-4">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
          <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
          <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="py-4 text-red-600 font-medium">{error}</div>;
  }

  return (
    <div className="sm:py-6 px-4 sm:px-0">
      <div className="my-6 sm:my-0 sm:mb-6">
        <h3 className="sm:text-xl text-base font-semibold text-gray-900 mb-4">Topic Exam Mode</h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => handleSort('percent')}
            className={`text-sm font-medium flex items-center space-x-1 ${
              sortBy === 'percent' ? 'text-sky-600' : 'text-gray-600 hover:text-sky-600'
            } transition-colors`}
          >
            <span>Sort by Score</span>
            {sortBy === 'percent' && (
              <svg
                className={`w-4 h-4 transform ${sortOrder === 'asc' ? 'rotate-0' : 'rotate-180'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </button>
          <button
            onClick={() => handleSort('name')}
            className={`text-sm font-medium flex items-center space-x-1 ${
              sortBy === 'name' ? 'text-sky-600' : 'text-gray-600 hover:text-sky-600'
            } transition-colors`}
          >
            <span>Sort by Name</span>
            {sortBy === 'name' && (
              <svg
                className={`w-4 h-4 transform ${sortOrder === 'asc' ? 'rotate-0' : 'rotate-180'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </button>
          <button
            onClick={() => setFilterLowPerformance(!filterLowPerformance)}
            className={`text-sm font-medium flex items-center space-x-1 ${
              filterLowPerformance ? 'text-yellow-600' : 'text-gray-600 hover:text-yellow-600'
            } transition-colors`}
          >
            <span>{filterLowPerformance ? 'Show All' : 'Needs Improvement'}</span>
            <svg
              className={`w-4 h-4 ${filterLowPerformance ? 'text-yellow-600' : 'text-gray-600'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
        </div>
      </div>

      {filteredTopics.length === 0 ? (
        <p className="text-gray-500 italic">
          {filterLowPerformance
            ? 'No topics below 70% performance.'
            : 'No topic statistics available in exam mode.'}
        </p>
      ) : (
        <div className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-gray-400">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTopics.map((stat) => {
              const strokeDasharray = (stat.percent_correct / 100) * circumference;
              const isLowPerformance = stat.percent_correct < 50;
              return (
                <div
                  key={stat.topic_id}
                  className={`bg-white border ${
                    isLowPerformance ? 'border-sky-300' : 'border-gray-100'
                  } p-4 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 flex flex-col items-center min-h-[350px]`}
                >
                  {/* Topic Title */}
                  <h4 className="text-lg font-semibold text-gray-800 mb-3 text-center">{stat.topic_title}</h4>
                  {/* Circular Progress Visual */}
                  <div className="relative w-40 h-40 group">
                    <svg width="100%" height="100%" viewBox="0 0 100 100" className="block mx-auto max-w-full">
                      <circle
                        className="fill-none stroke-gray-200"
                        cx="50"
                        cy="50"
                        r="36"
                        strokeWidth="12"
                      />
                      <circle
                        className="fill-none stroke-[url(#gradient)]"
                        cx="50"
                        cy="50"
                        r="36"
                        strokeWidth="12"
                        strokeLinecap="round"
                        style={{
                          strokeDasharray: `${strokeDasharray}, ${circumference}`,
                          transform: 'rotate(-90deg)',
                          transformOrigin: '50% 50%',
                        }}
                      />
                      <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop
                            offset="0%"
                            style={{
                              stopColor: stat.percent_correct < 40 ? '#EF4444' : '#FBBF24',
                              stopOpacity: 1,
                            }}
                          />
                          <stop
                            offset="100%"
                            style={{
                              stopColor: stat.percent_correct >= 70 ? '#10B981' : '#FBBF24',
                              stopOpacity: 1,
                            }}
                          />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-center">
                      <p className="flex flex-col items-center text-gray-900">
                        <span className="flex justify-center items-center font-bold text-lg">
                          {stat.percent_correct.toFixed(1)}%
                        </span>
                      </p>
                    </div>
                    {/* Tooltip on Hover */}
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 -mt-16 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-2 px-3 shadow-lg">
                      <p>Attempted:{stat.questions_attempted}</p>
                      <p>Correct:{stat.questions_correct}</p>
                      <p>Score:{stat.percent_correct.toFixed(1)}%</p>
                    </div>
                  </div>
                  {/* Stats */}
                  <div className="mt-3 text-center text-sm text-gray-600">
                    <p>Attempted: {stat.questions_attempted}</p>
                    <p>Correct: {stat.questions_correct}</p>
                  </div>
                  {/* Spacer to push button to the bottom */}
                  <div className="flex-grow"></div>
                  {/* Improve Button */}
                  <button
                    onClick={() => handleImproveClick(stat.topic_id)}
                    className="mt-4 flex items-center justify-center w-full bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-all duration-300 group"
                  >
                    <span>Improve</span>
                    <svg
                      className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform duration-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}