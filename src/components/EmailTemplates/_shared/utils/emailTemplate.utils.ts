/**
 * Email Template Utilities
 * Helper functions for email template management
 */

import { 
  EmailTemplate, 
  EmailTemplateForm, 
  EmailTemplateType,
  EMAIL_TEMPLATE_TYPES,
  PLACEHOLDERS,
  PlaceholderInfo 
} from '../types/emailTemplate';

// ============================================================================
// Validation Functions
// ============================================================================

export const validateEmailTemplateForm = (
  form: EmailTemplateForm
): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};

  // Subject validation
  if (!form.subject || form.subject.trim() === '') {
    errors.subject = 'Subject is required';
  } else if (form.subject.length < 3) {
    errors.subject = 'Subject must be at least 3 characters';
  } else if (form.subject.length > 200) {
    errors.subject = 'Subject must be less than 200 characters';
  }

  // HTML code validation
  if (!form.html_code || form.html_code.trim() === '') {
    errors.html_code = 'HTML code is required';
  } else if (form.html_code.length < 10) {
    errors.html_code = 'HTML code must be at least 10 characters';
  }

  // Name validation (optional but recommended)
  if (form.name && form.name.length < 3) {
    errors.name = 'Name must be at least 3 characters if provided';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// ============================================================================
// Placeholder Functions
// ============================================================================

/**
 * Extract placeholders from template content
 */
export const extractPlaceholders = (content: string): string[] => {
  const placeholderRegex = /\{\{([^}]+)\}\}/g;
  const matches = content.matchAll(placeholderRegex);
  const placeholders = new Set<string>();
  
  for (const match of matches) {
    placeholders.add(match[1].trim());
  }
  
  return Array.from(placeholders);
};

/**
 * Get placeholder info for a given key
 */
export const getPlaceholderInfo = (key: string): PlaceholderInfo | undefined => {
  return PLACEHOLDERS.find(p => p.key === key);
};

/**
 * Get all available placeholders for a template type
 */
export const getAvailablePlaceholders = (type: EmailTemplateType): PlaceholderInfo[] => {
  const templateType = EMAIL_TEMPLATE_TYPES.find(t => t.value === type);
  if (!templateType) return PLACEHOLDERS;
  
  // Return placeholders relevant to this template type
  const relevantKeys = new Set(templateType.placeholders);
  return PLACEHOLDERS.filter(p => 
    relevantKeys.has(p.key) || p.category === 'standard'
  );
};

/**
 * Replace placeholders in content with values
 */
export const replacePlaceholders = (
  content: string,
  values: Record<string, string>
): string => {
  let result = content;
  
  Object.entries(values).forEach(([key, value]) => {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    result = result.replace(regex, value);
  });
  
  return result;
};

/**
 * Get default placeholder values for preview
 */
export const getDefaultPlaceholderValues = (): Record<string, string> => {
  return {
    user_name: 'John Doe',
    user_email: 'john.doe@example.com',
    user_phone: '+1 (555) 123-4567',
    company_name: 'Move Plan',
    support_email: 'support@moveplan.com',
    current_year: new Date().getFullYear().toString(),
    ticket_id: 'TICKET-12345',
    ticket_subject: 'Sample Support Ticket',
    ticket_status: 'Open',
    ticket_message: 'I am experiencing an issue with...',
    response_message: 'Thank you for contacting us. We have reviewed your issue...',
    responder_name: 'Sarah Smith',
    meeting_title: 'Team Standup Meeting',
    meeting_date: new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }),
    meeting_time: '10:00 AM',
    meeting_link: 'https://meet.example.com/sample-meeting',
    host_name: 'Jane Doe',
    duration_minutes: '30',
    meeting_notes: 'Please review the agenda before joining.',
    cancellation_reason: 'Scheduling conflict',
    verification_link: 'https://example.com/verify?token=SAMPLE_TOKEN',
    reset_link: 'https://example.com/reset-password?token=SAMPLE_TOKEN',
    order_id: 'ORD-12345',
    order_total: '$149.99',
    order_items: '3 items',
    newsletter_title: 'Monthly Newsletter - January 2025',
    newsletter_content: 'This month we have exciting updates...',
    unsubscribe_link: 'https://example.com/unsubscribe',
    trial_end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }),
  };
};

// ============================================================================
// Template Type Functions
// ============================================================================

/**
 * Get template type configuration
 */
export const getTemplateTypeInfo = (type: EmailTemplateType) => {
  return EMAIL_TEMPLATE_TYPES.find(t => t.value === type);
};

/**
 * Get default subject for template type
 */
export const getDefaultSubject = (type: EmailTemplateType): string => {
  const info = getTemplateTypeInfo(type);
  return info?.defaultSubject || '';
};

/**
 * Get category badge color
 */
export const getCategoryColor = (category: string): string => {
  switch (category) {
    case 'transactional':
      return 'bg-blue-100 text-blue-800';
    case 'system':
      return 'bg-purple-100 text-purple-800';
    case 'marketing':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

/**
 * Get type badge color
 */
export const getTypeColor = (type: EmailTemplateType): string => {
  const colors: Record<EmailTemplateType, string> = {
    welcome: 'bg-indigo-100 text-indigo-800',
    reset_email: 'bg-red-100 text-red-800',
    email_confirmation: 'bg-green-100 text-green-800',
    order_confirmation: 'bg-blue-100 text-blue-800',
    free_trial_registration: 'bg-purple-100 text-purple-800',
    ticket_confirmation: 'bg-orange-100 text-orange-800',
    ticket_response: 'bg-orange-100 text-orange-800',
    meeting_invitation: 'bg-teal-100 text-teal-800',
    meeting_reminder: 'bg-teal-100 text-teal-800',
    meeting_cancellation: 'bg-red-100 text-red-800',
    newsletter: 'bg-green-100 text-green-800',
  };
  
  return colors[type] || 'bg-gray-100 text-gray-800';
};

// ============================================================================
// Formatting Functions
// ============================================================================

/**
 * Format date for display
 */
export const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
};

/**
 * Format datetime for display
 */
export const formatDateTime = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Strip HTML tags for preview
 */
export const stripHtmlTags = (html: string): string => {
  return html.replace(/<[^>]*>/g, '');
};

// ============================================================================
// Sorting and Filtering Functions
// ============================================================================

/**
 * Sort templates by field
 */
export const sortTemplates = (
  templates: EmailTemplate[],
  sortBy: string,
  sortOrder: 'asc' | 'desc'
): EmailTemplate[] => {
  const sorted = [...templates].sort((a, b) => {
    let aVal: any;
    let bVal: any;

    switch (sortBy) {
      case 'subject':
        aVal = a.subject.toLowerCase();
        bVal = b.subject.toLowerCase();
        break;
      case 'created':
        aVal = new Date(a.updated_at).getTime();
        bVal = new Date(b.updated_at).getTime();
        break;
      case 'type':
        aVal = a.type.toLowerCase();
        bVal = b.type.toLowerCase();
        break;
      case 'category':
        aVal = a.category.toLowerCase();
        bVal = b.category.toLowerCase();
        break;
      default:
        return 0;
    }

    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  return sorted;
};

/**
 * Filter templates by search query
 */
export const filterTemplatesBySearch = (
  templates: EmailTemplate[],
  searchQuery: string
): EmailTemplate[] => {
  if (!searchQuery.trim()) return templates;

  const query = searchQuery.toLowerCase();
  return templates.filter(
    (template) =>
      template.subject.toLowerCase().includes(query) ||
      template.type.toLowerCase().includes(query) ||
      template.category.toLowerCase().includes(query) ||
      (template.name && template.name.toLowerCase().includes(query)) ||
      (template.description && template.description.toLowerCase().includes(query)) ||
      template.html_code.toLowerCase().includes(query)
  );
};

// ============================================================================
// Default Template Functions
// ============================================================================

/**
 * Create empty template form
 */
export const createEmptyTemplateForm = (organizationId: string | null): EmailTemplateForm => {
  return {
    organization_id: organizationId,
    type: 'welcome',
    subject: '',
    html_code: '',
    name: '',
    description: '',
    email_main_logo_image: '',
    from_email_address_type: 'transactional_email',
    is_active: true,
    category: 'transactional',
  };
};

/**
 * Convert template to form
 */
export const templateToForm = (template: EmailTemplate): EmailTemplateForm => {
  return {
    organization_id: template.organization_id,
    type: template.type,
    subject: template.subject,
    html_code: template.html_code,
    name: template.name || '',
    description: template.description || '',
    email_main_logo_image: template.email_main_logo_image || '',
    from_email_address_type: template.from_email_address_type,
    is_active: template.is_active,
    category: template.category,
  };
};
