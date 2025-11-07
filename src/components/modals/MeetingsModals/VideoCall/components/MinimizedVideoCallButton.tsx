'use client';

import React from 'react';
import { VideoCameraIcon } from '@heroicons/react/24/outline';
import { useThemeColors } from '@/hooks/useThemeColors';

interface MinimizedVideoCallButtonProps {
  isMobile: boolean;
  onRestore: () => void;
  roomName: string;
  participantsCount: number;
}

export default function MinimizedVideoCallButton({
  isMobile,
  onRestore,
  roomName,
  participantsCount
}: MinimizedVideoCallButtonProps) {
  const themeColors = useThemeColors();
  const primary = themeColors.cssVars.primary;
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <div className={`fixed z-[10004] ${isMobile ? 'bottom-6 right-4' : 'bottom-6 right-4'}`}>
      <button
        onClick={onRestore}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="w-14 h-14 rounded-full shadow-2xl border-2 border-white/20 flex items-center justify-center group transition-all duration-200 hover:scale-110"
        style={{
          background: isHovered 
            ? `linear-gradient(to bottom right, ${primary.hover}, ${primary.active})` 
            : `linear-gradient(to bottom right, ${primary.base}, ${primary.hover})`,
          boxShadow: isHovered 
            ? `0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 30px ${primary.base}80`
            : '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        }}
        title={`Restore video call - ${roomName} (${participantsCount} participants)`}
      >
        <VideoCameraIcon className="w-7 h-7 text-white group-hover:scale-110 transition-transform duration-200" />
      </button>
    </div>
  );
}