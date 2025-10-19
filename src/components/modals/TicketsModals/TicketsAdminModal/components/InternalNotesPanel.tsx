/**
 * InternalNotesPanel Component
 * 
 * Collapsible panel for managing admin-only internal notes on tickets.
 * Supports creating, pinning, and deleting notes with realtime updates.
 */

import React, { useState } from 'react';
import { Pin, X, ChevronDown } from 'lucide-react';
import { TicketNote } from '../types';

interface InternalNotesPanelProps {
  /** Array of internal notes for the ticket */
  notes: TicketNote[];
  /** Text value for new note input */
  noteText: string;
  /** Callback when note text changes */
  onNoteTextChange: (text: string) => void;
  /** Callback to add a new note */
  onAddNote: () => Promise<void>;
  /** Callback to toggle pin status of a note */
  onTogglePin: (noteId: string, currentPinStatus: boolean) => Promise<void>;
  /** Callback to delete a note */
  onDeleteNote: (noteId: string) => Promise<void>;
  /** ID of the current admin user */
  currentUserId?: string;
  /** Whether the add note operation is in progress */
  isAddingNote?: boolean;
  /** Whether the panel is expanded */
  isExpanded?: boolean;
  /** Callback when expand/collapse is toggled */
  onToggleExpand?: () => void;
  /** Ref for the note input textarea */
  noteInputRef?: React.RefObject<HTMLTextAreaElement>;
}

export const InternalNotesPanel: React.FC<InternalNotesPanelProps> = ({
  notes,
  noteText,
  onNoteTextChange,
  onAddNote,
  onTogglePin,
  onDeleteNote,
  currentUserId,
  isAddingNote = false,
  isExpanded = false,
  onToggleExpand,
  noteInputRef
}) => {
  // Handle Enter key press (Shift+Enter for newline, Enter to submit)
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (noteText.trim()) {
        onAddNote();
      }
    }
  };

  return (
    <div className="bg-amber-50 border-t border-amber-200">
      {/* Toggle Header */}
      <button
        onClick={onToggleExpand}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-amber-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <svg className="h-4 w-4 text-amber-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          <span className="text-sm font-medium text-amber-900">
            Internal Notes 
            {notes.length > 0 && (
              <span className="ml-2 text-xs text-amber-700">({notes.length})</span>
            )}
          </span>
        </div>
        <ChevronDown 
          className={`h-5 w-5 text-amber-700 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Notes Content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-3 max-h-64 overflow-y-auto">
          {/* Help Text */}
          <p className="text-xs text-amber-700 italic">
            🔒 Internal notes are only visible to admins. Use them for coordination, handoff notes, and context.
          </p>

          {/* Notes List */}
          {notes.length > 0 ? (
            <div className="space-y-2">
              {notes.map((note) => (
                <div 
                  key={note.id} 
                  className={`bg-white rounded-lg p-3 shadow-sm ${
                    note.is_pinned 
                      ? 'border-2 border-amber-400 bg-amber-50/50' 
                      : 'border border-amber-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {note.is_pinned && (
                          <Pin className="h-3 w-3 text-amber-600 fill-amber-600" />
                        )}
                        <span className="text-xs font-medium text-slate-700">
                          {note.admin_full_name || note.admin_email || 'Admin'}
                        </span>
                        <span className="text-xs text-slate-400">
                          {new Date(note.created_at).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-slate-800 whitespace-pre-wrap">{note.note_text}</p>
                    </div>
                    {note.admin_id === currentUserId && (
                      <div className="flex items-center gap-1 ml-2">
                        <button
                          onClick={() => onTogglePin(note.id, note.is_pinned)}
                          className={`p-1 rounded transition-colors ${
                            note.is_pinned
                              ? 'text-amber-600 hover:text-amber-700 hover:bg-amber-100'
                              : 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                          }`}
                          title={note.is_pinned ? 'Unpin note' : 'Pin to top'}
                        >
                          <Pin className={`h-4 w-4 ${note.is_pinned ? 'fill-amber-600' : ''}`} />
                        </button>
                        <button
                          onClick={() => onDeleteNote(note.id)}
                          className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete note"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-amber-700 italic text-center py-4">
              No internal notes yet. Add one below to coordinate with your team.
            </p>
          )}

          {/* Add Note Input */}
          <div className="bg-white border border-amber-300 rounded-lg p-3 shadow-sm">
            <textarea
              ref={noteInputRef}
              value={noteText}
              onChange={(e) => onNoteTextChange(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Add an internal note (only visible to admins)..."
              className="w-full resize-none border-0 bg-transparent text-slate-800 placeholder-amber-600/50 focus:outline-none focus:ring-0 text-sm leading-relaxed min-h-[60px] max-h-[120px]"
              rows={2}
              disabled={isAddingNote}
            />
            <div className="flex justify-end mt-2">
              <button
                onClick={onAddNote}
                disabled={!noteText.trim() || isAddingNote}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-200 text-white text-sm font-medium rounded-lg shadow-sm hover:shadow-md disabled:shadow-none transition-all duration-200 disabled:cursor-not-allowed"
              >
                {isAddingNote ? 'Adding...' : 'Add Note'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
