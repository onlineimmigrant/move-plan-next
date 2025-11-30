/**
 * Shared type definitions for form builder components
 */

export type LogicOperator = 'is' | 'is_not' | 'contains' | 'not_contains' | 'gt' | 'lt' | 'answered' | 'not_answered';

export type LogicRule = {
  leftQuestionId: string;
  operator: LogicOperator;
  value?: string;
};

export type LogicGroup = {
  combinator: 'all' | 'any';
  rules: LogicRule[];
};

// Question Library Template (reusable across forms)
export interface QuestionLibraryItem {
  id: string;
  organization_id: string;
  type: 'text' | 'email' | 'textarea' | 'tel' | 'url' | 'number' | 'date' | 'yesno' | 'multiple' | 'checkbox' | 'dropdown' | 'rating' | 'file';
  label: string;
  description?: string;
  placeholder?: string;
  options?: string[];
  validation?: Record<string, any>;
  tags?: string[];
  category?: string;
  usage_count?: number;
  visible_for_others?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Question {
  id: string;
  type: 'text' | 'email' | 'textarea' | 'tel' | 'url' | 'number' | 'date' | 'yesno' | 'multiple' | 'checkbox' | 'dropdown' | 'rating' | 'file';
  label: string;
  description?: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  logic_show_if?: string;
  logic_value?: string;
  validation?: Record<string, any>;
  order_index: number;
  
  // Question Library fields (new)
  question_library_id?: string | null; // Link to reusable question template
  label_override?: string | null; // Override library label for this form
  description_override?: string | null;
  placeholder_override?: string | null;
  options_override?: string[] | null;
  validation_override?: Record<string, any> | null;
  
  // Metadata from view (read-only)
  library_tags?: string[];
  library_category?: string;
  is_from_library?: boolean;
  has_overrides?: boolean;
}

export interface FormSettings {
  designStyle?: 'large' | 'compact';
  designType?: 'classic' | 'card';
  showCompanyLogo?: boolean;
  columnLayout?: 1 | 2 | 3;
  formPosition?: 'left' | 'center' | 'right';
  contentColumns?: Array<{
    position: 'left' | 'center' | 'right';
    type: 'image' | 'video' | 'text';
    content: string;
  }>;
}
