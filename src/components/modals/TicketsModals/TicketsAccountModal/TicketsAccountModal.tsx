'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useSettings } from '@/context/SettingsContext';
import Toast from '@/components/Toast';
import { useAccountTranslations } from '@/components/accountTranslationLogic/useAccountTranslations';

// Types
import type { Ticket, TicketResponse, Avatar, WidgetSize } from '../shared/types';

// Hooks
import {
  useAutoResizeTextarea,
  useTypingIndicator,
  useAutoScroll,
  useFileUpload,
  useTicketData,
  useRealtimeSubscription,
  useMessageHandling,
  useKeyboardShortcuts,
  useMarkAsReadEffects,
} from './hooks';

// Utils
import { 
  getContainerClasses,
  loadAttachmentUrls,
  groupTicketsByStatus,
} from './utils';

// Components
import { ModalHeader, BottomTabs, TicketList, MessageInput, Messages } from './components';

interface TicketsAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const statuses = ['in progress', 'open', 'closed'];

export default function TicketsAccountModal({ isOpen, onClose }: TicketsAccountModalProps) {
  const { t } = useAccountTranslations();
  const { settings } = useSettings();
  
  // UI State
  const [size, setSize] = useState<WidgetSize>('initial');
  const [activeTab, setActiveTab] = useState(statuses[0]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isAdminTyping, setIsAdminTyping] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [attachmentUrls, setAttachmentUrls] = useState<{[key: string]: string}>({});
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const prevResponseCountRef = useRef<number>(0);

  // Helper for toast notifications
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  };

  // ============================================================================
  // Custom Hooks
  // ============================================================================

  // Ticket Data Hook - Manages tickets, avatars, loading states
  const {
    tickets,
    setTickets,
    selectedTicket,
    setSelectedTicket,
    selectedTicketRef,
    avatars,
    isLoadingTickets,
    loadingMore,
    hasMoreTickets,
    fetchTickets,
    loadMoreTickets,
    fetchAvatars,
    markMessagesAsRead,
  } = useTicketData({
    organizationId: settings.organization_id,
    ticketsPerPage: 20,
    statuses,
    isOpen,
    onToast: showToast,
  });

  // Realtime Subscription Hook - Handles realtime updates
  useRealtimeSubscription({
    isOpen,
    selectedTicket,
    selectedTicketRef,
    messagesContainerRef,
    setSelectedTicket,
    setAttachmentUrls,
    fetchTickets,
  });

  // Message Handling Hook - Handles sending messages and file uploads
  const {
    responseMessage,
    setResponseMessage,
    isSending,
    handleMessageChange,
    handleRespond,
  } = useMessageHandling({
    selectedTicket,
    setSelectedTicket,
    setAttachmentUrls,
    messagesContainerRef,
    selectedFiles,
    setSelectedFiles,
    onToast: showToast,
  });

  // Auto-resize textarea based on content
  useAutoResizeTextarea(inputRef, responseMessage);

  // Subscribe to typing indicator events (admin typing)
  useTypingIndicator({
    isOpen,
    ticketId: selectedTicket?.id,
    onTypingStart: () => setIsAdminTyping(true),
    onTypingStop: () => setIsAdminTyping(false),
    typingTimeoutRef,
    showTypingFrom: 'admin', // Customer modal shows when admin is typing
  });

  // Auto-scroll to bottom on new messages
  useAutoScroll({
    selectedTicketId: selectedTicket?.id,
    responseCount: selectedTicket?.ticket_responses?.length,
    isOpen,
    messagesContainerRef,
    prevResponseCountRef,
    onMessagesRead: (ticketId) => markMessagesAsRead(ticketId),
  });

  // File upload handling (drag-drop, validation, etc.)
  const {
    isDragging,
    setIsDragging,
    handleFileSelect,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    removeFile,
    clearFiles,
  } = useFileUpload({
    selectedFiles,
    setSelectedFiles,
    fileInputRef,
    onToast: (toast) => setToast(toast),
  });

  // Keyboard shortcuts (Escape to close, Ctrl+Enter to send)
  useKeyboardShortcuts({
    isOpen,
    responseMessage,
    selectedTicket,
    isSending,
    onClose,
    onSend: handleRespond,
  });

  // Mark as read effects (typing, periodic, visibility)
  useMarkAsReadEffects({
    isOpen,
    responseMessage,
    selectedTicketId: selectedTicket?.id,
    markMessagesAsRead,
  });

  // ============================================================================
  // Effects
  // ============================================================================

  // Keep ref in sync with state
  useEffect(() => {
    selectedTicketRef.current = selectedTicket;
  }, [selectedTicket]);

  // Fetch initial data when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchTickets();
      fetchAvatars();
    }
  }, [isOpen]);

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleTicketSelect = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    // Mark admin messages as read when customer opens the ticket
    markMessagesAsRead(ticket.id);
    // Load attachment URLs for image previews
    if (ticket.ticket_responses) {
      loadAttachmentUrls(ticket.ticket_responses).then(urlsMap => {
        setAttachmentUrls(prev => ({ ...prev, ...urlsMap }));
      });
    }
  };

  const toggleSize = () => {
    setSize((prev) => {
      if (prev === 'initial') return 'half';
      if (prev === 'half') return 'fullscreen';
      return 'initial'; // fullscreen → initial
    });
  };

  // ============================================================================
  // Derived State
  // ============================================================================

  const groupedTickets = groupTicketsByStatus(tickets, statuses);

  if (!isOpen) return null;

  const modalContent = (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[10000]"
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className={`${getContainerClasses(size)} z-[10001]`}>
        {/* Header */}
        <ModalHeader
          selectedTicket={selectedTicket}
          size={size}
          avatars={avatars}
          onBack={() => setSelectedTicket(null)}
          onToggleSize={toggleSize}
          onClose={onClose}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedTicket ? (
            <>
              {/* Messages */}
              <Messages
                selectedTicket={selectedTicket}
                size={size}
                avatars={avatars}
                attachmentUrls={attachmentUrls}
                isAdminTyping={isAdminTyping}
                messagesContainerRef={messagesContainerRef}
                messagesEndRef={messagesEndRef}
              />

              {/* Input Area */}
              <div className="p-4 bg-white border-t border-slate-200">
                <MessageInput
                  size={size}
                  responseMessage={responseMessage}
                  selectedFiles={selectedFiles}
                  isDragging={isDragging}
                  isSending={isSending}
                  inputRef={inputRef}
                  fileInputRef={fileInputRef}
                  onMessageChange={handleMessageChange}
                  onRespond={handleRespond}
                  onFileSelect={handleFileSelect}
                  onRemoveFile={removeFile}
                  onClearFiles={clearFiles}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                />
              </div>
            </>
          ) : (
            <>
              {/* Ticket List */}
              <TicketList
                tickets={groupedTickets[activeTab]}
                activeTab={activeTab}
                isLoadingTickets={isLoadingTickets}
                loadingMore={loadingMore}
                hasMoreTickets={hasMoreTickets}
                onTicketSelect={handleTicketSelect}
                onLoadMore={loadMoreTickets}
              />
            </>
          )}

          {/* Bottom Tabs - Only show when no ticket selected */}
          {!selectedTicket && (
            <div className="flex justify-center px-2 py-2 bg-white border-t border-slate-200">
              <BottomTabs
                statuses={statuses}
                activeTab={activeTab}
                groupedTickets={groupedTickets}
                onTabChange={setActiveTab}
              />
            </div>
          )}
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );

  return createPortal(modalContent, document.body);
}
