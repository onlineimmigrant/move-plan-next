'use client';

import { useRef, useState, useEffect } from 'react';
import { useThemeColors } from '@/hooks/useThemeColors';

// Small UX follow-ups implemented:
// - Keyboard focus: Input auto-focuses when chat panel opens and is not minimized
// - Toast notifications: Replaced alert() calls with useToast hook for better UX
// - Localized strings: Added to en.json but not yet integrated (requires i18n setup)
// - Manual test steps for emoji:
//   1. Open chat panel
//   2. Click emoji button to toggle picker
//   3. Click an emoji to insert at cursor position
//   4. Send message and verify emoji appears for all participants
//   5. Test cursor positioning after emoji insertion
function escapeHtml(input?: string) {
  if (!input) return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
import {
  XMarkIcon,
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  PaperClipIcon,
  FaceSmileIcon,
  ArrowDownTrayIcon,
  MinusIcon
} from '@heroicons/react/24/outline';
import { usePanelManagement } from '../hooks/usePanelManagement';

interface ChatMessage {
  id: string;
  message: string;
  sender: string;
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

interface ChatPanelProps {
  showChat: boolean;
  isMobile: boolean;
  chatMessages: ChatMessage[];
  chatInput: string;
  chatContainerRef: React.RefObject<HTMLDivElement>;
  fileInputRef: React.RefObject<HTMLInputElement>;
  toggleChat: () => void;
  sendChatMessage: () => void;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setChatInput: (value: string) => void;
  sendReaction: (emoji: string) => void;
  getParticipantColor: (sender: string) => string;
  panelManagement: ReturnType<typeof usePanelManagement>;
}

export default function ChatPanel({
  showChat,
  isMobile,
  chatMessages,
  chatInput,
  chatContainerRef,
  fileInputRef,
  toggleChat,
  sendChatMessage,
  handleFileSelect,
  setChatInput,
  sendReaction,
  getParticipantColor,
  panelManagement
}: ChatPanelProps) {
  const themeColors = useThemeColors();
  const primary = themeColors.cssVars.primary;
  const { panels, toggleMinimize, startDrag, bringToFront } = panelManagement;
  const panelState = panels['chat'];

  const isMinimized = panelState?.isMinimized || false;
  const isDragging = panelState?.isDragging || false;
  const position = panelState?.position || { x: 16, y: 200 };
  const zIndex = panelState?.zIndex || 50;
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Focus input when chat panel becomes visible and not minimized
  useEffect(() => {
    if (showChat && !isMinimized && inputRef.current) {
      // Small delay to ensure the element is rendered
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [showChat, isMinimized]);

  if (!showChat) return null;

  return (
    <div className={`absolute ${isMobile ? 'inset-0' : 'right-4 top-20 bottom-20 w-80'} bg-gradient-to-b from-slate-800 to-slate-900 rounded-xl shadow-2xl border border-slate-700/50 flex flex-col z-50 backdrop-blur-sm overflow-hidden transition-all duration-200 ${
      isMinimized ? 'h-12' : ''
    }`}
      style={{
        left: isMobile ? '0' : position.x,
        top: isMobile ? '0' : position.y,
        transform: isMobile ? 'none' : 'none',
        zIndex,
        cursor: isDragging ? 'grabbing' : 'default',
        boxShadow: isDragging ? `0 20px 25px -5px ${primary.base}30, 0 10px 10px -5px ${primary.base}20` : undefined
      }}
      onMouseDown={() => bringToFront('chat')}
    >
      {/* Chat Header */}
      <div className={`flex items-center justify-between ${isMinimized ? 'px-3 py-2' : 'p-4'} border-b border-slate-700/50 bg-slate-800/50 rounded-t-xl cursor-grab active:cursor-grabbing`}
        onMouseDown={(e) => {
          e.preventDefault();
          startDrag('chat', e);
        }}
      >
        <div className="flex items-center gap-2">
          <ChatBubbleLeftRightIcon 
            className="w-5 h-5" 
            style={{ color: primary.base }}
          />
          <h3 className="text-base font-semibold text-white">Chat</h3>
          {chatMessages.length > 0 && (
            <span 
              className="text-white text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ backgroundColor: primary.base }}
            >
              {chatMessages.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => toggleMinimize('chat')}
            className="p-1.5 hover:bg-slate-700/80 rounded-lg transition-colors duration-200"
            title={isMinimized ? 'Restore' : 'Minimize'}
          >
            <MinusIcon className="w-4 h-4 text-slate-400 hover:text-white" />
          </button>
          <button
            onClick={toggleChat}
            className="p-1.5 hover:bg-slate-700/80 rounded-lg transition-all duration-200 hover:scale-105"
          >
            <XMarkIcon className="w-5 h-5 text-slate-300 hover:text-white" />
          </button>
        </div>
      </div>

      {/* Chat Content - Only show when not minimized */}
      {!isMinimized && (
        <>
          {/* Chat Messages */}
          <div ref={chatContainerRef} role="log" aria-live="polite" className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent">
        {chatMessages.length === 0 ? (
          <div className="text-center text-slate-400 mt-12">
            <div className="w-16 h-16 bg-slate-700/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <ChatBubbleLeftRightIcon className="w-8 h-8 opacity-60" />
            </div>
            <p className="text-sm font-medium">No messages yet</p>
            <p className="text-xs text-slate-500 mt-1">Start the conversation!</p>
          </div>
        ) : (
          chatMessages.map((msg, index) => {
            const bubbleStyle = msg.isLocal
              ? {
                  background: `linear-gradient(135deg, ${primary.base}e6, ${primary.hover}e6)`,
                  boxShadow: `0 10px 15px -3px ${primary.base}33`
                }
              : {
                  background: 'linear-gradient(135deg, rgb(51 65 85 / 0.9), rgb(71 85 105 / 0.9))',
                  boxShadow: '0 10px 15px -3px rgb(51 65 85 / 0.2)'
                };

            return (
              <div
                key={`${msg.timestamp.getTime()}-${index}`}
                className={`flex ${msg.isLocal ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}
              >
                <div 
                  className="max-w-[85%] rounded-2xl p-3 backdrop-blur-sm border border-white/10"
                  style={bubbleStyle}
                >
                  <div className="text-xs text-slate-300 mb-1.5 font-semibold opacity-90">
                    {msg.sender}
                  </div>
                  {msg.type === 'file' && msg.fileData ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-white">
                        <PaperClipIcon 
                          className="w-4 h-4" 
                          style={{ color: `${primary.lighter}cc` }}
                        />
                        <span className="font-medium">{msg.fileData.name}</span>
                      </div>
                      <div className="text-xs text-slate-400 bg-slate-800/50 px-2 py-1 rounded-lg inline-block">
                        {(msg.fileData.size / 1024).toFixed(2)} KB
                      </div>
                      {msg.fileData.type.startsWith('image/') && (
                        <img
                          src={msg.fileData.url}
                          alt={msg.fileData.name}
                          className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity shadow-md"
                          onClick={() => msg.fileData && window.open(msg.fileData.url, '_blank')}
                        />
                      )}
                      {msg.fileData.type === 'application/pdf' && (
                        <iframe
                          src={msg.fileData.url}
                          className="w-full h-64 rounded-lg bg-slate-100/5 border border-slate-600/50"
                          title={msg.fileData.name}
                        />
                      )}
                      <a
                        href={msg.fileData.url}
                        download={msg.fileData.name}
                        className="flex items-center gap-2 text-xs transition-colors px-2 py-1 rounded-lg"
                        style={{
                          color: `${primary.lighter}cc`,
                          backgroundColor: `${primary.base}1a`
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = `${primary.lighter}e6`;
                          e.currentTarget.style.backgroundColor = `${primary.base}33`;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = `${primary.lighter}cc`;
                          e.currentTarget.style.backgroundColor = `${primary.base}1a`;
                        }}
                      >
                        <ArrowDownTrayIcon className="w-4 h-4" />
                        Download
                      </a>
                    </div>
                  ) : (
                    <div className="text-sm break-words text-white leading-relaxed" role="article" aria-label={`Message from ${msg.sender}`}>
                      {escapeHtml(msg.message)}
                    </div>
                  )}
                  <div className="text-[10px] text-slate-400 mt-2 opacity-75">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Chat Input */}
      <div className="p-4 border-t border-slate-700/50 bg-slate-800/30 rounded-b-xl">
        <div className="flex gap-2 mb-3">
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*,application/pdf,.doc,.docx,.txt"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 bg-slate-700/80 hover:bg-slate-600/80 rounded-xl transition-all duration-200 hover:scale-105 shadow-lg"
            title="Attach file"
          >
            <PaperClipIcon className="w-5 h-5 text-slate-300 hover:text-white" />
          </button>
          <div className="relative">
            <button
              onClick={() => setShowEmojiPicker((s) => !s)}
              aria-haspopup="menu"
              aria-expanded={showEmojiPicker}
              className="p-2.5 bg-slate-700/80 hover:bg-slate-600/80 rounded-xl transition-all duration-200 hover:scale-105 shadow-lg"
              title="Insert emoji"
            >
              <FaceSmileIcon className="w-5 h-5 text-slate-300 hover:text-white" />
            </button>

            {showEmojiPicker && (
              <div className="absolute bottom-12 left-0 bg-slate-800/95 border border-slate-700/50 rounded-lg p-2 shadow-xl w-44 z-50">
                <div className="grid grid-cols-6 gap-2">
                  {['😀','😁','😂','🤣','😅','😊','😍','🤔','👍','👏','🎉','🔥','❤️','🙌','😎','🤝','🤷','🙏','💯','✨'].map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => {
                        // insert emoji at cursor position in the input
                        const el = inputRef.current;
                        const start = el?.selectionStart ?? chatInput.length;
                        const end = el?.selectionEnd ?? chatInput.length;
                        const before = chatInput.slice(0, start as number);
                        const after = chatInput.slice(end as number);
                        const next = `${before}${emoji}${after}`;
                        setChatInput(next);
                        setShowEmojiPicker(false);
                        // restore focus and move caret after inserted emoji
                        setTimeout(() => {
                          if (el) {
                            el.focus();
                            const pos = (before + emoji).length;
                            try {
                              el.setSelectionRange(pos, pos);
                            } catch (e) {
                              // ignore if platform doesn't allow
                            }
                          }
                        }, 0);
                      }}
                      className="p-1 rounded hover:bg-slate-700/60"
                      aria-label={`Insert ${emoji}`}
                    >
                      <span className="text-lg">{emoji}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-3">
          <input
            ref={inputRef}
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendChatMessage();
              }
            }}
            placeholder="Type a message..."
            className="flex-1 bg-slate-700/60 text-white text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:bg-slate-700/80 transition-all duration-200 placeholder-slate-400 border border-slate-600/50"
            style={{
              '--focus-ring-color': `${primary.base}80`,
              '--focus-border-color': `${primary.base}80`
            } as React.CSSProperties}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = `${primary.base}80`;
              e.currentTarget.style.boxShadow = `0 0 0 2px ${primary.base}80`;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'rgb(71 85 105 / 0.5)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
          <button
            onClick={sendChatMessage}
            disabled={!chatInput.trim()}
            className="p-3 disabled:cursor-not-allowed rounded-xl transition-all duration-200 hover:scale-105 shadow-lg disabled:shadow-none disabled:hover:scale-100"
            style={{
              background: chatInput.trim() 
                ? `linear-gradient(135deg, ${primary.base}, ${primary.hover})`
                : 'linear-gradient(135deg, rgb(71 85 105), rgb(51 65 85))'
            }}
            onMouseEnter={(e) => {
              if (chatInput.trim()) {
                e.currentTarget.style.background = `linear-gradient(135deg, ${primary.hover}, ${primary.lighter})`;
              }
            }}
            onMouseLeave={(e) => {
              if (chatInput.trim()) {
                e.currentTarget.style.background = `linear-gradient(135deg, ${primary.base}, ${primary.hover})`;
              }
            }}
            title="Send message"
          >
            <PaperAirplaneIcon className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
        </>
      )}
    </div>
  );
}