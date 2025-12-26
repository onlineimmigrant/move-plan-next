import React from 'react';
import { Plus } from 'lucide-react';

/**
 * AddCompetitorDropdown allows users to add competitors to the comparison.
 * Displays available competitors with logos in a dropdown menu.
 */

interface AddCompetitorDropdownProps {
  remainingCompetitors: any[];
  isOpen: boolean;
  onToggle: () => void;
  onAddCompetitor: (competitorId: string) => void;
}

const AddCompetitorDropdownComponent: React.FC<AddCompetitorDropdownProps> = ({
  remainingCompetitors,
  isOpen,
  onToggle,
  onAddCompetitor,
}) => {
  if (remainingCompetitors.length === 0) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50"
        aria-label="Add competitor"
        aria-expanded={isOpen}
      >
        <Plus className="h-4 w-4" />
        <span className="hidden sm:inline">Add</span>
      </button>

      {isOpen && remainingCompetitors.length > 0 && (
        <div className="absolute left-0 mt-2 w-56 rounded-lg border border-gray-200 bg-white shadow-lg z-20">
          <div className="p-2">
            <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              Add competitor
            </div>
            <div className="mt-1 max-h-64 overflow-auto">
              {remainingCompetitors.map((competitor) => (
                <button
                  key={competitor.id}
                  type="button"
                  onClick={() => {
                    onAddCompetitor(competitor.id);
                    onToggle();
                  }}
                  className="w-full flex items-center gap-2 rounded-md px-2 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  aria-label={`Add ${competitor.name} to comparison`}
                >
                  {competitor.logo_url ? (
                    <img 
                      src={competitor.logo_url} 
                      alt={competitor.name} 
                      className="h-5 w-5 object-contain" 
                    />
                  ) : (
                    <div className="h-5 w-5 rounded bg-gray-100" />
                  )}
                  <span className="truncate">{competitor.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const AddCompetitorDropdown = React.memo(AddCompetitorDropdownComponent);
