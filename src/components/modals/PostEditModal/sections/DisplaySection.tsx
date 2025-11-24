// sections/DisplaySection.tsx - Display options section

import React from 'react';
import { PostFormData } from '../types';
import { InformationCircleIcon } from '@heroicons/react/24/outline';

interface DisplaySectionProps {
  formData: PostFormData;
  updateField: <K extends keyof PostFormData>(field: K, value: PostFormData[K]) => void;
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

const OPTIONS = [
  { field: 'displayThisPost' as const, label: 'Display Post', description: 'Make this post visible to users' },
  { field: 'displayAsBlogPost' as const, label: 'Display as Blog Post', description: 'Show in blog listings' },
  { field: 'isDisplayedFirstPage' as const, label: 'Feature on First Page', description: 'Display prominently on homepage' },
  { field: 'isHelpCenter' as const, label: 'Help Center Article', description: 'Show in help center' },
  { field: 'isCompanyAuthor' as const, label: 'Company Author', description: 'Attribute to company instead of individual' },
];

export function DisplaySection({ formData, updateField, primaryColor }: DisplaySectionProps) {
  return (
    <div className="space-y-3">
      {OPTIONS.map((option) => (
        <label
          key={option.field}
          className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 
                   transition-colors border border-gray-200 dark:border-gray-700"
        >
          <input
            type="checkbox"
            checked={formData[option.field]}
            onChange={(e) => updateField(option.field, e.target.checked)}
            className="w-4 h-4 border-gray-300 dark:border-gray-600 rounded focus:ring-2"
            style={{
              accentColor: primaryColor,
              '--tw-ring-color': primaryColor
            } as React.CSSProperties}
          />
          <div className="flex-1">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{option.label}</span>
            <p className="text-xs text-gray-500 dark:text-gray-400">{option.description}</p>
          </div>
        </label>
      ))}

      {formData.isHelpCenter && (
        <div className="mt-3">
          <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Help Center Order
            <Tooltip content="Display order in help center">
              <InformationCircleIcon className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
            </Tooltip>
          </label>
          <input
            type="number"
            value={formData.helpCenterOrder}
            onChange={(e) => updateField('helpCenterOrder', e.target.value)}
            placeholder="1"
            className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600
                     bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:border-transparent
                     transition-all text-gray-900 dark:text-white placeholder-gray-400"
            style={{ '--tw-ring-color': `${primaryColor}30` } as React.CSSProperties}
          />
        </div>
      )}
    </div>
  );
}
