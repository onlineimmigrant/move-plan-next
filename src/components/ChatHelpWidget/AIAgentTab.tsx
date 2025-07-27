// components/ChatHelpWidget/AIAgentTab.tsx
'use client';
import { useState, useRef, useEffect } from 'react';
import { PaperAirplaneIcon, SparklesIcon, UserIcon } from '@heroicons/react/24/outline';
import { WidgetSize } from '../ChatWidget/types';
import { useHelpCenterTranslations } from './useHelpCenterTranslations';

interface AIAgentTabProps {
  isAuthenticated: boolean;
  userId: string | null;
  accessToken: string | null;
  size: WidgetSize;
  goToLogin: () => void;
  goToRegister: () => void;
}

interface AIMessage {
  id: number;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

export default function AIAgentTab({
  isAuthenticated,
  userId,
  accessToken,
  size,
  goToLogin,
  goToRegister,
}: AIAgentTabProps) {
  const { t } = useHelpCenterTranslations();
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: 1,
      content: t.getHelpAI,
      sender: 'ai',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
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

    const userMessage: AIMessage = {
      id: Date.now(),
      content: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      let aiResponse = '';
      const input = currentInput.toLowerCase();
      
      if (input.includes('how') || input.includes('what') || input.includes('why')) {
        aiResponse = `Great question! Regarding "${currentInput}", let me provide you with a comprehensive answer. `;
        
        if (input.includes('account') || input.includes('login')) {
          aiResponse += 'For account-related queries, you can manage your settings through the account dashboard. Here are the key steps: 1) Navigate to account settings, 2) Update your preferences, 3) Save changes. Would you like me to guide you through any specific account feature?';
        } else if (input.includes('api') || input.includes('integration')) {
          aiResponse += 'Our API offers extensive integration capabilities. You can authenticate using OAuth 2.0, access REST endpoints, and utilize webhooks for real-time updates. Check our developer documentation for detailed examples and best practices.';
        } else if (input.includes('troubleshoot') || input.includes('error') || input.includes('problem')) {
          aiResponse += 'I can help you troubleshoot this issue systematically. Let\'s start by identifying the exact error message and when it occurs. Common solutions include clearing cache, checking network connectivity, or updating your browser. What specific error are you encountering?';
        } else {
          aiResponse += 'Based on your query, I recommend checking our knowledge base for detailed information. I can also connect you with specialized support if needed. Is there a particular aspect you\'d like me to elaborate on?';
        }
      } else if (input.includes('help') || input.includes('support')) {
        aiResponse = 'I\'m here to help! I can assist with various topics including account management, technical issues, feature explanations, and more. What specific area would you like assistance with? I can provide step-by-step guidance or connect you with human support if needed.';
      } else {
        aiResponse = `I understand you're asking about "${currentInput}". Let me provide you with relevant information and suggestions. If this is a complex technical issue, I can break it down into manageable steps or escalate to our technical team if needed.`;
      }

      const botResponse: AIMessage = {
        id: Date.now() + 1,
        content: aiResponse,
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1500 + Math.random() * 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickActions = [
    'How do I reset my password?',
    'Explain the subscription plans',
    'Help with API integration',
    'Troubleshoot login issues',
    'What are the premium features?',
  ];

  return (
    <div className={`h-full flex flex-col ${size === 'fullscreen' ? 'max-w-4xl mx-auto' : ''}`}>
      {!isAuthenticated ? (
        <div className="h-full flex flex-col items-center justify-center p-6 text-center">
          <div className="p-4 bg-sky-100 rounded-full mb-4">
            <SparklesIcon className="h-8 w-8 text-sky-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">{t.loginRequired}</h3>
          <p className="text-gray-600 mb-6 max-w-sm">
            {t.pleaseLogin}
          </p>
          <div className="space-y-3 w-full max-w-xs">
            <button
              onClick={goToLogin}
              className="w-full bg-sky-500 text-white px-4 py-2 rounded-lg hover:bg-sky-600 transition-colors font-medium"
            >
              {t.login}
            </button>
            <button
              onClick={goToRegister}
              className="w-full bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors font-medium"
            >
              {t.signup}
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* AI Agent Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-sky-50 to-blue-50 border-b border-sky-200">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-sky-500 rounded-full">
                <SparklesIcon className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-sky-800">{t.aiAssistant}</h3>
                <p className="text-xs text-sky-600">{t.getHelpAI}</p>
              </div>
            </div>
          </div>

          {/* Quick Actions (show when no messages except welcome) */}
          {messages.length === 1 && (
            <div className="p-4 border-b border-gray-200">
              <p className="text-sm text-gray-600 mb-3">Quick questions you can ask:</p>
              <div className="space-y-2">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => setInputValue(action)}
                    className="w-full text-left p-2 text-sm bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-lg transition-colors"
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages Container */}
          <div className="flex-1 p-4 space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex items-start space-x-2 max-w-[85%] ${message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  <div className="flex-shrink-0 mt-1">
                    {message.sender === 'user' ? (
                      <UserIcon className="h-5 w-5 text-gray-600" />
                    ) : (
                      <div className="p-1 bg-sky-500 rounded-full">
                        <SparklesIcon className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-xs font-medium text-gray-600">
                        {message.sender === 'user' ? 'You' : 'AI Assistant'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className={`p-3 rounded-lg ${
                      message.sender === 'user'
                        ? 'bg-sky-500 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="flex items-start space-x-2 max-w-[85%]">
                  <div className="flex-shrink-0 mt-1">
                    <div className="p-1 bg-sky-500 rounded-full">
                      <SparklesIcon className="h-3 w-3 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-xs font-medium text-gray-600">AI Assistant</span>
                      <span className="text-xs text-gray-500">thinking...</span>
                    </div>
                    <div className="bg-gray-100 text-gray-800 p-3 rounded-lg">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-sky-400 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-sky-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                        <div className="w-2 h-2 bg-sky-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      </div>
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
                  placeholder={t.askQuestion}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent resize-none"
                  rows={1}
                  disabled={isTyping}
                />
              </div>
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isTyping}
                className="p-3 bg-gradient-to-r from-sky-500 to-blue-500 text-white rounded-lg hover:from-sky-600 hover:to-blue-600 transition-all duration-200 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed flex-shrink-0"
              >
                <PaperAirplaneIcon className="h-5 w-5" />
              </button>
            </div>
            
            <div className="mt-2 text-xs text-gray-500 text-center">
              <span>🤖 </span>
              {t.thinking}...
            </div>
          </div>
        </>
      )}
    </div>
  );
}
