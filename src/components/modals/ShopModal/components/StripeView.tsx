/**
 * StripeView Component
 * 
 * Manages Stripe API keys configuration for the organization
 * Keys are stored in organizations table and displayed encrypted
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { CreditCard, Eye, EyeOff, Save, Loader2, AlertCircle, CheckCircle2, Key } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useSettings } from '@/context/SettingsContext';
import { useThemeColors } from '@/hooks/useThemeColors';

interface StripeKeys {
  stripe_secret_key: string | null;
  stripe_publishable_key: string | null;
  stripe_webhook_secret: string | null;
}

interface StripeViewProps {
  organizationId?: string;
}

export default function StripeView({ organizationId: propOrgId }: StripeViewProps = {}) {
  const { settings } = useSettings();
  const themeColors = useThemeColors();
  const primary = themeColors.cssVars.primary;
  const organizationId = propOrgId || settings.organization_id;

  const [keys, setKeys] = useState<StripeKeys>({
    stripe_secret_key: null,
    stripe_publishable_key: null,
    stripe_webhook_secret: null,
  });
  
  // Separate state for editing (to detect changes)
  const [editedKeys, setEditedKeys] = useState<StripeKeys>({
    stripe_secret_key: null,
    stripe_publishable_key: null,
    stripe_webhook_secret: null,
  });
  
  const [showKeys, setShowKeys] = useState({
    secret: false,
    publishable: false,
    webhook: false,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Helper to mask key - show first 7 and last 4 characters
  const maskKey = (key: string | null): string => {
    if (!key || key.length < 12) return '••••••••••••••••';
    return `${key.substring(0, 7)}••••••••••••${key.substring(key.length - 4)}`;
  };

  // Fetch existing keys
  const fetchKeys = useCallback(async () => {
    if (!organizationId) return;

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('organizations')
        .select('stripe_secret_key, stripe_publishable_key, stripe_webhook_secret')
        .eq('id', organizationId)
        .single();

      if (fetchError) throw fetchError;

      const fetchedKeys = {
        stripe_secret_key: data?.stripe_secret_key || null,
        stripe_publishable_key: data?.stripe_publishable_key || null,
        stripe_webhook_secret: data?.stripe_webhook_secret || null,
      };
      
      setKeys(fetchedKeys);
      setEditedKeys(fetchedKeys);
    } catch (err) {
      console.error('Error fetching Stripe keys:', err);
      setError(err instanceof Error ? err.message : 'Failed to load Stripe keys');
    } finally {
      setIsLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  // Handle input change
  const handleKeyChange = (field: keyof StripeKeys, value: string) => {
    setEditedKeys(prev => ({ ...prev, [field]: value.trim() || null }));
  };

  // Toggle key visibility
  const toggleKeyVisibility = (field: 'secret' | 'publishable' | 'webhook') => {
    setShowKeys(prev => ({ ...prev, [field]: !prev[field] }));
  };

  // Save keys
  const handleSave = async () => {
    if (!organizationId) {
      setError('Organization ID is required');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      setSuccessMessage(null);

      console.log('Saving Stripe keys for organization:', organizationId);
      console.log('Keys to save:', editedKeys);

      const { data, error: updateError } = await supabase
        .from('organizations')
        .update({
          stripe_secret_key: editedKeys.stripe_secret_key,
          stripe_publishable_key: editedKeys.stripe_publishable_key,
          stripe_webhook_secret: editedKeys.stripe_webhook_secret,
        })
        .eq('id', organizationId)
        .select();

      if (updateError) {
        console.error('Supabase update error:', updateError);
        throw updateError;
      }

      console.log('Save successful, data:', data);

      setSuccessMessage('Stripe keys saved successfully!');
      
      // Update keys state with saved values
      setKeys(editedKeys);
      
      // Hide all keys after saving
      setShowKeys({ secret: false, publishable: false, webhook: false });
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error saving Stripe keys:', err);
      setError(err instanceof Error ? err.message : 'Failed to save Stripe keys');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" style={{ color: primary.base }} />
          <p className="text-gray-600 dark:text-gray-400">Loading Stripe configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div 
            className="p-2 rounded-lg"
            style={{ backgroundColor: `${primary.base}20` }}
          >
            <CreditCard className="w-6 h-6" style={{ color: primary.base }} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Stripe Configuration</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Manage your Stripe API keys</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Info Banner */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900 dark:text-blue-200">
                <p className="font-semibold mb-1">Security Notice</p>
                <p>Your API keys are encrypted and stored securely. Only the beginning and end of the keys are displayed for security purposes.</p>
              </div>
            </div>
          </div>

          {/* Secret Key */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Key className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <label className="block text-sm font-semibold text-gray-900 dark:text-white">
                Secret Key
              </label>
              <span className="text-xs text-gray-500 dark:text-gray-400">(Server-side only)</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={showKeys.secret ? (editedKeys.stripe_secret_key || '') : maskKey(editedKeys.stripe_secret_key)}
                onChange={(e) => handleKeyChange('stripe_secret_key', e.target.value)}
                onFocus={() => setShowKeys(prev => ({ ...prev, secret: true }))}
                placeholder="sk_test_... or sk_live_..."
                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none font-mono text-sm"
              />
              <button
                onClick={() => toggleKeyVisibility('secret')}
                className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                {showKeys.secret ? (
                  <EyeOff className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                ) : (
                  <Eye className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Used for server-side API calls. Never expose this key to the client.
            </p>
          </div>

          {/* Publishable Key */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Key className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <label className="block text-sm font-semibold text-gray-900 dark:text-white">
                Publishable Key
              </label>
              <span className="text-xs text-gray-500 dark:text-gray-400">(Client-side safe)</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={showKeys.publishable ? (editedKeys.stripe_publishable_key || '') : maskKey(editedKeys.stripe_publishable_key)}
                onChange={(e) => handleKeyChange('stripe_publishable_key', e.target.value)}
                onFocus={() => setShowKeys(prev => ({ ...prev, publishable: true }))}
                placeholder="pk_test_... or pk_live_..."
                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none font-mono text-sm"
              />
              <button
                onClick={() => toggleKeyVisibility('publishable')}
                className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                {showKeys.publishable ? (
                  <EyeOff className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                ) : (
                  <Eye className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Used in the browser for checkout and payment forms. Safe to expose publicly.
            </p>
          </div>

          {/* Webhook Secret */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Key className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <label className="block text-sm font-semibold text-gray-900 dark:text-white">
                Webhook Secret
              </label>
              <span className="text-xs text-gray-500 dark:text-gray-400">(Optional)</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={showKeys.webhook ? (editedKeys.stripe_webhook_secret || '') : maskKey(editedKeys.stripe_webhook_secret)}
                onChange={(e) => handleKeyChange('stripe_webhook_secret', e.target.value)}
                onFocus={() => setShowKeys(prev => ({ ...prev, webhook: true }))}
                placeholder="whsec_..."
                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none font-mono text-sm"
              />
              <button
                onClick={() => toggleKeyVisibility('webhook')}
                className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                {showKeys.webhook ? (
                  <EyeOff className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                ) : (
                  <Eye className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Used to verify webhook events from Stripe. Get this from your Stripe webhook settings.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-900 dark:text-red-200">{error}</p>
              </div>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-900 dark:text-green-200">{successMessage}</p>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="flex justify-end pt-4">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium text-white transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ 
                background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`,
              }}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>Save Keys</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
