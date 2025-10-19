/**
 * Shared TypeScript types for Ticket Modals
 * Used by both TicketsAdminModal and TicketsAccountModal
 */

import { TicketAttachment } from '@/lib/fileUpload';

// ============================================================================
// Core Ticket Types - SHARED
// ============================================================================

export interface TicketResponse {
  id: string;
  message: string;
  is_admin: boolean;
  created_at: string;
  created_by?: string | null;
  avatar_id?: string;
  is_read?: boolean;
  read_at?: string;
  attachments?: TicketAttachment[];
}

export interface TicketNote {
  id: string;
  ticket_id: string;
  admin_id: string;
  note_text: string;
  created_at: string;
  updated_at: string;
  is_pinned: boolean;
  admin_email?: string;
  admin_full_name?: string;
}

export interface TicketTag {
  id: string;
  organization_id: string;
  name: string;
  color: string;
  icon?: string;
  created_at: string;
}

export interface TicketTagAssignment {
  ticket_id: string;
  tag_id: string;
  tag?: TicketTag;
}

export interface Ticket {
  id: string;
  subject: string;
  status: string;
  customer_id: string | null;
  created_at: string;
  updated_at?: string;
  message: string;
  preferred_contact_method: string | null;
  email: string;
  full_name?: string;
  assigned_to?: string | null;
  priority?: string;
  ticket_responses: TicketResponse[];
  tags?: TicketTag[];
}

// ============================================================================
// Avatar & User Types - SHARED
// ============================================================================

export interface Avatar {
  id: string;
  title: string;
  full_name?: string;
  image?: string;
}

export interface AdminUser {
  id: string;
  email: string;
  full_name?: string;
}

export interface PredefinedResponse {
  id: string;
  order: number;
  subject: string;
  text: string;
}

// ============================================================================
// UI State Types - SHARED
// ============================================================================

export type WidgetSize = 'initial' | 'half' | 'fullscreen';

export interface ToastState {
  message: string;
  type: 'success' | 'error';
}

// ============================================================================
// Message Component Props - SHARED
// ============================================================================

export interface MessageItemProps {
  message: TicketResponse;
  isAdmin: boolean;
  avatar?: Avatar;
  senderName?: string;
  senderEmail?: string;
}

// ============================================================================
// Re-export TicketAttachment from fileUpload
// ============================================================================

export type { TicketAttachment } from '@/lib/fileUpload';
