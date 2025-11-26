/**
 * EmptyQuestionsState - Placeholder when no questions exist
 */

'use client';

import React from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';

interface EmptyQuestionsStateProps {
  onAddFirst: () => void;
}

export function EmptyQuestionsState({ onAddFirst }: EmptyQuestionsStateProps) {
  return (
    <div className="text-center py-12">
      <p className="text-lg text-gray-400 mb-6">No questions added yet</p>
      <button
        onClick={onAddFirst}
        className="px-8 py-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl flex items-center gap-2 mx-auto"
      >
        <PlusIcon className="h-5 w-5" />
        Add your first question
      </button>
    </div>
  );
}
