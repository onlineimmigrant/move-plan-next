'use client';

import React, { useState, useEffect } from 'react';
import { useSESConfiguration } from '../../hooks/useSESConfiguration';
import Button from '@/ui/Button';
import { Save, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface SenderAddressesProps {
  primary: { base: string; hover: string };
  onMobileActionsChange?: (actions: React.ReactNode) => void;
}

export default function SenderAddresses({ primary, onMobileActionsChange }: SenderAddressesProps) {
  const { config, isLoading, updateConfig } = useSESConfiguration();
  const [formData, setFormData] = useState({
    transactional_email: '',
    marketing_email: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<{ success: boolean; message: string } | null>(null);

  React.useEffect(() => {
    if (config) {
      setFormData({
        transactional_email: config.transactional_email || '',
        marketing_email: config.marketing_email || '',
      });
    }
  }, [config]);

  // Provide mobile action button (Save)
  useEffect(() => {
    if (onMobileActionsChange) {
      onMobileActionsChange(
        <div className="flex lg:justify-end">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            variant="primary"
            className="w-full lg:w-auto flex items-center gap-2"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save
          </Button>
        </div>
      );
    }
    return () => {
      if (onMobileActionsChange) {
        onMobileActionsChange(null);
      }
    };
  }, [isSaving, primary, onMobileActionsChange]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveResult(null);
    
    try {
      await updateConfig({
        ...config,
        transactional_email: formData.transactional_email,
        marketing_email: formData.marketing_email,
      });
      setSaveResult({ success: true, message: 'Sender addresses saved successfully' });
    } catch (error) {
      setSaveResult({ success: false, message: 'Failed to save sender addresses' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Configuration Form */}
      <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl rounded-xl border border-white/20 p-6 space-y-6">
        {/* Transactional Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Transactional Email Address
          </label>
          <input
            type="email"
            value={formData.transactional_email}
            onChange={(e) => setFormData({ ...formData, transactional_email: e.target.value })}
            placeholder="noreply@yourdomain.com"
            className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          />
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            Used for password resets, order confirmations, notifications, etc.
          </p>
        </div>

        {/* Marketing Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Marketing Email Address
          </label>
          <input
            type="email"
            value={formData.marketing_email}
            onChange={(e) => setFormData({ ...formData, marketing_email: e.target.value })}
            placeholder="newsletter@yourdomain.com"
            className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          />
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            Used for newsletters, promotions, and marketing campaigns
          </p>
        </div>

        {/* Save Result */}
        {saveResult && (
          <div
            className={`flex items-center gap-3 p-4 rounded-lg ${
              saveResult.success
                ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
            }`}
          >
            {saveResult.success ? (
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
            )}
            <p className="text-sm">{saveResult.message}</p>
          </div>
        )}
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="text-sm text-blue-800 dark:text-blue-300 space-y-2">
          <p className="font-medium">About Sender Addresses</p>
          <p>
            These email addresses will be used as the "From" address when sending emails. 
            Make sure these addresses are verified in your email service provider (AWS SES, Gmail, or Outlook).
          </p>
        </div>
      </div>
    </div>
  );
}
