// sections/TypeSection.tsx - Post type selection

import React from 'react';
import { PostFormData, PostType } from '../types';

interface TypeSectionProps {
  formData: PostFormData;
  updateField: <K extends keyof PostFormData>(field: K, value: PostFormData[K]) => void;
}

const POST_TYPES: { value: PostType; label: string; description: string; icon: string }[] = [
  {
    value: 'default',
    label: 'Default',
    description: 'Full blog post with TOC & author',
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
  },
  {
    value: 'minimal',
    label: 'Minimal',
    description: 'Content only, no TOC or metadata',
    icon: 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z'
  },
  {
    value: 'landing',
    label: 'Landing',
    description: 'Custom HTML, no blog styling',
    icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4'
  },
  {
    value: 'doc_set',
    label: 'Doc Set',
    description: 'Part of documentation series',
    icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253'
  }
];

export function TypeSection({ formData, updateField }: TypeSectionProps) {
  return (
    <div className="space-y-3">
      {POST_TYPES.map((type) => (
        <label
          key={type.value}
          className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 
                   transition-colors border border-gray-200 dark:border-gray-700"
        >
          <input
            type="radio"
            name="postType"
            checked={formData.postType === type.value}
            onChange={() => updateField('postType', type.value)}
            className="w-4 h-4 border-gray-300 dark:border-gray-600"
          />
          <div className="flex-1">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{type.label}</span>
            <p className="text-xs text-gray-500 dark:text-gray-400">{type.description}</p>
          </div>
        </label>
      ))}

      {formData.postType === 'doc_set' && (
        <div className="mt-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isNumbered}
              onChange={(e) => updateField('isNumbered', e.target.checked)}
              className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Show article numbers in Master TOC</span>
          </label>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-6">
            When enabled, articles will be numbered (1, 2, 3...) in the Master TOC navigation.
          </p>
        </div>
      )}
    </div>
  );
}
