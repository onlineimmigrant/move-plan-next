import React, { useState } from 'react';
import type { Ticket } from '../types';
import { useThemeColors } from '@/hooks/useThemeColors';

interface BottomFiltersProps {
  // Filter states
  assignmentFilter: 'all' | 'my' | 'unassigned';
  priorityFilter: 'all' | 'high' | 'medium' | 'low';
  
  // Data
  tickets: Ticket[];
  currentUserId: string | null;
  activeTab: string;
  groupedTickets: { [key: string]: Ticket[] };
  statuses: string[];
  
  // Setters
  setAssignmentFilter: (filter: 'all' | 'my' | 'unassigned') => void;
  setPriorityFilter: (filter: 'all' | 'high' | 'medium' | 'low') => void;
  setActiveTab: (tab: string) => void;
}

const getPriorityLabel = (priority: string): string => {
  return priority.charAt(0).toUpperCase() + priority.slice(1);
};

export default function BottomFilters({
  assignmentFilter,
  priorityFilter,
  tickets,
  currentUserId,
  activeTab,
  groupedTickets,
  statuses,
  setAssignmentFilter,
  setPriorityFilter,
  setActiveTab,
}: BottomFiltersProps) {
  const [hoveredAssignment, setHoveredAssignment] = useState<string | null>(null);
  const [hoveredPriority, setHoveredPriority] = useState<string | null>(null);
  const [hoveredStatus, setHoveredStatus] = useState<string | null>(null);
  const themeColors = useThemeColors();
  const primary = themeColors.cssVars.primary;

  return (
    <>
      {/* Assignment Filter */}
      <div className="flex justify-center px-4 py-3 bg-white/40 dark:bg-gray-800/40 backdrop-blur-md border-t border-white/10 dark:border-gray-700/20">
        <nav className="flex gap-2 overflow-x-auto scrollbar-hide w-full" aria-label="Assignment filter" style={{ WebkitOverflowScrolling: 'touch' }}>
          <button
            onClick={() => setAssignmentFilter('all')}
            onMouseEnter={() => setHoveredAssignment('all')}
            onMouseLeave={() => setHoveredAssignment(null)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all duration-300 shadow-sm flex-shrink-0"
            style={
              assignmentFilter === 'all'
                ? {
                    background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`,
                    color: 'white',
                    boxShadow: hoveredAssignment === 'all' 
                      ? `0 4px 12px ${primary.base}40` 
                      : `0 2px 4px ${primary.base}30`,
                  }
                : {
                    backgroundColor: 'transparent',
                    color: hoveredAssignment === 'all' ? primary.hover : primary.base,
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: hoveredAssignment === 'all' ? `${primary.base}80` : `${primary.base}40`,
                  }
            }
          >
            <span>All</span>
            <span className={`flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-semibold ${
              assignmentFilter === 'all'
                ? 'bg-white/25 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
            }`}>
              {tickets.length}
            </span>
          </button>
          
          <button
            onClick={() => setAssignmentFilter('my')}
            onMouseEnter={() => setHoveredAssignment('my')}
            onMouseLeave={() => setHoveredAssignment(null)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all duration-300 shadow-sm flex-shrink-0"
            style={
              assignmentFilter === 'my'
                ? {
                    background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`,
                    color: 'white',
                    boxShadow: hoveredAssignment === 'my' 
                      ? `0 4px 12px ${primary.base}40` 
                      : `0 2px 4px ${primary.base}30`,
                  }
                : {
                    backgroundColor: 'transparent',
                    color: hoveredAssignment === 'my' ? primary.hover : primary.base,
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: hoveredAssignment === 'my' ? `${primary.base}80` : `${primary.base}40`,
                  }
            }
          >
            <span>My</span>
            <span className={`flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-semibold ${
              assignmentFilter === 'my'
                ? 'bg-white/25 text-white'
                : 'bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300'
            }`}>
              {currentUserId ? tickets.filter(t => t.assigned_to === currentUserId).length : 0}
            </span>
          </button>
          
          <button
            onClick={() => setAssignmentFilter('unassigned')}
            onMouseEnter={() => setHoveredAssignment('unassigned')}
            onMouseLeave={() => setHoveredAssignment(null)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all duration-300 shadow-sm flex-shrink-0"
            style={
              assignmentFilter === 'unassigned'
                ? {
                    background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`,
                    color: 'white',
                    boxShadow: hoveredAssignment === 'unassigned' 
                      ? `0 4px 12px ${primary.base}40` 
                      : `0 2px 4px ${primary.base}30`,
                  }
                : {
                    backgroundColor: 'transparent',
                    color: hoveredAssignment === 'unassigned' ? primary.hover : primary.base,
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: hoveredAssignment === 'unassigned' ? `${primary.base}80` : `${primary.base}40`,
                  }
            }
          >
            <span>Unassigned</span>
            <span className={`flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-semibold ${
              assignmentFilter === 'unassigned'
                ? 'bg-white/25 text-white'
                : 'bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-300'
            }`}>
              {tickets.filter(t => !t.assigned_to).length}
            </span>
          </button>
        </nav>
      </div>
      
      {/* Priority Filter */}
      <div className="flex justify-center px-4 py-3 bg-white/40 dark:bg-gray-800/40 backdrop-blur-md border-t border-white/10 dark:border-gray-700/20">
        <nav className="flex gap-2 overflow-x-auto scrollbar-hide w-full" aria-label="Priority filter" style={{ WebkitOverflowScrolling: 'touch' }}>
          <button
            onClick={() => setPriorityFilter('all')}
            onMouseEnter={() => setHoveredPriority('all')}
            onMouseLeave={() => setHoveredPriority(null)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all duration-300 shadow-sm flex-shrink-0"
            style={
              priorityFilter === 'all'
                ? {
                    background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`,
                    color: 'white',
                    boxShadow: hoveredPriority === 'all' 
                      ? `0 4px 12px ${primary.base}40` 
                      : `0 2px 4px ${primary.base}30`,
                  }
                : {
                    backgroundColor: 'transparent',
                    color: hoveredPriority === 'all' ? primary.hover : primary.base,
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: hoveredPriority === 'all' ? `${primary.base}80` : `${primary.base}40`,
                  }
            }
          >
            <span>All</span>
            <span className={`flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-semibold ${
              priorityFilter === 'all'
                ? 'bg-white/25 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
            }`}>
              {tickets.length}
            </span>
          </button>
          
          <button
            onClick={() => setPriorityFilter('high')}
            onMouseEnter={() => setHoveredPriority('high')}
            onMouseLeave={() => setHoveredPriority(null)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all duration-300 shadow-sm flex-shrink-0"
            style={
              priorityFilter === 'high'
                ? {
                    background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`,
                    color: 'white',
                    boxShadow: hoveredPriority === 'high' 
                      ? `0 4px 12px ${primary.base}40` 
                      : `0 2px 4px ${primary.base}30`,
                  }
                : {
                    backgroundColor: 'transparent',
                    color: hoveredPriority === 'high' ? primary.hover : primary.base,
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: hoveredPriority === 'high' ? `${primary.base}80` : `${primary.base}40`,
                  }
            }
          >
            <span>High</span>
            <span className={`flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-semibold ${
              priorityFilter === 'high'
                ? 'bg-white/25 text-white'
                : 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-300'
            }`}>
              {tickets.filter(t => t.priority === 'high').length}
            </span>
          </button>
          
          <button
            onClick={() => setPriorityFilter('medium')}
            onMouseEnter={() => setHoveredPriority('medium')}
            onMouseLeave={() => setHoveredPriority(null)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all duration-300 shadow-sm flex-shrink-0"
            style={
              priorityFilter === 'medium'
                ? {
                    background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`,
                    color: 'white',
                    boxShadow: hoveredPriority === 'medium' 
                      ? `0 4px 12px ${primary.base}40` 
                      : `0 2px 4px ${primary.base}30`,
                  }
                : {
                    backgroundColor: 'transparent',
                    color: hoveredPriority === 'medium' ? primary.hover : primary.base,
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: hoveredPriority === 'medium' ? `${primary.base}80` : `${primary.base}40`,
                  }
            }
          >
            <span>Medium</span>
            <span className={`flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-semibold ${
              priorityFilter === 'medium'
                ? 'bg-white/25 text-white'
                : 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-600 dark:text-yellow-300'
            }`}>
              {tickets.filter(t => t.priority === 'medium').length}
            </span>
          </button>
          
          <button
            onClick={() => setPriorityFilter('low')}
            onMouseEnter={() => setHoveredPriority('low')}
            onMouseLeave={() => setHoveredPriority(null)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all duration-300 shadow-sm flex-shrink-0"
            style={
              priorityFilter === 'low'
                ? {
                    background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`,
                    color: 'white',
                    boxShadow: hoveredPriority === 'low' 
                      ? `0 4px 12px ${primary.base}40` 
                      : `0 2px 4px ${primary.base}30`,
                  }
                : {
                    backgroundColor: 'transparent',
                    color: hoveredPriority === 'low' ? primary.hover : primary.base,
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: hoveredPriority === 'low' ? `${primary.base}80` : `${primary.base}40`,
                  }
            }
          >
            <span>Low</span>
            <span className={`flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-semibold ${
              priorityFilter === 'low'
                ? 'bg-white/25 text-white'
                : 'bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-300'
            }`}>
              {tickets.filter(t => t.priority === 'low' || !t.priority).length}
            </span>
          </button>
        </nav>
      </div>
      
      {/* Status Tabs */}
      <div className="flex justify-center px-4 py-3 bg-white/40 dark:bg-gray-800/40 backdrop-blur-md border-t border-white/10 dark:border-gray-700/20">
        <nav className="flex gap-2 overflow-x-auto scrollbar-hide w-full" aria-label="Status filter" style={{ WebkitOverflowScrolling: 'touch' }}>
          {statuses.map((status) => {
            const isActive = activeTab === status;
            const count = groupedTickets[status].length;
            
            return (
              <button
                key={status}
                onClick={() => setActiveTab(status)}
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
    </>
  );
}
