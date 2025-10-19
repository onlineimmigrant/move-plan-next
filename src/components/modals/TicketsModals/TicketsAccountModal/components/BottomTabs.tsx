import React from 'react';
import type { Ticket } from '../../shared/types';

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
  return (
    <div className="relative bg-white/80 backdrop-blur-2xl p-1 rounded-2xl border border-gray-200/50 w-full">
      {/* Background slider */}
      <div 
        className={`absolute top-1 h-[calc(100%-8px)] bg-white rounded-xl shadow-sm border border-gray-100 transition-all duration-150 ease-out ${
          activeTab === 'in progress' 
            ? 'left-1 w-[calc(33.333%-4px)]' 
            : activeTab === 'open'
            ? 'left-[calc(33.333%+1px)] w-[calc(33.333%-4px)]'
            : 'left-[calc(66.666%+1px)] w-[calc(33.333%-4px)]'
        }`}
      />
      
      <div className="relative flex">
        {statuses.map((status) => {
          const isActive = activeTab === status;
          
          return (
            <button
              key={status}
              onClick={() => onTabChange(status)}
              className={`relative px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ease-out antialiased tracking-[-0.01em] flex-1 flex items-center justify-center ${
                isActive
                  ? 'text-gray-900'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <span className="capitalize">{status}</span>
              <span className="ml-1 text-xs opacity-60">
                ({groupedTickets[status].length})
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
