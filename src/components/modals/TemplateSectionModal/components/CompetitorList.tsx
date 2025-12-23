'use client';

import React, { useState } from 'react';
import { ComparisonCompetitor } from '@/types/comparison';
import { useThemeColors } from '@/hooks/useThemeColors';
import { PencilIcon, TrashIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { CompetitorCardSkeleton } from '@/components/ui/Skeleton';

interface CompetitorListProps {
  competitors: ComparisonCompetitor[];
  selectedIds: string[];
  loading: boolean;
  onToggleSelect: (id: string) => void;
  onEdit: (competitor: ComparisonCompetitor) => void;
  onDelete: (id: string) => void;
}

export function CompetitorList({
  competitors,
  selectedIds,
  loading,
  onToggleSelect,
  onEdit,
  onDelete
}: CompetitorListProps) {
  const themeColors = useThemeColors();

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <CompetitorCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (competitors.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-lg">
        <p className="text-gray-600">No competitors added yet.</p>
        <p className="text-sm text-gray-500 mt-1">Click "Add Competitor" to get started.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3">
      {competitors.map((competitor) => (
        <div
          key={competitor.id}
          className="flex items-center gap-3 p-4 rounded-lg hover:bg-gray-50 transition-colors"
          style={{ borderColor: themeColors.cssVars.primary.border, borderWidth: '1px' }}
          role="checkbox"
          aria-checked={selectedIds.includes(competitor.id)}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onToggleSelect(competitor.id);
            }
          }}
        >
          <input
            type="checkbox"
            checked={selectedIds.includes(competitor.id)}
            onChange={() => onToggleSelect(competitor.id)}
            className="h-4 w-4"
            style={{ accentColor: themeColors.cssVars.primary.base }}
            aria-label={`Select ${competitor.name}`}
          />
          {competitor.logo_url && (
            <img
              src={competitor.logo_url}
              alt={`${competitor.name} logo`}
              className="h-8 w-8 rounded object-contain"
            />
          )}
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{competitor.name}</p>
            {competitor.website_url && (
              <a
                href={competitor.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline truncate block"
                aria-label={`Visit ${competitor.name} website`}
              >
                {competitor.website_url}
              </a>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onEdit(competitor)}
              className="p-2 text-gray-600 hover:text-blue-600 rounded transition-colors"
              title="Edit competitor"
              aria-label={`Edit ${competitor.name}`}
            >
              <PencilIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDelete(competitor.id)}
              className="p-2 text-gray-600 hover:text-red-600 rounded transition-colors"
              title="Delete competitor"
              aria-label={`Delete ${competitor.name}`}
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}