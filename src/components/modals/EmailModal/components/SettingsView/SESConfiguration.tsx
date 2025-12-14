'use client';

import React, { useState, useEffect } from 'react';
import { useSESConfiguration } from '../../hooks/useSESConfiguration';
import Button from '@/ui/Button';
import { 
  Cloud, 
  Save, 
  TestTube2, 
  Loader2,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const AWS_REGIONS = [
  { value: 'us-east-1', label: 'US East (N. Virginia)' },
  { value: 'us-east-2', label: 'US East (Ohio)' },
  { value: 'us-west-1', label: 'US West (N. California)' },
  { value: 'us-west-2', label: 'US West (Oregon)' },
  { value: 'eu-west-1', label: 'EU (Ireland)' },
  { value: 'eu-west-2', label: 'EU (London)' },
  { value: 'eu-central-1', label: 'EU (Frankfurt)' },
  { value: 'ap-south-1', label: 'Asia Pacific (Mumbai)' },
  { value: 'ap-southeast-1', label: 'Asia Pacific (Singapore)' },
  { value: 'ap-southeast-2', label: 'Asia Pacific (Sydney)' },
  { value: 'ap-northeast-1', label: 'Asia Pacific (Tokyo)' },
];

interface SESConfigurationProps {
  primary: { base: string; hover: string };
  onMobileActionsChange?: (actions: React.ReactNode) => void;
}

export default function SESConfiguration({ primary, onMobileActionsChange }: SESConfigurationProps) {
  const { config, isLoading, updateConfig, testConnection } = useSESConfiguration();
  const [formData, setFormData] = useState({
    ses_access_key_id: '',
    ses_secret_access_key: '',
    ses_region: 'us-east-1',
    transactional_email: '',
    marketing_email: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [showCustomSettings, setShowCustomSettings] = useState(false);
  const [showCredentialsAccordion, setShowCredentialsAccordion] = useState(false);

  React.useEffect(() => {
    if (config) {
      setFormData({
        ses_access_key_id: config.ses_access_key_id || '',
        ses_secret_access_key: config.ses_secret_access_key || '',
        ses_region: config.ses_region || 'us-east-1',
        transactional_email: config.transactional_email || '',
        marketing_email: config.marketing_email || '',
      });
    }
  }, [config]);

  // Provide mobile action buttons (Test and Save) - only when custom settings enabled
  useEffect(() => {
    if (onMobileActionsChange && showCustomSettings) {
      onMobileActionsChange(
        <div className="flex gap-2 lg:justify-end">
          <Button
            onClick={handleTest}
            disabled={isTesting || !formData.ses_access_key_id || !formData.ses_secret_access_key}
            variant="light-outline"
            className="flex-1 lg:flex-initial flex items-center gap-2"
          >
            {isTesting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <TestTube2 className="w-4 h-4" />
            )}
            Test
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            variant="primary"
            className="flex-1 lg:flex-initial flex items-center gap-2"
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
    } else if (onMobileActionsChange) {
      onMobileActionsChange(null);
    }
    return () => {
      if (onMobileActionsChange) {
        onMobileActionsChange(null);
      }
    };
  }, [isSaving, isTesting, showCustomSettings, formData.ses_access_key_id, formData.ses_secret_access_key, primary, onMobileActionsChange]);

  const handleSave = async () => {
    setIsSaving(true);
    setTestResult(null);
    try {
      await updateConfig(formData);
      setTestResult({ success: true, message: 'Configuration saved successfully' });
    } catch (error) {
      setTestResult({ success: false, message: 'Failed to save configuration' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    setIsTesting(true);
    try {
      const result = await testConnection();
      setTestResult(result);
    } catch (error) {
      setTestResult({ success: false, message: 'Connection test failed' });
    } finally {
      setIsTesting(false);
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
      {/* Default Info Card */}
      {!showCustomSettings && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
          <div className="flex gap-3">
            <Cloud className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-blue-800 dark:text-blue-300 mb-4">
                By default, we provide AWS SES settings for sending emails. You can use your own AWS account if you need custom configuration or higher sending limits.
              </p>
              <button
                onClick={() => {
                  setShowCustomSettings(true);
                  setShowCredentialsAccordion(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-blue-300 dark:border-blue-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/40 transition-colors text-sm font-medium text-blue-700 dark:text-blue-300"
              >
                <Cloud className="w-4 h-4" />
                Use Custom AWS SES
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom AWS Settings Section */}
      {showCustomSettings && (
        <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl rounded-lg space-y-6">
          {/* AWS SES Credentials Accordion */}
          <div className="rounded-lg overflow-hidden">
            <button
              onClick={() => setShowCredentialsAccordion(!showCredentialsAccordion)}
              className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                AWS SES Credentials
              </span>
              {showCredentialsAccordion ? (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              )}
            </button>

            {showCredentialsAccordion && (
              <div className="p-4 space-y-4 bg-white dark:bg-gray-900/50">
                {/* Instructions Info Card */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex gap-3">
                    <Cloud className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-800 dark:text-blue-300 space-y-2">
                      <p className="font-medium">Custom AWS SES Configuration</p>
                      <p className="font-medium">How to get AWS SES credentials:</p>
                      <ol className="list-decimal list-inside space-y-1 ml-2">
                        <li>Sign in to AWS Console and go to IAM</li>
                        <li>Create a new user with programmatic access</li>
                        <li>Attach the "AmazonSESFullAccess" policy</li>
                        <li>Copy the Access Key ID and Secret Access Key</li>
                        <li>Verify your sender email addresses in SES console</li>
                      </ol>
                    </div>
                  </div>
                </div>
                  {/* Access Key ID */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      AWS Access Key ID *
                    </label>
                    <input
                      type="password"
                      value={formData.ses_access_key_id}
                      onChange={(e) => setFormData({ ...formData, ses_access_key_id: e.target.value })}
                      placeholder="••••••••••••••••••••"
                      className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    />
                  </div>

                  {/* Secret Access Key */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      AWS Secret Access Key *
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        value={formData.ses_secret_access_key}
                        onChange={(e) => setFormData({ ...formData, ses_secret_access_key: e.target.value })}
                        placeholder="••••••••••••••••••••••••••••••••"
                        className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  {/* Region */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      AWS Region *
                    </label>
                    <select
                      value={formData.ses_region}
                      onChange={(e) => setFormData({ ...formData, ses_region: e.target.value })}
                      className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    >
                      {AWS_REGIONS.map((region) => (
                        <option key={region.value} value={region.value}>
                          {region.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

          {/* Test Result */}
          {testResult && (
            <div
              className={`flex items-center gap-3 p-4 rounded-lg ${
                testResult.success
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
              )}
              <p className="text-sm">{testResult.message}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
