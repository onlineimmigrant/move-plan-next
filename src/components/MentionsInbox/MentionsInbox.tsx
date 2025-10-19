import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  BellIcon, 
  CheckIcon,
  EnvelopeOpenIcon,
  ArrowTopRightOnSquareIcon 
} from '@heroicons/react/24/outline';
import { BellIcon as BellSolidIcon } from '@heroicons/react/24/solid';

interface Mention {
  id: string;
  ticket_id: string;
  response_id: string | null;
  organization_id: string;
  mentioned_admin_id: string;
  mentioned_by_admin_id: string;
  mention_text: string;
  context_snippet: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  // Joined data
  mentioned_by: {
    full_name: string;
    avatar_url: string | null;
  };
  ticket: {
    subject: string;
    status: string;
  };
}

interface MentionsInboxProps {
  adminId: string;
  organizationId: string;
  onMentionClick?: (ticketId: string) => void;
  className?: string;
}

/**
 * MentionsInbox Component
 * 
 * Displays all @mentions for the current admin with notification badges.
 * Shows context snippets and links to original tickets.
 * Supports mark as read/unread and mark all as read.
 * 
 * Features:
 * - Real-time updates via Supabase subscriptions
 * - Unread counter badge
 * - Context preview with highlighting
 * - Quick actions (mark read, open ticket)
 * - Grouped by date (today, yesterday, older)
 */
export const MentionsInbox: React.FC<MentionsInboxProps> = ({
  adminId,
  organizationId,
  onMentionClick,
  className = '',
}) => {
  const [mentions, setMentions] = useState<Mention[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Fetch mentions
  const fetchMentions = async () => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from('admin_mentions')
      .select(`
        *,
        mentioned_by:mentioned_by_admin_id(full_name, avatar_url),
        ticket:ticket_id(subject, status)
      `)
      .eq('mentioned_admin_id', adminId)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (data && !error) {
      setMentions(data as any);
      setUnreadCount(data.filter((m) => !m.is_read).length);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchMentions();

    // Subscribe to new mentions
    const channel = supabase
      .channel(`admin_mentions:mentioned_admin_id=eq.${adminId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'admin_mentions',
          filter: `mentioned_admin_id=eq.${adminId}`,
        },
        (payload) => {
          console.log('New mention received:', payload);
          fetchMentions(); // Refetch to get joined data
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'admin_mentions',
          filter: `mentioned_admin_id=eq.${adminId}`,
        },
        (payload) => {
          console.log('Mention updated:', payload);
          fetchMentions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [adminId, organizationId]);

  // Mark mention as read
  const markAsRead = async (mentionId: string) => {
    await supabase
      .from('admin_mentions')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('id', mentionId);

    // Update local state
    setMentions((prev) =>
      prev.map((m) =>
        m.id === mentionId
          ? { ...m, is_read: true, read_at: new Date().toISOString() }
          : m
      )
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  // Mark all as read
  const markAllAsRead = async () => {
    const unreadIds = mentions.filter((m) => !m.is_read).map((m) => m.id);
    
    if (unreadIds.length === 0) return;

    await supabase
      .from('admin_mentions')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .in('id', unreadIds);

    // Update local state
    setMentions((prev) =>
      prev.map((m) => ({
        ...m,
        is_read: true,
        read_at: m.is_read ? m.read_at : new Date().toISOString(),
      }))
    );
    setUnreadCount(0);
  };

  // Handle mention click
  const handleMentionClick = async (mention: Mention) => {
    // Mark as read
    if (!mention.is_read) {
      await markAsRead(mention.id);
    }

    // Navigate to ticket
    if (onMentionClick) {
      onMentionClick(mention.ticket_id);
    }

    setShowDropdown(false);
  };

  // Group mentions by date
  const groupedMentions = mentions.reduce((acc, mention) => {
    const mentionDate = new Date(mention.created_at);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let group = 'Older';
    if (mentionDate.toDateString() === today.toDateString()) {
      group = 'Today';
    } else if (mentionDate.toDateString() === yesterday.toDateString()) {
      group = 'Yesterday';
    }

    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(mention);
    return acc;
  }, {} as Record<string, Mention[]>);

  // Format time ago
  const timeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div className={`relative ${className}`}>
      {/* Bell Icon with Badge */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
        title="Mentions"
      >
        {unreadCount > 0 ? (
          <BellSolidIcon className="w-6 h-6 text-blue-600" />
        ) : (
          <BellIcon className="w-6 h-6 text-gray-600" />
        )}
        
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-96 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-[600px] flex flex-col">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white rounded-t-lg">
            <div className="flex items-center gap-2">
              <BellIcon className="w-5 h-5 text-gray-600" />
              <h3 className="font-semibold text-gray-900">Mentions</h3>
              {unreadCount > 0 && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                <CheckIcon className="w-4 h-4" />
                Mark all read
              </button>
            )}
          </div>

          {/* Mentions List */}
          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="p-8 text-center text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-sm">Loading mentions...</p>
              </div>
            ) : mentions.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <BellIcon className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p className="text-sm">No mentions yet</p>
                <p className="text-xs mt-1">
                  You'll see notifications here when teammates mention you
                </p>
              </div>
            ) : (
              <>
                {Object.entries(groupedMentions).map(([group, groupMentions]) => (
                  <div key={group}>
                    {/* Date Group Header */}
                    <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                      <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                        {group}
                      </h4>
                    </div>

                    {/* Mentions in Group */}
                    {groupMentions.map((mention) => (
                      <div
                        key={mention.id}
                        onClick={() => handleMentionClick(mention)}
                        className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                          !mention.is_read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Avatar */}
                          {mention.mentioned_by?.avatar_url ? (
                            <img
                              src={mention.mentioned_by.avatar_url}
                              alt={mention.mentioned_by.full_name}
                              className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                              {mention.mentioned_by?.full_name?.charAt(0) || '?'}
                            </div>
                          )}

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            {/* Admin Name + Time */}
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-gray-900 text-sm">
                                {mention.mentioned_by?.full_name || 'Unknown Admin'}
                              </span>
                              <span className="text-xs text-gray-500">
                                mentioned you
                              </span>
                              <span className="text-xs text-gray-400">
                                {timeAgo(mention.created_at)}
                              </span>
                            </div>

                            {/* Ticket Subject */}
                            <div className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                              <span className="font-medium">
                                in {mention.ticket?.subject || 'Ticket'}
                              </span>
                              <span className={`px-2 py-0.5 rounded text-xs ${
                                mention.ticket?.status === 'open' ? 'bg-green-100 text-green-700' :
                                mention.ticket?.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {mention.ticket?.status}
                              </span>
                            </div>

                            {/* Context Snippet */}
                            {mention.context_snippet && (
                              <p className="text-sm text-gray-700 mt-1 line-clamp-2">
                                {mention.context_snippet}
                              </p>
                            )}

                            {/* Actions */}
                            <div className="mt-2 flex items-center gap-2">
                              {!mention.is_read && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markAsRead(mention.id);
                                  }}
                                  className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                                >
                                  <EnvelopeOpenIcon className="w-3 h-3" />
                                  Mark as read
                                </button>
                              )}
                              <ArrowTopRightOnSquareIcon className="w-3 h-3 text-gray-400" />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Footer */}
          {mentions.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 text-center bg-gray-50 rounded-b-lg">
              <button
                onClick={() => setShowDropdown(false)}
                className="text-xs text-gray-600 hover:text-gray-900 font-medium"
              >
                Close
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MentionsInbox;
