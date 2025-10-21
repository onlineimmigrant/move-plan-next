'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { connect, Room, LocalVideoTrack, LocalAudioTrack, RemoteParticipant, RemoteVideoTrack, RemoteAudioTrack } from 'twilio-video';
import { VideoCameraIcon, VideoCameraSlashIcon, MicrophoneIcon, PhoneXMarkIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline';

interface VideoCallProps {
  token: string;
  roomName: string;
  onLeave: () => void;
  participantName?: string;
}

interface Participant {
  identity: string;
  videoTrack?: RemoteVideoTrack;
  audioTrack?: RemoteAudioTrack;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
}

export default function VideoCall({ token, roomName, onLeave, participantName }: VideoCallProps) {
  const [room, setRoom] = useState<Room | null>(null);
  const [participants, setParticipants] = useState<Map<string, Participant>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localAudioTrackRef = useRef<LocalAudioTrack | null>(null);
  const localVideoTrackRef = useRef<LocalVideoTrack | null>(null);
  const screenTrackRef = useRef<LocalVideoTrack | null>(null);

  // Initialize local tracks
  useEffect(() => {
    const initializeLocalTracks = async () => {
      try {
        const audioTrack = await navigator.mediaDevices.getUserMedia({ audio: true })
          .then(stream => new LocalAudioTrack(stream.getAudioTracks()[0]));
        const videoTrack = await navigator.mediaDevices.getUserMedia({ video: true })
          .then(stream => new LocalVideoTrack(stream.getVideoTracks()[0]));

        localAudioTrackRef.current = audioTrack;
        localVideoTrackRef.current = videoTrack;

        // Attach local video
        if (localVideoRef.current && videoTrack) {
          videoTrack.attach(localVideoRef.current);
        }
      } catch (err) {
        console.error('Error initializing local tracks:', err);
        setError('Failed to access camera and microphone');
      }
    };

    initializeLocalTracks();

    return () => {
      // Cleanup local tracks
      localAudioTrackRef.current?.stop();
      localVideoTrackRef.current?.stop();
      screenTrackRef.current?.stop();
    };
  }, []);

  // Connect to room
  useEffect(() => {
    if (!token || !roomName) return;

    const connectToRoom = async () => {
      try {
        // Connect with token only - room name is embedded in the token
        const roomInstance = await connect(token, {
          tracks: [
            ...(localAudioTrackRef.current ? [localAudioTrackRef.current] : []),
            ...(localVideoTrackRef.current ? [localVideoTrackRef.current] : []),
          ].filter(Boolean),
        });

        setRoom(roomInstance);
        setIsConnected(true);

        // Handle existing participants
        roomInstance.participants.forEach(participant => {
          handleParticipantConnected(participant);
        });

        // Set up event listeners
        roomInstance.on('participantConnected', handleParticipantConnected);
        roomInstance.on('participantDisconnected', handleParticipantDisconnected);
        roomInstance.on('disconnected', handleDisconnected);

      } catch (err) {
        console.error('Error connecting to room:', err);
        setError('Failed to connect to meeting');
      }
    };

    connectToRoom();

    return () => {
      if (room) {
        room.disconnect();
      }
    };
  }, [token, roomName]);

  const handleParticipantConnected = useCallback((participant: RemoteParticipant) => {
    setParticipants(prev => {
      const newParticipants = new Map(prev);
      newParticipants.set(participant.identity, {
        identity: participant.identity,
        isVideoEnabled: false,
        isAudioEnabled: false,
      });
      return newParticipants;
    });

    // Handle track subscriptions
    participant.on('trackSubscribed', (track) => {
      if (track.kind === 'video') {
        setParticipants(prev => {
          const newParticipants = new Map(prev);
          const participantData = newParticipants.get(participant.identity);
          if (participantData) {
            participantData.videoTrack = track as RemoteVideoTrack;
            participantData.isVideoEnabled = true;
          }
          return newParticipants;
        });
      } else if (track.kind === 'audio') {
        setParticipants(prev => {
          const newParticipants = new Map(prev);
          const participantData = newParticipants.get(participant.identity);
          if (participantData) {
            participantData.audioTrack = track as RemoteAudioTrack;
            participantData.isAudioEnabled = true;
          }
          return newParticipants;
        });
      }
    });

    participant.on('trackUnsubscribed', (track) => {
      if (track.kind === 'video') {
        setParticipants(prev => {
          const newParticipants = new Map(prev);
          const participantData = newParticipants.get(participant.identity);
          if (participantData) {
            participantData.isVideoEnabled = false;
          }
          return newParticipants;
        });
      } else if (track.kind === 'audio') {
        setParticipants(prev => {
          const newParticipants = new Map(prev);
          const participantData = newParticipants.get(participant.identity);
          if (participantData) {
            participantData.isAudioEnabled = false;
          }
          return newParticipants;
        });
      }
    });
  }, []);

  const handleParticipantDisconnected = useCallback((participant: RemoteParticipant) => {
    setParticipants(prev => {
      const newParticipants = new Map(prev);
      newParticipants.delete(participant.identity);
      return newParticipants;
    });
  }, []);

  const handleDisconnected = useCallback(() => {
    setIsConnected(false);
    setRoom(null);
    onLeave();
  }, [onLeave]);

  const toggleVideo = async () => {
    if (!localVideoTrackRef.current) return;

    if (isVideoEnabled) {
      room?.localParticipant.unpublishTrack(localVideoTrackRef.current);
      localVideoTrackRef.current.stop();
      setIsVideoEnabled(false);
    } else {
      try {
        const videoTrack = await navigator.mediaDevices.getUserMedia({ video: true })
          .then(stream => new LocalVideoTrack(stream.getVideoTracks()[0]));
        localVideoTrackRef.current = videoTrack;
        room?.localParticipant.publishTrack(videoTrack);
        setIsVideoEnabled(true);
      } catch (err) {
        console.error('Error enabling video:', err);
      }
    }
  };

  const toggleAudio = async () => {
    if (!localAudioTrackRef.current) return;

    if (isAudioEnabled) {
      room?.localParticipant.unpublishTrack(localAudioTrackRef.current);
      localAudioTrackRef.current.stop();
      setIsAudioEnabled(false);
    } else {
      try {
        const audioTrack = await navigator.mediaDevices.getUserMedia({ audio: true })
          .then(stream => new LocalAudioTrack(stream.getAudioTracks()[0]));
        localAudioTrackRef.current = audioTrack;
        room?.localParticipant.publishTrack(audioTrack);
        setIsAudioEnabled(true);
      } catch (err) {
        console.error('Error enabling audio:', err);
      }
    }
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      if (screenTrackRef.current) {
        room?.localParticipant.unpublishTrack(screenTrackRef.current);
        screenTrackRef.current.stop();
        screenTrackRef.current = null;
      }
      setIsScreenSharing(false);
    } else {
      try {
        const screenTrack = await navigator.mediaDevices.getDisplayMedia({ video: true })
          .then(stream => new LocalVideoTrack(stream.getVideoTracks()[0]));
        screenTrackRef.current = screenTrack;
        room?.localParticipant.publishTrack(screenTrack);
        setIsScreenSharing(true);
      } catch (err) {
        console.error('Error starting screen share:', err);
      }
    }
  };

  const leaveCall = () => {
    if (room) {
      room.disconnect();
    }
    onLeave();
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-red-50">
        <div className="text-center">
          <div className="text-red-600 text-lg font-semibold mb-2">Connection Error</div>
          <div className="text-red-500">{error}</div>
          <button
            onClick={onLeave}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gray-800">
        <div>
          <h2 className="text-lg font-semibold">{roomName}</h2>
          <div className="text-sm text-gray-300">
            {isConnected ? 'Connected' : 'Connecting...'} • {participants.size + 1} participants
          </div>
        </div>
        <div className="text-sm text-gray-300">
          {participantName || 'You'}
        </div>
      </div>

      {/* Video Grid */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 overflow-auto">
        {/* Local Video */}
        <div className="relative bg-gray-800 rounded-lg overflow-hidden">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 px-2 py-1 rounded text-sm">
            You {isVideoEnabled ? '(Video)' : '(Audio only)'}
          </div>
        </div>

        {/* Remote Participants */}
        {Array.from(participants.values()).map((participant) => (
          <RemoteParticipantVideo
            key={participant.identity}
            participant={participant}
          />
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center space-x-4 p-4 bg-gray-800">
        <button
          onClick={toggleVideo}
          className={`p-3 rounded-full ${isVideoEnabled ? 'bg-gray-600 hover:bg-gray-500' : 'bg-red-600 hover:bg-red-500'}`}
        >
          {isVideoEnabled ? (
            <VideoCameraIcon className="w-6 h-6" />
          ) : (
            <VideoCameraSlashIcon className="w-6 h-6" />
          )}
        </button>

        <button
          onClick={toggleAudio}
          className={`p-3 rounded-full ${isAudioEnabled ? 'bg-gray-600 hover:bg-gray-500' : 'bg-red-600 hover:bg-red-500'}`}
        >
          {isAudioEnabled ? (
            <MicrophoneIcon className="w-6 h-6" />
          ) : (
            <MicrophoneIcon className="w-6 h-6 opacity-50" />
          )}
        </button>

        <button
          onClick={toggleScreenShare}
          className={`p-3 rounded-full ${isScreenSharing ? 'bg-blue-600 hover:bg-blue-500' : 'bg-gray-600 hover:bg-gray-500'}`}
        >
          <ComputerDesktopIcon className="w-6 h-6" />
        </button>

        <button
          onClick={leaveCall}
          className="p-3 rounded-full bg-red-600 hover:bg-red-500"
        >
          <PhoneXMarkIcon className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}

// Component for remote participant video
interface RemoteParticipantVideoProps {
  participant: Participant;
}

function RemoteParticipantVideo({ participant }: RemoteParticipantVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (participant.videoTrack && videoRef.current) {
      participant.videoTrack.attach(videoRef.current);
    }

    return () => {
      if (participant.videoTrack && videoRef.current) {
        participant.videoTrack.detach(videoRef.current);
      }
    };
  }, [participant.videoTrack]);

  return (
    <div className="relative bg-gray-800 rounded-lg overflow-hidden">
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
      <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 px-2 py-1 rounded text-sm">
        {participant.identity}
        {!participant.isAudioEnabled && ' (Muted)'}
      </div>
    </div>
  );
}