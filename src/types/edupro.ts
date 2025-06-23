// types/edupro.ts

export interface EduProCourse {
  id: number;
  slug: string;
  title: string;
  description: string;
  quiz_common_id?: number;
}

export interface EduProTopic {
  id: number;
  title: string;
  description: string;
  order: number;
  slug: string;
}

export interface EduProLesson {
  id: number;
  title: string;
  plan: string | null;
  interactive_elements: unknown | null;
  assessment_methods: string | null;
  metadata: unknown | null;
  content_type: string | null;
  created_at: string | null;
  updated_at: string | null;
  topic_id: number;
  image: string | null;
  order: number;
  next_lesson_id: number | null;
  previous_lesson_id: number | null;
  duration: string | null;
  description: string | null;
  links_to_video: string | null;
  video_player: string | null;
  link_to_practice: string | null;
}

export interface EduProLessonProgress {
  id: string;
  lesson_id: number;
  user_id: string;
  completed: boolean;
  completion_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Purchase {
  id: string;
  profiles_id: string;
  is_active: boolean;
  start_date: string;
  end_date: string | null;
  pricingplan: {
    product_id: string;
    product: {
      course_connected_id: number;
    };
  };
}

export interface StudyMaterial {
  id: string;
  lesson_id: number;
  file_path: string;
  file_type: 'pdf' | 'epub';
}

export interface TocItem {
  id: string;
  material_id: string;
  topic: string;
  page_number: number | null;
  href: string | null;
  order: number;
}

export type Tab = 'theory' | 'practice' | 'studyBooks';
export type ToastState = { message: string; type: 'success' | 'error' } | null;