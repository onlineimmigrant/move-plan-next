'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { MagnifyingGlassIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

interface BlogQuiz {
  id: number;
  slug: string;
  quiz_name: string | null;
  quiz_description: string | null;
  display_this_quiz?: boolean;
  display_as_blog_quiz?: boolean;
  quiz_image?: string | null;
  subsection?: string | null;
  section_id?: number | null;
  product_id: string; // Kept as string to match your original
  product_slug: string; // Added for product.slug
}

const QuizzesListPage: React.FC = () => {
  const [quizzes, setQuizzes] = useState<BlogQuiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const response = await fetch('/api/quizzes');
        if (response.ok) {
          const data = await response.json();
          console.log('Raw API response:', data);
          if (!Array.isArray(data)) {
            console.error('Expected an array, got:', data);
            return;
          }
          data.forEach((quiz: BlogQuiz, index: number) => {
            console.log(`Quiz ${index}:`, {
              slug: quiz.slug,
              section_id: quiz.section_id,
              product_slug: quiz.product_slug,
            });
          });
          setQuizzes(data);
        } else {
          console.error('Failed to fetch quizzes:', response.status, response.statusText);
        }
      } catch (error) {
        console.error('An error occurred:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchQuizzes();
  }, []);

  const filteredQuizzes = quizzes
    .filter((quiz) => {
      const quiz_name = quiz.quiz_name ?? '';
      const quiz_description = quiz.quiz_description ?? '';
      const subsection = quiz.subsection ?? '';
      const query = searchQuery.toLowerCase();
      const shouldDisplay = quiz.display_this_quiz !== false;
      const isBlogQuiz = quiz.display_as_blog_quiz !== false;
      console.log('Quiz:', quiz, 'display_this_quiz:', quiz.display_this_quiz, 'Should display:', shouldDisplay);
      return (
        shouldDisplay &&
        isBlogQuiz &&
        (quiz_name.toLowerCase().includes(query) ||
          quiz_description.toLowerCase().includes(query) ||
          subsection.toLowerCase().includes(query))
      );
    })
    .sort((a, b) => {
      const hasPhotoA = a.quiz_image && a.quiz_image.trim() !== '';
      const hasPhotoB = b.quiz_image && b.quiz_image.trim() !== '';
      return hasPhotoB ? 1 : hasPhotoA ? -1 : 0;
    });

  if (loading)
    return (
      <div className="py-32 text-center text-gray-500">
        <div className="animate-pulse">Loading...</div>
      </div>
    );

  return (
    <div className="bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
        <h1 className="px-4 sm:px-0 text-2xl font-bold text-gray-700 tracking-wide my-4 sm:mb-0">Quizzes</h1>
        <div className="relative w-full sm:w-80 px-4 sm:px-0">
            <span className="absolute inset-y-0 left-4 sm:left-0 flex items-center pl-3">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </span>
            <input
              type="text"
              placeholder="Search quizzes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-4 text-base font-light border bg-white border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all duration-200"
            />
          </div>
        </div>
        <div className='px-4 sm:px-0 tracking-wider py-4 text-gray-500 font-base font-light'>
        <span >Each Quiz is a complete package or a Course part without supporting study resources.</span>
        </div>

        {quizzes.length === 0 ? (
          <div className="text-center py-16 text-gray-500">No quizzes available</div>
        ) : filteredQuizzes.length === 0 && searchQuery ? (
          <div className="text-center py-16 text-gray-500">
            No quizzes found matching "{searchQuery}"
          </div>
        ) : (
          <div className="px-4 sm:px-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredQuizzes.map((quiz) => (
              <Link
                key={quiz.id}
                href={quiz.product_slug ? `/products/${quiz.product_slug}` : '#'}
                className="group"
              >
                <div className="h-full bg-white rounded-xl shadow-sm overflow-hidden flex flex-col">
                  {quiz.quiz_image && quiz.quiz_image.trim() !== '' && (
                    <div className="w-full h-auto p-2 flex-shrink-0">
                      <img
                        src={quiz.quiz_image}
                        alt={quiz.quiz_name ?? 'Blog quiz image'}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.error('Image failed to load:', quiz.quiz_image);
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  <div className="p-6 flex flex-col flex-grow">
                    <h2 className="tracking-tight text-lg line-clamp-1 font-semibold text-gray-900 mb-3 group-hover:text-sky-400">
                      {quiz.quiz_name ?? 'Untitled'}
                    </h2>
                    <p className="tracking-widest text-base text-gray-600 font-light line-clamp-2 flex-grow">
                      {quiz.quiz_description ?? 'No quiz_description available'}
                    </p>
                  </div>
                  <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-transparent flex-shrink-0 flex justify-end relative">
                    {quiz.subsection && quiz.subsection.trim() !== '' ? (
                      <>
                        <span className="text-gray-500 text-sm font-medium group-hover:opacity-0 transition-opacity duration-200">
                          {quiz.subsection}
                        </span>
                        <span className="absolute right-6 text-sky-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <ArrowRightIcon className="h-5 w-5" />
                        </span>
                      </>
                    ) : (
                      <span className="text-sky-400">
                        <ArrowRightIcon className="h-5 w-5" />
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizzesListPage;