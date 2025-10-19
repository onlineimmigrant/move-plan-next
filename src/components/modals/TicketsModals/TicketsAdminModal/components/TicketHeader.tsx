/**
 * TicketHeader Component
 * Displays ticket metadata and quick actions in a collapsible panel
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Copy, X } from 'lucide-react';
import type { Ticket, TicketTag, ToastState } from '../types';

interface TicketHeaderProps {
  ticket: Ticket;
  availableTags: TicketTag[];
  searchQuery?: string;
  onCopyToClipboard: (text: string, label: string) => void;
  onAddTag: (ticketId: string, tagId: string) => void;
  onRemoveTag: (ticketId: string, tagId: string) => void;
}

export function TicketHeader({
  ticket,
  availableTags,
  searchQuery = '',
  onCopyToClipboard,
  onAddTag,
  onRemoveTag,
}: TicketHeaderProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  /**
   * Highlight search text
   */
  const highlightText = (text: string, query: string) => {
    if (!query || !text) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
      <>
        {parts.map((part, i) => 
          part.toLowerCase() === query.toLowerCase() ? (
            <mark key={i} className="bg-yellow-200 text-slate-900 px-0.5 rounded">
              {part}
            </mark>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </>
    );
  };

  /**
   * Get status badge styling
   */
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'open':
        return 'text-blue-700';
      case 'in_progress':
        return 'text-purple-700';
      case 'closed':
        return 'text-green-700';
      default:
        return 'text-slate-700';
    }
  };

  /**
   * Get priority badge styling  
   */
  const getPriorityBadgeClass = (priority: string | null) => {
    switch (priority) {
      case 'critical':
        return 'text-red-700';
      case 'high':
        return 'text-orange-700';
      case 'medium':
        return 'text-yellow-700';
      case 'low':
        return 'text-green-700';
      default:
        return 'text-slate-500';
    }
  };

  /**
   * Get priority label
   */
  const getPriorityLabel = (priority: string | null) => {
    if (!priority) return 'None';
    return priority.charAt(0).toUpperCase() + priority.slice(1);
  };

  return (
    <div className="border-b border-slate-200 bg-white">
      {/* Toggle Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
      >
        <h3 className="text-sm font-semibold text-slate-800">Ticket Details</h3>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-slate-500" />
        ) : (
          <ChevronDown className="h-4 w-4 text-slate-500" />
        )}
      </button>

      {/* Collapsible Content */}
      {isExpanded && (
        <div className="px-4 pb-3 space-y-1 text-sm">
          {/* Ticket ID */}
          <div className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-slate-50 group">
            <span className="text-xs text-slate-500">ID:</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-700 font-mono truncate max-w-[180px]">
                {ticket.id.slice(0, 8)}...
              </span>
              <button
                onClick={() => onCopyToClipboard(ticket.id, 'Ticket ID')}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-200 rounded transition-opacity"
                title="Copy ID"
              >
                <Copy className="h-3 w-3 text-slate-600" />
              </button>
            </div>
          </div>

          {/* Subject */}
          <div className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-slate-50 group">
            <span className="text-xs text-slate-500">Subject:</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-700 truncate max-w-[180px]">
                {searchQuery ? highlightText(ticket.subject, searchQuery) : ticket.subject}
              </span>
              <button
                onClick={() => onCopyToClipboard(ticket.subject, 'Subject')}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-200 rounded transition-opacity"
                title="Copy subject"
              >
                <Copy className="h-3 w-3 text-slate-600" />
              </button>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-slate-50 group">
            <span className="text-xs text-slate-500">Status:</span>
            <span className={`text-xs font-medium ${getStatusBadgeClass(ticket.status)}`}>
              {ticket.status}
            </span>
          </div>

          {/* Priority */}
          <div className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-slate-50 group">
            <span className="text-xs text-slate-500">Priority:</span>
            <span className={`text-xs font-medium ${getPriorityBadgeClass(ticket.priority || null)}`}>
              {getPriorityLabel(ticket.priority || null)}
            </span>
          </div>

          {/* Tags */}
          <div className="py-1.5 px-2 rounded hover:bg-slate-50 group">
            <div className="flex items-start justify-between gap-2">
              <span className="text-xs text-slate-500 mt-1">Tags:</span>
              <div className="flex-1 flex flex-wrap gap-1 justify-end">
                {ticket.tags && ticket.tags.length > 0 ? (
                  ticket.tags.map(tag => (
                    <button
                      key={tag.id}
                      onClick={() => onRemoveTag(ticket.id, tag.id)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border hover:opacity-80 transition-opacity"
                      style={{
                        backgroundColor: `${tag.color}15`,
                        borderColor: `${tag.color}40`,
                        color: tag.color
                      }}
                      title="Click to remove tag"
                    >
                      {searchQuery ? highlightText(tag.name, searchQuery) : tag.name}
                      <X className="h-3 w-3" />
                    </button>
                  ))
                ) : (
                  <span className="text-xs text-slate-400 italic">No tags</span>
                )}
                
                {/* Add Tag Dropdown */}
                {availableTags.length > 0 && (
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        onAddTag(ticket.id, e.target.value);
                        e.target.value = '';
                      }
                    }}
                    className="text-[10px] px-2 py-0.5 rounded-full border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 cursor-pointer"
                    value=""
                  >
                    <option value="">+ Add Tag</option>
                    {availableTags
                      .filter(tag => !ticket.tags?.some(t => t.id === tag.id))
                      .map(tag => (
                        <option key={tag.id} value={tag.id}>
                          {tag.name}
                        </option>
                      ))}
                  </select>
                )}
              </div>
            </div>
          </div>

          {/* Created */}
          <div className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-slate-50 group">
            <span className="text-xs text-slate-500">Created:</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-700">
                {new Date(ticket.created_at).toLocaleString()}
              </span>
              <button
                onClick={() => onCopyToClipboard(new Date(ticket.created_at).toLocaleString(), 'Date')}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-200 rounded transition-opacity"
                title="Copy date"
              >
                <Copy className="h-3 w-3 text-slate-600" />
              </button>
            </div>
          </div>

          {/* Customer */}
          <div className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-slate-50 group">
            <span className="text-xs text-slate-500">Customer:</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-700">
                {ticket.full_name || 'Anonymous'}
              </span>
              {ticket.full_name && (
                <button
                  onClick={() => onCopyToClipboard(ticket.full_name || '', 'Name')}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-200 rounded transition-opacity"
                  title="Copy name"
                >
                  <Copy className="h-3 w-3 text-slate-600" />
                </button>
              )}
            </div>
          </div>

          {/* Email */}
          {ticket.email && (
            <div className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-slate-50 group">
              <span className="text-xs text-slate-500">Email:</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-700 truncate max-w-[180px]">
                  {ticket.email}
                </span>
                <button
                  onClick={() => onCopyToClipboard(ticket.email, 'Email')}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-200 rounded transition-opacity"
                  title="Copy email"
                >
                  <Copy className="h-3 w-3 text-slate-600" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
