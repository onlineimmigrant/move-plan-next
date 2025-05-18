// src/app/account/edupro/[slug]/study-plan/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '@/context/AuthContext';
import { useStudentStatus } from '@/lib/StudentContext';
import AccountTabEduProCourse from '@/components/AccountTabEduProCourse';
import StudyPlanHeader from '@/components/study-plan/StudyPlanHeader';
import ProgressBars from '@/components/study-plan/ProgressBars';
import TopicSection from '@/components/study-plan/TopicSection';
import ToastWrapper from '@/components/study-plan/ToastWrapper';
import { CourseProgress, Purchase, StudyPlanPreference, TopicProgress, LessonProgress } from '@/components/study-plan/types';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function EduProCourseStudyPlan() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [courseProgress, setCourseProgress] = useState<CourseProgress | null>(null);
  const [preference, setPreference] = useState<StudyPlanPreference>({ id: null, style: 'linear', start_date: null, end_date: null });
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

  const isPurchaseActive = useCallback((purchase: Purchase) => {
    if (!purchase.is_active) return false;
    const currentDate = new Date();
    const startDate = new Date(purchase.start_date);
    const endDate = purchase.end_date ? new Date(purchase.end_date) : null;
    return currentDate >= startDate && (!endDate || currentDate <= endDate);
  }, []);

  const fetchPurchase = useCallback(async (courseId: number) => {
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
      .eq('profiles_id', session?.user.id)
      .eq('is_active', true) as { data: Purchase[] | null; error: any };

    if (purchaseError) throw new Error(`Error fetching purchases: ${purchaseError.message}`);
    if (!activePurchases || activePurchases.length === 0) throw new Error('No active purchases found.');

    const validPurchase = activePurchases.find((purchase) => {
      const isActive = isPurchaseActive(purchase);
      const purchaseCourseId = purchase.pricingplan?.product?.course_connected_id;
      return isActive && purchaseCourseId === courseId;
    });

    if (!validPurchase) throw new Error('You do not have access to this course.');
    return validPurchase;
  }, [session, isPurchaseActive]);

  const fetchStudyPlanData = useCallback(async (
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
        .select('id, style, start_date, end_date') // Include new fields
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .single();

      if (preferenceError && preferenceError.code !== 'PGRST116') {
        throw new Error(`Error fetching preferences: ${preferenceError.message}`);
      }

      const currentPreference = preferenceData || { id: null, style: 'linear', start_date: null, end_date: null };
      setPreference(currentPreference);

      const purchaseStart = new Date(purchase.start_date);
      const purchaseEnd = purchase.end_date ? new Date(purchase.end_date) : null;
      setPurchaseLimits({ start: purchaseStart, end: purchaseEnd });

      // Use preference dates if available, otherwise fall back to purchase dates or defaults
      let startDate: Date;
      let endDate: Date;

      if (customStartDate && customEndDate) {
        // If custom dates are provided (e.g., after saving new dates), use them
        startDate = customStartDate;
        endDate = customEndDate;
      } else if (currentPreference.start_date && currentPreference.end_date) {
        // If preference dates exist, use them
        startDate = new Date(currentPreference.start_date);
        endDate = new Date(currentPreference.end_date);
      } else {
        // Fallback to purchase dates or default (6 months)
        startDate = purchaseStart;
        endDate = purchase.end_date ? new Date(purchase.end_date) : new Date(startDate);
        if (!purchase.end_date) {
          endDate.setMonth(endDate.getMonth() + 6);
        }
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

      const allLessonsProgress: LessonProgress[] = lessonsData.map((lesson: any) => {
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
      }).sort((a: LessonProgress, b: LessonProgress) => {
        const topicA = topicsData.find((t: any) => t.id === a.lesson.topic_id);
        const topicB = topicsData.find((t: any) => t.id === b.lesson.topic_id);
        return (topicA?.order || 0) - (topicB?.order || 0) || a.lesson.order - b.lesson.order;
      });

      const lessonsCount = allLessonsProgress.length;
      const daysPerLesson = lessonsCount > 0 ? effectiveTotalDays / lessonsCount : 0;

      const updatedLessonsProgress = allLessonsProgress.map((lp: LessonProgress, index: number) => {
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

      const topicsProgress: TopicProgress[] = topicsData.map((topic: any) => {
        const topicLessonsProgress = updatedLessonsProgress.filter((lp: LessonProgress) => lp.lesson.topic_id === topic.id);
        const completedLessonsCount = topicLessonsProgress.filter((lp: LessonProgress) => lp.completed).length;
        const progressPercentage = topicLessonsProgress.length
          ? (completedLessonsCount / topicLessonsProgress.length) * 100
          : 0;

        const quizTopicStats = quizTopicStatsData.find((qts: any) => qts.quiz_topic_id === topic.id) || null;

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
      const completedTopics = topicsProgress.filter((tp: TopicProgress) => tp.progress_percentage === 100).length;
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
  }, [slug]);

  const handlePreferenceSubmit = useCallback(async (e: React.FormEvent) => {
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

      // Update or insert preferences with style, start_date, and end_date
      const preferencePayload = {
        style: preference.style,
        start_date: newStartDate,
        end_date: newEndDate,
      };

      if (existingPreference) {
        const { error: updateError } = await supabase
          .from('edu_pro_study_plan_preferences')
          .update(preferencePayload)
          .eq('id', existingPreference.id);

        if (updateError) throw new Error(`Error updating preference: ${updateError.message}`);
      } else {
        const { error: insertError } = await supabase
          .from('edu_pro_study_plan_preferences')
          .insert({
            user_id: session.user.id,
            course_id: courseProgress.course.id,
            ...preferencePayload,
          });

        if (insertError) throw new Error(`Error inserting preference: ${insertError.message}`);
      }

      setToast({ message: 'Preference saved successfully.', type: 'success' });

      const validPurchase = await fetchPurchase(courseProgress.course.id);
      await fetchStudyPlanData(
        courseProgress.course.id,
        session.user.id,
        validPurchase,
        courseProgress.course.title,
        courseProgress.course.image,
        new Date(newStartDate),
        new Date(newEndDate)
      );
    } catch (err) {
      setToast({ message: (err as Error).message, type: 'error' });
    }
  }, [session, courseProgress, preference, newStartDate, newEndDate, fetchPurchase, fetchStudyPlanData]);

  const handlePeriodSubmit = useCallback(async (e: React.FormEvent) => {
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

      // Since handlePreferenceSubmit now updates the dates in the preferences table,
      // we don't need to duplicate that logic here. Just refetch the data.
      const validPurchase = await fetchPurchase(courseProgress.course.id);
      await fetchStudyPlanData(
        courseProgress.course.id,
        session.user.id,
        validPurchase,
        courseProgress.course.title,
        courseProgress.course.image,
        start,
        end
      );
    } catch (err) {
      setToast({ message: (err as Error).message, type: 'error' });
    }
  }, [session, courseProgress, newStartDate, newEndDate, purchaseLimits, fetchPurchase, fetchStudyPlanData]);

  const handleSettingsSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    await Promise.all([handlePreferenceSubmit(e), handlePeriodSubmit(e)]);
    setIsSettingsModalOpen(false);
  }, [handlePreferenceSubmit, handlePeriodSubmit]);

  const handleDateChange = useCallback((lessonId: number, date: string) => {
    setEditedDates((prev) => ({
      ...prev,
      [lessonId]: date,
    }));
  }, []);

  const handleSaveDates = useCallback(async () => {
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

      const validPurchase = await fetchPurchase(courseProgress.course.id);
      await fetchStudyPlanData(
        courseProgress.course.id,
        session.user.id,
        validPurchase,
        courseProgress.course.title,
        courseProgress.course.image,
        new Date(newStartDate),
        new Date(newEndDate)
      );
    } catch (err) {
      setToast({ message: (err as Error).message, type: 'error' });
    }
  }, [session, courseProgress, editedDates, newStartDate, newEndDate, fetchPurchase, fetchStudyPlanData]);

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

        const validPurchase = await fetchPurchase(courseData.id);

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
  }, [slug, session, isStudent, studentLoading, router, fetchPurchase, fetchStudyPlanData]);

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
        <ToastWrapper toast={toast} setToast={setToast} />
        <div className="pt-8">
          <AccountTabEduProCourse />
        </div>
        {courseProgress && (
          <div className="">
            <div className="p-2 sm:p-6 sm:py-4">
              <StudyPlanHeader
                studyPlanPeriod={studyPlanPeriod}
                preference={preference}
                isEditingDates={isEditingDates}
                setIsEditingDates={setIsEditingDates}
                setIsSettingsModalOpen={setIsSettingsModalOpen}
                handleSaveDates={handleSaveDates}
                handleSettingsSubmit={handleSettingsSubmit}
                newStartDate={newStartDate}
                setNewStartDate={setNewStartDate}
                newEndDate={newEndDate}
                setNewEndDate={setNewEndDate}
                purchaseLimits={purchaseLimits}
                setPreference={setPreference}
                isSettingsModalOpen={isSettingsModalOpen}
              />
              <ProgressBars courseProgress={courseProgress} />
              {courseProgress.topics_progress.map((topicProg) => (
                <TopicSection
                  key={topicProg.topic.id}
                  topicProg={topicProg}
                  courseSlug={courseProgress.course.slug}
                  quizSlug={courseProgress.quiz.slug}
                  isEditingDates={isEditingDates}
                  preferenceStyle={preference.style}
                  editedDates={editedDates}
                  handleDateChange={handleDateChange}
                  formatDate={formatDate}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}