import React from 'react';

/**
 * TypingIndicator Component
 * 
 * Displays an animated typing indicator to show when someone is typing a message.
 * Used in both admin and customer ticket modals to indicate active typing.
 * 
 * @example
 * {isAdminTyping && <TypingIndicator />}
 */
export default function TypingIndicator() {
  return (
    <div className="flex items-start justify-start animate-fade-in">
      <div className="bg-white border border-slate-200 text-slate-600 rounded-2xl rounded-tl-sm shadow-sm px-4 py-3">
        <div className="flex gap-1">
          <span 
            className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" 
            style={{ animationDelay: '0ms' }}
          />
          <span 
            className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" 
            style={{ animationDelay: '150ms' }}
          />
          <span 
            className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" 
            style={{ animationDelay: '300ms' }}
          />
        </div>
      </div>
    </div>
  );
}
