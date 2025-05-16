'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '@/context/AuthContext';

interface RawStatistic {
  questions_correct: number;
  questions_attempted: number;
  exam_mode: boolean;
}

interface Statistics {
  overall_correct_percentage: number;
  total_correct_answers: number;
  total_questions_answered: number;
}

interface PracticeSettingsStatisticsVisualsProps {
  quizId: number;
  courseId: number;
  courseSlug: string;
  showFullStats: boolean;
  setShowFullStats: (value: boolean) => void;
}

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function PracticeSettingsStatisticsVisuals({
  quizId,
  courseId,
  courseSlug,
  showFullStats,
  setShowFullStats,
}: PracticeSettingsStatisticsVisualsProps) {
  const { session } = useAuth();
  const [examStats, setExamStats] = useState<Statistics | null>(null);
  const [trainStats, setTrainStats] = useState<Statistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const calculateStats = (data: RawStatistic[], modeFilter: 'exam' | 'train'): Statistics => {
    const filteredData = modeFilter === 'exam'
      ? data.filter(stat => stat.exam_mode === true)
      : data.filter(stat => stat.exam_mode === false);

    if (filteredData.length === 0) {
      return {
        overall_correct_percentage: 0,
        total_correct_answers: 0,
        total_questions_answered: 0,
      };
    }

    const totalCorrectAnswers = filteredData.reduce((sum, stat) => sum + stat.questions_correct, 0);
    const totalQuestionsAnswered = filteredData.reduce((sum, stat) => sum + stat.questions_attempted, 0);
    const overallCorrectPercentage = totalQuestionsAnswered > 0
      ? (totalCorrectAnswers / totalQuestionsAnswered) * 100
      : 0;

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

      setIsLoading(true);
      try {
        const { data: statsData, error: statsError } = await supabase
          .from('quiz_quizstatistic')
          .select('questions_correct, questions_attempted, exam_mode')
          .eq('user_id', session.user.id)
          .eq('quiz_id', quizId);

        if (statsError) {
          throw new Error(`Error fetching statistics: ${statsError.message}`);
        }

        const rawStats: RawStatistic[] = statsData ?? [];

        const examStatsCalculated = calculateStats(rawStats, 'exam');
        setExamStats(examStatsCalculated);

        const trainStatsCalculated = calculateStats(rawStats, 'train');
        setTrainStats(trainStatsCalculated);
      } catch (err) {
        console.error('PracticeSettingsStatisticsVisuals: Error:', err);
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatistics();
  }, [quizId, session]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
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
      <div className="py-4 text-center">
        <p className="text-red-600 font-medium">{error}</p>
      </div>
    );
  }

  if (!examStats || !trainStats || (!examStats.total_questions_answered && !trainStats.total_questions_answered)) {
    return (
      <div className="text-center text-gray-600 mt-4">
        <p>No statistics available yet. Start a quiz to see your progress!</p>
      </div>
    );
  }

  const circumference = 2 * Math.PI * 30; // 188.4
  const examStrokeDasharray = (examStats.overall_correct_percentage / 100) * circumference;
  const trainStrokeDasharray = (trainStats.overall_correct_percentage / 100) * circumference;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-1 gap-4 mt-4">
        {/* Exam Chart */}
        <div className="hidden sm:flex justify-center">
          <div className="relative w-32 h-32 sm:w-64 sm:h-64">
            <svg
              width="100%"
              height="100%"
              viewBox="0 0 100 100"
              className="block mx-auto max-w-full"
            >
              <circle
                className="fill-none stroke-gray-200"
                cx="50"
                cy="50"
                r="30"
                strokeWidth="12"
              />
              <circle
                className="fill-none stroke-sky-500"
                cx="50"
                cy="50"
                r="30"
                strokeWidth="12"
                strokeLinecap="round"
                style={{
                  strokeDasharray: `${examStrokeDasharray}, ${circumference}`,
                  transform: 'rotate(-90deg)',
                  transformOrigin: '50% 50%',
                }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-center">
              <p className="flex flex-col items-center text-xs text-gray-900 sm:text-sm">
                <span className="text-xs md:text-sm">You have<br /></span>
                <span className="flex justify-center items-center font-bold text-sm text-gray-900 md:text-2xl lg:text-3xl">
                  {examStats.overall_correct_percentage.toFixed(1)}%
                </span>
                <span className="text-xs md:text-sm">Exam<br /></span>
              </p>
            </div>
          </div>
        </div>

        {/* Train Chart */}
        <div className="hidden sm:flex justify-center">
          <div className="relative w-32 h-32 sm:w-64 sm:h-64">
            <svg
              width="100%"
              height="100%"
              viewBox="0 0 100 100"
              className="block mx-auto max-w-full"
            >
              <circle
                className="fill-none stroke-gray-200"
                cx="50"
                cy="50"
                r="30"
                strokeWidth="12"
              />
              <circle
                className="fill-none stroke-sky-500"
                cx="50"
                cy="50"
                r="30"
                strokeWidth="12"
                strokeLinecap="round"
                style={{
                  strokeDasharray: `${trainStrokeDasharray}, ${circumference}`,
                  transform: 'rotate(-90deg)',
                  transformOrigin: '50% 50%',
                }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-center">
              <p className="flex flex-col items-center text-xs text-gray-900 sm:text-sm">
                <span className="text-xs md:text-sm">You have<br /></span>
                <span className="flex justify-center items-center font-bold text-sm text-gray-900 md:text-2xl lg:text-3xl">
                  {trainStats.overall_correct_percentage.toFixed(1)}%
                </span>
                <span className="text-xs md:text-sm">Train</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center">
        <button
          onClick={() => setShowFullStats(!showFullStats)}
          className="text-sky-500 hover:text-sky-600 font-medium underline focus:outline-none"
        >
          {showFullStats ? 'Back to Practice' : 'Full Statistics'}
        </button>
      </div>
    </div>
  );
}