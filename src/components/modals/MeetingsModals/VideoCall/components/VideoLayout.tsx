'use client';

import React, { useState } from 'react';
import { XMarkIcon, VideoCameraIcon } from '@heroicons/react/24/outline';
import RemoteParticipantVideo from './RemoteParticipantVideo';
import { useThemeColors } from '@/hooks/useThemeColors';

interface ParticipantData {
  identity: string;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  videoTrack?: any;
  audioTrack?: any;
}

interface VideoLayoutProps {
  viewMode: 'grid' | 'spotlight' | 'sidebar';
  participants: Map<string, ParticipantData>;
  isMinimized: boolean;
  isMobile: boolean;
  pinnedParticipant: string | null;
  showSelfView: boolean;
  isLocalVideoMirrored: boolean;
  backgroundMode: string;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  localVideoRef: React.RefObject<HTMLVideoElement>;
  processedVideoRef: React.RefObject<HTMLVideoElement>;
  backgroundVideoRef: React.RefObject<HTMLVideoElement>;
  backgroundCanvasRef: React.RefObject<HTMLCanvasElement>;
  localVideoRefSpotlight: React.RefObject<HTMLVideoElement>;
  processedVideoSpotlightRef: React.RefObject<HTMLVideoElement>;
  localVideoRefThumbnail: React.RefObject<HTMLVideoElement>;
  processedVideoThumbnailRef: React.RefObject<HTMLVideoElement>;
  room: any;
  onPinParticipant: (identity: string) => void;
  onUnpinParticipant: () => void;
  onToggleSelfView: () => void;
  onToggleMirror: () => void;
}

const VideoLayout: React.FC<VideoLayoutProps> = ({
  viewMode,
  participants,
  isMinimized,
  isMobile,
  pinnedParticipant,
  showSelfView,
  isLocalVideoMirrored,
  backgroundMode,
  isAudioEnabled,
  isVideoEnabled,
  localVideoRef,
  processedVideoRef,
  backgroundVideoRef,
  backgroundCanvasRef,
  localVideoRefSpotlight,
  processedVideoSpotlightRef,
  localVideoRefThumbnail,
  processedVideoThumbnailRef,
  room,
  onPinParticipant,
  onUnpinParticipant,
  onToggleSelfView,
  onToggleMirror,
}) => {
  const themeColors = useThemeColors();
  const primary = themeColors.cssVars.primary;
  const [hoveredThumbnail, setHoveredThumbnail] = useState<string | null>(null);

  return (
    <div
      className="flex-1 overflow-auto"
    >
      {viewMode === 'grid' && (
        <div className={`w-full grid gap-2 sm:gap-4 p-2 sm:p-4 ${
          participants.size === 0 ? 'grid-cols-1' :
          participants.size === 1 ? 'grid-cols-1 sm:grid-cols-2' :
          participants.size === 2 ? 'grid-cols-1 sm:grid-cols-2' :
          participants.size === 3 ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3' :
          'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
        } auto-rows-fr`}>
          {/* Local Video */}
          <div className="relative bg-gray-800 overflow-hidden aspect-video group">
            {!isVideoEnabled && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800 z-10">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-gray-700 flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-400">Camera Off</p>
                </div>
              </div>
            )}
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className={`w-full h-full object-cover transition-transform duration-200 ${backgroundMode !== 'none' ? 'hidden' : ''}`}
              style={{ transform: isLocalVideoMirrored ? 'scaleX(-1)' : 'scaleX(1)' }}
            />
            <video
              ref={processedVideoRef}
              autoPlay
              muted
              playsInline
              className={`absolute inset-0 w-full h-full object-cover pointer-events-none ${backgroundMode === 'none' ? 'hidden' : ''}`}
              style={{ transform: isLocalVideoMirrored ? 'scaleX(-1)' : 'scaleX(1)' }}
            />
            <video
              ref={backgroundVideoRef}
              autoPlay
              muted
              playsInline
              className="hidden"
            />
            <canvas
              ref={backgroundCanvasRef}
              className="hidden"
              width="640"
              height="480"
            />
            <div className="absolute bottom-2 left-2 bg-gray-900/30 backdrop-blur-sm px-2 py-1 rounded-md text-xs flex items-center gap-1.5">
              <span>You ({room?.localParticipant.identity || 'connecting...'})</span>
              {!isAudioEnabled && (
                <svg className="w-3 h-3 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd"/>
                </svg>
              )}
              {!isVideoEnabled && <span>(Audio only)</span>}
            </div>
            <button
              onClick={onToggleMirror}
              className="absolute top-2 right-2 p-1.5 bg-gray-900/20 hover:bg-gray-900/40 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
              title={isLocalVideoMirrored ? "Disable mirror" : "Enable mirror"}
            >
              <svg className="w-5 h-5 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18M12 3l-4 4m4-4l4 4m0 10l-4-4m4 4l4-4" />
              </svg>
            </button>
          </div>

          {/* Remote Participants */}
          {Array.from(participants.values()).map((participant) => (
            <RemoteParticipantVideo
              key={participant.identity}
              participant={participant}
              isFullscreen={false}
              onPin={() => {
                onPinParticipant(participant.identity);
                // Note: viewMode change should be handled by parent
              }}
            />
          ))}
        </div>
      )}

      {(viewMode === 'spotlight' || viewMode === 'sidebar') && (
        <div className={`w-full h-full flex ${isMobile ? 'gap-2 p-2' : 'gap-4 p-4'}`}>
          {/* Main Video Area */}
          <div className={`${viewMode === 'sidebar' ? 'flex-1' : 'w-full'} relative`}>
            {pinnedParticipant && participants.get(pinnedParticipant) ? (
              <RemoteParticipantVideo
                participant={participants.get(pinnedParticipant)!}
                isFullscreen={true}
                onPin={onUnpinParticipant}
                isPinned={true}
              />
            ) : (
              // Show local video as main when no participant is pinned
              <div className="w-full h-full relative bg-gray-800 rounded-lg overflow-hidden group">
                {!isVideoEnabled && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-800 z-10">
                    <div className="text-center">
                      <div className="w-24 h-24 mx-auto mb-3 rounded-full bg-gray-700 flex items-center justify-center">
                        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <p className="text-base text-gray-400">Camera Off</p>
                    </div>
                  </div>
                )}
                <video
                  ref={localVideoRefSpotlight}
                  autoPlay
                  muted
                  playsInline
                  className={`w-full h-full object-cover transition-transform duration-200 ${backgroundMode !== 'none' ? 'hidden' : ''}`}
                  style={{ transform: isLocalVideoMirrored ? 'scaleX(-1)' : 'scaleX(1)' }}
                />
                <video
                  ref={processedVideoSpotlightRef}
                  autoPlay
                  muted
                  playsInline
                  className={`absolute inset-0 w-full h-full object-cover pointer-events-none ${backgroundMode === 'none' ? 'hidden' : ''}`}
                  style={{ transform: isLocalVideoMirrored ? 'scaleX(-1)' : 'scaleX(1)' }}
                />
                <video
                  ref={backgroundVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="hidden"
                />
                <canvas
                  ref={backgroundCanvasRef}
                  className="hidden"
                />
                <div className="absolute bottom-4 left-4 bg-gray-900/30 backdrop-blur-sm px-3 py-1.5 rounded-lg text-sm flex items-center gap-2">
                  <span>You</span>
                  {!isAudioEnabled && (
                    <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd"/>
                    </svg>
                  )}
                  {!isVideoEnabled && <span>(Audio only)</span>}
                </div>
                <button
                  onClick={onToggleMirror}
                  className="absolute top-4 right-4 p-2 bg-gray-900/20 hover:bg-gray-900/40 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
                  title={isLocalVideoMirrored ? "Disable mirror" : "Enable mirror"}
                >
                  <svg className="w-6 h-6 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18M12 3l-4 4m4-4l4 4m0 10l-4-4m4 4l4-4" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* Sidebar with thumbnails */}
          <div className={`flex ${viewMode === 'sidebar' ? 'flex-col w-64 gap-3' : 'flex-row gap-3 absolute bottom-24 left-4 right-4'} overflow-auto`}>
            {/* Local Video Thumbnail - only show if someone else is pinned */}
            {showSelfView && pinnedParticipant && (
              <div
                className="relative bg-gray-800 overflow-hidden rounded-lg group flex-shrink-0 cursor-pointer transition-all"
                style={{ 
                  aspectRatio: '16/9', 
                  height: viewMode === 'sidebar' ? 'auto' : '120px',
                  boxShadow: hoveredThumbnail === 'local' ? `0 0 0 2px ${primary.base}` : undefined
                }}
                onMouseEnter={() => setHoveredThumbnail('local')}
                onMouseLeave={() => setHoveredThumbnail(null)}
                onClick={onUnpinParticipant}
              >
                {!isVideoEnabled && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-800 z-10">
                    <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  </div>
                )}
                <video
                  ref={localVideoRefThumbnail}
                  autoPlay
                  muted
                  playsInline
                  className={`w-full h-full object-cover transition-transform duration-200 ${backgroundMode !== 'none' ? 'hidden' : ''}`}
                  style={{ transform: isLocalVideoMirrored ? 'scaleX(-1)' : 'scaleX(1)' }}
                />
                <video
                  ref={processedVideoThumbnailRef}
                  autoPlay
                  muted
                  playsInline
                  className={`absolute inset-0 w-full h-full object-cover pointer-events-none ${backgroundMode === 'none' ? 'hidden' : ''}`}
                  style={{ transform: isLocalVideoMirrored ? 'scaleX(-1)' : 'scaleX(1)' }}
                />
                <video
                  ref={backgroundVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="hidden"
                />
                <canvas
                  ref={backgroundCanvasRef}
                  className="hidden"
                />
                <div className="absolute bottom-1.5 left-1.5 bg-gray-900/30 backdrop-blur-sm px-2 py-0.5 rounded text-xs">
                  You
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleSelfView();
                  }}
                  className="absolute top-1 right-1 p-1 bg-gray-900/40 hover:bg-gray-900/60 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200"
                  title="Hide self view"
                >
                  <XMarkIcon className="w-3 h-3 text-white" />
                </button>
              </div>
            )}

            {/* Remote Participants Thumbnails */}
            {Array.from(participants.values())
              .filter(p => p.identity !== pinnedParticipant)
              .map((participant) => (
                <div
                  key={participant.identity}
                  className="cursor-pointer flex-shrink-0"
                  style={{ aspectRatio: '16/9', height: viewMode === 'sidebar' ? 'auto' : '120px' }}
                  onClick={() => onPinParticipant(participant.identity)}
                >
                  <RemoteParticipantVideo
                    participant={participant}
                    isFullscreen={false}
                    onPin={() => onPinParticipant(participant.identity)}
                  />
                </div>
              ))}
          </div>

          {/* Show self view button if hidden */}
          {!showSelfView && (viewMode === 'spotlight' || viewMode === 'sidebar') && (
            <button
              onClick={onToggleSelfView}
              className="absolute bottom-24 left-4 p-2 bg-gray-800 hover:bg-gray-700 rounded-full transition-colors"
              title="Show self view"
            >
              <VideoCameraIcon className="w-5 h-5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default VideoLayout;