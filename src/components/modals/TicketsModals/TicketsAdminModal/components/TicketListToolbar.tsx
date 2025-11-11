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
  // Tab filters - now multi-select arrays
  selectedAssignmentFilters: string[];
  selectedPriorityFilters: string[];
  activeTab: string[];
  tickets: Ticket[];
  currentUserId: string | null;
  groupedTickets: { [key: string]: Ticket[] };
  statuses: string[];
  setSelectedAssignmentFilters: React.Dispatch<React.SetStateAction<string[]>>;
  setSelectedPriorityFilters: React.Dispatch<React.SetStateAction<string[]>>;
  setActiveTab: React.Dispatch<React.SetStateAction<string[]>>;
}

export default function TicketListToolbar({
  onViewAnalytics,
  onViewAssignmentRules,
  availableTags,
  selectedTags,
  onTagSelect,
  sortBy,
  onSortChange,
  selectedAssignmentFilters,
  selectedPriorityFilters,
  activeTab,
  tickets,
  currentUserId,
  groupedTickets,
  statuses,
  setSelectedAssignmentFilters,
  setSelectedPriorityFilters,
  setActiveTab,
}: TicketListToolbarProps) {
  const [showFiltersAccordion, setShowFiltersAccordion] = useState(false);
  const [hoveredAssignment, setHoveredAssignment] = useState<string | null>(null);
  const [hoveredPriority, setHoveredPriority] = useState<string | null>(null);
  const themeColors = useThemeColors();
  const primary = themeColors.cssVars.primary;

  // Calculate filtered count
  const filteredCount = activeTab.length === 0 
    ? tickets.length 
    : activeTab.reduce((sum, status) => sum + (groupedTickets[status]?.length || 0), 0);
  const totalCount = tickets.length;

  return (
    <div className="border-t border-white/10 dark:border-gray-700/20 bg-white/40 dark:bg-gray-800/40 backdrop-blur-md rounded-b-2xl">
      {/* Main toolbar */}
      <div className="flex items-center justify-between px-5 py-3 gap-2">
        {/* Left side - Filters button */}
        <button
          onClick={() => setShowFiltersAccordion(!showFiltersAccordion)}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm hover:bg-white/70 dark:hover:bg-gray-800/70"
          aria-label="Toggle filters"
          title="Filters"
          style={{ color: primary.base }}
        >
          <SlidersHorizontal className="h-5 w-5" />
          <span>Filters</span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-white/30 dark:bg-gray-700/30">
            {filteredCount}({totalCount})
          </span>
          {showFiltersAccordion ? (
            <ChevronUp className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
        </button>

        {/* Right side - Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onViewAnalytics}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm hover:bg-white/70 dark:hover:bg-gray-800/70"
            aria-label="View analytics dashboard"
            title="View Analytics"
            style={{ color: primary.base }}
          >
            <BarChart3 className="h-5 w-5" />
            <span className="hidden sm:inline">Analytics</span>
          </button>
          
          <button
            onClick={onViewAssignmentRules}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm hover:bg-white/70 dark:hover:bg-gray-800/70"
            aria-label="Manage assignment rules and automation"
            title="Assignment Rules & Automation"
            style={{ color: primary.base }}
          >
            <Settings className="h-5 w-5" />
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
                onClick={() => {
                  setSelectedAssignmentFilters(prev =>
                    prev.includes('my')
                      ? prev.filter(f => f !== 'my')
                      : [...prev, 'my']
                  );
                }}
                onMouseEnter={() => setHoveredAssignment('my')}
                onMouseLeave={() => setHoveredAssignment(null)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all duration-300 shadow-sm flex-shrink-0"
                style={
                  selectedAssignmentFilters.includes('my')
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
                <span>My Tickets</span>
                <span className={`flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-semibold ${
                  selectedAssignmentFilters.includes('my')
                    ? 'bg-white/25 text-white'
                    : 'bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300'
                }`}>
                  {currentUserId ? tickets.filter(t => t.assigned_to === currentUserId).length : 0}
                </span>
              </button>
              
              <button
                onClick={() => {
                  setSelectedAssignmentFilters(prev =>
                    prev.includes('unassigned')
                      ? prev.filter(f => f !== 'unassigned')
                      : [...prev, 'unassigned']
                  );
                }}
                onMouseEnter={() => setHoveredAssignment('unassigned')}
                onMouseLeave={() => setHoveredAssignment(null)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all duration-300 shadow-sm flex-shrink-0"
                style={
                  selectedAssignmentFilters.includes('unassigned')
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
                  selectedAssignmentFilters.includes('unassigned')
                    ? 'bg-white/25 text-white'
                    : 'bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-300'
                }`}>
                  {tickets.filter(t => !t.assigned_to).length}
                </span>
              </button>
              
              <button
                onClick={() => {
                  setSelectedAssignmentFilters(prev =>
                    prev.includes('others')
                      ? prev.filter(f => f !== 'others')
                      : [...prev, 'others']
                  );
                }}
                onMouseEnter={() => setHoveredAssignment('others')}
                onMouseLeave={() => setHoveredAssignment(null)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all duration-300 shadow-sm flex-shrink-0"
                style={
                  selectedAssignmentFilters.includes('others')
                    ? {
                        background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`,
                        color: 'white',
                        boxShadow: hoveredAssignment === 'others' 
                          ? `0 4px 12px ${primary.base}40` 
                          : `0 2px 4px ${primary.base}30`,
                      }
                    : {
                        backgroundColor: 'transparent',
                        color: hoveredAssignment === 'others' ? primary.hover : primary.base,
                        borderWidth: '1px',
                        borderStyle: 'solid',
                        borderColor: hoveredAssignment === 'others' ? `${primary.base}80` : `${primary.base}40`,
                      }
                }
              >
                <span>Others</span>
                <span className={`flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-semibold ${
                  selectedAssignmentFilters.includes('others')
                    ? 'bg-white/25 text-white'
                    : 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300'
                }`}>
                  {currentUserId ? tickets.filter(t => t.assigned_to && t.assigned_to !== currentUserId).length : 0}
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
                onClick={() => {
                  setSelectedPriorityFilters(prev =>
                    prev.includes('high')
                      ? prev.filter(f => f !== 'high')
                      : [...prev, 'high']
                  );
                }}
                onMouseEnter={() => setHoveredPriority('high')}
                onMouseLeave={() => setHoveredPriority(null)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all duration-300 shadow-sm flex-shrink-0"
                style={
                  selectedPriorityFilters.includes('high')
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
                  selectedPriorityFilters.includes('high')
                    ? 'bg-white/25 text-white'
                    : 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-300'
                }`}>
                  {tickets.filter(t => t.priority === 'high').length}
                </span>
              </button>
              
              <button
                onClick={() => {
                  setSelectedPriorityFilters(prev =>
                    prev.includes('medium')
                      ? prev.filter(f => f !== 'medium')
                      : [...prev, 'medium']
                  );
                }}
                onMouseEnter={() => setHoveredPriority('medium')}
                onMouseLeave={() => setHoveredPriority(null)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all duration-300 shadow-sm flex-shrink-0"
                style={
                  selectedPriorityFilters.includes('medium')
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
                  selectedPriorityFilters.includes('medium')
                    ? 'bg-white/25 text-white'
                    : 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-600 dark:text-yellow-300'
                }`}>
                  {tickets.filter(t => t.priority === 'medium').length}
                </span>
              </button>
              
              <button
                onClick={() => {
                  setSelectedPriorityFilters(prev =>
                    prev.includes('low')
                      ? prev.filter(f => f !== 'low')
                      : [...prev, 'low']
                  );
                }}
                onMouseEnter={() => setHoveredPriority('low')}
                onMouseLeave={() => setHoveredPriority(null)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all duration-300 shadow-sm flex-shrink-0"
                style={
                  selectedPriorityFilters.includes('low')
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
                  selectedPriorityFilters.includes('low')
                    ? 'bg-white/25 text-white'
                    : 'bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-300'
                }`}>
                  {tickets.filter(t => t.priority === 'low' || !t.priority).length}
                </span>
              </button>
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
                availableTags.map((tag) => {
                  const tagCount = tickets.filter(ticket => 
                    ticket.tags?.some(t => t.id === tag.id)
                  ).length;
                  
                  return (
                    <button
                      key={tag.id}
                      onClick={() => onTagSelect(tag.id)}
                      className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-full transition-all shadow-sm ${
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
                      <span>{tag.name}</span>
                      <span className={`flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-semibold ${
                        selectedTags.includes(tag.id)
                          ? 'bg-white/25 text-white'
                          : 'bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300'
                      }`}>
                        {tagCount}
                      </span>
                    </button>
                  );
                })
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
