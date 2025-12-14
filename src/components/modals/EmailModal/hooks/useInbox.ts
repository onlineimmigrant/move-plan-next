'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useSettings } from '@/context/SettingsContext';

interface EmailThread {
  id: number;
  organization_id: number;
  account_id: number;
  thread_id: string;
  subject: string;
  participants: string[];
  last_message_at: string;
  message_count: number;
  is_read: boolean;
  has_attachments: boolean;
  labels: string[] | null;
  created_at: string;
  updated_at: string;
}

interface EmailMessage {
  id: number;
  thread_id: number;
  message_id: string;
  from_email: string;
  from_name: string | null;
  to_emails: string[];
  cc_emails: string[] | null;
  bcc_emails: string[] | null;
  subject: string;
  body_text: string | null;
  body_html: string | null;
  is_read: boolean;
  received_at: string;
  created_at: string;
}

interface UseInboxReturn {
  threads: EmailThread[];
  currentThread: EmailThread | null;
  messages: EmailMessage[];
  isLoading: boolean;
  error: string | null;
  fetchThreads: (filters?: { label?: string; isRead?: boolean }) => Promise<void>;
  fetchThreadMessages: (threadId: string) => Promise<void>;
  markThreadAsRead: (threadId: string) => Promise<boolean>;
  markThreadAsUnread: (threadId: string) => Promise<boolean>;
  syncEmails: () => Promise<boolean>;
}

export function useInbox(): UseInboxReturn {
  const { settings } = useSettings();
  const [threads, setThreads] = useState<EmailThread[]>([]);
  const [currentThread, setCurrentThread] = useState<EmailThread | null>(null);
  const [messages, setMessages] = useState<EmailMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchThreads = async (filters?: { label?: string; isRead?: boolean }) => {
    if (!settings?.organization_id) {
      setThreads([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      let query = supabase
        .from('email_threads')
        .select('*')
        .eq('organization_id', settings.organization_id)
        .order('last_message_at', { ascending: false });

      if (filters?.label) {
        query = query.contains('labels', [filters.label]);
      }

      if (filters?.isRead !== undefined) {
        query = query.eq('is_read', filters.isRead);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setThreads(data || []);
    } catch (err) {
      console.error('Error fetching email threads:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch threads');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchThreadMessages = async (threadId: string) => {
    try {
      setError(null);

      // Fetch thread details
      const { data: threadData, error: threadError } = await supabase
        .from('email_threads')
        .select('*')
        .eq('id', threadId)
        .single();

      if (threadError) throw threadError;

      setCurrentThread(threadData);

      // Fetch messages in thread
      const { data: messagesData, error: messagesError } = await supabase
        .from('email_messages')
        .select('*')
        .eq('thread_id', threadId)
        .order('sent_at', { ascending: true });

      if (messagesError) throw messagesError;

      setMessages(messagesData || []);
    } catch (err) {
      console.error('Error fetching thread messages:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch messages');
    }
  };

  const markThreadAsRead = async (threadId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('email_threads')
        .update({ is_read: true })
        .eq('id', threadId)
        .eq('organization_id', settings?.organization_id);

      if (error) throw error;

      // Update local state
      setThreads((prev) =>
        prev.map((thread) =>
          String(thread.id) === threadId ? { ...thread, is_read: true } : thread
        )
      );

      if (currentThread?.id && String(currentThread.id) === threadId) {
        setCurrentThread({ ...currentThread, is_read: true });
      }

      return true;
    } catch (err) {
      console.error('Error marking thread as read:', err);
      setError(err instanceof Error ? err.message : 'Failed to mark as read');
      return false;
    }
  };

  const markThreadAsUnread = async (threadId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('email_threads')
        .update({ is_read: false })
        .eq('id', threadId)
        .eq('organization_id', settings?.organization_id);

      if (error) throw error;

      // Update local state
      setThreads((prev) =>
        prev.map((thread) =>
          String(thread.id) === threadId ? { ...thread, is_read: false } : thread
        )
      );

      if (currentThread?.id && String(currentThread.id) === threadId) {
        setCurrentThread({ ...currentThread, is_read: false });
      }

      return true;
    } catch (err) {
      console.error('Error marking thread as unread:', err);
      setError(err instanceof Error ? err.message : 'Failed to mark as unread');
      return false;
    }
  };

  const syncEmails = async (): Promise<boolean> => {
    try {
      setError(null);

      // Get session token for authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/email/sync', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        throw new Error('Failed to sync emails');
      }

      // Refresh threads after sync
      await fetchThreads();

      return true;
    } catch (err) {
      console.error('Error syncing emails:', err);
      setError(err instanceof Error ? err.message : 'Failed to sync emails');
      return false;
    }
  };

  useEffect(() => {
    fetchThreads();
  }, [settings?.organization_id]);

  return {
    threads,
    currentThread,
    messages,
    isLoading,
    error,
    fetchThreads,
    fetchThreadMessages,
    markThreadAsRead,
    markThreadAsUnread,
    syncEmails,
  };
}
