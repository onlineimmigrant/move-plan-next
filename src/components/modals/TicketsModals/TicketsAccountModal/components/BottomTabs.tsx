import React, { useState } from 'react';
import type { Ticket } from '../../shared/types';
import { useThemeColors } from '@/hooks/useThemeColors';

interface BottomTabsProps {
  statuses: string[];
  activeTab: string;
  groupedTickets: Record<string, Ticket[]>;
  onTabChange: (status: string) => void;
}

export default function BottomTabs({
  statuses,
  activeTab,
  groupedTickets,
  onTabChange,
}: BottomTabsProps) {
  const [hoveredStatus, setHoveredStatus] = useState<string | null>(null);
  const themeColors = useThemeColors();
  const primary = themeColors.cssVars.primary;

  return (
    <div className="flex justify-center px-4 py-3 bg-white/40 dark:bg-gray-800/40 backdrop-blur-md border-b border-white/10 dark:border-gray-700/20 w-full">
      <nav className="flex gap-2 overflow-x-auto scrollbar-hide w-full" aria-label="Status filter" style={{ WebkitOverflowScrolling: 'touch' }}>
        {statuses.map((status) => {
          const isActive = activeTab === status;
          const count = groupedTickets[status].length;
          
          return (
            <button
              key={status}
              onClick={() => onTabChange(status)}
              onMouseEnter={() => setHoveredStatus(status)}
              onMouseLeave={() => setHoveredStatus(null)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all duration-300 shadow-sm flex-shrink-0"
              style={
                isActive
                  ? {
                      background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`,
                      color: 'white',
                      boxShadow: hoveredStatus === status 
                        ? `0 4px 12px ${primary.base}40` 
                        : `0 2px 4px ${primary.base}30`,
                    }
                  : {
                      backgroundColor: 'transparent',
                      color: hoveredStatus === status ? primary.hover : primary.base,
                      borderWidth: '1px',
                      borderStyle: 'solid',
                      borderColor: hoveredStatus === status ? `${primary.base}80` : `${primary.base}40`,
                    }
              }
            >
              <span className="capitalize">{status}</span>
              <span className={`flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-semibold ${
                isActive
                  ? 'bg-white/25 text-white'
                  : status === 'in progress'
                  ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300'
                  : status === 'open'
                  ? 'bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-300'
                  : status === 'closed'
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
