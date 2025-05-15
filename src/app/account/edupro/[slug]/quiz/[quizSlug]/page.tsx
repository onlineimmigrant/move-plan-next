// src/app/account/edupro/[slug]/quiz/[quizSlug]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import React from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { v4 as uuidv4 } from 'uuid';
import LoadingIndicator from '@/components/quiz/LoadingIndicator';
import ErrorMessage from '@/components/quiz/ErrorMessage';
import EmptyState from '@/components/quiz/EmptyState';
import QuizHeader from '@/components/quiz/QuizHeader';
import QuestionDisplay from '@/components/quiz/QuestionDisplay';
import QuizForm from '@/components/quiz/QuizForm';
import ExplanationModal from '@/components/quiz/ExplanationModal';
import { courseIdFromSlug, shuffleArray } from '@/lib/quizUtils';
import { Quiz, Question, UserSession, Choice } from '@/components/quiz/Types';

interface QuizPageProps {
  params: Promise<{ slug: string; quizSlug: string }>;
}

export default function QuizPage({ params }: QuizPageProps) {
  const { slug: courseSlug, quizSlug } = React.use(params);

  const { session } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<{ [questionId: number]: number[] }>({});
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const topicIds = searchParams.get('topics')?.split(',').map(Number) || [];
  const quantity = Number(searchParams.get('quantity')) || 10;
  const mode = searchParams.get('mode') || 'exam';
  const examMode = mode === 'exam';

  useEffect(() => {
    const fetchQuizAndQuestions = async () => {
      const typedSession = session as UserSession | null;
      if (!typedSession?.user?.id) {
        setError('User not authenticated');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const { data: quizData, error: quizError } = await supabase
          .from('quiz_quizcommon')
          .select('id, course_id, slug, randomize_choices')
          .eq('slug', quizSlug)
          .eq('course_id', await courseIdFromSlug(courseSlug))
          .single();

        if (quizError) throw new Error(`Error fetching quiz: ${quizError.message}`);
        if (!quizData) throw new Error('Quiz not found');

        setQuiz(quizData as Quiz);

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

        let query = supabase
          .from('edu_pro_quiz_question')
          .select(`
            id,
            topic_id,
            question_text,
            explanation,
            video_player,
            links_to_video,
            correct_answer_count,
            edu_pro_quiz_topic (id, title),
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
          topic_id: q.topic_id,
          topic: q.edu_pro_quiz_topic as { id: number; title: string },
          question_text: q.question_text,
          explanation: q.explanation,
          video_player: q.video_player,
          links_to_video: q.links_to_video,
          correct_answer_count: q.correct_answer_count,
          choices: (quizData.randomize_choices ? shuffleArray(q.edu_pro_quiz_choice) : q.edu_pro_quiz_choice) as Choice[],
        }));

        setQuestions(formattedQuestions);
        setTimeRemaining(formattedQuestions.length * 60);
      } catch (err) {
        console.error('Quiz: Error:', err);
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuizAndQuestions();
  }, [courseSlug, quizSlug, session]);

  useEffect(() => {
    if (timeRemaining <= 0 || isLoading || !questions.length) return;

    const timer = setTimeout(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeRemaining, isLoading, questions]);

  const handleAnswerChange = (questionId: number, choiceId: number, isMulti: boolean) => {
    setUserAnswers((prev) => {
      const currentAnswers = prev[questionId] || [];
      if (isMulti) {
        if (currentAnswers.includes(choiceId)) {
          return { ...prev, [questionId]: currentAnswers.filter((id) => id !== choiceId) };
        } else if (currentAnswers.length < questions[currentQuestionIndex].correct_answer_count) {
          return { ...prev, [questionId]: [...currentAnswers, choiceId] };
        } else {
          alert(`You can only select ${questions[currentQuestionIndex].correct_answer_count} options.`);
          return prev;
        }
      } else {
        return { ...prev, [questionId]: [choiceId] };
      }
    });
  };

  const handleSubmit = async () => {
    if (!quiz || !session?.user?.id) return;

    if (examMode) {
      try {
        const quizStatisticId = uuidv4();
        const { error: statisticError } = await supabase
          .from('quiz_quizstatistic')
          .insert({
            id: quizStatisticId,
            user_id: session.user.id,
            quiz_id: quiz.id,
            created_at: new Date().toISOString(),
          });

        if (statisticError) {
          console.error('Error creating quiz statistic:', statisticError);
          setError('Failed to save quiz session');
          return;
        }

        const answersToSave = Object.entries(userAnswers).flatMap(([questionId, choiceIds]) =>
          choiceIds.map((choiceId) => ({
            user_id: session.user.id,
            question_id: Number(questionId),
            choice_id: choiceId,
            exam_mode: true,
            quiz_statistic_id: quizStatisticId,
          }))
        );

        const { error: saveError } = await supabase.from('quiz_useranswer').insert(answersToSave);
        if (saveError) {
          console.error('Error saving answers:', saveError);
          setError('Failed to save answers');
          return;
        }
      } catch (err) {
        console.error('Error in handleSubmit:', err);
        setError('An unexpected error occurred while saving answers');
        return;
      }
    }

    const params = new URLSearchParams({
      topics: topicIds.join(','),
      quantity: quantity.toString(),
      mode,
    });
    router.push(`/account/edupro/${courseSlug}/quiz/${quizSlug}/results?${params.toString()}`);
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const openModal = (modalId: string) => {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('hidden');
    }
  };

  const closeModal = (modalId: string, videoId?: string) => {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('hidden');
      if (videoId) {
        const iframe = document.getElementById(videoId) as HTMLIFrameElement;
        if (iframe) {
          const iframeSrc = iframe.src;
          iframe.src = iframeSrc;
        }
      }
    }
  };

  if (isLoading) {
    return <LoadingIndicator />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  if (questions.length === 0 || !quiz) {
    return <EmptyState />;
  }

  const currentQuestion = questions[currentQuestionIndex];
  const currentUserAnswers = userAnswers[currentQuestion.id] || [];
  const correctAnswer = currentQuestion.choices.find((choice) => choice.is_correct)?.choice_text || '';

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: currentQuestion.question_text,
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: correctAnswer,
                },
              },
            ],
          }),
        }}
      />

      <main className="flex-1 space-y-6 pb-20 mt-16 mb-20 px-4 bg-gray-50 min-h-screen">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 max-w-7xl mx-auto">
          <div className="col-span-1"></div>

          <div className="mt-8 col-span-3 flex flex-col gap-6 px-4 sm:px-6 bg-white rounded-xl shadow-sm p-6">
            <QuizHeader
              examMode={examMode}
              topicTitle={currentQuestion.topic.title}
              currentIndex={currentQuestionIndex}
              totalQuestions={questions.length}
              timeRemaining={timeRemaining}
              openModal={openModal}
              modalId={`modal-${currentQuestion.id}`}
            />
            <QuestionDisplay
              questionText={currentQuestion.question_text}
              correctAnswerCount={currentQuestion.correct_answer_count}
            />
            <QuizForm
              question={currentQuestion}
              currentAnswers={currentUserAnswers}
              randomizeChoices={quiz.randomize_choices}
              handleAnswerChange={handleAnswerChange}
              handleNext={handleNext}
              handlePrev={handlePrev}
              currentIndex={currentQuestionIndex}
              totalQuestions={questions.length}
            />
            <ExplanationModal
              question={currentQuestion}
              examMode={examMode}
             // randomizeChoices={quiz.randomize_choices}
              closeModal={closeModal}
            />
          </div>

          <div className="col-span-1"></div>
        </div>
      </main>

      {(session as UserSession)?.user?.role && ['student', 'staff'].includes((session as UserSession).user.role) && (
        <></>
      )}
    </>
  );
}