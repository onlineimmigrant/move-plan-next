import React, { useState } from 'react';
import { BarChart3, Settings, SlidersHorizontal, ChevronDown, ChevronUp } from 'lucide-react';
import type { TicketTag, Ticket } from '../types';
import { useThemeColors } from '@/hooks/useThemeColors';

interface TicketListToolbarProps {
  onViewAnalytics: () => void;
  onViewAssignmentRules: () => void;
  // Filter props
  availableTags: TicketTag[];
  selectedTags: string[];
  onTagSelect: (tagId: string) => void;
  // Sort props
  sortBy: 'date-newest' | 'date-oldest' | 'priority' | 'responses' | 'updated';
  onSortChange: (sortBy: 'date-newest' | 'date-oldest' | 'priority' | 'responses' | 'updated') => void;
  // Tab filters from BottomFilters
  assignmentFilter: 'all' | 'my' | 'unassigned';
  priorityFilter: 'all' | 'high' | 'medium' | 'low';
  activeTab: string;
  tickets: Ticket[];
  currentUserId: string | null;
  groupedTickets: { [key: string]: Ticket[] };
  statuses: string[];
  setAssignmentFilter: (filter: 'all' | 'my' | 'unassigned') => void;
  setPriorityFilter: (filter: 'all' | 'high' | 'medium' | 'low') => void;
  setActiveTab: (tab: string) => void;
}

export default function TicketListToolbar({
  onViewAnalytics,
  onViewAssignmentRules,
  availableTags,
  selectedTags,
  onTagSelect,
  sortBy,
  onSortChange,
  assignmentFilter,
  priorityFilter,
  activeTab,
  tickets,
  currentUserId,
  groupedTickets,
  statuses,
  setAssignmentFilter,
  setPriorityFilter,
  setActiveTab,
}: TicketListToolbarProps) {
  const [showFiltersAccordion, setShowFiltersAccordion] = useState(false);
  const [hoveredAssignment, setHoveredAssignment] = useState<string | null>(null);
  const [hoveredPriority, setHoveredPriority] = useState<string | null>(null);
  const [hoveredStatus, setHoveredStatus] = useState<string | null>(null);
  const themeColors = useThemeColors();
  const primary = themeColors.cssVars.primary;

  return (
    <div className="border-t border-white/10 dark:border-gray-700/20 bg-white/40 dark:bg-gray-800/40 backdrop-blur-md rounded-b-2xl">
      {/* Main toolbar */}
      <div className="flex items-center justify-between px-4 py-2 gap-2">
        {/* Left side - Filters button */}
        <button
          onClick={() => setShowFiltersAccordion(!showFiltersAccordion)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm hover:bg-white/70 dark:hover:bg-gray-800/70"
          aria-label="Toggle filters"
          title="Filters"
          style={{ color: primary.base }}
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span>Filters</span>
          {showFiltersAccordion ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>

        {/* Right side - Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onViewAnalytics}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm hover:bg-white/70 dark:hover:bg-gray-800/70"
            aria-label="View analytics dashboard"
            title="View Analytics"
            style={{ color: primary.base }}
          >
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Analytics</span>
          </button>
          
          <button
            onClick={onViewAssignmentRules}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm hover:bg-white/70 dark:hover:bg-gray-800/70"
            aria-label="Manage assignment rules and automation"
            title="Assignment Rules & Automation"
            style={{ color: primary.base }}
          >
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Rules</span>
          </button>
        </div>
      </div>

      {/* Filters accordion */}
      {showFiltersAccordion && (
        <div className="border-t border-white/10 dark:border-gray-700/20 p-4 bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm space-y-3">
          
          {/* Assignment Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
              Assignment
            </label>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
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
            </div>
          </div>

          {/* Priority Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
              Priority
            </label>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
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
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
              Status
            </label>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
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
            </div>
          </div>

          {/* Filter by Tag */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
              Tags
            </label>
            <div className="flex flex-wrap gap-2">
              {availableTags.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 italic">No tags available</p>
              ) : (
                availableTags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => onTagSelect(tag.id)}
                    className={`px-3 py-1.5 text-sm rounded-full transition-all shadow-sm ${
                      selectedTags.includes(tag.id)
                        ? 'font-medium'
                        : 'hover:shadow-md'
                    }`}
                    style={
                      selectedTags.includes(tag.id)
                        ? {
                            background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`,
                            color: 'white',
                            boxShadow: `0 2px 4px ${primary.base}30`,
                          }
                        : {
                            backgroundColor: 'transparent',
                            color: primary.base,
                            borderWidth: '1px',
                            borderStyle: 'solid',
                            borderColor: `${primary.base}40`,
                          }
                    }
                  >
                    {tag.name}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
              Sort By
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => onSortChange('updated')}
                className="px-3 py-1.5 text-sm rounded-full transition-all shadow-sm font-medium"
                style={
                  sortBy === 'updated'
                    ? {
                        background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`,
                        color: 'white',
                        boxShadow: `0 2px 4px ${primary.base}30`,
                      }
                    : {
                        backgroundColor: 'transparent',
                        color: primary.base,
                        borderWidth: '1px',
                        borderStyle: 'solid',
                        borderColor: `${primary.base}40`,
                      }
                }
              >
                Recent Activity
              </button>
              <button
                onClick={() => onSortChange('date-newest')}
                className="px-3 py-1.5 text-sm rounded-full transition-all shadow-sm font-medium"
                style={
                  sortBy === 'date-newest'
                    ? {
                        background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`,
                        color: 'white',
                        boxShadow: `0 2px 4px ${primary.base}30`,
                      }
                    : {
                        backgroundColor: 'transparent',
                        color: primary.base,
                        borderWidth: '1px',
                        borderStyle: 'solid',
                        borderColor: `${primary.base}40`,
                      }
                }
              >
                Newest First
              </button>
              <button
                onClick={() => onSortChange('date-oldest')}
                className="px-3 py-1.5 text-sm rounded-full transition-all shadow-sm font-medium"
                style={
                  sortBy === 'date-oldest'
                    ? {
                        background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`,
                        color: 'white',
                        boxShadow: `0 2px 4px ${primary.base}30`,
                      }
                    : {
                        backgroundColor: 'transparent',
                        color: primary.base,
                        borderWidth: '1px',
                        borderStyle: 'solid',
                        borderColor: `${primary.base}40`,
                      }
                }
              >
                Oldest First
              </button>
              <button
                onClick={() => onSortChange('priority')}
                className="px-3 py-1.5 text-sm rounded-full transition-all shadow-sm font-medium"
                style={
                  sortBy === 'priority'
                    ? {
                        background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`,
                        color: 'white',
                        boxShadow: `0 2px 4px ${primary.base}30`,
                      }
                    : {
                        backgroundColor: 'transparent',
                        color: primary.base,
                        borderWidth: '1px',
                        borderStyle: 'solid',
                        borderColor: `${primary.base}40`,
                      }
                }
              >
                Priority
              </button>
              <button
                onClick={() => onSortChange('responses')}
                className="px-3 py-1.5 text-sm rounded-full transition-all shadow-sm font-medium"
                style={
                  sortBy === 'responses'
                    ? {
                        background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`,
                        color: 'white',
                        boxShadow: `0 2px 4px ${primary.base}30`,
                      }
                    : {
                        backgroundColor: 'transparent',
                        color: primary.base,
                        borderWidth: '1px',
                        borderStyle: 'solid',
                        borderColor: `${primary.base}40`,
                      }
                }
              >
                Most Responses
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
