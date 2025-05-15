export interface Topic {
  id: number;
  title: string;
}

export interface Choice {
  id: number;
  choice_text: string;
  is_correct: boolean;
}

export interface Question {
  id: number;
  topic_id: number;
  topic: Topic;
  question_text: string;
  explanation: string | null;
  video_player: 'youtube' | 'vimeo' | null;
  links_to_video: string | null;
  correct_answer_count: number;
  choices: Choice[];
}

export interface Quiz {
  id: number;
  course_id: number;
  slug: string;
  randomize_choices: boolean;
}

export interface UserSession {
  user: {
    id: string;
    role: 'student' | 'staff' | string;
  };
}