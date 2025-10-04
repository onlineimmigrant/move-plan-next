// components/ChatHelpWidget/ConversationTab.tsx
'use client';
import { useState, useRef, useEffect } from 'react';
import { PaperAirplaneIcon, UserIcon, UserCircleIcon, ArrowUpIcon, ChatBubbleOvalLeftEllipsisIcon } from '@heroicons/react/24/outline';
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

  const getMessageIcon = (sender: string) => {
    if (sender === 'user') {
      return <UserIcon className="h-5 w-5" />;
    } else {
      return <ChatBubbleOvalLeftEllipsisIcon className="h-5 w-5" />;
    }
  };

  return (
    <div className={`h-full flex flex-col ${size === 'fullscreen' ? 'max-w-2xl mx-auto' : ''}`}>
      {/* Messages Container */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto pb-4">
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
                  {message.sender === 'user' ? 'You' : message.agentName || 'ChatBot'}
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
              <ChatBubbleOvalLeftEllipsisIcon className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-sm font-medium text-gray-800">ChatBot</span>
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
        {/* Quick Action Badges */}
        <div className="mb-3">
          <div className="flex flex-wrap gap-2 justify-center">
            {quickReplies.map((reply, index) => (
              <button
                key={index}
                onClick={() => handleQuickReply(reply)}
                className="px-4 py-2 bg-white text-gray-700 text-sm rounded-full border border-gray-200 hover:border-gray-300 transition-all duration-200 font-medium"
              >
                {reply}
              </button>
            ))}
          </div>
        </div>
        
        <div className="border border-gray-200 rounded-xl bg-gray-50 p-2">
          <div className="flex items-end">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
              placeholder={t.typeMessage}
              className="rounded p-2 flex-grow resize-none focus:outline-none bg-gray-50"
              rows={1}
              disabled={isTyping}
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputValue.trim() || isTyping}
              className="cursor-pointer bg-gray-100 text-gray-600 p-2 rounded-full ml-2 disabled:bg-gray-200 hover:bg-gray-200 transition-colors"
            >
              <ArrowUpIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        <div className="mt-2 text-xs text-gray-500 text-center">
          <a 
            href="/contact" 
            className="text-sky-600 hover:text-sky-700 underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t.needMoreHelp}
          </a>
        </div>
      </div>
    </div>
  );
}
