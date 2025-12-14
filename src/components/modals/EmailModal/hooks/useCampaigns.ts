'use client';

import { useState, useEffect } from 'react';
import { useEmailToast } from './useEmailToast';
import { supabase } from '@/lib/supabaseClient';
import { useSettings } from '@/context/SettingsContext';

interface EmailCampaign {
  id: number;
  organization_id: number;
  name: string;
  subject: string;
  body: string;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused';
  list_id: number | null;
  template_id: number | null;
  scheduled_at: string | null;
  sent_at: string | null;
  total_recipients: number;
  total_sent: number;
  total_opened: number;
  total_clicked: number;
  created_by: number;
  created_at: string;
  updated_at: string;
}

interface UseCampaignsReturn {
  campaigns: EmailCampaign[];
  isLoading: boolean;
  error: string | null;
  refreshCampaigns: () => Promise<void>;
  createCampaign: (campaign: Partial<EmailCampaign>) => Promise<EmailCampaign | null>;
  updateCampaign: (id: number, updates: Partial<EmailCampaign>) => Promise<boolean>;
  deleteCampaign: (id: number) => Promise<boolean>;
  sendCampaign: (id: number) => Promise<boolean>;
}

export function useCampaigns(): UseCampaignsReturn {
  const { settings } = useSettings();
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const toast = useEmailToast();

  const fetchCampaigns = async () => {
    if (!settings?.organization_id) {
      setCampaigns([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('email_campaigns')
        .select('*')
        .eq('organization_id', settings.organization_id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setCampaigns(data || []);

      // Set up realtime subscription
      const channel = supabase
        .channel('email_campaigns_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'email_campaigns',
            filter: `organization_id=eq.${settings.organization_id}`,
          },
          (payload) => {
            console.log('Campaign change detected:', payload);
            
            if (payload.eventType === 'INSERT') {
              setCampaigns((prev) => [payload.new as EmailCampaign, ...prev]);
            } else if (payload.eventType === 'UPDATE') {
              setCampaigns((prev) =>
                prev.map((campaign) =>
                  campaign.id === (payload.new as EmailCampaign).id
                    ? (payload.new as EmailCampaign)
                    : campaign
                )
              );
            } else if (payload.eventType === 'DELETE') {
              setCampaigns((prev) =>
                prev.filter((campaign) => campaign.id !== (payload.old as EmailCampaign).id)
              );
            }
          }
        )
        .subscribe();

      return () => {
        channel.unsubscribe();
      };
    } catch (err) {
      console.error('Error fetching campaigns:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch campaigns');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, [settings?.organization_id]);

  const refreshCampaigns = async () => {
    await fetchCampaigns();
  };

  const createCampaign = async (campaign: Partial<EmailCampaign>): Promise<EmailCampaign | null> => {
    if (!settings?.organization_id) return null;

    try {
      const { data, error } = await supabase
        .from('email_campaigns')
        .insert({
          ...campaign,
          organization_id: settings.organization_id,
          status: 'draft',
          total_recipients: 0,
          total_sent: 0,
          total_opened: 0,
          total_clicked: 0,
        })
        .select()
        .single();

      if (error) throw error;
      toast.success('Campaign created successfully');
      return data;
    } catch (err) {
      console.error('Error creating campaign:', err);
      const message = err instanceof Error ? err.message : 'Failed to create campaign';
      setError(message);
      toast.error(message);
      return null;
    }
  };

  const updateCampaign = async (id: number, updates: Partial<EmailCampaign>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('email_campaigns')
        .update(updates)
        .eq('id', id)
        .eq('organization_id', settings!.organization_id);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error updating campaign:', err);
      setError(err instanceof Error ? err.message : 'Failed to update campaign');
      return false;
    }
  };

  const deleteCampaign = async (id: number): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('email_campaigns')
        .delete()
        .eq('id', id)
        .eq('organization_id', settings!.organization_id);

      if (error) throw error;
      toast.success('Campaign deleted');
      return true;
    } catch (err) {
      console.error('Error deleting campaign:', err);
      const message = err instanceof Error ? err.message : 'Failed to delete campaign';
      setError(message);
      toast.error(message);
      return false;
    }
  };

  const sendCampaign = async (id: number): Promise<boolean> => {
    try {
      toast.info('Sending campaign...');
      
      const response = await fetch(`/api/email/campaigns/${id}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organization_id: settings!.organization_id }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      toast.success(`Campaign sent to ${result.total_sent || 0} recipients`);
      return true;
    } catch (err) {
      console.error('Error sending campaign:', err);
      const message = err instanceof Error ? err.message : 'Failed to send campaign';
      setError(message);
      toast.error(message);
      return false;
    }
  };

  return {
    campaigns,
    isLoading,
    error,
    refreshCampaigns,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    sendCampaign,
  };
}
