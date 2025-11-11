import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { ALLOWED_MIME_TYPES, createLocalPreviewUrl, getFileIcon, formatFileSize } from '@/lib/fileUpload';
import type { WidgetSize } from '../../shared/types';

interface MessageInputProps {
  size: WidgetSize;
  responseMessage: string;
  selectedFiles: File[];
  isDragging: boolean;
  isSending: boolean;
  inputRef: React.RefObject<HTMLTextAreaElement>;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onMessageChange: (value: string) => void;
  onRespond: () => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: (index: number) => void;
  onClearFiles: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
}

export default function MessageInput({
  size,
  responseMessage,
  selectedFiles,
  isDragging,
  isSending,
  inputRef,
  fileInputRef,
  onMessageChange,
  onRespond,
  onFileSelect,
  onRemoveFile,
  onClearFiles,
  onDragOver,
  onDragLeave,
  onDrop,
}: MessageInputProps) {
  return (
    <div className={`${size === 'fullscreen' || size === 'half' ? 'max-w-2xl mx-auto' : ''}`}>
      {/* File Previews */}
      {selectedFiles.length > 0 && (
        <div className="mb-3 p-3 bg-white/40 dark:bg-gray-800/40 backdrop-blur-md rounded-xl border border-white/30 dark:border-gray-700/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
              {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} selected
            </span>
            <button
              onClick={onClearFiles}
              className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium transition-colors"
            >
              Clear all
            </button>
          </div>
          <div className="space-y-2">
            {selectedFiles.map((file, index) => {
              const previewUrl = createLocalPreviewUrl(file);
              return (
                <div key={index} className="flex items-center gap-2 p-2 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm rounded-lg border border-white/40 dark:border-gray-700/40">
                  {previewUrl ? (
                    <img 
                      src={previewUrl} 
                      alt={file.name}
                      className="w-10 h-10 rounded object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded bg-slate-100 dark:bg-gray-700 flex items-center justify-center text-lg flex-shrink-0">
                      {getFileIcon(file.type)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 dark:text-slate-200 truncate">{file.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{formatFileSize(file.size)}</p>
                  </div>
                  <button
                    onClick={() => onRemoveFile(index)}
                    className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 p-1 transition-colors"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      <div 
        className={`backdrop-blur-md bg-white/60 dark:bg-gray-900/60 border border-white/30 dark:border-gray-700/30 rounded-2xl shadow-sm p-4 transition-all duration-200 ${
          isDragging ? 'bg-white/80 dark:bg-gray-800/80' : ''
        }`}
        style={{
          '--focus-border': 'color-mix(in srgb, var(--color-primary-base) 50%, transparent)',
          '--focus-ring': 'color-mix(in srgb, var(--color-primary-base) 10%, transparent)',
        } as React.CSSProperties}
        onFocus={(e) => {
          const target = e.currentTarget;
          target.style.borderColor = 'var(--focus-border)';
          target.style.boxShadow = '0 0 0 4px var(--focus-ring)';
        }}
        onBlur={(e) => {
          const target = e.currentTarget;
          target.style.borderColor = '';
          target.style.boxShadow = '';
        }}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        {isDragging && (
          <div className="absolute inset-0 flex items-center justify-center bg-blue-50/90 rounded-2xl z-10 pointer-events-none">
            <div className="text-blue-600 text-sm font-medium">
              Drop files here...
            </div>
          </div>
        )}
        
        <div className="flex items-end gap-3">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={responseMessage}
              onChange={(e) => onMessageChange(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), onRespond())}
              placeholder="Type your message..."
              className="w-full resize-none border-0 bg-transparent text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-0 text-base leading-relaxed min-h-[44px] max-h-[120px]"
              rows={1}
              disabled={isSending}
            />
          </div>
          
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ALLOWED_MIME_TYPES.join(',')}
            onChange={onFileSelect}
            className="hidden"
          />
          
          {/* File upload button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isSending}
            className="flex items-center justify-center w-10 h-10 text-slate-600 dark:text-slate-400 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              '--hover-bg': 'color-mix(in srgb, var(--color-primary-base) 8%, rgb(255 255 255 / 0.6))',
              '--hover-text': 'var(--color-primary-base)',
            } as React.CSSProperties}
            onMouseEnter={(e) => {
              if (!isSending) {
                e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
                e.currentTarget.style.color = 'var(--hover-text)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isSending) {
                e.currentTarget.style.backgroundColor = '';
                e.currentTarget.style.color = '';
              }
            }}
            title="Attach file"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>
          
          <button
            onClick={onRespond}
            disabled={(!responseMessage.trim() && selectedFiles.length === 0) || isSending}
            className="flex items-center justify-center w-10 h-10 text-white rounded-xl shadow-sm hover:shadow-md disabled:shadow-none disabled:bg-slate-200 dark:disabled:bg-gray-700 transition-all duration-200 hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:hover:scale-100"
            style={{
              backgroundColor: (!responseMessage.trim() && selectedFiles.length === 0) || isSending ? undefined : 'var(--color-primary-base)',
              '--hover-bg': 'color-mix(in srgb, var(--color-primary-base) 90%, black)',
            } as React.CSSProperties}
            onMouseEnter={(e) => {
              if (!isSending && (responseMessage.trim() || selectedFiles.length > 0)) {
                e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isSending && (responseMessage.trim() || selectedFiles.length > 0)) {
                e.currentTarget.style.backgroundColor = 'var(--color-primary-base)';
              }
            }}
          >
            {isSending ? (
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
