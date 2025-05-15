'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '@/context/AuthContext';

interface RawStatistic {
  quiz_id: number;
  questions_correct: number;
  questions_attempted: number;
  exam_mode: boolean; // Changed from string to boolean
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

  const calculateStats = (data: RawStatistic[], modeFilter: 'exam' | 'train'): Statistics => {
    const filteredData = modeFilter === 'exam'
      ? data.filter(stat => stat.exam_mode === true) // Filter for true (exam mode)
      : data.filter(stat => stat.exam_mode === false); // Filter for false (train mode)

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
          .in('quiz_id', quizzes.map(quiz => quiz.id));

        if (statsError) {
          throw new Error(`Error fetching statistics: ${statsError.message}`);
        }

        const rawStats: RawStatistic[] = statsData ?? [];

        const quizStatsList: QuizStatistics[] = quizzes.map(quiz => {
          const quizRawStats = rawStats.filter(stat => stat.quiz_id === quiz.id);
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

  if (quizStats.length === 0 || !aggregatedStats) {
    return (
      <div className="text-center text-gray-600 mt-4">
        <p>No statistics available for this course. Start a quiz to see your progress!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Aggregated Statistics */}
      <div className="bg-gray-50 p-4 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Course Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600">Total Correct</p>
            <p className="text-lg font-semibold text-gray-900">{aggregatedStats.total_correct}</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600">Total Attempted</p>
            <p className="text-lg font-semibold text-gray-900">{aggregatedStats.total_attempted}</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600">Overall Percentage</p>
            <p className="text-lg font-semibold text-gray-900">{aggregatedStats.overall_percentage.toFixed(1)}%</p>
          </div>
        </div>
      </div>

      {/* Detailed Statistics Table */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quiz Statistics</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
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
                  Percentage
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {quizStats.map((quizStat) => (
                // Render <tr> elements directly without a fragment
                [
                  <tr key={`${quizStat.quizId}-exam`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {quizStat.quizTitle}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Exam</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {quizStat.examStats.total_correct_answers}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {quizStat.examStats.total_questions_answered}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {quizStat.examStats.overall_correct_percentage.toFixed(1)}%
                    </td>
                  </tr>,
                  <tr key={`${quizStat.quizId}-train`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {quizStat.quizTitle}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Train</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {quizStat.trainStats.total_correct_answers}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {quizStat.trainStats.total_questions_answered}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {quizStat.trainStats.overall_correct_percentage.toFixed(1)}%
                    </td>
                  </tr>,
                ]
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}