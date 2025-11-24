// sections/ContentSection.tsx - Content editing section

import React from 'react';
import { PostFormData } from '../types';

interface ContentSectionProps {
  formData: PostFormData;
  updateField: <K extends keyof PostFormData>(field: K, value: PostFormData[K]) => void;
  primaryColor: string;
}

export function ContentSection({ formData, updateField, primaryColor }: ContentSectionProps) {
  const isLandingPage = formData.section === 'Landing';

  return (
    <div className="space-y-4">
      {!isLandingPage && (
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">
            Subsection
          </label>
          <input
            type="text"
            value={formData.subsection}
            onChange={(e) => updateField('subsection', e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                     focus:outline-none focus:ring-2 focus:border-transparent transition-all"
            style={{ '--tw-ring-color': `${primaryColor}30` } as React.CSSProperties}
            placeholder="SUBSECTION"
          />
        </div>
      )}

      <div>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">
          Title
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => updateField('title', e.target.value)}
          className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600
                   bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-2xl font-bold
                   focus:outline-none focus:ring-2 focus:border-transparent transition-all
                   placeholder:text-gray-300 dark:placeholder:text-gray-600"
          style={{ '--tw-ring-color': `${primaryColor}30` } as React.CSSProperties}
          placeholder="Enter post title..."
        />
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => updateField('description', e.target.value)}
          rows={3}
          className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600
                   bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                   focus:outline-none focus:ring-2 focus:border-transparent transition-all resize-none
                   placeholder:text-gray-300 dark:placeholder:text-gray-600"
          style={{ '--tw-ring-color': `${primaryColor}30` } as React.CSSProperties}
          placeholder="Brief description or subtitle..."
        />
      </div>
    </div>
  );
}
