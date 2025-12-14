'use client';

import React, { useState } from 'react';
import { useEmailTemplates } from '../../hooks/useEmailTemplates';
import { 
  FileText, 
  Search, 
  Loader2,
  Mail,
  CheckCircle2,
  Eye
} from 'lucide-react';

interface TemplateSelectorProps {
  onSelectTemplate: (templateId: number, template: any) => void;
  selectedTemplateId?: number;
  primary: { base: string; hover: string };
  searchQuery?: string;
}

export default function TemplateSelector({ onSelectTemplate, selectedTemplateId, primary, searchQuery = '' }: TemplateSelectorProps) {
  const { transactionalTemplates, isLoading, error } = useEmailTemplates();

  const filteredTemplates = searchQuery
    ? transactionalTemplates.filter(
        (template) =>
          template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          template.subject.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : transactionalTemplates;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Select Email Template
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Choose a transactional email template to customize and send
        </p>
      </div>

      {/* Templates Grid */}
      {filteredTemplates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTemplates.map((template) => (
            <button
              key={template.id}
              onClick={() => onSelectTemplate(template.id, template)}
              className={`text-left bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl rounded-xl border p-4 transition-all hover:bg-white/60 dark:hover:bg-gray-800/60 ${
                selectedTemplateId === template.id
                  ? 'border-primary ring-2 ring-primary/20'
                  : 'border-white/20'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    selectedTemplateId !== template.id
                      ? 'bg-gray-100 dark:bg-gray-800'
                      : ''
                  }`}
                    style={selectedTemplateId === template.id ? {
                      backgroundColor: `${primary.base}1A`
                    } : undefined}
                  >
                    <FileText className={`w-5 h-5`}
                      style={selectedTemplateId === template.id ? {
                        color: primary.base
                      } : undefined}
                    />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {template.name}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                      Transactional
                    </p>
                  </div>
                </div>
                {selectedTemplateId === template.id && (
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                )}
              </div>

              <div className="space-y-2">
                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-500">Subject:</span>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-0.5 line-clamp-1">
                    {template.subject}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-500">Preview:</span>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-2">
                    {template.body.replace(/<[^>]*>/g, '').substring(0, 100)}...
                  </p>
                </div>
              </div>

              {template.variables && template.variables.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-xs text-gray-500 dark:text-gray-500">Variables:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {template.variables.map((variable, index) => (
                      <span
                        key={index}
                        className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded"
                      >
                        {'{'}
                        {variable}
                        {'}'}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>
      ) : (
        <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl rounded-xl border border-white/20 p-12 text-center">
          <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {searchQuery ? 'No templates found' : 'No transactional templates'}
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {searchQuery
              ? 'Try a different search term'
              : 'Create transactional email templates in the Templates tab'}
          </p>
        </div>
      )}
    </div>
  );
}
