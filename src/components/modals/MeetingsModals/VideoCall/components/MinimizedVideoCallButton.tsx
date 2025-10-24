'use client';

import React from 'react';
import { VideoCameraIcon } from '@heroicons/react/24/outline';

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
  return (
    <div className={`fixed z-[10000] ${isMobile ? 'bottom-6 right-4' : 'bottom-6 right-4'}`}>
      <button
        onClick={onRestore}
        className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-full shadow-2xl border-2 border-white/20 flex items-center justify-center group transition-all duration-200 hover:scale-110 hover:shadow-blue-500/50"
        title={`Restore video call - ${roomName} (${participantsCount} participants)`}
      >
        <VideoCameraIcon className="w-7 h-7 text-white group-hover:scale-110 transition-transform duration-200" />
      </button>
    </div>
  );
}