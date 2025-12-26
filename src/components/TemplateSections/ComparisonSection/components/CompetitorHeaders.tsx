import React from 'react';
import { Minus } from 'lucide-react';
import { TABLE_CELL_PADDING, TABLE_COL_WIDTH, TABLE_HEADER_TEXT, COMP_COL_BORDER } from '../constants';

/**
 * CompetitorHeaders displays the header cells for competitor columns.
 * Includes logos, links, and remove buttons.
 */

interface CompetitorHeadersProps {
  competitors: any[];
  availableCompetitors?: any[];
  canRemoveCompetitors: boolean;
  onRemoveCompetitor: (competitorId: string) => void;
}

const CompetitorHeadersComponent: React.FC<CompetitorHeadersProps> = ({
  competitors,
  canRemoveCompetitors,
  onRemoveCompetitor,
}) => {
  return (
    <>
      {competitors.map((competitor) => (
        <th
          key={competitor.id}
          className={`group/competitor text-center ${TABLE_CELL_PADDING} ${TABLE_COL_WIDTH} ${TABLE_HEADER_TEXT} relative overflow-hidden ${COMP_COL_BORDER}`}
        >
          <div className="flex flex-col items-center gap-1">
            {canRemoveCompetitors && (
              <button
                type="button"
                onClick={() => onRemoveCompetitor(competitor.id)}
                className="absolute top-1 right-1 h-6 w-6 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-sm hidden group-hover/competitor:inline-flex hover:bg-gray-50 focus:inline-flex"
                aria-label={`Remove ${competitor.name} from comparison`}
                title="Remove competitor"
              >
                <Minus className="h-4 w-4" />
              </button>
            )}
            {competitor.logo_url && (
              <img
                src={competitor.logo_url}
                alt={competitor.name}
                className="h-6 sm:h-8 w-auto object-contain"
              />
            )}
            {competitor.website_url ? (
              <a 
                href={competitor.website_url}
                target="_blank"
                rel="nofollow noopener noreferrer"
                className="text-xs sm:text-sm font-semibold hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {competitor.name}
              </a>
            ) : (
              <span className="text-xs sm:text-sm font-semibold">{competitor.name}</span>
            )}
          </div>
        </th>
      ))}
    </>
  );
};

export const CompetitorHeaders = React.memo(CompetitorHeadersComponent);
