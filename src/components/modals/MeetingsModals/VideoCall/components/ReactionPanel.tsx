'use client';

import React from 'react';
import { LocalDataTrack } from 'twilio-video';

interface Reaction {
  id: string;
  emoji: string;
  x: number;
  y: number;
  sender: string;
}

interface ReactionPanelProps {
  reactions: Reaction[];
  isMinimized: boolean;
  isMobile: boolean;
  localDataTrack: LocalDataTrack | null;
  participantName: string | undefined;
  onSendReaction: (emoji: string, localDataTrack: LocalDataTrack | null, participantName: string) => void;
}

const ReactionPanel: React.FC<ReactionPanelProps> = ({
  reactions,
  isMinimized,
  isMobile,
  localDataTrack,
  participantName,
  onSendReaction,
}) => {
  return (
    <>
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
              onClick={() => onSendReaction(emoji, localDataTrack, participantName || 'You')}
              className="text-2xl hover:scale-125 transition-transform"
              title={`Send ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </>
  );
};

export default ReactionPanel;