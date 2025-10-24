import { useState, useEffect, useCallback, useRef } from 'react';
import { LocalDataTrack } from 'twilio-video';
import { useToast } from '@/components/Shared/ToastContainer';

export interface ChatMessage {
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

export interface UseChatReturn {
  // Chat state
  showChat: boolean;
  chatMessages: ChatMessage[];
  chatInput: string;
  unreadCount: number;
  chatContainerRef: React.RefObject<HTMLDivElement>;
  fileInputRef: React.RefObject<HTMLInputElement>;

  // Chat actions
  toggleChat: () => void;
  sendChatMessage: () => void;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  addChatMessage: (message: ChatMessage) => void;
  setChatInput: (input: string) => void;
}

export const useChat = (
  roomName: string,
  participantName: string,
  localDataTrack: LocalDataTrack | null,
  isConnected: boolean,
  persistChat = true // allow opt-out for localStorage persistence
): UseChatReturn => {
  // Chat state
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    // Load chat history from localStorage on mount if enabled
    if (persistChat && typeof window !== 'undefined') {
      const stored = localStorage.getItem(`chat-history-${roomName}`);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          return parsed.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }));
        } catch (e) {
          console.error('Failed to parse chat history:', e);
        }
      }
    }
    return [];
  });
  const [chatInput, setChatInput] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { error: showErrorToast } = useToast();

  // Save chat history to localStorage whenever it changes
  useEffect(() => {
    if (!persistChat) return;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`chat-history-${roomName}`, JSON.stringify(chatMessages));
      } catch (e) {
        console.error('Failed to persist chat history:', e);
      }
    }
  }, [chatMessages, roomName, persistChat]);

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
  }, [isConnected, participantName, localDataTrack]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Add chat message
  const addChatMessage = useCallback((message: ChatMessage) => {
    setChatMessages(prev => {
      // Check if message already exists (prevent duplicates)
      const exists = prev.some(msg => 
        msg.id === message.id || 
        (msg.sender === message.sender && 
         msg.message === message.message && 
         Math.abs(msg.timestamp.getTime() - message.timestamp.getTime()) < 1000)
      );
      
      if (exists) {
        console.log('🚫 Duplicate message detected, skipping:', message);
        return prev;
      }
      
      console.log('✅ Adding new message:', message);
      return [...prev, message];
    });
    if (!showChat) {
      setUnreadCount(prev => prev + 1);
    }
  }, [showChat]);

  // Send chat message
  const sendChatMessage = useCallback(() => {
    if (!chatInput.trim() || !localDataTrack) {
      console.log('❌ Cannot send message: input empty or no data track');
      return;
    }

    console.log('📤 Attempting to send chat message:', chatInput.trim());
    const messageId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const message = {
      type: 'chatMessage',
      id: messageId,
      sender: participantName || 'You',
      text: chatInput.trim()
    };

    try {
      localDataTrack.send(JSON.stringify(message));
      console.log('✅ Chat message sent successfully via data track');

      // Add to local chat
      addChatMessage({
        id: messageId,
        sender: participantName || 'You',
        message: chatInput.trim(),
        timestamp: new Date(),
        isLocal: true,
        type: 'text'
      });

      setChatInput('');
    } catch (err) {
      console.error('❌ Error sending chat message:', err);
      showErrorToast('Failed to send message. Please try again.');
    }
  }, [chatInput, localDataTrack, participantName, addChatMessage]);

  // Handle file selection
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Limit file size to 50KB for reliable delivery (Twilio data track limit is ~16KB per message)
    // Base64 encoding increases size by ~33%, so 50KB raw data becomes ~66KB encoded
    if (file.size > 50 * 1024) {
      showErrorToast('File size must be less than 50KB for sharing. For larger files, consider using cloud storage and sharing links instead.');
      return;
    }

    // Convert file to base64
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      console.log('📎 File converted to base64, length:', base64.length);

      const messageId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      // Send file via chat message (simpler approach)
      const message = {
        type: 'chatMessage',
        id: messageId,
        sender: participantName || 'You',
        text: `Shared file: ${file.name}`,
        fileData: {
          name: file.name,
          size: file.size,
          type: file.type,
          data: base64.split(',')[1] // Send only the base64 data, not the full data URL
        }
      };

      // Send to all participants via data track
      if (localDataTrack) {
        try {
          const messageString = JSON.stringify(message);
          console.log('📎 Attempting to send file message, JSON size:', messageString.length, 'characters');
          
          // Check if message size exceeds Twilio data track limit (~16KB)
          // Allow up to 80KB for larger files (50KB raw + base64 overhead)
          if (messageString.length > 80000) {
            console.error('❌ Message too large for data track:', messageString.length, 'characters');
            showErrorToast('File is too large to send. Please choose a smaller file.');
            return;
          }
          
          localDataTrack.send(messageString);
          console.log('📎 ✅ File message sent successfully via data track:', file.name, 'size:', message.fileData.data.length);
          
          // Add to local chat
          addChatMessage({
            id: messageId,
            sender: participantName || 'You',
            message: `Shared file: ${file.name}`,
            timestamp: new Date(),
            isLocal: true,
            type: 'file',
            fileData: {
              name: file.name,
              size: file.size,
              type: file.type,
              url: base64 // Use the full data URL for local display
            }
          });
        } catch (err) {
          console.error('❌ Error sending file via data track:', err);
          showErrorToast('Failed to send file. The file may be too large or there may be a connection issue.');
          return;
        }
      } else {
        console.error('❌ No data track available for sending file');
        showErrorToast('Cannot send file - data track not available');
      }
    };
    reader.readAsDataURL(file);
  }, [localDataTrack, addChatMessage, participantName]);

  // Toggle chat
  const toggleChat = useCallback(() => {
    setShowChat(prev => !prev);
    if (!showChat) {
      setUnreadCount(0);
    }
  }, [showChat]);

  return {
    // Chat state
    showChat,
    chatMessages,
    chatInput,
    unreadCount,
    chatContainerRef,
    fileInputRef,

    // Chat actions
    toggleChat,
    sendChatMessage,
    handleFileSelect,
    addChatMessage,
    setChatInput,
  };
};