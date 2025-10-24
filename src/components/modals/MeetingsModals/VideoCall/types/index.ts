import { RemoteVideoTrack, RemoteAudioTrack } from 'twilio-video';

export interface VideoCallProps {
  token: string;
  roomName: string;
  onLeave: () => void;
  participantName?: string;
}

export interface Participant {
  identity: string;
  videoTrack?: RemoteVideoTrack;
  audioTrack?: RemoteAudioTrack;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
}

export interface RemoteParticipantVideoProps {
  participant: Participant;
  isFullscreen?: boolean;
  onPin?: () => void;
  isPinned?: boolean;
}

export interface ChatMessage {
  id: string;
  sender: string;
  message: string;
  timestamp: Date;
}

export interface Reaction {
  id: string;
  emoji: string;
  sender: string;
  timestamp: Date;
}