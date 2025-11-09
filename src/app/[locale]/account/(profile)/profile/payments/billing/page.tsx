'use client';

import Link from 'next/link';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import { useSettings } from '@/context/SettingsContext';
import TableSkeleton from '@/components/skeletons/TableSkeleton';
import { useAccountTranslations } from '@/components/accountTranslationLogic/useAccountTranslations';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useAccountAuth } from '@/hooks/useAccountAuth';

export default function BillingPage() {
  const { isLoading } = useAccountAuth();
  const { t } = useAccountTranslations();
  const themeColors = useThemeColors();
  const primary = themeColors.cssVars.primary;
  const { settings } = useSettings();

  const settingsBillingPanelStripe = settings?.billing_panel_stripe || '14k6oScoJ4Hv4rS5kk';
  const settingsBilling = `https://billing.stripe.com/p/login/${settingsBillingPanelStripe}`;

  if (isLoading) {
    return (
      <div className="min-h-screen p-6">
        <TableSkeleton rows={3} columns={1} />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Page Header */}
      <div className="mb-8">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-gray-700/30 p-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t.billing}
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {t.billingAccountManagement}
          </p>
        </div>
      </div>

      {/* Link to Stripe Billing */}
      <div className="mt-16 flex justify-center">
        <Link
          href={settingsBilling}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center space-x-2 font-medium text-base underline hover:opacity-80 transition-colors duration-150"
          style={{ color: primary.base }}
          aria-label="Manage your billing account on Stripe (opens in a new tab)"
        >
          <span>Manage your billing account</span>
          <ArrowRightIcon className="h-5 w-5" />
        </Link>
      </div>
    </div>
  );
}