/**
 * Field type definitions for form builder
 */

import {
  DocumentTextIcon,
  AtSymbolIcon,
  DocumentIcon,
  PhoneIcon,
  LinkIcon,
  HashtagIcon,
  CalendarIcon,
  CheckCircleIcon,
  ListBulletIcon,
  Squares2X2Icon,
  ChevronDownIcon,
  StarIcon,
  PaperClipIcon,
} from '@heroicons/react/24/outline';

export const FIELD_TYPES = [
  { value: 'text', label: 'Short Text', Icon: DocumentTextIcon, description: 'Single line text input' },
  { value: 'email', label: 'Email', Icon: AtSymbolIcon, description: 'Email address' },
  { value: 'textarea', label: 'Long Text', Icon: DocumentIcon, description: 'Multi-line text area' },
  { value: 'tel', label: 'Phone', Icon: PhoneIcon, description: 'Phone number' },
  { value: 'url', label: 'Website URL', Icon: LinkIcon, description: 'Web address' },
  { value: 'number', label: 'Number', Icon: HashtagIcon, description: 'Numeric input' },
  { value: 'date', label: 'Date', Icon: CalendarIcon, description: 'Date picker' },
  { value: 'yesno', label: 'Yes/No', Icon: CheckCircleIcon, description: 'Binary choice' },
  { value: 'multiple', label: 'Multiple Choice', Icon: ListBulletIcon, description: 'Select one option' },
  { value: 'checkbox', label: 'Checkboxes', Icon: Squares2X2Icon, description: 'Select multiple options' },
  { value: 'dropdown', label: 'Dropdown', Icon: ChevronDownIcon, description: 'Dropdown menu' },
  { value: 'rating', label: 'Rating', Icon: StarIcon, description: 'Star rating (1-5)' },
  { value: 'file', label: 'File Upload', Icon: PaperClipIcon, description: 'Upload files' },
] as const;

/**
 * Field types that require options array
 */
export const FIELD_TYPES_WITH_OPTIONS = ['multiple', 'checkbox', 'dropdown', 'rating'] as const;

/**
 * Check if a field type requires options
 */
export function requiresOptions(type: string): boolean {
  return FIELD_TYPES_WITH_OPTIONS.includes(type as any);
}
