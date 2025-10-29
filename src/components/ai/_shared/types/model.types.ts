/**
 * AI Model Type Definitions
 * Shared types for AI model management across admin and account pages
 */

// ============================================================================
// Core Model Types
// ============================================================================

/**
 * Task item for AI models
 */
export interface AITaskItem {
  name: string;
  system_message: string;
}

/**
 * Core AI model interface
 * Used for both default and user models
 */
export interface AIModel {
  id: number;
  name: string;
  api_key?: string;
  endpoint?: string;
  max_tokens: number;
  user_role_to_access?: string;
  is_active?: boolean;
  system_message?: string;
  icon?: string | null;
  role?: string | null;
  task?: AITaskItem[] | null;
  organization_id?: string;
  user_id?: string;
  src?: string;
  created_at?: string;
  type?: AIModelType; // Model type classification
}

/**
 * Form data for creating/editing AI models
 */
export interface AIModelFormData {
  name: string;
  api_key: string;
  endpoint: string;
  max_tokens: number;
  user_role_to_access: string;
  system_message: string;
  icon: string;
  role: string | null;
  task: AITaskItem[] | null;
  is_active?: boolean;
}

/**
 * Selected model for user settings
 */
export interface AISelectedModel {
  id: number;
  type: 'default' | 'user';
  name?: string;
  max_tokens?: number;
  icon?: string | null;
}

/**
 * Model display context
 */
export type AIModelContext = 'admin' | 'account';

/**
 * Model type classification
 */
export type AIModelType = 'default' | 'user' | 'system';

/**
 * Tab types for different views
 */
export type AITabType = 'all' | 'default' | 'custom' | 'add' | 'edit' | 'models';

// ============================================================================
// Filter & Sort Types
// ============================================================================

/**
 * Filter by role
 */
export type AIFilterRoleType = 'all' | 'user' | 'admin';

/**
 * Filter by active status
 */
export type AIFilterActiveType = 'all' | 'active' | 'inactive';

/**
 * Sort field options
 */
export type AISortByType = 'name' | 'created' | 'role';

/**
 * Sort order
 */
export type AISortOrderType = 'asc' | 'desc';

// ============================================================================
// Role Types
// ============================================================================

/**
 * Predefined role option
 */
export interface AIPredefinedRole {
  value: string;
  label: string;
  description: string;
  systemMessage: string;
  tasks?: Array<{ name: string; system_message: string }>; // Optional predefined tasks
}

/**
 * Role form data
 */
export interface AIRoleFormData {
  role: string;
  customRole: string;
  systemMessage: string;
  isCustomRole: boolean;
}

// ============================================================================
// Task Types
// ============================================================================

/**
 * Task input mode
 */
export type AITaskInputMode = 'json' | 'builder';

/**
 * Task modal mode
 */
export type AITaskModalMode = 'view' | 'add';
