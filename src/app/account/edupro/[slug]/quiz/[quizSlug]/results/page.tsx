'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import React from 'react';
import { supabase } from '@/lib/supabaseClient';
import FixedNavbarMenu from '@/components/FixedNavbarMenu';
import InfoQuizElement from '@/components/quiz/InfoQuizElement';
import { useAuth } from '@/context/AuthContext';
import NavbarEduPro from '@/components/NavbarEduPro';

interface Choice {
  id: number;
  choice_text: string;
  is_correct: boolean;
}

interface Question {
  id: number;
  question_text: string;
  explanation?: string | null;
  choices: Choice[];
}

interface UserSession {
  user: {
    id: string;
    role: 'student' | 'staff' | string;
  };
}

interface QuizResultsProps {
  params: Promise<{ slug: string; quizSlug: string }>;
}

export default function QuizResults({ params }: QuizResultsProps) {
  const { slug: courseSlug, quizSlug } = React.use(params);

  const { session } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [userAnswers, setUserAnswers] = useState<{ [questionId: number]: number }>({});
  const [correctAnswersCount, setCorrectAnswersCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const topicIds = searchParams.get('topics')?.split(',').map(Number) || [];
  const quantity = Number(searchParams.get('quantity')) || 10;
  const mode = searchParams.get('mode') || 'exam';
  const examMode = mode === 'exam';

  useEffect(() => {
    const fetchResults = async () => {
      const typedSession = session as UserSession | null;
      if (!typedSession?.user?.id) {
        setError('User not authenticated');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        // Fetch the quiz
        const { data: quizData, error: quizError } = await supabase
          .from('quiz_quizcommon')
          .select('id')
          .eq('slug', quizSlug)
          .eq('course_id', await courseIdFromSlug(courseSlug))
          .single();

        if (quizError) throw new Error(`Error fetching quiz: ${quizError.message}`);
        if (!quizData) throw new Error('Quiz not found');

        // Fetch the most recent quiz_statistic record for this user and quiz
        const { data: statisticData, error: statisticError } = await supabase
          .from('quiz_quizstatistic')
          .select('id')
          .eq('user_id', typedSession.user.id)
          .eq('quiz_id', quizData.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (statisticError) throw new Error(`Error fetching quiz statistic: ${statisticError.message}`);
        if (!statisticData) throw new Error('Quiz session not found');

        const quizStatisticId = statisticData.id;

        // Fetch topic IDs associated with the quiz
        const { data: topicRelations, error: topicError } = await supabase
          .from('edu_pro_topics_to_quizzes')
          .select('topic_id')
          .eq('quizcommon_id', quizData.id);

        if (topicError) throw new Error(`Error fetching topic relations: ${topicError.message}`);
        if (!topicRelations || topicRelations.length === 0) {
          setQuestions([]);
          setIsLoading(false);
          return;
        }

        const quizTopicIds: number[] = topicRelations.map((relation: { topic_id: number }) => relation.topic_id);

        // Fetch questions for the associated topics
        let query = supabase
          .from('edu_pro_quiz_question')
          .select(`
            id,
            question_text,
            explanation,
            edu_pro_quiz_choice (id, choice_text, is_correct)
          `)
          .in('topic_id', quizTopicIds);

        if (topicIds.length > 0) {
          query = query.in('topic_id', topicIds.filter((id) => quizTopicIds.includes(id)));
        }

        const { data: questionsData, error: questionsError } = await query
          .order('id', { ascending: true })
          .limit(quantity);

        if (questionsError) throw new Error(`Error fetching questions: ${questionsError.message}`);

        const formattedQuestions: Question[] = questionsData.map((q: any) => ({
          id: q.id,
          question_text: q.question_text,
          explanation: q.explanation || 'No explanation available.',
          choices: q.edu_pro_quiz_choice as Choice[],
        }));

        setQuestions(formattedQuestions);

        // Fetch user answers using quiz_statistic_id
        if (examMode) {
          const { data: answersData, error: answersError } = await supabase
            .from('quiz_useranswer')
            .select('question_id, choice_id')
            .eq('user_id', typedSession.user.id)
            .eq('quiz_statistic_id', quizStatisticId)
            .eq('exam_mode', true);

          if (answersError) throw new Error(`Error fetching user answers: ${answersError.message}`);

          const answersMap: { [questionId: number]: number } = {};
          answersData.forEach((answer: { question_id: number; choice_id: number }) => {
            answersMap[answer.question_id] = answer.choice_id;
          });
          setUserAnswers(answersMap);

          // Calculate correct answers
          let correctCount = 0;
          formattedQuestions.forEach((question) => {
            const userChoiceId = answersMap[question.id];
            const userChoice = question.choices.find((choice) => choice.id === userChoiceId);
            if (userChoice?.is_correct) {
              correctCount++;
            }
          });
          setCorrectAnswersCount(correctCount);
        } else {
          setCorrectAnswersCount(0); // Train mode: no scoring
        }
      } catch (err) {
        console.error('QuizResults: Error:', err);
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [courseSlug, quizSlug, session]);

  const handleTryAgain = () => {
    const params = new URLSearchParams({
      topics: topicIds.join(','),
      quantity: quantity.toString(),
      mode,
    });
    router.push(`/account/edupro/${courseSlug}/quiz/${quizSlug}?${params.toString()}`);
  };

  const openModal = (modalId: string) => {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('hidden');
    }
  };

  const closeModal = (modalId: string) => {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('hidden');
    }
  };

  // Draggable Modal Logic
  useEffect(() => {
    const makeModalDraggable = (modalId: string, contentId: string) => {
      const modal = document.getElementById(contentId);
      if (!modal) return;

      let isDragging = false;
      let currentX: number;
      let currentY: number;
      let initialX: number;
      let initialY: number;
      let xOffset = 0;
      let yOffset = 0;

      const startDragging = (e: MouseEvent | TouchEvent) => {
        e.preventDefault();
        initialX = e.type === 'touchstart' ? (e as TouchEvent).touches[0].clientX - xOffset : (e as MouseEvent).clientX - xOffset;
        initialY = e.type === 'touchstart' ? (e as TouchEvent).touches[0].clientY - yOffset : (e as MouseEvent).clientY - yOffset;

        isDragging = true;

        document.addEventListener('mousemove', drag);
        document.addEventListener('touchmove', drag, { passive: false });
        document.addEventListener('mouseup', stopDragging);
        document.addEventListener('touchend', stopDragging);
      };

      const drag = (e: MouseEvent | TouchEvent) => {
        if (isDragging) {
          e.preventDefault();
          currentX = e.type === 'touchmove' ? (e as TouchEvent).touches[0].clientX : (e as MouseEvent).clientX;
          currentY = e.type === 'touchmove' ? (e as TouchEvent).touches[0].clientY : (e as MouseEvent).clientY;

          xOffset = currentX - initialX;
          yOffset = currentY - initialY;

          modal.style.transform = `translate(${xOffset}px, ${yOffset}px)`;
        }
      };

      const stopDragging = () => {
        isDragging = false;
        document.removeEventListener('mousemove', drag);
        document.removeEventListener('touchmove', drag);
        document.removeEventListener('mouseup', stopDragging);
        document.removeEventListener('touchend', stopDragging);
      };

      modal.addEventListener('mousedown', startDragging);
      modal.addEventListener('touchstart', startDragging, { passive: false });

      return () => {
        modal.removeEventListener('mousedown', startDragging);
        modal.removeEventListener('touchstart', startDragging);
      };
    };

    questions.forEach((question) => {
      makeModalDraggable(`modal-${question.id}`, `modal-content-${question.id}`);
    });

    return () => {
      questions.forEach((question) => {
        const modal = document.getElementById(`modal-content-${question.id}`);
        if (modal) {
          modal.removeEventListener('mousedown', () => {});
          modal.removeEventListener('touchstart', () => {});
        }
      });
    };
  }, [questions]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4 min-h-screen bg-gray-50">
        <div className="flex space-x-2">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-4 w-4 animate-bounce rounded-full bg-sky-500"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-4 text-center min-h-screen bg-gray-50">
        <p className="text-red-600 font-medium">{error}</p>
      </div>
    );
  }

  return (
    <main className="flex-1 space-y-6 py-20  px-2 bg-gray-50 min-h-screen">
        <NavbarEduPro />
      <div className=" max-w-3xl mx-auto">

        <div className="mt-8 bg-white rounded-xl sm:shadow-sm sm:p-6 p-4 py-2 space-y-6">
                    <div className='my-6  flex justify-between items-center text-lg font-semibold text-gray-900'>
            <div className='text-gray-700'>Practice Results</div>
            {examMode && Object.keys(userAnswers).length > 0 ? (
            <div className="text-xs text-gray-500">
                Correct Answers: {correctAnswersCount} / {questions.length}
            </div>
            ) : (
            <div className="text-xs text-gray-500">
                Train Mode
            </div>
            )}
        </div>
          {questions.length === 0 ? (
            <p className="text-gray-600 font-medium text-center">
              No questions available for this quiz.
            </p>
          ) : (
            questions.map((question) => {
              const correctChoice = question.choices.find((choice) => choice.is_correct);
              return (
                <div key={question.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                    <button
                      onClick={() => openModal(`modal-${question.id}`)}
                      title="View explanation"
                      className="text-gray-600 hover:text-sky-600 transition-colors"
                    >
                      <InfoQuizElement />
                    </button>
                  <div className="flex justify-between items-center mb-2">
                    <h2 className="text-sm font-semibold text-gray-800 leading-relaxed">
                      {question.question_text}
                    </h2>

                  </div>
                  {question.choices.map((choice) => {
                    const isSelected = examMode && userAnswers[question.id] === choice.id;
                    return (
                      <div
                        key={choice.id}
                        className="flex items-center pl-4 text-sm py-3 bg-gray-50 rounded-lg my-1 hover:bg-sky-50 transition-colors"
                      >
                        <input
                          type="radio"
                          name={`question_${question.id}`}
                          value={choice.id}
                          checked={isSelected}
                          disabled
                          className={`w-5 h-5 mr-4 ${
                            isSelected
                              ? choice.is_correct
                                ? 'text-teal-500'
                                : 'text-red-500'
                              : choice.is_correct
                              ? 'text-teal-500'
                              : 'text-gray-300'
                          }`}
                        />
                        <label
                          className={`font-medium ${
                            isSelected
                              ? choice.is_correct
                                ? 'text-teal-500'
                                : 'text-red-500'
                              : choice.is_correct
                              ? 'text-teal-500'
                              : 'text-gray-700'
                          }`}
                        >
                          {choice.choice_text}
                        </label>
                      </div>
                    );
                  })}

                  <div
                    id={`modal-${question.id}`}
                    className="hidden fixed inset-0 flex items-center justify-center z-50 overflow-auto"
                    style={{ background: 'rgba(0, 0, 0, 0.4)' }}
                  >
                    <div
                      id={`modal-content-${question.id}`}
                      className="bg-white rounded-xl shadow-2xl max-w-3xl w-full p-6 sm:p-8 m-4 relative text-sm max-h-[85vh] overflow-y-auto transform transition-all"
                      style={{ cursor: 'move' }}
                    >
                      <button
                        onClick={() => closeModal(`modal-${question.id}`)}
                        className="absolute top-4 right-4 text-gray-600 hover:text-gray-900 transition-colors z-10"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-7 w-7 bg-gray-100 rounded-full p-1.5 hover:bg-gray-200"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>

                      <h2 className="text-lg font-semibold text-gray-800 mb-6">
                        <span dangerouslySetInnerHTML={{ __html: question.question_text }} />
                      </h2>

                      <div className="mb-6">
                        {question.choices
                          .filter((choice) => choice.is_correct)
                          .map((choice) => (
                            <p
                              key={choice.id}
                              className="text-base p-4 rounded-lg bg-gray-50 text-sky-600 font-medium"
                            >
                              {choice.choice_text}
                            </p>
                          ))}
                      </div>

                      <details className="group w-full">
                        <summary className="flex items-center justify-between px-4 py-3 bg-yellow-100 text-gray-800 rounded-lg cursor-pointer hover:bg-yellow-200 transition-colors">
                          <span className="text-base font-semibold">Explanation</span>
                          <span className="transform transition-transform group-open:rotate-180">
                            <svg
                              className="w-5 h-5 shrink-0"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          </span>
                        </summary>
                        <div className="px-4 py-5 border-l-4 border-sky-500 bg-gray-50 rounded-b-lg">
                          <p
                            className="text-sm leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: question.explanation! }}
                          />
                        </div>
                      </details>
                    </div>
                  </div>
                </div>
              );
            }))}
        </div>

        {/*<button
          onClick={handleTryAgain}
          className="mt-6 bg-sky-600 hover:bg-sky-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
        >
          Try Again
        </button>*/}
      </div>

      {(session as UserSession)?.user?.role && ['student', 'staff'].includes((session as UserSession).user.role) && (
        <FixedNavbarMenu />
      )}
    </main>
  );
}

const courseIdFromSlug = async (slug: string): Promise<number> => {
  const { data, error } = await supabase
    .from('edu_pro_course')
    .select('id')
    .eq('slug', slug)
    .single();

  if (error || !data) throw new Error('Course not found');
  return data.id;
};