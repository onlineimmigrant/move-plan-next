export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  taskName?: string; // Add taskName for assistant messages
  attachedFileIds?: string[]; // IDs of files attached to this message
}

export interface ChatFile {
  id: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  created_at: string;
  expires_at: string;
  url: string;
  content?: string; // Parsed text content for AI
}

export interface ChatHistory {
  id: number;
  name: string;
  messages: Message[];
  bookmarked: boolean;
  created_at: string;
  updated_at: string;
}

export interface Model {
  id: number;
  name: string;
  display_name: string;
  api_key: string | null;
  endpoint: string | null;
  max_tokens: number | null;
  system_message: string | null;
  icon: string | null;
  task: Task[] | null;
  type: 'default' | 'user';
  organization_id?: number;
}

export type WidgetSize = 'initial' | 'half' | 'fullscreen';

export interface Task {
  id: number;
  name: string;
  system_message: string;
}

export type Role = 'user' | 'admin' | 'moderator';

export interface UserSettings {
  default_model_id: number | null;
  user_model_id: number | null;
  selected_model_type: 'default' | 'user' | null;
  default_settings: Record<string, any>;
}

export interface ChatMessagesProps {
  messages: Message[];
  isTyping: boolean;
  isFullscreen: boolean;
  setError: (error: string | null) => void;
  accessToken: string | null;
  userId: string | null;
  selectedTask: Task | null;
  onDeleteMessage?: (index: number) => void;
}