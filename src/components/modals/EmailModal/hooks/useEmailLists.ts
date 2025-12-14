'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useSettings } from '@/context/SettingsContext';

interface EmailList {
  id: number;
  organization_id: number;
  name: string;
  description: string | null;
  subscriber_count: number;
  created_at: string;
  updated_at: string;
}

interface UseEmailListsReturn {
  lists: EmailList[];
  isLoading: boolean;
  error: string | null;
  refreshLists: () => Promise<void>;
  createList: (list: Partial<EmailList>) => Promise<EmailList | null>;
  updateList: (id: number, updates: Partial<EmailList>) => Promise<boolean>;
  deleteList: (id: number) => Promise<boolean>;
}

export function useEmailLists(): UseEmailListsReturn {
  const { settings } = useSettings();
  const [lists, setLists] = useState<EmailList[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLists = async () => {
    if (!settings?.organization_id) {
      setLists([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('email_lists')
        .select('*')
        .eq('organization_id', settings.organization_id)
        .order('name', { ascending: true });

      if (fetchError) throw fetchError;

      setLists(data || []);
    } catch (err) {
      console.error('Error fetching email lists:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch lists');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLists();
  }, [settings?.organization_id]);

  const refreshLists = async () => {
    await fetchLists();
  };

  const createList = async (list: Partial<EmailList>): Promise<EmailList | null> => {
    if (!settings?.organization_id) return null;

    try {
      const { data, error } = await supabase
        .from('email_lists')
        .insert({
          ...list,
          organization_id: settings.organization_id,
          subscriber_count: 0,
        })
        .select()
        .single();

      if (error) throw error;
      await refreshLists();
      return data;
    } catch (err) {
      console.error('Error creating list:', err);
      setError(err instanceof Error ? err.message : 'Failed to create list');
      return null;
    }
  };

  const updateList = async (id: number, updates: Partial<EmailList>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('email_lists')
        .update(updates)
        .eq('id', id)
        .eq('organization_id', settings!.organization_id);

      if (error) throw error;
      await refreshLists();
      return true;
    } catch (err) {
      console.error('Error updating list:', err);
      setError(err instanceof Error ? err.message : 'Failed to update list');
      return false;
    }
  };

  const deleteList = async (id: number): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('email_lists')
        .delete()
        .eq('id', id)
        .eq('organization_id', settings!.organization_id);

      if (error) throw error;
      await refreshLists();
      return true;
    } catch (err) {
      console.error('Error deleting list:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete list');
      return false;
    }
  };

  return {
    lists,
    isLoading,
    error,
    refreshLists,
    createList,
    updateList,
    deleteList,
  };
}
