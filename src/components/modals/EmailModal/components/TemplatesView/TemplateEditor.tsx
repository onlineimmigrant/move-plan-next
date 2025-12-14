'use client';

import React, { useState, useEffect } from 'react';
import { useEmailTemplates } from '../../hooks/useEmailTemplates';
import { 
  Save,
  X,
  Eye,
  Code,
  Type,
  Bold,
  Italic,
  Underline,
  List,
  Link,
  Image,
  AlignLeft,
  AlignCenter,
  AlignRight
} from 'lucide-react';

interface TemplateEditorProps {
  templateId: number | null;
  onClose: () => void;
  primary: { base: string; hover: string };
}

export default function TemplateEditor({ templateId, onClose, primary }: TemplateEditorProps) {
  const { 
    getTemplateById, 
    createTemplate, 
    updateTemplate 
  } = useEmailTemplates();
  
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [templateType, setTemplateType] = useState<'transactional' | 'marketing' | 'notification'>('transactional');
  const [variables, setVariables] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [viewMode, setViewMode] = useState<'visual' | 'code'>('visual');

  useEffect(() => {
    if (templateId && templateId > 0) {
      const template = getTemplateById(templateId);
      if (template) {
        setName(template.name);
        setSubject(template.subject);
        setBody(template.body);
        setTemplateType(template.template_type);
        setVariables(template.variables?.join(', ') || '');
        setIsActive(template.is_active);
      }
    }
  }, [templateId]);

  const handleSave = async () => {
    if (!name.trim() || !subject.trim() || !body.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    setSaving(true);

    const templateData = {
      name: name.trim(),
      subject: subject.trim(),
      body: body.trim(),
      template_type: templateType,
      variables: variables ? variables.split(',').map(v => v.trim()).filter(Boolean) : null,
      is_active: isActive,
    };

    let success = false;
    if (templateId && templateId > 0) {
      success = await updateTemplate(templateId, templateData);
    } else {
      const result = await createTemplate(templateData);
      success = !!result;
    }

    setSaving(false);

    if (success) {
      onClose();
    }
  };

  const insertVariable = (variable: string) => {
    const textarea = document.getElementById('body-editor') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = body;
      const before = text.substring(0, start);
      const after = text.substring(end);
      setBody(before + `{{${variable}}}` + after);
      
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variable.length + 4, start + variable.length + 4);
      }, 0);
    }
  };

  const commonVariables = [
    'first_name',
    'last_name',
    'email',
    'company_name',
    'order_id',
    'order_total',
    'tracking_number',
    'date',
    'unsubscribe_link',
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {templateId && templateId > 0 ? 'Edit Template' : 'Create Template'}
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              <Eye className="w-4 h-4" />
              {showPreview ? 'Edit' : 'Preview'}
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!showPreview ? (
            <div className="space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Template Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Welcome Email"
                    className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Template Type *
                  </label>
                  <select
                    value={templateType}
                    onChange={(e) => setTemplateType(e.target.value as any)}
                    className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  >
                    <option value="transactional">Transactional</option>
                    <option value="marketing">Marketing</option>
                    <option value="notification">Notification</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Subject *
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g., Welcome to {{company_name}}"
                  className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>

              {/* Variables */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Variables (comma-separated)
                </label>
                <input
                  type="text"
                  value={variables}
                  onChange={(e) => setVariables(e.target.value)}
                  placeholder="e.g., first_name, last_name, company_name"
                  className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {commonVariables.map((variable) => (
                    <button
                      key={variable}
                      onClick={() => insertVariable(variable)}
                      className="text-xs px-2 py-1 bg-primary/10 text-primary hover:bg-primary/20 rounded transition-colors"
                    >
                      {`{{${variable}}}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setViewMode('visual')}
                  className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-all ${
                    viewMode === 'visual'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-600 dark:text-gray-400'
                  }`}
                >
                  <Type className="w-4 h-4" />
                  Visual
                </button>
                <button
                  onClick={() => setViewMode('code')}
                  className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-all ${
                    viewMode === 'code'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-600 dark:text-gray-400'
                  }`}
                >
                  <Code className="w-4 h-4" />
                  HTML
                </button>
              </div>

              {/* Body Editor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Body *
                </label>
                <textarea
                  id="body-editor"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder={viewMode === 'code' 
                    ? '<html><body>Your email content here...</body></html>' 
                    : 'Write your email content here...'}
                  rows={15}
                  className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all font-mono text-sm resize-none"
                />
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is-active"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <label htmlFor="is-active" className="text-sm text-gray-700 dark:text-gray-300">
                  Template is active
                </label>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-2xl mx-auto">
                <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
                  <p className="text-xs text-gray-500 mb-1">Subject:</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{subject || 'No subject'}</p>
                </div>
                <div className="p-6">
                  <div 
                    className="prose dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: body || '<p class="text-gray-400">No content</p>' }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !name.trim() || !subject.trim() || !body.trim()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`,
              color: 'white'
            }}
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Template'}
          </button>
        </div>
      </div>
    </div>
  );
}
