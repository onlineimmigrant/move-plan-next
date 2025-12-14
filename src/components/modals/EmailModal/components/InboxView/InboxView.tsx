'use client';

import React, { useState } from 'react';
import ThreadList from './ThreadList';
import MessageViewer from './MessageViewer';
import ComposeReply from './ComposeReply';
import InboxFiltersModal from './InboxFiltersModal';

interface InboxFilters {
  dateFrom?: string;
  dateTo?: string;
  fromEmail?: string;
  toEmail?: string;
  hasAttachments?: boolean;
  isRead?: boolean | null;
  isStarred?: boolean | null;
  labels?: string[];
}

interface InboxViewProps {
  globalSearchQuery?: string;
  onOpenFilters?: () => void;
  showFiltersModal?: boolean;
  onCloseFilters?: () => void;
  primary: { base: string; hover: string };
}

export default function InboxView({ 
  globalSearchQuery, 
  onOpenFilters, 
  showFiltersModal = false, 
  onCloseFilters,
  primary
}: InboxViewProps) {
  const [selectedThreadId, setSelectedThreadId] = useState<number | null>(null);
  const [replyingToMessage, setReplyingToMessage] = useState<any>(null);
  const [showMobileViewer, setShowMobileViewer] = useState(false);
  const [filters, setFilters] = useState<InboxFilters>({});

  const handleSelectThread = (threadId: number) => {
    setSelectedThreadId(threadId);
    setShowMobileViewer(true);
  };

  const handleBack = () => {
    setShowMobileViewer(false);
    setSelectedThreadId(null);
  };

  const handleReply = (message: any) => {
    setReplyingToMessage(message);
  };

  const handleCloseReply = () => {
    setReplyingToMessage(null);
  };

  const handleSent = () => {
    // Refresh thread after sending
    setReplyingToMessage(null);
  };

  const handleApplyFilters = (newFilters: InboxFilters) => {
    setFilters(newFilters);
  };

  const handleCloseFiltersModal = () => {
    onCloseFilters?.();
  };

  return (
    <>
      <div className="h-full flex overflow-hidden">
        {/* Thread List - Desktop always visible, Mobile conditional */}
        <div className={`w-full lg:w-96 border-r border-gray-200 dark:border-gray-700 flex-shrink-0 ${
          showMobileViewer ? 'hidden lg:block' : 'block'
        }`}>
          <ThreadList
            onSelectThread={handleSelectThread}
            selectedThreadId={selectedThreadId}
            initialSearchQuery={globalSearchQuery}
            filters={filters}
            primary={primary}
          />
        </div>

        {/* Message Viewer - Desktop always visible, Mobile conditional */}
        <div className={`flex-1 min-w-0 ${
          showMobileViewer ? 'block' : 'hidden lg:block'
        }`}>
          <MessageViewer
            threadId={selectedThreadId}
            onBack={handleBack}
            onReply={handleReply}
            primary={primary}
          />
        </div>
      </div>

      {/* Reply Composer Modal */}
      {replyingToMessage && (
        <ComposeReply
          message={replyingToMessage}
          onClose={handleCloseReply}
          onSent={handleSent}
          primary={primary}
        />
      )}

      <InboxFiltersModal
        isOpen={showFiltersModal}
        onClose={handleCloseFiltersModal}
        currentFilters={filters}
        onApplyFilters={handleApplyFilters}
        primary={primary}
      />
    </>
  );
}
