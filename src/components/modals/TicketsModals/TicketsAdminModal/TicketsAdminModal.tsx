'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Listbox, Popover, Transition } from '@headlessui/react';
import { supabase } from '@/lib/supabase';
import { useSettings } from '@/context/SettingsContext';
import { useAccountTranslations } from '@/components/accountTranslationLogic/useAccountTranslations';
import { getAttachmentUrl, isImageFile } from '@/lib/fileUpload';

// Import extracted Phase 3 components
import { 
  TicketList, 
  BottomFilters, 
  TicketModalHeader, 
  TicketListView,
  TicketDetailView,
  ModalContainer,
  AuxiliaryModals,
} from './components';

// Import Phase 1 types
import type {
  Ticket,
  TicketResponse,
  TicketNote,
  TicketTag,
  TicketTagAssignment,
  Avatar,
  PredefinedResponse,
} from './types';

// Import Phase 1 utility functions
import {
  setupRealtimeSubscription,
  cleanupRealtimeSubscription,
  refreshSelectedTicket as refreshSelectedTicketUtil,
} from './utils/realtimeSetup';

import {
  getPriorityLabel,
  getCurrentISOString,
  highlightText,
  processTicketResponses,
  getUnreadCount,
  isWaitingForResponse,
} from './utils/ticketHelpers';

// Import API functions
import * as TicketAPI from './utils/ticketApi';

// Import custom hooks
import {
  useDebounce,
  useAutoResizeTextarea,
  useSaveFiltersToLocalStorage,
  useRestoreFiltersFromLocalStorage,
  useTypingIndicator,
  useAutoScroll,
  useMarkMessagesAsRead,
  useLocalStorage,
  useModalSizePersistence,
  useSyncRefWithState,
  useModalDataFetching,
  useTicketKeyboardShortcuts,
  useSearchAutoHide,
  useTagManagement,
  useTicketData,
  useInternalNotes,
  useTicketOperations,
  useMessageHandling,
  useFileUpload,
  usePredefinedResponses,
  useGroupedTickets,
} from './hooks';

interface TicketsAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type WidgetSize = 'initial' | 'half' | 'fullscreen';

const statuses = ['all', 'in progress', 'open', 'closed'];

export default function TicketsAdminModal({ isOpen, onClose }: TicketsAdminModalProps) {
  const { t } = useAccountTranslations();
  const { settings } = useSettings();
  
  // Toast state (needed for tag management and other operations)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  // Helper function for toast notifications
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  };
  
  // Tag Management Hook
  const tagManagement = useTagManagement({
    organizationId: settings.organization_id,
    onToast: showToast,
  });
  
  // Ticket Data Hook - manages tickets, avatars, admin users, current user
  const ticketData = useTicketData({
    organizationId: settings.organization_id,
    ticketsPerPage: 20,
    statuses,
    selectedAvatar: null,
    onToast: showToast,
  });
  
  // Destructure ticket data
  const {
    tickets,
    isLoadingTickets,
    loadingMore,
    hasMoreTickets,
    avatars,
    selectedAvatar,
    adminUsers,
    currentUserId,
    setTickets,
    setSelectedAvatar,
    fetchTickets,
    loadMoreTickets,
    fetchAvatars,
    fetchAdminUsers,
    fetchCurrentUser,
  } = ticketData;

  // Internal Notes Hook - manages internal notes, pinning, and note counts
  const notesManagement = useInternalNotes({
    organizationId: settings.organization_id,
    currentUserId: currentUserId || '',
    onToast: showToast,
  });

  // Destructure notes data
  const {
    internalNotes,
    isAddingNote,
    ticketsWithPinnedNotes,
    ticketNoteCounts,
    setInternalNotes,
    fetchInternalNotes,
    handleAddInternalNote,
    handleTogglePinNote,
    handleDeleteInternalNote,
    fetchTicketsWithPinnedNotes,
    fetchTicketNoteCounts,
  } = notesManagement;

  // Ticket Operations Hook - manages assignment, priority, status changes
  const ticketOperations = useTicketOperations({
    organizationId: settings.organization_id,
    onToast: showToast,
    onRefreshTickets: fetchTickets,
  });

  // Destructure operations data
  const {
    isChangingStatus,
    isChangingPriority,
    isAssigning,
    showCloseConfirmation,
    ticketToClose,
    setShowCloseConfirmation,
    setTicketToClose,
    handleAssignTicket,
    handlePriorityChange,
    handleStatusChange,
    confirmCloseTicket,
    cancelCloseTicket,
  } = ticketOperations;
  
  // Load saved modal size from localStorage on mount
  const [size, setSize] = useState<WidgetSize>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ticketsModalSize');
      if (saved && ['initial', 'half', 'fullscreen'].includes(saved)) {
        return saved as WidgetSize;
      }
    }
    return 'initial';
  });
  
  // Save modal size to localStorage
  useModalSizePersistence(size);
  
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  // responseMessage, setResponseMessage now come from useMessageHandling hook
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState(statuses[0]);
  // predefinedResponses now comes from usePredefinedResponses hook
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [assignmentFilter, setAssignmentFilter] = useState<'all' | 'my' | 'unassigned'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  // internalNotes, isAddingNote, ticketsWithPinnedNotes, ticketNoteCounts now come from useInternalNotes hook
  const [noteText, setNoteText] = useState('');
  const [showInternalNotes, setShowInternalNotes] = useState(false);
  // showCloseConfirmation, ticketToClose now come from useTicketOperations hook
  const [showAvatarManagement, setShowAvatarManagement] = useState(false);
  const [avatarManagementCreateMode, setAvatarManagementCreateMode] = useState(false);
  // isLoadingTickets now comes from useTicketData hook
  // isSending now comes from useMessageHandling hook
  // isChangingStatus, isChangingPriority, isAssigning now come from useTicketOperations hook
  const [isCustomerTyping, setIsCustomerTyping] = useState(false);
  // selectedFiles, setSelectedFiles now come from useMessageHandling hook
  // uploadProgress, isDragging now come from useFileUpload hook
  const [attachmentUrls, setAttachmentUrls] = useState<{[key: string]: string}>({});
  
  // Tag management state (from useTagManagement hook)
  // Destructure from hook for use throughout the component
  const { availableTags, isLoadingTags } = tagManagement;
  const [tagFilter, setTagFilter] = useState<string>('all'); // 'all' or tag_id
  const [showTagManagement, setShowTagManagement] = useState(false);
  
  // Sorting state
  const [sortBy, setSortBy] = useState<'date-newest' | 'date-oldest' | 'priority' | 'responses' | 'updated'>('date-newest');
  
  // Advanced filters state
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [dateRangeStart, setDateRangeStart] = useState<string>('');
  const [dateRangeEnd, setDateRangeEnd] = useState<string>('');
  const [multiSelectStatuses, setMultiSelectStatuses] = useState<string[]>([]);
  const [multiSelectPriorities, setMultiSelectPriorities] = useState<string[]>([]);
  const [multiSelectTags, setMultiSelectTags] = useState<string[]>([]);
  const [multiSelectAssignees, setMultiSelectAssignees] = useState<string[]>([]);
  const [filterLogic, setFilterLogic] = useState<'AND' | 'OR'>('AND');
  
  // Analytics state
  const [showAnalytics, setShowAnalytics] = useState(false);
  
  // Automation state
  const [showAssignmentRules, setShowAssignmentRules] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const noteInputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectedTicketRef = useRef<Ticket | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const prevResponseCountRef = useRef<number>(0);
  const realtimeChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Custom hooks
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Keep ref in sync with state
  useSyncRefWithState(selectedTicketRef, selectedTicket);

  // Realtime subscription effect - direct implementation like TicketsAccountModal
  useEffect(() => {
    if (isOpen) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🚀 Admin modal opened - setting up realtime');
      }
      setupRealtimeSubscription({
        selectedTicket,
        selectedTicketRef,
        realtimeChannelRef,
        fetchTickets,
        refreshSelectedTicket,
        fetchInternalNotes,
        fetchTicketsWithPinnedNotes,
        fetchTicketNoteCounts,
      });
    }

    return () => {
      cleanupRealtimeSubscription(realtimeChannelRef);
    };
  }, [isOpen]);

  // Fetch data when modal opens and cleanup on close
  useModalDataFetching({
    isOpen,
    onFetchData: () => {
      fetchTickets();
      fetchAvatars();
      fetchAdminUsers();
      fetchCurrentUser();
      fetchTicketsWithPinnedNotes();
      fetchTicketNoteCounts();
      fetchTags(); // Fetch available tags
      // Fetch predefined responses if available (optional feature)
      fetchPredefinedResponses().catch(() => {
        // Silently ignore if table doesn't exist
      });
      // Note: setupRealtimeSubscription() now called in separate useEffect above
    },
    onCleanup: () => {
      // Cleanup is now handled in the useEffect above
    }
  });

  // Restore filters from localStorage on mount
  useRestoreFiltersFromLocalStorage<{
    searchQuery?: string;
    assignmentFilter?: 'all' | 'my' | 'unassigned';
    priorityFilter?: 'all' | 'high' | 'medium' | 'low';
    tagFilter?: string;
    sortBy?: 'date-newest' | 'date-oldest' | 'priority' | 'updated' | 'responses';
    advancedFilters?: {
      showAdvancedFilters?: boolean;
      dateRangeStart?: string;
      dateRangeEnd?: string;
      multiSelectStatuses?: string[];
      multiSelectPriorities?: string[];
      multiSelectTags?: string[];
      multiSelectAssignees?: string[];
      filterLogic?: 'AND' | 'OR';
    };
  }>(
    isOpen,
    settings?.organization_id,
    'ticket-filters',
    (filters) => {
      setSearchQuery(filters.searchQuery || '');
      setAssignmentFilter(filters.assignmentFilter || 'all');
      setPriorityFilter(filters.priorityFilter || 'all');
      setTagFilter(filters.tagFilter || 'all');
      setSortBy(filters.sortBy || 'date-newest');
      
      if (filters.advancedFilters) {
        setShowAdvancedFilters(filters.advancedFilters.showAdvancedFilters || false);
        setDateRangeStart(filters.advancedFilters.dateRangeStart || '');
        setDateRangeEnd(filters.advancedFilters.dateRangeEnd || '');
        setMultiSelectStatuses(filters.advancedFilters.multiSelectStatuses || []);
        setMultiSelectPriorities(filters.advancedFilters.multiSelectPriorities || []);
        setMultiSelectTags(filters.advancedFilters.multiSelectTags || []);
        setMultiSelectAssignees(filters.advancedFilters.multiSelectAssignees || []);
        setFilterLogic(filters.advancedFilters.filterLogic || 'AND');
      }
    }
  );

  // Save filters to localStorage whenever they change
  useSaveFiltersToLocalStorage({
    isOpen,
    organizationId: settings?.organization_id,
    storageKey: 'ticket-filters',
    filters: {
      searchQuery,
      assignmentFilter,
      priorityFilter,
      tagFilter,
      sortBy,
      advancedFilters: {
        showAdvancedFilters,
        dateRangeStart,
        dateRangeEnd,
        multiSelectStatuses,
        multiSelectPriorities,
        multiSelectTags,
        multiSelectAssignees,
        filterLogic
      }
    }
  });

  // Save selected avatar to localStorage
  useLocalStorage('admin_selected_avatar_id', selectedAvatar?.id);

  // Helper function to load attachment URLs for image previews
  const loadAttachmentUrls = async (responses: any[]) => {
    const urlsMap: Record<string, string> = {};
    
    for (const response of responses) {
      if (response.attachments && Array.isArray(response.attachments)) {
        for (const attachment of response.attachments) {
          // Only load URLs for image files
          if (isImageFile(attachment.file_type)) {
            try {
              const result = await getAttachmentUrl(attachment.file_path);
              if (result.url) {
                urlsMap[attachment.id] = result.url;
              }
            } catch (error) {
              console.error('Error loading attachment URL:', error);
            }
          }
        }
      }
    }
    
    // Merge new URLs with existing ones instead of replacing
    setAttachmentUrls(prev => ({ ...prev, ...urlsMap }));
  };

  // Wrapper for showToast to match hook signature
  const setToastForHook = (toast: { message: string; type: 'success' | 'error' }) => {
    showToast(toast.message, toast.type);
  };

  // Message Handling Hook - manages message sending, typing, and ticket selection
  const messageHandling = useMessageHandling({
    selectedTicket,
    selectedAvatar,
    setSelectedTicket,
    setTickets,
    setToast: setToastForHook,
    getCurrentISOString,
    loadAttachmentUrls,
    fetchInternalNotes,
    setShowInternalNotes,
    setInternalNotes,
    messagesContainerRef,
  });

  // Destructure message handling functions and state
  const {
    responseMessage,
    setResponseMessage,
    selectedFiles,
    setSelectedFiles,
    isSending,
    markMessagesAsRead: markMessagesAsReadFromHook,
    handleAdminRespond: handleAdminRespondFromHook,
    handleTicketSelect,
    broadcastTyping: broadcastTypingFromHook,
    handleMessageChange: handleMessageChangeFromHook,
    scrollToBottom: scrollToBottomFromHook,
  } = messageHandling;

  // File Upload Hook - manages file selection, drag-and-drop, validation
  const fileUpload = useFileUpload({
    selectedFiles,
    setSelectedFiles,
    fileInputRef,
    onToast: setToastForHook,
  });

  // Destructure file upload functions and state
  const {
    isDragging,
    uploadProgress,
    handleFileSelect,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    removeFile,
    clearFiles,
  } = fileUpload;

  // Predefined Responses Hook - manages template responses for quick replies
  const predefinedResponsesHook = usePredefinedResponses({
    organizationId: settings.organization_id,
  });

  // Destructure predefined responses state and functions
  const {
    predefinedResponses,
    fetchPredefinedResponses,
  } = predefinedResponsesHook;

  // Auto-resize response textarea
  useAutoResizeTextarea(inputRef, responseMessage, 120);

  // Auto-resize note textarea
  useAutoResizeTextarea(noteInputRef, noteText, 120);

  // Typing indicator channel subscription
  useTypingIndicator({
    isOpen,
    ticketId: selectedTicket?.id,
    onTypingStart: () => setIsCustomerTyping(true),
    onTypingStop: () => setIsCustomerTyping(false),
    typingTimeoutRef,
    showTypingFrom: 'customer' // Admin modal shows when customer is typing
  });

  // Auto-hide search when user starts typing a response
  useSearchAutoHide({
    responseMessage,
    showSearch,
    onHideSearch: () => {
      setShowSearch(false);
      setSearchQuery('');
    }
  });

  const refreshSelectedTicket = async () => {
    await refreshSelectedTicketUtil({
      selectedTicketRef,
      setSelectedTicket,
      fetchTickets,
      loadAttachmentUrls,
      scrollToBottom: scrollToBottomFromHook,
    });
  };

  // Realtime subscription effect - direct implementation like TicketsAccountModal
  useAutoScroll({
    selectedTicketId: selectedTicket?.id,
    responseCount: selectedTicket?.ticket_responses?.length || 0,
    isOpen,
    messagesContainerRef,
    prevResponseCountRef,
    onMessagesRead: markMessagesAsReadFromHook // Use hook function directly to avoid recreating
  });

  // Mark messages as read on various triggers
  useMarkMessagesAsRead({
    selectedTicketId: selectedTicket?.id,
    isOpen,
    responseMessage,
    noteText,
    markAsRead: markMessagesAsReadFromHook // Use hook function directly to avoid recreating
  });

  // ==== INTERNAL NOTES FUNCTIONS ====
  // Using useInternalNotes hook - functions available via hook destructuring
  // fetchInternalNotes, handleAddInternalNote, handleTogglePinNote, handleDeleteInternalNote
  // fetchTicketsWithPinnedNotes, fetchTicketNoteCounts

  // Wrapper for handleAddInternalNote to work with existing UI
  const handleAddInternalNoteWrapper = async () => {
    if (!noteText.trim() || !selectedTicket) return;
    
    await handleAddInternalNote(selectedTicket.id, noteText, () => {
      setNoteText('');
    });
  };

  // Wrapper for handleTogglePinNote to work with existing UI
  const handleTogglePinNoteWrapper = async (noteId: string, currentPinStatus: boolean) => {
    await handleTogglePinNote(noteId, currentPinStatus, selectedTicket?.id);
  };

  // ==== TICKET OPERATIONS FUNCTIONS ====
  // Using useTicketOperations hook - functions available via hook destructuring
  // handleAssignTicket, handlePriorityChange (already work directly)
  
  // Wrappers for status change functions to pass state updaters
  const handleStatusChangeWrapper = async (ticketId: string, newStatus: string) => {
    await handleStatusChange(
      ticketId,
      newStatus,
      tickets,
      setTickets,
      setSelectedTicket,
      selectedTicket?.id
    );
  };

  const confirmCloseTicketWrapper = async () => {
    await confirmCloseTicket(setTickets, setSelectedTicket, selectedTicket?.id);
  };

  // Wrappers for ticket list badge interactions (no selectedTicket context needed)
  const handleTicketListStatusChange = async (ticketId: string, newStatus: string) => {
    await handleStatusChange(
      ticketId,
      newStatus,
      tickets,
      setTickets,
      setSelectedTicket
    );
  };

  // ==== TAG MANAGEMENT FUNCTIONS ====
  // Using useTagManagement hook - creating wrapper functions for compatibility
  
  const fetchTags = tagManagement.fetchTags;
  
  const handleCreateTag = tagManagement.handleCreateTag;
  
  const handleUpdateTag = tagManagement.handleUpdateTag;
  
  const handleDeleteTag = (tagId: string) => {
    return tagManagement.handleDeleteTag(tagId, setTickets, setSelectedTicket);
  };
  
  const handleAssignTag = (ticketId: string, tagId: string) => {
    return tagManagement.handleAssignTag(ticketId, tagId, setTickets, setSelectedTicket);
  };
  
  const handleRemoveTag = (ticketId: string, tagId: string) => {
    return tagManagement.handleRemoveTag(ticketId, tagId, setTickets, setSelectedTicket);
  };

  // fetchPredefinedResponses - Now using hook version from usePredefinedResponses

  // scrollToBottom - Now using hook version (scrollToBottomFromHook)
  const scrollToBottom = () => scrollToBottomFromHook();

  // broadcastTyping - Now using hook version (broadcastTypingFromHook)
  const broadcastTyping = () => broadcastTypingFromHook();

  // handleMessageChange - Now using hook version (handleMessageChangeFromHook)
  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => handleMessageChangeFromHook(e);

  // File handling functions - Now using hook versions (from useFileUpload)
  // handleFileSelect, handleDragOver, handleDragLeave, handleDrop, removeFile, clearFiles

  // handleAdminRespond - Now using hook version (handleAdminRespondFromHook)
  const handleAdminRespond = () => handleAdminRespondFromHook();

  // Keyboard shortcuts for navigation and actions
  useTicketKeyboardShortcuts({
    isOpen,
    showCloseConfirmation,
    showAvatarManagement,
    showInternalNotes,
    responseMessage,
    selectedTicket,
    selectedAvatar,
    isSending,
    tickets,
    activeTab,
    assignmentFilter,
    priorityFilter,
    tagFilter,
    searchQuery: debouncedSearchQuery,
    currentUserId,
    onClose,
    onSendMessage: handleAdminRespond,
    onSelectTicket: handleTicketSelect
  });

  // Status change functions now use wrappers from useTicketOperations hook
  // Old implementations removed - using handleStatusChangeWrapper, confirmCloseTicketWrapper, cancelCloseTicket

  const toggleSize = () => {
    setSize((prev) => {
      if (prev === 'initial') return 'half';
      if (prev === 'half') return 'fullscreen';
      return 'initial'; // fullscreen → initial
    });
  };

  // Use Phase 1 utilities for filtering, sorting, and grouping
  const groupedTickets = useGroupedTickets({
    tickets,
    statuses,
    debouncedSearchQuery,
    priorityFilter,
    assignmentFilter,
    tagFilter,
    sortBy,
    showAdvancedFilters,
    dateRangeStart,
    dateRangeEnd,
    multiSelectStatuses,
    multiSelectPriorities,
    multiSelectTags,
    multiSelectAssignees,
    filterLogic,
    currentUserId,
  });

  // ========================================
  // HELPER FUNCTIONS
  // ========================================
  // Note: highlightText and renderAvatar are imported from utils/ticketHelpers

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

  const usePredefinedResponse = (response: PredefinedResponse) => {
    setResponseMessage(response.text);
    inputRef.current?.focus();
  };

  const handleCopyToClipboard = (text: string, successMessage: string) => {
    navigator.clipboard.writeText(text);
    setToast({ message: successMessage, type: 'success' });
  };

  // Render the modal
  return (
    <>
      <ModalContainer
        isOpen={isOpen}
        size={size}
        onClose={onClose}
      >
        {/* Header */}
        <TicketModalHeader
          selectedTicket={selectedTicket}
          size={size}
          searchQuery={searchQuery}
          avatars={avatars}
          availableTags={availableTags}
          onClose={onClose}
          onBack={() => setSelectedTicket(null)}
          onToggleSize={toggleSize}
          onShowAnalytics={() => setShowAnalytics(true)}
          onShowAssignmentRules={() => setShowAssignmentRules(true)}
          onRemoveTag={handleRemoveTag}
          onAssignTag={handleAssignTag}
          onCopyToClipboard={handleCopyToClipboard}
          highlightText={highlightText}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedTicket ? (
            <TicketDetailView
              selectedTicket={selectedTicket}
              size={size}
              searchQuery={searchQuery}
              showSearch={showSearch}
              isDragging={isDragging}
              isSending={isSending}
              isAddingNote={isAddingNote}
              isCustomerTyping={isCustomerTyping}
              showInternalNotes={showInternalNotes}
              responseMessage={responseMessage}
              noteText={noteText}
              selectedFiles={selectedFiles}
              uploadProgress={uploadProgress}
              avatars={avatars}
              selectedAvatar={selectedAvatar}
              predefinedResponses={predefinedResponses}
              internalNotes={internalNotes}
              attachmentUrls={attachmentUrls}
              messagesContainerRef={messagesContainerRef}
              messagesEndRef={messagesEndRef}
              inputRef={inputRef}
              noteInputRef={noteInputRef}
              fileInputRef={fileInputRef}
              currentUserId={currentUserId}
              onUsePredefinedResponse={usePredefinedResponse}
              onClearFiles={clearFiles}
              onRemoveFile={removeFile}
              onHandleDragOver={handleDragOver}
              onHandleDragLeave={handleDragLeave}
              onHandleDrop={handleDrop}
              onHandleMessageChange={handleMessageChange}
              onHandleFileSelect={handleFileSelect}
              onHandleAdminRespond={handleAdminRespond}
              onSetShowSearch={setShowSearch}
              onSetSearchQuery={setSearchQuery}
              onSetSelectedAvatar={setSelectedAvatar}
              onNoteTextChange={setNoteText}
              onAddNote={handleAddInternalNoteWrapper}
              onTogglePin={handleTogglePinNoteWrapper}
              onDeleteNote={handleDeleteInternalNote}
              onToggleExpand={() => setShowInternalNotes(!showInternalNotes)}
            />
          ) : (
            <TicketListView
              tickets={tickets}
              groupedTickets={groupedTickets}
              activeTab={activeTab}
              searchQuery={searchQuery}
              assignmentFilter={assignmentFilter}
              priorityFilter={priorityFilter}
              tagFilter={tagFilter}
              showAdvancedFilters={showAdvancedFilters}
              dateRangeStart={dateRangeStart}
              dateRangeEnd={dateRangeEnd}
              multiSelectStatuses={multiSelectStatuses}
              multiSelectPriorities={multiSelectPriorities}
              multiSelectTags={multiSelectTags}
              multiSelectAssignees={multiSelectAssignees}
              filterLogic={filterLogic}
              availableTags={availableTags}
              adminUsers={adminUsers}
              ticketsWithPinnedNotes={ticketsWithPinnedNotes}
              ticketNoteCounts={ticketNoteCounts}
              isLoadingTickets={isLoadingTickets}
              hasMoreTickets={hasMoreTickets[activeTab]}
              loadingMore={loadingMore}
              isAssigning={isAssigning}
              isChangingPriority={isChangingPriority}
              isChangingStatus={isChangingStatus}
              onTicketSelect={handleTicketSelect}
              onLoadMore={loadMoreTickets}
              onClearAllFilters={() => {
                setSearchQuery('');
                setAssignmentFilter('all');
                setPriorityFilter('all');
                setTagFilter('all');
                setDateRangeStart('');
                setDateRangeEnd('');
                setMultiSelectStatuses([]);
                setMultiSelectPriorities([]);
                setMultiSelectTags([]);
                setMultiSelectAssignees([]);
              }}
              onClearSearchQuery={() => setSearchQuery('')}
              onClearAssignmentFilter={() => setAssignmentFilter('all')}
              onClearPriorityFilter={() => setPriorityFilter('all')}
              onClearTagFilter={() => setTagFilter('all')}
              onClearDateRangeStart={() => setDateRangeStart('')}
              onClearDateRangeEnd={() => setDateRangeEnd('')}
              onRemoveStatus={(status) => setMultiSelectStatuses(prev => prev.filter(s => s !== status))}
              onRemovePriority={(priority) => setMultiSelectPriorities(prev => prev.filter(p => p !== priority))}
              onRemoveTag={(tagId) => setMultiSelectTags(prev => prev.filter(t => t !== tagId))}
              onRemoveAssignee={(assigneeId) => setMultiSelectAssignees(prev => prev.filter(a => a !== assigneeId))}
              onAssignTicket={handleAssignTicket}
              onPriorityChange={handlePriorityChange}
              onStatusChange={handleTicketListStatusChange}
              getUnreadCount={getUnreadCount}
              isWaitingForResponse={isWaitingForResponse}
            />
          )}

          {/* Bottom Tabs - Only show when no ticket selected */}
          {!selectedTicket && (
            <BottomFilters
              assignmentFilter={assignmentFilter}
              priorityFilter={priorityFilter}
              tagFilter={tagFilter}
              sortBy={sortBy}
              showAdvancedFilters={showAdvancedFilters}
              filterLogic={filterLogic}
              dateRangeStart={dateRangeStart}
              dateRangeEnd={dateRangeEnd}
              multiSelectStatuses={multiSelectStatuses}
              multiSelectPriorities={multiSelectPriorities}
              multiSelectTags={multiSelectTags}
              multiSelectAssignees={multiSelectAssignees}
              tickets={tickets}
              availableTags={availableTags}
              adminUsers={adminUsers}
              currentUserId={currentUserId}
              activeTab={activeTab}
              groupedTickets={groupedTickets}
              statuses={statuses}
              setAssignmentFilter={setAssignmentFilter}
              setPriorityFilter={setPriorityFilter}
              setTagFilter={setTagFilter}
              setSortBy={setSortBy}
              setShowAdvancedFilters={setShowAdvancedFilters}
              setFilterLogic={setFilterLogic}
              setDateRangeStart={setDateRangeStart}
              setDateRangeEnd={setDateRangeEnd}
              setMultiSelectStatuses={setMultiSelectStatuses}
              setMultiSelectPriorities={setMultiSelectPriorities}
              setMultiSelectTags={setMultiSelectTags}
              setMultiSelectAssignees={setMultiSelectAssignees}
              setActiveTab={setActiveTab}
            />
          )}
        </div>
      </ModalContainer>

      {/* Auxiliary Modals */}
      <AuxiliaryModals
        toast={toast}
        onCloseToast={() => setToast(null)}
        showCloseConfirmation={showCloseConfirmation}
        ticketToClose={ticketToClose}
        onConfirmClose={confirmCloseTicketWrapper}
        onCancelClose={cancelCloseTicket}
        showAvatarManagement={showAvatarManagement}
        avatarManagementCreateMode={avatarManagementCreateMode}
        onCloseAvatarManagement={() => {
          setShowAvatarManagement(false);
          setAvatarManagementCreateMode(false);
        }}
        onAvatarUpdated={fetchAvatars}
        organizationId={settings?.organization_id}
        showAnalytics={showAnalytics}
        tickets={tickets}
        adminUsers={adminUsers}
        onCloseAnalytics={() => setShowAnalytics(false)}
        showAssignmentRules={showAssignmentRules}
        onCloseAssignmentRules={() => setShowAssignmentRules(false)}
      />
    </>
  );
}
