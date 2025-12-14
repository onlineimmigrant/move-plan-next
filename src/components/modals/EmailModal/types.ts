// Email Account Types
export type EmailProvider = 'gmail' | 'outlook' | 'ses';
export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'error';

export interface EmailAccount {
  id: string;
  organization_id: string;
  user_id: string;
  provider: EmailProvider;
  email_address: string;
  display_name: string | null;
  is_primary: boolean;
  is_active: boolean;
  last_sync_at: string | null;
  sync_status: SyncStatus;
  sync_error: string | null;
  total_emails_received: number;
  total_emails_sent: number;
  created_at: string;
  updated_at: string;
}

// Email Thread Types
export interface EmailThread {
  id: string;
  organization_id: string;
  account_id: string;
  subject: string;
  participants: string[];
  ticket_id: string | null;
  booking_id: string | null;
  message_count: number;
  is_read: boolean;
  is_archived: boolean;
  is_starred: boolean;
  first_message_at: string | null;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
}

// Email Message Types
export type MessageDirection = 'inbound' | 'outbound';

export interface EmailMessage {
  id: string;
  organization_id: string;
  thread_id: string;
  account_id: string;
  external_id: string | null;
  in_reply_to: string | null;
  references: string[] | null;
  from_email: string;
  from_name: string | null;
  to_emails: string[];
  cc_emails: string[] | null;
  bcc_emails: string[] | null;
  reply_to: string | null;
  subject: string;
  body_html: string | null;
  body_text: string | null;
  snippet: string | null;
  direction: MessageDirection;
  is_read: boolean;
  is_draft: boolean;
  sent_at: string | null;
  received_at: string | null;
  created_at: string;
  updated_at: string;
}

// Email Attachment Types
export type StorageProvider = 'supabase' | 'r2' | 's3';

export interface EmailAttachment {
  id: string;
  organization_id: string;
  message_id: string;
  filename: string;
  content_type: string;
  size_bytes: number;
  storage_provider: StorageProvider;
  storage_path: string;
  storage_url: string | null;
  external_id: string | null;
  created_at: string;
}

// Email Campaign Types
export type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused' | 'cancelled';

export interface EmailCampaign {
  id: string;
  organization_id: string;
  name: string;
  subject: string;
  from_email: string;
  from_name: string | null;
  reply_to: string | null;
  template_id: number | null;
  status: CampaignStatus;
  scheduled_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  total_recipients: number;
  emails_sent: number;
  emails_delivered: number;
  emails_opened: number;
  emails_clicked: number;
  emails_bounced: number;
  emails_complained: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// Email List Types
export type SubscriberStatus = 'subscribed' | 'unsubscribed' | 'bounced' | 'complained';

export interface EmailList {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  subscriber_count: number;
  active_subscriber_count: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmailListSubscriber {
  id: string;
  organization_id: string;
  list_id: string;
  email: string;
  name: string | null;
  status: SubscriberStatus;
  source: string | null;
  custom_fields: Record<string, any>;
  subscribed_at: string;
  unsubscribed_at: string | null;
  created_at: string;
  updated_at: string;
}

// Email Sent Log Types
export type EmailStatus = 'sent' | 'delivered' | 'bounced' | 'complained' | 'failed';

export interface EmailSentLog {
  id: string;
  organization_id: string;
  template_id: number | null;
  template_type: string | null;
  campaign_id: string | null;
  to_email: string;
  to_name: string | null;
  from_email: string;
  from_name: string | null;
  subject: string;
  status: EmailStatus;
  ses_message_id: string | null;
  opened_at: string | null;
  clicked_at: string | null;
  bounced_at: string | null;
  complained_at: string | null;
  sent_by_user_id: string | null;
  sent_at: string;
  created_at: string;
}

// Email Branding Types
export interface EmailBranding {
  use_primary_color: boolean;
  use_seo_og_image_as_logo: boolean;
  custom_logo_url: string | null;
  custom_primary_color: string | null;
  font_family: string;
  button_border_radius: number;
  container_max_width: number;
  primary_color?: string;  // Injected by get_email_branding()
  logo_url?: string;       // Injected by get_email_branding()
}
