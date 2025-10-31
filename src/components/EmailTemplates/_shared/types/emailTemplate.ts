/**
 * Email Template Management Types
 * Centralized type definitions for the Email Template Management system
 * Shared between admin and superadmin contexts
 */

// ============================================================================
// Core Email Template Types
// ============================================================================

export interface EmailTemplate {
  id: number;
  organization_id: string | null;
  type: EmailTemplateType;
  subject: string;
  html_code: string; // Changed from html_body to match DB
  name: string | null; // Added from DB
  description: string | null; // Added from DB
  email_main_logo_image: string | null; // Added from DB
  from_email_address_type: FromEmailAddressType;
  is_active: boolean;
  created_by: string | null;
  updated_at: string;
  is_default: boolean;
  category: EmailTemplateCategory;
  // Joined data
  created_by_profile?: {
    full_name: string;
    email: string;
  };
}

export type EmailTemplateType = 
  | 'welcome'
  | 'reset_email'
  | 'email_confirmation'
  | 'order_confirmation'
  | 'free_trial_registration'
  | 'ticket_confirmation'
  | 'ticket_response'
  | 'meeting_invitation'
  | 'meeting_reminder'
  | 'meeting_cancellation'
  | 'newsletter';

export type FromEmailAddressType = 
  | 'transactional_email'
  | 'marketing_email'
  | 'transactional_email_2'
  | 'marketing_email_2';

export type EmailTemplateCategory = 
  | 'transactional'
  | 'marketing'
  | 'system';

// ============================================================================
// Form State Types
// ============================================================================

export interface EmailTemplateForm {
  organization_id: string | null;
  type: EmailTemplateType;
  subject: string;
  html_code: string; // Changed from html_body
  name: string; // Added
  description: string; // Added
  email_main_logo_image: string; // Added
  from_email_address_type: FromEmailAddressType;
  is_active: boolean;
  category: EmailTemplateCategory;
}

// ============================================================================
// UI State Types
// ============================================================================

export type TabType = 'templates' | 'add' | 'edit';
export type FilterCategoryType = 'all' | 'transactional' | 'system' | 'marketing';
export type FilterActiveType = 'all' | 'active' | 'inactive';
export type FilterTypeType = 'all' | EmailTemplateType;
export type SortByType = 'subject' | 'created' | 'type' | 'category';
export type SortOrderType = 'asc' | 'desc';
export type PreviewMode = 'html' | 'plain' | 'split';

// ============================================================================
// Validation Types
// ============================================================================

export interface FieldErrors {
  [key: string]: string;
}

export interface TouchedFields {
  [key: string]: boolean;
}

export interface PlaceholderValues {
  [key: string]: string;
}

// ============================================================================
// Predefined Data Types
// ============================================================================

export interface EmailTemplateTypeOption {
  value: EmailTemplateType;
  label: string;
  description: string;
  category: EmailTemplateCategory;
  defaultSubject: string;
  placeholders: string[];
}

export interface PlaceholderInfo {
  key: string;
  label: string;
  description: string;
  example: string;
  category: 'standard' | 'ticket' | 'meeting' | 'auth' | 'order' | 'newsletter';
}

export interface TemplatePlaceholder {
  name: string;
  description: string;
  example?: string;
  category: 'standard' | 'ticket' | 'meeting' | 'auth' | 'order' | 'newsletter';
}

// ============================================================================
// Component Props Types
// ============================================================================

export interface ThemeColors {
  base: string;
  hover: string;
  focus: string;
  ring: string;
  cssVars: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

// ============================================================================
// Constants
// ============================================================================

export const EMAIL_TEMPLATE_TYPES: EmailTemplateTypeOption[] = [
  {
    value: 'welcome',
    label: 'Welcome Email',
    description: 'Sent when a new user signs up',
    category: 'transactional',
    defaultSubject: 'Welcome to {{company_name}}!',
    placeholders: ['user_name', 'user_email', 'company_name', 'support_email'],
  },
  {
    value: 'reset_email',
    label: 'Password Reset',
    description: 'Sent when user requests password reset',
    category: 'transactional',
    defaultSubject: 'Reset Your Password',
    placeholders: ['user_name', 'reset_link', 'company_name'],
  },
  {
    value: 'email_confirmation',
    label: 'Email Confirmation',
    description: 'Sent to verify email address',
    category: 'transactional',
    defaultSubject: 'Confirm Your Email Address',
    placeholders: ['user_name', 'verification_link', 'company_name'],
  },
  {
    value: 'order_confirmation',
    label: 'Order Confirmation',
    description: 'Sent after successful order',
    category: 'transactional',
    defaultSubject: 'Order Confirmation - {{order_id}}',
    placeholders: ['user_name', 'order_id', 'order_total', 'order_items', 'company_name'],
  },
  {
    value: 'free_trial_registration',
    label: 'Free Trial Registration',
    description: 'Sent when user starts free trial',
    category: 'transactional',
    defaultSubject: 'Your Free Trial Has Started!',
    placeholders: ['user_name', 'trial_end_date', 'company_name'],
  },
  {
    value: 'ticket_confirmation',
    label: 'Ticket Confirmation',
    description: 'Sent when support ticket is created',
    category: 'system',
    defaultSubject: 'Support Ticket Created - {{ticket_id}}',
    placeholders: ['user_name', 'ticket_id', 'ticket_subject', 'ticket_status', 'company_name'],
  },
  {
    value: 'ticket_response',
    label: 'Ticket Response',
    description: 'Sent when support responds to ticket',
    category: 'system',
    defaultSubject: 'New Response on Ticket {{ticket_id}}',
    placeholders: ['user_name', 'ticket_id', 'ticket_subject', 'response_message', 'responder_name'],
  },
  {
    value: 'meeting_invitation',
    label: 'Meeting Invitation',
    description: 'Sent when user is invited to meeting',
    category: 'system',
    defaultSubject: 'Meeting Invitation: {{meeting_title}}',
    placeholders: ['user_name', 'meeting_title', 'meeting_date', 'meeting_time', 'meeting_link', 'host_name'],
  },
  {
    value: 'meeting_reminder',
    label: 'Meeting Reminder',
    description: 'Sent before scheduled meeting',
    category: 'system',
    defaultSubject: 'Reminder: {{meeting_title}} starts soon',
    placeholders: ['user_name', 'meeting_title', 'meeting_date', 'meeting_time', 'meeting_link'],
  },
  {
    value: 'meeting_cancellation',
    label: 'Meeting Cancellation',
    description: 'Sent when meeting is cancelled',
    category: 'system',
    defaultSubject: 'Meeting Cancelled: {{meeting_title}}',
    placeholders: ['user_name', 'meeting_title', 'meeting_date', 'cancellation_reason', 'host_name'],
  },
  {
    value: 'newsletter',
    label: 'Newsletter',
    description: 'Marketing newsletter emails',
    category: 'marketing',
    defaultSubject: '{{newsletter_title}}',
    placeholders: ['user_name', 'newsletter_title', 'newsletter_content', 'unsubscribe_link'],
  },
];

export const FROM_EMAIL_OPTIONS = [
  { value: 'transactional_email', label: 'Transactional Email', description: 'Primary transactional email address' },
  { value: 'marketing_email', label: 'Marketing Email', description: 'Primary marketing email address' },
  { value: 'transactional_email_2', label: 'Transactional Email 2', description: 'Secondary transactional email address' },
  { value: 'marketing_email_2', label: 'Marketing Email 2', description: 'Secondary marketing email address' },
] as const;

export const CATEGORY_OPTIONS = [
  { value: 'transactional', label: 'Transactional', description: 'Order confirmations, receipts, etc.' },
  { value: 'system', label: 'System', description: 'Alerts, reminders, updates' },
  { value: 'marketing', label: 'Marketing', description: 'Newsletters, promotions' },
] as const;

export const PLACEHOLDERS: PlaceholderInfo[] = [
  // Standard
  { key: 'user_name', label: 'User Name', description: 'Full name of the user', example: 'John Doe', category: 'standard' },
  { key: 'user_email', label: 'User Email', description: 'Email address of the user', example: 'john@example.com', category: 'standard' },
  { key: 'user_phone', label: 'User Phone', description: 'Phone number of the user', example: '+1 (555) 123-4567', category: 'standard' },
  { key: 'company_name', label: 'Company Name', description: 'Name of the company', example: 'Move Plan', category: 'standard' },
  { key: 'support_email', label: 'Support Email', description: 'Support contact email', example: 'support@moveplan.com', category: 'standard' },
  { key: 'current_year', label: 'Current Year', description: 'Current year', example: '2025', category: 'standard' },
  
  // Ticket
  { key: 'ticket_id', label: 'Ticket ID', description: 'Support ticket identifier', example: 'TICKET-12345', category: 'ticket' },
  { key: 'ticket_subject', label: 'Ticket Subject', description: 'Subject of the ticket', example: 'Login Issue', category: 'ticket' },
  { key: 'ticket_status', label: 'Ticket Status', description: 'Current status of ticket', example: 'Open', category: 'ticket' },
  { key: 'ticket_message', label: 'Ticket Message', description: 'Initial ticket message', example: 'I cannot log in...', category: 'ticket' },
  { key: 'response_message', label: 'Response Message', description: 'Support response text', example: 'We have reviewed...', category: 'ticket' },
  { key: 'responder_name', label: 'Responder Name', description: 'Name of support agent', example: 'Sarah Smith', category: 'ticket' },
  
  // Meeting
  { key: 'meeting_title', label: 'Meeting Title', description: 'Title of the meeting', example: 'Team Standup', category: 'meeting' },
  { key: 'meeting_date', label: 'Meeting Date', description: 'Date of the meeting', example: 'January 15, 2025', category: 'meeting' },
  { key: 'meeting_time', label: 'Meeting Time', description: 'Time of the meeting', example: '10:00 AM', category: 'meeting' },
  { key: 'meeting_link', label: 'Meeting Link', description: 'Video call link', example: 'https://meet.example.com/xyz', category: 'meeting' },
  { key: 'host_name', label: 'Host Name', description: 'Name of meeting host', example: 'Jane Doe', category: 'meeting' },
  { key: 'duration_minutes', label: 'Duration (Minutes)', description: 'Meeting duration', example: '30', category: 'meeting' },
  { key: 'meeting_notes', label: 'Meeting Notes', description: 'Additional meeting notes', example: 'Please review...', category: 'meeting' },
  { key: 'cancellation_reason', label: 'Cancellation Reason', description: 'Why meeting was cancelled', example: 'Scheduling conflict', category: 'meeting' },
  
  // Auth
  { key: 'verification_link', label: 'Verification Link', description: 'Email verification URL', example: 'https://example.com/verify', category: 'auth' },
  { key: 'reset_link', label: 'Reset Link', description: 'Password reset URL', example: 'https://example.com/reset', category: 'auth' },
  
  // Order
  { key: 'order_id', label: 'Order ID', description: 'Order identifier', example: 'ORD-12345', category: 'order' },
  { key: 'order_total', label: 'Order Total', description: 'Total order amount', example: '$149.99', category: 'order' },
  { key: 'order_items', label: 'Order Items', description: 'List of ordered items', example: '3 items', category: 'order' },
  
  // Newsletter
  { key: 'newsletter_title', label: 'Newsletter Title', description: 'Newsletter headline', example: 'Monthly Update', category: 'newsletter' },
  { key: 'newsletter_content', label: 'Newsletter Content', description: 'Main newsletter body', example: 'This month we...', category: 'newsletter' },
  { key: 'unsubscribe_link', label: 'Unsubscribe Link', description: 'Unsubscribe URL', example: 'https://example.com/unsubscribe', category: 'newsletter' },
  { key: 'trial_end_date', label: 'Trial End Date', description: 'When free trial ends', example: 'February 15, 2025', category: 'standard' },
];

// Template placeholders for autocomplete helper
export const TEMPLATE_PLACEHOLDERS: TemplatePlaceholder[] = PLACEHOLDERS.map(p => ({
  name: p.key,
  description: p.label,
  example: p.example,
  category: p.category,
}));

// ============================================================================
// Animation Styles
// ============================================================================

export const MODAL_ANIMATION_STYLES = {
  overlay: 'fixed inset-0 bg-black/30 backdrop-blur-sm z-50',
  container: 'fixed inset-0 flex items-center justify-center p-4 z-50',
  modal: 'bg-white rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto transform transition-all',
};
