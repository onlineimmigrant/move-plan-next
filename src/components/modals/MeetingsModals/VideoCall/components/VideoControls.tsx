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
  XMarkIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { MicrophoneIcon as MicrophoneIconSolid } from '@heroicons/react/24/solid';
import { LocalDataTrack, Room, LocalAudioTrack, LocalVideoTrack } from 'twilio-video';
import { useThemeColors } from '@/hooks/useThemeColors';

interface TaskItem {
  id: string;
  name: string;
  description: string;
  enabled?: boolean;
}

interface AIModel {
  id: number;
  name: string;
  role: string;
  description: string | null;
  task: TaskItem[] | null;
  system_message: string;
  api_key: string;
  endpoint: string;
  max_tokens: number;
  icon: string | null;
  organization_types: string[];
  required_plan: string;
  token_limit_period: string | null;
  token_limit_amount: number | null;
  is_free: boolean;
  is_trial: boolean;
  trial_expires_days: number | null;
  is_active: boolean;
  is_featured: boolean;
  tags: string[];
  sort_order: number;
  created_at: string;
  updated_at: string;
}

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
  isTranscribing?: boolean;
  showTranscription?: boolean;
  isAnalyzing?: boolean;
  showAnalysis?: boolean;
  selectedAIModel?: AIModel | null;
  aiModels?: AIModel[];
  aiModelsLoading?: boolean;
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
  onToggleTranscription?: () => void;
  onToggleAnalysis?: () => void;
  onRunAnalysis?: () => void;
  onSelectAIModel?: (model: AIModel) => void;
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
  isTranscribing = false,
  showTranscription = false,
  isAnalyzing = false,
  showAnalysis = false,
  selectedAIModel,
  aiModels = [],
  aiModelsLoading = false,
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
  onToggleTranscription,
  onToggleAnalysis,
  onRunAnalysis,
  onSelectAIModel,
  onLeaveCall,
  onStartRecording,
  onStopRecording,
}) => {
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showAIMenu, setShowAIMenu] = useState(false);
  const themeColors = useThemeColors();
  const primary = themeColors.cssVars.primary;

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
          className={`${isMobile ? 'p-4' : 'p-3'} rounded-full relative transition-colors duration-200`}
          style={{
            backgroundColor: showChat ? primary.base : '#4b5563',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = showChat ? primary.hover : '#6b7280';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = showChat ? primary.base : '#4b5563';
          }}
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
          className={`${isMobile ? 'p-4' : 'p-3'} rounded-full transition-colors duration-200`}
          style={{
            backgroundColor: showMoreMenu ? primary.base : '#4b5563',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = showMoreMenu ? primary.hover : '#6b7280';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = showMoreMenu ? primary.base : '#4b5563';
          }}
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
                className="p-4 rounded-xl flex flex-col items-center gap-2 transition-all duration-200"
                style={{
                  backgroundColor: isScreenSharing ? primary.base : '#374151',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = isScreenSharing ? primary.hover : '#4b5563';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = isScreenSharing ? primary.base : '#374151';
                }}
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
                className="p-4 rounded-xl flex flex-col items-center gap-2 transition-all duration-200 relative"
                style={{
                  backgroundColor: showParticipants ? primary.base : '#374151',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = showParticipants ? primary.hover : '#4b5563';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = showParticipants ? primary.base : '#374151';
                }}
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
                className="p-4 rounded-xl flex flex-col items-center gap-2 transition-all duration-200"
                style={{
                  backgroundColor: isRecording ? primary.base : '#374151',
                  animation: isRecording ? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'none'
                }}
                onMouseEnter={(e) => {
                  if (!isRecording) {
                    e.currentTarget.style.backgroundColor = '#4b5563';
                  } else {
                    e.currentTarget.style.backgroundColor = primary.hover;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isRecording) {
                    e.currentTarget.style.backgroundColor = '#374151';
                  } else {
                    e.currentTarget.style.backgroundColor = primary.base;
                  }
                }}
                title={isRecording ? "Stop recording" : "Start recording"}
              >
                {isRecording ? (
                  <StopCircleIcon className="w-6 h-6" />
                ) : (
                  <VideoCameraIconSolid className="w-6 h-6" />
                )}
                <span className="text-xs font-medium text-center">Recording</span>
              </button>

              {/* Transcription */}
              {onToggleTranscription && (
                <button
                  onClick={() => {
                    onToggleTranscription();
                    setShowMoreMenu(false);
                  }}
                  className="p-4 rounded-xl flex flex-col items-center gap-2 transition-all duration-200"
                  style={{
                    backgroundColor: isTranscribing ? primary.base : '#374151',
                    animation: isTranscribing ? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'none'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = isTranscribing ? primary.hover : '#4b5563';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = isTranscribing ? primary.base : '#374151';
                  }}
                  title={isTranscribing ? "Stop transcription" : "Start transcription"}
                >
                  <MicrophoneIconSolid className="w-6 h-6" />
                  <span className="text-xs font-medium text-center">Transcribe</span>
                </button>
              )}

              {/* AI Analysis */}
              {onToggleAnalysis && (
                <button
                  onClick={() => {
                    setShowAIMenu(!showAIMenu);
                  }}
                  className="p-4 rounded-xl flex flex-col items-center gap-2 transition-all duration-200 relative"
                  style={{
                    backgroundColor: showAnalysis || showAIMenu ? primary.base : '#374151',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = (showAnalysis || showAIMenu) ? primary.hover : '#4b5563';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = (showAnalysis || showAIMenu) ? primary.base : '#374151';
                  }}
                  title="AI Analysis"
                >
                  <SparklesIcon className="w-6 h-6" />
                  <span className="text-xs font-medium text-center">AI Insights</span>
                  {isAnalyzing && (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                  )}
                </button>
              )}

              {/* Settings */}
              <button
                onClick={() => {
                  onToggleSettings();
                  setShowMoreMenu(false);
                }}
                className="p-4 rounded-xl flex flex-col items-center gap-2 transition-all duration-200"
                style={{
                  backgroundColor: showSettings ? primary.base : '#374151',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = showSettings ? primary.hover : '#4b5563';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = showSettings ? primary.base : '#374151';
                }}
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
                className="p-4 rounded-xl flex flex-col items-center gap-2 transition-all duration-200"
                style={{
                  backgroundColor: showNotes ? primary.base : '#374151',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = showNotes ? primary.hover : '#4b5563';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = showNotes ? primary.base : '#374151';
                }}
                title="Meeting notes"
              >
                <DocumentTextIcon className="w-6 h-6" />
                <span className="text-xs font-medium text-center">Notes</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Analysis Menu */}
      {showAIMenu && onRunAnalysis && onSelectAIModel && (
        <div 
          className="fixed inset-0 z-50" 
          onClick={() => setShowAIMenu(false)}
        >
          <div 
            className="absolute bottom-20 right-4 bg-gray-800 rounded-xl shadow-2xl p-4 border border-gray-700"
            style={{ minWidth: '280px', maxWidth: '320px' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <SparklesIcon className="h-5 w-5 text-purple-400" />
                <h3 className="text-white font-semibold">AI Analysis</h3>
              </div>
              <button
                onClick={() => setShowAIMenu(false)}
                className="p-1 hover:bg-gray-700 rounded transition-colors"
              >
                <XMarkIcon className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            {/* Model Selection */}
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Select AI Model</label>
                {aiModelsLoading ? (
                  <div className="text-gray-400 text-sm py-2">Loading models...</div>
                ) : aiModels && aiModels.length > 0 ? (
                  <select
                    value={selectedAIModel?.id || ''}
                    onChange={(e) => {
                      const model = aiModels.find(m => m.id === parseInt(e.target.value));
                      if (model) onSelectAIModel(model);
                    }}
                    className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg text-sm border border-gray-600 focus:outline-none focus:border-purple-500"
                  >
                    {aiModels.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name} {model.role ? `(${model.role})` : ''}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="text-gray-400 text-sm py-2">No AI models available</div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => {
                    if (onToggleAnalysis) {
                      onToggleAnalysis();
                    }
                    setShowAIMenu(false);
                  }}
                  className="w-full px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                  style={{
                    backgroundColor: showAnalysis ? '#dc2626' : primary.base,
                    color: 'white'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = showAnalysis ? '#b91c1c' : primary.hover;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = showAnalysis ? '#dc2626' : primary.base;
                  }}
                >
                  {showAnalysis ? 'Close Analysis Panel' : 'Show Analysis Panel'}
                </button>

                {selectedAIModel && (
                  <button
                    onClick={() => {
                      onRunAnalysis();
                      setShowAIMenu(false);
                    }}
                    disabled={isAnalyzing || !isTranscribing}
                    className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium text-sm transition-colors"
                  >
                    {isAnalyzing ? 'Analyzing...' : 'Run Analysis'}
                  </button>
                )}
              </div>

              {/* Info */}
              {!isTranscribing && (
                <p className="text-xs text-gray-500 text-center mt-2">
                  Start transcription first to analyze conversation
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default VideoControls;