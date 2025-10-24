import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Room,
  RemoteParticipant,
  LocalAudioTrack,
  LocalVideoTrack,
  LocalDataTrack,
  RemoteVideoTrack,
  RemoteAudioTrack,
  connect
} from 'twilio-video';

export interface ParticipantData {
  identity: string;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  videoTrack?: RemoteVideoTrack;
  audioTrack?: RemoteAudioTrack;
}

export interface UseTwilioRoomReturn {
  // Room state
  room: Room | null;
  isConnected: boolean;
  isConnecting: boolean;
  isReconnecting: boolean;
  error: string | null;

  // Participants
  participants: Map<string, ParticipantData>;

  // Local tracks
  localAudioTrack: LocalAudioTrack | null;
  localVideoTrack: LocalVideoTrack | null;
  localDataTrack: LocalDataTrack | null;
  tracksReady: boolean;

  // Track state
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isVideoAvailable: boolean;
  isAudioAvailable: boolean;

  // Actions
  toggleAudio: () => Promise<void>;
  toggleVideo: () => Promise<void>;
  disconnect: () => void;
}

export const useTwilioRoom = (
  token: string,
  roomName: string,
  participantName: string,
  isHost: boolean,
  onChatMessage?: (message: any, sender: string) => void,
  onReaction?: (emoji: string, sender: string) => void,
  onHandRaised?: (raised: boolean, sender: string) => void,
  onMuteAll?: () => void,
  onKick?: (target: string) => void
): UseTwilioRoomReturn => {
  // Room state
  const [room, setRoom] = useState<Room | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Participants
  const [participants, setParticipants] = useState<Map<string, ParticipantData>>(new Map());

  // Local tracks
  const [tracksReady, setTracksReady] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isVideoAvailable, setIsVideoAvailable] = useState(false);
  const [isAudioAvailable, setIsAudioAvailable] = useState(false);

  // Refs
  const localAudioTrackRef = useRef<LocalAudioTrack | null>(null);
  const localVideoTrackRef = useRef<LocalVideoTrack | null>(null);
  const localDataTrackRef = useRef<LocalDataTrack | null>(null);
  const isConnectingRef = useRef(false);
  const roomRef = useRef<Room | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize local tracks
  useEffect(() => {
    const initializeLocalTracks = async () => {
      try {
        console.log('🚀 Starting track initialization...');
        
        // Check if mediaDevices is available
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          console.error('❌ getUserMedia not supported in this browser');
          setError('Your browser does not support camera/microphone access');
          setTracksReady(true);
          return;
        }

        // Check current permissions
        try {
          const cameraPermission = await navigator.permissions.query({ name: 'camera' as PermissionName });
          const micPermission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          console.log('🔐 Current permissions:', {
            camera: cameraPermission.state,
            microphone: micPermission.state
          });
        } catch (permErr) {
          console.log('⚠️ Could not query permissions (this is OK on some browsers):', permErr);
        }

        console.log('🎤 Initializing local audio track...');
        let audioTrack: LocalAudioTrack | null = null;
        let videoTrack: LocalVideoTrack | null = null;

        // Try to initialize audio first
        try {
          const audioStream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
              sampleRate: 48000,
            }
          });
          audioTrack = new LocalAudioTrack(audioStream.getAudioTracks()[0]);
          console.log('✅ Audio track initialized successfully');
        } catch (audioErr) {
          console.warn('⚠️ Audio track initialization failed:', audioErr);
          console.log('🔇 Continuing without audio track');
        }

        // Try to initialize video
        try {
          console.log('📹 Initializing local video track...');
          let videoStream;
          
          try {
            // Try with ideal constraints first
            videoStream = await navigator.mediaDevices.getUserMedia({
              video: {
                width: { ideal: 2560, max: 3840 },
                height: { ideal: 1440, max: 2160 },
                frameRate: { ideal: 30, max: 60 },
                facingMode: 'user',
                aspectRatio: { ideal: 1.7777777778 }, // 16:9
              }
            });
          } catch (idealErr: any) {
            console.warn('⚠️ Failed with ideal constraints, trying basic video...', idealErr.message);
            // Fallback to basic video constraints
            videoStream = await navigator.mediaDevices.getUserMedia({
              video: true
            });
          }
          
          const videoMediaTrack = videoStream.getVideoTracks()[0];
          if (videoMediaTrack) {
            videoTrack = new LocalVideoTrack(videoMediaTrack);
            console.log('✅ Video track initialized successfully', {
              id: videoTrack.id,
              kind: videoTrack.kind,
              enabled: videoTrack.isEnabled,
              readyState: videoMediaTrack.readyState,
              settings: videoMediaTrack.getSettings()
            });
          } else {
            console.error('❌ No video track in stream');
          }
        } catch (videoErr: any) {
          console.error('❌ Video track initialization failed:', {
            error: videoErr?.message || 'Unknown error',
            name: videoErr?.name || 'Unknown',
            constraint: videoErr?.constraint,
            fullError: videoErr
          });
          
          // Provide specific error guidance
          const errorName = videoErr?.name || '';
          if (errorName === 'NotAllowedError' || errorName === 'PermissionDeniedError') {
            console.error('🚫 Camera permission was denied. Please allow camera access in your browser settings.');
            console.error('💡 To fix: Click the camera icon in your browser address bar and allow camera access.');
            setError('Camera access denied. Click the camera icon in your browser address bar to allow access.');
          } else if (errorName === 'NotFoundError' || errorName === 'DevicesNotFoundError') {
            console.error('📷 No camera found on your device.');
            console.error('💡 Possible fixes:');
            console.error('   1. Check System Preferences → Security & Privacy → Camera');
            console.error('   2. Make sure your camera is plugged in (if external)');
            console.error('   3. Close other apps that might be using the camera (Zoom, Teams, FaceTime, etc.)');
            console.error('   4. Try restarting your browser');
          } else if (errorName === 'NotReadableError' || errorName === 'TrackStartError') {
            console.error('⚠️ Camera is being used by another application. Please close other apps using the camera.');
            console.error('💡 Common apps that use camera: Zoom, Microsoft Teams, Skype, FaceTime, Google Meet');
          } else if (errorName === 'OverconstrainedError') {
            console.error('⚙️ Camera does not support the requested settings.');
          } else if (errorName === 'TypeError') {
            console.error('❌ Invalid camera constraints.');
          } else if (errorName === 'SecurityError') {
            console.error('🔒 Camera access blocked by security policy (HTTPS required).');
          }
          
          console.log('📷 Continuing without video track - you can still join with audio only');
        }

        // Check available devices AFTER requesting permissions
        let hasVideoDevice = false;
        let hasAudioDevice = false;
        
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoDevices = devices.filter(device => device.kind === 'videoinput');
          const audioDevices = devices.filter(device => device.kind === 'audioinput');

          hasVideoDevice = videoDevices.length > 0;
          hasAudioDevice = audioDevices.length > 0;

          console.log('📊 Available devices:', {
            video: videoDevices.length,
            audio: audioDevices.length,
            videoDevicesList: videoDevices.map(d => ({ label: d.label, deviceId: d.deviceId })),
            audioDevicesList: audioDevices.map(d => ({ label: d.label, deviceId: d.deviceId }))
          });

          // Device is available if we can enumerate it OR if we successfully created a track
          const hasVideoTrack = !!videoTrack;
          
          setIsVideoAvailable(hasVideoDevice);
          setIsAudioAvailable(hasAudioDevice);

          console.log('📊 Device availability set:', {
            isVideoAvailable: hasVideoDevice,
            isAudioAvailable: hasAudioDevice,
            hasVideoTrack,
            note: hasVideoDevice && !hasVideoTrack ? 'Video device found but track creation failed' : 'OK'
          });

          if (videoDevices.length === 0 && !videoTrack) {
            console.warn('⚠️ No video input devices found and no track created');
          }
          if (audioDevices.length === 0 && !audioTrack) {
            console.warn('⚠️ No audio input devices found and no track created');
          }
        } catch (enumErr) {
          console.error('❌ Could not enumerate devices:', enumErr);
          // Set availability based on what we actually got
          setIsVideoAvailable(!!videoTrack);
          setIsAudioAvailable(!!audioTrack);
          hasVideoDevice = !!videoTrack;
          hasAudioDevice = !!audioTrack;
        }

        localAudioTrackRef.current = audioTrack;
        localVideoTrackRef.current = videoTrack;

        // Set initial enabled state based on what we got
        // If we have a video device available but no track yet, still set video as available (user can enable it)
        setIsAudioEnabled(!!audioTrack);
        setIsVideoEnabled(!!videoTrack);

        console.log('✅ Local tracks initialization complete:', {
          audioTrack: !!audioTrack,
          videoTrack: !!videoTrack,
          isVideoAvailable: hasVideoDevice,
          isAudioAvailable: hasAudioDevice
        });
        setTracksReady(true);
        console.log('🚀 tracksReady set to true, room connection should start now');
      } catch (err) {
        console.error('❌ Error initializing local tracks:', err);
        setError('Failed to access camera and microphone. Please check permissions and try again.');
        setTracksReady(true); // Allow joining even without tracks
        console.log('🚀 tracksReady set to true (after error), room connection should start now');
      }
    };

    initializeLocalTracks();

    return () => {
      // Cleanup local tracks
      localAudioTrackRef.current?.stop();
      localVideoTrackRef.current?.stop();
      // Data tracks don't have a stop() method, they're just cleaned up on disconnect
    };
  }, []);

  // Handle participant connected
  const handleParticipantConnected = useCallback((participant: RemoteParticipant) => {
    console.log('👤 Participant connected:', participant.identity);

    // Safeguard: Never add ourselves to participants
    if (roomRef.current && participant.identity === roomRef.current.localParticipant.identity) {
      console.warn('⚠️ Attempted to add self to participants, ignoring');
      return;
    }

    // Initialize participant with empty state
    setParticipants(prev => {
      const newParticipants = new Map(prev);
      newParticipants.set(participant.identity, {
        identity: participant.identity,
        isVideoEnabled: false,
        isAudioEnabled: true, // Default to enabled until we know otherwise
      });
      return newParticipants;
    });

    // Process existing tracks (already subscribed)
    participant.tracks.forEach((publication) => {
      console.log('📦 Publication:', publication.trackName, 'kind:', publication.kind, 'subscribed:', publication.isSubscribed, 'enabled:', publication.isTrackEnabled);

      if (publication.isSubscribed && publication.track) {
        const track = publication.track;
        handleTrackSubscribed(participant.identity, track);
      }

      // Listen to publication enabled/disabled events
      publication.on('trackEnabled', () => {
        console.log('🔊 Publication trackEnabled:', publication.kind, 'for:', participant.identity);
        if (publication.track) {
          handleTrackEnabled(participant.identity, publication.track);
        }
      });

      publication.on('trackDisabled', () => {
        console.log('🔇 Publication trackDisabled:', publication.kind, 'for:', participant.identity);
        if (publication.track) {
          handleTrackDisabled(participant.identity, publication.track);
        }
      });
    });

    // Listen for new track subscriptions
    participant.on('trackSubscribed', (track, publication) => {
      console.log('➕ New track subscribed:', track.kind, 'for:', participant.identity);
      handleTrackSubscribed(participant.identity, track);
    });

    participant.on('trackUnsubscribed', (track) => {
      console.log('➖ Track unsubscribed:', track.kind, 'for:', participant.identity);
      handleTrackUnsubscribed(participant.identity, track);
    });
  }, []);

  // Handle participant disconnected
  const handleParticipantDisconnected = useCallback((participant: RemoteParticipant) => {
    console.log('👤 Participant disconnected:', participant.identity);
    setParticipants(prev => {
      const newParticipants = new Map(prev);
      newParticipants.delete(participant.identity);
      return newParticipants;
    });
  }, []);

  // Handle room disconnected
  const handleDisconnected = useCallback(() => {
    console.log('🔌 Room disconnected - attempting reconnection');
    setIsConnected(false);
    setRoom(null);
    setParticipants(new Map());

    // Attempt reconnection with exponential backoff
    if (reconnectAttemptsRef.current < maxReconnectAttempts) {
      reconnectAttemptsRef.current += 1;
      const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current - 1), 30000); // Exponential backoff, max 30s
      console.log(`🔄 Attempting reconnection ${reconnectAttemptsRef.current}/${maxReconnectAttempts} in ${delay}ms`);

      setIsReconnecting(true);
      reconnectTimeoutRef.current = setTimeout(() => {
        if (token && roomName && !isConnectingRef.current) {
          console.log('🔌 Reconnecting to room...');
          // Trigger reconnection by updating state to force useEffect re-run
          setIsConnecting(true);
          setError(null);
        }
      }, delay);
    } else {
      console.log('❌ Max reconnection attempts reached, giving up');
      setError('Connection lost. Please refresh and try again.');
      setIsReconnecting(false);
    }
  }, [token, roomName]);

  // Track handling functions
  const handleTrackSubscribed = useCallback((participantIdentity: string, track: any) => {
    console.log('🔧 Processing track:', track.kind, 'for:', participantIdentity, 'isEnabled:', track.isEnabled);

    setParticipants(prev => {
      const newParticipants = new Map(prev);
      let participantData = newParticipants.get(participantIdentity);

      // Initialize participant if they don't exist yet
      if (!participantData) {
        console.log('👤 Initializing participant data for:', participantIdentity);
        participantData = {
          identity: participantIdentity,
          isVideoEnabled: false,
          isAudioEnabled: true,
        };
        newParticipants.set(participantIdentity, participantData);
      }

      if (track.kind === 'video') {
        participantData.videoTrack = track as RemoteVideoTrack;
        participantData.isVideoEnabled = track.isEnabled;
        console.log('✅ Video track added for:', participantIdentity, 'enabled:', track.isEnabled);
      } else if (track.kind === 'audio') {
        participantData.audioTrack = track as RemoteAudioTrack;
        participantData.isAudioEnabled = track.isEnabled;
        console.log('✅ Audio track added for:', participantIdentity, 'enabled:', track.isEnabled);
      } else if (track.kind === 'data') {
        console.log('📡 Data track subscribed for:', participantIdentity);
        // Set up message listener for data track
        track.on('message', (message: string) => {
          handleTrackMessage(message, { identity: participantIdentity });
        });
      }

      return newParticipants;
    });
  }, []);

  const handleTrackUnsubscribed = useCallback((participantIdentity: string, track: any) => {
    console.log('🔧 Track unsubscribed:', track.kind, 'for:', participantIdentity);
    setParticipants(prev => {
      const newParticipants = new Map(prev);
      const participantData = newParticipants.get(participantIdentity);

      if (participantData) {
        if (track.kind === 'video') {
          participantData.videoTrack = undefined;
          participantData.isVideoEnabled = false;
        } else if (track.kind === 'audio') {
          participantData.audioTrack = undefined;
          participantData.isAudioEnabled = false;
        }
      }

      return newParticipants;
    });
  }, []);

  const handleTrackEnabled = useCallback((participantIdentity: string, track: any) => {
    console.log('🟢 Track enabled:', track.kind, 'for:', participantIdentity);
    setParticipants(prev => {
      const newParticipants = new Map(prev);
      const participantData = newParticipants.get(participantIdentity);

      if (participantData) {
        if (track.kind === 'video') {
          newParticipants.set(participantIdentity, { ...participantData, isVideoEnabled: true });
        } else if (track.kind === 'audio') {
          newParticipants.set(participantIdentity, { ...participantData, isAudioEnabled: true });
        }
        return new Map(newParticipants);
      }

      return newParticipants;
    });
  }, []);

  const handleTrackDisabled = useCallback((participantIdentity: string, track: any) => {
    console.log('🔴 Track disabled:', track.kind, 'for:', participantIdentity);
    setParticipants(prev => {
      const newParticipants = new Map(prev);
      const participantData = newParticipants.get(participantIdentity);

      if (participantData) {
        if (track.kind === 'video') {
          newParticipants.set(participantIdentity, { ...participantData, isVideoEnabled: false });
        } else if (track.kind === 'audio') {
          newParticipants.set(participantIdentity, { ...participantData, isAudioEnabled: false });
        }
        return new Map(newParticipants);
      }

      return newParticipants;
    });
  }, []);

  // Handle track messages (data track messages)
  const handleTrackMessage = useCallback((message: string, participant: any) => {
    try {
      const data = JSON.parse(message);
      console.log('📨 Received track message:', data, 'from:', participant.identity);

      if (data.type === 'audioMuted') {
        setParticipants(prev => {
          const newParticipants = new Map(prev);
          const participantData = newParticipants.get(participant.identity);
          if (participantData) {
            newParticipants.set(participant.identity, { ...participantData, isAudioEnabled: !data.muted });
          }
          return newParticipants;
        });
      } else if (data.type === 'videoDisabled') {
        setParticipants(prev => {
          const newParticipants = new Map(prev);
          const participantData = newParticipants.get(participant.identity);
          if (participantData) {
            newParticipants.set(participant.identity, { ...participantData, isVideoEnabled: !data.disabled });
          }
          return newParticipants;
        });
      } else if (data.type === 'chatMessage' && onChatMessage) {
        onChatMessage(data, participant.identity);
      } else if (data.type === 'reaction' && onReaction) {
        onReaction(data.emoji, participant.identity);
      } else if (data.type === 'handRaised' && onHandRaised) {
        onHandRaised(data.raised, participant.identity);
      } else if (data.type === 'muteAll' && onMuteAll && !isHost) {
        onMuteAll();
      } else if (data.type === 'kick' && onKick && data.target === participantName) {
        onKick(data.target);
      }
      // Handle other message types like chat, reactions, etc.
      // These will be handled by other hooks/components
    } catch (err) {
      console.error('❌ Error parsing track message:', err);
    }
  }, [onChatMessage, onReaction, onHandRaised, onMuteAll, onKick, isHost, participantName]);

  // Connect to room
  useEffect(() => {
    if (!token || !roomName || isConnected || isConnectingRef.current) {
      console.log('⏭️ Skipping connection:', {
        hasToken: !!token,
        hasRoomName: !!roomName,
        isConnected,
        isConnecting: isConnectingRef.current
      });
      return;
    }

    // Wait for local tracks to be initialized
    if (!tracksReady) {
      console.log('⏳ Waiting for local tracks to initialize...');
      return;
    }

    // Check if we have at least audio OR we're ready to join without any tracks
    const hasAnyTrack = localAudioTrackRef.current || localVideoTrackRef.current;
    console.log('🎧 Track availability:', {
      audio: !!localAudioTrackRef.current,
      video: !!localVideoTrackRef.current,
      hasAny: hasAnyTrack
    });

    const connectToRoom = async () => {
      try {
        console.log('🔌 Connecting to room:', roomName);
        setIsConnecting(true);
        isConnectingRef.current = true;

        // Connect with token and local tracks
        const tracks = [];
        if (localAudioTrackRef.current) tracks.push(localAudioTrackRef.current);
        if (localVideoTrackRef.current) tracks.push(localVideoTrackRef.current);
        
        console.log('📦 Connecting with tracks:', tracks.length, 'tracks');

        const roomInstance = await connect(token, {
          name: roomName,
          tracks: tracks,
          audio: !!localAudioTrackRef.current,
          video: localVideoTrackRef.current ? {
            width: { ideal: 3840, max: 3840 },
            height: { ideal: 2160, max: 2160 },
            frameRate: { ideal: 30, max: 60 },
          } : false,
          bandwidthProfile: {
            video: {
              mode: 'collaboration',
              maxSubscriptionBitrate: 20000000, // 20 Mbps for 4K quality
              dominantSpeakerPriority: 'high',
              maxTracks: 10,
              renderDimensions: {
                high: { width: 3840, height: 2160 },
                standard: { width: 2560, height: 1440 },
                low: { width: 1920, height: 1080 },
              },
            },
          },
          maxAudioBitrate: 64000, // Maximum audio quality
          preferredVideoCodecs: ['VP8', 'H264'],
          networkQuality: { local: 3, remote: 2 },
        });

        if (!isConnectingRef.current) {
          console.log('⚠️ Component unmounted, disconnecting');
          roomInstance.disconnect();
          return;
        }

        console.log('✅ Connected to room successfully');
        console.log('👤 My identity:', roomInstance.localParticipant.identity);
        console.log('👥 Existing participants:', roomInstance.participants.size);

        // Reset reconnection state on successful connection
        setIsReconnecting(false);
        reconnectAttemptsRef.current = 0;
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }

        // Create and publish data track for signaling
        console.log('📡 Creating data track for signaling');
        const dataTrack = new LocalDataTrack();
        
        // Add error handling to data track
        dataTrack.on('error', (error) => {
          console.error('❌ Data track error:', error);
        });
        
        localDataTrackRef.current = dataTrack;
        await roomInstance.localParticipant.publishTrack(dataTrack);
        console.log('📡 Data track published successfully');

        // Verify and log published tracks
        console.log('📋 Published tracks verification:');
        roomInstance.localParticipant.tracks.forEach((publication: any) => {
          console.log(`  - ${publication.kind}: ${publication.trackName} (${publication.trackSid})`);
        });

        // Check if audio/video tracks are actually published
        const hasPublishedAudio = Array.from(roomInstance.localParticipant.audioTracks.values()).length > 0;
        const hasPublishedVideo = Array.from(roomInstance.localParticipant.videoTracks.values()).length > 0;
        
        console.log('📊 Track publication status:', {
          audio: hasPublishedAudio,
          video: hasPublishedVideo,
          audioTracksCount: roomInstance.localParticipant.audioTracks.size,
          videoTracksCount: roomInstance.localParticipant.videoTracks.size
        });

        roomRef.current = roomInstance;
        setRoom(roomInstance);
        setIsConnected(true);

        // Handle existing participants
        roomInstance.participants.forEach(participant => {
          handleParticipantConnected(participant);
        });

        roomInstance.on('participantConnected', handleParticipantConnected);
        roomInstance.on('participantDisconnected', handleParticipantDisconnected);
        roomInstance.on('disconnected', handleDisconnected);

      } catch (err: any) {
        console.error('❌ Error connecting to room:', err);
        if (isConnectingRef.current) {
          setError(err.message || 'Failed to connect to meeting');
          setIsReconnecting(false); // Stop reconnecting on error
        }
      } finally {
        setIsConnecting(false);
        isConnectingRef.current = false;
      }
    };

    connectToRoom();

    return () => {
      console.log('🧹 Cleanup: Disconnecting from room');
      isConnectingRef.current = false;
      if (roomRef.current) {
        roomRef.current.disconnect();
        roomRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [token, roomName, tracksReady, handleParticipantConnected, handleParticipantDisconnected, handleDisconnected]);

  // Toggle audio
  const toggleAudio = useCallback(async () => {
    if (!localAudioTrackRef.current) {
      console.error('❌ No audio track available');
      return;
    }

    try {
      if (isAudioEnabled) {
        localAudioTrackRef.current.disable();
        setIsAudioEnabled(false);
        console.log('✅ Audio muted');

        // Broadcast mute state via data track
        if (localDataTrackRef.current) {
          const dataMessage = JSON.stringify({ type: 'audioMuted', muted: true });
          localDataTrackRef.current.send(dataMessage);
        }
      } else {
        localAudioTrackRef.current.enable();
        setIsAudioEnabled(true);
        console.log('✅ Audio unmuted');

        // Broadcast unmute state via data track
        if (localDataTrackRef.current) {
          const dataMessage = JSON.stringify({ type: 'audioMuted', muted: false });
          localDataTrackRef.current.send(dataMessage);
        }
      }
    } catch (err) {
      console.error('❌ Error toggling audio:', err);
    }
  }, [isAudioEnabled]);

  // Toggle video
  const toggleVideo = useCallback(async () => {
    if (!localVideoTrackRef.current) return;

    if (isVideoEnabled) {
      localVideoTrackRef.current.disable();
      setIsVideoEnabled(false);
      console.log('📹 Video disabled');

      // Broadcast video state via data track
      if (localDataTrackRef.current) {
        const dataMessage = JSON.stringify({ type: 'videoDisabled', disabled: true });
        localDataTrackRef.current.send(dataMessage);
      }
    } else {
      localVideoTrackRef.current.enable();
      setIsVideoEnabled(true);
      console.log('📹 Video enabled');

      // Broadcast video state via data track
      if (localDataTrackRef.current) {
        const dataMessage = JSON.stringify({ type: 'videoDisabled', disabled: false });
        localDataTrackRef.current.send(dataMessage);
      }
    }
  }, [isVideoEnabled]);

  // Disconnect
  const disconnect = useCallback(() => {
    if (roomRef.current) {
      roomRef.current.disconnect();
      roomRef.current = null;
    }
    setRoom(null);
    setIsConnected(false);
    setIsReconnecting(false);
    setParticipants(new Map());
    reconnectAttemptsRef.current = 0;
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  return {
    // Room state
    room,
    isConnected,
    isConnecting,
    isReconnecting,
    error,

    // Participants
    participants,

    // Local tracks
    localAudioTrack: localAudioTrackRef.current,
    localVideoTrack: localVideoTrackRef.current,
    localDataTrack: localDataTrackRef.current,
    tracksReady,

    // Track state
    isAudioEnabled,
    isVideoEnabled,
    isVideoAvailable,
    isAudioAvailable,

    // Actions
    toggleAudio,
    toggleVideo,
    disconnect,
  };
};