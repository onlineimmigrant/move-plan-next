'use client';

import { RemoteVideoTrack, RemoteAudioTrack } from 'twilio-video';
import { useThemeColors } from '@/hooks/useThemeColors';
import {
  MicrophoneIcon,
  VideoCameraSlashIcon,
  HandRaisedIcon,
  XMarkIcon,
  MinusIcon
} from '@heroicons/react/24/outline';
import { usePanelManagement } from '../hooks/usePanelManagement';

interface Participant {
  identity: string;
  videoTrack?: RemoteVideoTrack;
  audioTrack?: RemoteAudioTrack;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
}

interface ParticipantsPanelProps {
  showParticipants: boolean;
  isMobile: boolean;
  participants: Map<string, Participant>;
  participantName?: string;
  isHost: boolean;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  handRaised: boolean;
  raisedHands: Set<string>;
  muteAllParticipants: () => void;
  kickParticipant: (identity: string) => void;
  panelManagement: ReturnType<typeof usePanelManagement>;
  onClose: () => void;
}

export default function ParticipantsPanel({
  showParticipants,
  isMobile,
  participants,
  participantName,
  isHost,
  isAudioEnabled,
  isVideoEnabled,
  handRaised,
  raisedHands,
  muteAllParticipants,
  kickParticipant,
  panelManagement,
  onClose
}: ParticipantsPanelProps) {
  const themeColors = useThemeColors();
  const primary = themeColors.cssVars.primary;
  const { panels, toggleMinimize, startDrag, bringToFront } = panelManagement;
  const panelState = panels['participants'];

  const isMinimized = panelState?.isMinimized || false;
  const isDragging = panelState?.isDragging || false;
  const position = panelState?.position || { x: 336, y: 80 };
  const zIndex = panelState?.zIndex || 50;

  if (!showParticipants) return null;

  return (
    <div
      className={`absolute ${isMobile ? 'inset-0' : 'w-80 max-h-[80vh]'} bg-gradient-to-b from-slate-800 to-slate-900 rounded-xl shadow-2xl border border-slate-700/50 flex flex-col z-50 backdrop-blur-sm overflow-hidden transition-all duration-200 ${
        isMinimized ? 'h-12' : ''
      }`}
      style={{
        left: isMobile ? '0' : position.x,
        top: isMobile ? '0' : position.y,
        transform: isMobile ? 'none' : 'none',
        zIndex,
        cursor: isDragging ? 'grabbing' : 'default',
        boxShadow: isDragging ? `0 20px 25px -5px ${primary.base}30, 0 10px 10px -5px ${primary.base}20` : undefined
      }}
      onMouseDown={() => bringToFront('participants')}
    >
      {/* Participants Header */}
      <div
        className={`flex items-center justify-between ${isMinimized ? 'px-3 py-2' : 'p-4'} border-b border-slate-700/50 bg-slate-800/50 rounded-t-xl cursor-grab active:cursor-grabbing`}
        onMouseDown={(e) => {
          e.preventDefault();
          startDrag('participants', e);
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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
          <h3 className="text-base font-semibold text-white">Participants</h3>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-sm text-slate-400 bg-slate-700/50 px-2 py-1 rounded-lg">
            {participants.size + 1}
          </span>
          <button
            onClick={() => toggleMinimize('participants')}
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
      {/* Participants List - Only show when not minimized */}
      {!isMinimized && (
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent">
        {/* Local participant */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/30 hover:bg-slate-700/50 transition-all duration-200 border border-slate-600/30">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
              style={{ background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})` }}
            >
              <span className="text-sm font-semibold text-white">You</span>
            </div>
            <div>
              <span className="text-sm font-semibold text-white">{participantName || 'You'}</span>
              {isHost && <span className="text-xs text-blue-400 font-medium ml-2">(Host)</span>}
            </div>
          </div>
          <div className="flex gap-2">
            {!isAudioEnabled && <MicrophoneIcon className="w-5 h-5 text-red-400" />}
            {!isVideoEnabled && <VideoCameraSlashIcon className="w-5 h-5 text-red-400" />}
            {handRaised && <HandRaisedIcon className="w-5 h-5 text-amber-400" />}
          </div>
        </div>

        {/* Remote participants */}
        {Array.from(participants.values()).map((participant) => (
          <div key={participant.identity} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/30 hover:bg-slate-700/50 transition-all duration-200 border border-slate-600/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-sm font-semibold text-white">{participant.identity.charAt(0).toUpperCase()}</span>
              </div>
              <div>
                <span className="text-sm font-semibold text-white">{participant.identity}</span>
              </div>
            </div>
            <div className="flex gap-2 items-center">
              {!participant.isAudioEnabled && <MicrophoneIcon className="w-5 h-5 text-red-400" />}
              {!participant.isVideoEnabled && <VideoCameraSlashIcon className="w-5 h-5 text-red-400" />}
              {raisedHands.has(participant.identity) && <HandRaisedIcon className="w-5 h-5 text-amber-400" />}
              {isHost && (
                <button
                  onClick={() => kickParticipant(participant.identity)}
                  className="ml-2 text-xs text-red-400 hover:text-red-300 transition-colors duration-200 font-medium px-2 py-1 rounded-lg hover:bg-red-500/20"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      {/* Host Controls */}
      {isHost && (
        <div className="p-4 border-t border-slate-700/50 bg-slate-800/30">
          <button
            onClick={muteAllParticipants}
            className="w-full py-3 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white rounded-xl text-sm font-medium shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-red-500/20"
          >
            Mute All Participants
          </button>
        </div>
      )}
        </>
      )}
    </div>
  );
}