import React from 'react';
import type { Ticket, TicketTag } from '../types';

interface AdminUser {
  id: string;
  email: string;
  full_name?: string;
}

interface BottomFiltersProps {
  // Filter states
  assignmentFilter: 'all' | 'my' | 'unassigned';
  priorityFilter: 'all' | 'high' | 'medium' | 'low';
  tagFilter: string;
  sortBy: 'date-newest' | 'date-oldest' | 'priority' | 'responses' | 'updated';
  showAdvancedFilters: boolean;
  filterLogic: 'AND' | 'OR';
  
  // Advanced filter states
  dateRangeStart: string;
  dateRangeEnd: string;
  multiSelectStatuses: string[];
  multiSelectPriorities: string[];
  multiSelectTags: string[];
  multiSelectAssignees: string[];
  
  // Data
  tickets: Ticket[];
  availableTags: TicketTag[];
  adminUsers: AdminUser[];
  currentUserId: string | null;
  activeTab: string;
  groupedTickets: { [key: string]: Ticket[] };
  statuses: string[];
  
  // Setters
  setAssignmentFilter: (filter: 'all' | 'my' | 'unassigned') => void;
  setPriorityFilter: (filter: 'all' | 'high' | 'medium' | 'low') => void;
  setTagFilter: (filter: string) => void;
  setSortBy: (sort: 'date-newest' | 'date-oldest' | 'priority' | 'responses' | 'updated') => void;
  setShowAdvancedFilters: (show: boolean) => void;
  setFilterLogic: (logic: 'AND' | 'OR') => void;
  setDateRangeStart: (date: string) => void;
  setDateRangeEnd: (date: string) => void;
  setMultiSelectStatuses: (statuses: string[] | ((prev: string[]) => string[])) => void;
  setMultiSelectPriorities: (priorities: string[] | ((prev: string[]) => string[])) => void;
  setMultiSelectTags: (tags: string[] | ((prev: string[]) => string[])) => void;
  setMultiSelectAssignees: (assignees: string[] | ((prev: string[]) => string[])) => void;
  setActiveTab: (tab: string) => void;
}

const getPriorityLabel = (priority: string): string => {
  return priority.charAt(0).toUpperCase() + priority.slice(1);
};

export default function BottomFilters({
  assignmentFilter,
  priorityFilter,
  tagFilter,
  sortBy,
  showAdvancedFilters,
  filterLogic,
  dateRangeStart,
  dateRangeEnd,
  multiSelectStatuses,
  multiSelectPriorities,
  multiSelectTags,
  multiSelectAssignees,
  tickets,
  availableTags,
  adminUsers,
  currentUserId,
  activeTab,
  groupedTickets,
  statuses,
  setAssignmentFilter,
  setPriorityFilter,
  setTagFilter,
  setSortBy,
  setShowAdvancedFilters,
  setFilterLogic,
  setDateRangeStart,
  setDateRangeEnd,
  setMultiSelectStatuses,
  setMultiSelectPriorities,
  setMultiSelectTags,
  setMultiSelectAssignees,
  setActiveTab,
}: BottomFiltersProps) {
  return (
    <>
      {/* Assignment Filter */}
      <div className="flex justify-center px-2 py-2 bg-slate-50 border-t border-slate-200">
        <div className="relative bg-white/80 backdrop-blur-2xl p-1 rounded-2xl border border-gray-200/50 w-full">
          {/* Background slider */}
          <div 
            className={`absolute top-1 h-[calc(100%-8px)] bg-white rounded-xl shadow-sm border border-gray-100 transition-all duration-150 ease-out ${
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
      
      {/* Tag Filter */}
      {availableTags.length > 0 && (
        <div className="px-2 py-2 bg-white border-t border-slate-200">
          <div className="text-xs font-medium text-slate-600 mb-2 px-1">Filter by Tag</div>
          <select
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Tags ({tickets.length})</option>
            {availableTags.map(tag => {
              const count = tickets.filter(t => t.tags?.some(tg => tg.id === tag.id)).length;
              return (
                <option key={tag.id} value={tag.id}>
                  {tag.name} ({count})
                </option>
              );
            })}
          </select>
        </div>
      )}
      
      {/* Sort By */}
      <div className="px-2 py-2 bg-white border-t border-slate-200">
        <div className="text-xs font-medium text-slate-600 mb-2 px-1">Sort By</div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="date-newest">Date (Newest First)</option>
          <option value="date-oldest">Date (Oldest First)</option>
          <option value="priority">Priority (High to Low)</option>
          <option value="responses">Most Responses</option>
          <option value="updated">Recently Updated</option>
        </select>
      </div>
      
      {/* Advanced Filters */}
      <div className="px-2 py-2 bg-white border-t border-slate-200">
        <button
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
        >
          <span className="flex items-center gap-2">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            Advanced Filters
          </span>
          <svg className={`h-4 w-4 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {showAdvancedFilters && (
          <div className="mt-3 space-y-3 animate-fade-in">
            {/* Filter Logic Toggle */}
            <div>
              <div className="text-xs font-medium text-slate-600 mb-2 px-1">Filter Logic</div>
              <div className="flex gap-2">
                <button
                  onClick={() => setFilterLogic('AND')}
                  className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    filterLogic === 'AND' 
                      ? 'bg-blue-500 text-white shadow-sm' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  AND (All)
                </button>
                <button
                  onClick={() => setFilterLogic('OR')}
                  className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    filterLogic === 'OR' 
                      ? 'bg-blue-500 text-white shadow-sm' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  OR (Any)
                </button>
              </div>
              <p className="text-[10px] text-slate-500 mt-1 px-1">
                {filterLogic === 'AND' ? 'Tickets must match ALL selected filters' : 'Tickets can match ANY selected filter'}
              </p>
            </div>
            
            {/* Date Range */}
            <div>
              <div className="text-xs font-medium text-slate-600 mb-2 px-1">Date Range</div>
              <div className="space-y-2">
                <input
                  type="date"
                  value={dateRangeStart}
                  onChange={(e) => setDateRangeStart(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Start date"
                />
                <input
                  type="date"
                  value={dateRangeEnd}
                  onChange={(e) => setDateRangeEnd(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="End date"
                />
              </div>
            </div>
            
            {/* Multi-select Statuses */}
            <div>
              <div className="text-xs font-medium text-slate-600 mb-2 px-1">Status</div>
              <div className="flex flex-wrap gap-1">
                {['open', 'in progress', 'closed'].map(status => (
                  <button
                    key={status}
                    onClick={() => {
                      setMultiSelectStatuses(prev => 
                        prev.includes(status) 
                          ? prev.filter(s => s !== status)
                          : [...prev, status]
                      );
                    }}
                    className={`px-2 py-1 text-[10px] font-medium rounded-full transition-all ${
                      multiSelectStatuses.includes(status)
                        ? 'bg-blue-500 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Multi-select Priorities */}
            <div>
              <div className="text-xs font-medium text-slate-600 mb-2 px-1">Priority</div>
              <div className="flex flex-wrap gap-1">
                {['high', 'medium', 'low'].map(priority => (
                  <button
                    key={priority}
                    onClick={() => {
                      setMultiSelectPriorities(prev => 
                        prev.includes(priority) 
                          ? prev.filter(p => p !== priority)
                          : [...prev, priority]
                      );
                    }}
                    className={`px-2 py-1 text-[10px] font-medium rounded-full transition-all ${
                      multiSelectPriorities.includes(priority)
                        ? priority === 'high' ? 'bg-red-500 text-white shadow-sm'
                        : priority === 'medium' ? 'bg-yellow-500 text-white shadow-sm'
                        : 'bg-green-500 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {priority}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Multi-select Tags */}
            {availableTags.length > 0 && (
              <div>
                <div className="text-xs font-medium text-slate-600 mb-2 px-1">Tags</div>
                <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                  {availableTags.map(tag => (
                    <button
                      key={tag.id}
                      onClick={() => {
                        setMultiSelectTags(prev => 
                          prev.includes(tag.id) 
                            ? prev.filter(t => t !== tag.id)
                            : [...prev, tag.id]
                        );
                      }}
                      className={`px-2 py-1 text-[10px] font-medium rounded-full border transition-all ${
                        multiSelectTags.includes(tag.id)
                          ? 'shadow-sm'
                          : 'opacity-60 hover:opacity-100'
                      }`}
                      style={{
                        backgroundColor: multiSelectTags.includes(tag.id) ? tag.color : `${tag.color}15`,
                        borderColor: `${tag.color}40`,
                        color: multiSelectTags.includes(tag.id) ? 'white' : tag.color
                      }}
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Multi-select Assignees */}
            {adminUsers.length > 0 && (
              <div>
                <div className="text-xs font-medium text-slate-600 mb-2 px-1">Assignee</div>
                <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                  <button
                    onClick={() => {
                      setMultiSelectAssignees(prev => 
                        prev.includes('unassigned') 
                          ? prev.filter(a => a !== 'unassigned')
                          : [...prev, 'unassigned']
                      );
                    }}
                    className={`px-2 py-1 text-[10px] font-medium rounded-full transition-all ${
                      multiSelectAssignees.includes('unassigned')
                        ? 'bg-slate-500 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Unassigned
                  </button>
                  {adminUsers.map(user => (
                    <button
                      key={user.id}
                      onClick={() => {
                        setMultiSelectAssignees(prev => 
                          prev.includes(user.id) 
                            ? prev.filter(a => a !== user.id)
                            : [...prev, user.id]
                        );
                      }}
                      className={`px-2 py-1 text-[10px] font-medium rounded-full transition-all ${
                        multiSelectAssignees.includes(user.id)
                          ? 'bg-purple-500 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {user.full_name || user.email}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Clear Advanced Filters */}
            <button
              onClick={() => {
                setDateRangeStart('');
                setDateRangeEnd('');
                setMultiSelectStatuses([]);
                setMultiSelectPriorities([]);
                setMultiSelectTags([]);
                setMultiSelectAssignees([]);
              }}
              className="w-full px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              Clear Advanced Filters
            </button>
          </div>
        )}
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
