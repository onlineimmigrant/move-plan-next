'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { connect, Room, LocalVideoTrack, LocalAudioTrack, RemoteParticipant, RemoteVideoTrack, RemoteAudioTrack, LocalDataTrack } from 'twilio-video';
import { 
  VideoCameraIcon, 
  VideoCameraSlashIcon, 
  MicrophoneIcon, 
  PhoneXMarkIcon, 
  ComputerDesktopIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  MinusIcon,
  XMarkIcon,
  ChevronUpIcon,
  InformationCircleIcon,
  ClipboardDocumentIcon,
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  HandRaisedIcon,
  UserGroupIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  PaperClipIcon,
  ArrowDownTrayIcon,
  SignalIcon,
  FaceSmileIcon,
  StopCircleIcon,
  VideoCameraIcon as VideoCameraIconSolid
} from '@heroicons/react/24/outline';

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
  
  // Debug: Log when local audio state changes
  useEffect(() => {
    console.log('🎚️ LOCAL isAudioEnabled state changed to:', isAudioEnabled);
  }, [isAudioEnabled]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [tracksReady, setTracksReady] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const [isLocalVideoMirrored, setIsLocalVideoMirrored] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'spotlight' | 'sidebar'>('grid');
  const [pinnedParticipant, setPinnedParticipant] = useState<string | null>(null);
  const [showSelfView, setShowSelfView] = useState(true);
  const [showInfoMenu, setShowInfoMenu] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  
  // Chat functionality
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ 
    sender: string; 
    message: string; 
    timestamp: Date; 
    isLocal: boolean;
    type?: 'text' | 'file' | 'reaction';
    fileData?: { name: string; size: number; type: string; url: string };
  }>>(() => {
    // Load chat history from localStorage on mount
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(`chat-history-${roomName}`);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          return parsed.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }));
        } catch (e) {
          console.error('Failed to parse chat history:', e);
        }
      }
    }
    return [];
  });
  const [chatInput, setChatInput] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Recording functionality
  const [isRecording, setIsRecording] = useState(false);
  const [recordingStartTime, setRecordingStartTime] = useState<Date | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  
  // Participant management
  const [isHost, setIsHost] = useState(false);
  const [raisedHands, setRaisedHands] = useState<Set<string>>(new Set());
  const [handRaised, setHandRaised] = useState(false);
  
  // Virtual background
  const [backgroundMode, setBackgroundMode] = useState<'none' | 'blur' | 'color' | 'image'>('none');
  const [backgroundColor, setBackgroundColor] = useState('#1f2937'); // Default gray
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [showBackgroundMenu, setShowBackgroundMenu] = useState(false);
  
  // Background processing refs
  const backgroundCanvasRef = useRef<HTMLCanvasElement>(null);
  const backgroundVideoRef = useRef<HTMLVideoElement>(null);
  const processedVideoRef = useRef<HTMLVideoElement>(null);
  const processedVideoSpotlightRef = useRef<HTMLVideoElement>(null);
  const processedVideoThumbnailRef = useRef<HTMLVideoElement>(null);
  const processedStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const cachedBackgroundImageRef = useRef<HTMLImageElement | null>(null);
  const originalVideoTrackRef = useRef<LocalVideoTrack | null>(null);
  
  // Background processing functions
  const startBackgroundProcessing = async () => {
    console.log('🎬 Starting background processing...');
    if (!backgroundCanvasRef.current || !backgroundVideoRef.current || !localVideoTrackRef.current) {
      console.log('❌ Missing refs:', {
        canvas: !!backgroundCanvasRef.current,
        video: !!backgroundVideoRef.current,
        track: !!localVideoTrackRef.current
      });
      return;
    }

    const video = backgroundVideoRef.current;
    const canvas = backgroundCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('❌ Failed to get canvas context');
      return;
    }

    console.log('✅ Canvas context obtained');

    // Set initial canvas size
    canvas.width = 640;
    canvas.height = 480;

    // Create a stream from the local video track
    const originalStream = new MediaStream([localVideoTrackRef.current.mediaStreamTrack]);

    // Set video source - pause first to avoid interruption errors
    video.pause();
    video.srcObject = originalStream;

    // Wait for video to be ready before playing
    await new Promise((resolve) => {
      const onCanPlay = () => {
        video.removeEventListener('canplay', onCanPlay);
        resolve(void 0);
      };
      video.addEventListener('canplay', onCanPlay);
      
      // Fallback timeout in case canplay doesn't fire
      setTimeout(resolve, 100);
    });

    try {
      await video.play();
      console.log('✅ Background video started playing');
    } catch (error) {
      console.error('❌ Failed to play background video:', error);
      return;
    }

    // Create a MediaStream from the canvas for processed output
    const processedStream = canvas.captureStream(30); // 30 FPS
    processedStreamRef.current = processedStream;
    console.log('✅ Processed stream created with tracks:', processedStream.getVideoTracks().length, processedStream.getAudioTracks().length);

    // Set up processed video elements for display
    const setupVideoElement = (element: HTMLVideoElement | null, name: string) => {
      if (element) {
        element.pause(); // Pause before setting new srcObject to avoid interruption errors
        element.srcObject = processedStream;
        element.addEventListener('play', () => console.log(`▶️ ${name} processed video started playing`));
        element.addEventListener('error', (e) => console.error(`❌ ${name} processed video error:`, e));
        console.log(`✅ ${name} processed video element set`);
      }
    };

    setupVideoElement(processedVideoRef.current, 'Main');
    setupVideoElement(processedVideoSpotlightRef.current, 'Spotlight');
    setupVideoElement(processedVideoThumbnailRef.current, 'Thumbnail');

    // Background processing initialized with simplified blur effect
    console.log('🎨 Background processing initialized with simplified blur effect');

    // Replace the local video track with the processed stream
    if (room) {
      try {
        const processedVideoTrack = new LocalVideoTrack(processedStream.getVideoTracks()[0]);
        console.log('🔄 Unpublishing current track...');
        await room.localParticipant.unpublishTrack(localVideoTrackRef.current);
        console.log('🔄 Publishing processed track...');
        await room.localParticipant.publishTrack(processedVideoTrack);
        localVideoTrackRef.current = processedVideoTrack;
        console.log('✅ Published processed video track to room');
      } catch (error) {
        console.error('❌ Failed to publish processed track:', error);
        return;
      }
    }

    // Start processing frames
    const processFrame = () => {
      if (!video.videoWidth || !video.videoHeight) {
        animationFrameRef.current = requestAnimationFrame(processFrame);
        return;
      }

      // Set canvas size to match video on first frame
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        console.log('📐 Canvas size set to:', canvas.width, 'x', canvas.height);
      }

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Apply background effect
      switch (backgroundMode) {
        case 'blur':
          applyBlurBackground(ctx, canvas, video);
          break;
        case 'color':
          applyColorBackground(ctx, canvas, video);
          break;
        case 'image':
          applyImageBackground(ctx, canvas, video);
          break;
        case 'none':
        default:
          // Just draw the original video
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          break;
      }

      // Debug: Log frame processing (throttled)
      if (Math.random() < 0.01) { // Log ~1% of frames
        console.log('🎬 Frame processed for mode:', backgroundMode);
      }

      animationFrameRef.current = requestAnimationFrame(processFrame);
    };

    console.log('🎬 Starting frame processing loop');
    processFrame();
  };

  const stopBackgroundProcessing = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (processedStreamRef.current) {
      processedStreamRef.current.getTracks().forEach(track => track.stop());
      processedStreamRef.current = null;
    }
  };

  const restoreOriginalVideoTrack = async () => {
    if (!room || !originalVideoTrackRef.current) {
      console.log('❌ Cannot restore original track: room or original track not available');
      return;
    }

    try {
      // Stop any background processing
      stopBackgroundProcessing();

      // If we have a processed track published, unpublish it
      if (localVideoTrackRef.current && localVideoTrackRef.current !== originalVideoTrackRef.current) {
        console.log('🔄 Unpublishing processed track...');
        await room.localParticipant.unpublishTrack(localVideoTrackRef.current);
        console.log('🔄 Publishing original track...');
        await room.localParticipant.publishTrack(originalVideoTrackRef.current);
        localVideoTrackRef.current = originalVideoTrackRef.current;
        console.log('✅ Restored original video track');
      } else {
        console.log('ℹ️ Already using original track');
      }
    } catch (error) {
      console.error('❌ Failed to restore original video track:', error);
    }
  };

  const applyBlurBackground = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, video: HTMLVideoElement) => {
    console.log('🎨 Applying simplified blur background effect');
    // Only draw if video is ready
    if (!video.videoWidth || !video.videoHeight || video.readyState < 2) {
      console.log('🎨 Video not ready for blur effect');
      return;
    }

    // Create a blurred version of the entire video
    ctx.save();
    ctx.filter = 'blur(10px) brightness(0.9)';
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.filter = 'none';
    ctx.restore();

    // Create a radial gradient mask to keep the center (person) sharper
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const maxRadius = Math.sqrt(centerX * centerX + centerY * centerY);

    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, maxRadius);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)'); // Center is mostly transparent (shows blurred)
    gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.4)'); // Middle transition
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0.1)'); // Edges are more opaque (shows more blur)

    // Apply the gradient as a mask
    ctx.globalCompositeOperation = 'destination-in';
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'source-over';

    // Draw the original video on top with reduced opacity in the center
    ctx.globalAlpha = 0.6;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1.0;

    console.log('✅ Simplified blur effect applied');
  };

  const applyColorBackground = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, video: HTMLVideoElement) => {
    console.log('🎨 Applying color background effect:', backgroundColor);
    // Only draw if video is ready
    if (!video.videoWidth || !video.videoHeight || video.readyState < 2) {
      console.log('🎨 Video not ready for color effect');
      // Still fill background even if video isn't ready
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      return;
    }

    // Fill with solid color background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw video on top with proper compositing
    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'source-over'; // Reset
  };

  const applyImageBackground = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, video: HTMLVideoElement) => {
    console.log('🎨 Applying image background effect');
    // Only draw if video is ready
    if (!video.videoWidth || !video.videoHeight || video.readyState < 2) {
      console.log('🎨 Video not ready for image effect');
      // Still try to draw background image if available
      if (cachedBackgroundImageRef.current && cachedBackgroundImageRef.current.complete) {
        const img = cachedBackgroundImageRef.current;
        const imgAspect = img.width / img.height;
        const canvasAspect = canvas.width / canvas.height;

        let drawWidth, drawHeight, drawX, drawY;

        if (imgAspect > canvasAspect) {
          drawHeight = canvas.height;
          drawWidth = canvas.height * imgAspect;
          drawX = (canvas.width - drawWidth) / 2;
          drawY = 0;
        } else {
          drawWidth = canvas.width;
          drawHeight = canvas.width / imgAspect;
          drawX = 0;
          drawY = (canvas.height - drawHeight) / 2;
        }

        ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
      }
      return;
    }

    if (!backgroundImage) {
      // Fallback to color if no image
      applyColorBackground(ctx, canvas, video);
      return;
    }

    // Use cached image if available
    if (cachedBackgroundImageRef.current && cachedBackgroundImageRef.current.src === backgroundImage) {
      const img = cachedBackgroundImageRef.current;
      if (img.complete && img.naturalWidth > 0) {
        // Draw background image (cover mode)
        const imgAspect = img.width / img.height;
        const canvasAspect = canvas.width / canvas.height;
        
        let drawWidth, drawHeight, drawX, drawY;
        
        if (imgAspect > canvasAspect) {
          // Image is wider - fit height
          drawHeight = canvas.height;
          drawWidth = canvas.height * imgAspect;
          drawX = (canvas.width - drawWidth) / 2;
          drawY = 0;
        } else {
          // Image is taller - fit width
          drawWidth = canvas.width;
          drawHeight = canvas.width / imgAspect;
          drawX = 0;
          drawY = (canvas.height - drawHeight) / 2;
        }
        
        // Draw background image
        ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
        
        // Draw video on top
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      } else {
        // Image not loaded yet, draw video only
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      }
    } else {
      // Load and cache new image
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        cachedBackgroundImageRef.current = img;
        console.log('Background image loaded and cached');
      };
      img.onerror = () => {
        console.error('Failed to load background image');
        cachedBackgroundImageRef.current = null;
      };
      img.src = backgroundImage;
      
      // Draw video only while loading
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    }
  };
  
  // Reactions
  const [reactions, setReactions] = useState<Array<{ id: string; emoji: string; x: number; y: number; sender: string }>>([]);
  
  // Settings
  const [videoQuality, setVideoQuality] = useState<'low' | 'medium' | 'high' | 'ultra' | 'maximum'>('maximum');
  const [showSettings, setShowSettings] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  
  // Waiting room (for host)
  const [waitingParticipants, setWaitingParticipants] = useState<Array<{ identity: string; timestamp: Date }>>([]);
  
  // Network stats
  const [networkStats, setNetworkStats] = useState({ quality: 'good', bandwidth: 0 });
  
  // Meeting notes
  const [showNotes, setShowNotes] = useState(false);
  const [meetingNotes, setMeetingNotes] = useState('');
  
  // Picture-in-picture
  const [isPiP, setIsPiP] = useState(false);
  
  // Generate consistent color for each participant
  const getParticipantColor = (sender: string) => {
    const colors = [
      'bg-[rgba(59,130,246,0.15)]',    // Blue
      'bg-[rgba(139,92,246,0.15)]',    // Purple
      'bg-[rgba(236,72,153,0.15)]',    // Pink
      'bg-[rgba(34,197,94,0.15)]',     // Green
      'bg-[rgba(249,115,22,0.15)]',    // Orange
      'bg-[rgba(14,165,233,0.15)]',    // Sky
      'bg-[rgba(168,85,247,0.15)]',    // Violet
      'bg-[rgba(244,63,94,0.15)]',     // Rose
    ];
    
    // Generate consistent index from sender name
    let hash = 0;
    for (let i = 0; i < sender.length; i++) {
      hash = sender.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };
  
  // Window size and position
  const [width, setWidth] = useState(1000);
  const [height, setHeight] = useState(700);
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);
  
  // Store normal size before minimize/fullscreen
  const normalSizeRef = useRef({ width: 1000, height: 700, x: 0, y: 0 });
  
  // Initialize centered position
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (isMobile) {
        setX(0);
        setY(0);
        normalSizeRef.current = { width: window.innerWidth, height: window.innerHeight, x: 0, y: 0 };
      } else {
        const initialX = Math.max(0, (window.innerWidth - 1000) / 2);
        const initialY = Math.max(0, (window.innerHeight - 700) / 2);
        setX(initialX);
        setY(initialY);
        normalSizeRef.current = { width: 1000, height: 700, x: initialX, y: initialY };
      }
    }
  }, [isMobile]);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localVideoRefSpotlight = useRef<HTMLVideoElement>(null);
  const localVideoRefThumbnail = useRef<HTMLVideoElement>(null);
  const localAudioTrackRef = useRef<LocalAudioTrack | null>(null);
  const localVideoTrackRef = useRef<LocalVideoTrack | null>(null);
  const localDataTrackRef = useRef<LocalDataTrack | null>(null);
  const screenTrackRef = useRef<LocalVideoTrack | null>(null);

  // Initialize local tracks
  useEffect(() => {
    const initializeLocalTracks = async () => {
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 48000,
          }
        });
        const audioTrack = new LocalAudioTrack(audioStream.getAudioTracks()[0]);
        
        const videoStream = await navigator.mediaDevices.getUserMedia({ 
          video: {
            width: { ideal: 2560, max: 3840 },
            height: { ideal: 1440, max: 2160 },
            frameRate: { ideal: 30, max: 60 },
            facingMode: 'user',
            aspectRatio: { ideal: 1.7777777778 }, // 16:9
          }
        });
        const videoTrack = new LocalVideoTrack(videoStream.getVideoTracks()[0]);

        localAudioTrackRef.current = audioTrack;
        localVideoTrackRef.current = videoTrack;
        originalVideoTrackRef.current = videoTrack; // Store original track for restoration

        console.log('🎤 Audio track initialized:', audioTrack);
        console.log('🎤 Audio track isEnabled:', audioTrack.isEnabled);
        console.log('🎤 Audio track has enable method:', typeof audioTrack.enable === 'function');
        console.log('🎤 Audio track has disable method:', typeof audioTrack.disable === 'function');

        // Attach local video
        if (localVideoRef.current && videoTrack) {
          videoTrack.attach(localVideoRef.current);
        }
        
        console.log('📹 Video track initialized:', videoTrack.isEnabled);
        
        // Signal that tracks are ready
        setTracksReady(true);
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
      // Data tracks don't have a stop() method, they're just cleaned up on disconnect
      screenTrackRef.current?.stop();
    };
  }, []);

  // Attach local video track to all video elements
  useEffect(() => {
    if (!localVideoTrackRef.current) return;

    const videoTrack = localVideoTrackRef.current;
    const refs = [localVideoRef, localVideoRefSpotlight, localVideoRefThumbnail];

    refs.forEach(ref => {
      if (ref.current) {
        videoTrack.attach(ref.current);
      }
    });

    return () => {
      refs.forEach(ref => {
        if (ref.current) {
          videoTrack.detach(ref.current);
        }
      });
    };
  }, [viewMode, pinnedParticipant, showSelfView]);

  // Poll remote participant track states to detect enabled/disabled changes
  useEffect(() => {
    console.log('🔧 useEffect triggered - isConnected:', isConnected, 'room:', !!room, 'roomName:', room?.name);
    
    if (!isConnected || !room) {
      console.log('⏸️ Polling disabled - connected:', isConnected, 'room:', !!room);
      return;
    }

    console.log('▶️ Starting track state polling for room:', room.name);

    const checkTrackStates = () => {
      // Check room participants directly
      const remoteParticipants = Array.from(room.participants.values());
      console.log('🔍 Checking track states. Room participants:', remoteParticipants.length);
      
      remoteParticipants.forEach(participant => {
        console.log('👤 Remote participant:', participant.identity);
        
        participant.tracks.forEach((publication, key) => {
          console.log('  � Publication:', {
            kind: publication.kind,
            trackName: publication.trackName,
            isSubscribed: publication.isSubscribed,
            isTrackEnabled: publication.isTrackEnabled,
            hasTrack: !!publication.track,
            trackIsEnabled: publication.track?.isEnabled
          });
        });
      });

      setParticipants(prev => {
        let hasChanges = false;
        const newParticipants = new Map(prev);
        
        newParticipants.forEach((participant, identity) => {
          if (participant.audioTrack) {
            const currentEnabled = participant.audioTrack.isEnabled;
            if (currentEnabled !== participant.isAudioEnabled) {
              console.log('🔄 Audio state changed for:', identity, 'from:', participant.isAudioEnabled, 'to:', currentEnabled);
              participant.isAudioEnabled = currentEnabled;
              hasChanges = true;
            }
          }
          
          if (participant.videoTrack) {
            const currentEnabled = participant.videoTrack.isEnabled;
            if (currentEnabled !== participant.isVideoEnabled) {
              console.log('🔄 Video state changed for:', identity, 'from:', participant.isVideoEnabled, 'to:', currentEnabled);
              participant.isVideoEnabled = currentEnabled;
              hasChanges = true;
            }
          }
        });
        
        if (hasChanges) {
          console.log('✅ Track states changed, triggering re-render');
        }
        
        return hasChanges ? new Map(newParticipants) : prev;
      });
    };

    // Initial check
    checkTrackStates();

    // Check every 1 second
    const interval = setInterval(checkTrackStates, 1000);
    
    return () => {
      console.log('⏹️ Stopping track state polling');
      clearInterval(interval);
    };
  }, [isConnected, room]); // room object reference should trigger when setRoom is called

  // Mobile detection and responsive behavior
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768; // md breakpoint
      setIsMobile(mobile);
      if (mobile && !isFullscreen && !isMinimized) {
        setIsFullscreen(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close info menu when clicking outside
  useEffect(() => {
    if (!showInfoMenu) return;
    
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-info-menu]')) {
        setShowInfoMenu(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showInfoMenu]);

  // Connect to room - use ref to prevent multiple connections
  const isConnectingRef = useRef(false);
  const roomRef = useRef<Room | null>(null);

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
    if (!tracksReady || !localAudioTrackRef.current || !localVideoTrackRef.current) {
      console.log('⏳ Waiting for local tracks to initialize...', {
        tracksReady,
        hasAudio: !!localAudioTrackRef.current,
        hasVideo: !!localVideoTrackRef.current
      });
      return;
    }

    let isMounted = true;
    isConnectingRef.current = true;

    const connectToRoom = async () => {
      try {
        console.log('🔌 Connecting to room:', roomName);
        console.log('🎫 Token (first 30 chars):', token.substring(0, 30) + '...');
        console.log('🎤 Local audio track ready:', !!localAudioTrackRef.current);
        console.log('📹 Local video track ready:', !!localVideoTrackRef.current);
        
        // Connect with token and local tracks
        const roomInstance = await connect(token, {
          name: roomName,
          tracks: [localAudioTrackRef.current!, localVideoTrackRef.current!],
          audio: true,
          video: {
            width: { ideal: 3840, max: 3840 },
            height: { ideal: 2160, max: 2160 },
            frameRate: { ideal: 30, max: 60 },
          },
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

        if (!isMounted) {
          console.log('⚠️ Component unmounted, disconnecting');
          roomInstance.disconnect();
          return;
        }

        console.log('✅ Connected to room successfully');
        console.log('👤 My identity:', roomInstance.localParticipant.identity);
        console.log('👥 Existing participants:', roomInstance.participants.size);
        console.log('📤 My published tracks:', roomInstance.localParticipant.tracks.size);
        
        // Log what tracks were published
        roomInstance.localParticipant.tracks.forEach((publication, key) => {
          console.log('📤 Published track:', publication.trackName, 'kind:', publication.kind);
        });

        // If tracks weren't published during connect, publish them now
        if (localAudioTrackRef.current && !Array.from(roomInstance.localParticipant.audioTracks.values()).length) {
          console.log('📤 Publishing audio track after connection');
          await roomInstance.localParticipant.publishTrack(localAudioTrackRef.current);
        }
        if (localVideoTrackRef.current && !Array.from(roomInstance.localParticipant.videoTracks.values()).length) {
          console.log('📤 Publishing video track after connection');
          await roomInstance.localParticipant.publishTrack(localVideoTrackRef.current);
        }
        
        // Create and publish data track for signaling mute/unmute state
        console.log('📡 Creating data track for mute state signaling');
        const dataTrack = new LocalDataTrack();
        localDataTrackRef.current = dataTrack;
        await roomInstance.localParticipant.publishTrack(dataTrack);
        console.log('📡 Data track published successfully - ID:', dataTrack.id, 'name:', dataTrack.name);
        console.log('✅ Data track ready for messaging - participants can now send files');
        
        console.log('📤 Final published tracks:', roomInstance.localParticipant.tracks.size);

        roomRef.current = roomInstance;
        setRoom(roomInstance);
        setIsConnected(true);
        console.log('✅ Room and connection state set - room:', roomInstance.name, 'connected: true');

        // Handle existing participants
        roomInstance.participants.forEach(participant => {
          console.log('👤 Existing participant:', participant.identity);
          handleParticipantConnected(participant);
        });

        // Set up event listeners
        roomInstance.on('participantConnected', (participant) => {
          console.log('➕ Participant joined:', participant.identity);
          handleParticipantConnected(participant);
        });
        roomInstance.on('participantDisconnected', (participant) => {
          console.log('➖ Participant left:', participant.identity);
          handleParticipantDisconnected(participant);
        });
        roomInstance.on('disconnected', (room) => {
          console.log('🔌 Room disconnected:', room.name);
          handleDisconnected();
        });

      } catch (err: any) {
        console.error('❌ Error connecting to room:', err);
        console.error('Error code:', err.code);
        console.error('Error message:', err.message);
        if (isMounted) {
          setError(err.message || 'Failed to connect to meeting');
        }
      } finally {
        isConnectingRef.current = false;
      }
    };

    connectToRoom();

    return () => {
      console.log('🧹 Cleanup: Disconnecting from room');
      isMounted = false;
      isConnectingRef.current = false;
      if (roomRef.current) {
        roomRef.current.disconnect();
        roomRef.current = null;
      }
    };
  }, [token, roomName, tracksReady]);

  const handleParticipantConnected = useCallback((participant: RemoteParticipant) => {
    console.log('👤 Participant connected:', participant.identity);
    console.log('📦 Publications count:', participant.tracks.size);
    
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
        
        // All track handling (including data tracks) is done via handleTrackSubscribed
        handleTrackSubscribed(participant.identity, track);
      }

      // Listen to publication enabled/disabled events (this is the correct way)
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
      
      // Handle data track for mute/unmute signaling
      if (track.kind === 'data') {
        console.log('📡 Data track subscribed for:', participant.identity);
        const dataTrack = track as any; // DataTrack type
        dataTrack.on('message', (data: string) => {
          try {
            const message = JSON.parse(data);
            console.log('📨 Received data message from:', participant.identity, message.type, message);
            
            // Ignore messages from ourselves
            if (roomRef.current && participant.identity === roomRef.current.localParticipant.identity) {
              console.log('⚠️ Ignoring data message from self');
              return;
            }
            
            if (message.type === 'audioMuted') {
              const myIdentity = roomRef.current?.localParticipant.identity;
              console.log('🔍 Processing audioMuted message:', {
                from: participant.identity,
                myIdentity: myIdentity,
                muted: message.muted,
                willIgnore: participant.identity === myIdentity
              });
              
              setParticipants(prev => {
                const newParticipants = new Map(prev);
                const participantData = newParticipants.get(participant.identity);
                if (participantData) {
                  newParticipants.set(participant.identity, { ...participantData, isAudioEnabled: !message.muted });
                  console.log('🔄 Updated audio state for:', participant.identity, 'to:', !message.muted);
                  return new Map(newParticipants);
                }
                console.log('⚠️ No participant data found for:', participant.identity);
                return prev;
              });
            } else if (message.type === 'chatMessage') {
              console.log('💬 Received chat message from:', participant.identity);
              setChatMessages(prev => [...prev, {
                sender: participant.identity,
                message: message.text,
                timestamp: new Date(),
                isLocal: false,
                type: 'text'
              }]);
              
              // Increment unread count if chat is closed
              if (!showChat) {
                setUnreadCount(prev => prev + 1);
              }
            } else if (message.type === 'chatMessage' && message.fileData) {
              console.log('📎 Received file via chat:', message.fileData.name);
              
              // Add file to chat
              const fileMessage = {
                sender: participant.identity,
                message: message.text,
                timestamp: new Date(),
                isLocal: false,
                type: 'file' as const,
                fileData: {
                  name: message.fileData.name,
                  size: message.fileData.size,
                  type: message.fileData.type,
                  url: message.fileData.data
                }
              };
              
              setChatMessages(prev => {
                console.log('📎 Adding received file to chat');
                return [...prev, fileMessage];
              });
              
              if (!showChat) {
                setUnreadCount(prev => prev + 1);
              }
            } else if (message.type === 'reaction') {
              const id = Math.random().toString(36);
              setReactions(prev => [...prev, {
                id,
                emoji: message.emoji,
                x: Math.random() * 80 + 10,
                y: Math.random() * 60 + 20,
                sender: participant.identity
              }]);
              
              setTimeout(() => {
                setReactions(prev => prev.filter(r => r.id !== id));
              }, 3000);
            } else if (message.type === 'handRaised') {
              const id = Math.random().toString(36);
              setReactions(prev => [...prev, {
                id,
                emoji: message.emoji,
                x: Math.random() * 80 + 10,
                y: Math.random() * 60 + 20,
                sender: participant.identity
              }]);
              
              setTimeout(() => {
                setReactions(prev => prev.filter(r => r.id !== id));
              }, 3000);
            } else if (message.type === 'handRaised') {
              setRaisedHands(prev => {
                const newSet = new Set(prev);
                if (message.raised) {
                  newSet.add(participant.identity);
                } else {
                  newSet.delete(participant.identity);
                }
                return newSet;
              });
            } else if (message.type === 'muteAll' && !isHost) {
              if (localAudioTrackRef.current && isAudioEnabled) {
                localAudioTrackRef.current.disable();
                setIsAudioEnabled(false);
              }
            } else if (message.type === 'kick') {
              if (message.target === roomRef.current?.localParticipant.identity) {
                onLeave();
              }
            } else if (message.type === 'requestChatHistory') {
              // Someone joined and wants chat history - send it to them
              console.log('📜 Sending chat history to:', participant.identity);
              if (localDataTrackRef.current && chatMessages.length > 0) {
                const historyMessage = {
                  type: 'chatHistory',
                  messages: chatMessages.map(msg => ({
                    sender: msg.sender,
                    message: msg.message,
                    timestamp: msg.timestamp.toISOString(),
                    isLocal: false, // All received history is treated as non-local
                    type: msg.type,
                    fileData: msg.fileData // Preserve file data with base64
                  }))
                };
                localDataTrackRef.current.send(JSON.stringify(historyMessage));
              }
            } else if (message.type === 'chatHistory') {
              // Received chat history from existing participant
              console.log('📜 Received chat history:', message.messages?.length, 'messages');
              if (message.messages && Array.isArray(message.messages)) {
                setChatMessages(prevMessages => {
                  // Merge with existing messages, avoid duplicates
                  const existingTimestamps = new Set(prevMessages.map(m => m.timestamp.getTime()));
                  const newMessages = message.messages
                    .map((msg: any) => ({
                      sender: msg.sender,
                      message: msg.message,
                      timestamp: new Date(msg.timestamp),
                      isLocal: false,
                      type: msg.type,
                      fileData: msg.fileData // Preserve file data
                    }))
                    .filter((msg: any) => !existingTimestamps.has(msg.timestamp.getTime()));
                  
                  return [...prevMessages, ...newMessages].sort((a, b) => 
                    a.timestamp.getTime() - b.timestamp.getTime()
                  );
                });
              }
            }
          } catch (err) {
            console.error('❌ Error parsing data message:', err);
          }
        });
        return; // Don't process data tracks as regular tracks
      }
      
      handleTrackSubscribed(participant.identity, track);
    });

    participant.on('trackUnsubscribed', (track) => {
      console.log('➖ Track unsubscribed:', track.kind, 'for:', participant.identity);
      handleTrackUnsubscribed(participant.identity, track);
    });
  }, []);

  const handleTrackSubscribed = useCallback((participantIdentity: string, track: any) => {
    console.log('🔧 Processing track:', track.kind, 'for:', participantIdentity, 'isEnabled:', track.isEnabled, 'trackId:', track.id);

    setParticipants(prev => {
      const newParticipants = new Map(prev);
      let participantData = newParticipants.get(participantIdentity);

      // Initialize participant if they don't exist yet
      if (!participantData) {
        console.log('👤 Initializing participant data for:', participantIdentity);
        participantData = {
          identity: participantIdentity,
          isVideoEnabled: false,
          isAudioEnabled: true, // Default to enabled until we know otherwise
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
        console.log('📡 Data track subscribed for:', participantIdentity, 'trackId:', track.id);
        console.log('📡 Setting up message handler for data track from:', participantIdentity);

        // Set up message handler for data track
        const dataTrack = track as any;
        dataTrack.on('message', (data: string) => {
          console.log('📨 RAW data received from:', participantIdentity, 'data length:', data.length);
          try {
            const message = JSON.parse(data);
            console.log('📨 PARSED message from:', participantIdentity, 'type:', message.type, 'content:', message);

            // Handle different message types
            if (message.type === 'chatMessage') {
              console.log('💬 Processing chat message from:', participantIdentity, 'text:', message.text);
              setChatMessages(prev => {
                console.log('💬 Adding chat message to UI, current count:', prev.length);
                return [...prev, {
                  sender: participantIdentity,
                  message: message.text,
                  timestamp: new Date(),
                  isLocal: false,
                  type: 'text'
                }];
              });

              // Increment unread count if chat is closed
              if (!showChat) {
                setUnreadCount(prev => prev + 1);
              }
            } else if (message.type === 'chatMessage' && message.fileData) {
              console.log('📎 Processing file message from:', participantIdentity, 'file:', message.fileData.name);
              console.log('📎 File details:', message.fileData);

              // Add file to chat
              const fileMessage = {
                sender: participantIdentity,
                message: message.text,
                timestamp: new Date(),
                isLocal: false,
                type: 'file' as const,
                fileData: {
                  name: message.fileData.name,
                  size: message.fileData.size,
                  type: message.fileData.type,
                  url: message.fileData.data
                }
              };

              setChatMessages(prev => {
                console.log('📎 Adding file message to UI, current count:', prev.length);
                return [...prev, fileMessage];
              });

              if (!showChat) {
                setUnreadCount(prev => prev + 1);
              }
            } else if (message.type === 'reaction') {
              console.log('😊 Processing reaction from:', participantIdentity);
              const id = Math.random().toString(36);
              setReactions(prev => [...prev, {
                id,
                emoji: message.emoji,
                x: Math.random() * 80 + 10,
                y: Math.random() * 60 + 20,
                sender: participantIdentity
              }]);

              setTimeout(() => {
                setReactions(prev => prev.filter(r => r.id !== id));
              }, 3000);
            } else if (message.type === 'handRaised') {
              console.log('✋ Processing hand raised from:', participantIdentity);
              setRaisedHands(prev => {
                const newSet = new Set(prev);
                if (message.raised) {
                  newSet.add(participantIdentity);
                } else {
                  newSet.delete(participantIdentity);
                }
                return newSet;
              });
            } else {
              console.log('❓ Unknown message type:', message.type, 'from:', participantIdentity);
            }
          } catch (error) {
            console.error('❌ Error parsing data message from:', participantIdentity, 'error:', error, 'raw data:', data);
          }
        });

        console.log('📡 Message handler successfully set up for data track from:', participantIdentity);
      }

      return newParticipants;
    });
  }, [showChat]);

  const handleTrackUnsubscribed = useCallback((participantIdentity: string, track: any) => {
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
    console.log('🟢 handleTrackEnabled called for:', participantIdentity, 'track:', track.kind);
    setParticipants(prev => {
      const newParticipants = new Map(prev);
      const participantData = newParticipants.get(participantIdentity);
      
      if (participantData) {
        if (track.kind === 'video') {
          newParticipants.set(participantIdentity, { ...participantData, isVideoEnabled: true });
          console.log('✅ Video enabled for:', participantIdentity);
        } else if (track.kind === 'audio') {
          newParticipants.set(participantIdentity, { ...participantData, isAudioEnabled: true });
          console.log('✅ Audio enabled for:', participantIdentity);
        }
        // Return new map to trigger re-render
        return new Map(newParticipants);
      }
      
      return newParticipants;
    });
  }, []);

  const handleTrackDisabled = useCallback((participantIdentity: string, track: any) => {
    console.log('🔴 handleTrackDisabled called for:', participantIdentity, 'track:', track.kind);
    setParticipants(prev => {
      const newParticipants = new Map(prev);
      const participantData = newParticipants.get(participantIdentity);
      
      if (participantData) {
        if (track.kind === 'video') {
          newParticipants.set(participantIdentity, { ...participantData, isVideoEnabled: false });
          console.log('❌ Video disabled for:', participantIdentity);
        } else if (track.kind === 'audio') {
          newParticipants.set(participantIdentity, { ...participantData, isAudioEnabled: false });
          console.log('❌ Audio disabled for:', participantIdentity);
        }
        // Return new map to trigger re-render
        return new Map(newParticipants);
      }
      
      return newParticipants;
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
    console.log('🔌 Handling disconnection - resetting state');
    setIsConnected(false);
    setRoom(null);
    setParticipants(new Map());
    onLeave();
  }, [onLeave]);

  const toggleVideo = async () => {
    if (!localVideoTrackRef.current) return;

    if (isVideoEnabled) {
      localVideoTrackRef.current.disable();
      setIsVideoEnabled(false);
      console.log('📹 Video disabled');
    } else {
      localVideoTrackRef.current.enable();
      setIsVideoEnabled(true);
      console.log('📹 Video enabled');
    }
  };

  const toggleAudio = async () => {
    if (!localAudioTrackRef.current) {
      console.error('❌ No audio track available');
      return;
    }

    console.log('🎤 Toggling audio. Current state:', isAudioEnabled);
    console.log('🎤 Audio track:', localAudioTrackRef.current);
    console.log('🎤 Track isEnabled:', localAudioTrackRef.current.isEnabled);

    try {
      if (isAudioEnabled) {
        localAudioTrackRef.current.disable();
        setIsAudioEnabled(false);
        console.log('✅ Audio muted. Track isEnabled:', localAudioTrackRef.current.isEnabled);
        
        // Broadcast mute state to other participants via data track
        if (localDataTrackRef.current) {
          const dataMessage = JSON.stringify({ type: 'audioMuted', muted: true });
          localDataTrackRef.current.send(dataMessage);
          console.log('📡 Sent mute signal to other participants');
        } else {
          console.warn('⚠️ Data track not available');
        }
      } else {
        localAudioTrackRef.current.enable();
        setIsAudioEnabled(true);
        console.log('✅ Audio unmuted. Track isEnabled:', localAudioTrackRef.current.isEnabled);
        
        // Broadcast unmute state to other participants via data track
        if (localDataTrackRef.current) {
          const dataMessage = JSON.stringify({ type: 'audioMuted', muted: false });
          localDataTrackRef.current.send(dataMessage);
          console.log('📡 Sent unmute signal to other participants');
        } else {
          console.warn('⚠️ Data track not available');
        }
      }
    } catch (err) {
      console.error('❌ Error toggling audio:', err);
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

  const sendChatMessage = () => {
    if (!chatInput.trim() || !localDataTrackRef.current) {
      console.log('❌ Cannot send message: input empty or no data track');
      return;
    }

    console.log('📤 Attempting to send chat message:', chatInput.trim());
    const message = {
      type: 'chatMessage',
      text: chatInput.trim()
    };

    try {
      localDataTrackRef.current.send(JSON.stringify(message));
      console.log('✅ Chat message sent successfully via data track');

      // Add to local chat
      setChatMessages(prev => {
        console.log('💬 Adding message to local chat, current count:', prev.length);
        return [...prev, {
          sender: participantName || 'You',
          message: chatInput.trim(),
          timestamp: new Date(),
          isLocal: true,
          type: 'text'
        }];
      });

      setChatInput('');
    } catch (err) {
      console.error('❌ Error sending chat message:', err);
      alert('Failed to send message. Please try again.');
    }
  };
  
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Limit file size to 500KB for reliable delivery
    if (file.size > 500 * 1024) {
      alert('File size must be less than 500KB for sharing.');
      return;
    }

    // Convert file to base64
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      console.log('📎 File converted to base64, length:', base64.length);

      // Send file via chat message (simpler approach)
      const message = {
        type: 'chatMessage',
        text: `Shared file: ${file.name}`,
        fileData: {
          name: file.name,
          size: file.size,
          type: file.type,
          data: base64
        }
      };

      // Send to all participants via data track
      if (localDataTrackRef.current) {
        try {
          localDataTrackRef.current.send(JSON.stringify(message));
          console.log('📎 ✅ File message sent successfully via data track:', file.name, 'size:', message.fileData.data.length);
        } catch (err) {
          console.error('❌ Error sending file:', err);
          alert('Failed to send file. Please try again.');
          return;
        }
      } else {
        console.error('❌ No data track available for sending file');
        alert('Cannot send file - data track not available');
        return;
      }

      // Add to local chat immediately
      const localMessage = {
        sender: participantName || 'You',
        message: `Shared file: ${file.name}`,
        timestamp: new Date(),
        isLocal: true,
        type: 'file' as const,
        fileData: { name: file.name, size: file.size, type: file.type, url: base64 }
      };

      setChatMessages(prev => {
        console.log('📎 Adding file to local chat');
        return [...prev, localMessage];
      });
    };
    reader.readAsDataURL(file);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const sendReaction = (emoji: string) => {
    if (!localDataTrackRef.current) return;
    
    const message = {
      type: 'reaction',
      emoji
    };
    
    localDataTrackRef.current.send(JSON.stringify(message));
    
    // Show reaction locally
    const id = Math.random().toString(36);
    setReactions(prev => [...prev, {
      id,
      emoji,
      x: Math.random() * 80 + 10,
      y: Math.random() * 60 + 20,
      sender: participantName || 'You'
    }]);
    
    setTimeout(() => {
      setReactions(prev => prev.filter(r => r.id !== id));
    }, 3000);
  };
  
  const toggleHandRaise = () => {
    if (!localDataTrackRef.current) return;
    
    const newState = !handRaised;
    setHandRaised(newState);
    
    const message = {
      type: 'handRaised',
      raised: newState
    };
    
    localDataTrackRef.current.send(JSON.stringify(message));
  };
  
  const startRecording = async () => {
    try {
      if (!room) return;
      
      // Get all tracks
      const audioTracks: MediaStreamTrack[] = [];
      const videoTracks: MediaStreamTrack[] = [];
      
      // Local tracks
      if (localAudioTrackRef.current) {
        audioTracks.push(localAudioTrackRef.current.mediaStreamTrack);
      }
      if (localVideoTrackRef.current) {
        videoTracks.push(localVideoTrackRef.current.mediaStreamTrack);
      }
      
      // Create combined stream
      const combinedStream = new MediaStream([...audioTracks, ...videoTracks]);
      
      const recorder = new MediaRecorder(combinedStream, {
        mimeType: 'video/webm;codecs=vp9,opus'
      });
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };
      
      recorder.start(1000);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingStartTime(new Date());
      console.log('🔴 Recording started');
    } catch (err) {
      console.error('Error starting recording:', err);
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setRecordingStartTime(null);
      
      setTimeout(() => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `meeting-${roomName}-${new Date().toISOString()}.webm`;
        a.click();
        recordedChunksRef.current = [];
        console.log('✅ Recording saved');
      }, 1000);
    }
  };
  
  const togglePictureInPicture = async () => {
    try {
      if (localVideoRef.current) {
        if (!document.pictureInPictureElement) {
          await localVideoRef.current.requestPictureInPicture();
          setIsPiP(true);
        } else {
          await document.exitPictureInPicture();
          setIsPiP(false);
        }
      }
    } catch (err) {
      console.error('PiP error:', err);
    }
  };
  
  const getMaxSupportedVideoConstraints = async (): Promise<MediaTrackConstraints> => {
    const resolutions = [
      { width: 3840, height: 2160, frameRate: 30 }, // 4K
      { width: 2560, height: 1440, frameRate: 30 }, // 1440p
      { width: 1920, height: 1080, frameRate: 30 }, // 1080p
      { width: 1280, height: 720, frameRate: 30 }   // 720p fallback
    ];

    for (const resolution of resolutions) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: resolution
        });
        stream.getTracks().forEach(track => track.stop()); // Clean up

        // If we get here, the resolution is supported
        return resolution;
      } catch (error) {
        console.log(`Resolution ${resolution.width}x${resolution.height} not supported, trying next...`);
        continue;
      }
    }

    // Fallback to 720p if nothing else works
    return { width: 1280, height: 720, frameRate: 30 };
  };
  
  const changeVideoQuality = async (quality: 'low' | 'medium' | 'high' | 'ultra' | 'maximum') => {
    setVideoQuality(quality);
    // Apply quality settings
    if (localVideoTrackRef.current) {
      let constraints: MediaTrackConstraints;

      if (quality === 'maximum') {
        // Detect maximum supported resolution
        try {
          const maxConstraints = await getMaxSupportedVideoConstraints();
          constraints = maxConstraints;
          console.log('Using maximum supported resolution:', maxConstraints);
        } catch (error) {
          console.warn('Failed to detect maximum resolution, falling back to ultra:', error);
          constraints = { width: 1920, height: 1080, frameRate: 30 };
        }
      } else {
        const qualityConstraints = {
          low: { width: 320, height: 240, frameRate: 15 },
          medium: { width: 640, height: 480, frameRate: 24 },
          high: { width: 1280, height: 720, frameRate: 30 },
          ultra: { width: 1920, height: 1080, frameRate: 30 }
        };
        constraints = qualityConstraints[quality];
      }

      try {
        await localVideoTrackRef.current.mediaStreamTrack.applyConstraints(constraints);
        console.log('Video quality changed to:', quality, 'with constraints:', constraints);
      } catch (error) {
        console.error('Failed to apply video constraints:', error);
        // Fallback to a lower quality if the requested quality is not supported
        if (quality === 'ultra' || quality === 'maximum') {
          try {
            await localVideoTrackRef.current.mediaStreamTrack.applyConstraints({ width: 1280, height: 720, frameRate: 30 });
            console.log('Fallback to high quality (720p)');
          } catch (fallbackError) {
            console.error('Fallback also failed:', fallbackError);
          }
        }
      }
    }
  };
  
  const muteAllParticipants = () => {
    if (!isHost || !localDataTrackRef.current) return;
    
    const message = {
      type: 'muteAll'
    };
    
    localDataTrackRef.current.send(JSON.stringify(message));
    console.log('🔇 Muted all participants');
  };
  
  const kickParticipant = (identity: string) => {
    if (!isHost || !localDataTrackRef.current) return;
    
    const message = {
      type: 'kick',
      target: identity
    };
    
    localDataTrackRef.current.send(JSON.stringify(message));
    console.log('👢 Kicked participant:', identity);
  };
  
  const toggleChat = () => {
    setShowChat(!showChat);
    if (!showChat) {
      setUnreadCount(0);
    }
  };
  
  // Save chat history to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined' && chatMessages.length > 0) {
      localStorage.setItem(`chat-history-${roomName}`, JSON.stringify(chatMessages));
    }
  }, [chatMessages, roomName]);
  
  // Request chat history when joining room
  useEffect(() => {
    if (isConnected && localDataTrackRef.current) {
      // Wait a bit for others to connect
      const timer = setTimeout(() => {
        if (localDataTrackRef.current) {
          const message = {
            type: 'requestChatHistory',
            requester: participantName || 'Anonymous'
          };
          localDataTrackRef.current.send(JSON.stringify(message));
          console.log('📜 Requested chat history');
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isConnected, participantName]);
  
  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Handle background mode changes
  useEffect(() => {
    console.log('🎨 Background mode changed to:', backgroundMode, 'Color:', backgroundColor, 'Image:', backgroundImage);
    console.log('🎨 Current room state:', !!room, 'Local track:', !!localVideoTrackRef.current);

    const applyBackgroundEffect = async () => {
      if (!localVideoTrackRef.current) {
        console.log('❌ No local video track available');
        return;
      }

      if (!room) {
        console.log('❌ No room connection available');
        return;
      }

      try {
        // Stop any existing processing
        stopBackgroundProcessing();

        if (backgroundMode === 'none') {
          // Restore original video track
          console.log('🔄 Background effect: None - restoring original track');
          await restoreOriginalVideoTrack();
          return;
        }

        // For any background effect, we need to process the video
        console.log('🚀 Starting background processing for mode:', backgroundMode);
        await startBackgroundProcessing();

      } catch (error) {
        console.error('❌ Failed to apply background effect:', error);
      }
    };

    applyBackgroundEffect();

    // Cleanup on unmount
    return () => {
      console.log('🧹 Cleaning up background processing');
      stopBackgroundProcessing();
    };
  }, [backgroundMode, backgroundColor, backgroundImage, room]); // Added room dependency

  const leaveCall = () => {
    if (room) {
      room.disconnect();
    }
    onLeave();
  };

  // Copy to clipboard helper
  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      // Save current state (but only if not minimized)
      if (!isMinimized) {
        normalSizeRef.current = { width, height, x, y };
      }
      // Go fullscreen
      setWidth(window.innerWidth);
      setHeight(window.innerHeight);
      setX(0);
      setY(0);
      setIsFullscreen(true);
      setIsMinimized(false);
    } else {
      // Restore normal state
      setWidth(normalSizeRef.current.width);
      setHeight(normalSizeRef.current.height);
      setX(normalSizeRef.current.x);
      setY(normalSizeRef.current.y);
      setIsFullscreen(false);
    }
  };

  const toggleMinimize = () => {
    if (!isMinimized) {
      // Save current state (but only if not fullscreen)
      if (!isFullscreen) {
        normalSizeRef.current = { width, height, x, y };
      }
      // Go minimized (bottom-right corner)
      setWidth(350);
      setHeight(60);
      setX(window.innerWidth - 370);
      setY(window.innerHeight - 80);
      setIsMinimized(true);
      setIsFullscreen(false);
    } else {
      // Restore normal state
      setWidth(normalSizeRef.current.width);
      setHeight(normalSizeRef.current.height);
      setX(normalSizeRef.current.x);
      setY(normalSizeRef.current.y);
      setIsMinimized(false);
    }
  };

  // Handle dragging
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0, initialX: 0, initialY: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isFullscreen || isMinimized || isMobile) return;
    
    const target = e.target as HTMLElement;
    if (!target.closest('.drag-handle')) return;
    
    isDraggingRef.current = true;
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      initialX: x,
      initialY: y
    };
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      
      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaY = e.clientY - dragStartRef.current.y;
      
      setX(dragStartRef.current.initialX + deltaX);
      setY(dragStartRef.current.initialY + deltaY);
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    if (isDraggingRef.current) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  if (error) {
    return (
      <div
        className="shadow-2xl rounded-lg overflow-hidden fixed bg-red-50"
        style={{ 
          zIndex: 9999,
          left: window.innerWidth / 2 - 200,
          top: window.innerHeight / 2 - 150,
          width: 400,
          height: 300
        }}
      >
        <div className="flex items-center justify-center h-full">
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
      </div>
    );
  }

  return (
    <div
      className={`shadow-2xl ${isMobile ? 'fixed inset-0' : 'fixed'}`}
      style={{ 
        zIndex: 9999,
        width: isMobile ? '100vw' : (isFullscreen ? '100vw' : isMinimized ? 350 : width),
        height: isMobile ? '100vh' : (isFullscreen ? '100vh' : isMinimized ? 60 : height),
        left: isMobile ? 0 : x,
        top: isMobile ? 0 : y,
        cursor: (isDraggingRef.current && !isMobile) ? 'grabbing' : 'default'
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="flex flex-col h-full bg-gray-900 text-white">
        {/* Header - Draggable */}
        <div className={`drag-handle flex items-center justify-between bg-gray-800 ${isMobile ? 'cursor-default' : 'cursor-move'} ${isMinimized ? 'p-2' : isMobile ? 'px-6 py-4' : 'px-4 py-3'}`}>
          <div className="flex items-center gap-3">
            {/* Window Control Buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={leaveCall}
                className={`${isMobile ? 'p-2' : 'p-1.5'} hover:bg-red-600 rounded transition-colors flex-shrink-0`}
                title="Leave call"
              >
                <XMarkIcon className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'}`} />
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMinimize();
                }}
                className={`${isMobile ? 'p-2' : 'p-1.5'} hover:bg-gray-700 rounded transition-colors flex-shrink-0`}
                title={isMinimized ? "Restore" : "Minimize"}
              >
                {isMinimized ? (
                  <ChevronUpIcon className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'}`} />
                ) : (
                  <MinusIcon className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'}`} />
                )}
              </button>
              
              {!isMobile && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFullscreen();
                  }}
                  className="p-1.5 hover:bg-gray-700 rounded transition-colors flex-shrink-0"
                  title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                >
                  {isFullscreen ? (
                    <ArrowsPointingInIcon className="w-4 h-4" />
                  ) : (
                    <ArrowsPointingOutIcon className="w-4 h-4" />
                  )}
                </button>
              )}
            </div>
            
            {!isMinimized && (
              <>
                <div className="h-5 w-px bg-gray-600" />
                
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`} />
                  <div>
                    <h2 className="text-sm font-medium">Video Call</h2>
                    <div className="text-xs text-gray-400">
                      {participants.size + 1} participant{participants.size !== 0 ? 's' : ''}
                    </div>
                  </div>
                </div>
              </>
            )}
            {isMinimized && (
              <div className="text-sm font-medium truncate ml-2">Video Call • {participants.size + 1}</div>
            )}
          </div>
          
          {!isMinimized && (
            <div className="flex items-center gap-2">
              {/* Layout Switcher */}
              {participants.size > 0 && !isMobile && (
                <div className="flex items-center gap-1 bg-gray-700/50 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded transition-all ${viewMode === 'grid' ? 'bg-blue-600 shadow-lg' : 'hover:bg-gray-600'}`}
                    title="Grid view"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewMode('spotlight')}
                    className={`p-1.5 rounded transition-all ${viewMode === 'spotlight' ? 'bg-blue-600 shadow-lg' : 'hover:bg-gray-600'}`}
                    title="Spotlight view"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewMode('sidebar')}
                    className={`p-1.5 rounded transition-all ${viewMode === 'sidebar' ? 'bg-blue-600 shadow-lg' : 'hover:bg-gray-600'}`}
                    title="Sidebar view"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7" />
                    </svg>
                  </button>
                </div>
              )}
              
              {/* Info Menu */}
              <div className="relative" data-info-menu>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowInfoMenu(!showInfoMenu);
                  }}
                  className={`${isMobile ? 'p-3' : 'p-2'} rounded-lg transition-all ${showInfoMenu ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
                  title="Meeting info"
                >
                  <InformationCircleIcon className={`${isMobile ? 'w-6 h-6' : 'w-5 h-5'}`} />
                </button>
                
                {showInfoMenu && (
                  <div className={`absolute right-0 mt-2 ${isMobile ? 'w-80' : 'w-72'} bg-gray-800 rounded-lg shadow-2xl border border-gray-700 z-50 overflow-hidden`}>
                    <div className="px-4 py-3 bg-gray-700/50 border-b border-gray-600">
                      <h3 className="text-sm font-semibold">Meeting Information</h3>
                    </div>
                    <div className="p-3 space-y-3">
                      {/* Meeting ID */}
                      <div>
                        <label className="text-xs text-gray-400 block mb-1">Meeting ID</label>
                        <div className="flex items-center gap-2 bg-gray-700/50 rounded px-3 py-2">
                          <code className="text-xs flex-1 font-mono text-gray-200">{roomName}</code>
                          <button
                            onClick={() => copyToClipboard(roomName, 'roomName')}
                            className="p-1 hover:bg-gray-600 rounded transition-colors"
                            title="Copy meeting ID"
                          >
                            {copiedField === 'roomName' ? (
                              <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <ClipboardDocumentIcon className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                      
                      {/* Your Name */}
                      {participantName && (
                        <div>
                          <label className="text-xs text-gray-400 block mb-1">Your Name</label>
                          <div className="flex items-center gap-2 bg-gray-700/50 rounded px-3 py-2">
                            <span className="text-xs flex-1 text-gray-200">{participantName}</span>
                            <button
                              onClick={() => copyToClipboard(participantName, 'participantName')}
                              className="p-1 hover:bg-gray-600 rounded transition-colors"
                              title="Copy your name"
                            >
                              {copiedField === 'participantName' ? (
                                <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              ) : (
                                <ClipboardDocumentIcon className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                      
                      {/* Connection Status */}
                      <div>
                        <label className="text-xs text-gray-400 block mb-1">Status</label>
                        <div className="flex items-center gap-2 bg-gray-700/50 rounded px-3 py-2">
                          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`} />
                          <span className="text-xs text-gray-200">{isConnected ? 'Connected' : 'Connecting...'}</span>
                        </div>
                      </div>
                      
                      {/* Participants */}
                      <div>
                        <label className="text-xs text-gray-400 block mb-1">Participants</label>
                        <div className="bg-gray-700/50 rounded px-3 py-2">
                          <span className="text-xs text-gray-200">{participants.size + 1} in call</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Video Grid - Hidden when minimized but DOM kept */}
        <div 
          className="flex-1 overflow-auto"
          style={{ display: isMinimized ? 'none' : 'flex' }}
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
                  onClick={() => setIsLocalVideoMirrored(!isLocalVideoMirrored)}
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
                  isFullscreen={isFullscreen}
                  onPin={() => {
                    setPinnedParticipant(participant.identity);
                    setViewMode('spotlight');
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
                    onPin={() => setPinnedParticipant(null)}
                    isPinned={true}
                  />
                ) : (
                  // Show local video as main when no participant is pinned
                  <div className="w-full h-full relative bg-gray-800 rounded-lg overflow-hidden group">
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
                      onClick={() => setIsLocalVideoMirrored(!isLocalVideoMirrored)}
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
              <div className={`flex ${viewMode === 'sidebar' ? 'flex-col w-64 gap-3' : 'flex-row gap-3 absolute bottom-4 left-4 right-4'} overflow-auto`}>
                {/* Local Video Thumbnail - only show if someone else is pinned */}
                {showSelfView && pinnedParticipant && (
                  <div 
                    className="relative bg-gray-800 overflow-hidden rounded-lg group flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all" 
                    style={{ aspectRatio: '16/9', height: viewMode === 'sidebar' ? 'auto' : '120px' }}
                    onClick={() => setPinnedParticipant(null)}
                  >
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
                        setShowSelfView(false);
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
                      onClick={() => setPinnedParticipant(participant.identity)}
                    >
                      <RemoteParticipantVideo
                        participant={participant}
                        isFullscreen={false}
                        onPin={() => setPinnedParticipant(participant.identity)}
                      />
                    </div>
                  ))}
              </div>

              {/* Show self view button if hidden */}
              {!showSelfView && (viewMode === 'spotlight' || viewMode === 'sidebar') && (
                <button
                  onClick={() => setShowSelfView(true)}
                  className="absolute bottom-4 left-4 p-2 bg-gray-800 hover:bg-gray-700 rounded-full transition-colors"
                  title="Show self view"
                >
                  <VideoCameraIcon className="w-5 h-5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Controls - Hidden when minimized */}
        {!isMinimized && (
          <div className={`flex items-center justify-center ${isMobile ? 'space-x-6 p-6' : 'space-x-4 p-4'} bg-gray-800`}>
          <button
            onClick={toggleVideo}
            className={`${isMobile ? 'p-4' : 'p-3'} rounded-full ${isVideoEnabled ? 'bg-gray-600 hover:bg-gray-500' : 'bg-red-600 hover:bg-red-500'}`}
          >
            {isVideoEnabled ? (
              <VideoCameraIcon className={`${isMobile ? 'w-7 h-7' : 'w-6 h-6'}`} />
            ) : (
              <VideoCameraSlashIcon className={`${isMobile ? 'w-7 h-7' : 'w-6 h-6'}`} />
            )}
          </button>

          <button
            onClick={toggleAudio}
            className={`${isMobile ? 'p-4' : 'p-3'} rounded-full ${isAudioEnabled ? 'bg-gray-600 hover:bg-gray-500' : 'bg-red-600 hover:bg-red-500'}`}
          >
            {isAudioEnabled ? (
              <MicrophoneIcon className={`${isMobile ? 'w-7 h-7' : 'w-6 h-6'}`} />
            ) : (
              <MicrophoneIcon className={`${isMobile ? 'w-7 h-7' : 'w-6 h-6'} opacity-50`} />
            )}
          </button>

          <button
            onClick={toggleScreenShare}
            className={`${isMobile ? 'p-4' : 'p-3'} rounded-full ${isScreenSharing ? 'bg-blue-600 hover:bg-blue-500' : 'bg-gray-600 hover:bg-gray-500'}`}
          >
            <ComputerDesktopIcon className={`${isMobile ? 'w-7 h-7' : 'w-6 h-6'}`} />
          </button>
          
          <button
            onClick={toggleChat}
            className={`${isMobile ? 'p-4' : 'p-3'} rounded-full relative ${showChat ? 'bg-blue-600 hover:bg-blue-500' : 'bg-gray-600 hover:bg-gray-500'}`}
          >
            <ChatBubbleLeftRightIcon className={`${isMobile ? 'w-7 h-7' : 'w-6 h-6'}`} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-white/10 text-gray-100 text-[10px] font-medium rounded-full w-4 h-4 flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          
          {!isMobile && (
            <>
              <button
                onClick={toggleHandRaise}
                className={`p-3 rounded-full ${handRaised ? 'bg-yellow-600 hover:bg-yellow-500' : 'bg-gray-600 hover:bg-gray-500'}`}
                title={handRaised ? "Lower hand" : "Raise hand"}
              >
                <HandRaisedIcon className="w-6 h-6" />
              </button>
              
              <button
                onClick={() => setShowParticipants(!showParticipants)}
                className={`p-3 rounded-full relative ${showParticipants ? 'bg-blue-600 hover:bg-blue-500' : 'bg-gray-600 hover:bg-gray-500'}`}
                title="Participants"
              >
                <UserGroupIcon className="w-6 h-6" />
                {raisedHands.size > 0 && (
                  <span className="absolute -top-1 -right-1 bg-yellow-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {raisedHands.size}
                  </span>
                )}
              </button>
              
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`p-3 rounded-full ${isRecording ? 'bg-red-600 hover:bg-red-500 animate-pulse' : 'bg-gray-600 hover:bg-gray-500'}`}
                title={isRecording ? "Stop recording" : "Start recording"}
              >
                {isRecording ? (
                  <StopCircleIcon className="w-6 h-6" />
                ) : (
                  <VideoCameraIconSolid className="w-6 h-6" />
                )}
              </button>
              
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`p-3 rounded-full ${showSettings ? 'bg-blue-600 hover:bg-blue-500' : 'bg-gray-600 hover:bg-gray-500'}`}
                title="Settings"
              >
                <Cog6ToothIcon className="w-6 h-6" />
              </button>
              
              <button
                onClick={() => setShowNotes(!showNotes)}
                className={`p-3 rounded-full ${showNotes ? 'bg-blue-600 hover:bg-blue-500' : 'bg-gray-600 hover:bg-gray-500'}`}
                title="Meeting notes"
              >
                <DocumentTextIcon className="w-6 h-6" />
              </button>
            </>
          )}

          <button
            onClick={leaveCall}
            className={`${isMobile ? 'p-4' : 'p-3'} rounded-full bg-red-600 hover:bg-red-500`}
          >
            <PhoneXMarkIcon className={`${isMobile ? 'w-7 h-7' : 'w-6 h-6'}`} />
          </button>
        </div>
        )}
      </div>
      
      {/* Reactions Overlay */}
      {reactions.map(reaction => (
        <div
          key={reaction.id}
          className="absolute text-6xl animate-bounce pointer-events-none z-50"
          style={{
            left: `${reaction.x}%`,
            top: `${reaction.y}%`,
            animation: 'float-up 3s ease-out forwards'
          }}
        >
          {reaction.emoji}
        </div>
      ))}
      
      {/* Reaction Buttons */}
      {!isMinimized && !isMobile && (
        <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 bg-gray-800/90 backdrop-blur-sm rounded-full px-4 py-2 flex gap-2 z-40">
          {['👍', '❤️', '😂', '👏', '🎉'].map(emoji => (
            <button
              key={emoji}
              onClick={() => sendReaction(emoji)}
              className="text-2xl hover:scale-125 transition-transform"
              title={`Send ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
      
      {/* Chat Panel */}
      {showChat && (
        <div className={`absolute ${isMobile ? 'inset-0' : 'right-4 top-20 bottom-20'} ${isMobile ? 'w-full h-full' : 'w-80'} bg-gray-800 rounded-lg shadow-2xl border border-gray-700 flex flex-col z-50`}>
          {/* Chat Header */}
          <div className="flex items-center justify-between p-3 border-b border-gray-700">
            <h3 className="text-sm font-medium text-gray-100">Chat</h3>
            <button
              onClick={toggleChat}
              className="p-1 hover:bg-gray-700 rounded transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
          
          {/* Chat Messages */}
          <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-3 space-y-3">
            {chatMessages.length === 0 ? (
              <div className="text-center text-gray-400 mt-8">
                <ChatBubbleLeftRightIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No messages yet</p>
              </div>
            ) : (
              chatMessages.map((msg, index) => {
                const bubbleColor = msg.isLocal 
                  ? 'bg-[rgba(59,130,246,0.18)]' 
                  : getParticipantColor(msg.sender);
                
                return (
                  <div
                    key={`${msg.timestamp.getTime()}-${index}`}
                    className={`flex ${msg.isLocal ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] ${bubbleColor} rounded-lg p-2`}>
                      <div className="text-[12px] text-gray-300 mb-1 font-medium">
                        {msg.sender}
                      </div>
                    {msg.type === 'file' && msg.fileData ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-200">
                          <PaperClipIcon className="w-4 h-4 text-gray-300" />
                          <span className="font-medium">{msg.fileData.name}</span>
                        </div>
                        <div className="text-xs text-gray-400">
                          {(msg.fileData.size / 1024).toFixed(2)} KB
                        </div>
                        {msg.fileData.type.startsWith('image/') && (
                          <img 
                            src={msg.fileData.url} 
                            alt={msg.fileData.name}
                            className="max-w-full rounded cursor-pointer hover:opacity-90"
                            onClick={() => window.open(msg.fileData!.url, '_blank')}
                          />
                        )}
                        {msg.fileData.type === 'application/pdf' && (
                          <iframe
                            src={msg.fileData.url}
                            className="w-full h-64 rounded bg-white/3"
                            title={msg.fileData.name}
                          />
                        )}
                        <a
                          href={msg.fileData.url}
                          download={msg.fileData.name}
                          className="flex items-center gap-2 text-xs text-blue-300 hover:text-blue-200"
                        >
                          <ArrowDownTrayIcon className="w-4 h-4" />
                          Download
                        </a>
                      </div>
                    ) : (
                      <div className="text-sm break-words text-gray-200">
                        {msg.message}
                      </div>
                    )}
                    <div className="text-[10px] text-gray-400 mt-1">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
                );
              })
            )}
          </div>
          
          {/* Chat Input */}
          <div className="p-4 border-t border-gray-700">
            <div className="flex gap-2 mb-2">
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                className="hidden"
                accept="image/*,application/pdf,.doc,.docx,.txt"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 bg-gray-700/80 hover:bg-gray-600 rounded-lg transition-colors"
                title="Attach file"
              >
                <PaperClipIcon className="w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  const emoji = prompt('Enter emoji:');
                  if (emoji) sendReaction(emoji);
                }}
                className="p-2 bg-gray-700/80 hover:bg-gray-600 rounded-lg transition-colors"
                title="Send reaction"
              >
                <FaceSmileIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendChatMessage();
                  }
                }}
                placeholder="Type a message..."
                className="flex-1 bg-gray-700/80 text-gray-100 text-sm rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={sendChatMessage}
                disabled={!chatInput.trim()}
                className="p-2 bg-blue-600/95 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
                title="Send message"
              >
                <PaperAirplaneIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Participants Panel */}
      {showParticipants && !isMobile && (
        <div className="absolute right-4 top-20 w-80 max-h-96 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 z-50 overflow-auto">
          <div className="p-5 border-b border-gray-100">
            <h3 className="text-xl font-light text-gray-800 tracking-wide">Participants</h3>
            <p className="text-sm text-gray-500 mt-1">{participants.size + 1} in meeting</p>
          </div>
          <div className="p-4 space-y-3">
            {/* Local participant */}
            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center shadow-sm">
                  <span className="text-xs font-medium text-white">You</span>
                </div>
                <span className="text-sm font-medium text-gray-700">{participantName || 'You'} {isHost && <span className="text-blue-600 font-normal">(Host)</span>}</span>
              </div>
              <div className="flex gap-2">
                {!isAudioEnabled && <MicrophoneIcon className="w-4 h-4 text-red-400" />}
                {!isVideoEnabled && <VideoCameraSlashIcon className="w-4 h-4 text-red-400" />}
                {handRaised && <HandRaisedIcon className="w-4 h-4 text-amber-500" />}
              </div>
            </div>
            
            {/* Remote participants */}
            {Array.from(participants.values()).map((participant) => (
              <div key={participant.identity} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-gradient-to-br from-gray-300 to-gray-500 rounded-full flex items-center justify-center shadow-sm">
                    <span className="text-xs font-medium text-white">{participant.identity.charAt(0).toUpperCase()}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-700">{participant.identity}</span>
                </div>
                <div className="flex gap-2">
                  {!participant.isAudioEnabled && <MicrophoneIcon className="w-4 h-4 text-red-400" />}
                  {!participant.isVideoEnabled && <VideoCameraSlashIcon className="w-4 h-4 text-red-400" />}
                  {raisedHands.has(participant.identity) && <HandRaisedIcon className="w-4 h-4 text-amber-500" />}
                  {isHost && (
                    <button
                      onClick={() => kickParticipant(participant.identity)}
                      className="ml-2 text-xs text-red-400 hover:text-red-500 transition-colors duration-200 font-medium"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          {isHost && (
            <div className="p-4 border-t border-gray-100">
              <button
                onClick={muteAllParticipants}
                className="w-full py-2.5 bg-gradient-to-r from-red-400 to-red-500 hover:from-red-500 hover:to-red-600 rounded-lg text-sm font-medium text-white shadow-sm transition-all duration-200 hover:shadow-md"
              >
                Mute All Participants
              </button>
            </div>
          )}
        </div>
      )}
      
      {/* Settings Panel */}
      {showSettings && !isMobile && (
        <div className="absolute right-4 top-20 w-80 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 z-50">
          <div className="p-5 border-b border-gray-100">
            <h3 className="text-xl font-light text-gray-800 tracking-wide">Settings</h3>
          </div>
          <div className="p-5 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Video Quality</label>
              <select
                value={videoQuality}
                onChange={(e) => changeVideoQuality(e.target.value as 'low' | 'medium' | 'high' | 'ultra' | 'maximum')}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              >
                <option value="low">Low (240p)</option>
                <option value="medium">Medium (480p)</option>
                <option value="high">High (720p)</option>
                <option value="ultra">Ultra (1080p)</option>
                <option value="maximum">Maximum (Auto-detect)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Background</label>
              <div className="space-y-3">
                {/* Debug info */}
                {backgroundMode !== 'none' && (
                  <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                    Active: {backgroundMode}
                    {backgroundMode === 'color' && ` - ${backgroundColor}`}
                  </div>
                )}
                
                {/* Background Mode Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setBackgroundMode('none')}
                    className={`py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                      backgroundMode === 'none'
                        ? 'bg-blue-500 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    None
                  </button>
                  <button
                    onClick={() => setBackgroundMode('blur')}
                    className={`py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                      backgroundMode === 'blur'
                        ? 'bg-blue-500 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Blur
                  </button>
                  <button
                    onClick={() => setBackgroundMode('color')}
                    className={`py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                      backgroundMode === 'color'
                        ? 'bg-blue-500 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Color
                  </button>
                  <button
                    onClick={() => setBackgroundMode('image')}
                    className={`py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                      backgroundMode === 'image'
                        ? 'bg-blue-500 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Image
                  </button>
                </div>

                {/* Color Picker */}
                {backgroundMode === 'color' && (
                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-gray-600">Choose Background Color</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={backgroundColor}
                        onChange={(e) => setBackgroundColor(e.target.value)}
                        className="w-12 h-8 rounded border border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={backgroundColor}
                        onChange={(e) => setBackgroundColor(e.target.value)}
                        className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="#000000"
                      />
                    </div>
                    <div className="grid grid-cols-6 gap-2">
                      {[
                        '#1f2937', '#374151', '#4b5563', '#6b7280',
                        '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
                        '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
                      ].map((color) => (
                        <button
                          key={color}
                          onClick={() => setBackgroundColor(color)}
                          className={`w-8 h-8 rounded-full border-2 transition-all duration-200 ${
                            backgroundColor === color ? 'border-blue-500 scale-110' : 'border-gray-300 hover:scale-105'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Image Upload */}
                {backgroundMode === 'image' && (
                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-gray-600">Upload Background Image</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                      {backgroundImage ? (
                        <div className="space-y-2">
                          <img
                            src={backgroundImage}
                            alt="Background preview"
                            className="max-w-full max-h-20 mx-auto rounded"
                          />
                          <button
                            onClick={() => setBackgroundImage(null)}
                            className="text-xs text-red-500 hover:text-red-700"
                          >
                            Remove Image
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="text-gray-400">
                            <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <p className="text-sm text-gray-500">Click to upload or drag and drop</p>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (e) => {
                                  setBackgroundImage(e.target?.result as string);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      Recommended: 1920x1080 or higher for best quality
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Network Quality</span>
              <div className="flex items-center gap-2">
                <SignalIcon className="w-5 h-5 text-green-500" />
                <span className="text-sm font-medium text-green-600">{networkStats.quality}</span>
              </div>
            </div>
            
            <button
              onClick={togglePictureInPicture}
              className="w-full py-2.5 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 rounded-lg text-sm font-medium text-gray-700 shadow-sm transition-all duration-200 hover:shadow-md border border-gray-200"
            >
              {isPiP ? 'Exit' : 'Enable'} Picture-in-Picture
            </button>
          </div>
        </div>
      )}
      
      {/* Meeting Notes Panel */}
      {showNotes && !isMobile && (
        <div className="absolute left-4 top-20 bottom-20 w-80 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 flex flex-col z-50">
          <div className="p-5 border-b border-gray-100">
            <h3 className="text-xl font-light text-gray-800 tracking-wide">Meeting Notes</h3>
          </div>
          <textarea
            value={meetingNotes}
            onChange={(e) => setMeetingNotes(e.target.value)}
            placeholder="Take notes during the meeting..."
            className="flex-1 p-5 bg-gray-50 text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white rounded-b-xl transition-all duration-200 text-sm leading-relaxed"
          />
          <div className="p-4 border-t border-gray-100 flex gap-3">
            <button
              onClick={() => {
                const blob = new Blob([meetingNotes], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `meeting-notes-${roomName}-${new Date().toISOString()}.txt`;
                a.click();
              }}
              className="flex-1 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-lg text-sm font-medium text-white shadow-sm transition-all duration-200 hover:shadow-md"
            >
              Download Notes
            </button>
            <button
              onClick={() => setMeetingNotes('')}
              className="flex-1 py-2.5 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 rounded-lg text-sm font-medium text-gray-700 shadow-sm transition-all duration-200 hover:shadow-md border border-gray-200"
            >
              Clear All
            </button>
          </div>
        </div>
      )}
      
      {/* Recording Indicator */}
      {isRecording && recordingStartTime && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-600 px-4 py-2 rounded-full flex items-center gap-2 z-50">
          <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
          <span className="text-sm font-medium">
            Recording {Math.floor((new Date().getTime() - recordingStartTime.getTime()) / 1000)}s
          </span>
        </div>
      )}
    </div>
  );
}

// Component for remote participant video
interface RemoteParticipantVideoProps {
  participant: Participant;
  isFullscreen?: boolean;
  onPin?: () => void;
  isPinned?: boolean;
}

function RemoteParticipantVideo({ participant, isFullscreen = false, onPin, isPinned = false }: RemoteParticipantVideoProps) {
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

