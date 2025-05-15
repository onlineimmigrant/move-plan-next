// components/Practice.tsx
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import PracticeSettings from './PracticeSettings';
import PracticePassRateVisual from './PracticePassRateVisual';
import PracticeSettingsStatisticsVisuals from './PracticeSettingsStatisticsVisuals';
import PracticeStatistics from './PracticeStatistics';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Quiz {
  id: number;
  title: string;
  description: string | null;
  slug: string | null;
  image: string | null;
  course_id: number;
  created_at: string | null;
  updated_at: string | null;
  order: number | null;
  percent_required: number;
}

interface PracticeProps {
  courseId: number;
  courseSlug: string;
}

export default function Practice({ courseId, courseSlug }: PracticeProps) {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFullStats, setShowFullStats] = useState(false); // Moved state to Practice

  useEffect(() => {
    const fetchQuizzes = async () => {
      setIsLoading(true);
      try {
        const { data: quizzesData, error: quizzesError } = await supabase
          .from('quiz_quizcommon')
          .select(`
            id,
            title,
            description,
            slug,
            image,
            course_id,
            created_at,
            updated_at,
            order,
            percent_required  
          `)
          .eq('course_id', courseId)
          .order('order', { ascending: true });

        if (quizzesError) {
          throw new Error(`Error fetching quizzes: ${quizzesError.message}`);
        }

        setQuizzes(quizzesData || []);
      } catch (err) {
        console.error('Practice: Error:', err);
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuizzes();
  }, [courseId]);

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

  return (
    <div className="mt-4">
      {quizzes.length > 0 ? (
        showFullStats ? (
          // Render only PracticeStatistics when showFullStats is true
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <PracticeStatistics courseId={courseId} courseSlug={courseSlug} />
            <div className="text-center mt-6">
              <button
                onClick={() => setShowFullStats(false)}
                className="text-sky-500 hover:text-sky-600 font-medium underline focus:outline-none"
              >
                Back to Practice
              </button>
            </div>
          </div>
        ) : (
          // Render the grid layout when showFullStats is false
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 gap-x-8">
            <div className="col-span-1">
              <PracticePassRateVisual quiz={quizzes[0]} />
            </div>

            <div className="col-span-1 sm:col-span-2">
              <div className="sticky top-0 z-10 bg-white sm:p-4 ">
                <h3 className="hidden text-lg font-semibold text-gray-900 mb-4">{quizzes[0].title} Settings</h3>
                <PracticeSettings
                  courseId={courseId}
                  quizId={quizzes[0].id}
                  quizSlug={quizzes[0].slug || ''}
                  courseSlug={courseSlug}
                />
              </div>
            </div>

            <div className="col-span-1">
              <PracticeSettingsStatisticsVisuals
                quizId={quizzes[0].id}
                courseId={courseId}
                courseSlug={courseSlug}
                showFullStats={showFullStats}
                setShowFullStats={setShowFullStats}
              />
            </div>
          </div>
        )
      ) : (
        <p className="text-gray-600 text-center">No quizzes available for this course.</p>
      )}
    </div>
  );
}