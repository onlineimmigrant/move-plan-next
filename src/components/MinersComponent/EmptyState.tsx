'use client';

import React from 'react';
import Button from '@/ui/Button';
import { FilterState } from './types';

interface EmptyStateProps {
  filters: FilterState;
  isCreatingSample: boolean;
  onCreateSample: () => void;
}

export default function EmptyState({ filters, isCreatingSample, onCreateSample }: EmptyStateProps) {
  const hasActiveFilters = filters.search || filters.status.length > 0 || filters.user.length > 0 || filters.model.length > 0;

  return (
    <div className="text-center py-12">
      <div className="mb-4">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">No miners found</h3>
      <p className="text-gray-500 mb-4">
        {hasActiveFilters 
          ? 'No miners match your current filters. Try adjusting your search criteria.'
          : 'You don\'t have any miners in your organization yet. Create some sample miners to get started with the dashboard.'
        }
      </p>
      {!hasActiveFilters && (
        <Button
          onClick={onCreateSample}
          disabled={isCreatingSample}
          className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isCreatingSample ? 'Creating Sample Miners...' : 'Create Sample Miners'}
        </Button>
      )}
    </div>
  );
}
