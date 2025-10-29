/**
 * System Models Types
 * Extended types for superadmin system-wide AI model management
 * Extends the base aiManagement types with system-specific fields
 */

import type { TaskItem } from './aiManagement';

// ============================================================================
// System Model Types (Superadmin only)
// ============================================================================

export interface SystemModel {
  id: string;
  name: string;
  role: string;
  system_message: string;
  api_key: string;
  endpoint: string;
  max_tokens: number;
  icon: string | null;
  
  // System-specific fields
  organization_types: string[]; // Which org types can use this model
  required_plan: 'free' | 'starter' | 'pro' | 'enterprise'; // Minimum plan required
  token_limit_period: 'daily' | 'weekly' | 'monthly' | null;
  token_limit_amount: number | null;
  
  // Model flags
  is_free: boolean; // Free for all users
  is_trial: boolean; // Trial period available
  trial_expires_days: number | null; // Days until trial expires
  is_active: boolean; // Model is active system-wide
  is_featured: boolean; // Show in featured/recommended section
  
  // Metadata
  description: string | null;
  tags: string[];
  sort_order: number;
  task: TaskItem[] | null;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface SystemModelForm {
  name: string;
  role: string;
  system_message: string;
  api_key: string;
  endpoint: string;
  max_tokens: number;
  icon: string;
  
  // System-specific fields
  organization_types: string[];
  required_plan: 'free' | 'starter' | 'pro' | 'enterprise';
  token_limit_period: 'daily' | 'weekly' | 'monthly' | null;
  token_limit_amount: number | null;
  
  // Model flags
  is_free: boolean;
  is_trial: boolean;
  trial_expires_days: number | null;
  is_active: boolean;
  is_featured: boolean;
  
  // Metadata
  description: string;
  tags: string[];
  sort_order: number;
  task: TaskItem[] | null;
}

// ============================================================================
// Organization Type Options (for multi-select)
// ============================================================================

export const ORGANIZATION_TYPES = [
  { value: 'marketing', label: 'Marketing Agency' },
  { value: 'software', label: 'Software Company' },
  { value: 'retail', label: 'Retail' },
  { value: 'consulting', label: 'Consulting' },
  { value: 'solicitor', label: 'Legal Services' },
  { value: 'finance', label: 'Finance' },
  { value: 'immigration', label: 'Immigration Services' },
  { value: 'doctor', label: 'Medical Practice' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'beauty', label: 'Beauty & Wellness' },
  { value: 'realestate', label: 'Real Estate' },
  { value: 'education', label: 'Education' },
  { value: 'construction', label: 'Construction' },
  { value: 'hospitality', label: 'Hospitality' },
  { value: 'automotive', label: 'Automotive' },
  { value: 'nonprofit', label: 'Non-Profit' },
] as const;

// ============================================================================
// Plan Options
// ============================================================================

export const PLAN_OPTIONS = [
  { value: 'free', label: 'Free', description: 'Available to all users' },
  { value: 'starter', label: 'Starter', description: 'Requires Starter plan or higher' },
  { value: 'pro', label: 'Pro', description: 'Requires Pro plan or higher' },
  { value: 'enterprise', label: 'Enterprise', description: 'Requires Enterprise plan' },
] as const;

// ============================================================================
// Token Limit Period Options
// ============================================================================

export const TOKEN_LIMIT_PERIODS = [
  { value: null, label: 'None', description: 'No token limit' },
  { value: 'daily', label: 'Daily', description: 'Resets every day' },
  { value: 'weekly', label: 'Weekly', description: 'Resets every week' },
  { value: 'monthly', label: 'Monthly', description: 'Resets every month' },
] as const;

// ============================================================================
// Validation Helpers
// ============================================================================

export function validateSystemModel(model: Partial<SystemModelForm>): { [key: string]: string } {
  const errors: { [key: string]: string } = {};
  
  if (!model.name?.trim()) {
    errors.name = 'Model name is required';
  }
  
  if (!model.role?.trim()) {
    errors.role = 'Role is required';
  }
  
  if (!model.system_message?.trim()) {
    errors.system_message = 'System message is required';
  }
  
  if (!model.api_key?.trim()) {
    errors.api_key = 'API key is required';
  }
  
  if (!model.endpoint?.trim()) {
    errors.endpoint = 'Endpoint URL is required';
  }
  
  if (!model.max_tokens || model.max_tokens < 1) {
    errors.max_tokens = 'Max tokens must be at least 1';
  }
  
  if (model.token_limit_amount !== null && model.token_limit_amount !== undefined) {
    if (model.token_limit_amount < 1) {
      errors.token_limit_amount = 'Token limit must be at least 1';
    }
    if (!model.token_limit_period) {
      errors.token_limit_period = 'Period is required when limit is set';
    }
  }
  
  if (model.is_trial && (!model.trial_expires_days || model.trial_expires_days < 1)) {
    errors.trial_expires_days = 'Trial period days required for trial models';
  }
  
  return errors;
}

// ============================================================================
// Default Values
// ============================================================================

export const DEFAULT_SYSTEM_MODEL: SystemModelForm = {
  name: '',
  role: '',
  system_message: '',
  api_key: '',
  endpoint: 'https://api.openai.com/v1/chat/completions',
  max_tokens: 1000,
  icon: '🤖',
  organization_types: [],
  required_plan: 'free',
  token_limit_period: null,
  token_limit_amount: null,
  is_free: false,
  is_trial: false,
  trial_expires_days: null,
  is_active: true,
  is_featured: false,
  description: '',
  tags: [],
  sort_order: 0,
  task: null,
};
