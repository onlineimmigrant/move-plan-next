'use client';

import React from 'react';
import { PinnedNotesBanner, InternalNotesPanel, Messages, MessageInputArea } from './index';
import type { Ticket, Avatar, PredefinedResponse, TicketNote } from '../types';

interface TicketDetailViewProps {
  // Ticket data
  selectedTicket: Ticket;
  
  // UI state
  size: 'initial' | 'half' | 'fullscreen';
  searchQuery: string;
  showSearch: boolean;
  isDragging: boolean;
  isSending: boolean;
  isAddingNote: boolean;
  isCustomerTyping: boolean;
  showInternalNotes: boolean;
  
  // Message state
  responseMessage: string;
  noteText: string;
  selectedFiles: File[];
  uploadProgress: Record<string, number>;
  
  // Data collections
  avatars: Avatar[];
  selectedAvatar: Avatar | null;
  predefinedResponses: PredefinedResponse[];
  internalNotes: TicketNote[];
  attachmentUrls: Record<string, string>;
  
  // Refs
  messagesContainerRef: React.RefObject<HTMLDivElement>;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  inputRef: React.RefObject<HTMLTextAreaElement>;
  noteInputRef: React.RefObject<HTMLTextAreaElement>;
  fileInputRef: React.RefObject<HTMLInputElement>;
  
  // User info
  currentUserId: string;
  
  // Callbacks - Message Input
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
  
  // Callbacks - Internal Notes
  onNoteTextChange: (text: string) => void;
  onAddNote: () => Promise<void>;
  onTogglePin: (noteId: string, currentPinStatus: boolean) => Promise<void>;
  onDeleteNote: (noteId: string) => Promise<void>;
  onToggleExpand: () => void;
}

export default function TicketDetailView({
  // Ticket data
  selectedTicket,
  
  // UI state
  size,
  searchQuery,
  showSearch,
  isDragging,
  isSending,
  isAddingNote,
  isCustomerTyping,
  showInternalNotes,
  
  // Message state
  responseMessage,
  noteText,
  selectedFiles,
  uploadProgress,
  
  // Data collections
  avatars,
  selectedAvatar,
  predefinedResponses,
  internalNotes,
  attachmentUrls,
  
  // Refs
  messagesContainerRef,
  messagesEndRef,
  inputRef,
  noteInputRef,
  fileInputRef,
  
  // User info
  currentUserId,
  
  // Callbacks - Message Input
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
  
  // Callbacks - Internal Notes
  onNoteTextChange,
  onAddNote,
  onTogglePin,
  onDeleteNote,
  onToggleExpand,
}: TicketDetailViewProps) {
  return (
    <>
      {/* Pinned Notes Banner */}
      <PinnedNotesBanner
        internalNotes={internalNotes}
        currentUserId={currentUserId}
        onTogglePinNote={onTogglePin}
      />

      {/* Messages */}
      <Messages
        selectedTicket={selectedTicket}
        searchQuery={searchQuery}
        avatars={avatars}
        selectedAvatar={selectedAvatar}
        attachmentUrls={attachmentUrls}
        isCustomerTyping={isCustomerTyping}
        messagesContainerRef={messagesContainerRef}
        messagesEndRef={messagesEndRef}
      />

      {/* Message Input Area */}
      <MessageInputArea
        size={size}
        predefinedResponses={predefinedResponses}
        searchQuery={searchQuery}
        selectedFiles={selectedFiles}
        uploadProgress={uploadProgress}
        isDragging={isDragging}
        responseMessage={responseMessage}
        isSending={isSending}
        showSearch={showSearch}
        avatars={avatars}
        selectedAvatar={selectedAvatar}
        inputRef={inputRef}
        fileInputRef={fileInputRef}
        onUsePredefinedResponse={onUsePredefinedResponse}
        onClearFiles={onClearFiles}
        onRemoveFile={onRemoveFile}
        onHandleDragOver={onHandleDragOver}
        onHandleDragLeave={onHandleDragLeave}
        onHandleDrop={onHandleDrop}
        onHandleMessageChange={onHandleMessageChange}
        onHandleFileSelect={onHandleFileSelect}
        onHandleAdminRespond={onHandleAdminRespond}
        onSetShowSearch={onSetShowSearch}
        onSetSearchQuery={onSetSearchQuery}
        onSetSelectedAvatar={onSetSelectedAvatar}
      />

      {/* Internal Notes Section */}
      <InternalNotesPanel
        notes={internalNotes}
        noteText={noteText}
        onNoteTextChange={onNoteTextChange}
        onAddNote={onAddNote}
        onTogglePin={onTogglePin}
        onDeleteNote={onDeleteNote}
        currentUserId={currentUserId}
        isAddingNote={isAddingNote}
        isExpanded={showInternalNotes}
        onToggleExpand={onToggleExpand}
        noteInputRef={noteInputRef}
      />
    </>
  );
}
