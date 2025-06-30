'use client';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { RocketLaunchIcon, XMarkIcon, ArrowsPointingOutIcon, ArrowsPointingInIcon, MagnifyingGlassIcon, BookmarkIcon, ArrowUpIcon } from '@heroicons/react/24/outline';
import { Combobox, Popover, Transition } from '@headlessui/react';
import Tooltip from '@/components/Tooltip';
import Link from 'next/link';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Message {
  role: string;
  content: string;
}

interface ChatHistory {
  id: number;
  name: string;
  messages: Message[];
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [size, setSize] = useState<'default' | 'half' | 'full'>('default');
  const [historyName, setHistoryName] = useState('');
  const [chatHistories, setChatHistories] = useState<ChatHistory[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [query, setQuery] = useState('');
  const [modelName, setModelName] = useState('Grok 3');
  const [fullModelName, setFullModelName] = useState('grok-3-latest');
  const [maxTokens, setMaxTokens] = useState(4096);
  const [modelIcon, setModelIcon] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();

  // Scroll to the bottom of the messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Auto-resize textarea
  useEffect(() => {
    const textarea = inputRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [input]);

  // Listen for addToChat event
  useEffect(() => {
    const handleAddToChat = (event: Event) => {
      if (event instanceof CustomEvent && event.detail) {
        console.log('ChatWidget: Received addToChat event with text:', event.detail);
        setInput((prev) => (prev ? `${prev}\n${event.detail}` : event.detail));
        setIsOpen(true);
      }
    };

    window.addEventListener('addToChat', handleAddToChat);
    return () => window.removeEventListener('addToChat', handleAddToChat);
  }, []);

  // Listen for modelChanged event
  useEffect(() => {
    const handleModelChanged = (event: Event) => {
      if (event instanceof CustomEvent && event.detail) {
        console.log('ChatWidget: Received modelChanged event:', event.detail);
        const { name, max_tokens, icon } = event.detail;
        setFullModelName(name);
        setModelName(name.split('-').slice(0, -1).join(' '));
        setMaxTokens(max_tokens || 4096);
        setModelIcon(icon);
        setError(null); // Clear any previous model-related errors
      }
    };

    window.addEventListener('modelChanged', handleModelChanged);
    return () => window.removeEventListener('modelChanged', handleModelChanged);
  }, []);

  // Fetch chat histories and initial model details
  useEffect(() => {
    const fetchData = async () => {
      if (!isAuthenticated || !accessToken) return;
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('Auth error:', authError?.message);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (profileError || !profile) {
        console.error('Profile fetch error:', profileError?.message);
        setError('Profile not found. Please contact support.');
        return;
      }

      const { data: histories, error: historiesError } = await supabase
        .from('ai_chat_histories')
        .select('id, name, messages')
        .eq('user_id', profile.id);

      if (historiesError) {
        console.error('Fetch histories error:', historiesError.message);
        setError('Failed to load chat histories');
      } else {
        setChatHistories(histories || []);
      }

      let name = 'grok-3-latest';
      let maxTokensValue = 4096;
      let icon: string | null = null;
      const { data: settingsData, error: settingsError } = await supabase
        .from('ai_user_settings')
        .select('default_model_id, user_model_id, selected_model_type')
        .eq('user_id', user.id)
        .single();

      if (settingsError || !settingsData) {
        console.error('Settings fetch error:', settingsError?.message);
        setError('User settings not found. Using default model.');
      } else {
        const settings = settingsData;
        if (settings.selected_model_type === 'default' && settings.default_model_id) {
          const { data: defaultModel, error: defaultError } = await supabase
            .from('ai_models_default')
            .select('name, max_tokens, icon')
            .eq('id', settings.default_model_id)
            .single();

          if (!defaultError && defaultModel?.name) {
            name = defaultModel.name;
            maxTokensValue = defaultModel.max_tokens || maxTokensValue;
            icon = defaultModel.icon;
          } else {
            console.error('Default model fetch error:', defaultError?.message);
            setError('Default model not found. Using fallback model.');
          }
        } else if (settings.selected_model_type === 'user' && settings.user_model_id) {
          const { data: userModel, error: userModelError } = await supabase
            .from('ai_models')
            .select('name, max_tokens')
            .eq('id', settings.user_model_id)
            .eq('user_id', user.id)
            .single();

          if (!userModelError && userModel?.name) {
            name = userModel.name;
            maxTokensValue = userModel.max_tokens || maxTokensValue;
          } else {
            console.error('User model fetch error:', userModelError?.message);
            setError('User model not found. Using fallback model.');
          }
        } else {
          console.error('Invalid settings: No valid model ID found');
          setError('No valid model selected. Please configure in settings.');
        }
      }

      setFullModelName(name);
      setModelName(name.split('-').slice(0, -1).join(' '));
      setMaxTokens(maxTokensValue);
      setModelIcon(icon);
    };
    fetchData();
  }, [isAuthenticated, accessToken]);

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session?.user) {
        setIsAuthenticated(false);
        setAccessToken(null);
        console.error('Client auth error:', error?.message || 'No session found');
      } else {
        setIsAuthenticated(true);
        setAccessToken(session.access_token);
        console.log('Client access token:', session.access_token);
      }
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session?.user);
      setAccessToken(session?.access_token || null);
      console.log('Auth state changed, access token:', session?.access_token);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Scroll to bottom when messages or typing state changes
  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    if (!isAuthenticated || !accessToken) {
      setError('Please log in to use the chat.');
      return;
    }
    setError(null);
    const newMessage = { role: 'user', content: input };
    setMessages((prev) => [...prev, newMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await axios.post(
        '/api/chat',
        { messages: [...messages, newMessage] },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      setMessages((prev) => [...prev, { role: 'assistant', content: response.data.message }]);
      setIsTyping(false);
    } catch (error: any) {
      console.error('Chat widget error:', error.message, error.response?.data);
      const errorMsg = error.response?.data?.error || 'Failed to send message';
      if (errorMsg === 'No model selected') {
        setError('No AI model selected. Please choose a model in your account settings.');
      } else if (errorMsg.includes('No default model available')) {
        setError('No AI model available. Please contact your administrator or set up a model.');
      } else if (error.response?.status === 429) {
        setError('Rate limit exceeded. Please try again later.');
      } else {
        setError(errorMsg);
      }
      setMessages((prev) => [...prev, { role: 'assistant', content: errorMsg }]);
      setIsTyping(false);
    }
  };

  const saveChatHistory = async () => {
    if (messages.length === 0) {
      setError('No messages to save.');
      return;
    }
    if (!isAuthenticated || !accessToken) {
      setError('Please log in to save chat history.');
      return;
    }
    setError(null);

    if (!historyName.trim()) {
      setShowSaveInput(false);
      return;
    }

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user?.id)
        .single();

      if (profileError || !profile) {
        console.error('Profile fetch error:', profileError?.message);
        setError('Profile not found. Please contact support.');
        setIsSaving(false);
        return;
      }

      const { error } = await supabase
        .from('ai_chat_histories')
        .insert({
          user_id: profile.id,
          name: historyName,
          messages,
        });
      if (error) {
        console.error('Save history error:', error.message);
        setError('Failed to save chat history: ' + error.message);
      } else {
        const { data: newHistories } = await supabase
          .from('ai_chat_histories')
          .select('id, name, messages')
          .eq('user_id', profile.id);
        setChatHistories(newHistories || []);
        setHistoryName('');
        setShowSaveInput(false);
        setError(null);
        alert('Chat history saved successfully!');
      }
    } catch (error: any) {
      console.error('Save history error:', error.message);
      setError('Failed to save chat history');
    } finally {
      setIsSaving(false);
    }
  };

  const loadChatHistory = (history: ChatHistory | null) => {
    if (history) {
      setMessages(history.messages);
      setQuery('');
      setShowSearchInput(false);
      setError(null);
    }
  };

  const toggleSearchInput = () => {
    setShowSearchInput((prev) => !prev);
    setShowSaveInput(false);
    setQuery('');
  };

  const toggleSaveInput = () => {
    setShowSaveInput((prev) => !prev);
    setShowSearchInput(false);
    setHistoryName('');
  };

  const goToSettings = () => {
    router.push('/account/ai');
  };

  const goToAdmin = () => {
    router.push('/admin/ai/management');
  };

  const toggleSize = () => {
    setSize((prev) => {
      if (prev === 'default') return 'half';
      if (prev === 'half') return 'full';
      return 'default';
    });
  };

  const sizeClasses = {
    default: 'w-100 max-h-[70vh]',
    half: 'w-1/2 max-h-[80vh]',
    full: 'w-[80vw] max-h-[80vh]',
  };

  const filteredHistories = query
    ? chatHistories.filter((history) =>
        history.name.toLowerCase().includes(query.toLowerCase())
      )
    : chatHistories;

  return (
    <div className="z-62">
      <Tooltip content={isOpen ? 'Close Chat' : 'Open Chat'}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="cursor-pointer fixed bottom-4 right-4 bg-sky-500 text-white p-4 rounded-full shadow-lg z-61 hover:bg-sky-600 transition-colors"
        >
          <RocketLaunchIcon className="h-6 w-6" />
        </button>
      </Tooltip>
      {isOpen && (
        <div
          className={`fixed bottom-24 right-4 bg-white border-2 border-gray-200 rounded-lg shadow-sm flex flex-col transition-all duration-300 ${sizeClasses[size]}`}
        >
          <div className="flex justify-between items-center mb-2 bg-gray-50 px-4 shadow rounded-t-lg">
            <Tooltip
              content={
                size === 'default'
                  ? 'Expand'
                  : size === 'half'
                  ? 'Expand Full'
                  : 'Shrink'
              }
            >
              <button
                onClick={toggleSize}
                className="cursor-pointer text-sky-500 hover:text-sky-700 p-1"
              >
                {size === 'full' ? (
                  <ArrowsPointingInIcon className="h-5 w-5" />
                ) : (
                  <ArrowsPointingOutIcon className="h-5 w-5" />
                )}
              </button>
            </Tooltip>
            <div className="flex items-center space-x-2">
              <Popover className="relative">
                <Tooltip content="Model Info">
                  <Popover.Button className="cursor-pointer border-2 border-gray-50 rounded-full p-2">
                    {modelIcon ? (
                      <img
                        src={modelIcon}
                        alt="Model Icon"
                        className="h-8 w-8 object-contain"
                        onError={() => setModelIcon(null)}
                      />
                    ) : (
                      <RocketLaunchIcon className="h-6 w-6 text-gray-400 font-bold" />
                    )}
                  </Popover.Button>
                </Tooltip>
                <Transition
                  enter="transition ease-out duration-100"
                  enterFrom="opacity-0 scale-95"
                  enterTo="opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="opacity-100 scale-100"
                  leaveTo="opacity-0 scale-95"
                >
                  <Popover.Panel className="absolute z-10 left-full sm:right-full ml-2 top-1/2 transform -translate-y-1/2 w-48 bg-white rounded-md shadow-lg ring-1 ring-gray-200 focus:outline-none">
                    <div className="p-4">
                      <div className="text-sm text-gray-800">
                        <p>Model: {fullModelName}</p>
                        <p>Tokens: {maxTokens}</p>
                      </div>
                      <hr className="border-gray-200 my-4" />
                      <Link
                        href="/account/ai"
                        className="text-sm text-sky-500 hover:underline block"
                      >
                        Model Settings
                      </Link>
                      <hr className="border-gray-200 my-4" />
                      <Link
                        href="/account/ai"
                        className="text-sm text-sky-500 hover:underline block"
                      >
                        Change Model
                      </Link>
                    </div>
                  </Popover.Panel>
                </Transition>
              </Popover>
            </div>
            <Tooltip content="Close">
              <button
                onClick={() => setIsOpen(false)}
                className="cursor-pointer text-sky-500 hover:text-sky-700 p-1"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </Tooltip>
          </div>
          {error && (
            <div className="text-red-500 mb-2">
              {error}
              {error.includes('No AI model selected') && (
                <button
                  onClick={goToSettings}
                  className="ml-2 text-sky-500 underline"
                >
                  Go to Settings
                </button>
              )}
              {error.includes('No default model available') && (
                <button
                  onClick={goToAdmin}
                  className="ml-2 text-sky-500 underline"
                >
                  Go to Admin
                </button>
              )}
            </div>
          )}
          {!isAuthenticated && (
            <div className="text-red-500 mb-2">Please log in to use the chat.</div>
          )}
          <div className="flex-1 overflow-y-auto mb-4 p-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`mb-2 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}
              >
                <span
                  className={`inline-block p-4 rounded ${
                    msg.role === 'user' ? 'bg-sky-100' : 'bg-gray-50'
                  }`}
                  dangerouslySetInnerHTML={{
                    __html: msg.role === 'assistant' ? msg.content : msg.content.replace(/\n/g, '<br>'),
                  }}
                />
              </div>
            ))}
            {isTyping && (
              <div className="text-left mb-2">
                <span className="inline-block p-2 rounded bg-gray-100">
                  <span className="typing-dots">Typing<span>.</span><span>.</span><span>.</span></span>
                </span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="flex flex-col px-4 pb-4">
            <div className="border border-gray-200 rounded-xl bg-gray-50 p-2">
              <div className="flex items-end">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
                  className="rounded p-2 flex-grow resize-none focus:outline-none bg-gray-50"
                  placeholder="Ask..."
                  disabled={!isAuthenticated || isTyping}
                  rows={1}
                />
                <Tooltip content="Send">
                  <button
                    onClick={sendMessage}
                    className="cursor-pointer bg-gray-100 text-gray-600 p-2 rounded-full ml-2 disabled:bg-gray-200 hover:bg-gray-200 transition-colors"
                    disabled={!isAuthenticated || isTyping || !input.trim()}
                  >
                    <ArrowUpIcon className="h-5 w-5" />
                  </button>
                </Tooltip>
              </div>
              <div className="flex justify-start space-x-2 mt-2">
                <Tooltip content="Search History">
                  <button
                    onClick={toggleSearchInput}
                    className="cursor-pointer bg-gray-100 text-gray-600 p-2 rounded-full disabled:bg-gray-200 hover:bg-gray-200 transition-colors"
                    disabled={!isAuthenticated}
                  >
                    <MagnifyingGlassIcon className="h-5 w-5" />
                  </button>
                </Tooltip>
                <Tooltip content="Save History">
                  <button
                    onClick={toggleSaveInput}
                    className="cursor-pointer bg-gray-100 text-gray-600 p-2 rounded-full disabled:bg-gray-200 hover:bg-gray-200 transition-colors"
                    disabled={!isAuthenticated}
                  >
                    <BookmarkIcon className="h-5 w-5" />
                  </button>
                </Tooltip>
              </div>
            </div>
            {showSearchInput && (
              <div className="mt-2 relative">
                <Combobox value={null} onChange={loadChatHistory}>
                  <Combobox.Input
                    className="cursor-pointer rounded p-2 w-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search history"
                    value={query}
                  />
                  <Combobox.Options className="absolute bottom-full mb-1 max-h-60 w-[calc(100%-2rem)] overflow-auto rounded-md bg-white py-1 shadow-lg ring-1 ring-gray-200 ring-opacity-5 focus:outline-none">
                    {filteredHistories.length === 0 && query !== '' ? (
                      <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                        No chat histories found.
                      </div>
                    ) : (
                      filteredHistories.map((history) => (
                        <Combobox.Option
                          key={history.id}
                          value={history}
                          className={({ active }) =>
                            `relative cursor-pointer select-none py-2 px-4 ${
                              active ? 'bg-sky-100 text-sky-900' : 'text-gray-900'
                            }`
                          }
                        >
                          {history.name}
                        </Combobox.Option>
                      ))
                    )}
                  </Combobox.Options>
                </Combobox>
              </div>
            )}
            {showSaveInput && (
              <div className="mt-2 flex items-center space-x-2">
                <input
                  type="text"
                  value={historyName}
                  onChange={(e) => setHistoryName(e.target.value)}
                  className="rounded p-2 flex-grow bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="Name your chat history"
                  disabled={!isAuthenticated || isSaving}
                />
                <Tooltip content="Save or Close">
                  <button
                    onClick={saveChatHistory}
                    className="bg-teal-500 text-white p-2 rounded-full disabled:bg-gray-200 hover:bg-teal-600 transition-colors"
                    disabled={!isAuthenticated || isSaving}
                  >
                    {isSaving ? (
                      <span className="text-sm">...</span>
                    ) : (
                      <BookmarkIcon className="h-5 w-5" />
                    )}
                  </button>
                </Tooltip>
              </div>
            )}
          </div>
        </div>
      )}
      <style jsx>{`
        .typing-dots span {
          animation: blink 1s infinite;
        }
        .typing-dots span:nth-child(2) {
          animation-delay: 0.2s;
        }
        .typing-dots span:nth-child(3) {
          animation-delay: 0.4s;
        }
        @keyframes blink {
          0% { opacity: 0.2; }
          50% { opacity: 1; }
          100% { opacity: 0.2; }
        }
      `}</style>
    </div>
  );
}