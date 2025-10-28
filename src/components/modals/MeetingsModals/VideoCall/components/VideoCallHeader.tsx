'use client';

import React from 'react';
import { useThemeColors } from '@/hooks/useThemeColors';
import {
  XMarkIcon,
  MinusIcon,
  ChevronUpIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  InformationCircleIcon,
  ClipboardDocumentIcon
} from '@heroicons/react/24/outline';

interface VideoCallHeaderProps {
  isMobile: boolean;
  isMinimized: boolean;
  isFullscreen: boolean;
  isConnected: boolean;
  isReconnecting: boolean;
  participants: Map<string, any>;
  roomName: string;
  participantName?: string;
  meetingTitle?: string;
  userIsHost?: boolean;
  viewMode: 'grid' | 'spotlight' | 'sidebar';
  showInfoMenu: boolean;
  copiedField: string | null;
  onLeave: () => void;
  onToggleMinimized: () => void;
  onToggleFullscreen: () => void;
  onSetViewMode: (mode: 'grid' | 'spotlight' | 'sidebar') => void;
  onToggleInfoMenu: () => void;
  onCopyToClipboard: (text: string, field: string) => void;
}

export default function VideoCallHeader({
  isMobile,
  isMinimized,
  isFullscreen,
  isConnected,
  isReconnecting,
  participants,
  roomName,
  participantName,
  meetingTitle,
  userIsHost,
  viewMode,
  showInfoMenu,
  copiedField,
  onLeave,
  onToggleMinimized,
  onToggleFullscreen,
  onSetViewMode,
  onToggleInfoMenu,
  onCopyToClipboard,
}: VideoCallHeaderProps) {
  const themeColors = useThemeColors();
  const primary = themeColors.cssVars.primary;
  
  return (
    <>
      {/* Header - Draggable */}
      <div className={`drag-handle flex items-center justify-between bg-gradient-to-r from-slate-800 via-slate-800 to-slate-900 backdrop-blur-sm border-b border-slate-700/50 ${isMobile ? 'cursor-default' : 'cursor-move'} ${isMinimized ? 'px-3 py-2' : isMobile ? 'px-4 py-3' : 'px-5 py-4'}`}>
        <div className={`flex items-center ${isMobile ? 'gap-2.5' : 'gap-3'}`}>
          {/* Window Control Buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleMinimized();
              }}
              className={`${isMobile ? 'p-3' : 'p-2'} hover:bg-slate-600/80 hover:shadow-lg rounded-lg transition-all duration-200 flex-shrink-0 group`}
              style={{ zIndex: 10000 }}
              title={isMinimized ? "Restore" : "Minimize"}
            >
              {isMinimized ? (
                <ChevronUpIcon className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'} text-slate-300 group-hover:text-white transition-colors duration-200`} />
              ) : (
                <MinusIcon className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'} text-slate-300 group-hover:text-white transition-colors duration-200`} />
              )}
            </button>

            {!isMobile && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFullscreen();
                }}
                className="p-2 hover:bg-slate-600/80 hover:shadow-lg rounded-lg transition-all duration-200 flex-shrink-0 group"
                title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
              >
                {isFullscreen ? (
                  <ArrowsPointingInIcon className="w-4 h-4 text-slate-300 group-hover:text-white transition-colors duration-200" />
                ) : (
                  <ArrowsPointingOutIcon className="w-4 h-4 text-slate-300 group-hover:text-white transition-colors duration-200" />
                )}
              </button>
            )}

            <button
              onClick={onLeave}
              className={`${isMobile ? 'p-3' : 'p-2'} hover:bg-red-500/80 hover:shadow-lg hover:shadow-red-500/20 rounded-lg transition-all duration-200 flex-shrink-0 group`}
              title="Leave call"
            >
              <XMarkIcon className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'} text-slate-300 group-hover:text-white transition-colors duration-200`} />
            </button>
          </div>

          {!isMinimized && (
            <>
              <div className="h-6 w-px bg-gradient-to-b from-transparent via-slate-500 to-transparent opacity-50" />

              <div className="flex items-center gap-3">
                <div className={`w-${isMobile ? '2.5' : '3'} h-${isMobile ? '2.5' : '3'} rounded-full shadow-lg ${
                  isReconnecting ? 'bg-orange-400 shadow-orange-400/50 animate-pulse' :
                  isConnected ? 'bg-green-400 shadow-green-400/50' : 'bg-yellow-400 shadow-yellow-400/50 animate-pulse'
                }`} />
                <div>
                  <h2 className={`${isMobile ? 'text-sm' : 'text-base'} font-semibold text-white`}>
                    {meetingTitle || 'Video Call'}
                    {userIsHost && (
                      <span 
                        className="ml-2 text-xs px-2 py-0.5 rounded"
                        style={{ backgroundColor: primary.base, color: 'white' }}
                      >
                        Host
                      </span>
                    )}
                  </h2>
                  {!isMobile && (
                    <div className={`text-xs text-slate-400 font-medium`}>
                      {isReconnecting ? 'Reconnecting...' : `${participants.size + 1} participant${participants.size !== 0 ? 's' : ''}`}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {!isMinimized && (
          <div className="flex items-center gap-2">
            {/* Layout Switcher */}
            {participants.size > 0 && (
              isMobile ? (
                // Mobile: Single toggle button between grid and spotlight
                <button
                  onClick={() => onSetViewMode(viewMode === 'grid' ? 'spotlight' : 'grid')}
                  className="p-3 bg-slate-700/30 backdrop-blur-sm border border-slate-600/50 rounded-xl shadow-lg hover:bg-slate-600/60 transition-all duration-200 group"
                  title={viewMode === 'grid' ? 'Switch to spotlight view' : 'Switch to grid view'}
                >
                  {viewMode === 'grid' ? (
                    <svg className="w-5 h-5 text-slate-300 group-hover:text-white transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-slate-300 group-hover:text-white transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                    </svg>
                  )}
                </button>
              ) : (
                // Desktop: Single cycling button for all three modes
                <button
                  onClick={() => {
                    const modes = ['grid', 'spotlight', 'sidebar'] as const;
                    const currentIndex = modes.indexOf(viewMode as any);
                    const nextIndex = (currentIndex + 1) % modes.length;
                    onSetViewMode(modes[nextIndex]);
                  }}
                  className="p-3 bg-slate-700/30 backdrop-blur-sm border border-slate-600/50 rounded-xl shadow-lg hover:bg-slate-600/60 transition-all duration-200 group"
                  title={`Current: ${viewMode} view - Click to cycle`}
                >
                  {viewMode === 'grid' ? (
                    <svg className="w-5 h-5 text-slate-300 group-hover:text-white transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                    </svg>
                  ) : viewMode === 'spotlight' ? (
                    <svg className="w-5 h-5 text-slate-300 group-hover:text-white transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-slate-300 group-hover:text-white transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7" />
                    </svg>
                  )}
                </button>
              )
            )}

            {/* Info Menu */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleInfoMenu();
              }}
              className={`${isMobile ? 'p-3 bg-slate-700/40' : 'p-2.5'} rounded-xl transition-all duration-200 group ${
                showInfoMenu
                  ? 'text-white'
                  : 'bg-slate-700/40 hover:bg-slate-700/80 text-slate-300 hover:text-white'
              }`}
              style={showInfoMenu ? {
                backgroundColor: `${primary.base}e6`,
                boxShadow: `0 10px 15px -3px ${primary.base}4d`
              } : {}}
              title="Meeting info"
            >
              <InformationCircleIcon className={`${isMobile ? 'w-6 h-6' : 'w-5 h-5'}`} />
            </button>
          </div>
        )}
      </div>
    </>
  );
}