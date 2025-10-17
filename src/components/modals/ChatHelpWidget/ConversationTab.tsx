// components/ChatHelpWidget/ConversationTab.tsx
'use client';
import { useState, useRef, useEffect } from 'react';
import { ArrowUpIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
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
      content: t.chatBotGreeting,
      sender: 'agent',
      timestamp: new Date(),
      agentName: 'ChatBot',
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connected');
  const [isTyping, setIsTyping] = useState(false);
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const quickReplies = [
    t.howToRegister,
    t.contactForm, 
    t.pricing,
    t.accountSettings,
    t.technicalSupport
  ];

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

  // Hide search input when user starts typing in the message field
  useEffect(() => {
    if (inputValue.trim() && showSearchInput) {
      setShowSearchInput(false);
      setSearchQuery('');
    }
  }, [inputValue]);

  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || inputValue;
    if (!textToSend.trim()) return;

    const userMessage: Message = {
      id: Date.now(),
      content: textToSend,
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
        content: getAgentResponse(textToSend),
        sender: 'agent',
        timestamp: new Date(),
        agentName: 'ChatBot',
      };
      setMessages(prev => [...prev, agentResponse]);
      setIsTyping(false);
    }, 1000 + Math.random() * 2000);
  };

  const handleQuickReply = (reply: string) => {
    handleSendMessage(reply);
  };

  const getAgentResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();
    
    // Live agent requests
    if (input.includes('live agent') || input.includes('human') || input.includes('real person') || input.includes('speak to someone') || input.includes('talk to agent') || input.includes('human agent') || input.includes('live support') || input.includes('live chat')) {
      return t.liveAgentUnavailable;
    }
    
    // Registration related
    if (input.includes('register') || input.includes('sign up') || input.includes('create account')) {
      return 'To create your account:\n\n1. Visit our registration page: [Sign Up](/register)\n2. Fill out your email, password, and basic information\n3. Verify your email address\n4. Complete your profile setup\n\nThe registration process typically takes less than 2 minutes. Need help with any specific step?';
    }
    
    
    // Contact form related
    if (input.includes('contact') || input.includes('contact form') || input.includes('get in touch')) {
      return 'You can reach our team through several channels:\n\n📧 Contact form: [Contact Us](/contact)\n💬 Live chat: Right here in this widget\n📞 Phone support: Available during business hours\n📱 Email support: Available through our contact page\n\nFor urgent issues, I recommend using this chat or our contact form for fastest response. What type of inquiry do you have?';
    }
    
    // Pricing related
    if (input.includes('pricing') || input.includes('price') || input.includes('cost') || input.includes('plan')) {
      return 'Our pricing plans are designed to fit different needs:\n\n� Starter Plan: For individuals getting started\n🚀 Professional Plan: Perfect for growing teams\n🏢 Enterprise Plan: Custom solutions for organizations\n\nAll plans include trial options. Visit our pricing page or contact us for detailed information and custom quotes.';
    }
    
    // Account settings
    if (input.includes('account') || input.includes('settings') || input.includes('profile')) {
      return 'I can help you with account management:\n\n⚙️ Profile settings and preferences\n🔐 Security and password settings\n💳 Billing and subscription management\n📧 Notification preferences\n🔄 Data management options\n\nWhat specific account setting would you like help with?';
    }
    
    // Technical support
    if (input.includes('technical') || input.includes('bug') || input.includes('error') || input.includes('not working')) {
      return 'I\'m here to help with technical issues. To better assist you:\n\n🔍 Describe the specific issue you\'re experiencing\n💻 Let me know your browser and device type\n📱 Tell me what you were trying to do\n📸 Share any error messages if available\n\nThe more details you provide, the faster we can resolve the issue!';
    }
    
    // Password/login issues
    if (input.includes('password') || input.includes('login') || input.includes('forgot') || input.includes('reset')) {
      return 'For login and password issues:\n\n🔐 **Password Reset:**\n1. Go to the login page\n2. Click "Forgot Password?"\n3. Enter your email address\n4. Check your email for reset instructions\n\n🔑 **Login Problems:**\n• Verify you\'re using the correct email\n• Check if Caps Lock is enabled\n• Try clearing your browser cache\n\nNeed additional help? [Contact our support team](/contact)';
    }
    
    // Billing related
    if (input.includes('billing') || input.includes('payment') || input.includes('invoice') || input.includes('subscription')) {
      return 'I can assist with billing inquiries:\n\n💳 **Payment Methods:** Manage payment options\n🧾 **Invoices:** Access billing history\n🔄 **Subscriptions:** Upgrade, modify, or cancel\n💰 **Billing Questions:** Charges and refunds\n📅 **Billing Cycles:** Payment scheduling\n\nFor detailed billing assistance, please [contact our support team](/contact).';
    }
    
    // General help
    if (input.includes('help') || input.includes('support') || input.includes('assistance')) {
      return 'I\'m here to help! I can assist you with:\n\n🆕 Getting started and account setup\n💰 Pricing and billing questions\n⚙️ Account settings and management\n🛠️ Technical support and troubleshooting\n📞 Connecting you with our support team\n\nWhat would you like help with today? Feel free to ask me anything!';
    }
    
    // Greeting responses
    if (input.includes('hello') || input.includes('hi') || input.includes('hey') || input.includes('good morning') || input.includes('good afternoon')) {
      return 'Hello! 👋 Welcome! I\'m your ChatBot assistant and I\'m here to help you with any questions or concerns you might have.\n\nI can help you with account setup, pricing information, technical support, and much more. What can I assist you with today?';
    }
    
    // Default response with context
    return `Thank you for your question about "${userInput}". I want to make sure I give you the most helpful response possible.\n\nCould you provide a bit more detail about what you\'re looking for? For example:\n• Account setup or registration help\n• Technical questions or troubleshooting\n• Pricing and billing information\n• General support assistance\n\nI\'m here to help with whatever you need! For additional support, you can also [contact our team](/contact). 😊`;
  };

  return (
    <div className={`h-full flex flex-col ${size === 'fullscreen' ? 'max-w-2xl mx-auto' : ''}`}>
      {/* Messages Container */}
      <div className="flex-1 p-6 space-y-4 overflow-y-auto pb-4">
        {messages.map((message) => (
          <div 
            key={message.id} 
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
          >
            <div
              className={`max-w-[85%] sm:max-w-[75%] lg:max-w-[65%] ${
                message.sender === 'user'
                  ? 'bg-blue-500 text-white rounded-2xl rounded-tr-sm shadow-md px-4 py-3'
                  : 'bg-white border border-slate-200 text-slate-800 rounded-2xl rounded-tl-sm shadow-sm px-4 py-3'
              } relative group hover:shadow-lg transition-all duration-200`}
            >
              <div className="mb-1.5 flex items-center gap-2">
                <span className={`text-xs font-medium ${
                  message.sender === 'user' ? 'text-white/90' : 'text-slate-600'
                }`}>
                  {message.sender === 'user' ? 'You' : message.agentName || 'ChatBot'}
                </span>
                <span className={`text-xs ${
                  message.sender === 'user' ? 'text-white/70' : 'text-slate-400'
                }`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="prose prose-sm max-w-none">
                <p className="text-sm whitespace-pre-wrap leading-relaxed m-0">{message.content}</p>
              </div>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="max-w-[85%] sm:max-w-[75%] lg:max-w-[65%] bg-white border border-slate-200 text-slate-800 rounded-2xl rounded-tl-sm shadow-sm px-4 py-3">
              <div className="mb-1.5 flex items-center gap-2">
                <span className="text-xs font-medium text-slate-600">ChatBot</span>
                <span className="text-xs text-slate-400">typing...</span>
              </div>
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white px-4 pb-4">
        {/* Quick Action Badges - Horizontal scrolling like ChatWidget */}
        <div className="mb-3 max-h-16 overflow-x-auto overflow-y-hidden -mx-1 px-1 py-1" 
          style={{
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(156, 163, 175, 0.5) rgba(241, 245, 249, 0.3)'
          }}
        >
          <style jsx>{`
            div::-webkit-scrollbar {
              height: 4px;
            }
            div::-webkit-scrollbar-track {
              background: rgba(241, 245, 249, 0.3);
              border-radius: 2px;
              margin: 0 0.5rem;
            }
            div::-webkit-scrollbar-thumb {
              background: rgba(156, 163, 175, 0.5);
              border-radius: 2px;
              transition: background-color 0.2s ease;
            }
            div::-webkit-scrollbar-thumb:hover {
              background: rgba(107, 114, 128, 0.7);
            }
          `}</style>
          <div className="flex items-center gap-2">
            {quickReplies
              .filter(reply => 
                !searchQuery.trim() || 
                reply.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map((reply, index) => (
              <button
                key={index}
                onClick={() => handleQuickReply(reply)}
                className="inline-flex items-center flex-shrink-0 whitespace-nowrap px-4 py-2 bg-slate-100 text-slate-600 text-sm font-medium rounded-full hover:bg-slate-200 transition-colors duration-200"
              >
                {reply}
              </button>
            ))}
          </div>
        </div>
        
        {/* Input Container - matching ChatWidget style */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 focus-within:border-blue-300 focus-within:ring-4 focus-within:ring-blue-100 transition-all duration-200">
          <div className="flex items-end gap-3">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                placeholder={t.typeMessage}
                className="w-full resize-none border-0 bg-transparent text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-0 text-base leading-relaxed min-h-[44px] max-h-[120px]"
                rows={1}
                disabled={isTyping}
              />
            </div>
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputValue.trim() || isTyping}
              className="flex items-center justify-center w-10 h-10 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-200 text-white rounded-xl shadow-sm hover:shadow-md disabled:shadow-none transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowUpIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Action buttons below input */}
          <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-2 flex-1">
              <button
                onClick={() => {
                  setShowSearchInput(!showSearchInput);
                  if (showSearchInput) {
                    setSearchQuery('');
                  }
                }}
                className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 ${
                  showSearchInput 
                    ? 'text-blue-600 bg-blue-50 hover:bg-blue-100'
                    : 'text-slate-500 hover:text-blue-600 hover:bg-blue-50'
                }`}
                title="Search actions"
              >
                <MagnifyingGlassIcon className="h-4 w-4" />
              </button>

              {/* Search Input - inline */}
              {showSearchInput && (
                <div className="flex-1 animate-in slide-in-from-left-2 duration-200">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                    placeholder="Search quick actions..."
                    autoFocus
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
