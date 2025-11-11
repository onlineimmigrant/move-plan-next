/**
 * InternalNotesPanel Component
 * 
 * Collapsible panel for managing admin-only internal notes on tickets.
 * Supports creating, pinning, and deleting notes with realtime updates.
 * Memoized for performance optimization.
 */

import React, { useState, memo } from 'react';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Pin, X, ChevronDown, Send } from 'lucide-react';
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

const InternalNotesPanelComponent: React.FC<InternalNotesPanelProps> = ({
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

  const themeColors = useThemeColors();
  const primary = themeColors.cssVars.primary;

  return (
    <div
      className="rounded-b-2xl backdrop-blur-sm bg-white/30 dark:bg-gray-800/30 border-t border-white/10 dark:border-gray-700/20"
      style={{ '--accent-color': primary.base } as React.CSSProperties}
    >
      {/* Toggle Header */}
      <button
        onClick={onToggleExpand}
        className="w-full px-4 py-3 flex items-center justify-between transition-colors"
        style={{
          color: 'var(--accent-color)',
          background: isExpanded ? 'color-mix(in srgb, var(--accent-color) 12%, transparent)' : 'transparent'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'color-mix(in srgb, var(--accent-color) 10%, transparent)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = isExpanded ? 'color-mix(in srgb, var(--accent-color) 12%, transparent)' : 'transparent';
        }}
      >
        <div className="flex max-w-5xl mx-auto items-center gap-2">
          <svg className="h-4 w-4" style={{ color: primary.base }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          <span className="text-sm font-medium" style={{ color: primary.base }}>
            Internal Notes 
            {notes.length > 0 && (
              <span className="ml-2 text-xs" style={{ color: primary.base }}>({notes.length})</span>
            )}
          </span>
        </div>
        <ChevronDown
          className={`h-5 w-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          style={{ color: primary.base }}
        />
      </button>

      {/* Notes Content */}
      {isExpanded && (
        <div className="mx-auto max-w-3xl px-4 pb-4 space-y-3 max-h-64 overflow-y-auto">
          {/* Help Text */}
          <p className="text-xs italic" style={{ color: primary.base }}>
            Admin-only notes for coordination.
          </p>

          {/* Add Note Input (moved above list to mirror message input placement) */}
          <div
            className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-md border border-white/20 dark:border-gray-700/20 rounded-2xl shadow-sm p-4 focus-within:border-blue-500/40 dark:focus-within:border-blue-400/40 focus-within:ring-2 focus-within:ring-blue-500/30 transition-all duration-200"
          >
            <div className="flex items-end gap-3">
              <div className="flex-1 relative">
                <textarea
                  ref={noteInputRef}
                  value={noteText}
                  onChange={(e) => onNoteTextChange(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (noteText.trim()) onAddNote();
                    }
                  }}
                  placeholder="Add internal note..."
                  className="w-full resize-none border-0 bg-transparent text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-0 text-base leading-relaxed min-h-[44px] max-h-[120px]"
                  rows={1}
                  disabled={isAddingNote}
                  aria-label="Internal note content"
                />
              </div>
              <button
                onClick={onAddNote}
                disabled={!noteText.trim() || isAddingNote}
                className="flex items-center justify-center w-10 h-10 text-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 dark:focus-visible:ring-blue-400/40 border border-white/10 dark:border-gray-700/20"
                style={{ background: 'var(--accent-color)' }}
                aria-label={isAddingNote ? 'Adding note' : 'Add note'}
                title={isAddingNote ? 'Adding...' : 'Add note (Enter)'}
              >
                {isAddingNote ? (
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                  </svg>
                ) : (
                  // simple send glyph
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="M5 12l14-7-7 14-1.5-5.5L5 12z" fill="currentColor"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Notes List */}
          {notes.length > 0 ? (
            <div className="space-y-2">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className={"group relative rounded-xl p-3 shadow-sm transition-colors backdrop-blur-md border " + (note.is_pinned ? 'ring-1 ring-[color-mix(in_srgb,var(--accent-color)_50%,transparent)]' : '')}
                  style={{
                    border: note.is_pinned
                      ? '2px solid color-mix(in srgb, var(--accent-color) 42%, transparent)'
                      : '1px solid color-mix(in srgb, var(--accent-color) 28%, transparent)',
                    background: note.is_pinned
                      ? 'color-mix(in srgb, var(--accent-color) 11%, rgba(255,255,255,0.55))'
                      : 'color-mix(in srgb, var(--accent-color) 6%, rgba(255,255,255,0.55))'
                  }}
                >
                  <div className="flex items-start justify-between mb-1.5">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {note.is_pinned && (
                          <Pin className="h-3 w-3" style={{ color: primary.base }} />
                        )}
                        <span className="text-xs font-medium text-slate-700 truncate max-w-[120px]">
                          {note.admin_full_name || note.admin_email || 'Admin'}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(note.created_at).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                        {note.note_text}
                      </p>
                    </div>
                    {note.admin_id === currentUserId && (
                      <div className="flex items-center gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => onTogglePin(note.id, note.is_pinned)}
                          className="p-1 rounded hover:bg-[color-mix(in_srgb,var(--accent-color)_12%,transparent)] transition-colors"
                          style={{ color: primary.base }}
                          title={note.is_pinned ? 'Unpin note' : 'Pin note'}
                        >
                          <Pin className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onDeleteNote(note.id)}
                          className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
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
            <p className="text-sm italic text-center py-4" style={{ color: primary.base }}>
              No internal notes yet. Add one below to coordinate with your team.
            </p>
          )}

          {/* End Add Note Input moved above */}
        </div>
      )}
    </div>
  );
};

/**
 * Memoized InternalNotesPanel to prevent unnecessary re-renders
 */
export const InternalNotesPanel = memo(InternalNotesPanelComponent, (prevProps, nextProps) => {
  // Check notes array changes
  if (prevProps.notes.length !== nextProps.notes.length) return false;
  
  // Deep compare notes (check IDs, content, and pin status)
  for (let i = 0; i < prevProps.notes.length; i++) {
    const prevNote = prevProps.notes[i];
    const nextNote = nextProps.notes[i];
    if (
      prevNote.id !== nextNote.id ||
      prevNote.note_text !== nextNote.note_text ||
      prevNote.is_pinned !== nextNote.is_pinned ||
      prevNote.created_at !== nextNote.created_at
    ) {
      return false;
    }
  }
  
  // Check input state
  if (prevProps.noteText !== nextProps.noteText) return false;
  if (prevProps.isAddingNote !== nextProps.isAddingNote) return false;
  if (prevProps.isExpanded !== nextProps.isExpanded) return false;
  if (prevProps.currentUserId !== nextProps.currentUserId) return false;
  
  // All critical props are equal
  return true;
});
