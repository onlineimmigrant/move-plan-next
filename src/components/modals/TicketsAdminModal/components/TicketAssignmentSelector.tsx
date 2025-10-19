/**
 * TicketAssignmentSelector Component
 * Dropdown to assign/unassign tickets to admin users
 */

import React, { useState } from 'react';
import { User, ChevronDown, UserX } from 'lucide-react';
import type { AdminUser } from '../types';

interface TicketAssignmentSelectorProps {
  assignedTo: string | null;
  ticketId: string;
  adminUsers: AdminUser[];
  currentUserId?: string;
  onAssignmentChange: (ticketId: string, adminId: string | null) => Promise<void>;
  disabled?: boolean;
}

export function TicketAssignmentSelector({
  assignedTo,
  ticketId,
  adminUsers,
  currentUserId,
  onAssignmentChange,
  disabled = false,
}: TicketAssignmentSelectorProps) {
  const [isChanging, setIsChanging] = useState(false);

  /**
   * Get assigned admin name
   */
  const getAssignedName = () => {
    if (!assignedTo) return 'Unassigned';
    const admin = adminUsers.find(u => u.id === assignedTo);
    const name = admin?.full_name || admin?.email || 'Unknown';
    return assignedTo === currentUserId ? `${name} (You)` : name;
  };

  /**
   * Handle assignment change
   */
  const handleChange = async (newAssignedTo: string | null) => {
    if (newAssignedTo === assignedTo || isChanging || disabled) return;

    setIsChanging(true);
    try {
      await onAssignmentChange(ticketId, newAssignedTo);
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <div className="relative group">
      <button
        disabled={disabled}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
          assignedTo
            ? 'bg-purple-100 text-purple-700 border-purple-300'
            : 'bg-slate-100 text-slate-700 border-slate-300'
        } ${
          disabled
            ? 'opacity-50 cursor-not-allowed'
            : 'cursor-pointer hover:shadow-md'
        }`}
      >
        {assignedTo ? <User className="h-3 w-3" /> : <UserX className="h-3 w-3" />}
        <span className="truncate max-w-[150px]">{getAssignedName()}</span>
        <ChevronDown className="h-3 w-3 ml-1" />
      </button>

      {/* Dropdown menu */}
      {!disabled && (
        <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-lg shadow-lg border border-slate-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 max-h-64 overflow-y-auto">
          <div className="p-1">
            {/* Unassign option */}
            <button
              onClick={() => handleChange(null)}
              disabled={assignedTo === null || isChanging}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                assignedTo === null
                  ? 'bg-slate-50 text-slate-700 cursor-default'
                  : 'hover:bg-slate-50 text-slate-700'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <UserX className="h-4 w-4 text-slate-400" />
              <span>Unassigned</span>
            </button>

            <div className="my-1 border-t border-slate-200"></div>

            {/* Assign to me (quick action) */}
            {currentUserId && (
              <button
                onClick={() => handleChange(currentUserId)}
                disabled={assignedTo === currentUserId || isChanging}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                  assignedTo === currentUserId
                    ? 'bg-purple-50 text-purple-700 cursor-default'
                    : 'hover:bg-slate-50 text-slate-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <User className="h-4 w-4 text-purple-600" />
                <span className="font-medium">Assign to Me</span>
              </button>
            )}

            {currentUserId && <div className="my-1 border-t border-slate-200"></div>}

            {/* All admin users */}
            {adminUsers.map(admin => {
              const isCurrentUser = admin.id === currentUserId;
              const isAssigned = admin.id === assignedTo;
              
              return (
                <button
                  key={admin.id}
                  onClick={() => handleChange(admin.id)}
                  disabled={isAssigned || isChanging}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                    isAssigned
                      ? 'bg-purple-50 text-purple-700 cursor-default'
                      : 'hover:bg-slate-50 text-slate-700'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <div className="h-6 w-6 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                    {(admin.full_name || admin.email).charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 text-left truncate">
                    <div className="truncate">
                      {admin.full_name || admin.email}
                      {isCurrentUser && <span className="text-xs ml-1">(You)</span>}
                    </div>
                    {admin.full_name && admin.email && (
                      <div className="text-xs text-slate-500 truncate">{admin.email}</div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
