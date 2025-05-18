// src/components/study-plan/types.ts
export interface EduProCourse {
  id: number;
  slug: string;
  title: string;
  image: string | null;
}

export interface Topic {
  id: number;
  slug: string;
  title: string;
  order: number;
}

export interface Lesson {
  id: number;
  topic_id: number;
  title: string;
  order: number;
}

export interface LessonProgress {
  lesson: Lesson;
  completed: boolean;
  completion_date: string | null;
  planned_completion_date: string;
}

export interface TopicProgress {
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

export interface CourseProgress {
  course: EduProCourse;
  quiz: { id: number; slug: string };
  quiz_quizstatistic: { questions_correct: number; questions_attempted: number; percent_correct: number } | null;
  total_topics: number;
  completed_topics: number;
  completed_topics_percentage: number;
  topics_progress: TopicProgress[];
}

export interface Purchase {
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

export interface StudyPlanPreference {
  id: number | null;
  style: 'intensive' | 'flexible' | 'linear';
  start_date: string | null; // Add start_date
  end_date: string | null;   // Add end_date
}