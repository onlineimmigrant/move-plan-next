export interface Organization {
  id: string;
  tenant_id?: string | null;
  base_url?: string | null;
  base_url_local?: string | null;
  type: string;
  created_at?: string;
  updated_at?: string;
}

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


export interface Plan {
  id: string;
  name: string;
  label: string;
  start_date: string;
  end_date?: string | null;
  flashcard_ids: number[];
  status: string;
  user_id: string;
  is_default: boolean;
}