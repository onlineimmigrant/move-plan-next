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
  topic_id: number; // Optional for QuizResults
  section?: string;
  topic: { id: number; title: string }; // Optional for QuizResults
  question_text: string;
  explanation?: string | null;
  video_player?: string | null;
  links_to_video?: string | null;
  correct_answer_count: number; // Optional for QuizResults
  choices: Choice[];
}

export interface Quiz {
  id: number;
  course_id: number;
  slug: string;
  randomize_choices: boolean;
  numerate_choices:boolean;
  question_seconds: string;
}

export interface UserSession {
  user: {
    id: string;
    role: 'student' | 'staff' | string;
  };
}



interface ExplanationModalProps {
  question: Question;
  examMode?: boolean; // Optional for QuizResults
  randomizeChoices?: boolean; // Optional for QuizResults
  closeModal: (modalId: string, videoId?: string) => void;
}