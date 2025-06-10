'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import React from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
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
import NavbarEduPro from '@/components/edupro/NavbarEduPro';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

interface QuizPageProps {
  params: Promise<{ slug: string; quizSlug: string }>;
}

export default function QuizPage({ params }: QuizPageProps) {
  const { slug: courseSlug, quizSlug } = React.use(params);
  const { session } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const lessonIdParam = searchParams.get('lessonId');
  const lessonId: number | null = lessonIdParam && !isNaN(parseInt(lessonIdParam, 10)) ? parseInt(lessonIdParam, 10) : null;

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<{ [questionId: number]: number[] }>({});
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [shouldSubmit, setShouldSubmit] = useState<boolean>(false);

  const topicIds = searchParams.get('topics')?.split(',').map(Number) || [];
  const quantity = Number(searchParams.get('quantity')) || 10;
  const mode = searchParams.get('mode') || 'exam';
  const examMode = mode === 'exam';

  console.log('QuizPage: Initialized', { courseSlug, quizSlug, lessonId, topicIds, quantity, mode, examMode });

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
        console.log('QuizPage: Fetching quiz with slug:', quizSlug, 'and courseSlug:', courseSlug);
        const { data: quizData, error: quizError } = await supabase
          .from('quiz_quizcommon')
          .select('id, course_id, slug, numerate_choices, randomize_choices')
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
            edu_pro_quiz_topic (id, title),
            edu_pro_quiz_choice (id, choice_text, is_correct)
          `)
          .in('topic_id', quizTopicIds);

        if (topicIds.length > 0) {
          query = query.in('topic_id', topicIds.filter((id) => quizTopicIds.includes(id)));
        }

        const { data: questionsData, error: questionsError } = await query;

        if (questionsError) throw new Error(`Error fetching questions: ${questionsError.message}`);
        if (!questionsData || questionsData.length === 0) {
          setQuestions([]);
          setIsLoading(false);
          return;
        }

        const formattedQuestions: Question[] = questionsData.map((q: any) => {
          const choices = (quizData.randomize_choices ? shuffleArray(q.edu_pro_quiz_choice) : q.edu_pro_quiz_choice) as Choice[];
          return {
            id: q.id,
            topic_id: q.topic_id,
            topic: q.edu_pro_quiz_topic as { id: number; title: string },
            question_text: q.question_text,
            explanation: q.explanation,
            video_player: q.video_player,
            links_to_video: q.links_to_video,
            choices,
            correct_answer_count: choices.filter(choice => choice.is_correct).length,
          };
        });

        const shuffledQuestions = shuffleArray(formattedQuestions);
        const limitedQuestions = shuffledQuestions.slice(0, quantity);

        console.log('QuizPage: Fetched questions:', limitedQuestions.map(q => ({ id: q.id, topic_id: q.topic_id })));

        setQuestions(limitedQuestions);
        setTimeRemaining(limitedQuestions.length * 60);
      } catch (err) {
        console.error('QuizPage: Error fetching quiz/questions:', err);
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
          setShouldSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeRemaining, isLoading, questions]);

  useEffect(() => {
    if (shouldSubmit) {
      handleSubmit();
    }
  }, [shouldSubmit]);

  useEffect(() => {
    if (questions.length > 0) {
      const modalId = `modal-${questions[currentQuestionIndex].id}`;
      closeModal(modalId);
    }
  }, [currentQuestionIndex, questions]);

  const handleAnswerChange = (questionId: number, choiceId: number, isMulti: boolean) => {
    setUserAnswers((prev) => {
      const currentAnswers = prev[questionId] || [];
      const currentQuestion = questions.find(q => q.id === questionId);
      const correctAnswerCount = currentQuestion?.choices.filter(choice => choice.is_correct).length || 1;

      if (isMulti) {
        if (currentAnswers.includes(choiceId)) {
          return { ...prev, [questionId]: currentAnswers.filter((id) => id !== choiceId) };
        } else if (currentAnswers.length < correctAnswerCount) {
          return { ...prev, [questionId]: [...currentAnswers, choiceId] };
        } else {
          alert(`You can only select ${correctAnswerCount} options.`);
          return prev;
        }
      } else {
        return { ...prev, [questionId]: [choiceId] };
      }
    });
  };

  const handleSubmit = async () => {
    console.log('QuizPage: Starting handleSubmit', {
      quizId: quiz?.id,
      userId: session?.user?.id,
      questionsCount: questions.length,
      userAnswersCount: Object.keys(userAnswers).length,
      lessonId,
      examMode,
    });

    if (!quiz || !session?.user?.id || questions.length === 0) {
      setError('Cannot submit: Missing quiz, user, or questions.');
      console.error('QuizPage: Validation failed: Missing quiz, user, or questions.');
      return;
    }

    const answerCount = Object.keys(userAnswers).length;
    if (answerCount === 0) {
      console.warn('QuizPage: No answers provided; redirecting without saving.');
      const params = new URLSearchParams({
        topics: topicIds.join(','),
        quantity: quantity.toString(),
        mode,
        ...(lessonId !== null && { lessonId: lessonId.toString() }),
      });
      router.push(`/account/edupro/${courseSlug}/quiz/${quizSlug}/results?${params.toString()}`);
      return;
    }

    let quizStatisticId: string | null = null;

    try {
      quizStatisticId = uuidv4();
      console.log('QuizPage: Preparing quiz_statistic insert', { quizStatisticId, lessonId });

      const statisticPayload = {
        id: quizStatisticId,
        user_id: session.user.id,
        quiz_id: quiz.id,
        lesson_id: lessonId, // Explicitly include lessonId
        created_at: new Date().toISOString(),
        exam_mode: examMode,
        questions_attempted: answerCount,
      };
      console.log('QuizPage: quiz_statistic payload:', statisticPayload);

      const { data: statisticData, error: statisticError } = await supabase
        .from('quiz_quizstatistic')
        .insert(statisticPayload)
        .select('id, lesson_id') // Select lesson_id to verify insertion
        .single();

      if (statisticError) {
        console.error('QuizPage: Error inserting quiz_statistic:', statisticError);
        setError(`Failed to save quiz session: ${statisticError.message}`);
        return;
      }
      console.log('QuizPage: quiz_statistic inserted successfully:', statisticData);

      // Verify the inserted record
      const { data: verifyData, error: verifyError } = await supabase
        .from('quiz_quizstatistic')
        .select('id, lesson_id')
        .eq('id', quizStatisticId)
        .single();

      if (verifyError) {
        console.error('QuizPage: Error verifying quiz_statistic:', verifyError);
      } else {
        console.log('QuizPage: Verified quiz_statistic:', verifyData);
      }

      const questionIds = Object.keys(userAnswers).map(Number);
      const { data: questionData, error: questionError } = await supabase
        .from('edu_pro_quiz_question')
        .select('id, topic_id, section')
        .in('id', questionIds);

      if (questionError) {
        console.error('QuizPage: Error fetching question data:', questionError);
        setError(`Failed to fetch question data: ${questionError.message}`);
        return;
      }

      const questionMap = new Map<number, { topic_id: number; section: string }>();
      questionData.forEach((q: any) => {
        questionMap.set(q.id, { topic_id: q.topic_id, section: q.section });
      });

      const choiceIds = Object.values(userAnswers).flat();
      const { data: choiceData, error: choiceError } = await supabase
        .from('edu_pro_quiz_choice')
        .select('id, is_correct')
        .in('id', choiceIds);

      if (choiceError) {
        console.error('QuizPage: Error fetching choice data:', choiceError);
        setError(`Failed to fetch choice data: ${choiceError.message}`);
        return;
      }

      const choiceMap = new Map<number, boolean>();
      choiceData.forEach((c: any) => {
        choiceMap.set(c.id, c.is_correct);
      });

      const answersToSave = Object.entries(userAnswers).flatMap(([questionId, choiceIds]) =>
        choiceIds.map((choiceId) => {
          const questionInfo = questionMap.get(Number(questionId));
          const isCorrect = choiceMap.get(choiceId) || false;
          return {
            user_id: session.user.id,
            question_id: Number(questionId),
            choice_id: choiceId,
            exam_mode: examMode,
            quiz_statistic_id: quizStatisticId,
            is_correct: isCorrect,
            topic_id: questionInfo?.topic_id,
            section: questionInfo?.section,
          };
        })
      );

      console.log('QuizPage: Saving answers:', answersToSave.length);
      const { error: saveError } = await supabase.from('quiz_useranswer').insert(answersToSave);
      if (saveError) {
        console.error('QuizPage: Error saving answers:', saveError);
        setError(`Failed to save answers: ${saveError.message}`);
        return;
      }
      console.log('QuizPage: Answers saved:', answersToSave.length);

      const { data: savedAnswers, error: fetchSavedError } = await supabase
        .from('quiz_useranswer')
        .select('question_id, is_correct')
        .eq('quiz_statistic_id', quizStatisticId)
        .eq('user_id', session.user.id);

      if (fetchSavedError) {
        console.error('QuizPage: Error fetching saved answers:', fetchSavedError);
        setError(`Failed to fetch saved answers: ${fetchSavedError.message}`);
        return;
      }

      console.log('QuizPage: Fetched saved answers:', savedAnswers);

      let questionsAttempted = 0;
      let questionsCorrect = 0;

      if (savedAnswers && savedAnswers.length > 0) {
        const questionIdsAttempted = [...new Set(savedAnswers.map(answer => answer.question_id))];
        questionsAttempted = questionIdsAttempted.length;

        for (const questionId of questionIdsAttempted) {
          const questionAnswers = savedAnswers.filter(answer => answer.question_id === questionId);
          const { data: choicesData, error: choicesError } = await supabase
            .from('edu_pro_quiz_choice')
            .select('id, is_correct')
            .eq('question_id', questionId);

          if (choicesError) {
            console.error('QuizPage: Error fetching choices:', choicesError);
            continue;
          }

          const correctAnswerCount = choicesData.filter(choice => choice.is_correct).length;
          const userSelectedCorrect = questionAnswers.filter(answer => answer.is_correct).length;
          const userSelectedCount = questionAnswers.length;

          const isCorrect = userSelectedCount === correctAnswerCount && userSelectedCorrect === correctAnswerCount;
          if (isCorrect) {
            questionsCorrect += 1;
          }
        }
      }

      const percentCorrect = questionsAttempted > 0 ? (questionsCorrect / questionsAttempted) * 100 : 0;
      console.log('QuizPage: Updating quiz_statistic:', { questionsAttempted, questionsCorrect, percentCorrect });

      const { error: updateStatisticError } = await supabase
        .from('quiz_quizstatistic')
        .update({
          questions_attempted: questionsAttempted,
          questions_correct: questionsCorrect,
          percent_correct: percentCorrect,
        })
        .eq('id', quizStatisticId);

      if (updateStatisticError) {
        console.error('QuizPage: Error updating quiz_statistic:', updateStatisticError);
        setError(`Failed to update quiz statistics: ${updateStatisticError.message}`);
        return;
      }

      const params = new URLSearchParams({
        topics: topicIds.join(','),
        quantity: quantity.toString(),
        mode,
        ...(quizStatisticId && { statisticId: quizStatisticId }),
        ...(lessonId !== null && { lessonId: lessonId.toString() }),
      });
      console.log('QuizPage: Redirecting to results:', params.toString());
      router.push(`/account/edupro/${courseSlug}/quiz/${quizSlug}/results?${params.toString()}`);
    } catch (err) {
      console.error('QuizPage: Error in handleSubmit:', err);
      setError('An unexpected error occurred while saving answers');
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setShouldSubmit(true);
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
      <main className="flex-1 sm:pb-36 sm:pt-4 py-12 px-4 sm:bg-gray-50 min-h-screen">
        <NavbarEduPro />
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 max-w-7xl mx-auto">
          <div className="col-span-1"></div>
          <div className="sm:mt-16 col-span-3 flex flex-col gap-4 sm:gap-8 px-4 sm:px-6 sm:bg-white sm:rounded-xl sm:shadow-sm p-6">
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
              correctAnswerCount={currentQuestion.choices.filter(choice => choice.is_correct).length}
            />
            <QuizForm
              question={currentQuestion}
              currentAnswers={currentUserAnswers}
              randomizeChoices={quiz.randomize_choices}
              numerateChoices={quiz.numerate_choices}
              handleAnswerChange={handleAnswerChange}
              handleNext={handleNext}
              handlePrev={handlePrev}
              currentIndex={currentQuestionIndex}
              totalQuestions={questions.length}
              openModal={openModal}
              modalId={`modal-${currentQuestion.id}`}
              examMode={examMode}
            />
            <ExplanationModal
              question={currentQuestion}
              examMode={examMode}
              randomizeChoices={quiz.randomize_choices}
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