'use client';

import React from 'react';
import { useThemeColors } from '@/hooks/useThemeColors';

interface RecordingIndicatorProps {
  isRecording: boolean;
  recordingStartTime: Date | null;
}

const RecordingIndicator: React.FC<RecordingIndicatorProps> = ({
  isRecording,
  recordingStartTime,
}) => {
  const themeColors = useThemeColors();
  const primary = themeColors.cssVars.primary;
  
  if (!isRecording || !recordingStartTime) return null;

  return (
    <div 
      className="absolute top-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-full flex items-center gap-2 z-50"
      style={{ backgroundColor: primary.base }}
    >
      <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
      <span className="text-sm font-medium">
        Recording {Math.floor((new Date().getTime() - recordingStartTime.getTime()) / 1000)}s
      </span>
    </div>
  );
};

export default RecordingIndicator;