// src/app/account/edupro/[slug]/study-plan/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '@/context/AuthContext';
import { useStudentStatus } from '@/lib/StudentContext';
import AccountTabEduProCourse from '@/components/edupro/AccountTabEduProCourse';
import Toast from '@/components/Toast';
import Link from 'next/link';
import Image from 'next/image';
import { HiCog, HiX, HiCalendar } from 'react-icons/hi';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface EduProCourse {
  id: number;
  slug: string;
  title: string;
  image: string | null;
}

interface Topic {
  id: number;
  slug: string;
  title: string;
  order: number;
}

interface Lesson {
  id: number;
  topic_id: number;
  title: string;
  order: number;
}

interface LessonProgress {
  lesson: Lesson;
  completed: boolean;
  completion_date: string | null;
  planned_completion_date: string;
}

interface TopicProgress {
  topic: Topic;
  quiz_topic_id: number;
  lessons_progress: LessonProgress[];
  completed_lessons_count: number;
  progress_percentage: number;
  quiz_topic_stats: {
    correct_answers: number;
    total_questions: number;
    percent_correct: number;
  } | null;
}

interface CourseProgress {
  course: EduProCourse;
  quiz: { id: number; slug: string };
  quiz_quizstatistic: { questions_correct: number; questions_attempted: number; percent_correct: number } | null;
  total_topics: number;
  completed_topics: number;
  completed_topics_percentage: number;
  topics_progress: TopicProgress[];
}

interface Purchase {
  id: string;
  profiles_id: string;
  is_active: boolean;
  start_date: string;
  end_date: string | null;
  purchased_item_id: string;
  pricingplan: {
    product_id: string;
    product: {
      course_connected_id: number;
    };
  };
}

interface StudyPlanPreference {
  id: number | null;
  style: 'intensive' | 'flexible' | 'linear';
}

export default function EduProCourseStudyPlan() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [courseProgress, setCourseProgress] = useState<CourseProgress | null>(null);
  const [preference, setPreference] = useState<StudyPlanPreference>({ id: null, style: 'linear' });
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isEditingDates, setIsEditingDates] = useState(false);
  const [editedDates, setEditedDates] = useState<{ [key: number]: string }>({});
  const [studyPlanPeriod, setStudyPlanPeriod] = useState<string>('');
  const [newStartDate, setNewStartDate] = useState<string>('');
  const [newEndDate, setNewEndDate] = useState<string>('');
  const [purchaseLimits, setPurchaseLimits] = useState<{ start: Date; end: Date | null } | null>(null);
  const router = useRouter();
  const { slug } = useParams();
  const { session } = useAuth();
  const { isStudent, isLoading: studentLoading } = useStudentStatus();

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: '2-digit',
    }).replace(/ /g, ' ').replace(',', '');
  };

  const isPurchaseActive = (purchase: Purchase) => {
    if (!purchase.is_active) return false;
    const currentDate = new Date();
    const startDate = new Date(purchase.start_date);
    const endDate = purchase.end_date ? new Date(purchase.end_date) : null;
    return currentDate >= startDate && (!endDate || currentDate <= endDate);
  };

  const fetchStudyPlanData = async (
    courseId: number,
    userId: string,
    purchase: Purchase,
    courseTitle: string,
    courseImage: string | null,
    customStartDate?: Date,
    customEndDate?: Date
  ) => {
    try {
      const { data: quizData, error: quizError } = await supabase
        .from('quiz_quizcommon')
        .select('id, slug')
        .eq('course_id', courseId)
        .single();

      if (quizError) throw new Error(`Error fetching quiz: ${quizError.message}`);
      if (!quizData) throw new Error('No quiz found for this course.');

      const { data: quizStatisticData, error: quizStatisticError } = await supabase
        .from('quiz_quizstatistic')
        .select('questions_correct, questions_attempted')
        .eq('user_id', userId)
        .eq('quiz_id', quizData.id)
        .eq('exam_mode', true);

      if (quizStatisticError) {
        throw new Error(`Error fetching quiz statistics: ${quizStatisticError.message}`);
      }

      let totalCorrect = 0;
      let totalAttempted = 0;
      if (quizStatisticData && quizStatisticData.length > 0) {
        totalCorrect = quizStatisticData.reduce((sum, stat) => sum + stat.questions_correct, 0);
        totalAttempted = quizStatisticData.reduce((sum, stat) => sum + stat.questions_attempted, 0);
      }

      const percentCorrect = totalAttempted > 0 ? (totalCorrect / totalAttempted) * 100 : 0;

      const quizStatisticSummary = quizStatisticData?.length > 0
        ? {
            questions_correct: totalCorrect,
            questions_attempted: totalAttempted,
            percent_correct: percentCorrect,
          }
        : null;

      const { data: courseTopicData, error: courseTopicError } = await supabase
        .from('edu_pro_coursetopic')
        .select('topic_id')
        .eq('course_id', courseId);

      if (courseTopicError) throw new Error(`Error fetching course-topic relations: ${courseTopicError.message}`);
      if (!courseTopicData || courseTopicData.length === 0) {
        setCourseProgress({
          course: { id: courseId, slug: slug as string, title: courseTitle, image: courseImage },
          quiz: quizData,
          quiz_quizstatistic: quizStatisticSummary,
          total_topics: 0,
          completed_topics: 0,
          completed_topics_percentage: 0,
          topics_progress: [],
        });
        return;
      }

      const topicIds = courseTopicData.map((ct) => ct.topic_id);

      const { data: topicsData, error: topicsError } = await supabase
        .from('edu_pro_topic')
        .select('id, slug, title, order')
        .in('id', topicIds)
        .order('order', { ascending: true });

      if (topicsError) throw new Error(`Error fetching topics: ${topicsError.message}`);

      const { data: lessonsData, error: lessonsError } = await supabase
        .from('edu_pro_lesson')
        .select('id, topic_id, title, order')
        .in('topic_id', topicIds)
        .order('order', { ascending: true });

      if (lessonsError) throw new Error(`Error fetching lessons: ${lessonsError.message}`);

      const { data: lessonsProgressData, error: lessonsProgressError } = await supabase
        .from('edu_pro_lessonprogress')
        .select(`
          lesson_id,
          completed,
          completion_date,
          planned_completion_date
        `)
        .eq('user_id', userId);

      if (lessonsProgressError) throw new Error(`Error fetching lesson progress: ${lessonsProgressError.message}`);

      const { data: quizTopicStatsData, error: quizTopicStatsError } = await supabase
        .from('quiz_quizstatistic_topics')
        .select('quiz_topic_id, correct_answers, total_questions, percent_correct')
        .eq('user_id', userId);

      if (quizTopicStatsError) throw new Error(`Error fetching quiz topic stats: ${quizTopicStatsError.message}`);

      const { data: preferenceData, error: preferenceError } = await supabase
        .from('edu_pro_study_plan_preferences')
        .select('id, style')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .single();

      if (preferenceError && preferenceError.code !== 'PGRST116') {
        throw new Error(`Error fetching preferences: ${preferenceError.message}`);
      }

      const currentPreference = preferenceData || { id: null, style: 'linear' };
      setPreference(currentPreference);

      const purchaseStart = new Date(purchase.start_date);
      const purchaseEnd = purchase.end_date ? new Date(purchase.end_date) : null;
      setPurchaseLimits({ start: purchaseStart, end: purchaseEnd });

      const startDate = customStartDate || purchaseStart;
      let endDate: Date;
      if (customEndDate) {
        endDate = customEndDate;
      } else if (purchase.end_date) {
        endDate = new Date(purchase.end_date);
      } else {
        endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 6);
      }

      setNewStartDate(startDate.toISOString().split('T')[0]);
      setNewEndDate(endDate.toISOString().split('T')[0]);

      const formattedPeriod = `${formatDate(startDate)} - ${formatDate(endDate)}`;
      setStudyPlanPeriod(formattedPeriod);

      const totalDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);

      let effectiveTotalDays = totalDays;
      if (currentPreference.style === 'intensive') {
        effectiveTotalDays = totalDays * 0.5;
      }

      const allLessonsProgress = lessonsData.map((lesson) => {
        const progress = lessonsProgressData.find((lp: any) => lp.lesson_id === lesson.id) || {
          completed: false,
          completion_date: null,
          planned_completion_date: null,
        };
        return {
          lesson,
          completed: progress.completed,
          completion_date: progress.completion_date,
          planned_completion_date: progress.planned_completion_date,
        };
      }).sort((a, b) => {
        const topicA = topicsData.find((t) => t.id === a.lesson.topic_id);
        const topicB = topicsData.find((t) => t.id === b.lesson.topic_id);
        return (topicA?.order || 0) - (topicB?.order || 0) || a.lesson.order - b.lesson.order;
      });

      const lessonsCount = allLessonsProgress.length;
      const daysPerLesson = lessonsCount > 0 ? effectiveTotalDays / lessonsCount : 0;

      const updatedLessonsProgress = allLessonsProgress.map((lp, index) => {
        if (lp.planned_completion_date && currentPreference.style === 'flexible') {
          return lp;
        }
        const plannedDate = new Date(startDate);
        plannedDate.setDate(plannedDate.getDate() + index * daysPerLesson);
        return {
          ...lp,
          planned_completion_date: plannedDate.toISOString().split('T')[0],
        };
      });

      const topicsProgress: TopicProgress[] = topicsData.map((topic) => {
        const topicLessonsProgress = updatedLessonsProgress.filter((lp) => lp.lesson.topic_id === topic.id);
        const completedLessonsCount = topicLessonsProgress.filter((lp) => lp.completed).length;
        const progressPercentage = topicLessonsProgress.length
          ? (completedLessonsCount / topicLessonsProgress.length) * 100
          : 0;

        const quizTopicStats = quizTopicStatsData.find((qts) => qts.quiz_topic_id === topic.id) || null;

        return {
          topic,
          quiz_topic_id: topic.id,
          lessons_progress: topicLessonsProgress,
          completed_lessons_count: completedLessonsCount,
          progress_percentage: progressPercentage,
          quiz_topic_stats: quizTopicStats,
        };
      });

      const totalTopics = topicsData.length;
      const completedTopics = topicsProgress.filter((tp) => tp.progress_percentage === 100).length;
      const completedTopicsPercentage = totalTopics ? (completedTopics / totalTopics) * 100 : 0;

      setCourseProgress({
        course: { id: courseId, slug: slug as string, title: courseTitle, image: courseImage },
        quiz: quizData,
        quiz_quizstatistic: quizStatisticSummary,
        total_topics: totalTopics,
        completed_topics: completedTopics,
        completed_topics_percentage: completedTopicsPercentage,
        topics_progress: topicsProgress,
      });
    } catch (err) {
      throw new Error((err as Error).message);
    }
  };

  const handlePreferenceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id || !courseProgress?.course.id) return;

    try {
      const { data: existingPreference, error: fetchError } = await supabase
        .from('edu_pro_study_plan_preferences')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('course_id', courseProgress.course.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw new Error(`Error fetching existing preference: ${fetchError.message}`);
      }

      if (existingPreference) {
        const { error: updateError } = await supabase
          .from('edu_pro_study_plan_preferences')
          .update({ style: preference.style })
          .eq('id', existingPreference.id);

        if (updateError) throw new Error(`Error updating preference: ${updateError.message}`);
      } else {
        const { error: insertError } = await supabase
          .from('edu_pro_study_plan_preferences')
          .insert({
            user_id: session.user.id,
            course_id: courseProgress.course.id,
            style: preference.style,
          });

        if (insertError) throw new Error(`Error inserting preference: ${insertError.message}`);
      }

      setToast({ message: 'Preference saved successfully.', type: 'success' });

      const validPurchase = (await supabase
        .from('purchases')
        .select(`
          id,
          profiles_id,
          is_active,
          start_date,
          end_date,
          purchased_item_id,
          pricingplan (
            product_id,
            product (
              course_connected_id
            )
          )
        `)
        .eq('profiles_id', session.user.id)
        .eq('is_active', true)) as { data: Purchase[] | null; error: any };

      if (validPurchase.data && validPurchase.data.length > 0) {
        const purchase = validPurchase.data.find((p) => isPurchaseActive(p) && p.pricingplan?.product?.course_connected_id === courseProgress.course.id);
        if (purchase) {
          await fetchStudyPlanData(
            courseProgress.course.id,
            session.user.id,
            purchase,
            courseProgress.course.title,
            courseProgress.course.image,
            new Date(newStartDate),
            new Date(newEndDate)
          );
        }
      }
    } catch (err) {
      setToast({ message: (err as Error).message, type: 'error' });
    }
  };

  const handlePeriodSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id || !courseProgress?.course.id) return;

    try {
      const start = new Date(newStartDate);
      const end = new Date(newEndDate);

      if (purchaseLimits) {
        if (start < purchaseLimits.start) {
          throw new Error('Start date cannot be before the purchase start date.');
        }
        if (purchaseLimits.end && end > purchaseLimits.end) {
          throw new Error('End date cannot be after the purchase end date.');
        }
        if (end <= start) {
          throw new Error('End date must be after the start date.');
        }
      }

      setToast({ message: 'Study plan period updated successfully.', type: 'success' });

      const validPurchase = (await supabase
        .from('purchases')
        .select(`
          id,
          profiles_id,
          is_active,
          start_date,
          end_date,
          purchased_item_id,
          pricingplan (
            product_id,
            product (
              course_connected_id
            )
          )
        `)
        .eq('profiles_id', session.user.id)
        .eq('is_active', true)) as { data: Purchase[] | null; error: any };

      if (validPurchase.data && validPurchase.data.length > 0) {
        const purchase = validPurchase.data.find((p) => isPurchaseActive(p) && p.pricingplan?.product?.course_connected_id === courseProgress.course.id);
        if (purchase) {
          await fetchStudyPlanData(
            courseProgress.course.id,
            session.user.id,
            purchase,
            courseProgress.course.title,
            courseProgress.course.image,
            start,
            end
          );
        }
      }
    } catch (err) {
      setToast({ message: (err as Error).message, type: 'error' });
    }
  };

  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await Promise.all([handlePreferenceSubmit(e), handlePeriodSubmit(e)]);
    setIsSettingsModalOpen(false);
  };

  const handleDateChange = (lessonId: number, date: string) => {
    setEditedDates((prev) => ({
      ...prev,
      [lessonId]: date,
    }));
  };

  const handleSaveDates = async () => {
    if (!session?.user?.id || !courseProgress?.course.id) return;

    try {
      for (const [lessonId, plannedDate] of Object.entries(editedDates)) {
        const lessonIdNum = parseInt(lessonId);
        const { data: existingRecord, error: fetchError } = await supabase
          .from('edu_pro_lessonprogress')
          .select('id, completed, completion_date')
          .eq('user_id', session.user.id)
          .eq('lesson_id', lessonIdNum)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
          throw new Error(`Error checking existing lesson progress: ${fetchError.message}`);
        }

        if (existingRecord) {
          const { error: updateError } = await supabase
            .from('edu_pro_lessonprogress')
            .update({
              planned_completion_date: plannedDate,
              completed: existingRecord.completed,
              completion_date: existingRecord.completion_date,
            })
            .eq('id', existingRecord.id);

          if (updateError) throw new Error(`Error updating lesson progress: ${updateError.message}`);
        } else {
          const { error: insertError } = await supabase
            .from('edu_pro_lessonprogress')
            .insert({
              user_id: session.user.id,
              lesson_id: lessonIdNum,
              planned_completion_date: plannedDate,
              completed: false,
              completion_date: null,
            });

          if (insertError) throw new Error(`Error inserting lesson progress: ${insertError.message}`);
        }
      }

      setToast({ message: 'Lesson dates updated successfully.', type: 'success' });
      setIsEditingDates(false);
      setEditedDates({});

      const validPurchase = (await supabase
        .from('purchases')
        .select(`
          id,
          profiles_id,
          is_active,
          start_date,
          end_date,
          purchased_item_id,
          pricingplan (
            product_id,
            product (
              course_connected_id
            )
          )
        `)
        .eq('profiles_id', session.user.id)
        .eq('is_active', true)) as { data: Purchase[] | null; error: any };

      if (validPurchase.data && validPurchase.data.length > 0) {
        const purchase = validPurchase.data.find((p) => isPurchaseActive(p) && p.pricingplan?.product?.course_connected_id === courseProgress.course.id);
        if (purchase) {
          await fetchStudyPlanData(
            courseProgress.course.id,
            session.user.id,
            purchase,
            courseProgress.course.title,
            courseProgress.course.image,
            new Date(newStartDate),
            new Date(newEndDate)
          );
        }
      }
    } catch (err) {
      setToast({ message: (err as Error).message, type: 'error' });
    }
  };

  useEffect(() => {
    const verifyAccess = async () => {
      if (studentLoading) return;

      setIsLoading(true);
      try {
        if (!session) {
          setToast({ message: 'You must be logged in to access this page.', type: 'error' });
          router.push('/login');
          return;
        }

        if (!isStudent) {
          setToast({ message: 'Access denied: You are not enrolled as a student.', type: 'error' });
          router.push('/account');
          return;
        }

        const { data: courseData, error: courseError } = await supabase
          .from('edu_pro_course')
          .select('id, slug, title, image')
          .eq('slug', slug)
          .single();

        if (courseError) throw new Error(`Error fetching course: ${courseError.message}`);
        if (!courseData) throw new Error('Course not found.');

        const { data: activePurchases, error: purchaseError } = await supabase
          .from('purchases')
          .select(`
            id,
            profiles_id,
            is_active,
            start_date,
            end_date,
            purchased_item_id,
            pricingplan (
              product_id,
              product (
                course_connected_id
              )
            )
          `)
          .eq('profiles_id', session.user.id)
          .eq('is_active', true) as { data: Purchase[] | null; error: any };

        if (purchaseError) throw new Error(`Error fetching purchases: ${purchaseError.message}`);
        if (!activePurchases || activePurchases.length === 0) throw new Error('No active purchases found.');

        const validPurchase = activePurchases.find((purchase) => {
          const isActive = isPurchaseActive(purchase);
          const courseId = purchase.pricingplan?.product?.course_connected_id;
          return isActive && courseId === courseData.id;
        });

        if (!validPurchase) {
          setToast({ message: 'You do not have access to this course.', type: 'error' });
          router.push('/account/edupro');
          return;
        }

        await fetchStudyPlanData(
          courseData.id,
          session.user.id,
          validPurchase,
          courseData.title,
          courseData.image
        );
      } catch (err) {
        console.error('EduProCourseStudyPlan: Error:', err);
        setError((err as Error).message);
        setToast({ message: (err as Error).message, type: 'error' });
        router.push('/account/edupro');
      } finally {
        setIsLoading(false);
      }
    };

    verifyAccess();
  }, [slug, session, isStudent, studentLoading, router]);

  if (isLoading || studentLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
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
      <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-red-600 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
            aria-live="polite"
          />
        )}
        <div className="pt-8">
          <AccountTabEduProCourse />
        </div>
        {courseProgress && (
          <div className="">
            <div className="p-2 sm:p-6 sm:py-4">
              <div className="mb-4 flex justify-between items-start">
                {/* Study Plan Period with Icon */}
                <div className="flex justify-start space-x-2 items-center">
                  <button
                    onClick={() => setIsSettingsModalOpen(true)}
                    className="text-left flex items-center text-xs text-sky-500 font-light hover:underline"
                    title="Edit Study Plan Period"
                  >
                    {studyPlanPeriod}
                    <HiCog className="w-6 h-6 ml-1" />
                  </button>
                </div>
                {/* Restore Dates and Save Dates Buttons */}
                <div className="flex justify-end space-x-2 items-center">
                  {preference.style === 'flexible' && (
                    <>
                      <button
                        onClick={() => setIsEditingDates(!isEditingDates)}
                        className="text-xs text-sky-500 font-light hover:underline"
                        title={isEditingDates ? 'Cancel Editing Dates' : 'Edit Lesson Dates'}
                      >
                        {isEditingDates ? 'Cancel' : 'Dates'}
                      </button>
                      {isEditingDates && (
                        <button
                          onClick={handleSaveDates}
                          className="text-xs text-sky-500 font-light hover:underline"
                          title="Save Lesson Dates"
                        >
                          Save Dates
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Progress Bars */}
              <div className="mt-2">
                <div className="mt-2">
                  <div className="w-full bg-gray-100 h-8">
                    <div
                      className="flex bg-teal-500 h-8 items-center justify-between text-xs px-4 text-white font-semibold"
                      style={{
                        width: `${courseProgress.quiz_quizstatistic?.percent_correct || 0}%`,
                        minWidth: '50%',
                      }}
                    >
                      <span>
                        {courseProgress.quiz_quizstatistic?.questions_correct || 0} /{' '}
                        {courseProgress.quiz_quizstatistic?.questions_attempted || 0}
                      </span>
                      <span className="hidden sm:block text-gray-300">
                        {courseProgress.quiz_quizstatistic?.percent_correct?.toFixed(2) || 0}%
                      </span>
                      <span>Practice</span>
                      <Link
                        href={`/account/edupro/${courseProgress.course.slug}/quiz/${courseProgress.quiz.slug}`}
                        className="rounded-full font-bold px-1 py-0.5 border border-white hover:bg-white hover:text-gray-500"
                      >
                        →
                      </Link>
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="w-full bg-gray-100 h-8">
                    <div
                      className={`flex h-8 items-center justify-between text-xs px-4 text-white font-semibold ${
                        courseProgress.completed_topics_percentage >= 50 ? 'bg-sky-500' : 'bg-sky-300'
                      }`}
                      style={{
                        width: `${courseProgress.completed_topics_percentage}%`,
                        minWidth: '50%',
                      }}
                    >
                      <span>
                        {courseProgress.completed_topics} / {courseProgress.total_topics}
                      </span>
                      <span className="px-2 text-gray-300 hidden sm:block">
                        {courseProgress.completed_topics_percentage.toFixed(2)}%
                      </span>
                      <span>Topics</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Topics and Lessons */}
              {courseProgress.topics_progress.map((topicProg) => (
                <div key={topicProg.topic.id} className="mt-8">
                  <div className="text-base font-semibold text-gray-900">
                    <div className="grid grid-cols-7 sm:grid-cols-12 items-center">
                      <div
                        className={`ml-2 mr-auto flex items-center justify-center h-8 w-8 text-white text-sm font-semibold rounded-full ${
                          topicProg.progress_percentage === 100 ? 'bg-sky-500' : 'bg-gray-300'
                        }`}
                      >
                        {topicProg.topic.order}
                      </div>
                      <Link
                        className="col-span-6 sm:col-span-11"
                        href={`/account/edupro/${courseProgress.course.slug}/topic/${topicProg.topic.slug}`}
                      >
                        <h4 className="font-semibold text-base sm:text-lg text-gray-900 hover:text-sky-500">
                          {topicProg.topic.title}
                        </h4>
                      </Link>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                            #
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                            Lesson
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                            Actual Completion Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                            Study Plan Date
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {topicProg.lessons_progress.map((lessonProg, index) => (
                          <tr
                            key={lessonProg.lesson.id}
                            className={index % 2 === 0 ? 'bg-gray-50' : 'bg-gray-100'}
                          >
                            <td
                              className={`px-6 py-4 whitespace-nowrap text-sm ${
                                lessonProg.completed ? 'text-sky-500' : 'text-gray-500'
                              }`}
                            >
                              {lessonProg.lesson.order}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-base font-semibold">
                              <Link
                                href={`/account/edupro/${courseProgress.course.slug}/topic/${topicProg.topic.slug}/lesson/${lessonProg.lesson.id}`}
                                className={`rounded-3xl px-5 py-2 hover:bg-gray-200 hover:text-gray-500 ${
                                  lessonProg.completed
                                    ? 'bg-sky-500 text-white'
                                    : lessonProg.lesson.title.includes('Practice')
                                    ? 'bg-yellow-200 text-gray-700'
                                    : 'bg-gray-700 text-white'
                                }`}
                              >
                                {lessonProg.lesson.title}
                              </Link>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                              {lessonProg.completed ? (
                                <span className="text-sky-500 text-xl" title="Completed">
                                  ✓
                                </span>
                              ) : (
                                <span className="text-gray-400 text-xl" title="Not Completed">
                                  ✗
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {lessonProg.completion_date
                                ? formatDate(new Date(lessonProg.completion_date))
                                : ''}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <div className="flex justify-between gap-4">
                                {isEditingDates && preference.style === 'flexible' ? (
                                  <input
                                    type="date"
                                    value={
                                      editedDates[lessonProg.lesson.id] ||
                                      lessonProg.planned_completion_date
                                    }
                                    onChange={(e) =>
                                      handleDateChange(lessonProg.lesson.id, e.target.value)
                                    }
                                    className="border rounded px-2 py-1 text-sm"
                                  />
                                ) : (
                                  <>
                                    <span>
                                      {formatDate(new Date(lessonProg.planned_completion_date))}
                                    </span>
                                    <span>
                                      {new Date(
                                        lessonProg.planned_completion_date
                                      ).toLocaleString('en-US', {
                                        weekday: 'long',
                                      })}
                                    </span>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="w-full bg-gray-100 h-8 mt-2">
                      <div
                        className={`flex h-8 items-center justify-start text-xs px-4 text-white font-semibold ${
                          topicProg.progress_percentage >= 50 ? 'bg-sky-500' : 'bg-sky-300'
                        }`}
                        style={{ width: `${topicProg.progress_percentage}%`, minWidth: '35%' }}
                      >
                        <span>
                          {topicProg.completed_lessons_count} / {topicProg.lessons_progress.length}
                        </span>
                        <span className="px-2 text-gray-300 hidden sm:block">
                          {topicProg.progress_percentage.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                    {topicProg.quiz_topic_stats && (
                      <div className="mt-6">
                        <div className="text-base font-semibold text-gray-900">
                          <Link
                            href={`/account/edupro/${courseProgress.course.slug}/quiz/${courseProgress.quiz.slug}?topics=${topicProg.quiz_topic_id}&num_questions=10&exam_mode=1`}
                            className="text-sky-500 hover:underline text-xs sm:text-sm font-light pr-4"
                          >
                            Practice for {topicProg.topic.title}
                          </Link>
                        </div>
                        <div className="mt-2">
                          <div className="w-full bg-gray-100 h-8">
                            <div
                              className="flex bg-teal-500 h-8 items-center justify-between text-xs px-4 text-white font-semibold"
                              style={{
                                width: `${topicProg.quiz_topic_stats.percent_correct}%`,
                                minWidth: '22%',
                              }}
                            >
                              <span>
                                {topicProg.quiz_topic_stats.correct_answers} /{' '}
                                {topicProg.quiz_topic_stats.total_questions}
                              </span>
                              <span className="px-2 text-gray-300 hidden sm:block">
                                {topicProg.quiz_topic_stats.percent_correct.toFixed(2)}%
                              </span>
                              <Link
                                href={`/account/edupro/${courseProgress.course.slug}/quiz/${courseProgress.quiz.slug}?topics=${topicProg.quiz_topic_id}&num_questions=10&exam_mode=1`}
                                className="rounded-full font-bold px-1 py-0.5 border border-white hover:bg-white hover:text-gray-500"
                              >
                                →
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Combined Settings Modal */}
            {isSettingsModalOpen && (
              <div className="fixed inset-0 z-50">
                <div
                  className="fixed inset-0 bg-transparent transition-opacity duration-300"
                  onClick={() => setIsSettingsModalOpen(false)}
                />
                <div className="fixed inset-y-0 right-0 w-80 sm:w-96 bg-gradient-to-br from-white to-gray-50 shadow-2xl sm:rounded-l-2xl overflow-auto transform transition-transform duration-300 translate-x-0">
                  <div className="relative p-6 sm:p-8">
                    <button
                      onClick={() => setIsSettingsModalOpen(false)}
                      className="absolute top-4 left-4 text-gray-600 hover:text-gray-800 transition-colors duration-200"
                      aria-label="Close settings modal"
                    >
                      <HiX className="w-6 h-6" />
                    </button>
                    <h2 className="text-lg font-bold text-gray-800 mb-6 text-center">
                      Settings
                    </h2>
                    <form onSubmit={handleSettingsSubmit} className="space-y-16">
                      {/* Study Plan Preferences Section */}
                      <div>
                        <h3 className="text-base font-semibold text-gray-700 mb-4">
                          Learning Style
                        </h3>
                        <div className="flex flex-wrap gap-4">
                          {['intensive', 'flexible', 'linear'].map((style) => (
                            <label
                              key={style}
                              className="flex items-center space-x-2 cursor-pointer"
                            >
                              <input
                                type="radio"
                                name="style"
                                value={style}
                                checked={preference.style === style}
                                onChange={(e) =>
                                  setPreference({ ...preference, style: e.target.value as any })
                                }
                                className="w-5 h-5 text-sky-600 border-gray-300 focus:ring-sky-500 transition-colors duration-200"
                              />
                              <span className="text-sm font-medium text-gray-700 capitalize hover:text-sky-600 transition-colors duration-200">
                                {style}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Study Plan Period Section */}
                      <div>
                        <h3 className="text-base font-semibold text-gray-700 mb-4">
                          Period
                        </h3>
                        <div className="space-y-4">
                          <div>
                            <label
                              htmlFor="start-date"
                              className="block text-sm font-medium text-gray-600 mb-1"
                            >
                              Start Date
                            </label>
                            <input
                              type="date"
                              id="start-date"
                              value={newStartDate}
                              onChange={(e) => setNewStartDate(e.target.value)}
                              min={purchaseLimits?.start.toISOString().split('T')[0]}
                              max={
                                purchaseLimits?.end
                                  ? purchaseLimits.end.toISOString().split('T')[0]
                                  : undefined
                              }
                              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition-all duration-200 bg-white hover:bg-gray-50"
                            />
                          </div>
                          <div>
                            <label
                              htmlFor="end-date"
                              className="block text-sm font-medium text-gray-600 mb-1"
                            >
                              End Date
                            </label>
                            <input
                              type="date"
                              id="end-date"
                              value={newEndDate}
                              onChange={(e) => setNewEndDate(e.target.value)}
                              min={new Date(newStartDate).toISOString().split('T')[0]}
                              max={
                                purchaseLimits?.end
                                  ? purchaseLimits.end.toISOString().split('T')[0]
                                  : undefined
                              }
                              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition-all duration-200 bg-white hover:bg-gray-50"
                            />
                          </div>
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-sky-600 text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 transition-all duration-200"
                      >
                        Save
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}