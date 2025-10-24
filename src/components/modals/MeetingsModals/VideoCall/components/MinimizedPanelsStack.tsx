'use client';

import { usePanelManagement } from '../hooks/usePanelManagement';

interface MinimizedPanelsStackProps {
  panelManagement: ReturnType<typeof usePanelManagement>;
  onRestorePanel: (id: string) => void;
}

const PANEL_ICONS = {
  settings: '⚙️',
  participants: '👥',
  info: 'ℹ️',
  notes: '📝',
  chat: '💬'
};

const PANEL_NAMES = {
  settings: 'Settings',
  participants: 'Participants',
  info: 'Info',
  notes: 'Notes',
  chat: 'Chat'
};

export default function MinimizedPanelsStack({ panelManagement, onRestorePanel }: MinimizedPanelsStackProps) {
  const { getMinimizedStack } = panelManagement;
  const minimizedPanels = getMinimizedStack();

  if (minimizedPanels.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {minimizedPanels.map((panelId, index) => (
        <div
          key={panelId}
          className="w-12 h-12 bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl shadow-2xl border border-slate-600/50 flex items-center justify-center cursor-pointer hover:scale-110 transition-all duration-200 hover:shadow-blue-500/20 group"
          style={{
            transform: `translateY(-${index * 8}px)`,
            zIndex: 100 - index
          }}
          onClick={() => onRestorePanel(panelId)}
          title={`Restore ${PANEL_NAMES[panelId as keyof typeof PANEL_NAMES] || panelId}`}
        >
          <span className="text-lg group-hover:scale-110 transition-transform duration-200">
            {PANEL_ICONS[panelId as keyof typeof PANEL_ICONS] || '📄'}
          </span>
        </div>
      ))}
    </div>
  );
}