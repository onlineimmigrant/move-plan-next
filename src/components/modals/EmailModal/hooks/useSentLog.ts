'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useSettings } from '@/context/SettingsContext';

interface SentEmail {
  id: string;
  organization_id: string;
  template_id: number | null;
  campaign_id: string | null;
  to_email: string;
  to_name: string | null;
  from_email: string;
  from_name: string | null;
  subject: string;
  status: 'sent' | 'delivered' | 'bounced' | 'complained' | 'failed';
  ses_message_id: string | null;
  opened_at: string | null;
  clicked_at: string | null;
  bounced_at: string | null;
  complained_at: string | null;
  sent_by_user_id: string | null;
  sent_at: string;
  created_at: string;
}

interface UseSentLogReturn {
  sentEmails: SentEmail[];
  isLoading: boolean;
  error: string | null;
  refreshSentLog: () => Promise<void>;
  filterByStatus: (status: string) => SentEmail[];
  searchSentEmails: (query: string) => SentEmail[];
}

export function useSentLog(): UseSentLogReturn {
  const { settings } = useSettings();
  const [sentEmails, setSentEmails] = useState<SentEmail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSentLog = async () => {
    if (!settings?.organization_id) {
      setSentEmails([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('email_sent_log')
        .select('*')
        .eq('organization_id', settings.organization_id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (fetchError) throw fetchError;

      // Deduplicate by ID (in case database has duplicates)
      const uniqueEmails = Array.from(
        new Map((data || []).map(email => [email.id, email])).values()
      );

      console.log('Fetched emails:', data?.length, 'Unique emails:', uniqueEmails.length);
      setSentEmails(uniqueEmails);
    } catch (err) {
      console.error('Error fetching sent email log:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch sent emails');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!settings?.organization_id) return;

    // Initial fetch
    fetchSentLog();

    // Set up realtime subscription
    const channel = supabase
      .channel('email_sent_log_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'email_sent_log',
          filter: `organization_id=eq.${settings.organization_id}`,
        },
        (payload) => {
          console.log('Email sent log change detected:', payload);
          
          if (payload.eventType === 'INSERT') {
            // Check if email already exists before adding
            setSentEmails((prev) => {
              const newEmail = payload.new as SentEmail;
              const exists = prev.some(email => email.id === newEmail.id);
              console.log(`INSERT: ${newEmail.id} - Exists: ${exists}`);
              return exists ? prev : [newEmail, ...prev];
            });
          } else if (payload.eventType === 'UPDATE') {
            setSentEmails((prev) =>
              prev.map((email) =>
                email.id === (payload.new as SentEmail).id
                  ? (payload.new as SentEmail)
                  : email
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setSentEmails((prev) =>
              prev.filter((email) => email.id !== (payload.old as SentEmail).id)
            );
          }
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      channel.unsubscribe();
    };
  }, [settings?.organization_id]);

  const refreshSentLog = async () => {
    await fetchSentLog();
  };

  const filterByStatus = (status: string): SentEmail[] => {
    if (status === 'all') return sentEmails;
    return sentEmails.filter((email) => email.status === status);
  };

  const searchSentEmails = (query: string): SentEmail[] => {
    if (!query.trim()) return sentEmails;

    const lowerQuery = query.toLowerCase();
    return sentEmails.filter(
      (email) =>
        email.to_email.toLowerCase().includes(lowerQuery) ||
        email.to_name?.toLowerCase().includes(lowerQuery) ||
        email.subject.toLowerCase().includes(lowerQuery)
    );
  };

  return {
    sentEmails,
    isLoading,
    error,
    refreshSentLog,
    filterByStatus,
    searchSentEmails,
  };
}
