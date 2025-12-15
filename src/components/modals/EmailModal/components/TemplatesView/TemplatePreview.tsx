'use client';

import React, { useState } from 'react';
import { useEmailTemplates } from '../../hooks/useEmailTemplates';
import { useEmailToast } from '../../hooks/useEmailToast';
import { X, Eye, Send, Code } from 'lucide-react';
import { sanitizeEmailTemplate } from '../../utils/sanitize';

interface TemplatePreviewProps {
  templateId: number | null;
  onClose: () => void;
}

export default function TemplatePreview({ templateId, onClose }: TemplatePreviewProps) {
  const { getTemplateById } = useEmailTemplates();
  const toast = useEmailToast();
  const [sampleData, setSampleData] = useState<Record<string, string>>({});
  const [showTestSend, setShowTestSend] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [viewMode, setViewMode] = useState<'rendered' | 'html'>('rendered');
  
  const template = templateId ? getTemplateById(templateId) : null;

  // Extract variables from html_code (find {{variable}} patterns)
  const extractVariables = (html: string | null): string[] => {
    if (!html) return [];
    const matches = html.match(/\{\{(\w+)\}\}/g);
    if (!matches) return [];
    return [...new Set(matches.map(m => m.replace(/\{\{|\}\}/g, '')))];
  };

  const variables = template ? extractVariables(template.html_code) : [];

  // Initialize sample data for variables
  React.useEffect(() => {
    if (variables.length > 0) {
      const data: Record<string, string> = {};
      variables.forEach((variable) => {
        data[variable] = `Sample ${variable.replace('_', ' ')}`;
      });
      setSampleData(data);
    }
  }, [template?.html_code]);
  
  if (!templateId || !template) return null;

  const replaceVariables = (text: string | null): string => {
    if (!text) return '';
    let result = text;
    Object.entries(sampleData).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      result = result.replace(regex, value);
    });
    return result;
  };

  const previewSubject = replaceVariables(template?.subject);
  const previewBody = sanitizeEmailTemplate(replaceVariables(template?.html_code));

  const handleTestSend = async () => {
    if (!testEmail || !testEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setSending(true);
    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: testEmail,
          subject: previewSubject,
          html: previewBody,
          templateData: sampleData,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(`Test email sent to ${testEmail}!`);
        setShowTestSend(false);
        setTestEmail('');
      } else {
        toast.error(result.error || 'Failed to send test email');
      }
    } catch (error) {
      toast.error('Failed to send test email');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Preview: {template.name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Preview with sample data
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode(viewMode === 'rendered' ? 'html' : 'rendered')}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 rounded-lg transition-colors border border-gray-200 dark:border-gray-600"
              title="Toggle View"
            >
              {viewMode === 'rendered' ? <Code className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span className="hidden sm:inline">{viewMode === 'rendered' ? 'HTML' : 'Rendered'}</span>
            </button>
            <button
              onClick={() => setShowTestSend(!showTestSend)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Test Send</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sample Data Editor */}
        {variables && variables.length > 0 && (
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Sample Data (edit to see changes):
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {variables.map((variable) => (
                <div key={variable}>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                    {`{{${variable}}}`}
                  </label>
                  <input
                    type="text"
                    value={sampleData[variable] || ''}
                    onChange={(e) => setSampleData({ ...sampleData, [variable]: e.target.value })}
                    className="w-full px-3 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Preview Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-100 dark:bg-gray-950">
          {viewMode === 'rendered' ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-2xl mx-auto">
              {/* Email Header */}
              <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 mb-1">From:</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      your-company@example.com
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Subject:</p>
                  <p className="text-base font-semibold text-gray-900 dark:text-white">
                    {previewSubject}
                  </p>
                </div>
              </div>

              {/* Email Body - Isolated in iframe */}
              <div className="p-6">
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white">
                  <iframe
                    srcDoc={`
                      <!DOCTYPE html>
                      <html>
                        <head>
                          <meta charset="UTF-8">
                          <meta name="viewport" content="width=device-width, initial-scale=1.0">
                          <style>
                            body {
                              margin: 0;
                              padding: 16px;
                              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                              font-size: 14px;
                              line-height: 1.6;
                              color: #1f2937;
                            }
                            img { max-width: 100%; height: auto; }
                            a { color: #3b82f6; text-decoration: underline; }
                            table { width: 100%; border-collapse: collapse; }
                            td, th { padding: 8px; text-align: left; border: 1px solid #e5e7eb; }
                          </style>
                        </head>
                        <body>${previewBody}</body>
                      </html>
                    `}
                    title="Email Preview"
                    sandbox="allow-same-origin"
                    className="w-full border-0"
                    style={{ minHeight: '400px', height: 'auto' }}
                    onLoad={(e) => {
                      const iframe = e.target as HTMLIFrameElement;
                      if (iframe.contentWindow) {
                        const height = iframe.contentWindow.document.body.scrollHeight;
                        iframe.style.height = `${Math.max(400, height + 32)}px`;
                      }
                    }}
                  />
                </div>
              </div>

              {/* Email Footer */}
              <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 bg-gray-50 dark:bg-gray-900">
                <p className="text-xs text-gray-500 text-center">
                  This is a preview - no email will be sent
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-4xl mx-auto p-6">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">HTML Source:</p>
              <pre className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg overflow-x-auto text-xs font-mono border border-gray-200 dark:border-gray-700 max-h-[500px] overflow-y-auto">
                {template?.html_code || '<p>No content</p>'}
              </pre>
            </div>
          )}
        </div>

        {/* Test Send Panel */}
        {showTestSend && (
          <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 bg-gray-50 dark:bg-gray-900">
            <div className="max-w-2xl mx-auto">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Send test email
              </p>
              <div className="flex gap-3">
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="Enter email address"
                  className="flex-1 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm"
                  disabled={sending}
                />
                <button
                  onClick={handleTestSend}
                  disabled={sending || !testEmail}
                  className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  <Send className="w-4 h-4" />
                  {sending ? 'Sending...' : 'Send'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
