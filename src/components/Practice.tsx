// components/Practice.tsx
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Define the Quiz interface based on assumed fields
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
}

interface PracticeProps {
  courseId: number; // Prop to receive the course ID
}

export default function Practice({ courseId }: PracticeProps) {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
            order
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
        <ul className="grid grid-cols-1 lg:grid-cols-1 gap-4">
          {quizzes.map((quiz) => (
            <li
              key={quiz.id}
              className="relative border-l-16 border-yellow-200 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow flex items-start p-4"
            >
    

              {/* Image on the left */}
              {quiz.image && (
                <div className="flex-shrink-0 mr-4">
                  <img
                    src={quiz.image}
                    alt={`${quiz.title} thumbnail`}
                    className="hidden sm:block w-16 sm:w-24 h-auto object-cover rounded-md"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder-quiz-image.jpg'; // Fallback image if the URL fails
                    }}
                  />
                </div>
              )}

              {/* Text content on the right */}
              <div className="flex-1 pr-8">
                <h3 className="sm:mt-4 text-sm font-medium text-gray-900">{quiz.title}</h3>
                {quiz.description && (
                  <p className="text-sm text-gray-600 mt-1">{quiz.description}</p>
                )}
                {quiz.slug && (
                  <div className="mt-2">
                    <a
                      href={quiz.slug}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-600 hover:underline text-sm"
                    >
                      Start 
                    </a>
                  </div>
                )}
  
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-600 text-center">No quizzes available for this course.</p>
      )}
    </div>
  );
}