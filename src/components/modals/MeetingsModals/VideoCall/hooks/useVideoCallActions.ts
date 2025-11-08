import { useCallback, useRef } from 'react';
import { Room, LocalVideoTrack } from 'twilio-video';

interface TranscriptSegment {
  timestamp: Date;
  speaker: string;
  text: string;
  confidence: number;
}

interface AIModel {
  id: number;
  name: string;
  [key: string]: any;
}

/**
 * Custom hook for video call action handlers
 */
export function useVideoCallActions(
  room: Room | null,
  roomName: string,
  isScreenSharing: boolean,
  startScreenSharing: () => void,
  stopScreenSharing: () => void,
  isTranscribing: boolean,
  startTranscription: () => Promise<void>,
  stopTranscription: () => void,
  setShowTranscription: (show: boolean) => void,
  showAnalysis: boolean,
  setShowAnalysis: (show: boolean) => void,
  selectedModel: any,
  transcript: any[],
  analyzeConversation: (transcript: any[], model: any) => Promise<void>,
  onLeave: () => void
) {
  const screenTrackRef = useRef<LocalVideoTrack | null>(null);

  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      if (screenTrackRef.current) {
        room?.localParticipant.unpublishTrack(screenTrackRef.current);
        screenTrackRef.current.stop();
        screenTrackRef.current = null;
      }
      stopScreenSharing();
    } else {
      try {
        const screenTrack = await navigator.mediaDevices.getDisplayMedia({ video: true })
          .then(stream => new LocalVideoTrack(stream.getVideoTracks()[0]));
        screenTrackRef.current = screenTrack;
        room?.localParticipant.publishTrack(screenTrack);
        startScreenSharing();
      } catch (err) {
        console.error('Error starting screen share:', err);
      }
    }
  }, [isScreenSharing, room, startScreenSharing, stopScreenSharing]);

  const toggleTranscription = useCallback(async () => {
    if (isTranscribing) {
      stopTranscription();
      setShowTranscription(false);
    } else {
      setShowTranscription(true);
      await startTranscription();
    }
  }, [isTranscribing, stopTranscription, setShowTranscription, startTranscription]);

  const toggleAnalysis = useCallback(() => {
    setShowAnalysis(!showAnalysis);
  }, [showAnalysis, setShowAnalysis]);

  const runAnalysis = useCallback(async () => {
    if (!selectedModel) {
      console.warn('⚠️ No AI model selected');
      return;
    }

    if (transcript.length === 0) {
      console.warn('⚠️ No transcript available for analysis');
      return;
    }

    await analyzeConversation(transcript, selectedModel);
  }, [selectedModel, transcript, analyzeConversation]);

  const exportTranscript = useCallback(() => {
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
  }, [transcript, roomName]);

  const leaveCall = useCallback(() => {
    if (room) {
      room.disconnect();
    }
    onLeave();
  }, [room, onLeave]);

  return {
    toggleScreenShare,
    toggleTranscription,
    toggleAnalysis,
    runAnalysis,
    exportTranscript,
    leaveCall,
    screenTrackRef,
  };
}
