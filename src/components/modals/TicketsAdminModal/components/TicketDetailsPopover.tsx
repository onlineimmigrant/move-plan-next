import React from 'react';
import { Popover, Transition } from '@headlessui/react';
import { X } from 'lucide-react';
import { Ticket, TicketTag } from '../types';
import { highlightText, getStatusTextClass, getPriorityTextClass, getPriorityLabel, formatFullDate, getDisplayName } from '../utils/ticketHelpers';

interface TicketDetailsPopoverProps {
  selectedTicket: Ticket;
  searchQuery: string;
  availableTags: TicketTag[];
  onAssignTag: (ticketId: string, tagId: string) => void;
  onRemoveTag: (ticketId: string, tagId: string) => void;
  onToast: (message: string, type: 'success' | 'error') => void;
}

export const TicketDetailsPopover: React.FC<TicketDetailsPopoverProps> = ({
  selectedTicket,
  searchQuery,
  availableTags,
  onAssignTag,
  onRemoveTag,
  onToast,
}) => {
  return (
    <Popover className="relative">
      <Popover.Button className="text-sm font-semibold text-slate-700 hover:text-blue-600 transition-colors cursor-pointer">
        Ticket
      </Popover.Button>
      <Transition
        enter="transition ease-out duration-200"
        enterFrom="opacity-0 translate-y-1"
        enterTo="opacity-100 translate-y-0"
        leave="transition ease-in duration-150"
        leaveFrom="opacity-100 translate-y-0"
        leaveTo="opacity-0 translate-y-1"
      >
        <Popover.Panel className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-80 bg-white rounded-lg shadow-lg border border-slate-200 p-3 z-[10002]">
          <div className="space-y-2">
            {/* Ticket ID */}
            <div className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-slate-50 group">
              <span className="text-xs text-slate-500">Ticket ID:</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-700">{selectedTicket.id}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(selectedTicket.id);
                    onToast('Ticket ID copied!', 'success');
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-200 rounded transition-opacity"
                  title="Copy ID"
                >
                  <svg className="h-3 w-3 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Subject */}
            <div className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-slate-50 group">
              <span className="text-xs text-slate-500">Subject:</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-700 truncate max-w-[180px]">{searchQuery ? highlightText(selectedTicket.subject, searchQuery) : selectedTicket.subject}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(selectedTicket.subject);
                    onToast('Subject copied!', 'success');
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-200 rounded transition-opacity"
                  title="Copy subject"
                >
                  <svg className="h-3 w-3 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-slate-50 group">
              <span className="text-xs text-slate-500">Status:</span>
              <span className={`text-xs font-medium ${getStatusTextClass(selectedTicket.status)}`}>
                {selectedTicket.status}
              </span>
            </div>

            {/* Priority */}
            <div className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-slate-50 group">
              <span className="text-xs text-slate-500">Priority:</span>
              <span className={`text-xs font-medium ${getPriorityTextClass(selectedTicket.priority || null)}`}>
                {getPriorityLabel(selectedTicket.priority || null)}
              </span>
            </div>

            {/* Tags */}
            <div className="py-1.5 px-2 rounded hover:bg-slate-50 group">
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs text-slate-500 mt-1">Tags:</span>
                <div className="flex-1 flex flex-wrap gap-1 justify-end">
                  {selectedTicket.tags && selectedTicket.tags.length > 0 ? (
                    selectedTicket.tags.map(tag => (
                      <span
                        key={tag.id}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border cursor-pointer hover:opacity-80"
                        style={{
                          backgroundColor: `${tag.color}15`,
                          borderColor: `${tag.color}40`,
                          color: tag.color
                        }}
                        onClick={() => onRemoveTag(selectedTicket.id, tag.id)}
                        title="Click to remove tag"
                      >
                        {searchQuery ? highlightText(tag.name, searchQuery) : tag.name}
                        <X className="h-3 w-3" />
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 italic">No tags</span>
                  )}
                  {/* Add Tag Dropdown */}
                  {availableTags.length > 0 && (
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          onAssignTag(selectedTicket.id, e.target.value);
                          e.target.value = ''; // Reset selection
                        }
                      }}
                      className="text-[10px] px-2 py-0.5 rounded-full border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 cursor-pointer"
                      value=""
                    >
                      <option value="">+ Add Tag</option>
                      {availableTags
                        .filter(tag => !selectedTicket.tags?.some(t => t.id === tag.id))
                        .map(tag => (
                          <option key={tag.id} value={tag.id}>{tag.name}</option>
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
                <span className="text-xs text-slate-700">{formatFullDate(selectedTicket.created_at)}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(formatFullDate(selectedTicket.created_at));
                    onToast('Date copied!', 'success');
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-200 rounded transition-opacity"
                  title="Copy date"
                >
                  <svg className="h-3 w-3 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Customer */}
            <div className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-slate-50 group">
              <span className="text-xs text-slate-500">Customer:</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-700">{getDisplayName(selectedTicket.full_name || null)}</span>
                {selectedTicket.full_name && (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(getDisplayName(selectedTicket.full_name || null, ''));
                      onToast('Name copied!', 'success');
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-200 rounded transition-opacity"
                    title="Copy name"
                  >
                    <svg className="h-3 w-3 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Email */}
            {selectedTicket.email && (
              <div className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-slate-50 group">
                <span className="text-xs text-slate-500">Email:</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-700 truncate max-w-[180px]">{selectedTicket.email}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(selectedTicket.email);
                      onToast('Email copied!', 'success');
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-200 rounded transition-opacity"
                    title="Copy email"
                  >
                    <svg className="h-3 w-3 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        </Popover.Panel>
      </Transition>
    </Popover>
  );
};