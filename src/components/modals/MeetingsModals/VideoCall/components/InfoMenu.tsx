'use client';

import React from 'react';
import { ClipboardDocumentIcon, XMarkIcon, MinusIcon } from '@heroicons/react/24/outline';
import { usePanelManagement } from '../hooks/usePanelManagement';

interface InfoMenuProps {
  showInfoMenu: boolean;
  isMobile: boolean;
  roomName: string;
  participantName?: string;
  isConnected: boolean;
  participantsCount: number;
  copiedField: string | null;
  copyToClipboard: (text: string, field: string) => void;
  panelManagement: ReturnType<typeof usePanelManagement>;
  onClose: () => void;
}

export default function InfoMenu({
  showInfoMenu,
  isMobile,
  roomName,
  participantName,
  isConnected,
  participantsCount,
  copiedField,
  copyToClipboard,
  panelManagement,
  onClose
}: InfoMenuProps) {
  const { panels, toggleMinimize, startDrag, bringToFront } = panelManagement;
  const panelState = panels['info'];

  const isMinimized = panelState?.isMinimized || false;
  const isDragging = panelState?.isDragging || false;
  const defaultPosition = isMobile ? { x: 0, y: 0 } : { x: 656, y: 80 };
  const position = panelState?.position || defaultPosition;
  const zIndex = panelState?.zIndex || 1000;

  if (!showInfoMenu) return null;

  return (
    <div
      className={`absolute ${isMobile ? 'inset-0' : 'w-80'} bg-gradient-to-b from-slate-800 to-slate-900 rounded-xl shadow-2xl border border-slate-700/50 z-50 backdrop-blur-sm overflow-hidden transition-all duration-200 ${
        isMinimized ? 'h-12' : ''
      } ${isDragging ? 'shadow-blue-500/30' : ''}`}
      style={{
        left: isMobile ? '0' : position.x,
        top: isMobile ? '0' : position.y,
        transform: isMobile ? 'none' : 'none',
        zIndex,
        cursor: isDragging ? 'grabbing' : 'default'
      }}
      onMouseDown={() => bringToFront('info')}
    >
      {/* Info Header */}
      <div
        className={`flex items-center justify-between ${isMinimized ? 'px-3 py-2' : 'p-4'} border-b border-slate-700/50 bg-slate-800/50 rounded-t-xl cursor-grab active:cursor-grabbing`}
        onMouseDown={(e) => {
          e.preventDefault();
          startDrag('info', e);
        }}
      >
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-base font-semibold text-white">Meeting Info</h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => toggleMinimize('info')}
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
      {/* Info Content - Only show when not minimized */}
      {!isMinimized && (
        <div className="p-4 space-y-4">
        {/* Meeting ID */}
        <div>
          <label className="block text-sm font-semibold text-white mb-2">Meeting ID</label>
          <div className="flex items-center gap-3 bg-slate-800/50 rounded-xl px-4 py-3 border border-slate-600/50">
            <code className="text-sm flex-1 font-mono text-slate-300">{roomName}</code>
            <button
              onClick={() => copyToClipboard(roomName, 'roomName')}
              className="p-2 hover:bg-slate-700/80 rounded-lg transition-all duration-200 hover:scale-110"
              title="Copy meeting ID"
            >
              {copiedField === 'roomName' ? (
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <ClipboardDocumentIcon className="w-5 h-5 text-slate-400 hover:text-white" />
              )}
            </button>
          </div>
        </div>

        {/* Your Name */}
        {participantName && (
          <div>
            <label className="block text-sm font-semibold text-white mb-2">Your Name</label>
            <div className="flex items-center gap-3 bg-slate-800/50 rounded-xl px-4 py-3 border border-slate-600/50">
              <span className="text-sm flex-1 text-slate-300">{participantName}</span>
              <button
                onClick={() => copyToClipboard(participantName, 'participantName')}
                className="p-2 hover:bg-slate-700/80 rounded-lg transition-all duration-200 hover:scale-110"
                title="Copy your name"
              >
                {copiedField === 'participantName' ? (
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <ClipboardDocumentIcon className="w-5 h-5 text-slate-400 hover:text-white" />
                )}
              </button>
            </div>
          </div>
        )}

        {/* Connection Status */}
        <div>
          <label className="block text-sm font-semibold text-white mb-2">Status</label>
          <div className="flex items-center gap-3 bg-slate-800/50 rounded-xl px-4 py-3 border border-slate-600/50">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 shadow-green-500/50 shadow-lg' : 'bg-yellow-500 animate-pulse shadow-yellow-500/50 shadow-lg'}`} />
            <span className="text-sm text-slate-300 font-medium">{isConnected ? 'Connected' : 'Connecting...'}</span>
          </div>
        </div>

        {/* Participants */}
        <div>
          <label className="block text-sm font-semibold text-white mb-2">Participants</label>
          <div className="bg-slate-800/50 rounded-xl px-4 py-3 border border-slate-600/50">
            <span className="text-sm text-slate-300 font-medium">{participantsCount} in call</span>
          </div>
        </div>
        </div>
      )}
    </div>
  );
}