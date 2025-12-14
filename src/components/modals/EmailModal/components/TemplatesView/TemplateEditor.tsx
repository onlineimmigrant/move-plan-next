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
    updateTemplate,
    isLoading: templatesLoading
  } = useEmailTemplates();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('');
  const [htmlCode, setHtmlCode] = useState('');
  const [category, setCategory] = useState<'transactional' | 'marketing' | 'system'>('transactional');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [viewMode, setViewMode] = useState<'visual' | 'code'>('visual');

  useEffect(() => {
    // Wait for templates to load before trying to fetch
    if (templatesLoading) return;
    
    if (templateId && templateId > 0) {
      const template = getTemplateById(templateId);
      console.log('Loading template:', templateId, template);
      if (template) {
        setName(template.name || '');
        setDescription(template.description || '');
        setSubject(template.subject || '');
        setHtmlCode(template.html_code || '');
        setCategory(template.category || 'transactional');
        setIsActive(template.is_active);
      } else {
        console.warn('Template not found:', templateId);
      }
    } else if (templateId === 0) {
      // Reset form for new template
      setName('');
      setDescription('');
      setSubject('');
      setHtmlCode('');
      setCategory('transactional');
      setIsActive(true);
    }
  }, [templateId, getTemplateById, templatesLoading]);

  const handleSave = async () => {
    if (!name.trim() || !htmlCode.trim()) {
      alert('Please fill in template name and HTML code');
      return;
    }

    setSaving(true);

    const templateData = {
      name: name.trim(),
      description: description.trim() || null,
      subject: subject.trim() || null,
      html_code: htmlCode.trim(),
      category: category,
      is_active: isActive,
      type: null,
      from_email_address_type: null,
      email_main_logo_image: null,
      is_default: false,
      created_by: null,
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
      const text = htmlCode;
      const before = text.substring(0, start);
      const after = text.substring(end);
      setHtmlCode(before + `{{${variable}}}` + after);
      
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
            {templateId && templateId > 0 ? 'Edit Template' : 'New Template'}
          </h3>
          <div className="flex items-center gap-2">
            {!templatesLoading && (
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                <Eye className="w-4 h-4" />
                {showPreview ? 'Edit' : 'Preview'}
              </button>
            )}
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
          {templatesLoading && templateId && templateId > 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
                <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">Loading template...</p>
              </div>
            </div>
          ) : !showPreview ? (
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
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  >
                    <option value="transactional">Transactional</option>
                    <option value="marketing">Marketing</option>
                    <option value="system">System</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of this template"
                  className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
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

              {/* Quick Insert Variables */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Quick Insert Variables
                </label>
                <div className="flex flex-wrap gap-2">
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

              {/* HTML Code Editor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  HTML Code *
                </label>
                <textarea
                  id="body-editor"
                  value={htmlCode}
                  onChange={(e) => setHtmlCode(e.target.value)}
                  placeholder="<html><body>Your email HTML content here...</body></html>"
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
                    dangerouslySetInnerHTML={{ __html: htmlCode || '<p class="text-gray-400">No content</p>' }}
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
            disabled={saving || !name.trim() || !htmlCode.trim()}
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
