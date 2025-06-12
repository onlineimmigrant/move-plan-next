// src/components/PracticeStatistics.tsx
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '@/context/AuthContext';

interface RawStatistic {
  quiz_id: number;
  questions_correct: number;
  questions_attempted: number;
  exam_mode: boolean;
}

interface Quiz {
  id: number;
  title: string;
}

interface QuizStatistics {
  quizId: number;
  quizTitle: string;
  examStats: Statistics;
  trainStats: Statistics;
}

interface Statistics {
  overall_correct_percentage: number;
  total_correct_answers: number;
  total_questions_answered: number;
}

interface AggregatedStatistics {
  total_correct: number;
  total_attempted: number;
  overall_percentage: number;
}

interface PracticeStatisticsProps {
  courseId: number;
  courseSlug: string;
}

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function PracticeStatistics({ courseId, courseSlug }: PracticeStatisticsProps) {
  const { session } = useAuth();
  const [quizStats, setQuizStats] = useState<QuizStatistics[]>([]);
  const [aggregatedStats, setAggregatedStats] = useState<AggregatedStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'correct' | 'attempted' | 'overall'>('overall');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const calculateStats = (data: RawStatistic[], modeFilter: 'exam' | 'train'): Statistics => {
    const filteredData =
      modeFilter === 'exam'
        ? data.filter((stat) => stat.exam_mode === true)
        : data.filter((stat) => stat.exam_mode === false);

    if (filteredData.length === 0) {
      return {
        overall_correct_percentage: 0,
        total_correct_answers: 0,
        total_questions_answered: 0,
      };
    }

    const totalCorrectAnswers = filteredData.reduce((sum, stat) => sum + stat.questions_correct, 0);
    const totalQuestionsAnswered = filteredData.reduce((sum, stat) => sum + stat.questions_attempted, 0);
    const overallCorrectPercentage =
      totalQuestionsAnswered > 0 ? (totalCorrectAnswers / totalQuestionsAnswered) * 100 : 0;

    return {
      overall_correct_percentage: overallCorrectPercentage,
      total_correct_answers: totalCorrectAnswers,
      total_questions_answered: totalQuestionsAnswered,
    };
  };

  useEffect(() => {
    const fetchStatistics = async () => {
      if (!session?.user?.id) {
        setError('User not authenticated');
        setIsLoading(false);
        return;
      }

      if (!courseId) {
        setError('Course ID not provided');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const { data: quizzesData, error: quizzesError } = await supabase
          .from('quiz_quizcommon')
          .select('id, title')
          .eq('course_id', courseId);

        if (quizzesError) {
          throw new Error(`Error fetching quizzes: ${quizzesError.message}`);
        }

        const quizzes: Quiz[] = quizzesData ?? [];

        const { data: statsData, error: statsError } = await supabase
          .from('quiz_quizstatistic')
          .select('quiz_id, questions_correct, questions_attempted, exam_mode')
          .eq('user_id', session.user.id)
          .in('quiz_id', quizzes.map((quiz) => quiz.id));

        if (statsError) {
          throw new Error(`Error fetching statistics: ${statsError.message}`);
        }

        const rawStats: RawStatistic[] = statsData ?? [];

        const quizStatsList: QuizStatistics[] = quizzes.map((quiz) => {
          const quizRawStats = rawStats.filter((stat) => stat.quiz_id === quiz.id);
          return {
            quizId: quiz.id,
            quizTitle: quiz.title,
            examStats: calculateStats(quizRawStats, 'exam'),
            trainStats: calculateStats(quizRawStats, 'train'),
          };
        });

        setQuizStats(quizStatsList);

        const totalCorrect = rawStats.reduce((sum, stat) => sum + stat.questions_correct, 0);
        const totalAttempted = rawStats.reduce((sum, stat) => sum + stat.questions_attempted, 0);
        const overallPercentage = totalAttempted > 0 ? (totalCorrect / totalAttempted) * 100 : 0;

        setAggregatedStats({
          total_correct: totalCorrect,
          total_attempted: totalAttempted,
          overall_percentage: overallPercentage,
        });
      } catch (err) {
        console.error('PracticeStatistics: Error:', err);
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatistics();
  }, [courseId, session]);

  const handleSort = (criteria: 'correct' | 'attempted' | 'overall') => {
    if (sortBy === criteria) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(criteria);
      setSortOrder('asc');
    }
  };

  // Sort quiz stats based on the selected criteria and order
  const sortedQuizStats = [...quizStats].sort((a, b) => {
    if (sortBy === 'correct') {
      const aValue = a.examStats.total_correct_answers + a.trainStats.total_correct_answers;
      const bValue = b.examStats.total_correct_answers + b.trainStats.total_correct_answers;
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    } else if (sortBy === 'attempted') {
      const aValue = a.examStats.total_questions_answered + a.trainStats.total_questions_answered;
      const bValue = b.examStats.total_questions_answered + b.trainStats.total_questions_answered;
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    } else {
      const aValue = a.examStats.overall_correct_percentage + a.trainStats.overall_correct_percentage;
      const bValue = b.examStats.overall_correct_percentage + b.trainStats.overall_correct_percentage;
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    }
  });

  const circumference = 2 * Math.PI * 36; // Matches ProgressStatisticsTopics

  if (isLoading) {
    return (
      <div className="py-4">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-sky-600 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
          <div className="w-4 h-4 bg-sky-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
          <div className="w-4 h-4 bg-sky-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="py-4 text-red-600 font-medium">{error}</div>;
  }

  if (quizStats.length === 0 || !aggregatedStats) {
    return (
      <div className="text-center text-gray-500 italic mt-4">
        <p>No statistics available for this course. Start a quiz to see your progress!</p>
      </div>
    );
  }

  return (
    <div className="py-6 px-4 sm:px-0 space-y-6">
      {/* Detailed Statistics Table */}
      <div className="bg-white border border-gray-100 rounded-lg shadow-sm hover:shadow-md transition-all duration-300">
        <div className="p-4">
          <h3 className="text-base sm:text-xl font-semibold text-gray-900 mb-4">Quiz Statistics</h3>
  
          <div className="overflow-x-auto max-h-96 scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-gray-400">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quiz
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mode
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Correct
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Attempted
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Overall
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedQuizStats.map((quizStat) =>
                  [
                    <tr key={`${quizStat.quizId}-exam`} className="hover:bg-gray-50">
                      <td
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium group relative"
                        rowSpan={2}
                      >
                        {quizStat.quizTitle}
                        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -mt-10 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 shadow-lg">
                          Quiz ID: {quizStat.quizId}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Exam</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 group relative">
                        {quizStat.examStats.total_correct_answers}
                        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -mt-10 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 shadow-lg">
                          Correct: {quizStat.examStats.total_correct_answers}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 group relative">
                        {quizStat.examStats.total_questions_answered}
                        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -mt-10 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 shadow-lg">
                          Attempted: {quizStat.examStats.total_questions_answered}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 group relative">
                        {quizStat.examStats.overall_correct_percentage.toFixed(1)}%
                        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -mt-10 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 shadow-lg">
                          Overall: {quizStat.examStats.overall_correct_percentage.toFixed(1)}%
                        </div>
                      </td>
                    </tr>,
                    <tr key={`${quizStat.quizId}-train`} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Train</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 group relative">
                        {quizStat.trainStats.total_correct_answers}
                        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -mt-10 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 shadow-lg">
                          Correct: {quizStat.trainStats.total_correct_answers}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 group relative">
                        {quizStat.trainStats.total_questions_answered}
                        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -mt-10 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 shadow-lg">
                          Attempted: {quizStat.trainStats.total_questions_answered}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 group relative">
                        {quizStat.trainStats.overall_correct_percentage.toFixed(1)}%
                        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -mt-10 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 shadow-lg">
                          Overall: {quizStat.trainStats.overall_correct_percentage.toFixed(1)}%
                        </div>
                      </td>
                    </tr>,
                  ].filter(Boolean)
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Aggregated Statistics */}
      <div className="bg-white border border-gray-100 rounded-lg shadow-sm hover:shadow-md transition-all duration-300">
        <div className="p-4">
          <h3 className="text-base sm:text-xl font-semibold text-gray-900 mb-4">Overall Performance</h3>
          <div className="flex flex-col  sm:flex-row sm:items-center sm:space-x-6">
            {/* Circular Progress Visual */}
            <div className='flex justify-center'>
            <div className="relative w-40 h-40 group mb-4 sm:mb-0">
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
                    strokeDasharray: `${(aggregatedStats.overall_percentage / 100) * circumference}, ${circumference}`,
                    transform: 'rotate(-90deg)',
                    transformOrigin: '50% 50%',
                  }}
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop
                      offset="0%"
                      style={{
                        stopColor: aggregatedStats.overall_percentage < 40 ? '#EF4444' : '#FBBF24',
                        stopOpacity: 1,
                      }}
                    />
                    <stop
                      offset="100%"
                      style={{
                        stopColor: aggregatedStats.overall_percentage >= 70 ? '#10B981' : '#FBBF24',
                        stopOpacity: 1,
                      }}
                    />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-center">
                <p className="flex flex-col items-center text-gray-900">
                  <span className="flex justify-center items-center font-bold text-lg">
                    {aggregatedStats.overall_percentage.toFixed(1)}%
                  </span>
                </p>
              </div>
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -mt-16 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-2 px-3 shadow-lg">
                <p>Total Correct: {aggregatedStats.total_correct}</p>
                <p>Total Attempted: {aggregatedStats.total_attempted}</p>
                <p>Overall: {aggregatedStats.overall_percentage.toFixed(1)}%</p>
              </div>
            </div>
            </div>
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1">
              <div className="text-center group relative">
                <p className="text-sm text-gray-600">Total Correct</p>
                <p className="text-lg font-semibold text-gray-900">{aggregatedStats.total_correct}</p>
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -mt-10 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 shadow-lg">
                  Total Correct Answers
                </div>
              </div>
              <div className="text-center group relative">
                <p className="text-sm text-gray-600">Total Attempted</p>
                <p className="text-lg font-semibold text-gray-900">{aggregatedStats.total_attempted}</p>
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -mt-10 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 shadow-lg">
                  Total Questions Attempted
                </div>
              </div>
              <div className="text-center group relative">
                <p className="text-sm text-gray-600">Overall</p>
                <p className="text-lg font-semibold text-gray-900">{aggregatedStats.overall_percentage.toFixed(1)}%</p>
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -mt-10 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 shadow-lg">
                  Overall Performance
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}