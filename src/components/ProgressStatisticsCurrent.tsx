// src/components/ProgressStatisticsCurrent.tsx
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '@/context/AuthContext';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Topic {
  id: number;
  title: string;
}

interface Attempt {
  id: string;
  created_at: string;
  exam_mode: boolean;
  questions_attempted: number;
  questions_correct: number;
  percent_correct: number;
  topics: Topic[];
}

interface ProgressStatisticsCurrentProps {
  quizId: number;
}

export default function ProgressStatisticsCurrent({ quizId }: ProgressStatisticsCurrentProps) {
  const { session } = useAuth();
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [displayedAttempts, setDisplayedAttempts] = useState<Attempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    const fetchAttempts = async () => {
      if (!session?.user?.id) {
        setError('User not authenticated');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        // Fetch quiz attempts
        const { data: attemptsData, error: attemptsError } = await supabase
          .from('quiz_quizstatistic')
          .select('id, created_at, exam_mode, questions_attempted, questions_correct, percent_correct')
          .eq('user_id', session.user.id)
          .eq('quiz_id', quizId)
          .order('created_at', { ascending: false });

        if (attemptsError) throw new Error(`Error fetching attempts: ${attemptsError.message}`);

        if (!attemptsData || attemptsData.length === 0) {
          setAttempts([]);
          setDisplayedAttempts([]);
          setIsLoading(false);
          return;
        }

        // Fetch topics for each attempt
        const attemptsWithTopics = await Promise.all(
          attemptsData.map(async (attempt: any) => {
            // Fetch topic IDs from quiz_useranswer
            const { data: answerData, error: answerError } = await supabase
              .from('quiz_useranswer')
              .select('topic_id')
              .eq('quiz_statistic_id', attempt.id)
              .eq('user_id', session.user.id);

            let uniqueTopics: Topic[] = [];

            if (answerError) {
              console.error(`Error fetching topic IDs for attempt ${attempt.id}: ${answerError.message}`);
            } else if (answerData && answerData.length > 0) {
              // Extract unique topic IDs, filtering out null values
              const topicIds = [...new Set(
                answerData
                  .map((answer: any) => answer.topic_id)
                  .filter((id: any) => id !== null && id !== undefined)
              )];

              // Only fetch topic details if there are valid topic IDs
              if (topicIds.length > 0) {
                const { data: topicData, error: topicError } = await supabase
                  .from('edu_pro_quiz_topic')
                  .select('id, title')
                  .in('id', topicIds);

                if (topicError) {
                  console.error(`Error fetching topic details for attempt ${attempt.id}: ${topicError.message}`);
                } else if (topicData) {
                  uniqueTopics = topicData.map((topic: any) => ({
                    id: topic.id,
                    title: topic.title,
                  }));
                }
              }
            }

            return {
              ...attempt,
              topics: uniqueTopics, // Always set topics, even if empty
            };
          })
        );

        setAttempts(attemptsWithTopics);
        setDisplayedAttempts(attemptsWithTopics.slice(0, itemsPerPage));
      } catch (err) {
        console.error('ProgressStatisticsCurrent: Error:', err);
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAttempts();
  }, [quizId, session]);

  const loadMore = () => {
    const nextPage = page + 1;
    const newDisplayedAttempts = attempts.slice(0, nextPage * itemsPerPage);
    setDisplayedAttempts(newDisplayedAttempts);
    setPage(nextPage);
  };

  const hasMore = displayedAttempts.length < attempts.length;

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
    <div className="py-4">
      <h3 className="pl-6 text-lg font-semibold text-gray-800 mb-4">Recent </h3>
      {attempts.length === 0 ? (
        <p className="text-gray-500 italic">No recent attempts available.</p>
      ) : (
        <div className="max-h-120 overflow-y-auto scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-gray-400">
          <div className="space-y-6">
            {displayedAttempts.map((attempt) => (
              <div
                key={attempt.id}
                className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow duration-300"
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-gray-700">
                    {new Date(attempt.created_at).toLocaleString('en-GB', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      attempt.exam_mode
                        ? 'bg-sky-100 text-sky-700'
                        : 'bg-green-100 text-green-700'
                    }`}
                  >
                    {attempt.exam_mode ? 'Exam' : 'Train'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <p className="text-xs text-gray-500">Questions Attempted</p>
                    <p className="text-sm font-medium text-gray-800">{attempt.questions_attempted}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Questions Correct</p>
                    <p className="text-sm font-medium text-gray-800">{attempt.questions_correct}</p>
                  </div>
                </div>
                <div className="mb-3">
                  <p className="text-xs text-gray-500">Percent Correct</p>
                  <div className="relative pt-1">
                    <div className="flex mb-2 items-center justify-between">
                      <div className="text-sm font-medium text-gray-800">
                        {attempt.percent_correct.toFixed(1)}%
                      </div>
                    </div>
                    <div className="flex h-2 mb-4 overflow-hidden rounded bg-gray-100">
                      <div
                        style={{ width: `${attempt.percent_correct}%` }}
                        className={`flex flex-col justify-center whitespace-nowrap text-center text-xs text-white rounded ${
                          attempt.percent_correct >= 70
                            ? 'bg-green-500'
                            : attempt.percent_correct >= 40
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                        }`}
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Topics Covered</p>
                  {!attempt.topics || attempt.topics.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">No topics recorded</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {attempt.topics.map((topic) => (
                        <span
                          key={topic.id}
                          className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full"
                        >
                          {topic.title}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          {hasMore && (
            <button
              onClick={loadMore}
              className="mt-6 w-full bg-sky-600 hover:bg-sky-700 text-white font-medium py-2 px-4 rounded-lg transition-colors shadow-sm hover:shadow-md"
            >
              Load More
            </button>
          )}
        </div>
      )}
    </div>
  );
}