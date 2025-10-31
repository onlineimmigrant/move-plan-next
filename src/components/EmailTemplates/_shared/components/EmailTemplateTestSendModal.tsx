/**
 * Email Template Test Send Modal
 * Send test emails with custom placeholder values
 */

'use client';

import React, { useState, useMemo } from 'react';
import { EmailIcons } from './EmailIcons';
import Button from '@/ui/Button';
import type { EmailTemplate, PlaceholderValues } from '../types/emailTemplate';
import { extractPlaceholders } from '../utils/emailTemplate.utils';

interface EmailTemplateTestSendModalProps {
  isOpen: boolean;
  template: EmailTemplate | null;
  onClose: () => void;
  onSend: (template: EmailTemplate, toEmail: string, placeholders: PlaceholderValues) => Promise<void>;
}

export const EmailTemplateTestSendModal: React.FC<EmailTemplateTestSendModalProps> = ({
  isOpen,
  template,
  onClose,
  onSend,
}) => {
  const [toEmail, setToEmail] = useState('');
  const [placeholderValues, setPlaceholderValues] = useState<PlaceholderValues>({});
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Extract placeholders from template
  const placeholders = useMemo(() => {
    if (!template) return [];
    const subjectPlaceholders = extractPlaceholders(template.subject || '');
    const bodyPlaceholders = extractPlaceholders(template.html_code || '');
    return Array.from(new Set([...subjectPlaceholders, ...bodyPlaceholders]));
  }, [template]);

  const handlePlaceholderChange = (placeholder: string, value: string) => {
    setPlaceholderValues((prev) => ({
      ...prev,
      [placeholder]: value,
    }));
  };

  const handleSend = async () => {
    if (!template) return;
    
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(toEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    // Check if all placeholders have values
    const missingPlaceholders = placeholders.filter((p) => !placeholderValues[p]);
    if (missingPlaceholders.length > 0) {
      setError(`Please fill in all placeholders: ${missingPlaceholders.map(p => `{{${p}}}`).join(', ')}`);
      return;
    }

    try {
      setSending(true);
      setError(null);
      await onSend(template, toEmail, placeholderValues);
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setToEmail('');
        setPlaceholderValues({});
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send test email');
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    if (!sending) {
      onClose();
      setToEmail('');
      setPlaceholderValues({});
      setError(null);
      setSuccess(false);
    }
  };

  if (!isOpen || !template) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
              <EmailIcons.PaperPlane className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Send Test Email</h2>
              <p className="text-sm text-gray-600">{template.name || template.subject}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={sending}
            className="h-10 w-10 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors disabled:opacity-50"
          >
            <EmailIcons.X className="h-6 w-6 text-gray-600" />
          </button>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mx-6 mt-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <EmailIcons.CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
            <div>
              <p className="font-medium text-green-900">Test email sent successfully!</p>
              <p className="text-sm text-green-700">Check your inbox at {toEmail}</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mx-6 mt-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <EmailIcons.AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Form */}
        <div className="p-6 space-y-6">
          {/* Recipient Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Send To <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={toEmail}
              onChange={(e) => {
                setToEmail(e.target.value);
                setError(null);
              }}
              placeholder="recipient@example.com"
              disabled={sending}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-50"
            />
          </div>

          {/* Template Info */}
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-2">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-600">Subject:</p>
                <p className="text-sm text-gray-900 mt-1">{template.subject}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-200">
              <div>
                <p className="text-xs font-medium text-gray-600">Type:</p>
                <p className="text-sm text-gray-900">{template.type?.replace(/_/g, ' ')}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600">From:</p>
                <p className="text-sm text-gray-900">{template.from_email_address_type?.replace(/_/g, ' ')}</p>
              </div>
            </div>
          </div>

          {/* Placeholders */}
          {placeholders.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Placeholder Values</h3>
              <div className="space-y-3">
                {placeholders.map((placeholder) => (
                  <div key={placeholder}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {`{{${placeholder}}}`} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={placeholderValues[placeholder] || ''}
                      onChange={(e) => handlePlaceholderChange(placeholder, e.target.value)}
                      placeholder={`Enter ${placeholder.replace(/_/g, ' ')}`}
                      disabled={sending}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-50"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <EmailIcons.Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Test Email Information:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>This will send a real email using the configured AWS SES</li>
                  <li>Placeholders will be replaced with the values you provide</li>
                  <li>The email will look exactly as it would in production</li>
                  <li>Check your spam folder if you don't receive it</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={sending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleSend}
              disabled={sending || !toEmail || placeholders.some(p => !placeholderValues[p])}
              className="bg-green-600 hover:bg-green-700"
            >
              {sending ? (
                <>
                  <EmailIcons.Refresh className="h-5 w-5 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <EmailIcons.PaperPlane className="h-5 w-5 mr-2" />
                  Send Test Email
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
