// src/app/account/edupro/[slug]/quiz/[quizSlug]/results/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import React from 'react';
import { supabase } from '@/lib/supabaseClient';
import FixedNavbarMenu from '@/components/FixedNavbarMenu';
import InfoQuizElement from '@/components/quiz/InfoQuizElement';
import ExplanationModal from '@/components/quiz/ExplanationModal';
import { useAuth } from '@/context/AuthContext';
import NavbarEduPro from '@/components/NavbarEduPro';
import { UserSession, Question as TypesQuestion } from '@/components/quiz/Types';

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
  video_player?: string | null;
  links_to_video?: string | null;
  topic_id?: number;
  topic?: { id: number; title: string };
}

// Utility function to strip and transform HTML tags in question text
const formatQuestionText = (text: string): string => {
  // Replace <br/> tags with a newline (or space for inline display)
  let formattedText = text.replace(/<br\s*\/?>/gi, ' ');
  
  // Remove other HTML tags while preserving their content
  formattedText = formattedText.replace(/<\/?[^>]+(>|$)/g, '');

  // Decode HTML entities (e.g., &amp; to &, &lt; to <, etc.)
  const entities: { [key: string]: string } = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&apos;': "'",
    '&nbsp;': ' ',
  };
  return formattedText.replace(/&[a-zA-Z0-9#]+;/g, (match) => entities[match] || match);
};

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
  const [modalOpenStates, setModalOpenStates] = useState<{ [questionId: number]: boolean }>({});

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
        console.log('Fetching quiz with slug:', quizSlug, 'and courseSlug:', courseSlug);
        const { data: quizData, error: quizError } = await supabase
          .from('quiz_quizcommon')
          .select('id')
          .eq('slug', quizSlug)
          .eq('course_id', await courseIdFromSlug(courseSlug))
          .single();

        if (quizError) throw new Error(`Error fetching quiz: ${quizError.message}`);
        if (!quizData) throw new Error('Quiz not found');

        console.log('Fetching latest quiz statistic for user:', typedSession.user.id);
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
        console.log('Quiz statistic ID:', quizStatisticId);

        console.log('Fetching user answers for quiz statistic:', quizStatisticId);
        const { data: answersData, error: answersError } = await supabase
          .from('quiz_useranswer')
          .select('question_id, choice_id, is_correct')
          .eq('user_id', typedSession.user.id)
          .eq('quiz_statistic_id', quizStatisticId)
          .eq('exam_mode', examMode);

        if (answersError) throw new Error(`Error fetching user answers: ${answersError.message}`);
        if (!answersData || answersData.length === 0) {
          console.log('No user answers found');
          setQuestions([]);
          setIsLoading(false);
          return;
        }

        const questionIds = [...new Set(answersData.map((answer: { question_id: number }) => answer.question_id))];
        console.log('Question IDs from user answers:', questionIds);

        console.log('Fetching questions for IDs:', questionIds);
        const { data: questionsData, error: questionsError } = await supabase
          .from('edu_pro_quiz_question')
          .select(`
            id,
            question_text,
            explanation,
            video_player,
            links_to_video,
            edu_pro_quiz_topic (id, title),
            edu_pro_quiz_choice (id, choice_text, is_correct)
          `)
          .in('id', questionIds);

        if (questionsError) throw new Error(`Error fetching questions: ${questionsError.message}`);
        if (!questionsData || questionsData.length === 0) {
          console.log('No questions found for the answered IDs');
          setQuestions([]);
          setIsLoading(false);
          return;
        }

        const formattedQuestions: Question[] = questionsData.map((q: any) => ({
          id: q.id,
          question_text: q.question_text,
          explanation: q.explanation || 'No explanation available.',
          video_player: q.video_player || null,
          links_to_video: q.links_to_video || null,
          choices: q.edu_pro_quiz_choice as Choice[],
          topic_id: q.edu_pro_quiz_topic?.id,
          topic: q.edu_pro_quiz_topic ? { id: q.edu_pro_quiz_topic.id, title: q.edu_pro_quiz_topic.title } : undefined,
        }));

        console.log('Formatted questions:', formattedQuestions.map(q => ({ id: q.id, text: q.question_text })));
        setQuestions(formattedQuestions);

        if (examMode) {
          const answersMap: { [questionId: number]: number } = {};
          answersData.forEach((answer: { question_id: number; choice_id: number }) => {
            answersMap[answer.question_id] = answer.choice_id;
          });
          console.log('User answers map:', answersMap);

          setUserAnswers(answersMap);

          let correctCount = 0;
          for (const question of formattedQuestions) {
            const questionAnswers = answersData.filter((answer: any) => answer.question_id === question.id);
            const correctAnswerCount = question.choices.filter(choice => choice.is_correct).length;
            const userCorrectCount = questionAnswers.filter((answer: any) => answer.is_correct).length;
            const userSelectedCount = questionAnswers.length;

            const isCorrect = userSelectedCount === correctAnswerCount && userCorrectCount === correctAnswerCount;
            if (isCorrect) {
              correctCount++;
            }
          }
          console.log('Correct answers count:', correctCount);
          setCorrectAnswersCount(correctCount);
        } else {
          setCorrectAnswersCount(0);
        }
      } catch (err) {
        console.error('QuizResults: Error:', err);
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
        console.log('Fetch completed, isLoading:', false);
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

  const openModal = (questionId: number) => {
    setModalOpenStates((prev) => ({ ...prev, [questionId]: true }));
  };

  const closeModal = (modalId: string, videoId?: string) => {
    const questionId = parseInt(modalId.replace('modal-', ''), 10);
    setModalOpenStates((prev) => ({ ...prev, [questionId]: false }));
  };

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
    <main className="flex-1 space-y-6 py-20 px-2 bg-gray-50 min-h-screen">
      <NavbarEduPro />
      <div className="max-w-3xl mx-auto">
        <div className="mt-8 bg-white rounded-xl sm:shadow-sm sm:p-6 p-4 py-2 space-y-6">
          <div className="my-6 flex justify-between items-center text-lg font-semibold text-gray-900">
            <div className="text-gray-700">Practice Results</div>
            {examMode && Object.keys(userAnswers).length > 0 ? (
              <div className="text-xs text-gray-500">
                Correct Answers: {correctAnswersCount} / {questions.length}
              </div>
            ) : (
              <div className="text-xs text-gray-500">Train Mode</div>
            )}
          </div>
          {questions.length === 0 ? (
            <p className="text-gray-600 font-medium text-center">
              No questions available for this quiz.
            </p>
          ) : (
            questions.map((question) => (
              <div key={question.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                <button
                  onClick={() => openModal(question.id)}
                  title="View explanation"
                  className="text-gray-600 hover:text-sky-600 transition-colors"
                >
                  <InfoQuizElement />
                </button>
                {/* Add topic title above the question */}
                <div className="text-xs text-gray-500 mb-1">
                  {question.topic?.title || 'Unknown Topic'}
                </div>
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-sm font-semibold text-gray-800 leading-relaxed">
                    {formatQuestionText(question.question_text)}
                  </h2>
                </div>
                {question.choices.map((choice) => {
                  const isSelected = examMode && userAnswers[question.id] === choice.id;
                  return (
                    <div
                      key={choice.id}
                      className={`flex items-center pl-4 text-sm py-3 rounded-lg my-1 transition-colors ${
                        isSelected
                          ? choice.is_correct
                            ? 'bg-green-50'
                            : 'bg-red-50'
                          : choice.is_correct
                          ? 'bg-green-50'
                          : 'bg-gray-50'
                      } hover:bg-sky-50`}
                    >
                      <input
                        type="radio"
                        name={`question_${question.id}`}
                        value={choice.id}
                        checked={isSelected}
                        disabled
                        className={`w-5 h-5 mr-4 text-gray-500`} // Removed color styling from radio
                      />
                      <label
                        className={`font-medium text-gray-700`} // Removed color styling from label
                      >
                        {choice.choice_text}
                      </label>
                    </div>
                  );
                })}
                <ExplanationModal
                  question={question as TypesQuestion}
                  isOpen={modalOpenStates[question.id] || false}
                  closeModal={closeModal}
                />
              </div>
            ))
          )}
        </div>
        <button
          onClick={handleTryAgain}
          className="mt-6 bg-sky-600 hover:bg-sky-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
        >
          Try Again
        </button>
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