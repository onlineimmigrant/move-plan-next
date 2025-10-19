/**
 * TicketStatusBadge Component
 * Displays and allows changing ticket status
 */

import React, { useState } from 'react';
import { CheckCircle, Clock, XCircle } from 'lucide-react';

interface TicketStatusBadgeProps {
  status: string;
  ticketId: string;
  onStatusChange: (ticketId: string, newStatus: string) => Promise<void>;
  disabled?: boolean;
}

export function TicketStatusBadge({
  status,
  ticketId,
  onStatusChange,
  disabled = false,
}: TicketStatusBadgeProps) {
  const [isChanging, setIsChanging] = useState(false);

  /**
   * Get status icon
   */
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <Clock className="h-3 w-3" />;
      case 'in_progress':
        return <Clock className="h-3 w-3 animate-spin" />;
      case 'closed':
        return <CheckCircle className="h-3 w-3" />;
      default:
        return <XCircle className="h-3 w-3" />;
    }
  };

  /**
   * Get status styling
   */
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'in_progress':
        return 'bg-purple-100 text-purple-700 border-purple-300';
      case 'closed':
        return 'bg-green-100 text-green-700 border-green-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  /**
   * Get status label
   */
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open':
        return 'Open';
      case 'in_progress':
        return 'In Progress';
      case 'closed':
        return 'Closed';
      default:
        return status;
    }
  };

  /**
   * Handle status change
   */
  const handleChange = async (newStatus: string) => {
    if (newStatus === status || isChanging || disabled) return;

    setIsChanging(true);
    try {
      await onStatusChange(ticketId, newStatus);
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <div className="relative group">
      <div
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${getStatusClass(
          status
        )} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-md'}`}
      >
        {getStatusIcon(status)}
        <span>{getStatusLabel(status)}</span>
      </div>

      {/* Dropdown menu */}
      {!disabled && (
        <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-slate-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
          <div className="p-1">
            <button
              onClick={() => handleChange('open')}
              disabled={status === 'open' || isChanging}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                status === 'open'
                  ? 'bg-blue-50 text-blue-700 cursor-default'
                  : 'hover:bg-slate-50 text-slate-700'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <Clock className="h-4 w-4" />
              <span>Open</span>
              {status === 'open' && <CheckCircle className="h-4 w-4 ml-auto" />}
            </button>
            <button
              onClick={() => handleChange('in_progress')}
              disabled={status === 'in_progress' || isChanging}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                status === 'in_progress'
                  ? 'bg-purple-50 text-purple-700 cursor-default'
                  : 'hover:bg-slate-50 text-slate-700'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <Clock className="h-4 w-4" />
              <span>In Progress</span>
              {status === 'in_progress' && <CheckCircle className="h-4 w-4 ml-auto" />}
            </button>
            <button
              onClick={() => handleChange('closed')}
              disabled={status === 'closed' || isChanging}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                status === 'closed'
                  ? 'bg-green-50 text-green-700 cursor-default'
                  : 'hover:bg-slate-50 text-slate-700'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <CheckCircle className="h-4 w-4" />
              <span>Closed</span>
              {status === 'closed' && <CheckCircle className="h-4 w-4 ml-auto" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
