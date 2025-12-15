'use client';

import React, { useState, useEffect } from 'react';
import { X, ArrowLeft, ArrowRight, Mail, Users, Calendar, Eye, Send, Save } from 'lucide-react';
import Button from '@/ui/Button';
import { useEmailTemplates } from '../../hooks/useEmailTemplates';
import { useEmailLists } from '../../hooks/useEmailLists';
import { useCampaigns } from '../../hooks/useCampaigns';
import TemplateSelector from '../TransactionalView/TemplateSelector';
import RecipientSelector from '../TransactionalView/RecipientSelector';
import ABTestSetup from './ABTestSetup';
import SpamScoreChecker from './SpamScoreChecker';

// Wrapper to use marketing templates
function MarketingTemplateSelector({ selectedTemplateId, onSelectTemplate, primary }: any) {
  const { marketingTemplates, isLoading } = useEmailTemplates();
  
  if (isLoading) {
    return <div className="text-center py-8 text-gray-500">Loading templates...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {marketingTemplates.map((template) => (
        <div
          key={template.id}
          onClick={() => onSelectTemplate(template.id)}
          className={`bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl rounded-xl border p-4 cursor-pointer transition-all ${
            selectedTemplateId === template.id
              ? 'border-primary ring-2 ring-primary/20'
              : 'border-white/20 hover:bg-white/60 dark:hover:bg-gray-800/60'
          }`}
        >
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">{template.name}</h4>
          {template.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{template.description}</p>
          )}
        </div>
      ))}
      {marketingTemplates.length === 0 && (
        <div className="col-span-full text-center py-8 text-gray-500">
          No marketing templates available
        </div>
      )}
    </div>
  );
}

type Step = 'details' | 'template' | 'content' | 'recipients' | 'ab_test' | 'schedule' | 'review';

interface CampaignComposerProps {
  primary: { base: string; hover: string };
  onClose: () => void;
  editingCampaignId?: number | null;
}

interface CampaignData {
  name: string;
  subject: string;
  from_email: string;
  from_name: string;
  template_id: number | null;
  list_id: number | null;
  html_content: string;
  scheduled_at: string | null;
  send_now: boolean;
}

export default function CampaignComposer({ primary, onClose, editingCampaignId }: CampaignComposerProps) {
  const { marketingTemplates } = useEmailTemplates();
  const { lists } = useEmailLists();
  const { campaigns, createCampaign, updateCampaign } = useCampaigns();
  
  const [currentStep, setCurrentStep] = useState<Step>('details');
  const [campaignData, setCampaignData] = useState<CampaignData>({
    name: '',
    subject: '',
    from_email: '',
    from_name: '',
    template_id: null,
    list_id: null,
    html_content: '',
    scheduled_at: null,
    send_now: true,
  });
  const [showPreview, setShowPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load editing campaign
  useEffect(() => {
    if (editingCampaignId) {
      const campaign = campaigns.find((c) => c.id === editingCampaignId);
      if (campaign) {
        setCampaignData({
          name: campaign.name,
          subject: campaign.subject,
          from_email: '',
          from_name: '',
          template_id: campaign.template_id,
          list_id: campaign.list_id,
          html_content: campaign.body,
          scheduled_at: campaign.scheduled_at,
          send_now: !campaign.scheduled_at,
        });
      }
    }
  }, [editingCampaignId, campaigns]);

  const steps: { id: Step; label: string; icon: any }[] = [
    { id: 'details', label: 'Campaign Details', icon: Mail },
    { id: 'template', label: 'Template', icon: Mail },
    { id: 'content', label: 'Content', icon: Mail },
    { id: 'recipients', label: 'Recipients', icon: Users },
    { id: 'ab_test', label: 'A/B Test (Optional)', icon: Mail },
    { id: 'schedule', label: 'Schedule', icon: Calendar },
    { id: 'review', label: 'Review', icon: Eye },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);
  const canGoBack = currentStepIndex > 0;
  const canGoNext = currentStepIndex < steps.length - 1;

  const validateStep = (): boolean => {
    switch (currentStep) {
      case 'details':
        return !!(campaignData.name && campaignData.subject && campaignData.from_email);
      case 'template':
        return !!campaignData.template_id || !!campaignData.html_content;
      case 'content':
        return !!campaignData.html_content;
      case 'recipients':
        return !!campaignData.list_id;
      case 'ab_test':
        return true; // Optional step
      case 'schedule':
        return campaignData.send_now || !!campaignData.scheduled_at;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (!validateStep()) return;
    if (canGoNext) {
      setCurrentStep(steps[currentStepIndex + 1].id);
    }
  };

  const handleBack = () => {
    if (canGoBack) {
      setCurrentStep(steps[currentStepIndex - 1].id);
    }
  };

  const handleTemplateSelect = (templateId: number) => {
    const template = marketingTemplates.find((t) => t.id === templateId);
    if (template) {
      setCampaignData({
        ...campaignData,
        template_id: templateId,
        html_content: template.html_code || '',
        subject: template.subject || campaignData.subject,
      });
    }
  };

  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      if (editingCampaignId) {
        await updateCampaign(editingCampaignId, {
          name: campaignData.name,
          subject: campaignData.subject,
          body: campaignData.html_content,
          template_id: campaignData.template_id,
          list_id: campaignData.list_id,
          scheduled_at: campaignData.scheduled_at,
        });
      } else {
        await createCampaign({
          name: campaignData.name,
          subject: campaignData.subject,
          body: campaignData.html_content,
          template_id: campaignData.template_id,
          list_id: campaignData.list_id,
          scheduled_at: campaignData.scheduled_at,
          status: 'draft',
        });
      }
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleSend = async () => {
    if (!validateStep()) return;
    
    setIsSaving(true);
    try {
      const newCampaign = await createCampaign({
        name: campaignData.name,
        subject: campaignData.subject,
        body: campaignData.html_content,
        template_id: campaignData.template_id,
        list_id: campaignData.list_id,
        scheduled_at: campaignData.send_now ? null : campaignData.scheduled_at,
        status: campaignData.send_now ? 'sending' : 'scheduled',
      });

      if (newCampaign && campaignData.send_now) {
        // Campaign will be sent via background job or API
        // For now, just close
      }
      
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const selectedList = lists.find((l) => l.id === campaignData.list_id);
  const recipientCount = selectedList?.subscriber_count || 0;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white dark:bg-gray-900 rounded-none sm:rounded-2xl shadow-2xl w-full h-full sm:max-w-4xl sm:w-full sm:max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white truncate">
              {editingCampaignId ? 'Edit Campaign' : 'Create New Campaign'}
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
              Step {currentStepIndex + 1} of {steps.length}: {steps[currentStepIndex].label}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-4 sm:px-6 pt-3 sm:pt-4">
          <div className="hidden sm:flex items-center gap-2">
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                <div
                  className={`flex-1 h-2 rounded-full transition-all ${
                    index <= currentStepIndex
                      ? 'bg-gradient-to-r from-primary to-primary-hover'
                      : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                />
              </React.Fragment>
            ))}
          </div>
          {/* Mobile: Simple progress text */}
          <div className="sm:hidden text-center text-xs text-gray-500 dark:text-gray-400">
            Step {currentStepIndex + 1} of {steps.length}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* Step 1: Campaign Details */}
          {currentStep === 'details' && (
            <div className="space-y-4 max-w-2xl">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Campaign Name *
                </label>
                <input
                  type="text"
                  value={campaignData.name}
                  onChange={(e) => setCampaignData({ ...campaignData, name: e.target.value })}
                  placeholder="e.g., Summer Sale 2025"
                  className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Subject *
                </label>
                <input
                  type="text"
                  value={campaignData.subject}
                  onChange={(e) => setCampaignData({ ...campaignData, subject: e.target.value })}
                  placeholder="e.g., Get 50% Off This Summer!"
                  className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent min-h-[44px]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    From Email *
                  </label>
                  <input
                    type="email"
                    value={campaignData.from_email}
                    onChange={(e) => setCampaignData({ ...campaignData, from_email: e.target.value })}
                    placeholder="marketing@company.com"
                    className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    From Name
                  </label>
                  <input
                    type="text"
                    value={campaignData.from_name}
                    onChange={(e) => setCampaignData({ ...campaignData, from_name: e.target.value })}
                    placeholder="Your Company"
                    className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent min-h-[44px]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Template Selection */}
          {currentStep === 'template' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Choose a template or create custom HTML
                </p>
                <button
                  onClick={() => setCampaignData({ ...campaignData, template_id: null, html_content: '' })}
                  className="text-sm text-primary hover:text-primary-hover"
                >
                  Skip Template
                </button>
              </div>
              <MarketingTemplateSelector
                selectedTemplateId={campaignData.template_id || undefined}
                onSelectTemplate={handleTemplateSelect}
                primary={primary}
              />
            </div>
          )}

          {/* Step 3: Content Editor */}
          {currentStep === 'content' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email HTML Content
                </label>
                <Button onClick={() => setShowPreview(true)} variant="light-outline" size="sm">
                  <Eye className="w-4 h-4" />
                  Preview
                </Button>
              </div>
              <textarea
                value={campaignData.html_content}
                onChange={(e) => setCampaignData({ ...campaignData, html_content: e.target.value })}
                placeholder="Enter HTML content or edit template..."
                rows={20}
                className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-mono text-sm"
              />
            </div>
          )}

          {/* Step 4: Recipients */}
          {currentStep === 'recipients' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Subscriber List *
                </label>
                <select
                  value={campaignData.list_id || ''}
                  onChange={(e) => setCampaignData({ ...campaignData, list_id: Number(e.target.value) || null })}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">Choose a list...</option>
                  {lists.map((list) => (
                    <option key={list.id} value={list.id}>
                      {list.name} ({list.subscriber_count} subscribers)
                    </option>
                  ))}
                </select>
              </div>

              {campaignData.list_id && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-sm text-blue-700 dark:text-blue-400">
                    <Users className="w-4 h-4 inline mr-2" />
                    This campaign will be sent to <strong>{recipientCount}</strong> subscribers
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 5: A/B Testing */}
          {currentStep === 'ab_test' && (
            <div className="space-y-4">
              <ABTestSetup
                campaignData={campaignData}
                onUpdateCampaign={(updates) => setCampaignData({ ...campaignData, ...updates })}
                primary={primary}
              />
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                  A/B testing is optional. Click "Next" to skip and continue to scheduling.
                </p>
              </div>
            </div>
          )}

          {/* Step 6: Schedule */}
          {currentStep === 'schedule' && (
            <div className="space-y-4 max-w-2xl">
              <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <input
                  type="radio"
                  id="send-now"
                  checked={campaignData.send_now}
                  onChange={() => setCampaignData({ ...campaignData, send_now: true, scheduled_at: null })}
                  className="w-4 h-4 text-primary focus:ring-primary"
                />
                <label htmlFor="send-now" className="flex-1 cursor-pointer">
                  <div className="font-medium text-gray-900 dark:text-white">Send Now</div>
                  <div className="text-sm text-gray-500">Campaign will be sent immediately</div>
                </label>
              </div>

              <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <input
                  type="radio"
                  id="schedule"
                  checked={!campaignData.send_now}
                  onChange={() => setCampaignData({ ...campaignData, send_now: false })}
                  className="w-4 h-4 text-primary focus:ring-primary"
                />
                <label htmlFor="schedule" className="flex-1 cursor-pointer">
                  <div className="font-medium text-gray-900 dark:text-white">Schedule for Later</div>
                  <div className="text-sm text-gray-500">Choose a specific date and time</div>
                </label>
              </div>

              {!campaignData.send_now && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Schedule Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={campaignData.scheduled_at || ''}
                    onChange={(e) => setCampaignData({ ...campaignData, scheduled_at: e.target.value })}
                    min={new Date().toISOString().slice(0, 16)}
                    className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              )}
            </div>
          )}

          {/* Step 7: Review */}
          {currentStep === 'review' && (
            <div className="space-y-6">
              {/* Spam Score Checker */}
              <SpamScoreChecker
                subject={campaignData.subject}
                htmlContent={campaignData.html_content}
                fromEmail={campaignData.from_email}
              />

              <div className="bg-gradient-to-r from-primary/10 to-primary-hover/10 border border-primary/20 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Campaign Summary</h3>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Name:</span>
                    <p className="font-medium text-gray-900 dark:text-white">{campaignData.name}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Subject:</span>
                    <p className="font-medium text-gray-900 dark:text-white">{campaignData.subject}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">From:</span>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {campaignData.from_name || campaignData.from_email}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Recipients:</span>
                    <p className="font-medium text-gray-900 dark:text-white">{recipientCount} subscribers</p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Send Time:</span>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {campaignData.send_now
                        ? 'Immediately'
                        : campaignData.scheduled_at
                        ? new Date(campaignData.scheduled_at).toLocaleString()
                        : 'Not set'}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900 dark:text-white">Email Preview</h4>
                  <Button onClick={() => setShowPreview(true)} variant="light-outline" size="sm">
                    <Eye className="w-4 h-4" />
                    Full Preview
                  </Button>
                </div>
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden max-h-96">
                  <iframe
                    srcDoc={`<!DOCTYPE html><html><head><style>* { box-sizing: border-box; }</style></head><body>${campaignData.html_content}</body></html>`}
                    className="w-full h-96"
                    sandbox="allow-same-origin"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-2">
            {canGoBack && (
              <Button onClick={handleBack} variant="light-outline" size="sm">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSaveDraft} variant="light-outline" disabled={isSaving}>
              <Save className="w-4 h-4" />
              Save Draft
            </Button>
            
            {canGoNext ? (
              <Button onClick={handleNext} variant="primary" disabled={!validateStep()}>
                Next
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button onClick={handleSend} variant="primary" disabled={!validateStep() || isSaving}>
                <Send className="w-4 h-4" />
                {campaignData.send_now ? 'Send Campaign' : 'Schedule Campaign'}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Email Preview</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <iframe
                srcDoc={`<!DOCTYPE html><html><head><style>* { box-sizing: border-box; margin: 0; padding: 0; }</style></head><body>${campaignData.html_content}</body></html>`}
                className="w-full h-full"
                sandbox="allow-same-origin"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
