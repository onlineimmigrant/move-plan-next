import React from 'react';
import { MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline';
import { Listbox, Transition } from '@headlessui/react';
import { ALLOWED_MIME_TYPES, createLocalPreviewUrl, getFileIcon, formatFileSize } from '@/lib/fileUpload';
import { PredefinedResponse, Avatar } from '../types';
import { renderAvatar, getAvatarDisplayName } from '../utils/ticketHelpers';

interface MessageInputAreaProps {
  predefinedResponses: PredefinedResponse[];
  searchQuery: string;
  selectedFiles: File[];
  uploadProgress: Record<string, number>;
  isDragging: boolean;
  responseMessage: string;
  isSending: boolean;
  showSearch: boolean;
  avatars: Avatar[];
  selectedAvatar: Avatar | null;
  inputRef: React.RefObject<HTMLTextAreaElement>;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onUsePredefinedResponse: (response: PredefinedResponse) => void;
  onClearFiles: () => void;
  onRemoveFile: (index: number) => void;
  onHandleDragOver: (e: React.DragEvent) => void;
  onHandleDragLeave: (e: React.DragEvent) => void;
  onHandleDrop: (e: React.DragEvent) => void;
  onHandleMessageChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onHandleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onHandleAdminRespond: () => void;
  onSetShowSearch: (show: boolean) => void;
  onSetSearchQuery: (query: string) => void;
  onSetSelectedAvatar: (avatar: Avatar | null) => void;
}

export default function MessageInputArea({
  predefinedResponses,
  searchQuery,
  selectedFiles,
  uploadProgress,
  isDragging,
  responseMessage,
  isSending,
  showSearch,
  avatars,
  selectedAvatar,
  inputRef,
  fileInputRef,
  onUsePredefinedResponse,
  onClearFiles,
  onRemoveFile,
  onHandleDragOver,
  onHandleDragLeave,
  onHandleDrop,
  onHandleMessageChange,
  onHandleFileSelect,
  onHandleAdminRespond,
  onSetShowSearch,
  onSetSearchQuery,
  onSetSelectedAvatar,
}: MessageInputAreaProps) {
  return (
    <div 
      className="p-4 bg-white/30 dark:bg-gray-900/30 backdrop-blur-md border-t border-white/20 dark:border-gray-700/20"
      role="region"
      aria-label="Message composition"
    >
      <div className="max-w-2xl mx-auto">
        {/* Predefined Responses Badges - Horizontal Scroll (matching ChatWidget task badges) */}
        {predefinedResponses.length > 0 && (
          <div 
            className="mb-3 max-h-16 overflow-x-auto overflow-y-hidden"
            role="group"
            aria-label="Quick response templates"
            style={{
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(156, 163, 175, 0.5) rgba(241, 245, 249, 0.3)',
          }}>
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
            <div className="flex items-center gap-2 px-1 py-1">
              <button
                onClick={() => {/* TODO: Open create predefined response modal */}}
                className="inline-flex items-center p-2 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-full text-slate-700 dark:text-slate-200 hover:bg-white/70 dark:hover:bg-gray-800/70 transition-colors flex-shrink-0"
                title="Add predefined response"
              >
                <PlusIcon className="h-5 w-5" />
              </button>
              {predefinedResponses
                .filter(r => !searchQuery || r.subject.toLowerCase().includes(searchQuery.toLowerCase()) || r.text.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((response) => (
                <button
                  key={response.id}
                  onClick={() => onUsePredefinedResponse(response)}
                  className="flex-shrink-0 inline-flex items-center px-4 py-2 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-full text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-white/70 dark:hover:bg-gray-800/70 transition-colors whitespace-nowrap"
                >
                  {response.subject}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message Input */}
        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-md border border-white/20 dark:border-gray-700/20 rounded-2xl shadow-sm p-4 focus-within:border-blue-500/40 dark:focus-within:border-blue-400/40 focus-within:ring-2 focus-within:ring-blue-500/30 transition-all duration-200">
          {/* File Preview Area */}
          {selectedFiles.length > 0 && (
            <div className="mb-3 pb-3 border-b border-white/20 dark:border-gray-700/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
                </span>
                <button
                  onClick={onClearFiles}
                  className="text-xs text-red-600 hover:text-red-700 font-medium"
                >
                  Clear all
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="relative group">
                    {file.type.startsWith('image/') ? (
                      // Image preview
                      <div className="relative">
                        <img
                          src={createLocalPreviewUrl(file) || ''}
                          alt={file.name}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded-lg" />
                        <p className="absolute bottom-1 left-1 right-1 text-[10px] text-white truncate">
                          {file.name}
                        </p>
                      </div>
                    ) : (
                      // File icon preview
                      <div className="h-24 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-lg flex flex-col items-center justify-center p-2">
                        <span className="text-2xl mb-1">{getFileIcon(file.type)}</span>
                        <p className="text-[10px] text-slate-700 dark:text-slate-200 text-center truncate w-full px-1">
                          {file.name}
                        </p>
                        <p className="text-[9px] text-slate-500 dark:text-slate-400">{formatFileSize(file.size)}</p>
                      </div>
                    )}

                    {/* Upload progress overlay */}
                    {uploadProgress[file.name as keyof typeof uploadProgress] && (
                      <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                        <div className="text-white text-center">
                          <div className="text-xs font-medium mb-1">
                            {uploadProgress[file.name as keyof typeof uploadProgress]}%
                          </div>
                          <div className="w-20 h-1 bg-white/30 dark:bg-gray-700/50 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-white dark:bg-blue-400 transition-all duration-300"
                              style={{ width: `${uploadProgress[file.name as keyof typeof uploadProgress]}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Remove button */}
                    <button
                      onClick={() => onRemoveFile(index)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Drag and Drop Zone */}
          {isDragging && (
            <div className="mb-3 border-2 border-dashed border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 text-center">
              <div className="flex flex-col items-center gap-2">
                <svg className="w-10 h-10 text-blue-500 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Drop files here</p>
              </div>
            </div>
          )}

          <div className="flex items-end gap-3">
            <div className="flex-1 relative"
              onDragOver={onHandleDragOver}
              onDragLeave={onHandleDragLeave}
              onDrop={onHandleDrop}
            >
              <textarea
                ref={inputRef}
                value={responseMessage}
                onChange={onHandleMessageChange}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), onHandleAdminRespond())}
                placeholder="Type your message..."
                className="w-full resize-none border-0 bg-transparent text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-0 text-base leading-relaxed min-h-[44px] max-h-[120px]"
                rows={1}
                disabled={isSending}
                aria-label="Message content"
                aria-describedby="message-help"
              />
              <span id="message-help" className="sr-only">
                Press Enter to send, Shift+Enter for new line
              </span>
            </div>

            {/* File attachment button */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ALLOWED_MIME_TYPES.join(',')}
              onChange={onHandleFileSelect}
              className="hidden"
              aria-label="Attach files"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isSending}
              className="flex items-center justify-center w-10 h-10 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-500/10 dark:hover:bg-blue-400/10 rounded-xl transition-all duration-200 motion-reduce:transition-none disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 dark:focus-visible:ring-blue-400/40 border border-white/10 dark:border-gray-700/20"
              aria-label="Attach files"
              title="Attach files"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </button>

            <button
              onClick={onHandleAdminRespond}
              disabled={(!responseMessage.trim() && selectedFiles.length === 0) || isSending}
              className="flex items-center justify-center w-10 h-10 bg-blue-600/90 dark:bg-blue-500/90 hover:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 motion-reduce:transition-none disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 dark:focus-visible:ring-blue-400/40 focus-visible:ring-offset-2 border border-white/10 dark:border-gray-700/20"
              aria-label={isSending ? "Sending message" : "Send message"}
              title={isSending ? "Sending..." : "Send (Enter)"}
            >
              {isSending ? (
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              )}
            </button>
          </div>

          {/* Bottom row with search and avatar selector */}
          <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/20 dark:border-gray-700/20">
            <div className="flex items-center gap-2 flex-1">
              <button
                onClick={() => {
                  onSetShowSearch(!showSearch);
                  if (showSearch) {
                    onSetSearchQuery('');
                  }
                }}
                className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 motion-reduce:transition-none focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 dark:focus-visible:ring-blue-400/40 ${
                  showSearch
                    ? 'text-blue-600 dark:text-blue-400 bg-white/30 dark:bg-gray-700/30 hover:bg-white/40 dark:hover:bg-gray-700/40'
                    : 'text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white/20 dark:hover:bg-gray-700/20'
                }`}
                title="Search predefined responses"
              >
                <MagnifyingGlassIcon className="h-4 w-4" />
              </button>

              {/* Search Input - inline */}
              {showSearch && (
                <div className="flex-1 animate-in slide-in-from-left-2 duration-200">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => onSetSearchQuery(e.target.value)}
                    placeholder="Search predefined responses..."
                    className="w-full px-3 py-1.5 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 dark:focus-visible:ring-blue-400/30 focus:border-transparent transition-all duration-200 motion-reduce:transition-none text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                    autoFocus
                  />
                </div>
              )}
            </div>

            {/* Avatar Selector with Management */}
            <div className="flex items-center gap-2">
              {avatars.length > 1 && (
                <Listbox value={selectedAvatar} onChange={onSetSelectedAvatar}>
                  <div className="relative">
                    <Listbox.Button className="flex items-center gap-2 px-2 py-1.5 text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white/20 dark:hover:bg-gray-700/20 rounded-lg transition-all duration-200 motion-reduce:transition-none focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 dark:focus-visible:ring-blue-400/40">
                      {/* Avatar Image/Initials */}
                      {selectedAvatar && renderAvatar(selectedAvatar, selectedAvatar.full_name || selectedAvatar.title, true)}
                      {/* Avatar Name */}
                      <span className="text-sm font-medium">
                        {selectedAvatar?.full_name || selectedAvatar?.title || 'Select Avatar'}
                      </span>
                    </Listbox.Button>
                    <Transition
                      leave="transition ease-in duration-100"
                      leaveFrom="opacity-100"
                      leaveTo="opacity-0"
                    >
                      <Listbox.Options className="absolute bottom-full right-0 mb-2 w-48 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-lg shadow-lg border border-white/20 dark:border-gray-700/20 py-1 max-h-60 overflow-auto focus:outline-none text-sm z-50">
                        {avatars.map((avatar) => (
                          <Listbox.Option
                            key={avatar.id}
                            value={avatar}
                            className={({ active }) =>
                              `relative cursor-pointer select-none py-2 pl-3 pr-9 ${
                                active ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100' : 'text-slate-900 dark:text-slate-100'
                              }`
                            }
                          >
                            {({ selected }) => (
                              <div className="flex items-center gap-2">
                                {/* Avatar Image/Initials */}
                                {renderAvatar(avatar, avatar.full_name || avatar.title, true)}
                                <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                  {avatar.full_name || avatar.title}
                                </span>
                                {selected && (
                                  <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-blue-600">
                                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  </span>
                                )}
                              </div>
                            )}
                          </Listbox.Option>
                        ))}

                        {/* Divider */}
                        <div className="my-1 border-t border-white/20 dark:border-gray-700/20" />

                        {/* Add Avatar Button */}
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            // TODO: Open create avatar modal
                          }}
                          className="w-full text-left px-3 py-2 text-sm text-purple-600 hover:bg-purple-500/10 transition-colors flex items-center gap-2"
                        >
                          <PlusIcon className="h-4 w-4" />
                          Add Avatar
                        </button>
                      </Listbox.Options>
                    </Transition>
                  </div>
                </Listbox>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};