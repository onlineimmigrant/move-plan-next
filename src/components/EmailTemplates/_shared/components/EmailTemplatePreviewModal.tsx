/**
 * Email Template Preview Modal
 * Split view showing HTML render and source code with placeholder replacement
 */

'use client';

import React, { useState, useMemo } from 'react';
import { EmailIcons } from './EmailIcons';
import Button from '@/ui/Button';
import type { EmailTemplate, PlaceholderValues } from '../types/emailTemplate';
import { replacePlaceholders, extractPlaceholders } from '../utils/emailTemplate.utils';

interface EmailTemplatePreviewModalProps {
  isOpen: boolean;
  template: EmailTemplate | null;
  onClose: () => void;
  onTestSend?: (template: EmailTemplate) => void;
}

export const EmailTemplatePreviewModal: React.FC<EmailTemplatePreviewModalProps> = ({
  isOpen,
  template,
  onClose,
  onTestSend,
}) => {
  const [viewMode, setViewMode] = useState<'rendered' | 'html'>('rendered');
  const [placeholderValues, setPlaceholderValues] = useState<PlaceholderValues>({});

  // Extract placeholders from template
  const placeholders = useMemo(() => {
    if (!template) return [];
    const subjectPlaceholders = extractPlaceholders(template.subject || '');
    const bodyPlaceholders = extractPlaceholders(template.html_code || '');
    return Array.from(new Set([...subjectPlaceholders, ...bodyPlaceholders]));
  }, [template]);

  // Generate preview with placeholders replaced
  const { previewSubject, previewHtml } = useMemo(() => {
    if (!template) return { previewSubject: '', previewHtml: '' };
    
    return {
      previewSubject: replacePlaceholders(template.subject || '', placeholderValues),
      previewHtml: replacePlaceholders(template.html_code || '', placeholderValues),
    };
  }, [template, placeholderValues]);

  const handlePlaceholderChange = (placeholder: string, value: string) => {
    setPlaceholderValues((prev) => ({
      ...prev,
      [placeholder]: value,
    }));
  };

  const handleReset = () => {
    setPlaceholderValues({});
  };

  if (!isOpen || !template) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <EmailIcons.Eye className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Preview Template</h2>
              <p className="text-sm text-gray-600">{template.name || template.subject}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onTestSend && (
              <Button
                variant="secondary"
                onClick={() => onTestSend(template)}
                className="text-sm"
              >
                <EmailIcons.PaperPlane className="h-4 w-4 mr-2" />
                Test Send
              </Button>
            )}
            <button
              onClick={onClose}
              className="h-10 w-10 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
            >
              <EmailIcons.X className="h-6 w-6 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Left Sidebar - Placeholders */}
          {placeholders.length > 0 && (
            <div className="w-80 border-r border-gray-200 bg-gray-50 p-4 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Placeholders</h3>
                <button
                  onClick={handleReset}
                  className="text-xs text-purple-600 hover:text-purple-700 font-medium"
                >
                  Reset All
                </button>
              </div>
              <div className="space-y-3">
                {placeholders.map((placeholder) => (
                  <div key={placeholder}>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      {`{{${placeholder}}}`}
                    </label>
                    <input
                      type="text"
                      value={placeholderValues[placeholder] || ''}
                      onChange={(e) => handlePlaceholderChange(placeholder, e.target.value)}
                      placeholder={`Enter ${placeholder.replace(/_/g, ' ')}`}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-800">
                  💡 Fill in placeholder values to see them replaced in the preview
                </p>
              </div>
            </div>
          )}

          {/* Main Preview Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* View Toggle */}
            <div className="border-b border-gray-200 px-6 py-3 flex items-center gap-2 bg-gray-50">
              <button
                onClick={() => setViewMode('rendered')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === 'rendered'
                    ? 'bg-purple-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                <EmailIcons.Eye className="h-4 w-4 inline mr-2" />
                Rendered
              </button>
              <button
                onClick={() => setViewMode('html')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === 'html'
                    ? 'bg-purple-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                <EmailIcons.Code className="h-4 w-4 inline mr-2" />
                HTML Source
              </button>
            </div>

            {/* Subject Preview */}
            <div className="border-b border-gray-200 px-6 py-4 bg-yellow-50">
              <p className="text-xs font-medium text-gray-600 mb-1">Subject:</p>
              <p className="text-base font-semibold text-gray-900">{previewSubject}</p>
            </div>

            {/* Email Body Preview */}
            <div className="flex-1 overflow-auto p-6">
              {viewMode === 'rendered' ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <iframe
                    srcDoc={previewHtml}
                    className="w-full h-full min-h-[600px] border-0"
                    title="Email Preview"
                    sandbox="allow-same-origin"
                  />
                </div>
              ) : (
                <div className="bg-gray-900 rounded-lg p-4 overflow-auto">
                  <pre className="text-sm text-gray-100 font-mono whitespace-pre-wrap break-words">
                    {previewHtml}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            <span className="font-medium">Type:</span> {template.type?.replace(/_/g, ' ')} • 
            <span className="font-medium ml-2">Category:</span> {template.category} •
            <span className="font-medium ml-2">From:</span> {template.from_email_address_type?.replace(/_/g, ' ')}
          </div>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
