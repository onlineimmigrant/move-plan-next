import React from 'react';
import { X } from 'lucide-react';
import { Pin } from 'lucide-react';
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
  const pinnedNotes = internalNotes.filter(note => note.is_pinned);

  if (pinnedNotes.length === 0) {
    return null;
  }

  return (
    <div className="bg-amber-50 border-b-2 border-amber-300 px-4 py-3">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-start gap-2">
          <Pin className="h-4 w-4 text-amber-600 fill-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 space-y-2">
            {pinnedNotes.map((note) => (
              <div key={note.id} className="bg-white/80 border border-amber-300 rounded-lg px-3 py-2 text-sm">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-amber-900">
                      📌 {note.admin_full_name || note.admin_email || 'Admin'}
                    </span>
                    <span className="text-xs text-amber-700">
                      {formatNoteDate(note.created_at)}
                    </span>
                  </div>
                  {note.admin_id === currentUserId && (
                    <button
                      onClick={() => onTogglePinNote(note.id, note.is_pinned)}
                      className="text-amber-600 hover:text-amber-700 transition-colors"
                      title="Unpin note"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
                <p className="text-slate-800 whitespace-pre-wrap leading-relaxed">{note.note_text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};