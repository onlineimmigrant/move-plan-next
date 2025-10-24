'use client';

import { useState, useRef } from 'react';
import { Room, LocalAudioTrack, LocalVideoTrack } from 'twilio-video';

interface UseRecordingReturn {
  isRecording: boolean;
  recordingStartTime: Date | null;
  startRecording: (room: Room | null, localAudioTrack: LocalAudioTrack | null, localVideoTrack: LocalVideoTrack | null, roomName: string) => Promise<void>;
  stopRecording: (roomName: string) => void;
}

export function useRecording(): UseRecordingReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingStartTime, setRecordingStartTime] = useState<Date | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const startRecording = async (
    room: Room | null,
    localAudioTrack: LocalAudioTrack | null,
    localVideoTrack: LocalVideoTrack | null,
    roomName: string
  ) => {
    try {
      if (!room) return;

      // Get all tracks
      const audioTracks: MediaStreamTrack[] = [];
      const videoTracks: MediaStreamTrack[] = [];

      // Local tracks
      if (localAudioTrack) {
        audioTracks.push(localAudioTrack.mediaStreamTrack);
      }
      if (localVideoTrack) {
        videoTracks.push(localVideoTrack.mediaStreamTrack);
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

  const stopRecording = (roomName: string) => {
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

  return {
    isRecording,
    recordingStartTime,
    startRecording,
    stopRecording,
  };
}