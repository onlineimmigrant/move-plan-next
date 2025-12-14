'use client';

import React, { useState, useEffect } from 'react';
import Button from '@/ui/Button';
import TemplateSelector from './TemplateSelector';
import EmailComposer from './EmailComposer';
import RecipientSelector from './RecipientSelector';
import ScheduleSender from './ScheduleSender';
import SentEmails from './SentEmails';
import { useSendEmail } from '../../hooks/useSendEmail';
import { 
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  History,
  ChevronUp,
  ChevronDown,
  Eye,
  Save,
  X
} from 'lucide-react';

type Step = 'template' | 'compose' | 'recipients' | 'send';

interface Recipient {
  email: string;
  name?: string;
  contact_id?: number;
}

interface TransactionalViewProps {
  primary: { base: string; hover: string };
  globalSearchQuery?: string;
  onMobileActionsChange?: (actions: React.ReactNode) => void;
}

export default function TransactionalView({ primary, globalSearchQuery = '', onMobileActionsChange }: TransactionalViewProps) {
  const { sendEmail, isSending } = useSendEmail();
  const [currentStep, setCurrentStep] = useState<Step>('template');
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [sendResult, setSendResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showSentEmails, setShowSentEmails] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [isDraftSaved, setIsDraftSaved] = useState(false);

  // Provide navigation buttons and History toggle for footer panel
  useEffect(() => {
    if (onMobileActionsChange) {
      const stepOrder: Step[] = ['template', 'compose', 'recipients', 'send'];
      const currentIndex = stepOrder.indexOf(currentStep);
      const canGoBack = currentIndex > 0;
      const canGoNext = canProceedToNextStep() && currentIndex < stepOrder.length - 1;

      onMobileActionsChange(
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowSentEmails(!showSentEmails)}
              variant="light-outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">History</span>
              {showSentEmails ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </Button>
            {isDraftSaved && (
              <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Draft saved
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {canGoBack && (
              <Button
                onClick={handleBackStep}
                variant="light-outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back</span>
              </Button>
            )}
            {currentStep === 'send' && (
              <Button
                onClick={() => setShowPreview(true)}
                variant="light-outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                <span className="hidden sm:inline">Preview</span>
              </Button>
            )}
            {canGoNext && (
              <Button
                onClick={handleNextStep}
                disabled={!canProceedToNextStep()}
                variant="primary"
                size="sm"
                className="flex items-center gap-2"
              >
                <span className="hidden sm:inline">Continue</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      );
    }
    return () => {
      if (onMobileActionsChange) {
        onMobileActionsChange(null);
      }
    };
  }, [currentStep, selectedTemplate, subject, body, recipients, showSentEmails, isDraftSaved, onMobileActionsChange]);

  const steps: { id: Step; label: string }[] = [
    { id: 'template', label: 'Select Template' },
    { id: 'compose', label: 'Compose' },
    { id: 'recipients', label: 'Recipients' },
    { id: 'send', label: 'Send' },
  ];

  const handleSelectTemplate = (templateId: number, template: any) => {
    setSelectedTemplate(template);
    setCurrentStep('compose');
  };

  const handleSendNow = async () => {
    setSendResult(null);
    const result = await sendEmail({
      template_id: selectedTemplate?.id,
      recipients,
      subject,
      body,
    });
    setSendResult(result);

    if (result.success) {
      // Show confirmation modal instead of auto-reset
      setShowConfirmReset(true);
    }
  };

  const handleConfirmReset = () => {
    setCurrentStep('template');
    setSelectedTemplate(null);
    setSubject('');
    setBody('');
    setRecipients([]);
    setSendResult(null);
    setShowConfirmReset(false);
    setIsDraftSaved(false);
  };

  const handleBackStep = () => {
    const stepOrder: Step[] = ['template', 'compose', 'recipients', 'send'];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1]);
    }
  };

  const handleSchedule = async (scheduleDate: string) => {
    setSendResult(null);
    const result = await sendEmail({
      template_id: selectedTemplate?.id,
      recipients,
      subject,
      body,
      schedule_at: scheduleDate,
    });
    setSendResult(result);

    if (result.success) {
      setShowConfirmReset(true);
    }
  };

  // Auto-save draft every 10 seconds
  useEffect(() => {
    if (!subject && !body && recipients.length === 0) return;

    const timer = setTimeout(() => {
      // Save to localStorage as draft
      localStorage.setItem('email_draft', JSON.stringify({
        selectedTemplate,
        subject,
        body,
        recipients,
        timestamp: new Date().toISOString()
      }));
      setIsDraftSaved(true);
      setTimeout(() => setIsDraftSaved(false), 2000);
    }, 10000);

    return () => clearTimeout(timer);
  }, [subject, body, recipients, selectedTemplate]);

  // Load draft on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem('email_draft');
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        const draftAge = Date.now() - new Date(draft.timestamp).getTime();
        // Only load if draft is less than 24 hours old
        if (draftAge < 86400000) {
          setSelectedTemplate(draft.selectedTemplate);
          setSubject(draft.subject);
          setBody(draft.body);
          setRecipients(draft.recipients);
          if (draft.selectedTemplate) setCurrentStep('compose');
        }
      } catch (e) {
        console.error('Failed to load draft:', e);
      }
    }
  }, []);

  // Prevent body scroll when modals are open
  useEffect(() => {
    if (showPreview || showConfirmReset) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showPreview, showConfirmReset]);

  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 'template':
        return selectedTemplate !== null;
      case 'compose':
        return subject.trim() !== '' && body.trim() !== '';
      case 'recipients':
        return recipients.length > 0;
      case 'send':
        return true;
      default:
        return false;
    }
  };

  const handleNextStep = () => {
    const stepOrder: Step[] = ['template', 'compose', 'recipients', 'send'];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex < stepOrder.length - 1) {
      setCurrentStep(stepOrder[currentIndex + 1]);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Progress Steps */}
      <div className="border-b border-white/20 p-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <button
                onClick={() => {
                  // Only allow navigation to completed steps
                  if (step.id === 'template' ||
                      (step.id === 'compose' && selectedTemplate) ||
                      (step.id === 'recipients' && selectedTemplate && subject && body) ||
                      (step.id === 'send' && selectedTemplate && subject && body && recipients.length > 0)) {
                    setCurrentStep(step.id);
                  }
                }}
                disabled={
                  (step.id === 'compose' && !selectedTemplate) ||
                  (step.id === 'recipients' && (!selectedTemplate || !subject || !body)) ||
                  (step.id === 'send' && (!selectedTemplate || !subject || !body || recipients.length === 0))
                }
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all relative ${
                  currentStep !== step.id
                    ? step.id === 'template' ||
                      (step.id === 'compose' && selectedTemplate) ||
                      (step.id === 'recipients' && selectedTemplate && subject && body) ||
                      (step.id === 'send' && selectedTemplate && subject && body && recipients.length > 0)
                      ? 'bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl hover:bg-white/60 dark:hover:bg-gray-800/60 text-gray-700 dark:text-gray-300 cursor-pointer'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed opacity-50'
                    : ''
                }`}
                style={currentStep === step.id ? {
                  background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`,
                  color: 'white',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                } : undefined}
              >
                <div className={`flex items-center justify-center w-6 h-6 rounded-full border-2 ${
                  // Show checkmark for completed steps
                  (step.id === 'template' && selectedTemplate) ||
                  (step.id === 'compose' && subject && body) ||
                  (step.id === 'recipients' && recipients.length > 0)
                    ? 'bg-green-500 border-green-500'
                    : currentStep === step.id
                    ? 'border-white'
                    : 'border-current'
                }`}>
                  {((step.id === 'template' && selectedTemplate) ||
                    (step.id === 'compose' && subject && body) ||
                    (step.id === 'recipients' && recipients.length > 0)) ? (
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  ) : (
                    <span className="text-xs font-semibold">{index + 1}</span>
                  )}
                </div>
                <span className="text-sm font-medium hidden md:inline">{step.label}</span>
              </button>
              {index < steps.length - 1 && (
                <ArrowRight className="w-4 h-4 text-gray-400" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto">
          {/* Send Result */}
          {sendResult && (
            <div
              className={`mb-6 flex items-center gap-3 p-4 rounded-lg ${
                sendResult.success
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
              }`}
            >
              {sendResult.success ? (
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
              )}
              <p className="text-sm">{sendResult.message}</p>
            </div>
          )}

          {/* Step Content */}
          {currentStep === 'template' && (
            <TemplateSelector
              onSelectTemplate={handleSelectTemplate}
              selectedTemplateId={selectedTemplate?.id}
              primary={primary}
              searchQuery={globalSearchQuery}
            />
          )}

          {currentStep === 'compose' && (
            <EmailComposer
              template={selectedTemplate}
              subject={subject}
              body={body}
              onSubjectChange={setSubject}
              onBodyChange={setBody}
            />
          )}

          {currentStep === 'recipients' && (
            <RecipientSelector
              recipients={recipients}
              onRecipientsChange={setRecipients}
              primary={primary}
            />
          )}

          {currentStep === 'send' && (
            <ScheduleSender
              onSendNow={handleSendNow}
              onSchedule={handleSchedule}
              isSending={isSending}
              primary={primary}
            />
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ 
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)'
          }}
          onClick={() => setShowPreview(false)}
        >
          <div 
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full overflow-hidden"
            style={{ maxWidth: '56rem', maxHeight: '90vh' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-gray-200 dark:border-gray-800 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Eye className="w-5 h-5" />
                    Email Preview
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Review before sending to {recipients.length} recipient{recipients.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <button
                  onClick={() => setShowPreview(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 180px)' }}>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">From</label>
                  <p className="text-sm text-gray-900 dark:text-white mt-1">{selectedTemplate?.from_email || 'Primary account'}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">To</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {recipients.map((r, i) => (
                      <span key={i} className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-sm text-gray-900 dark:text-white">
                        {r.name || r.email}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Subject</label>
                  <p className="text-sm text-gray-900 dark:text-white mt-1">{subject}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">Message</label>
                  <iframe
                    srcDoc={`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      margin: 0;
      padding: 20px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      font-size: 14px;
      line-height: 1.6;
      color: #1f2937;
      background: #f9fafb;
      overflow-x: hidden;
    }
    img { max-width: 100%; height: auto; display: block; }
    a { color: #3b82f6; text-decoration: none; }
    a:hover { text-decoration: underline; }
    table { border-collapse: collapse; width: 100%; }
    p { margin: 0 0 1em 0; }
    h1, h2, h3, h4, h5, h6 { margin: 0 0 0.75em 0; font-weight: 600; line-height: 1.3; }
  </style>
</head>
<body>${body}</body>
</html>`}
                    className="w-full border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800"
                    style={{ height: '400px', minHeight: '300px' }}
                    sandbox="allow-same-origin"
                    title="Email preview"
                  />
                </div>
              </div>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-800 p-6 flex justify-end gap-3">
              <Button
                onClick={() => setShowPreview(false)}
                variant="light-outline"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Reset Modal */}
      {showConfirmReset && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ 
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)'
          }}
          onClick={() => setShowConfirmReset(false)}
        >
          <div 
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full"
            style={{ maxWidth: '28rem' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
                  <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Email Sent Successfully!</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Sent to {recipients.length} recipient{recipients.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Would you like to compose another email or view the sent email in history?
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setShowConfirmReset(false);
                    setShowSentEmails(true);
                  }}
                  variant="light-outline"
                  className="flex-1"
                >
                  View History
                </Button>
                <Button
                  onClick={handleConfirmReset}
                  variant="primary"
                  className="flex-1"
                >
                  Compose New
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sent Emails Slide-up Panel */}
      {showSentEmails && (
        <div 
          className="fixed inset-x-0 bottom-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-2xl" 
          style={{ 
            maxHeight: '70vh',
            animation: 'slideUp 0.3s ease-out'
          }}
        >
          <div className="h-full overflow-y-auto p-6">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <History className="w-5 h-5" />
                    Sent Email History
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    View and track all sent transactional emails
                  </p>
                </div>
                <Button
                  onClick={() => setShowSentEmails(false)}
                  variant="light-outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  Close
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </div>
              <SentEmails searchQuery={globalSearchQuery} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
