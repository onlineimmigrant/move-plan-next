'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Button from '@/ui/Button';
import { 
  Globe, 
  Copy, 
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  RefreshCw,
  Save
} from 'lucide-react';

interface DomainSetupProps {
  primary: { base: string; hover: string };
  onMobileActionsChange?: (actions: React.ReactNode) => void;
}

interface Settings {
  domain?: string;
  [key: string]: any;
}

interface DnsRecord {
  type: string;
  name: string;
  value: string;
  description: string;
  verified?: boolean;
}

export default function DomainSetup({ primary, onMobileActionsChange }: DomainSetupProps) {
  const [domain, setDomain] = useState('');
  const [settings, setSettings] = useState<Settings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [saveResult, setSaveResult] = useState<{ success: boolean; message: string } | null>(null);
  const [dnsRecords, setDnsRecords] = useState<DnsRecord[]>([]);

  // Provide mobile action button (Verify)
  useEffect(() => {
    if (onMobileActionsChange) {
      onMobileActionsChange(
        <div className="flex lg:justify-end">
          <Button
            onClick={handleVerify}
            disabled={isChecking}
            variant="primary"
            size="sm"
            className="w-full lg:w-auto flex items-center gap-2"
          >
            {isChecking ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Verify
          </Button>
        </div>
      );
    }
    return () => {
      if (onMobileActionsChange) {
        onMobileActionsChange(null);
      }
    };
  }, [isChecking, onMobileActionsChange]);

  // Fetch domain from settings table
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) throw new Error('Not authenticated');

        const { data: profile } = await supabase
          .from('profiles')
          .select('organization_id')
          .eq('id', userData.user.id)
          .single();

        if (!profile) throw new Error('Profile not found');

        const { data: settingsData, error: fetchError } = await supabase
          .from('settings')
          .select('domain')
          .eq('organization_id', profile.organization_id)
          .single();

        if (fetchError) throw fetchError;
        
        setSettings(settingsData);
        if (settingsData?.domain) {
          setDomain(settingsData.domain);
          // Check verification status for the domain
          checkVerification(settingsData.domain, profile.organization_id);
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setSaveResult(null);
      
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', userData.user.id)
        .single();

      if (!profile) throw new Error('Profile not found');

      const { error: updateError } = await supabase
        .from('settings')
        .update({ domain })
        .eq('organization_id', profile.organization_id);

      if (updateError) throw updateError;

      setSaveResult({ success: true, message: 'Domain saved successfully' });
      setSettings({ ...settings, domain });
      
      // Reset verification status and check the new domain
      setIsVerified(false);
      setDnsRecords([]);
      await checkVerification(domain, profile.organization_id);
    } catch (error) {
      console.error('Failed to save domain:', error);
      setSaveResult({ success: false, message: 'Failed to save domain' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopy = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const checkVerification = async (domainToCheck: string, orgId: string) => {
    try {
      const response = await fetch('/api/email/verify-domain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          domain: domainToCheck, 
          organization_id: orgId 
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setIsVerified(data.verified || false);
        if (data.records && data.records.length > 0) {
          setDnsRecords(data.records);
        }
      }
    } catch (error) {
      console.error('Verification check error:', error);
    }
  };

  const handleVerify = async () => {
    if (!domain) return;
    
    setIsChecking(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', userData.user.id)
        .single();

      if (!profile) throw new Error('Profile not found');

      const response = await fetch('/api/email/verify-domain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          domain, 
          organization_id: profile.organization_id 
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setIsVerified(data.verified || false);
        if (data.records && data.records.length > 0) {
          setDnsRecords(data.records);
        }
      } else {
        setIsVerified(false);
      }
    } catch (error) {
      console.error('Domain verification error:', error);
      setIsVerified(false);
    } finally {
      setIsChecking(false);
    }
  };

  const dnsProviders = [
    {
      name: 'Cloudflare',
      icon: '☁️',
      steps: [
        'Log in to your Cloudflare dashboard',
        'Select your domain',
        'Go to DNS settings',
        'Click "Add record"',
        'Add the DNS records shown above',
        'Save changes',
      ],
    },
    {
      name: 'GoDaddy',
      icon: '🌐',
      steps: [
        'Sign in to GoDaddy',
        'Go to Domain Settings',
        'Click "Manage DNS"',
        'Add new TXT records',
        'Copy values from above',
        'Save records',
      ],
    },
    {
      name: 'Namecheap',
      icon: '🏷️',
      steps: [
        'Log in to Namecheap',
        'Go to Domain List',
        'Click "Manage"',
        'Go to "Advanced DNS"',
        'Add new TXT records',
        'Wait for propagation (up to 48 hours)',
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Verification Status */}
      {!isLoading && domain && (
        <div className={`bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl rounded-xl border p-6 ${
          isVerified ? 'border-green-300 dark:border-green-700' : 'border-yellow-300 dark:border-yellow-700'
        }`}>
          <div className="flex items-center gap-3">
            {isVerified ? (
              <>
                <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-green-600 dark:text-green-400" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Domain Verified</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Your domain is ready to send emails.</p>
                </div>
              </>
            ) : (
              <>
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-yellow-600 dark:text-yellow-400" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Domain Not Verified</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Please add the DNS records below to verify your domain.</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Domain Input */}
      <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl rounded-xl border border-white/20 p-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Sender Domain
        </label>
        
        {isLoading ? (
          <div className="flex items-center gap-2 text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Loading domain...</span>
          </div>
        ) : (
          <>
            {/* Domain Input */}
            <div className="flex flex-col gap-3 mb-3">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="yourdomain.com"
                  className="flex-1 px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
                {/* Save button - desktop inline */}
                <Button
                  onClick={handleSave}
                  disabled={isSaving || domain === settings?.domain}
                  variant="primary"
                  size="default"
                  className="hidden lg:flex"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span className="ml-2">Save</span>
                </Button>
              </div>
              
              {/* Save button - mobile below input */}
              <Button
                onClick={handleSave}
                disabled={isSaving || domain === settings?.domain}
                variant="primary"
                size="default"
                className="lg:hidden w-full justify-center"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span className="ml-2">Save</span>
              </Button>

              {/* Verify button - desktop only (mobile in footer) */}
              <Button
                onClick={handleVerify}
                disabled={isChecking}
                variant="primary"
                size="default"
                className="hidden lg:flex w-full justify-center"
              >
                {isChecking ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                <span className="ml-2">Verify</span>
              </Button>
            </div>
            
            {/* Checking Status */}
            {isChecking && (
              <div className="flex items-center gap-2 p-3 rounded-lg text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Checking domain verification status with AWS SES...</span>
              </div>
            )}
            
            {/* Save Result */}
            {saveResult && (
              <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
                saveResult.success 
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                  : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
              }`}>
                {saveResult.success ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
                {saveResult.message}
              </div>
            )}
          </>
        )}
      </div>

      {/* DNS Records */}
      {!isLoading && dnsRecords.length > 0 && (
          <div className="space-y-4">
            <div>
              <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                DNS Records
              </h4>
              {!isVerified && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Add these DNS records to your domain provider to enable email sending. After adding them, click the Verify button to check the status.
                </p>
              )}
              {isVerified && (
                <p className="text-sm text-green-600 dark:text-green-400 mb-3">
                  Your domain is verified! Make sure all DNS records below are properly configured for best email deliverability.
                </p>
              )}
            </div>
            {dnsRecords.map((record, index) => {
              const recordKey = `${record.type}-${record.name}`;
              // Keep unverified records expanded by default
              const isExpanded = expandedSection === recordKey || (!record.verified && expandedSection !== recordKey);
              
              return (
          <div
            key={recordKey}
            className={`bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl rounded-xl border p-4 ${
              record.verified 
                ? 'border-green-300 dark:border-green-700' 
                : 'border-yellow-300 dark:border-yellow-700'
            }`}
          >
            <div 
              className="flex items-start justify-between cursor-pointer"
              onClick={() => setExpandedSection(isExpanded ? null : recordKey)}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {record.verified && (
                    <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                  )}
                  <span className="px-2 py-1 text-xs font-semibold bg-primary/10 text-primary rounded">
                    {record.type}
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    Record {record.verified && '✓'}
                  </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {record.description}
                </p>
              </div>
              <button className="ml-2 p-1">
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </button>
            </div>

            {isExpanded && (
              <div className="space-y-2 mt-3">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500 dark:text-gray-500">Type:</span>
                    <p className="font-medium text-gray-900 dark:text-white">{record.type}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-500">Name:</span>
                    <p className="font-medium text-gray-900 dark:text-white">{record.name}</p>
                  </div>
                </div>

                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-500">Value:</span>
                  <div className="flex gap-2 mt-1">
                    <input
                      type="text"
                      value={record.value}
                      readOnly
                      className="flex-1 px-3 py-2 text-xs bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded font-mono"
                    />
                    <button
                      onClick={() => handleCopy(record.value, record.type)}
                      className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      {copiedField === record.type ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
              );
            })}
          </div>
      )}

      {/* DNS Provider Instructions */}
      {!isLoading && dnsRecords.length > 0 && (
        <>
          <div className="space-y-4">
            <h4 className="text-base font-semibold text-gray-900 dark:text-white">
              Provider-Specific Instructions
            </h4>
            {dnsProviders.map((provider) => (
          <div
            key={provider.name}
            className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl rounded-xl border border-white/20 overflow-hidden"
          >
            <button
              onClick={() => setExpandedSection(expandedSection === provider.name ? null : provider.name)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{provider.icon}</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {provider.name}
                </span>
              </div>
              {expandedSection === provider.name ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>

            {expandedSection === provider.name && (
              <div className="px-4 pb-4 pt-2 border-t border-white/20">
                <ol className="space-y-2">
                  {provider.steps.map((step, index) => (
                    <li key={index} className="flex gap-3 text-sm text-gray-700 dark:text-gray-300">
                      <span className="flex-shrink-0 w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-semibold">
                        {index + 1}
                      </span>
                      <span className="pt-0.5">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Help Text */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex gap-3">
          <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800 dark:text-blue-300 space-y-2">
            <p className="font-medium">Why DNS verification is important:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Improves email deliverability and reduces spam scores</li>
              <li>Authenticates your domain as the legitimate sender</li>
              <li>Protects your brand from email spoofing</li>
              <li>Required by most email providers (Gmail, Outlook, etc.)</li>
              <li>DNS changes can take up to 48 hours to propagate</li>
            </ul>
            <a
              href="https://docs.aws.amazon.com/ses/latest/dg/dns-txt-records.html"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline mt-2"
            >
              Learn more about DNS records
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
        </>
      )}    </div>
  );
}