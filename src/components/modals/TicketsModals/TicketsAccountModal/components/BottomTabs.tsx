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
    <div className="relative backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 p-1 rounded-2xl border border-white/30 dark:border-gray-700/30 w-full shadow-sm">
      {/* Background slider */}
      <div 
        className={`absolute top-1 h-[calc(100%-8px)] backdrop-blur-md bg-white/60 dark:bg-gray-800/60 rounded-xl shadow-md border border-white/40 dark:border-gray-700/40 transition-all duration-150 ease-out ${
          activeTab === 'in progress' 
            ? 'left-1 w-[calc(33.333%-4px)]' 
            : activeTab === 'open'
            ? 'left-[calc(33.333%+1px)] w-[calc(33.333%-4px)]'
            : 'left-[calc(66.666%+1px)] w-[calc(33.333%-4px)]'
        }`}
        style={{
          backgroundColor: 'color-mix(in srgb, var(--color-primary-base) 8%, rgb(255 255 255 / 0.6))',
        }}
      />
      
      <div className="relative flex">
        {statuses.map((status) => {
          const isActive = activeTab === status;
          
          return (
            <button
              key={status}
              onClick={() => onTabChange(status)}
              className={`relative px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ease-out antialiased tracking-[-0.01em] flex-1 flex items-center justify-center hover:scale-105 active:scale-95 ${
                isActive
                  ? 'dark:text-slate-100'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
              style={isActive ? {
                color: 'var(--color-primary-base)',
              } : {
                '--hover-text': 'color-mix(in srgb, var(--color-primary-base) 70%, currentColor)',
              } as React.CSSProperties}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = 'var(--hover-text)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = '';
                }
              }}
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
