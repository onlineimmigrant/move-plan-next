'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useSettings } from '@/context/SettingsContext';

interface Subscriber {
  id: number;
  list_id: number;
  email: string;
  first_name: string | null;
  last_name: string | null;
  status: 'active' | 'unsubscribed' | 'bounced';
  subscribed_at: string;
  unsubscribed_at: string | null;
}

interface UseSubscribersReturn {
  subscribers: Subscriber[];
  isLoading: boolean;
  error: string | null;
  fetchSubscribers: (listId: number) => Promise<void>;
  addSubscriber: (listId: number, subscriber: Partial<Subscriber>) => Promise<boolean>;
  addSubscribers: (listId: number, subscribers: Partial<Subscriber>[]) => Promise<number>;
  updateSubscriber: (id: number, updates: Partial<Subscriber>) => Promise<boolean>;
  unsubscribe: (id: number) => Promise<boolean>;
  deleteSubscriber: (id: number) => Promise<boolean>;
}

export function useSubscribers(): UseSubscribersReturn {
  const { settings } = useSettings();
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscribers = async (listId: number) => {
    if (!settings?.organization_id) {
      setSubscribers([]);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Verify list belongs to organization
      const { data: list, error: listError } = await supabase
        .from('email_lists')
        .select('id')
        .eq('id', listId)
        .eq('organization_id', settings.organization_id)
        .single();

      if (listError || !list) {
        throw new Error('List not found');
      }

      const { data, error: fetchError } = await supabase
        .from('email_list_subscribers')
        .select('*')
        .eq('list_id', listId)
        .order('subscribed_at', { ascending: false });

      if (fetchError) throw fetchError;

      setSubscribers(data || []);
    } catch (err) {
      console.error('Error fetching subscribers:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch subscribers');
    } finally {
      setIsLoading(false);
    }
  };

  const addSubscriber = async (listId: number, subscriber: Partial<Subscriber>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('email_list_subscribers')
        .insert({
          ...subscriber,
          list_id: listId,
          status: 'active',
          subscribed_at: new Date().toISOString(),
        });

      if (error) throw error;
      await fetchSubscribers(listId);
      return true;
    } catch (err) {
      console.error('Error adding subscriber:', err);
      setError(err instanceof Error ? err.message : 'Failed to add subscriber');
      return false;
    }
  };

  const addSubscribers = async (listId: number, subscribers: Partial<Subscriber>[]): Promise<number> => {
    try {
      const subscribersToInsert = subscribers.map((sub) => ({
        ...sub,
        list_id: listId,
        status: 'active',
        subscribed_at: new Date().toISOString(),
      }));

      const { data, error } = await supabase
        .from('email_list_subscribers')
        .insert(subscribersToInsert)
        .select();

      if (error) throw error;
      await fetchSubscribers(listId);
      return data?.length || 0;
    } catch (err) {
      console.error('Error adding subscribers:', err);
      setError(err instanceof Error ? err.message : 'Failed to add subscribers');
      return 0;
    }
  };

  const updateSubscriber = async (id: number, updates: Partial<Subscriber>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('email_list_subscribers')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error updating subscriber:', err);
      setError(err instanceof Error ? err.message : 'Failed to update subscriber');
      return false;
    }
  };

  const unsubscribe = async (id: number): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('email_list_subscribers')
        .update({
          status: 'unsubscribed',
          unsubscribed_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error unsubscribing:', err);
      setError(err instanceof Error ? err.message : 'Failed to unsubscribe');
      return false;
    }
  };

  const deleteSubscriber = async (id: number): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('email_list_subscribers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error deleting subscriber:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete subscriber');
      return false;
    }
  };

  return {
    subscribers,
    isLoading,
    error,
    fetchSubscribers,
    addSubscriber,
    addSubscribers,
    updateSubscriber,
    unsubscribe,
    deleteSubscriber,
  };
}
