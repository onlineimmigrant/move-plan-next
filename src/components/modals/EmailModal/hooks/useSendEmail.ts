'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useSettings } from '@/context/SettingsContext';
import { useAuth } from '@/context/AuthContext';

interface EmailRecipient {
  email: string;
  name?: string;
  contact_id?: number;
}

interface SendEmailParams {
  template_id?: number;
  recipients: EmailRecipient[];
  subject: string;
  body: string;
  schedule_at?: string | null;
  reply_to?: string;
  cc?: string[];
  bcc?: string[];
  attachments?: { name: string; url: string }[];
}

interface SendEmailResult {
  success: boolean;
  message: string;
  sent_log_ids?: number[];
}

interface UseSendEmailReturn {
  sendEmail: (params: SendEmailParams) => Promise<SendEmailResult>;
  isSending: boolean;
  error: string | null;
}

export function useSendEmail(): UseSendEmailReturn {
  const { settings } = useSettings();
  const { session } = useAuth();
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendEmail = async (params: SendEmailParams): Promise<SendEmailResult> => {
    if (!settings?.organization_id || !session?.user) {
      const errorMsg = 'Organization or user not found';
      setError(errorMsg);
      return { success: false, message: errorMsg };
    }

    if (!settings.transactional_email) {
      const errorMsg = 'Transactional email not configured. Please set up transactional email in Settings.';
      setError(errorMsg);
      return { success: false, message: errorMsg };
    }

    try {
      setIsSending(true);
      setError(null);

      const sent_log_ids: number[] = [];

      // Create email_sent_log entries for each recipient
      for (const recipient of params.recipients) {
        const { data: logEntry, error: logError } = await supabase
          .from('email_sent_log')
          .insert({
            organization_id: settings.organization_id,
            template_id: params.template_id || null,
            to_email: recipient.email,
            to_name: recipient.name || null,
            from_email: settings.transactional_email,
            from_name: settings.transactional_email,
            subject: params.subject,
            status: 'sent',
            sent_by_user_id: session.user.id,
          })
          .select('id')
          .single();

        if (logError) throw logError;
        if (logEntry) sent_log_ids.push(logEntry.id);
      }

      // If scheduled, don't send immediately
      if (params.schedule_at) {
        return {
          success: true,
          message: `Email scheduled for ${params.recipients.length} recipient(s)`,
          sent_log_ids,
        };
      }

      // Get current session token
      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (!authSession) {
        throw new Error('No active session');
      }

      // Call API route to send email via SES
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authSession.access_token}`,
        },
        body: JSON.stringify({
          organization_id: settings.organization_id,
          from_email: settings.transactional_email,
          from_name: settings.transactional_email,
          recipients: params.recipients.map((r) => r.email),
          subject: params.subject,
          body: params.body,
          reply_to: params.reply_to || settings.transactional_email,
          cc: params.cc || [],
          bcc: params.bcc || [],
          sent_log_ids,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send email');
      }

      return {
        success: true,
        message: `Email sent to ${params.recipients.length} recipient(s)`,
        sent_log_ids,
      };
    } catch (err) {
      console.error('Error sending email:', err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to send email';
      setError(errorMsg);
      return { success: false, message: errorMsg };
    } finally {
      setIsSending(false);
    }
  };

  return {
    sendEmail,
    isSending,
    error,
  };
}
