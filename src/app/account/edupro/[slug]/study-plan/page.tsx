// src/app/account/edupro/[slug]/study-plan/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '@/context/AuthContext';
import { useStudentStatus } from '@/lib/StudentContext';
import AccountTabEduProCourse from '@/components/AccountTabEduProCourse';
import Toast from '@/components/Toast';
import Link from 'next/link';
import Image from 'next/image';

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditingDates, setIsEditingDates] = useState(false); // For flexible style editing
  const [editedDates, setEditedDates] = useState<{ [key: number]: string }>({}); // Track edited dates
  const router = useRouter();
  const { slug } = useParams();
  const { session } = useAuth();
  const { isStudent, isLoading: studentLoading } = useStudentStatus();

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
    courseImage: string | null
  ) => {
    try {
      // Fetch quiz associated with the course
      const { data: quizData, error: quizError } = await supabase
        .from('quiz_quizcommon')
        .select('id, slug')
        .eq('course_id', courseId)
        .single();

      if (quizError) throw new Error(`Error fetching quiz: ${quizError.message}`);
      if (!quizData) throw new Error('No quiz found for this course.');

      // Fetch quiz statistics for exam_mode = true
      const { data: quizStatisticData, error: quizStatisticError } = await supabase
        .from('quiz_quizstatistic')
        .select('questions_correct, questions_attempted')
        .eq('user_id', userId)
        .eq('quiz_id', quizData.id)
        .eq('exam_mode', true);

      if (quizStatisticError) {
        throw new Error(`Error fetching quiz statistics: ${quizStatisticError.message}`);
      }

      // Summarize questions_correct and questions_attempted
      let totalCorrect = 0;
      let totalAttempted = 0;
      if (quizStatisticData && quizStatisticData.length > 0) {
        totalCorrect = quizStatisticData.reduce((sum, stat) => sum + stat.questions_correct, 0);
        totalAttempted = quizStatisticData.reduce((sum, stat) => sum + stat.questions_attempted, 0);
      }

      // Calculate percent_correct
      const percentCorrect = totalAttempted > 0 ? (totalCorrect / totalAttempted) * 100 : 0;

      const quizStatisticSummary = quizStatisticData?.length > 0
        ? {
            questions_correct: totalCorrect,
            questions_attempted: totalAttempted,
            percent_correct: percentCorrect,
          }
        : null;

      // Fetch topic IDs associated with the course via edu_pro_coursetopic
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

      // Fetch topics using the topic IDs
      const { data: topicsData, error: topicsError } = await supabase
        .from('edu_pro_topic')
        .select('id, slug, title, order')
        .in('id', topicIds)
        .order('order', { ascending: true });

      if (topicsError) throw new Error(`Error fetching topics: ${topicsError.message}`);

      // Fetch all lessons for the topics
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('edu_pro_lesson')
        .select('id, topic_id, title, order')
        .in('topic_id', topicIds)
        .order('order', { ascending: true });

      if (lessonsError) throw new Error(`Error fetching lessons: ${lessonsError.message}`);

      // Fetch lesson progress
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

      // Fetch topic quiz stats
      const { data: quizTopicStatsData, error: quizTopicStatsError } = await supabase
        .from('quiz_quizstatistic_topics')
        .select('quiz_topic_id, correct_answers, total_questions, percent_correct')
        .eq('user_id', userId);

      if (quizTopicStatsError) throw new Error(`Error fetching quiz topic stats: ${quizTopicStatsError.message}`);

      // Fetch study plan preferences
      const { data: preferenceData, error: preferenceError } = await supabase
        .from('edu_pro_study_plan_preferences')
        .select('id, style')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .single();

      if (preferenceError && preferenceError.code !== 'PGRST116') {
        throw new Error(`Error fetching preferences: ${preferenceError.message}`);
      }

      // Set study plan preference
      const currentPreference = preferenceData || { id: null, style: 'linear' };
      setPreference(currentPreference);

      // Calculate study period
      // TODO: Temporary logic - Replace current date with dynamic start date logic
      // TODO: Temporary logic - Replace 6-month duration with configurable duration
      const startDate = new Date(); // Current date as start
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 6); // 6-month term
      const totalDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24); // ~182.5 days

      // Adjust study period based on style
      let effectiveTotalDays = totalDays;
      if (currentPreference.style === 'intensive') {
        effectiveTotalDays = totalDays * 0.5; // Use only 50% of the time
      }

      // Create lesson progress entries for all lessons
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

      // Assign planned completion dates based on style
      const updatedLessonsProgress = allLessonsProgress.map((lp, index) => {
        if (lp.planned_completion_date && currentPreference.style === 'flexible') {
          return lp; // Preserve user-edited dates in flexible mode
        }
        const plannedDate = new Date(startDate);
        plannedDate.setDate(plannedDate.getDate() + index * daysPerLesson);
        return {
          ...lp,
          planned_completion_date: plannedDate.toISOString().split('T')[0],
        };
      });

      // Process topics progress
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
      // Check if a preference record already exists
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
        // Update existing record
        const { error: updateError } = await supabase
          .from('edu_pro_study_plan_preferences')
          .update({ style: preference.style })
          .eq('id', existingPreference.id);

        if (updateError) throw new Error(`Error updating preference: ${updateError.message}`);
      } else {
        // Insert new record
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
      setIsModalOpen(false);

      // Refresh the study plan data to apply the new style
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
            courseProgress.course.image
          );
        }
      }
    } catch (err) {
      setToast({ message: (err as Error).message, type: 'error' });
    }
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
        // Check if a record exists for this user_id and lesson_id
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
          // Update existing record
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
          // Insert new record
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

      // Refresh the study plan data
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
            courseProgress.course.image
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
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-red-600 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
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
            <div className="sm:bg-white p-2 sm:p-6 sm:rounded-lg sm:shadow-md">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex space-x-2 items-center">
                    <button
                      onClick={() => setIsModalOpen(true)}
                      className="text-xs text-sky-500 font-light hover:underline"
                      title="Manage Study Plan Preferences"
                    >
                      Manage Preferences
                    </button>
                    {preference.style === 'flexible' && (
                      <>
                        <button
                          onClick={() => setIsEditingDates(!isEditingDates)}
                          className="text-xs text-sky-500 font-light hover:underline"
                          title={isEditingDates ? 'Cancel Editing Dates' : 'Edit Lesson Dates'}
                        >
                          {isEditingDates ? 'Cancel' : 'Edit Dates'}
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
              </div>

              {/* Progress Bars */}
              <div className="mt-8">
                <div className="text-base font-semibold text-gray-900">
                  <Link
                    href={`/account/edupro/${courseProgress.course.slug}/quiz/${courseProgress.quiz.slug}`}
                    className="text-gray-400 hover:underline text-xs sm:text-sm font-light pr-4"
                    title={`Practice for ${courseProgress.course.title}`}
                  >
                    Practice
                  </Link>
                </div>
                <div className="mt-2">
                  <div className="w-full bg-gray-100 h-8">
                    <div
                      className="flex bg-teal-500 h-8 items-center justify-between text-xs px-4 text-white font-semibold"
                      style={{
                        width: `${courseProgress.quiz_quizstatistic?.percent_correct || 0}%`,
                        minWidth: '35%',
                      }}
                    >
                      <span>
                        {courseProgress.quiz_quizstatistic?.questions_correct || 0} /{' '}
                        {courseProgress.quiz_quizstatistic?.questions_attempted || 0}
                      </span>
                      <span className="hidden sm:block text-gray-300">
                        {courseProgress.quiz_quizstatistic?.percent_correct?.toFixed(2) || 0}%
                      </span>
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
                  <span className="text-gray-400 text-xs sm:text-sm font-light pr-4">Topics</span>
                  <div className="w-full bg-gray-100 h-8">
                    <div
                      className={`flex h-8 items-center justify-start text-xs px-4 text-white font-semibold ${
                        courseProgress.completed_topics_percentage >= 50 ? 'bg-sky-500' : 'bg-sky-300'
                      }`}
                      style={{
                        width: `${courseProgress.completed_topics_percentage}%`,
                        minWidth: '17%',
                      }}
                    >
                      <span>
                        {courseProgress.completed_topics} / {courseProgress.total_topics}
                      </span>
                      <span className="px-2 text-gray-300 hidden sm:block">
                        {courseProgress.completed_topics_percentage.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Topics and Lessons */}
              {courseProgress.topics_progress.map((topicProg) => (
                <div key={topicProg.topic.id} className="mt-8">
                  <div className="text-base font-semibold text-gray-900">
                    <Link
                      href={`/account/edupro/${courseProgress.course.slug}/topic/${topicProg.topic.slug}`}
                      className="text-sky-500 hover:underline text-xs sm:text-sm font-light pr-2"
                    >
                      Topic
                    </Link>
                    <div className="grid grid-cols-2 items-center">
                      <Link
                        href={`/account/edupro/${courseProgress.course.slug}/topic/${topicProg.topic.slug}`}
                      >
                        <h4 className="font-semibold text-lg text-gray-900 hover:text-sky-500">
                          {topicProg.topic.title}
                        </h4>
                      </Link>
                      <div
                        className={`ml-auto flex items-center justify-center h-8 w-8 text-white text-sm font-semibold rounded-full ${
                          topicProg.progress_percentage === 100 ? 'bg-sky-500' : 'bg-gray-300'
                        }`}
                      >
                        {topicProg.topic.order}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 overflow-x-auto">
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
                      <tbody className="bg-white divide-y divide-gray-200">
                        {topicProg.lessons_progress.map((lessonProg, index) => (
                          <tr
                            key={lessonProg.lesson.id}
                            className={index % 2 === 0 ? 'bg-gray-50' : 'bg-gray-200'}
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
                                  lessonProg.lesson.title.includes('Practice')
                                    ? 'bg-yellow-200 text-gray-700'
                                    : lessonProg.completed
                                    ? 'bg-sky-500 text-white'
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
                                ? new Date(lessonProg.completion_date).toLocaleDateString()
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
                                      {new Date(lessonProg.planned_completion_date).toLocaleDateString()}
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

            {/* Preferences Modal */}
            {isModalOpen && (
              <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 overflow-auto">
                <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full p-4 sm:p-8 m-2 relative text-xs max-h-[90vh] overflow-auto">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                  >
                    <svg
                      className="h-6 w-6 bg-gray-100 rounded-full p-1"
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
                  <div className="p-4">
                    <h2 className="text-base font-semibold text-gray-900 mb-4">Manage Preferences</h2>
                    <form onSubmit={handlePreferenceSubmit}>
                      <div className="flex space-x-4">
                        {['intensive', 'flexible', 'linear'].map((style) => (
                          <label key={style} className="flex items-center space-x-2">
                            <input
                              type="radio"
                              name="style"
                              value={style}
                              checked={preference.style === style}
                              onChange={(e) =>
                                setPreference({ ...preference, style: e.target.value as any })
                              }
                              className="w-4 h-4 text-sky-500 border-gray-300 focus:ring-sky-500"
                            />
                            <span className="text-sm font-medium text-gray-900 capitalize">
                              {style}
                            </span>
                          </label>
                        ))}
                      </div>
                      <button
                        type="submit"
                        className="mt-4 bg-sky-500 hover:bg-sky-600 text-white font-semibold py-2 px-4 rounded"
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