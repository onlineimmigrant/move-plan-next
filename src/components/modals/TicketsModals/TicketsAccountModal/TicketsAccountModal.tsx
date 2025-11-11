'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Rnd } from 'react-rnd';
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
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

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

  // Focus management - Store and restore focus
  useEffect(() => {
    if (isOpen) {
      // Store the currently focused element
      previousFocusRef.current = document.activeElement as HTMLElement;
      
      // Focus the modal after a brief delay to ensure it's rendered
      setTimeout(() => {
        modalRef.current?.focus();
      }, 100);
    } else {
      // Restore focus when modal closes
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    }
  }, [isOpen]);

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

  // Calculate total unread messages across all tickets
  const totalUnreadCount = React.useMemo(() => {
    return tickets.reduce((total, ticket) => {
      const unreadInTicket = ticket.ticket_responses.filter(r => r.is_admin && !r.is_read).length;
      return total + unreadInTicket;
    }, 0);
  }, [tickets]);

  const toggleSize = () => {
    setSize((prev) => {
      if (prev === 'initial') return 'half';
      if (prev === 'half') return 'fullscreen';
      return 'initial'; // fullscreen → initial
    });
  };

  // Get Rnd configuration based on modal size
  const getRndConfig = () => {
    const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 900;

    switch (size) {
      case 'initial':
        return {
          x: windowWidth - 420,
          y: windowHeight - 780,
          width: 400,
          height: 750,
        };
      case 'half':
        return {
          x: windowWidth / 2,
          y: windowHeight * 0.1,
          width: Math.min(windowWidth * 0.5, 800),
          height: windowHeight * 0.85,
        };
      case 'fullscreen':
        return {
          x: 20,
          y: 20,
          width: windowWidth - 40,
          height: windowHeight - 40,
        };
      default:
        return {
          x: windowWidth - 420,
          y: windowHeight - 780,
          width: 400,
          height: 750,
        };
    }
  };

  // ============================================================================
  // Derived State
  // ============================================================================

  const groupedTickets = groupTicketsByStatus(tickets, statuses);

  if (!isOpen) return null;

  // Check if mobile
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;

  const modalContent = (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10000]"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {isMobile ? (
        /* Mobile: Fixed fullscreen */
        <div className="fixed inset-0 flex items-center justify-center p-4 z-[10001]">
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="ticket-modal-title"
            tabIndex={-1}
            className="relative w-full h-[90vh] flex flex-col bg-white/50 dark:bg-gray-900/50 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/20"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <ModalHeader
              selectedTicket={selectedTicket}
              size={size}
              avatars={avatars}
              totalUnreadCount={totalUnreadCount}
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
                  <div className="p-4">
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
                <div className="flex justify-center px-2 py-2 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-t border-slate-200 dark:border-gray-700">
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
        </div>
      ) : (
        /* Desktop: Draggable & Resizable */
        <Rnd
          default={getRndConfig()}
          minWidth={400}
          minHeight={600}
          bounds="window"
          dragHandleClassName="modal-drag-handle"
          enableResizing={size !== 'fullscreen'}
          className="pointer-events-auto z-[10001]"
        >
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="ticket-modal-title"
            tabIndex={-1}
            className="relative h-full flex flex-col bg-white/50 dark:bg-gray-900/50 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/20"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <ModalHeader
              selectedTicket={selectedTicket}
              size={size}
              avatars={avatars}
              totalUnreadCount={totalUnreadCount}
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
                  <div className="p-4">
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
                <div className="flex justify-center px-2 py-2 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-t border-slate-200 dark:border-gray-700">
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
        </Rnd>
      )}

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
