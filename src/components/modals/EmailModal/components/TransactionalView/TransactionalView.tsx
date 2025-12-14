'use client';

import React, { useState } from 'react';
import TemplateSelector from './TemplateSelector';
import EmailComposer from './EmailComposer';
import RecipientSelector from './RecipientSelector';
import ScheduleSender from './ScheduleSender';
import SentEmails from './SentEmails';
import { useSendEmail } from '../../hooks/useSendEmail';
import { 
  ArrowRight,
  CheckCircle2,
  AlertCircle
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
}

export default function TransactionalView({ primary, globalSearchQuery = '' }: TransactionalViewProps) {
  const { sendEmail, isSending } = useSendEmail();
  const [currentStep, setCurrentStep] = useState<Step>('template');
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [sendResult, setSendResult] = useState<{ success: boolean; message: string } | null>(null);

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
      // Reset form after successful send
      setTimeout(() => {
        setCurrentStep('template');
        setSelectedTemplate(null);
        setSubject('');
        setBody('');
        setRecipients([]);
        setSendResult(null);
      }, 3000);
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
      // Reset form after successful schedule
      setTimeout(() => {
        setCurrentStep('template');
        setSelectedTemplate(null);
        setSubject('');
        setBody('');
        setRecipients([]);
        setSendResult(null);
      }, 3000);
    }
  };

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
                onClick={() => setCurrentStep(step.id)}
                disabled={
                  (step.id === 'compose' && !selectedTemplate) ||
                  (step.id === 'recipients' && (!subject || !body)) ||
                  (step.id === 'send' && recipients.length === 0)
                }
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  currentStep !== step.id
                    ? step.id === 'template' ||
                      (step.id === 'compose' && selectedTemplate) ||
                      (step.id === 'recipients' && subject && body) ||
                      (step.id === 'send' && recipients.length > 0)
                      ? 'bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl hover:bg-white/60 dark:hover:bg-gray-800/60 text-gray-700 dark:text-gray-300'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                    : ''
                }`}
                style={currentStep === step.id ? {
                  background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`,
                  color: 'white',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                } : undefined}
              >
                <span className="text-sm font-semibold">{index + 1}</span>
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

          {/* Navigation Buttons */}
          {currentStep !== 'send' && (
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleNextStep}
                disabled={!canProceedToNextStep()}
                className="flex items-center gap-2 px-6 py-2 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`,
                  color: 'white'
                }}
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Sent Emails Section */}
      <div className="border-t border-white/20 p-6 bg-gray-50/50 dark:bg-gray-900/50">
        <div className="max-w-6xl mx-auto">
          <SentEmails searchQuery={globalSearchQuery} />
        </div>
      </div>
    </div>
  );
}
