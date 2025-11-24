// sections/DocumentSetSection.tsx - Document set configuration

import React from 'react';
import { PostFormData, DocumentSet } from '../types';
import { InformationCircleIcon } from '@heroicons/react/24/outline';

interface DocumentSetSectionProps {
  formData: PostFormData;
  updateField: <K extends keyof PostFormData>(field: K, value: PostFormData[K]) => void;
  availableSets: DocumentSet[];
  primaryColor: string;
}

const Tooltip: React.FC<{ content: string; children: React.ReactNode }> = ({ content, children }) => {
  const [isVisible, setIsVisible] = React.useState(false);
  return (
    <div className="relative inline-flex">
      <div onMouseEnter={() => setIsVisible(true)} onMouseLeave={() => setIsVisible(false)}>
        {children}
      </div>
      {isVisible && (
        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50 pointer-events-none w-64">
          <div className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs rounded-lg py-2.5 px-3.5 shadow-lg border border-gray-200 dark:border-gray-700">
            {content}
          </div>
        </div>
      )}
    </div>
  );
};

export function DocumentSetSection({ formData, updateField, availableSets, primaryColor }: DocumentSetSectionProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Organize this post into a document set for multi-article documentation with shared navigation.
      </p>

      <div>
        <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Document Set
          <Tooltip content="Group posts into document sets for tutorials, guides, and multi-part documentation">
            <InformationCircleIcon className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
          </Tooltip>
        </label>
        <select
          value={formData.docSet}
          onChange={(e) => updateField('docSet', e.target.value)}
          className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600
                   bg-gray-50/50 dark:bg-gray-800 hover:bg-white dark:hover:bg-gray-700
                   focus:bg-white dark:focus:bg-gray-700 focus:outline-none focus:ring-2 focus:border-transparent
                   transition-all text-gray-900 dark:text-white"
          style={{ '--tw-ring-color': `${primaryColor}30` } as React.CSSProperties}
        >
          <option value="">No Document Set</option>
          {availableSets.map((set) => (
            <option key={set.slug} value={set.slug}>{set.title}</option>
          ))}
          <option value="__custom__">+ Create New Set</option>
        </select>
      </div>

      {formData.docSet === '__custom__' && (
        <input
          type="text"
          value={formData.docSetTitle}
          onChange={(e) => {
            const newValue = e.target.value;
            updateField('docSetTitle', newValue);
            updateField('docSet', newValue.toLowerCase().replace(/\s+/g, '-'));
          }}
          placeholder="Enter new document set name (e.g., User Guide)"
          className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600
                   bg-gray-50/50 dark:bg-gray-800 hover:bg-white dark:hover:bg-gray-700
                   focus:bg-white dark:focus:bg-gray-700 focus:outline-none focus:ring-2 focus:border-transparent
                   transition-all text-gray-900 dark:text-white placeholder-gray-400"
          style={{ '--tw-ring-color': `${primaryColor}30` } as React.CSSProperties}
        />
      )}

      {formData.docSet && formData.docSet !== '__custom__' && (
        <>
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Set Display Title
              <Tooltip content="Human-readable title for the document set">
                <InformationCircleIcon className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
              </Tooltip>
            </label>
            <input
              type="text"
              value={formData.docSetTitle}
              onChange={(e) => updateField('docSetTitle', e.target.value)}
              placeholder="e.g., Getting Started Guide"
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600
                       bg-gray-50/50 dark:bg-gray-800 hover:bg-white dark:hover:bg-gray-700
                       focus:bg-white dark:focus:bg-gray-700 focus:outline-none focus:ring-2 focus:border-transparent
                       transition-all text-gray-900 dark:text-white placeholder-gray-400"
              style={{ '--tw-ring-color': `${primaryColor}30` } as React.CSSProperties}
            />
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Article Order
              <Tooltip content="Display order within the document set (lower numbers appear first)">
                <InformationCircleIcon className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
              </Tooltip>
            </label>
            <input
              type="number"
              value={formData.docSetOrder}
              onChange={(e) => updateField('docSetOrder', e.target.value)}
              placeholder="1"
              min="0"
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600
                       bg-gray-50/50 dark:bg-gray-800 hover:bg-white dark:hover:bg-gray-700
                       focus:bg-white dark:focus:bg-gray-700 focus:outline-none focus:ring-2 focus:border-transparent
                       transition-all text-gray-900 dark:text-white placeholder-gray-400"
              style={{ '--tw-ring-color': `${primaryColor}30` } as React.CSSProperties}
            />
          </div>
        </>
      )}
    </div>
  );
}
