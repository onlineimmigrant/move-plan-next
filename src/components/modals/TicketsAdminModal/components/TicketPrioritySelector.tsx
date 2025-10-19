/**
 * TicketPrioritySelector Component
 * Dropdown to select/change ticket priority
 */

import React, { useState } from 'react';
import { AlertTriangle, ChevronDown } from 'lucide-react';

interface TicketPrioritySelectorProps {
  priority: string | null;
  ticketId: string;
  onPriorityChange: (ticketId: string, priority: string | null) => Promise<void>;
  disabled?: boolean;
}

export function TicketPrioritySelector({
  priority,
  ticketId,
  onPriorityChange,
  disabled = false,
}: TicketPrioritySelectorProps) {
  const [isChanging, setIsChanging] = useState(false);

  /**
   * Get priority styling
   */
  const getPriorityClass = (priority: string | null) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'low':
        return 'bg-green-100 text-green-700 border-green-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  /**
   * Get priority label
   */
  const getPriorityLabel = (priority: string | null) => {
    if (!priority) return 'No Priority';
    return priority.charAt(0).toUpperCase() + priority.slice(1);
  };

  /**
   * Handle priority change
   */
  const handleChange = async (newPriority: string | null) => {
    if (newPriority === priority || isChanging || disabled) return;

    setIsChanging(true);
    try {
      await onPriorityChange(ticketId, newPriority);
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <div className="relative group">
      <button
        disabled={disabled}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${getPriorityClass(
          priority
        )} ${
          disabled
            ? 'opacity-50 cursor-not-allowed'
            : 'cursor-pointer hover:shadow-md'
        }`}
      >
        <AlertTriangle className="h-3 w-3" />
        <span>{getPriorityLabel(priority)}</span>
        <ChevronDown className="h-3 w-3 ml-1" />
      </button>

      {/* Dropdown menu */}
      {!disabled && (
        <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-slate-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
          <div className="p-1">
            <button
              onClick={() => handleChange(null)}
              disabled={priority === null || isChanging}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                priority === null
                  ? 'bg-slate-50 text-slate-700 cursor-default'
                  : 'hover:bg-slate-50 text-slate-700'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <div className="h-4 w-4 rounded-full border-2 border-slate-400" />
              <span>No Priority</span>
            </button>
            <button
              onClick={() => handleChange('critical')}
              disabled={priority === 'critical' || isChanging}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                priority === 'critical'
                  ? 'bg-red-50 text-red-700 cursor-default'
                  : 'hover:bg-slate-50 text-slate-700'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <div className="h-4 w-4 rounded-full bg-red-500" />
              <span>Critical</span>
            </button>
            <button
              onClick={() => handleChange('high')}
              disabled={priority === 'high' || isChanging}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                priority === 'high'
                  ? 'bg-orange-50 text-orange-700 cursor-default'
                  : 'hover:bg-slate-50 text-slate-700'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <div className="h-4 w-4 rounded-full bg-orange-500" />
              <span>High</span>
            </button>
            <button
              onClick={() => handleChange('medium')}
              disabled={priority === 'medium' || isChanging}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                priority === 'medium'
                  ? 'bg-yellow-50 text-yellow-700 cursor-default'
                  : 'hover:bg-slate-50 text-slate-700'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <div className="h-4 w-4 rounded-full bg-yellow-500" />
              <span>Medium</span>
            </button>
            <button
              onClick={() => handleChange('low')}
              disabled={priority === 'low' || isChanging}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                priority === 'low'
                  ? 'bg-green-50 text-green-700 cursor-default'
                  : 'hover:bg-slate-50 text-slate-700'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <div className="h-4 w-4 rounded-full bg-green-500" />
              <span>Low</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
