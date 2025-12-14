'use client';

import React, { useState, useEffect } from 'react';
import { 
  Type, 
  AlignLeft,
  Eye,
  EyeOff,
  Wand2
} from 'lucide-react';

interface EmailComposerProps {
  template?: any;
  subject: string;
  body: string;
  onSubjectChange: (subject: string) => void;
  onBodyChange: (body: string) => void;
}

export default function EmailComposer({
  template,
  subject,
  body,
  onSubjectChange,
  onBodyChange,
}: EmailComposerProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');

  useEffect(() => {
    if (template) {
      onSubjectChange(template.subject || '');
      onBodyChange(template.html_code || '');
    }
  }, [template?.id]);

  useEffect(() => {
    // Simple preview without variable replacement
    setPreviewHtml(body);
  }, [body]);

  const insertVariable = (variable: string) => {
    const textarea = document.getElementById('email-body') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newBody = body.substring(0, start) + `{${variable}}` + body.substring(end);
      onBodyChange(newBody);
      
      // Set cursor position after inserted variable
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variable.length + 2, start + variable.length + 2);
      }, 0);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Compose Email
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Customize your email content and variables
          </p>
        </div>
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
        >
          {showPreview ? (
            <>
              <EyeOff className="w-4 h-4" />
              Hide Preview
            </>
          ) : (
            <>
              <Eye className="w-4 h-4" />
              Show Preview
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Editor */}
        <div className="space-y-4">
          {/* Subject */}
          <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl rounded-xl border border-white/20 p-4">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Type className="w-4 h-4" />
              Subject Line
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => onSubjectChange(e.target.value)}
              placeholder="Enter email subject..."
              className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>

          {/* Variables */}
          {template?.variables && template.variables.length > 0 && (
            <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl rounded-xl border border-white/20 p-4">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Wand2 className="w-4 h-4" />
                Insert Variables
              </label>
              <div className="flex flex-wrap gap-2">
                {template.variables.map((variable: string, index: number) => (
                  <button
                    key={index}
                    onClick={() => insertVariable(variable)}
                    className="px-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                  >
                    {'{'}
                    {variable}
                    {'}'}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                Click to insert variables at cursor position
              </p>
            </div>
          )}

          {/* Body */}
          <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl rounded-xl border border-white/20 p-4">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <AlignLeft className="w-4 h-4" />
              Email Body
            </label>
            <textarea
              id="email-body"
              value={body}
              onChange={(e) => onBodyChange(e.target.value)}
              placeholder="Enter email body (HTML supported)..."
              rows={12}
              className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none font-mono text-sm"
            />
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
              HTML tags supported. Variables will be replaced with recipient data.
            </p>
          </div>
        </div>

        {/* Preview */}
        {showPreview && (
          <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl rounded-xl border border-white/20 p-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Live Preview
            </h4>
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-500 mb-1">Subject:</p>
                <p className="font-semibold text-gray-900 dark:text-white">{subject || '(No subject)'}</p>
              </div>
              <iframe
                srcDoc={`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 16px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      font-size: 14px;
      line-height: 1.6;
      color: #1f2937;
      background: transparent;
    }
    img { max-width: 100%; height: auto; display: block; }
    a { color: #3b82f6; text-decoration: none; }
    a:hover { text-decoration: underline; }
    table { border-collapse: collapse; width: 100%; }
    p { margin: 0 0 1em 0; }
    h1, h2, h3, h4, h5, h6 { margin: 0 0 0.5em 0; font-weight: 600; }
  </style>
</head>
<body>${previewHtml || '<p style="color: #9ca3af;">Email body will appear here...</p>'}</body>
</html>`}
                className="w-full border-0 bg-transparent"
                style={{ height: '400px', minHeight: '300px' }}
                sandbox="allow-same-origin"
                title="Email preview"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
