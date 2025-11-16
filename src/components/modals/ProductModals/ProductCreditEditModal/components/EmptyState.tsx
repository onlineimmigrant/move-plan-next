/**
 * EmptyState Component
 * 
 * Display when no products found
 */

'use client';

import React from 'react';
import { CubeIcon } from '@heroicons/react/24/outline';

interface EmptyStateProps {
  title: string;
  description: string;
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
        <CubeIcon className="h-12 w-12 text-gray-400 dark:text-gray-600" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 text-center max-w-sm">
        {description}
      </p>
    </div>
  );
}
