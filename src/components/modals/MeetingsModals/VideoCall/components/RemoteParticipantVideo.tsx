'use client';

import { useEffect, useRef } from 'react';
import { RemoteVideoTrack, RemoteAudioTrack } from 'twilio-video';

interface Participant {
  identity: string;
  videoTrack?: RemoteVideoTrack;
  audioTrack?: RemoteAudioTrack;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
}

interface RemoteParticipantVideoProps {
  participant: Participant;
  isFullscreen?: boolean;
  onPin?: () => void;
  isPinned?: boolean;
}

export default function RemoteParticipantVideo({ participant, isFullscreen = false, onPin, isPinned = false }: RemoteParticipantVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Log participant state changes
  useEffect(() => {
    console.log('🔄 RemoteParticipantVideo: Participant object changed for:', participant.identity);
  }, [participant]);

  // Log audio state specifically
  useEffect(() => {
    console.log('🎤 RemoteParticipantVideo: Audio state changed for:', participant.identity, {
      hasAudioTrack: !!participant.audioTrack,
      isAudioEnabled: participant.isAudioEnabled,
    });
  }, [participant.identity, participant.audioTrack, participant.isAudioEnabled]);

  // Attach video track
  useEffect(() => {
    if (participant.videoTrack && videoRef.current) {
      participant.videoTrack.attach(videoRef.current);
      console.log('📹 Attached video track for:', participant.identity);
    }

    return () => {
      if (participant.videoTrack && videoRef.current) {
        participant.videoTrack.detach(videoRef.current);
      }
    };
  }, [participant.videoTrack, participant.identity]);

  // Attach audio track
  useEffect(() => {
    // Clean up any existing audio element first
    if (audioRef.current) {
      console.log('🔇 Removing previous audio element for:', participant.identity);
      if (participant.audioTrack) {
        participant.audioTrack.detach(audioRef.current);
      }
      audioRef.current.remove();
      audioRef.current = null;
    }

    if (participant.audioTrack && participant.isAudioEnabled) {
      // Create and attach audio element
      const audioElement = participant.audioTrack.attach();
      console.log('🔊 Attached audio track for:', participant.identity, 'enabled:', participant.isAudioEnabled);
      audioRef.current = audioElement;

      // Set volume lower to reduce echo during same-computer testing
      audioElement.volume = 0.7;

      document.body.appendChild(audioElement);
    } else {
      console.log('🔇 Audio disabled for:', participant.identity, 'hasTrack:', !!participant.audioTrack, 'isEnabled:', participant.isAudioEnabled);
    }

    return () => {
      if (audioRef.current) {
        console.log('🧹 Cleanup: removing audio element for:', participant.identity);
        if (participant.audioTrack) {
          participant.audioTrack.detach(audioRef.current);
        }
        audioRef.current.remove();
        audioRef.current = null;
      }
    };
  }, [participant.audioTrack, participant.identity, participant.isAudioEnabled]);

  return (
    <div
      className={`relative bg-gray-800 overflow-hidden ${
        isFullscreen ? 'h-full' : 'aspect-video rounded-lg'
      } group ${onPin && !isPinned ? 'cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all' : ''}`}
      onClick={onPin && !isPinned ? onPin : undefined}
    >
      {participant.isVideoEnabled ? (
        <video
          ref={videoRef}
          autoPlay
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gray-700">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-2xl font-semibold text-white">
                {participant.identity.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="text-sm text-gray-300">{participant.identity}</div>
          </div>
        </div>
      )}
      <div className="absolute bottom-2 left-2 bg-gray-900/30 backdrop-blur-sm px-2 py-1 rounded-md text-xs flex items-center gap-1.5">
        <span>{participant.identity}</span>
        {!participant.isAudioEnabled && (
          <svg className="w-3 h-3 text-red-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd"/>
          </svg>
        )}
      </div>

      {/* Pin/Unpin button */}
      {onPin && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPin();
          }}
          className="absolute top-2 right-2 p-1.5 bg-gray-900/20 hover:bg-gray-900/40 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
          title={isPinned ? "Unpin" : "Pin to spotlight"}
        >
          {isPinned ? (
            <svg className="w-5 h-5 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
              <path d="M16 9V4h1c.55 0 1-.45 1-1s-.45-1-1-1H7c-.55 0-1 .45-1 1s.45 1 1 1h1v5c0 1.66-1.34 3-3 3v2h5.97v7l1 1 1-1v-7H19v-2c-1.66 0-3-1.34-3-3z"/>
            </svg>
          ) : (
            <svg className="w-5 h-5 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          )}
        </button>
      )}
    </div>
  );
}