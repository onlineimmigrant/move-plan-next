import React from 'react';
import { X } from 'lucide-react';
import { Pin } from 'lucide-react';
import { useThemeColors } from '@/hooks/useThemeColors';
import { TicketNote } from '../types';
import { formatNoteDate } from '../utils/ticketHelpers';

interface PinnedNotesBannerProps {
  internalNotes: TicketNote[];
  currentUserId: string;
  onTogglePinNote: (noteId: string, isPinned: boolean) => void;
}

export const PinnedNotesBanner: React.FC<PinnedNotesBannerProps> = ({
  internalNotes,
  currentUserId,
  onTogglePinNote,
}) => {
  const themeColors = useThemeColors();
  const primary = themeColors.cssVars.primary;
  const pinnedNotes = internalNotes.filter(note => note.is_pinned);

  if (pinnedNotes.length === 0) {
    return null;
  }

  return (
    <div
      className="px-4 py-3 backdrop-blur-sm bg-white/30 dark:bg-gray-800/30 border-b border-white/10 dark:border-gray-700/20"
      style={{ '--accent-color': primary.base } as React.CSSProperties}
    >
      <div className="max-w-3xl mx-auto">
        <div className="flex items-start gap-3">
          <div
            className="flex items-center justify-center h-7 w-7 rounded-lg shadow-sm backdrop-blur-sm"
            style={{
              background: 'color-mix(in srgb, var(--accent-color) 18%, transparent)',
              border: '1px solid color-mix(in srgb, var(--accent-color) 35%, transparent)'
            }}
          >
            <Pin className="h-4 w-4" style={{ color: primary.base }} />
          </div>
          <div className="flex-1 space-y-3">
            {pinnedNotes.map((note) => (
              <div
                key={note.id}
                className="bg-white/55 dark:bg-gray-800/55 backdrop-blur-sm rounded-lg px-3 py-2 text-sm shadow-sm transition-colors border"
                style={{ border: '1px solid color-mix(in srgb, var(--accent-color) 28%, transparent)' }}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[11px] font-medium flex items-center gap-1"
                      style={{ color: primary.base }}
                    >
                      <span className="text-xs">📌</span>{note.admin_full_name || note.admin_email || 'Admin'}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {formatNoteDate(note.created_at)}
                    </span>
                  </div>
                  {note.admin_id === currentUserId && (
                    <button
                      onClick={() => onTogglePinNote(note.id, note.is_pinned)}
                      className="p-1 rounded-md transition-colors"
                      style={{
                        color: primary.base,
                        background: 'transparent'
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background = 'color-mix(in srgb, var(--accent-color) 15%, transparent)';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                      }}
                      title="Unpin note"
                      aria-label="Unpin note"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
                <p className="text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {note.note_text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};