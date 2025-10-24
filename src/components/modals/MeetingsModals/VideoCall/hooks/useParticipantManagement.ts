'use client';

import { useState, useEffect } from 'react';
import { LocalDataTrack } from 'twilio-video';

interface UseParticipantManagementReturn {
  isHost: boolean;
  raisedHands: Set<string>;
  handRaised: boolean;
  reactions: Array<{ id: string; emoji: string; x: number; y: number; sender: string }>;
  waitingParticipants: Array<{ identity: string; timestamp: Date }>;
  setIsHost: (value: boolean) => void;
  setRaisedHands: React.Dispatch<React.SetStateAction<Set<string>>>;
  setHandRaised: (value: boolean) => void;
  setReactions: React.Dispatch<React.SetStateAction<Array<{ id: string; emoji: string; x: number; y: number; sender: string }>>>;
  setWaitingParticipants: (value: Array<{ identity: string; timestamp: Date }>) => void;
  sendReaction: (emoji: string, localDataTrack: LocalDataTrack | null, participantName: string) => void;
  toggleHandRaise: (localDataTrack: LocalDataTrack | null) => void;
  muteAllParticipants: (isHost: boolean, localDataTrack: LocalDataTrack | null) => void;
  kickParticipant: (identity: string, isHost: boolean, localDataTrack: LocalDataTrack | null) => void;
}

export function useParticipantManagement(): UseParticipantManagementReturn {
  const [isHost, setIsHost] = useState(false);
  const [raisedHands, setRaisedHands] = useState<Set<string>>(new Set());
  const [handRaised, setHandRaised] = useState(false);
  const [reactions, setReactions] = useState<Array<{ id: string; emoji: string; x: number; y: number; sender: string }>>([]);
  const [waitingParticipants, setWaitingParticipants] = useState<Array<{ identity: string; timestamp: Date }>>([]);

  const sendReaction = (emoji: string, localDataTrack: LocalDataTrack | null, participantName: string) => {
    if (!localDataTrack) return;

    const message = {
      type: 'reaction',
      emoji
    };

    localDataTrack.send(JSON.stringify(message));

    // Show reaction locally
    const id = Math.random().toString(36);
    setReactions(prev => [...prev, {
      id,
      emoji,
      x: Math.random() * 80 + 10,
      y: Math.random() * 60 + 20,
      sender: participantName
    }]);

    setTimeout(() => {
      setReactions(prev => prev.filter(r => r.id !== id));
    }, 3000);
  };

  const toggleHandRaise = (localDataTrack: LocalDataTrack | null) => {
    if (!localDataTrack) return;

    const newState = !handRaised;
    setHandRaised(newState);

    const message = {
      type: 'handRaised',
      raised: newState
    };

    localDataTrack.send(JSON.stringify(message));
  };

  const muteAllParticipants = (isHost: boolean, localDataTrack: LocalDataTrack | null) => {
    if (!isHost || !localDataTrack) return;

    const message = {
      type: 'muteAll'
    };

    localDataTrack.send(JSON.stringify(message));
    console.log('🔇 Muted all participants');
  };

  const kickParticipant = (identity: string, isHost: boolean, localDataTrack: LocalDataTrack | null) => {
    if (!isHost || !localDataTrack) return;

    const message = {
      type: 'kick',
      target: identity
    };

    localDataTrack.send(JSON.stringify(message));
    console.log('👢 Kicked participant:', identity);
  };

  return {
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
  };
}