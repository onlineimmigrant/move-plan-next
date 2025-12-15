'use client';

import React, { useState } from 'react';
import { useSubscribers } from '../../hooks/useSubscribers';
import { Filter, Plus, X } from 'lucide-react';
import Button from '@/ui/Button';

interface SegmentBuilderProps {
  listId: number;
  onSegmentCreated?: (subscriberIds: number[]) => void;
  primary: { base: string; hover: string };
}

interface FilterRule {
  id: string;
  field: 'email' | 'first_name' | 'last_name' | 'status' | 'created_at' | 'subscribed_at';
  operator: 'contains' | 'equals' | 'not_equals' | 'starts_with' | 'ends_with' | 'before' | 'after';
  value: string;
}

export default function SegmentBuilder({ listId, onSegmentCreated, primary }: SegmentBuilderProps) {
  const { subscribers, fetchSubscribers } = useSubscribers();
  const [filters, setFilters] = useState<FilterRule[]>([]);
  const [segmentName, setSegmentName] = useState('');

  const addFilter = () => {
    setFilters([
      ...filters,
      {
        id: Math.random().toString(36).substr(2, 9),
        field: 'email',
        operator: 'contains',
        value: '',
      },
    ]);
  };

  const removeFilter = (id: string) => {
    setFilters(filters.filter((f) => f.id !== id));
  };

  const updateFilter = (id: string, updates: Partial<FilterRule>) => {
    setFilters(filters.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  };

  const applyFilters = () => {
    const filtered = subscribers.filter((subscriber) => {
      return filters.every((filter) => {
        let fieldValue: string;
        
        if (filter.field === 'created_at') {
          fieldValue = subscriber.subscribed_at || '';
        } else {
          fieldValue = String(subscriber[filter.field as keyof typeof subscriber] || '').toLowerCase();
        }
        
        const filterValue = filter.value.toLowerCase();

        switch (filter.operator) {
          case 'contains':
            return fieldValue.toLowerCase().includes(filterValue);
          case 'equals':
            return fieldValue.toLowerCase() === filterValue;
          case 'not_equals':
            return fieldValue.toLowerCase() !== filterValue;
          case 'starts_with':
            return fieldValue.toLowerCase().startsWith(filterValue);
          case 'ends_with':
            return fieldValue.toLowerCase().endsWith(filterValue);
          case 'before':
            return new Date(subscriber.subscribed_at) < new Date(filterValue);
          case 'after':
            return new Date(subscriber.subscribed_at) > new Date(filterValue);
          default:
            return true;
        }
      });
    });

    return filtered;
  };

  const matchedSubscribers = filters.length > 0 ? applyFilters() : subscribers;

  const handleSaveSegment = () => {
    if (onSegmentCreated) {
      onSegmentCreated(matchedSubscribers.map((s) => s.id));
    }
  };

  React.useEffect(() => {
    if (listId) {
      fetchSubscribers(listId);
    }
  }, [listId]);

  const fieldOptions = [
    { value: 'email', label: 'Email' },
    { value: 'first_name', label: 'First Name' },
    { value: 'last_name', label: 'Last Name' },
    { value: 'status', label: 'Status' },
    { value: 'created_at', label: 'Created Date' },
  ];

  const operatorOptions: Record<string, Array<{ value: string; label: string }>> = {
    email: [
      { value: 'contains', label: 'Contains' },
      { value: 'equals', label: 'Equals' },
      { value: 'not_equals', label: 'Not Equals' },
      { value: 'starts_with', label: 'Starts With' },
      { value: 'ends_with', label: 'Ends With' },
    ],
    first_name: [
      { value: 'contains', label: 'Contains' },
      { value: 'equals', label: 'Equals' },
      { value: 'starts_with', label: 'Starts With' },
    ],
    last_name: [
      { value: 'contains', label: 'Contains' },
      { value: 'equals', label: 'Equals' },
      { value: 'starts_with', label: 'Starts With' },
    ],
    status: [
      { value: 'equals', label: 'Equals' },
      { value: 'not_equals', label: 'Not Equals' },
    ],
    created_at: [
      { value: 'before', label: 'Before' },
      { value: 'after', label: 'After' },
    ],
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
        <div>
          <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 text-sm sm:text-base">
            <Filter className="w-4 h-4 sm:w-5 sm:h-5" />
            Segment Builder
          </h4>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
            Create dynamic segments based on subscriber attributes
          </p>
        </div>
        <Button onClick={addFilter} variant="light-outline" size="sm" className="min-h-[44px] w-full sm:w-auto">
          <Plus className="w-4 h-4" />
          <span className="ml-2">Add Filter</span>
        </Button>
      </div>

      {/* Filter Rules */}
      <div className="space-y-3">
        {filters.map((filter, index) => (
          <div key={filter.id} className="flex items-center gap-2 p-3 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
            {index > 0 && (
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400 px-2">
                AND
              </span>
            )}
            
            <select
              value={filter.field}
              onChange={(e) => updateFilter(filter.id, { field: e.target.value as any, operator: 'contains' })}
              className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
            >
              {fieldOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <select
              value={filter.operator}
              onChange={(e) => updateFilter(filter.id, { operator: e.target.value as any })}
              className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
            >
              {operatorOptions[filter.field]?.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <input
              type={filter.field === 'created_at' ? 'date' : 'text'}
              value={filter.value}
              onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
              placeholder="Value..."
              className="flex-1 px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
            />

            <button
              onClick={() => removeFilter(filter.id)}
              className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}

        {filters.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Filter className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No filters added yet. Click "Add Filter" to start building your segment.</p>
          </div>
        )}
      </div>

      {/* Results Preview */}
      {filters.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h5 className="font-medium text-blue-700 dark:text-blue-400">
              Matching Subscribers: {matchedSubscribers.length}
            </h5>
            {matchedSubscribers.length > 0 && (
              <Button onClick={handleSaveSegment} variant="primary" size="sm">
                Use This Segment
              </Button>
            )}
          </div>
          
          <div className="max-h-48 overflow-y-auto space-y-1">
            {matchedSubscribers.slice(0, 10).map((sub) => (
              <div key={sub.id} className="text-sm text-blue-600 dark:text-blue-400 bg-white dark:bg-blue-900/30 px-3 py-1.5 rounded">
                {sub.email} {sub.first_name && `- ${sub.first_name} ${sub.last_name || ''}`}
              </div>
            ))}
            {matchedSubscribers.length > 10 && (
              <p className="text-xs text-blue-600 dark:text-blue-400 text-center py-2">
                + {matchedSubscribers.length - 10} more subscribers
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
