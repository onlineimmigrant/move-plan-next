import React from 'react';
import { TABLE_CELL_PADDING, TABLE_HEADER_TEXT, TABLE_FIRST_COL_WIDTH, TABLE_COL_WIDTH, OURS_COL_BORDER } from '../../constants';

export interface PricingTableHeaderProps {
  isRecurring: boolean;
  config: any;
  themeColors: any;
  siteName: string;
  organizationLogo?: string;
  competitorHeaders: React.ReactNode;
}

export const PricingTableHeader: React.FC<PricingTableHeaderProps> = ({
  isRecurring,
  config,
  themeColors,
  siteName,
  organizationLogo,
  competitorHeaders,
}) => {
  return (
    <thead>
      <tr className="border-b-2 border-gray-200">
        <th className={`text-left ${TABLE_CELL_PADDING} ${TABLE_HEADER_TEXT} ${TABLE_FIRST_COL_WIDTH}`}>
          {isRecurring ? 'Plan (Recurring)' : 'Plan (One-time)'}
        </th>
        <th
          className={`text-center ${TABLE_CELL_PADDING} ${TABLE_HEADER_TEXT} ${TABLE_COL_WIDTH} ${OURS_COL_BORDER}`}
          style={{
            backgroundColor: 'transparent',
            color: config.ui?.highlight_ours ? themeColors.cssVars.primary.base : undefined,
          }}
        >
          <div className="flex flex-col items-center gap-2">
            {organizationLogo && (
              <img 
                src={organizationLogo} 
                alt={siteName} 
                className="h-8 w-8 object-contain"
              />
            )}
            <span>{siteName}</span>
          </div>
        </th>
        {competitorHeaders}
      </tr>
    </thead>
  );
};
