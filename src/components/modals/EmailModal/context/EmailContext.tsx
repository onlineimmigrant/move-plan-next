'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { EmailBranding, EmailAccount } from '../types';

interface EmailContextType {
  emailBranding: EmailBranding | null;
  emailAccounts: EmailAccount[];
  primaryAccount: EmailAccount | null;
  isLoading: boolean;
  refreshBranding: () => Promise<void>;
  refreshAccounts: () => Promise<void>;
}

const EmailContext = createContext<EmailContextType | undefined>(undefined);

export function EmailProvider({ children }: { children: React.ReactNode }) {
  const [emailBranding, setEmailBranding] = useState<EmailBranding | null>(null);
  const [emailAccounts, setEmailAccounts] = useState<EmailAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshBranding = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', userData.user.id)
        .single();

      if (!profile) return;

      const { data, error } = await supabase
        .rpc('get_email_branding', { org_id: profile.organization_id });

      if (!error && data) {
        setEmailBranding(data as EmailBranding);
      }
    } catch (error) {
      console.error('Error fetching email branding:', error);
    }
  };

  const refreshAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from('email_accounts')
        .select('*')
        .eq('is_active', true)
        .order('is_primary', { ascending: false });

      if (!error && data) {
        setEmailAccounts(data as EmailAccount[]);
      }
    } catch (error) {
      console.error('Error fetching email accounts:', error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      await Promise.all([refreshBranding(), refreshAccounts()]);
      setIsLoading(false);
    };

    fetchData();
  }, []);

  const primaryAccount = emailAccounts.find(acc => acc.is_primary) || emailAccounts[0] || null;

  return (
    <EmailContext.Provider
      value={{
        emailBranding,
        emailAccounts,
        primaryAccount,
        isLoading,
        refreshBranding,
        refreshAccounts,
      }}
    >
      {children}
    </EmailContext.Provider>
  );
}

export function useEmailContext() {
  const context = useContext(EmailContext);
  if (context === undefined) {
    throw new Error('useEmailContext must be used within EmailProvider');
  }
  return context;
}
