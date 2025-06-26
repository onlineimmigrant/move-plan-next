'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Button from '@/ui/Button';
import AccountPaymentsReceiptTab from '@/components/AccountPaymentsReceiptTab';
import Toast from '@/components/Toast';
import Link from 'next/link';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import { useSettings } from '@/context/SettingsContext';


export interface Settings {
  site: string | null | undefined; // Simplified to match usage
  id: number;
  organization_id: string;
  image: string;
  menu_width: string;
  menu_items_are_text: boolean;
  footer_color: string;
  favicon: string | null;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string | null;
  seo_og_image: string | null;
  seo_twitter_card: string | null;
  seo_structured_data: any[] | null; // Use any[] for flexibility; can be typed stricter if needed
  domain: string;
 billing_panel_stripe: string;
}

// Custom Hook for Authentication (same as PaymentsPage)
const useAuth = () => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchSession = async () => {
      setIsLoading(true);
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw new Error(`Failed to fetch session: ${error.message}`);

        if (session) {
          setAccessToken(session.access_token);
          setUserId(session.user.id);
        } else {
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          if (refreshError || !refreshData.session) {
            throw new Error('No active session found. Please log in.');
          }
          setAccessToken(refreshData.session.access_token);
          setUserId(refreshData.session.user.id);
        }
      } catch (error) {
        console.error('useAuth error:', error);
        setError((error as Error).message);
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSession();
  }, [router]);

  return { accessToken, userId, isLoading, error };
};



export default function BillingPage() {
  const {  isLoading: authLoading } = useAuth();
   const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const isLoading = authLoading;
 
  const settings = useSettings();

  const settingsBillingPanelStripe = '14k6oScoJ4Hv4rS5kk';//temporary solution, should be used: settings?.billing_panel_stripe
  const settingsBilling = `https://billing.stripe.com/p/login/${settingsBillingPanelStripe}`;


  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-sky-600 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
          <div className="w-4 h-4 bg-sky-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-4 h-4 bg-sky-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Toast Notification */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
            aria-live="polite"
          />
        )}

        {/* Tabs Section */}
        <div className="pt-8">
          <AccountPaymentsReceiptTab />
        </div>

        <div className="mt-6 flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900">Billing</h2>
        </div>

        {/* Link to Stripe Billing */}
        <div className="mt-16 flex justify-center">
          <Link
            href={settingsBilling}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 text-sky-600 font-medium text-base underline hover:text-sky-800 transition-colors duration-150"
            aria-label="Manage your billing account on Stripe (opens in a new tab)"
          >
            <span>Manage your billing account</span>
            <ArrowRightIcon className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}