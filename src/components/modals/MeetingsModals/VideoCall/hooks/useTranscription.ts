import { useState, useEffect, useRef, useCallback } from 'react';
import { Room, LocalAudioTrack, RemoteParticipant, RemoteAudioTrack } from 'twilio-video';
import { StreamingTranscriber } from 'assemblyai';

interface TranscriptSegment {
  speaker: string;
  text: string;
  timestamp: Date;
  confidence: number;
}

interface UseTranscriptionReturn {
  isTranscribing: boolean;
  transcript: TranscriptSegment[];
  error: string | null;
  startTranscription: () => Promise<void>;
  stopTranscription: () => void;
  clearTranscript: () => void;
}

/**
 * Hook for real-time transcription using AssemblyAI
 * Mixes audio from local participant and all remote participants
 */
export function useTranscription(
  room: Room | null,
  localAudioTrack: LocalAudioTrack | null,
  isConnected: boolean,
  participantName: string
): UseTranscriptionReturn {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptSegment[]>([]);
  const [error, setError] = useState<string | null>(null);

  const transcriberRef = useRef<StreamingTranscriber | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioDestinationRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const sourceNodesRef = useRef<Map<string, MediaStreamAudioSourceNode>>(new Map());
  const gainNodeRef = useRef<GainNode | null>(null); // Store gain node for dynamic participant addition
  const analyserNodesRef = useRef<Map<string, AnalyserNode>>(new Map()); // Track audio levels per participant
  const currentSpeakerRef = useRef<string>('Meeting Participant'); // Track who's currently speaking

  /**
   * Mix audio from local and remote participants
   */
  const setupAudioMixing = useCallback((): MediaStream | null => {
    if (!room || !localAudioTrack) {
      console.error('❌ Cannot setup audio mixing: missing room or local audio track');
      return null;
    }

    try {
      // Create AudioContext for mixing
      const audioContext = new AudioContext({ sampleRate: 16000 }); // AssemblyAI recommends 16kHz
      audioContextRef.current = audioContext;

      // Create destination node
      const destination = audioContext.createMediaStreamDestination();
      audioDestinationRef.current = destination;

      console.log('🎤 Setting up audio mixing...');

      // Add local audio track
      const localMediaStream = new MediaStream([localAudioTrack.mediaStreamTrack]);
      const localSource = audioContext.createMediaStreamSource(localMediaStream);
      localSource.connect(destination);
      sourceNodesRef.current.set('local', localSource);
      
      // Create analyser for local audio to track volume
      const localAnalyser = audioContext.createAnalyser();
      localAnalyser.fftSize = 256;
      localSource.connect(localAnalyser);
      analyserNodesRef.current.set(participantName, localAnalyser); // Use actual participant name
      
      console.log('✅ Connected local audio');

      // Add all remote participants' audio
      room.participants.forEach((participant: RemoteParticipant) => {
        const audioTrack = Array.from(participant.audioTracks.values())
          .find(pub => pub.track)?.track as RemoteAudioTrack | undefined;

        if (audioTrack) {
          const remoteMediaStream = new MediaStream([audioTrack.mediaStreamTrack]);
          const remoteSource = audioContext.createMediaStreamSource(remoteMediaStream);
          remoteSource.connect(destination);
          sourceNodesRef.current.set(participant.identity, remoteSource);
          
          // Create analyser for remote audio to track volume
          const remoteAnalyser = audioContext.createAnalyser();
          remoteAnalyser.fftSize = 256;
          remoteSource.connect(remoteAnalyser);
          analyserNodesRef.current.set(participant.identity, remoteAnalyser);
          
          console.log(`✅ Connected remote audio: ${participant.identity}`);
        }
      });

      mediaStreamRef.current = destination.stream;
      return destination.stream;

    } catch (err) {
      console.error('❌ Failed to setup audio mixing:', err);
      setError('Failed to setup audio mixing');
      return null;
    }
  }, [room, localAudioTrack]);

  /**
   * Add new remote participant's audio to the mix
   */
  const addRemoteParticipantAudio = useCallback((participant: RemoteParticipant) => {
    if (!audioContextRef.current) return;

    const audioTrack = Array.from(participant.audioTracks.values())
      .find(pub => pub.track)?.track as RemoteAudioTrack | undefined;

    if (audioTrack && !sourceNodesRef.current.has(participant.identity)) {
      try {
        const remoteMediaStream = new MediaStream([audioTrack.mediaStreamTrack]);
        const remoteSource = audioContextRef.current.createMediaStreamSource(remoteMediaStream);
        
        // Create analyser for this participant to track volume
        const remoteAnalyser = audioContextRef.current.createAnalyser();
        remoteAnalyser.fftSize = 256;
        remoteSource.connect(remoteAnalyser);
        analyserNodesRef.current.set(participant.identity, remoteAnalyser);
        
        // Connect to both destination (for preview) and gain node (for transcription)
        if (audioDestinationRef.current) {
          remoteSource.connect(audioDestinationRef.current);
        }
        if (gainNodeRef.current) {
          remoteSource.connect(gainNodeRef.current);
          console.log(`✅ Connected participant to transcription: ${participant.identity}`);
        }
        
        sourceNodesRef.current.set(participant.identity, remoteSource);
        console.log(`✅ Added new participant audio: ${participant.identity}`);
      } catch (err) {
        console.error(`❌ Failed to add participant audio: ${participant.identity}`, err);
      }
    }
  }, []);

  /**
   * Remove remote participant's audio from the mix
   */
  const removeRemoteParticipantAudio = useCallback((participant: RemoteParticipant) => {
    const sourceNode = sourceNodesRef.current.get(participant.identity);
    if (sourceNode) {
      sourceNode.disconnect();
      sourceNodesRef.current.delete(participant.identity);
      console.log(`✅ Removed participant audio: ${participant.identity}`);
    }
  }, []);

  /**
   * Start transcription
   */
  const startTranscription = useCallback(async () => {
    if (!isConnected || !room) {
      setError('Not connected to room');
      return;
    }

    if (isTranscribing) {
      console.log('⚠️ Transcription already active');
      return;
    }

    try {
      setError(null);
      console.log('🚀 Starting transcription...');

      // Setup audio mixing
      const mixedStream = setupAudioMixing();
      if (!mixedStream) {
        throw new Error('Failed to setup audio mixing');
      }

      // Get temporary token from server API
      console.log('� Fetching AssemblyAI temporary token...');
      const tokenResponse = await fetch('/api/assemblyai/token');
      
      if (!tokenResponse.ok) {
        const error = await tokenResponse.json();
        throw new Error(`Failed to get AssemblyAI token: ${error.error || tokenResponse.statusText}`);
      }

      const { token } = await tokenResponse.json();
      console.log('✅ Received temporary token:', token.substring(0, 10) + '...');

      // Create streaming transcriber with temporary token (Universal-2 model)
      const transcriber = new StreamingTranscriber({
        token: token,
        sampleRate: 16_000,
      });

      transcriberRef.current = transcriber;

      // Function to detect who's speaking based on audio levels
      const detectCurrentSpeaker = () => {
        let maxVolume = 0;
        let currentSpeaker = 'Meeting Participant';
        
        analyserNodesRef.current.forEach((analyser, identity) => {
          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          analyser.getByteFrequencyData(dataArray);
          
          // Calculate average volume
          const volume = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
          
          if (volume > maxVolume && volume > 30) { // Threshold to ignore background noise
            maxVolume = volume;
            currentSpeaker = identity;
          }
        });
        
        currentSpeakerRef.current = currentSpeaker;
      };

      // Function to start streaming audio using ScriptProcessorNode for PCM data
      const startAudioStreaming = () => {
        if (!audioContextRef.current) {
          console.error('Audio context not available');
          return;
        }

        // Create a script processor to capture PCM audio data
        const scriptProcessor = audioContextRef.current.createScriptProcessor(4096, 1, 1);
        
        // Create a gain node to mix all audio sources
        const gainNode = audioContextRef.current.createGain();
        gainNode.gain.value = 1.0;
        gainNodeRef.current = gainNode; // Store for dynamic participant addition

        // Connect all existing source nodes to the gain node
        sourceNodesRef.current.forEach((sourceNode, identity) => {
          sourceNode.connect(gainNode);
          console.log(`✅ Connected existing participant to transcription: ${identity}`);
        });

        // Connect gain node to script processor for PCM capture
        gainNode.connect(scriptProcessor);
        scriptProcessor.connect(audioContextRef.current.destination);

        scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
          if (!transcriberRef.current) return;

          // Detect who's currently speaking based on audio levels
          detectCurrentSpeaker();

          const inputBuffer = audioProcessingEvent.inputBuffer;
          const inputData = inputBuffer.getChannelData(0); // Get mono channel
          
          // Convert Float32Array to Int16Array (PCM 16-bit)
          const pcmData = new Int16Array(inputData.length);
          for (let i = 0; i < inputData.length; i++) {
            // Clamp values to [-1, 1] and scale to 16-bit integer range
            const s = Math.max(-1, Math.min(1, inputData[i]));
            pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
          }

          try {
            // Send PCM data as ArrayBuffer
            transcriberRef.current.sendAudio(pcmData.buffer);
          } catch (err) {
            console.error('Error sending audio:', err);
          }
        };

        console.log('✅ Audio streaming started with PCM encoding');
      };

      // Handle transcription events for Universal Streaming (v3)
      transcriber.on('open', ({ id }) => {
        console.log('✅ AssemblyAI session opened:', id);
        setIsTranscribing(true);
        
        // Small delay to ensure socket is fully ready
        setTimeout(() => {
          startAudioStreaming();
        }, 100);
      });

      transcriber.on('turn', (message) => {
        // Universal Streaming sends "turn" events instead of "transcript"
        if (message.end_of_turn && message.transcript) {
          const detectedSpeaker = currentSpeakerRef.current;
          
          setTranscript(prev => {
            // Check if the last segment is from the same speaker
            const lastSegment = prev[prev.length - 1];
            
            if (lastSegment && lastSegment.speaker === detectedSpeaker) {
              // Append to the existing segment instead of creating a new one
              const updatedSegment: TranscriptSegment = {
                ...lastSegment,
                text: lastSegment.text + ' ' + message.transcript,
                confidence: (lastSegment.confidence + (message.end_of_turn_confidence || 0)) / 2, // Average confidence
              };
              
              console.log('📝 Appending to existing segment:', detectedSpeaker);
              return [...prev.slice(0, -1), updatedSegment];
            } else {
              // New speaker, create a new segment
              const newSegment: TranscriptSegment = {
                speaker: detectedSpeaker,
                text: message.transcript,
                timestamp: new Date(),
                confidence: message.end_of_turn_confidence || 0,
              };
              
              console.log('📝 New transcript segment:', detectedSpeaker);
              return [...prev, newSegment];
            }
          });
        }
      });

      transcriber.on('error', (error) => {
        console.error('❌ Transcription error:', error);
        setError(`Transcription error: ${error.message}`);
        stopTranscription();
      });

      transcriber.on('close', (code, reason) => {
        console.log('🔌 AssemblyAI connection closed:', code, reason);
        setIsTranscribing(false);
      });

      // Connect to AssemblyAI
      await transcriber.connect();

      console.log('✅ Transcription started successfully');

    } catch (err: any) {
      console.error('❌ Failed to start transcription:', err);
      setError(`Failed to start: ${err.message}`);
      setIsTranscribing(false);
    }
  }, [isConnected, room, isTranscribing, setupAudioMixing, participantName]);

  /**
   * Stop transcription
   */
  const stopTranscription = useCallback(() => {
    console.log('🛑 Stopping transcription...');

    if (transcriberRef.current) {
      transcriberRef.current.close();
      transcriberRef.current = null;
    }

    // Cleanup audio nodes
    sourceNodesRef.current.forEach(node => node.disconnect());
    sourceNodesRef.current.clear();

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    audioDestinationRef.current = null;
    mediaStreamRef.current = null;
    setIsTranscribing(false);

    console.log('✅ Transcription stopped');
  }, []);

  /**
   * Clear transcript history
   */
  const clearTranscript = useCallback(() => {
    setTranscript([]);
    setError(null);
  }, []);

  // Listen for participant changes to update audio mixing
  useEffect(() => {
    if (!room || !isTranscribing) return;

    const handleParticipantConnected = (participant: RemoteParticipant) => {
      console.log('👤 Participant connected:', participant.identity);
      
      // Listen for audio track publication
      participant.on('trackSubscribed', (track) => {
        if (track.kind === 'audio') {
          addRemoteParticipantAudio(participant);
        }
      });

      // Add audio if already available
      addRemoteParticipantAudio(participant);
    };

    const handleParticipantDisconnected = (participant: RemoteParticipant) => {
      console.log('👤 Participant disconnected:', participant.identity);
      removeRemoteParticipantAudio(participant);
    };

    room.on('participantConnected', handleParticipantConnected);
    room.on('participantDisconnected', handleParticipantDisconnected);

    return () => {
      room.off('participantConnected', handleParticipantConnected);
      room.off('participantDisconnected', handleParticipantDisconnected);
    };
  }, [room, isTranscribing, addRemoteParticipantAudio, removeRemoteParticipantAudio]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isTranscribing) {
        stopTranscription();
      }
    };
  }, [isTranscribing, stopTranscription]);

  return {
    isTranscribing,
    transcript,
    error,
    startTranscription,
    stopTranscription,
    clearTranscript,
  };
}
