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
