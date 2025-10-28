'use client';

import { XMarkIcon, MinusIcon } from '@heroicons/react/24/outline';
import { usePanelManagement } from '../hooks/usePanelManagement';
import { useThemeColors } from '@/hooks/useThemeColors';

interface MeetingNotesPanelProps {
  showNotes: boolean;
  isMobile: boolean;
  meetingNotes: string;
  roomName: string;
  setMeetingNotes: (notes: string) => void;
  panelManagement: ReturnType<typeof usePanelManagement>;
  onClose: () => void;
}

export default function MeetingNotesPanel({
  showNotes,
  isMobile,
  meetingNotes,
  roomName,
  setMeetingNotes,
  panelManagement,
  onClose
}: MeetingNotesPanelProps) {
  const themeColors = useThemeColors();
  const primary = themeColors.cssVars.primary;
  const { panels, toggleMinimize, startDrag, bringToFront } = panelManagement;
  const panelState = panels['notes'];

  const isMinimized = panelState?.isMinimized || false;
  const isDragging = panelState?.isDragging || false;
  const position = panelState?.position || { x: 16, y: 80 };
  const zIndex = panelState?.zIndex || 50;

  if (!showNotes) return null;

  return (
    <div
      className={`absolute ${isMobile ? 'inset-0' : 'w-80'} bg-gradient-to-b from-slate-800 to-slate-900 rounded-xl shadow-2xl border border-slate-700/50 flex flex-col z-50 backdrop-blur-sm overflow-hidden transition-all duration-200 ${
        isMinimized ? 'h-12' : 'bottom-20'
      }`}
      style={{
        left: isMobile ? '0' : position.x,
        top: isMobile ? '0' : position.y,
        transform: isMobile ? 'none' : 'none',
        zIndex,
        cursor: isDragging ? 'grabbing' : 'default',
        boxShadow: isDragging ? `0 20px 25px -5px ${primary.base}30, 0 10px 10px -5px ${primary.base}20` : undefined
      }}
      onMouseDown={() => bringToFront('notes')}
    >
      {/* Notes Header */}
      <div
        className={`flex items-center justify-between ${isMinimized ? 'px-3 py-2' : 'p-4'} border-b border-slate-700/50 bg-slate-800/50 rounded-t-xl cursor-grab active:cursor-grabbing`}
        onMouseDown={(e) => {
          e.preventDefault();
          startDrag('notes', e);
        }}
      >
        <div className="flex items-center gap-2">
          <svg 
            className="w-5 h-5" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            style={{ color: primary.base }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          <h3 className="text-base font-semibold text-white">Meeting Notes</h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => toggleMinimize('notes')}
            className="p-1.5 hover:bg-slate-700/80 rounded-lg transition-colors duration-200"
            title={isMinimized ? 'Restore' : 'Minimize'}
          >
            <MinusIcon className="w-4 h-4 text-slate-400 hover:text-white" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-700/80 rounded-lg transition-colors duration-200"
            title="Close"
          >
            <XMarkIcon className="w-4 h-4 text-slate-400 hover:text-white" />
          </button>
        </div>
      </div>
      {/* Notes Content - Only show when not minimized */}
      {!isMinimized && (
        <>
          <textarea
            value={meetingNotes}
            onChange={(e) => setMeetingNotes(e.target.value)}
            placeholder="Take notes during the meeting..."
            className="flex-1 p-4 bg-slate-900/50 text-slate-200 resize-none focus:outline-none focus:ring-2 focus:bg-slate-800/50 rounded-none transition-all duration-200 text-sm leading-relaxed placeholder-slate-400 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent"
            style={{ '--ring-color': `${primary.base}80` } as React.CSSProperties}
            onFocus={(e) => e.currentTarget.style.boxShadow = `0 0 0 2px ${primary.base}80`}
            onBlur={(e) => e.currentTarget.style.boxShadow = 'none'}
          />

          {/* Notes Actions */}
          <div className="p-4 border-t border-slate-700/50 bg-slate-800/30 flex gap-3">
            <button
              onClick={() => {
                const blob = new Blob([meetingNotes], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `meeting-notes-${roomName}-${new Date().toISOString()}.txt`;
                a.click();
              }}
              className="flex-1 py-3 text-white rounded-xl text-sm font-medium shadow-lg transition-all duration-200 hover:scale-105"
              style={{ 
                background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`,
                boxShadow: `0 10px 15px -3px ${primary.base}33`
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = `linear-gradient(135deg, ${primary.hover}, ${primary.active})`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = `linear-gradient(135deg, ${primary.base}, ${primary.hover})`;
              }}
            >
              Download Notes
            </button>
            <button
              onClick={() => setMeetingNotes('')}
              className="flex-1 py-3 bg-slate-700/80 hover:bg-slate-600/80 text-slate-300 hover:text-white rounded-xl text-sm font-medium shadow-lg transition-all duration-200 hover:scale-105 border border-slate-600/50"
            >
              Clear All
            </button>
          </div>
        </>
      )}
    </div>
  );
}