export interface Flashcard {
  id: number;
  name: string;
  messages: { role: string; content: string }[];
  created_at: string;
  updated_at: string;
  topic: string | null;
  section: string | null;
  user_id?: string;
  organization_id?: string;
  status?: string;

}

export interface PlanFlashcard {
  id: number;
  isUserFlashcard: boolean;
}