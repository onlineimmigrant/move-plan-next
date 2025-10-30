'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Room, LocalVideoTrack, LocalAudioTrack, RemoteParticipant, RemoteVideoTrack, RemoteAudioTrack, LocalDataTrack } from 'twilio-video';
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
import { useTwilioRoom } from './hooks/useTwilioRoom';
import { useChat } from './hooks/useChat';
import { useBackgroundProcessing } from './hooks/useBackgroundProcessing';
import { useRecording } from './hooks/useRecording';
import { useVideoCallUI } from './hooks/useVideoCallUI';
import { useParticipantManagement } from './hooks/useParticipantManagement';
import { useSettings } from './hooks/useSettings';
import { useTranscription } from './hooks/useTranscription';
import { useMeetingAIModels } from './hooks/useMeetingAIModels';
import { useAIAnalysis } from './hooks/useAIAnalysis';
import RemoteParticipantVideo from './components/RemoteParticipantVideo';
import ChatPanel from './components/ChatPanel';
import ParticipantsPanel from './components/ParticipantsPanel';
import SettingsPanel from './components/SettingsPanel';
import MeetingNotesPanel from './components/MeetingNotesPanel';
import InfoMenu from './components/InfoMenu';
import VideoCallHeader from './components/VideoCallHeader';
import VideoLayout from './components/VideoLayout';
import VideoControls from './components/VideoControls';
import ReactionPanel from './components/ReactionPanel';
import RecordingIndicator from './components/RecordingIndicator';
import MinimizedVideoCallButton from './components/MinimizedVideoCallButton';
import WaitingRoomControls from '../WaitingRoom/WaitingRoomControls';
import TranscriptionPanel from './components/TranscriptionPanel';
import AIAnalysisPanel from './components/AIAnalysisPanel';
import { usePanelManagement } from './hooks/usePanelManagement';

interface VideoCallProps {
  token: string;
  roomName: string;
  onLeave: () => void;
  participantName?: string;
  meetingTitle?: string;
  userIsHost?: boolean;
}

interface Participant {
  identity: string;
  videoTrack?: RemoteVideoTrack;
  audioTrack?: RemoteAudioTrack;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
}

export default function VideoCallModal({ token, roomName, onLeave, participantName, meetingTitle, userIsHost = false }: VideoCallProps) {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentOrgId, setCurrentOrgId] = useState<string | null>(null);

  // Get current user ID for waiting room
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setCurrentUserId(user.id);
          
          // Get user's organization
          const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single();
          
          if (profile) {
            setCurrentOrgId(profile.organization_id);
          }
        }
      } catch (error) {
        console.error('Error fetching current user:', error);
      }
    };
    
    fetchCurrentUser();
  }, []);

  // Use the Twilio room hook
  const {
    room,
    isConnected,
    isConnecting,
    isReconnecting,
    error: roomError,
    participants,
    localAudioTrack,
    localVideoTrack,
    localDataTrack,
    tracksReady,
    isAudioEnabled,
    isVideoEnabled,
    isVideoAvailable,
    isAudioAvailable,
    toggleAudio,
    toggleVideo,
    disconnect,
  } = useTwilioRoom(token, roomName, participantName || 'You', false, // TODO: Pass isHost when available
    // Chat message handler
    (data: any, sender: string) => {
      console.log('💬 Received chat message:', data, 'from:', sender, 'local participant:', participantName || 'You');
      
      // Skip messages from ourselves to avoid duplicates
      const localParticipantName = participantName || 'You';
      console.log('🔍 Checking sender:', sender, 'vs local:', localParticipantName, 'data.sender:', data.sender, 'match:', sender === localParticipantName);
      if (sender === localParticipantName) {
        console.log('📝 Skipping own message to avoid duplicate - sender match');
        return;
      }
      
      const newMessage = {
        id: data.id || Math.random().toString(36).substr(2, 9),
        sender: data.sender || sender,
        message: data.text,
        timestamp: new Date(),
        isLocal: false,
        type: data.fileData ? ('file' as const) : ('text' as const),
        fileData: data.fileData ? {
          name: data.fileData.name,
          size: data.fileData.size,
          type: data.fileData.type,
          url: data.fileData.data ? `data:${data.fileData.type};base64,${data.fileData.data}` : ''
        } : undefined
      };
      console.log('📝 Created message object:', newMessage);
      addChatMessage(newMessage);
    },
    // Reaction handler
    (emoji: string, sender: string) => {
      const id = Math.random().toString(36);
      setReactions((prev: any) => [...prev, {
        id,
        emoji,
        x: Math.random() * 80 + 10,
        y: Math.random() * 60 + 20,
        sender
      }]);
      
      setTimeout(() => {
        setReactions((prev: any) => prev.filter((r: any) => r.id !== id));
      }, 3000);
    },
    // Hand raised handler
    (raised: boolean, sender: string) => {
      setRaisedHands((prev: Set<string>) => {
        const newSet = new Set(prev);
        if (raised) {
          newSet.add(sender);
        } else {
          newSet.delete(sender);
        }
        return newSet;
      });
    },
    // Mute all handler
    () => {
      if (!isHost) {
        toggleAudio();
      }
    },
    // Kick handler
    (target: string) => {
      if (target === participantName) {
        leaveCall();
      }
    }
  );

  // Use the chat hook
  const {
    showChat,
    chatMessages,
    chatInput,
    unreadCount,
    chatContainerRef,
    fileInputRef,
    toggleChat,
    sendChatMessage,
    handleFileSelect,
    addChatMessage,
    setChatInput,
  } = useChat(roomName, participantName || 'You', localDataTrack, isConnected);

  // Use the background processing hook
  const {
    backgroundMode,
    backgroundColor,
    backgroundImage,
    showBackgroundMenu,
    setBackgroundMode,
    setBackgroundColor,
    setBackgroundImage,
    setShowBackgroundMenu,
    startBackgroundProcessing,
    stopBackgroundProcessing,
    restoreOriginalVideoTrack,
    applyBlurBackground,
    applyColorBackground,
    applyImageBackground,
    backgroundCanvasRef,
    backgroundVideoRef,
    processedVideoRef,
    processedVideoSpotlightRef,
    processedVideoThumbnailRef,
    processedStreamRef,
    animationFrameRef,
    cachedBackgroundImageRef,
    originalVideoTrackRef,
  } = useBackgroundProcessing(room, localVideoTrack);

  // Use the UI hook
  const {
    isFullscreen,
    isMinimized,
    isMobile,
    viewMode,
    pinnedParticipant,
    showSelfView,
    showInfoMenu,
    copiedField,
    width,
    height,
    x,
    y,
    isLocalVideoMirrored,
    setIsFullscreen,
    setIsMinimized,
    setViewMode,
    setPinnedParticipant,
    setShowSelfView,
    setShowInfoMenu,
    setCopiedField,
    setWidth,
    setHeight,
    setX,
    setY,
    setIsLocalVideoMirrored,
    toggleFullscreen,
    toggleMinimized,
    getParticipantColor,
  } = useVideoCallUI();

  // Use the recording hook
  const {
    isRecording,
    recordingStartTime,
    startRecording,
    stopRecording,
  } = useRecording();
  
  // Attach local video track to video elements
  useEffect(() => {
    if (!localVideoTrack) {
      console.log('📹 No local video track available to attach');
      return;
    }

    let retryCount = 0;
    const maxRetries = 10; // Try for 1 second total
    
    const attemptAttach = () => {
      console.log(`📹 Attempting to attach video (attempt ${retryCount + 1}/${maxRetries})`);
      console.log('📹 Track state:', {
        kind: localVideoTrack.kind,
        id: localVideoTrack.id,
        enabled: localVideoTrack.isEnabled,
        started: localVideoTrack.mediaStreamTrack?.readyState,
        mediaStreamTrack: !!localVideoTrack.mediaStreamTrack
      });
      
      const videoTrack = localVideoTrack;
      const refs = [
        { ref: localVideoRef, name: 'grid' },
        { ref: localVideoRefSpotlight, name: 'spotlight' },
        { ref: localVideoRefThumbnail, name: 'thumbnail' }
      ];

      let attachedCount = 0;
      refs.forEach(({ ref, name }) => {
        if (ref.current) {
          console.log(`📹 Attaching video track to ${name} ref`);
          
          // Detach first to avoid duplicates
          try {
            videoTrack.detach(ref.current);
          } catch (e) {
            // Ignore detach errors
          }
          
          try {
            const attachedElement = videoTrack.attach(ref.current);
            
            // Force video element to play
            if (attachedElement instanceof HTMLVideoElement) {
              attachedElement.play().catch(e => {
                console.warn(`⚠️ Failed to play video on ${name}:`, e);
              });
            }
            
            console.log(`✅ Track attached to ${name}:`, {
              hasSrcObject: !!attachedElement?.srcObject,
              videoWidth: (attachedElement as HTMLVideoElement)?.videoWidth,
              videoHeight: (attachedElement as HTMLVideoElement)?.videoHeight,
              paused: (attachedElement as HTMLVideoElement)?.paused,
              readyState: (attachedElement as HTMLVideoElement)?.readyState
            });
            
            attachedCount++;
          } catch (e) {
            console.error(`❌ Failed to attach to ${name}:`, e);
          }
        } else {
          console.log(`⏳ ${name} ref not ready yet`);
        }
      });
      
      console.log(`📹 Successfully attached to ${attachedCount}/${refs.length} video elements`);
      
      // If no refs were ready and we have retries left, try again
      if (attachedCount === 0 && retryCount < maxRetries) {
        retryCount++;
        setTimeout(attemptAttach, 100);
      } else if (attachedCount > 0) {
        console.log('✅ Video attachment complete!');
      } else {
        console.warn('⚠️ Could not attach video to any refs after all retries');
      }
    };

    // Start attempting after a short delay
    const timer = setTimeout(attemptAttach, 100);

    return () => {
      clearTimeout(timer);
      const refs = [localVideoRef, localVideoRefSpotlight, localVideoRefThumbnail];
      refs.forEach(ref => {
        if (ref.current) {
          try {
            localVideoTrack.detach(ref.current);
          } catch (e) {
            // Ignore detach errors on cleanup
          }
        }
      });
    };
  }, [localVideoTrack, viewMode, pinnedParticipant, showSelfView, isMinimized, isConnected]);
  
  // Use the participant management hook
  const {
    isHost,
    raisedHands,
    handRaised,
    reactions,
    waitingParticipants,
    setIsHost,
    setRaisedHands,
    setHandRaised,
    setReactions,
    setWaitingParticipants,
    sendReaction,
    toggleHandRaise,
    muteAllParticipants,
    kickParticipant,
  } = useParticipantManagement();

  // Use the settings hook
  const {
    videoQuality,
    showSettings,
    showParticipants,
    networkStats,
    isPiP,
    setVideoQuality,
    setShowSettings,
    setShowParticipants,
    setNetworkStats,
    setIsPiP,
    changeVideoQuality,
    togglePictureInPicture,
    startNetworkMonitoring,
    stopNetworkMonitoring
  } = useSettings();

  // Use the panel management hook
  const panelManagement = usePanelManagement();

  // Use transcription hook
  const {
    isTranscribing,
    transcript,
    error: transcriptionError,
    startTranscription,
    stopTranscription,
    clearTranscript,
  } = useTranscription(room, localAudioTrack, isConnected, participantName || 'You');

  // Use AI models hook
  const {
    models: aiModels,
    loading: aiModelsLoading,
    error: aiModelsError,
    selectedModel,
    setSelectedModel,
  } = useMeetingAIModels(currentOrgId);

  // Use AI analysis hook
  const {
    isAnalyzing,
    analysisResult,
    error: analysisError,
    analyzeConversation,
    clearAnalysis,
  } = useAIAnalysis();

  // Video element refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localVideoRefSpotlight = useRef<HTMLVideoElement>(null);
  const localVideoRefThumbnail = useRef<HTMLVideoElement>(null);
  const screenTrackRef = useRef<LocalVideoTrack | null>(null);

  // Start network monitoring when connected
  useEffect(() => {
    if (isConnected && room) {
      console.log('🌐 Starting network monitoring');
      const cleanup = startNetworkMonitoring(room);
      return cleanup;
    }
  }, [isConnected, room, startNetworkMonitoring]);

  // Stop network monitoring when disconnected
  useEffect(() => {
    if (!isConnected) {
      console.log('🌐 Stopping network monitoring');
      stopNetworkMonitoring();
    }
  }, [isConnected, stopNetworkMonitoring]);

  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNotes, setShowNotes] = useState(false);
  const [meetingNotes, setMeetingNotes] = useState('');
  const [showTranscription, setShowTranscription] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);

  // Register panels when they become visible
  useEffect(() => {
    if (showSettings) {
      panelManagement.registerPanel('settings', { x: 16, y: 80 });
    }
  }, [showSettings]);

  useEffect(() => {
    if (showParticipants) {
      panelManagement.registerPanel('participants', { x: 336, y: 120 });
    }
  }, [showParticipants]);

  useEffect(() => {
    if (showInfoMenu) {
      panelManagement.registerPanel('info', { x: 656, y: 160 });
    }
  }, [showInfoMenu]);

  useEffect(() => {
    if (showNotes) {
      panelManagement.registerPanel('notes', { x: 16, y: 200 });
    }
  }, [showNotes]);

  useEffect(() => {
    if (showChat) {
      panelManagement.registerPanel('chat', { x: 336, y: 240 });
    }
  }, [showChat]);

  useEffect(() => {
    if (showTranscription) {
      panelManagement.registerPanel('transcription', { x: 16, y: 280 });
    }
  }, [showTranscription]);

  useEffect(() => {
    if (showAnalysis) {
      panelManagement.registerPanel('analysis', { x: 432, y: 280 });
    }
  }, [showAnalysis]);

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

  // Toggle transcription
  const toggleTranscription = async () => {
    if (isTranscribing) {
      stopTranscription();
      setShowTranscription(false);
    } else {
      setShowTranscription(true);
      await startTranscription();
    }
  };

  // Toggle AI analysis
  const toggleAnalysis = () => {
    setShowAnalysis(!showAnalysis);
  };

  // Run AI analysis
  const runAnalysis = async () => {
    if (!selectedModel) {
      console.warn('⚠️ No AI model selected');
      return;
    }

    if (transcript.length === 0) {
      console.warn('⚠️ No transcript available for analysis');
      return;
    }

    await analyzeConversation(transcript, selectedModel);
  };

  // Export transcript
  const exportTranscript = () => {
    if (transcript.length === 0) return;

    const textContent = transcript
      .map(
        (segment) =>
          `[${segment.timestamp.toLocaleTimeString()}] ${segment.speaker}: ${segment.text}`
      )
      .join('\n');

    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript-${roomName}-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Copy to clipboard helper
  
  // Copy to clipboard helper
  
  // Copy to clipboard helper
  
  // Copy to clipboard helper
  
  // Copy to clipboard helper
  
  // Save chat history to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined' && chatMessages.length > 0) {
      localStorage.setItem(`chat-history-${roomName}`, JSON.stringify(chatMessages));
    }
  }, [chatMessages, roomName]);
  
  // Request chat history when joining room
  useEffect(() => {
    if (isConnected && localDataTrack) {
      // Wait a bit for others to connect
      const timer = setTimeout(() => {
        if (localDataTrack) {
          const message = {
            type: 'requestChatHistory',
            requester: participantName || 'Anonymous'
          };
          localDataTrack.send(JSON.stringify(message));
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
    console.log('🎨 Current room state:', !!room, 'Local track:', !!localVideoTrack);

    const applyBackgroundEffect = async () => {
      if (!localVideoTrack) {
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

  // Show connecting state
  if (isConnecting || !isConnected) {
    return (
      <div
        className="shadow-2xl rounded-lg overflow-hidden fixed bg-gray-900"
        style={{ 
          zIndex: 9999,
          left: window.innerWidth / 2 - 200,
          top: window.innerHeight / 2 - 150,
          width: 400,
          height: 300
        }}
      >
        <div className="flex items-center justify-center h-full">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <div className="text-lg font-semibold mb-2">Connecting to meeting...</div>
            <div className="text-sm text-gray-400">Please wait</div>
          </div>
        </div>
      </div>
    );
  }

  // Show minimized camera button when minimized
  if (isMinimized) {
    return (
      <MinimizedVideoCallButton
        isMobile={isMobile}
        onRestore={toggleMinimized}
        roomName={roomName}
        participantsCount={participants.size + 1}
      />
    );
  }

  return (
    <div
      className={`shadow-2xl ${isMobile ? 'fixed inset-0' : 'fixed'}`}
      style={{
        zIndex: 9999,
        width: isMobile ? '100vw' : (isFullscreen ? '100vw' : width),
        height: isMobile ? '100vh' : (isFullscreen ? '100vh' : height),
        left: isMobile ? 0 : x,
        top: isMobile ? 0 : y,
        cursor: (isDraggingRef.current && !isMobile) ? 'grabbing' : 'default'
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="flex flex-col h-full bg-gray-900 text-white">
        <VideoCallHeader
          isMobile={isMobile}
          isMinimized={isMinimized}
          isFullscreen={isFullscreen}
          isConnected={isConnected}
          isReconnecting={isReconnecting}
          participants={participants}
          roomName={roomName}
          participantName={participantName}
          meetingTitle={meetingTitle}
          userIsHost={userIsHost}
          viewMode={viewMode}
          showInfoMenu={showInfoMenu}
          copiedField={copiedField}
          onLeave={leaveCall}
          onToggleMinimized={toggleMinimized}
          onToggleFullscreen={toggleFullscreen}
          onSetViewMode={setViewMode}
          onToggleInfoMenu={() => setShowInfoMenu(!showInfoMenu)}
          onCopyToClipboard={copyToClipboard}
        />

        {/* Waiting Room Controls - Only show for host/admin */}
        {userIsHost && currentUserId && (
          <div className="px-4 pt-2">
            <WaitingRoomControls 
              hostUserId={currentUserId}
              organizationId={currentOrgId || undefined}
            />
          </div>
        )}

        <VideoLayout
          viewMode={viewMode}
          participants={participants}
          isMinimized={isMinimized}
          isMobile={isMobile}
          pinnedParticipant={pinnedParticipant}
          showSelfView={showSelfView}
          isLocalVideoMirrored={isLocalVideoMirrored}
          backgroundMode={backgroundMode}
          isAudioEnabled={isAudioEnabled}
          isVideoEnabled={isVideoEnabled}
          localVideoRef={localVideoRef}
          processedVideoRef={processedVideoRef}
          backgroundVideoRef={backgroundVideoRef}
          backgroundCanvasRef={backgroundCanvasRef}
          localVideoRefSpotlight={localVideoRefSpotlight}
          processedVideoSpotlightRef={processedVideoSpotlightRef}
          localVideoRefThumbnail={localVideoRefThumbnail}
          processedVideoThumbnailRef={processedVideoThumbnailRef}
          room={room}
          onPinParticipant={(identity) => {
            setPinnedParticipant(identity);
            setViewMode('spotlight');
          }}
          onUnpinParticipant={() => setPinnedParticipant(null)}
          onToggleSelfView={() => setShowSelfView(!showSelfView)}
          onToggleMirror={() => setIsLocalVideoMirrored(!isLocalVideoMirrored)}
        />

        <VideoControls
          isMinimized={isMinimized}
          isMobile={isMobile}
          isVideoEnabled={isVideoEnabled}
          isAudioEnabled={isAudioEnabled}
          isVideoAvailable={isVideoAvailable}
          isAudioAvailable={isAudioAvailable}
          isScreenSharing={isScreenSharing}
          showChat={showChat}
          unreadCount={unreadCount}
          handRaised={handRaised}
          showParticipants={showParticipants}
          raisedHands={raisedHands}
          isRecording={isRecording}
          showSettings={showSettings}
          showNotes={showNotes}
          isTranscribing={isTranscribing}
          showTranscription={showTranscription}
          isAnalyzing={isAnalyzing}
          showAnalysis={showAnalysis}
          selectedAIModel={selectedModel}
          aiModels={aiModels}
          aiModelsLoading={aiModelsLoading}
          room={room}
          roomName={roomName}
          localDataTrack={localDataTrack}
          localAudioTrack={localAudioTrack}
          localVideoTrack={localVideoTrack}
          onToggleVideo={toggleVideo}
          onToggleAudio={toggleAudio}
          onToggleScreenShare={toggleScreenShare}
          onToggleChat={toggleChat}
          onToggleHandRaise={toggleHandRaise}
          onToggleParticipants={() => setShowParticipants(!showParticipants)}
          onToggleRecording={isRecording ? () => stopRecording(roomName) : () => startRecording(room, localAudioTrack, localVideoTrack, roomName)}
          onToggleSettings={() => setShowSettings(!showSettings)}
          onToggleNotes={() => setShowNotes(!showNotes)}
          onToggleTranscription={toggleTranscription}
          onToggleAnalysis={toggleAnalysis}
          onRunAnalysis={runAnalysis}
          onSelectAIModel={setSelectedModel}
          onLeaveCall={leaveCall}
          onStartRecording={startRecording}
          onStopRecording={stopRecording}
        />
      </div>

      <ReactionPanel
        reactions={reactions}
        isMinimized={isMinimized}
        isMobile={isMobile}
        localDataTrack={localDataTrack}
        participantName={participantName}
        onSendReaction={sendReaction}
      />

      <ChatPanel
        showChat={showChat}
        isMobile={isMobile}
        chatMessages={chatMessages}
        chatInput={chatInput}
        chatContainerRef={chatContainerRef}
        fileInputRef={fileInputRef}
        toggleChat={toggleChat}
        sendChatMessage={sendChatMessage}
        handleFileSelect={handleFileSelect}
        setChatInput={setChatInput}
        sendReaction={(emoji) => sendReaction(emoji, localDataTrack, participantName || 'You')}
        getParticipantColor={getParticipantColor}
        panelManagement={panelManagement}
      />

      <ParticipantsPanel
        showParticipants={showParticipants}
        isMobile={isMobile}
        participants={participants}
        participantName={participantName}
        isHost={isHost}
        isAudioEnabled={isAudioEnabled}
        isVideoEnabled={isVideoEnabled}
        handRaised={handRaised}
        raisedHands={raisedHands}
        muteAllParticipants={() => muteAllParticipants(isHost, localDataTrack)}
        kickParticipant={(identity) => kickParticipant(identity, isHost, localDataTrack)}
        panelManagement={panelManagement}
        onClose={() => setShowParticipants(false)}
      />

      <SettingsPanel
        showSettings={showSettings}
        isMobile={isMobile}
        videoQuality={videoQuality}
        backgroundMode={backgroundMode}
        backgroundColor={backgroundColor}
        backgroundImage={backgroundImage}
        networkStats={networkStats}
        isPiP={isPiP}
        changeVideoQuality={(quality) => changeVideoQuality(quality, localVideoTrack)}
        setBackgroundMode={setBackgroundMode}
        setBackgroundColor={setBackgroundColor}
        setBackgroundImage={setBackgroundImage}
        togglePictureInPicture={() => togglePictureInPicture(localVideoRef.current)}
        panelManagement={panelManagement}
        onClose={() => setShowSettings(false)}
      />

      <MeetingNotesPanel
        showNotes={showNotes}
        isMobile={isMobile}
        meetingNotes={meetingNotes}
        roomName={roomName}
        setMeetingNotes={setMeetingNotes}
        panelManagement={panelManagement}
        onClose={() => setShowNotes(false)}
      />

      <InfoMenu
        showInfoMenu={showInfoMenu}
        isMobile={isMobile}
        roomName={roomName}
        participantName={participantName}
        isConnected={isConnected}
        participantsCount={participants.size + 1}
        copiedField={copiedField}
        copyToClipboard={copyToClipboard}
        panelManagement={panelManagement}
        onClose={() => setShowInfoMenu(false)}
      />

      {/* Transcription Panel */}
      <TranscriptionPanel
        showTranscription={showTranscription}
        isMobile={isMobile}
        transcript={transcript}
        isTranscribing={isTranscribing}
        error={transcriptionError}
        onClose={() => {
          setShowTranscription(false);
          if (isTranscribing) {
            stopTranscription();
          }
        }}
        onExport={exportTranscript}
        panelManagement={panelManagement}
      />

      {/* AI Analysis Panel */}
      <AIAnalysisPanel
        showAnalysis={showAnalysis}
        isMobile={isMobile}
        analysisResult={analysisResult}
        isAnalyzing={isAnalyzing}
        error={analysisError}
        selectedModelName={selectedModel?.name}
        onClose={() => setShowAnalysis(false)}
        onReanalyze={runAnalysis}
        panelManagement={panelManagement}
      />

      {/* Recording Indicator */}
      <RecordingIndicator
        isRecording={isRecording}
        recordingStartTime={recordingStartTime}
      />
    </div>
  );
}
