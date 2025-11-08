import { useEffect, RefObject } from 'react';
import { LocalDataTrack } from 'twilio-video';

interface ChatMessage {
  id: string;
  sender: string;
  message: string;
  timestamp: Date;
  isLocal: boolean;
  type?: 'text' | 'file';
  fileData?: {
    name: string;
    size: number;
    type: string;
    url: string;
  };
}

/**
 * Custom hook to handle chat history persistence and auto-scroll
 */
export function useChatHistory(
  chatMessages: ChatMessage[],
  roomName: string,
  isConnected: boolean,
  localDataTrack: LocalDataTrack | null,
  participantName: string | undefined,
  chatContainerRef: RefObject<HTMLDivElement>
) {
  // Save chat history to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined' && chatMessages.length > 0) {
      localStorage.setItem(`chat-history-${roomName}`, JSON.stringify(chatMessages));
    }
  }, [chatMessages, roomName]);
  
  // Request chat history when joining room
  useEffect(() => {
    if (isConnected && localDataTrack) {
      // Wait a bit for others to connect
      const timer = setTimeout(() => {
        if (localDataTrack) {
          const message = {
            type: 'requestChatHistory',
            requester: participantName || 'Anonymous'
          };
          localDataTrack.send(JSON.stringify(message));
          console.log('📜 Requested chat history');
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isConnected, localDataTrack, participantName]);
  
  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages, chatContainerRef]);
}
