'use client';

import React, { useState } from 'react';
import { useEmailTemplates } from '../../hooks/useEmailTemplates';
import { X, Eye, Send } from 'lucide-react';
import { sanitizeEmailTemplate } from '../../utils/sanitize';

interface TemplatePreviewProps {
  templateId: number | null;
  onClose: () => void;
}

export default function TemplatePreview({ templateId, onClose }: TemplatePreviewProps) {
  const { getTemplateById } = useEmailTemplates();
  const [sampleData, setSampleData] = useState<Record<string, string>>({});
  
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
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
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

            {/* Email Body */}
            <div className="p-6">
              <div 
                className="prose dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: previewBody }}
              />
            </div>

            {/* Email Footer */}
            <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 bg-gray-50 dark:bg-gray-900">
              <p className="text-xs text-gray-500 text-center">
                This is a preview - no email will be sent
              </p>
            </div>
          </div>
        </div>

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
