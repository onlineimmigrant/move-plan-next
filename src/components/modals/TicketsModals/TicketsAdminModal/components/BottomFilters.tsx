import React from 'react';
import type { Ticket } from '../types';

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
  return (
    <>
      {/* Assignment Filter */}
      <div className="flex justify-center px-2 py-2 bg-white/30 dark:bg-gray-900/30 backdrop-blur-sm border-t border-slate-200 dark:border-gray-700">
        <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-2xl p-1 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 w-full">
          {/* Background slider */}
          <div 
            className={`absolute top-1 h-[calc(100%-8px)] bg-white dark:bg-gray-700 rounded-xl shadow-sm border border-gray-100 dark:border-gray-600 transition-all duration-150 ease-out ${
              assignmentFilter === 'all' 
                ? 'left-1 w-[calc(33.333%-4px)]' 
                : assignmentFilter === 'my'
                ? 'left-[calc(33.333%+1px)] w-[calc(33.333%-4px)]'
                : 'left-[calc(66.666%+1px)] w-[calc(33.333%-4px)]'
            }`}
          />
          
          <div className="relative flex">
            {/* All Tickets */}
            <button
              onClick={() => setAssignmentFilter('all')}
              className={`relative px-2 py-2 rounded-xl text-xs font-medium transition-all duration-150 ease-out antialiased tracking-[-0.01em] flex-1 flex items-center justify-center gap-1 ${
                assignmentFilter === 'all'
                  ? 'text-gray-900'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <span className="whitespace-nowrap">All</span>
              <span className={`flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-semibold transition-all duration-150 ${
                assignmentFilter === 'all'
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {tickets.length}
              </span>
            </button>
            
            {/* My Tickets */}
            <button
              onClick={() => setAssignmentFilter('my')}
              className={`relative px-2 py-2 rounded-xl text-xs font-medium transition-all duration-150 ease-out antialiased tracking-[-0.01em] flex-1 flex items-center justify-center gap-1 ${
                assignmentFilter === 'my'
                  ? 'text-gray-900'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <span className="whitespace-nowrap">My</span>
              <span className={`flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-semibold transition-all duration-150 ${
                assignmentFilter === 'my'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {currentUserId ? tickets.filter(t => t.assigned_to === currentUserId).length : 0}
              </span>
            </button>
            
            {/* Unassigned */}
            <button
              onClick={() => setAssignmentFilter('unassigned')}
              className={`relative px-2 py-2 rounded-xl text-xs font-medium transition-all duration-150 ease-out antialiased tracking-[-0.01em] flex-1 flex items-center justify-center gap-1 ${
                assignmentFilter === 'unassigned'
                  ? 'text-gray-900'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <span className="whitespace-nowrap">Unassigned</span>
              <span className={`flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-semibold transition-all duration-150 ${
                assignmentFilter === 'unassigned'
                  ? 'bg-amber-600 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {tickets.filter(t => !t.assigned_to).length}
              </span>
            </button>
          </div>
        </div>
      </div>
    
      {/* Priority Filter */}
      <div className="flex justify-center px-2 py-2 bg-white border-t border-slate-200">
        <div className="relative bg-white/80 backdrop-blur-2xl p-1 rounded-2xl border border-gray-200/50 w-full">
          {/* Background slider */}
          <div 
            className={`absolute top-1 h-[calc(100%-8px)] bg-white rounded-xl shadow-sm border border-gray-100 transition-all duration-150 ease-out ${
              priorityFilter === 'all' 
                ? 'left-1 w-[calc(25%-4px)]' 
                : priorityFilter === 'high'
                ? 'left-[calc(25%+1px)] w-[calc(25%-4px)]'
                : priorityFilter === 'medium'
                ? 'left-[calc(50%+1px)] w-[calc(25%-4px)]'
                : 'left-[calc(75%+1px)] w-[calc(25%-4px)]'
            }`}
          />
          
          <div className="relative flex">
            {/* All */}
            <button
              onClick={() => setPriorityFilter('all')}
              className={`relative px-2 py-2 rounded-xl text-xs font-medium transition-all duration-150 ease-out antialiased tracking-[-0.01em] flex-1 flex items-center justify-center gap-1 ${
                priorityFilter === 'all'
                  ? 'text-gray-900'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <span className="whitespace-nowrap">All</span>
              <span className={`flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-semibold transition-all duration-150 ${
                priorityFilter === 'all'
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {tickets.length}
              </span>
            </button>
            
            {/* High */}
            <button
              onClick={() => setPriorityFilter('high')}
              className={`relative px-2 py-2 rounded-xl text-xs font-medium transition-all duration-150 ease-out antialiased tracking-[-0.01em] flex-1 flex items-center justify-center gap-1 ${
                priorityFilter === 'high'
                  ? 'text-gray-900'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <span className="whitespace-nowrap">High</span>
              <span className={`flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-semibold transition-all duration-150 ${
                priorityFilter === 'high'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {tickets.filter(t => t.priority === 'high').length}
              </span>
            </button>
            
            {/* Medium */}
            <button
              onClick={() => setPriorityFilter('medium')}
              className={`relative px-2 py-2 rounded-xl text-xs font-medium transition-all duration-150 ease-out antialiased tracking-[-0.01em] flex-1 flex items-center justify-center gap-1 ${
                priorityFilter === 'medium'
                  ? 'text-gray-900'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <span className="whitespace-nowrap">Medium</span>
              <span className={`flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-semibold transition-all duration-150 ${
                priorityFilter === 'medium'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {tickets.filter(t => t.priority === 'medium').length}
              </span>
            </button>
            
            {/* Low */}
            <button
              onClick={() => setPriorityFilter('low')}
              className={`relative px-2 py-2 rounded-xl text-xs font-medium transition-all duration-150 ease-out antialiased tracking-[-0.01em] flex-1 flex items-center justify-center gap-1 ${
                priorityFilter === 'low'
                  ? 'text-gray-900'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <span className="whitespace-nowrap">Low</span>
              <span className={`flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-semibold transition-all duration-150 ${
                priorityFilter === 'low'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {tickets.filter(t => t.priority === 'low' || !t.priority).length}
              </span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Status Tabs */}
      <div className="flex justify-center px-2 py-2 bg-white border-t border-slate-200">
        <div className="relative bg-white/80 backdrop-blur-2xl p-1 rounded-2xl border border-gray-200/50 w-full">
          {/* Background slider */}
          <div 
            className={`absolute top-1 h-[calc(100%-8px)] bg-white rounded-xl shadow-sm border border-gray-100 transition-all duration-150 ease-out ${
              activeTab === 'all' 
                ? 'left-1 w-[calc(25%-4px)]' 
                : activeTab === 'in progress' 
                ? 'left-[calc(25%+1px)] w-[calc(25%-4px)]' 
                : activeTab === 'open'
                ? 'left-[calc(50%+1px)] w-[calc(25%-4px)]'
                : 'left-[calc(75%+1px)] w-[calc(25%-4px)]'
            }`}
          />
          
          <div className="relative flex">
            {statuses.map((status) => {
              const isActive = activeTab === status;
              const count = groupedTickets[status].length;
              
              return (
                <button
                  key={status}
                  onClick={() => setActiveTab(status)}
                  className={`relative px-2 py-2 rounded-xl text-xs font-medium transition-all duration-150 ease-out antialiased tracking-[-0.01em] flex-1 flex items-center justify-center gap-1 ${
                    isActive
                      ? 'text-gray-900'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <span className="capitalize whitespace-nowrap">{status}</span>
                  <span className={`flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-semibold transition-all duration-150 ${
                    isActive
                      ? status === 'all'
                        ? 'bg-gray-900 text-white'
                        : status === 'in progress'
                        ? 'bg-blue-600 text-white'
                        : status === 'open'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
