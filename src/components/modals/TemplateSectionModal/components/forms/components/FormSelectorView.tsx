/**
 * FormSelectorView - List of existing forms with create new option
 */

'use client';

import React from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';

interface FormItem {
  id: string;
  title: string;
  description?: string;
  published: boolean;
  created_at: string;
}

interface FormSelectorViewProps {
  availableForms: FormItem[];
  onSelectForm: (formId: string) => void;
  onCreateNew: () => void;
}

export function FormSelectorView({
  availableForms,
  onSelectForm,
  onCreateNew,
}: FormSelectorViewProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Select or Create a Form</h3>
          <p className="text-sm text-gray-500 mt-1">Choose an existing form or create a new one</p>
        </div>
      </div>

      {/* Existing Forms */}
      {availableForms.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">Existing Forms</h4>
          <div className="grid gap-3">
            {availableForms.map((form) => (
              <button
                key={form.id}
                onClick={() => onSelectForm(form.id)}
                className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all text-left group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h5 className="font-medium text-gray-900 truncate">{form.title}</h5>
                    {form.published && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        Published
                      </span>
                    )}
                    {!form.published && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        Draft
                      </span>
                    )}
                  </div>
                  {form.description && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{form.description}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    Created {new Date(form.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Create New Form */}
      <div className="border-t pt-6">
        <button
          onClick={onCreateNew}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors text-gray-700 hover:text-purple-700 font-medium"
        >
          <PlusIcon className="h-5 w-5" />
          Create New Form
        </button>
      </div>
    </div>
  );
}
