'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
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
const supabaseAnonKey: string = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

interface QuizPageProps {
  params: Promise<{ slug: string; quizSlug: string }>;
}

export default function QuizPage({ params }: QuizPageProps) {
  const { slug: courseSlug, quizSlug } = React.use(params);
  const { session } = useAuth() as { session: UserSession | null }; // Explicitly type session
  const router = useRouter();
  const searchParams = useSearchParams();

  // Memoize session to ensure stable reference
  const stableSession = useMemo(() => session, [session?.user?.id]);

  // Memoize query parameters to prevent re-renders
  const lessonIdParam = useMemo(() => searchParams.get('lessonId'), [searchParams]);
  const lessonId: number | null = useMemo(
    () =>
      lessonIdParam && lessonIdParam !== 'undefined' && !isNaN(parseInt(lessonIdParam, 10))
        ? parseInt(lessonIdParam, 10)
        : null,
    [lessonIdParam]
  );
  const topicIds = useMemo(
    () => searchParams.get('topics')?.split(',').map(Number).filter(id => !isNaN(id)) || [],
    [searchParams]
  );
  const section = useMemo(() => searchParams.get('section') || null, [searchParams]);
  const quantity = useMemo(() => Number(searchParams.get('quantity')) || 10, [searchParams]);
  const mode = useMemo(() => searchParams.get('mode') || 'exam', [searchParams]);
  const examMode = useMemo(() => mode === 'exam', [mode]);

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<{ [questionId: number]: number[] }>({});
  const timeRemainingRef = useRef<number>(0); // Use ref for timeRemaining
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [shouldSubmit, setShouldSubmit] = useState<boolean>(false);

  // Log initialization only once
  useEffect(() => {
    console.log('QuizPage: Initialized', {
      courseSlug,
      quizSlug,
      lessonId,
      topicIds,
      section,
      quantity,
      mode,
      examMode,
    });
  }, []); // Empty dependency array for mount-only log

  useEffect(() => {
    const fetchQuizAndQuestions = async () => {
      if (!stableSession?.user?.id) {
        console.log('QuizPage: User not authenticated');
        setError('User not authenticated');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        console.log('QuizPage: Fetching quiz with slug:', quizSlug, 'and courseSlug:', courseSlug);
        const { data: quizData, error: quizError } = await supabase
          .from('quiz_quizcommon')
          .select('id, course_id, slug, numerate_choices, randomize_choices, question_seconds')
          .eq('slug', quizSlug)
          .eq('course_id', await courseIdFromSlug(courseSlug))
          .single();

        if (quizError) {
          console.error('QuizPage: Quiz error', quizError);
          throw new Error(`Error fetching quiz: ${quizError.message}`);
        }
        if (!quizData) {
          console.error('QuizPage: Quiz not found');
          throw new Error('Quiz not found');
        }

        setQuiz(quizData as Quiz);
        console.log('QuizPage: Quiz fetched', { quizId: quizData.id });

        console.log('QuizPage: Fetching topic relations', { quizId: quizData.id });

        const { data: relations, error: topicError } = await supabase
          .from('edu_pro_topics_to_quizzes')
          .select('topic_id')
          .eq('quizcommon_id', quizData.id);

        if (topicError) {
          console.error('QuizPage: Topic relations error:', topicError);
          throw new Error(`Error fetching topic relations: ${topicError.message}`);
        }
        if (!relations || relations.length === 0) {
          console.log('QuizPage: No topic relations found');
          setQuestions([]);
          setIsLoading(false);
          return;
        }

        const quizTopicIds: number[] = relations.map((relation: { topic_id: number }) => relation.topic_id);
        console.log('QuizPage: Quiz topic IDs:', quizTopicIds);

        let query = supabase
          .from('edu_pro_quiz_question')
          .select(`
            id,
            topic_id,
            section,
            question_text,
            explanation,
            video_player,
            links_to_video,
            edu_pro_quiz_topic (id, title),
            edu_pro_quiz_choice (id, choice_text, is_correct)
          `)
          .in('topic_id', quizTopicIds);

        if (topicIds.length > 0) {
          const filteredTopicIds = topicIds.filter(id => quizTopicIds.includes(id));
          console.log('QuizPage: Applying topic filter:', filteredTopicIds);
          query = query.in('topic_id', filteredTopicIds);
        }

        if (section) {
          console.log('QuizPage: Applying section filter:', section);
          query = query.eq('section', section);
        }

        console.log('QuizPage: Fetching questions');
        const { data: questionsData, error: questionsError } = await query;

        if (questionsError) {
          console.error('QuizPage: Questions error:', questionsError);
          throw new Error(`Error fetching questions: ${questionsError.message}`);
        }
        if (!questionsData || questionsData.length === 0) {
          console.log('QuizPage: No questions found');
          setQuestions([]);
          setIsLoading(false);
          return;
        }

        const formattedQuestions: Question[] = questionsData.map((q: any) => {
          const choices = (quizData.randomize_choices ? shuffleArray(q.edu_pro_quiz_choice) : q.edu_pro_quiz_choice) as Choice[];
          return {
            id: q.id,
            topic_id: q.topic_id,
            section: q.section,
            topic: q.edu_pro_quiz_topic as { id: number; title: string },
            question_text: q.question_text,
            explanation: q.explanation || null,
            video_player: q.video_player || null,
            links_to_video: q.links_to_video || null,
            choices,
            correct_answer_count: choices.filter((choice: any) => choice.is_correct).length,
          };
        });

        const shuffledQuestions = shuffleArray(formattedQuestions);
        const limitedQuestions = shuffledQuestions.slice(0, quantity);
        console.log('QuizPage: Fetched questions:', limitedQuestions.map(q => ({ id: q.id, topic_id: q.topic_id, section: q.section })));

        setQuestions(limitedQuestions);
        timeRemainingRef.current = limitedQuestions.length * (quizData.question_seconds || 160);
      } catch (err) {
        console.error('QuizPage: Error fetching quiz/questions:', err);
        setError((err as Error).message || 'Failed to load quiz');
      } finally {
        console.log('QuizPage: Fetch completed, isLoading: false');
        setIsLoading(false);
      }
    };

    fetchQuizAndQuestions();
  }, [courseSlug, quizSlug, stableSession, topicIds, section, quantity]);

  const timeOfQuiz = quiz?.question_seconds || 102;

  // Timer effect using ref
  useEffect(() => {
    if (timeRemainingRef.current <= 0 || isLoading || questions.length === 0) return;

    const timer = setInterval(() => {
      timeRemainingRef.current -= 1;
      if (timeRemainingRef.current <= 0) {
        setShouldSubmit(true);
        clearInterval(timer);
      }
      // Minimal state update to trigger UI render
      setQuestions([...questions]);
    }, 1000);

    return () => clearInterval(timer);
  }, [isLoading, questions]);

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
          return { ...prev, [questionId]: currentAnswers.filter(id => id !== choiceId) };
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
      userId: stableSession?.user?.id,
      questionsCount: questions.length,
      userAnswersCount: Object.keys(userAnswers).length,
      lessonId,
      examMode,
    });

    if (!quiz || !stableSession?.user?.id || questions.length === 0) {
      setError('Cannot submit: missing quiz, user, or questions.');
      console.error('QuizPage: Validation failed');
      return;
    }

    const answerCount = Object.keys(userAnswers).length;
    if (answerCount === 0) {
      console.log('QuizPage: No answers provided, redirecting without saving');
      const params = new URLSearchParams({
        topics: topicIds.join(','),
        ...(section && { section }),
        quantity: quantity.toString(),
        mode,
        ...(lessonId !== null && { lessonId: lessonId.toString() }),
      });
      console.log('QuizPage: Redirecting to results (no answers):', params.toString());
      router.push(`/account/edupro/${courseSlug}/quiz/${quizSlug}/results?${params.toString()}`);
      return;
    }

    let quizStatisticId: string | null = null;

    try {
      quizStatisticId = uuidv4();
      console.log('QuizPage: Preparing quiz_statistic insert:', { quizStatisticId, lessonId });

      const statisticPayload = {
        id: quizStatisticId,
        user_id: stableSession.user.id,
        quiz_id: quiz.id,
        lesson_id: lessonId,
        created_at: new Date().toISOString(),
        exam_mode: examMode,
        questions_attempted: answerCount,
      };
      console.log('QuizPage: Quiz statistic payload:', statisticPayload);

      const { data: statisticData, error: statisticError } = await supabase
        .from('quiz_quizstatistic')
        .insert(statisticPayload)
        .select('id, lesson_id')
        .single();

      if (statisticError) {
        console.error('QuizPage: Statistic error:', statisticError);
        throw new Error(`Failed to save quiz statistic: ${statisticError.message}`);
      }
      console.log('QuizPage: Quiz statistic inserted:', {
        id: statisticData.id,
        lesson_id: statisticData.lesson_id,
      });

      const questionIds = Object.keys(userAnswers).map(Number);
      console.log('QuizPage: Fetching question data:', questionIds);
      const { data: questionData, error: questionError } = await supabase
        .from('edu_pro_quiz_question')
        .select('id, topic_id, section')
        .in('id', questionIds);

      if (questionError) {
        console.error('QuizPage: Question data error:', questionError);
        throw new Error(`Failed to fetch question data: ${questionError.message}`);
      }

      const questionMap = new Map<number, { topic_id: number; section: string }>();
      questionData.forEach((q: any) => {
        questionMap.set(q.id, { topic_id: q.topic_id, section: q.section });
      });

      const choiceIds = Object.values(userAnswers).flat();
      console.log('QuizPage: Fetching choice data:', choiceIds);
      const { data: choiceData, error: choiceError } = await supabase
        .from('edu_pro_quiz_choice')
        .select('id, is_correct')
        .in('id', choiceIds);

      if (choiceError) {
        console.error('QuizPage: Choice data error:', choiceError);
        throw new Error(`Failed to fetch choice data: ${choiceError.message}`);
      }

      const choiceMap = new Map<number, boolean>();
      choiceData.forEach((c: any) => {
        choiceMap.set(c.id, c.is_correct);
      });

      const answersToSave = Object.entries(userAnswers).flatMap(([questionId, choiceIds]) =>
        choiceIds.map(choiceId => ({
          user_id: stableSession.user.id,
          question_id: Number(questionId),
          choice_id: choiceId,
          exam_mode: examMode,
          quiz_statistic_id: quizStatisticId,
          is_correct: choiceMap.get(choiceId) || false,
          topic_id: questionMap.get(Number(questionId))?.topic_id,
          section: questionMap.get(Number(questionId))?.section,
          lesson_id: lessonId,
        }))
      );

      console.log('QuizPage: Saving answers:', { count: answersToSave.length, sample: answersToSave[0] });
      const { error: saveError } = await supabase.from('quiz_useranswer').insert(answersToSave);
      if (saveError) {
        console.error('QuizPage: Save answers error:', saveError);
        throw new Error(`Failed to save answers: ${saveError.message}`);
      }
      console.log('QuizPage: Answers saved:', { count: answersToSave.length });

      console.log('QuizPage: Fetching saved answers:', { quizStatisticId });
      const { data: savedAnswers, error: fetchSavedError } = await supabase
        .from('quiz_useranswer')
        .select('question_id, is_correct, lesson_id')
        .eq('quiz_statistic_id', quizStatisticId)
        .eq('user_id', stableSession.user.id);

      if (fetchSavedError) {
        console.error('QuizPage: Fetch saved answers error:', fetchSavedError);
        throw new Error(`Failed to fetch saved answers: ${fetchSavedError.message}`);
      }
      console.log('QuizPage: Fetched saved answers:', {
        count: savedAnswers.length,
        lesson_id: savedAnswers[0]?.lesson_id,
      });

      let questionsAttempted = 0;
      let questionsCorrect = 0;

      if (savedAnswers && savedAnswers.length > 0) {
        const questionIdsAttempted = [...new Set(savedAnswers.map(answer => answer.question_id))];
        questionsAttempted = questionIdsAttempted.length;

        for (const questionId of questionIdsAttempted) {
          const questionAnswers = savedAnswers.filter(answer => answer.question_id === questionId);
          console.log('QuizPage: Fetching choices for question:', questionId);
          const { data: choicesData, error: choicesError } = await supabase
            .from('edu_pro_quiz_choice')
            .select('id, is_correct')
            .eq('question_id', questionId);

          if (choicesError) {
            console.error('QuizPage: Choices error:', choicesError);
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

      console.log('QuizPage: Updating quiz statistic:', { questionsAttempted, questionsCorrect });
      const percentCorrect = questionsAttempted > 0 ? (questionsCorrect / questionsAttempted) * 100 : 0;
      const { error: updateStatisticError } = await supabase
        .from('quiz_quizstatistic')
        .update({
          questions_attempted: questionsAttempted,
          questions_correct: questionsCorrect,
          percent_correct: percentCorrect,
        })
        .eq('id', quizStatisticId);

      if (updateStatisticError) {
        console.error('QuizPage: Update statistic error:', updateStatisticError);
        throw new Error(`Failed to update quiz statistic: ${updateStatisticError.message}`);
      }

      const params = new URLSearchParams({
        topics: topicIds.join(','),
        ...(section && { section }),
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
    } finally {
      setIsLoading(false);
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
  const correctAnswer = currentQuestion.choices.find(choice => choice.is_correct)?.choice_text || '';

  return (
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
            timeRemaining={timeRemainingRef.current}
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
  );
}