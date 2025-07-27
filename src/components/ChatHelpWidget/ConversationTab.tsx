// components/ChatHelpWidget/ConversationTab.tsx
'use client';
import { useState, useRef, useEffect } from 'react';
import { PaperAirplaneIcon, UserIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { WidgetSize } from '../ChatWidget/types';
import { useHelpCenterTranslations } from './useHelpCenterTranslations';

interface ConversationTabProps {
  isAuthenticated: boolean;
  userId: string | null;
  accessToken: string | null;
  size: WidgetSize;
}

interface Message {
  id: number;
  content: string;
  sender: 'user' | 'agent';
  timestamp: Date;
  agentName?: string;
}

type ConnectionStatus = 'connected' | 'connecting' | 'disconnected';

export default function ConversationTab({
  isAuthenticated,
  userId,
  accessToken,
  size,
}: ConversationTabProps) {
  const { t } = useHelpCenterTranslations();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      content: t.chatSupportTeam,
      sender: 'agent',
      timestamp: new Date(),
      agentName: 'Sarah',
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connected');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = inputRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [inputValue]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now(),
      content: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate agent response
    setTimeout(() => {
      const agentResponse: Message = {
        id: Date.now() + 1,
        content: getAgentResponse(inputValue),
        sender: 'agent',
        timestamp: new Date(),
        agentName: 'Sarah',
      };
      setMessages(prev => [...prev, agentResponse]);
      setIsTyping(false);
    }, 1000 + Math.random() * 2000);
  };

  const getAgentResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();
    
    if (input.includes('help') || input.includes('support')) {
      return 'I\'d be happy to help you! Can you please provide more details about what specific issue or question you have? This will help me assist you better.';
    } else if (input.includes('account') || input.includes('login')) {
      return 'I can help you with account-related issues. Are you having trouble logging in, or do you need help with account settings? Let me know the specific problem you\'re experiencing.';
    } else if (input.includes('password') || input.includes('reset')) {
      return 'For password issues, I can guide you through the reset process. Would you like me to send a password reset link to your registered email address?';
    } else if (input.includes('billing') || input.includes('payment')) {
      return 'For billing and payment inquiries, I can help you check your current plan, update payment methods, or address billing issues. What specifically would you like to know about your billing?';
    } else if (input.includes('bug') || input.includes('error')) {
      return 'I\'m sorry to hear you\'re experiencing an issue. Can you please describe the error you\'re seeing in detail? Include any error messages and the steps you took before the issue occurred.';
    } else {
      return 'Thank you for your message. I understand you\'re asking about "' + userInput + '". Let me help you with that. Could you provide a bit more context so I can give you the most accurate assistance?';
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getMessageIcon = (sender: string) => {
    if (sender === 'user') {
      return <UserIcon className="h-5 w-5" />;
    } else {
      return <UserCircleIcon className="h-5 w-5" />;
    }
  };

  return (
    <div className={`h-full flex flex-col ${size === 'fullscreen' ? 'max-w-4xl mx-auto' : ''}`}>
      {/* Conversation Header */}
      <div className="px-4 py-3 bg-sky-50 border-b border-sky-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-sky-800">{t.liveSupport}</h3>
            <p className="text-xs text-sky-600">
              {isAuthenticated ? t.chatSupportTeam : t.chatSupportTeam}
            </p>
          </div>
          <div className={`w-3 h-3 rounded-full ${
            connectionStatus === 'connected' ? 'bg-green-500' :
            connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
          }`} />
        </div>
        <div className="mt-1">
          <span className="text-sm text-gray-600">
            {connectionStatus === 'connected' ? t.online :
             connectionStatus === 'connecting' ? t.connecting : t.offline}
          </span>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className="flex items-start space-x-2">
            <div className={`p-2 rounded-full ${
              message.sender === 'user' ? 'bg-blue-500 text-white' : 'bg-sky-500 text-white'
            }`}>
              {getMessageIcon(message.sender)}
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-sm font-medium text-gray-800">
                  {message.sender === 'user' ? 'You' : message.agentName || 'Support'}
                </span>
                <span className="text-xs text-gray-500">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className={`p-3 rounded-lg ${
                message.sender === 'user'
                  ? 'bg-blue-500 text-white ml-8'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex items-start space-x-2">
            <div className="p-2 rounded-full bg-sky-500 text-white">
              <UserCircleIcon className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-sm font-medium text-gray-800">Support</span>
                <span className="text-xs text-gray-500">typing...</span>
              </div>
              <div className="bg-gray-100 text-gray-800 p-3 rounded-lg">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex items-end space-x-2">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={t.typeMessage}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent resize-none"
              rows={1}
              disabled={isTyping}
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isTyping}
            className="p-3 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex-shrink-0"
          >
            <PaperAirplaneIcon className="h-5 w-5" />
          </button>
        </div>
        
        <div className="mt-2 text-xs text-gray-500 text-center">
          {isAuthenticated 
            ? t.needMoreHelp
            : t.needMoreHelp
          }
        </div>
      </div>
    </div>
  );
}
