'use client';

import React, { useRef, useEffect } from 'react';
import { XMarkIcon, MicrophoneIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { usePanelManagement } from '../hooks/usePanelManagement';

interface TranscriptSegment {
  speaker: string;
  text: string;
  timestamp: Date;
  confidence: number;
}

interface TranscriptionPanelProps {
  showTranscription: boolean;
  isMobile: boolean;
  transcript: TranscriptSegment[];
  isTranscribing: boolean;
  error: string | null;
  onClose: () => void;
  onExport?: () => void;
  panelManagement: ReturnType<typeof usePanelManagement>;
}

export default function TranscriptionPanel({
  showTranscription,
  isMobile,
  transcript,
  isTranscribing,
  error,
  onClose,
  onExport,
  panelManagement,
}: TranscriptionPanelProps) {
  const transcriptContainerRef = useRef<HTMLDivElement>(null);
  const { panels, startDrag, bringToFront } = panelManagement;
  const panelState = panels['transcription'];

  const isMinimized = panelState?.isMinimized || false;
  const isDragging = panelState?.isDragging || false;
  const position = panelState?.position || { x: 16, y: 120 };
  const zIndex = panelState?.zIndex || 50;

  // Auto-scroll to bottom when new transcript arrives
  useEffect(() => {
    if (transcriptContainerRef.current) {
      transcriptContainerRef.current.scrollTop = transcriptContainerRef.current.scrollHeight;
    }
  }, [transcript]);

  if (!showTranscription) return null;

  // Format timestamp to HH:MM:SS
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  // Get confidence color
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-500';
    if (confidence >= 0.7) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div
      className={`bg-gray-800 rounded-lg shadow-xl ${
        isMobile ? 'fixed inset-x-4 bottom-4 top-20' : 'fixed'
      } ${isDragging ? 'cursor-grabbing' : ''}`}
      style={
        isMobile
          ? {}
          : {
              left: position.x,
              top: position.y,
              width: '400px',
              maxHeight: '600px',
              zIndex,
            }
      }
      onMouseDown={() => bringToFront('transcription')}
    >
      {/* Header */}
      <div 
        className="panel-header flex items-center justify-between p-4 border-b border-gray-700 cursor-move"
        onMouseDown={(e) => {
          if (!isMobile) {
            e.preventDefault();
            startDrag('transcription', e);
          }
        }}
      >
        <div className="flex items-center gap-2">
          <MicrophoneIcon className="h-5 w-5 text-blue-400" />
          <h3 className="text-white font-semibold">Live Transcription</h3>
          {isTranscribing && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-xs text-gray-400">Recording</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {onExport && transcript.length > 0 && (
            <button
              onClick={onExport}
              className="p-1 hover:bg-gray-700 rounded transition-colors"
              title="Export transcript"
            >
              <ArrowDownTrayIcon className="h-5 w-5 text-gray-400" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-700 rounded transition-colors"
          >
            <XMarkIcon className="h-5 w-5 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col h-full">
        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-500/10 border-b border-red-500/20">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Transcript Display */}
        <div
          ref={transcriptContainerRef}
          className="flex-1 overflow-y-auto p-4 space-y-3"
          style={{ maxHeight: isMobile ? 'calc(100vh - 200px)' : '500px' }}
        >
          {transcript.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <MicrophoneIcon className="h-12 w-12 mb-2 opacity-50" />
              <p className="text-sm">
                {isTranscribing
                  ? 'Waiting for speech...'
                  : 'Start transcription to see live conversation text'}
              </p>
            </div>
          ) : (
            transcript.map((segment, index) => (
              <div
                key={index}
                className="bg-gray-700/50 rounded-lg p-3 hover:bg-gray-700 transition-colors"
              >
                {/* Header: Speaker and Time */}
                <div className="flex items-center justify-between mb-1">
                  <span className="text-blue-400 font-medium text-sm">
                    {segment.speaker}
                  </span>
                  <span className="text-gray-500 text-xs">
                    {formatTime(segment.timestamp)}
                  </span>
                </div>

                {/* Transcript Text */}
                <p className="text-white text-sm leading-relaxed">{segment.text}</p>

                {/* Confidence Indicator */}
                <div className="flex items-center justify-end mt-2">
                  <span
                    className={`text-xs ${getConfidenceColor(segment.confidence)}`}
                    title={`Confidence: ${Math.round(segment.confidence * 100)}%`}
                  >
                    {Math.round(segment.confidence * 100)}% confident
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Stats */}
        {transcript.length > 0 && (
          <div className="border-t border-gray-700 p-3 bg-gray-800/50">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>{transcript.length} segments</span>
              <span>
                {transcript.reduce((sum, s) => sum + s.text.split(' ').length, 0)} words
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
