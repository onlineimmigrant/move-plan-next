// sections/SeoSection.tsx - SEO and metadata section

import React from 'react';
import { PostFormData } from '../types';
import { InformationCircleIcon } from '@heroicons/react/24/outline';

interface SeoSectionProps {
  formData: PostFormData;
  updateField: <K extends keyof PostFormData>(field: K, value: PostFormData[K]) => void;
  mode: 'create' | 'edit';
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

export function SeoSection({ formData, updateField, mode, primaryColor }: SeoSectionProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Slug {mode === 'create' && <span className="text-xs font-normal" style={{ color: primaryColor }}>(auto-generated)</span>}
          <Tooltip content="URL-friendly identifier for this post">
            <InformationCircleIcon className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
          </Tooltip>
        </label>
        <input
          type="text"
          value={formData.slug}
          onChange={(e) => updateField('slug', e.target.value)}
          placeholder="custom-url-slug"
          className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600
                   bg-gray-50/50 dark:bg-gray-800 hover:bg-white dark:hover:bg-gray-700
                   focus:bg-white dark:focus:bg-gray-700 focus:outline-none focus:ring-2 focus:border-transparent
                   transition-all text-gray-900 dark:text-white placeholder-gray-400 font-mono text-sm"
          style={{ '--tw-ring-color': `${primaryColor}30` } as React.CSSProperties}
        />
      </div>

      <div>
        <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Author Name
          <Tooltip content="Name of the post author">
            <InformationCircleIcon className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
          </Tooltip>
        </label>
        <input
          type="text"
          value={formData.authorName}
          onChange={(e) => updateField('authorName', e.target.value)}
          placeholder="John Doe"
          className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600
                   bg-gray-50/50 dark:bg-gray-800 hover:bg-white dark:hover:bg-gray-700
                   focus:bg-white dark:focus:bg-gray-700 focus:outline-none focus:ring-2 focus:border-transparent
                   transition-all text-gray-900 dark:text-white placeholder-gray-400"
          style={{ '--tw-ring-color': `${primaryColor}30` } as React.CSSProperties}
        />
      </div>

      <div>
        <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Meta Description
          <Tooltip content="SEO meta description for search engines (max 160 characters)">
            <InformationCircleIcon className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
          </Tooltip>
        </label>
        <textarea
          value={formData.metaDescription}
          onChange={(e) => updateField('metaDescription', e.target.value)}
          rows={2}
          maxLength={160}
          placeholder="A brief description for search engines..."
          className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600
                   bg-gray-50/50 dark:bg-gray-800 hover:bg-white dark:hover:bg-gray-700
                   focus:bg-white dark:focus:bg-gray-700 focus:outline-none focus:ring-2 focus:border-transparent
                   transition-all text-gray-900 dark:text-white placeholder-gray-400 resize-none"
          style={{ '--tw-ring-color': `${primaryColor}30` } as React.CSSProperties}
        />
        <div className="flex items-center justify-end mt-1">
          <span className={`text-xs font-medium ${
            formData.metaDescription.length > 140 ? 'text-orange-600' : 'text-gray-400'
          }`}>
            {formData.metaDescription.length}/160
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Section
            <Tooltip content="Content section or category">
              <InformationCircleIcon className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
            </Tooltip>
          </label>
          <input
            type="text"
            value={formData.section}
            onChange={(e) => updateField('section', e.target.value)}
            placeholder="Blog, News, etc."
            className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600
                     bg-gray-50/50 dark:bg-gray-800 hover:bg-white dark:hover:bg-gray-700
                     focus:bg-white dark:focus:bg-gray-700 focus:outline-none focus:ring-2 focus:border-transparent
                     transition-all text-gray-900 dark:text-white placeholder-gray-400"
            style={{ '--tw-ring-color': `${primaryColor}30` } as React.CSSProperties}
          />
        </div>

        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Display Order
            <Tooltip content="Numerical order for sorting posts">
              <InformationCircleIcon className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
            </Tooltip>
          </label>
          <input
            type="number"
            value={formData.order}
            onChange={(e) => updateField('order', e.target.value)}
            placeholder="1"
            className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600
                     bg-gray-50/50 dark:bg-gray-800 hover:bg-white dark:hover:bg-gray-700
                     focus:bg-white dark:focus:bg-gray-700 focus:outline-none focus:ring-2 focus:border-transparent
                     transition-all text-gray-900 dark:text-white placeholder-gray-400"
            style={{ '--tw-ring-color': `${primaryColor}30` } as React.CSSProperties}
          />
        </div>
      </div>
    </div>
  );
}
