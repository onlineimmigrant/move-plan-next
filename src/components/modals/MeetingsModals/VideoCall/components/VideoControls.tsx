'use client';

import React, { useState } from 'react';
import {
  VideoCameraIcon,
  VideoCameraSlashIcon,
  MicrophoneIcon,
  PhoneXMarkIcon,
  ComputerDesktopIcon,
  ChatBubbleLeftRightIcon,
  HandRaisedIcon,
  UserGroupIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  StopCircleIcon,
  VideoCameraIcon as VideoCameraIconSolid,
  EllipsisHorizontalIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { LocalDataTrack, Room, LocalAudioTrack, LocalVideoTrack } from 'twilio-video';

interface VideoControlsProps {
  isMinimized: boolean;
  isMobile: boolean;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  isVideoAvailable: boolean;
  isAudioAvailable: boolean;
  isScreenSharing: boolean;
  showChat: boolean;
  unreadCount: number;
  handRaised: boolean;
  showParticipants: boolean;
  raisedHands: Set<string>;
  isRecording: boolean;
  showSettings: boolean;
  showNotes: boolean;
  room: Room | null;
  roomName: string;
  localDataTrack: LocalDataTrack | null;
  localAudioTrack: LocalAudioTrack | null;
  localVideoTrack: LocalVideoTrack | null;
  onToggleVideo: () => Promise<void>;
  onToggleAudio: () => Promise<void>;
  onToggleScreenShare: () => void;
  onToggleChat: () => void;
  onToggleHandRaise: (localDataTrack: LocalDataTrack | null) => void;
  onToggleParticipants: () => void;
  onToggleRecording: () => void;
  onToggleSettings: () => void;
  onToggleNotes: () => void;
  onLeaveCall: () => void;
  onStartRecording: (room: Room | null, localAudioTrack: LocalAudioTrack | null, localVideoTrack: LocalVideoTrack | null, roomName: string) => void;
  onStopRecording: (roomName: string) => void;
}

const VideoControls: React.FC<VideoControlsProps> = ({
  isMinimized,
  isMobile,
  isVideoEnabled,
  isAudioEnabled,
  isVideoAvailable,
  isAudioAvailable,
  isScreenSharing,
  showChat,
  unreadCount,
  handRaised,
  showParticipants,
  raisedHands,
  isRecording,
  showSettings,
  showNotes,
  room,
  roomName,
  localDataTrack,
  localAudioTrack,
  localVideoTrack,
  onToggleVideo,
  onToggleAudio,
  onToggleScreenShare,
  onToggleChat,
  onToggleHandRaise,
  onToggleParticipants,
  onToggleRecording,
  onToggleSettings,
  onToggleNotes,
  onLeaveCall,
  onStartRecording,
  onStopRecording,
}) => {
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  if (isMinimized) return null;

  return (
    <>
      <div className={`flex items-center justify-center ${isMobile ? 'space-x-6 p-6' : 'space-x-4 p-4'} bg-gray-800 relative`}>
        {/* Core Communication Controls - Always Visible */}
        <button
          onClick={onToggleVideo}
          disabled={!isVideoAvailable}
          className={`${isMobile ? 'p-4' : 'p-3'} rounded-full ${!isVideoAvailable ? 'bg-gray-700 cursor-not-allowed opacity-50' : isVideoEnabled ? 'bg-gray-600 hover:bg-gray-500' : 'bg-red-600 hover:bg-red-500'} transition-colors duration-200`}
          title={!isVideoAvailable ? "No camera available" : isVideoEnabled ? "Turn off camera" : "Turn on camera"}
        >
          {isVideoEnabled ? (
            <VideoCameraIcon className={`${isMobile ? 'w-7 h-7' : 'w-6 h-6'}`} />
          ) : (
            <VideoCameraSlashIcon className={`${isMobile ? 'w-7 h-7' : 'w-6 h-6'}`} />
          )}
        </button>

        <button
          onClick={onToggleAudio}
          disabled={!isAudioAvailable}
          className={`${isMobile ? 'p-4' : 'p-3'} rounded-full ${!isAudioAvailable ? 'bg-gray-700 cursor-not-allowed opacity-50' : isAudioEnabled ? 'bg-gray-600 hover:bg-gray-500' : 'bg-red-600 hover:bg-red-500'} transition-colors duration-200`}
          title={!isAudioAvailable ? "No microphone available" : isAudioEnabled ? "Mute microphone" : "Unmute microphone"}
        >
          {isAudioEnabled ? (
            <MicrophoneIcon className={`${isMobile ? 'w-7 h-7' : 'w-6 h-6'}`} />
          ) : (
            <MicrophoneIcon className={`${isMobile ? 'w-7 h-7' : 'w-6 h-6'} opacity-50`} />
          )}
        </button>

        <button
          onClick={onToggleChat}
          className={`${isMobile ? 'p-4' : 'p-3'} rounded-full relative ${showChat ? 'bg-blue-600 hover:bg-blue-500' : 'bg-gray-600 hover:bg-gray-500'} transition-colors duration-200`}
          title="Toggle chat"
        >
          <ChatBubbleLeftRightIcon className={`${isMobile ? 'w-7 h-7' : 'w-6 h-6'}`} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-white/10 text-gray-100 text-[10px] font-medium rounded-full w-4 h-4 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* More Menu Button */}
        <button
          onClick={() => setShowMoreMenu(!showMoreMenu)}
          className={`${isMobile ? 'p-4' : 'p-3'} rounded-full ${showMoreMenu ? 'bg-blue-600 hover:bg-blue-500' : 'bg-gray-600 hover:bg-gray-500'} transition-colors duration-200`}
          title="More options"
        >
          <EllipsisHorizontalIcon className={`${isMobile ? 'w-7 h-7' : 'w-6 h-6'}`} />
        </button>

        {/* Leave Call - Always Last */}
        <button
          onClick={onLeaveCall}
          className={`${isMobile ? 'p-4' : 'p-3'} rounded-full bg-red-600 hover:bg-red-500 transition-colors duration-200`}
          title="Leave call"
        >
          <PhoneXMarkIcon className={`${isMobile ? 'w-7 h-7' : 'w-6 h-6'}`} />
        </button>
      </div>

      {/* More Menu Modal */}
      {showMoreMenu && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowMoreMenu(false)}>
          <div
            className="bg-gray-800 rounded-xl shadow-2xl border border-gray-700 p-6 max-w-sm w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Menu Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">More Options</h3>
              <button
                onClick={() => setShowMoreMenu(false)}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors duration-200"
              >
                <XMarkIcon className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Menu Grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Screen Share */}
              <button
                onClick={() => {
                  onToggleScreenShare();
                  setShowMoreMenu(false);
                }}
                className={`p-4 rounded-xl flex flex-col items-center gap-2 transition-all duration-200 ${
                  isScreenSharing ? 'bg-blue-600 hover:bg-blue-500' : 'bg-gray-700 hover:bg-gray-600'
                }`}
                title={isScreenSharing ? "Stop screen share" : "Share screen"}
              >
                <ComputerDesktopIcon className="w-6 h-6" />
                <span className="text-xs font-medium text-center">Screen Share</span>
              </button>

              {/* Hand Raise */}
              <button
                onClick={() => {
                  onToggleHandRaise(localDataTrack);
                  setShowMoreMenu(false);
                }}
                className={`p-4 rounded-xl flex flex-col items-center gap-2 transition-all duration-200 ${
                  handRaised ? 'bg-yellow-600 hover:bg-yellow-500' : 'bg-gray-700 hover:bg-gray-600'
                }`}
                title={handRaised ? "Lower hand" : "Raise hand"}
              >
                <HandRaisedIcon className="w-6 h-6" />
                <span className="text-xs font-medium text-center">Raise Hand</span>
              </button>

              {/* Participants */}
              <button
                onClick={() => {
                  onToggleParticipants();
                  setShowMoreMenu(false);
                }}
                className={`p-4 rounded-xl flex flex-col items-center gap-2 transition-all duration-200 relative ${
                  showParticipants ? 'bg-blue-600 hover:bg-blue-500' : 'bg-gray-700 hover:bg-gray-600'
                }`}
                title="Show participants"
              >
                <UserGroupIcon className="w-6 h-6" />
                <span className="text-xs font-medium text-center">Participants</span>
                {raisedHands.size > 0 && (
                  <span className="absolute -top-1 -right-1 bg-yellow-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {raisedHands.size}
                  </span>
                )}
              </button>

              {/* Recording */}
              <button
                onClick={() => {
                  onToggleRecording();
                  setShowMoreMenu(false);
                }}
                className={`p-4 rounded-xl flex flex-col items-center gap-2 transition-all duration-200 ${
                  isRecording ? 'bg-red-600 hover:bg-red-500 animate-pulse' : 'bg-gray-700 hover:bg-gray-600'
                }`}
                title={isRecording ? "Stop recording" : "Start recording"}
              >
                {isRecording ? (
                  <StopCircleIcon className="w-6 h-6" />
                ) : (
                  <VideoCameraIconSolid className="w-6 h-6" />
                )}
                <span className="text-xs font-medium text-center">Recording</span>
              </button>

              {/* Settings */}
              <button
                onClick={() => {
                  onToggleSettings();
                  setShowMoreMenu(false);
                }}
                className={`p-4 rounded-xl flex flex-col items-center gap-2 transition-all duration-200 ${
                  showSettings ? 'bg-blue-600 hover:bg-blue-500' : 'bg-gray-700 hover:bg-gray-600'
                }`}
                title="Open settings"
              >
                <Cog6ToothIcon className="w-6 h-6" />
                <span className="text-xs font-medium text-center">Settings</span>
              </button>

              {/* Meeting Notes */}
              <button
                onClick={() => {
                  onToggleNotes();
                  setShowMoreMenu(false);
                }}
                className={`p-4 rounded-xl flex flex-col items-center gap-2 transition-all duration-200 ${
                  showNotes ? 'bg-blue-600 hover:bg-blue-500' : 'bg-gray-700 hover:bg-gray-600'
                }`}
                title="Meeting notes"
              >
                <DocumentTextIcon className="w-6 h-6" />
                <span className="text-xs font-medium text-center">Notes</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default VideoControls;