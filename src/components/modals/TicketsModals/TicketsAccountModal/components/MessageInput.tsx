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
        <div className="mb-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-600">
              {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} selected
            </span>
            <button
              onClick={onClearFiles}
              className="text-xs text-red-600 hover:text-red-700 font-medium"
            >
              Clear all
            </button>
          </div>
          <div className="space-y-2">
            {selectedFiles.map((file, index) => {
              const previewUrl = createLocalPreviewUrl(file);
              return (
                <div key={index} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200">
                  {previewUrl ? (
                    <img 
                      src={previewUrl} 
                      alt={file.name}
                      className="w-10 h-10 rounded object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded bg-slate-100 flex items-center justify-center text-lg flex-shrink-0">
                      {getFileIcon(file.type)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 truncate">{file.name}</p>
                    <p className="text-xs text-slate-500">{formatFileSize(file.size)}</p>
                  </div>
                  <button
                    onClick={() => onRemoveFile(index)}
                    className="text-red-600 hover:text-red-700 p-1"
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
        className={`bg-white border border-slate-200 rounded-2xl shadow-sm p-4 focus-within:border-blue-300 focus-within:ring-4 focus-within:ring-blue-100 transition-all duration-200 ${
          isDragging ? 'border-blue-400 bg-blue-50' : ''
        }`}
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
            className="flex items-center justify-center w-10 h-10 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Attach file"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>
          
          <button
            onClick={onRespond}
            disabled={(!responseMessage.trim() && selectedFiles.length === 0) || isSending}
            className="flex items-center justify-center w-10 h-10 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-200 text-white rounded-xl shadow-sm hover:shadow-md disabled:shadow-none transition-all duration-200 disabled:cursor-not-allowed"
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
