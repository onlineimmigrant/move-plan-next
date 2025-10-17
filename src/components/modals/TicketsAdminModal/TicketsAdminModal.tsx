'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { XMarkIcon, ArrowsPointingOutIcon, ArrowsPointingInIcon, ChevronLeftIcon, ChevronRightIcon, MagnifyingGlassIcon, PlusIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { Listbox, Popover, Transition } from '@headlessui/react';
import { supabase } from '@/lib/supabase';
import { useSettings } from '@/context/SettingsContext';
import Button from '@/ui/Button';
import Toast from '@/components/Toast';
import Tooltip from '@/components/Tooltip';
import { Menu, X, User, Users, Check, ChevronDown } from 'lucide-react';
import { useAccountTranslations } from '@/components/accountTranslationLogic/useAccountTranslations';

interface TicketResponse {
  id: string;
  message: string;
  is_admin: boolean;
  created_at: string;
  avatar_id?: string;
}

interface Ticket {
  id: string;
  subject: string;
  status: string;
  customer_id: string | null;
  created_at: string;
  message: string;
  preferred_contact_method: string | null;
  email: string;
  full_name?: string;
  ticket_responses: TicketResponse[];
}

interface Avatar {
  id: string;
  title: string;
  full_name?: string;
  image?: string;
}

interface PredefinedResponse {
  id: string;
  order: number;
  subject: string;
  text: string;
}

interface TicketsAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type WidgetSize = 'initial' | 'half' | 'fullscreen';

const statuses = ['in progress', 'open', 'closed'];

export default function TicketsAdminModal({ isOpen, onClose }: TicketsAdminModalProps) {
  const { t } = useAccountTranslations();
  const { settings } = useSettings();
  const [size, setSize] = useState<WidgetSize>('initial');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [responseMessage, setResponseMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [activeTab, setActiveTab] = useState(statuses[0]);
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [selectedAvatar, setSelectedAvatar] = useState<Avatar | null>(null);
  const [predefinedResponses, setPredefinedResponses] = useState<PredefinedResponse[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      fetchTickets();
      fetchAvatars();
      // Fetch predefined responses if available (optional feature)
      fetchPredefinedResponses().catch(() => {
        // Silently ignore if table doesn't exist
      });
      setupRealtimeSubscription();
    }

    return () => {
      supabase.channel('tickets').unsubscribe();
    };
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [selectedTicket]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = inputRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [responseMessage]);

  // Hide search input when user starts typing in the message field
  useEffect(() => {
    if (responseMessage.trim() && showSearch) {
      setShowSearch(false);
      setSearchQuery('');
    }
  }, [responseMessage]);

  const setupRealtimeSubscription = () => {
    try {
      const channel = supabase
        .channel('tickets')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tickets' }, (payload) => {
          fetchTickets();
        })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ticket_responses' }, (payload) => {
          fetchTickets();
        })
        .subscribe((status) => {
          // Silently handle subscription status
          // Modal works fine without real-time updates
        });
    } catch (err) {
      // Silently handle - modal continues to work without real-time updates
    }
  };

  const fetchTickets = async () => {
    try {
      const { data: ticketsData, error: ticketsError } = await supabase
        .from('tickets')
        .select('id, subject, status, customer_id, created_at, message, preferred_contact_method, email, full_name, ticket_responses(*)')
        .eq('organization_id', settings.organization_id)
        .order('created_at', { ascending: false });

      if (ticketsError) {
        console.error('Error fetching tickets:', ticketsError);
        setToast({ message: 'Failed to load tickets', type: 'error' });
        return;
      }

      setTickets(ticketsData || []);
    } catch (error) {
      console.error('Unexpected error in fetchTickets:', error);
      setToast({ message: 'An unexpected error occurred', type: 'error' });
    }
  };

  const fetchAvatars = async () => {
    try {
      const { data, error } = await supabase
        .from('ticket_avatars')
        .select('id, title, full_name, image')
        .eq('organization_id', settings.organization_id)
        .order('title', { ascending: true });

      if (error) {
        // Table doesn't exist - use default avatar only (this is expected)
        const avatarList = [{ id: 'default', title: 'Support', full_name: undefined, image: undefined }];
        setAvatars(avatarList);
        setSelectedAvatar(avatarList[0]);
        return;
      }
      
      const avatarList = [{ id: 'default', title: 'Support', full_name: undefined, image: undefined }, ...(data || [])];
      setAvatars(avatarList);
      setSelectedAvatar(avatarList[0]);
    } catch (err) {
      // Silently handle if table doesn't exist
      const avatarList = [{ id: 'default', title: 'Support', full_name: undefined, image: undefined }];
      setAvatars(avatarList);
      setSelectedAvatar(avatarList[0]);
    }
  };

  const fetchPredefinedResponses = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No user logged in, skipping predefined responses');
        return;
      }

      console.log('Fetching predefined responses for org:', settings.organization_id);
      const { data, error } = await supabase
        .from('tickets_predefined_responses')
        .select('id, order, subject, text')
        .eq('organization_id', settings.organization_id)
        .order('order', { ascending: true });

      if (error) {
        // Table doesn't exist yet - this is expected and optional
        console.log('Predefined responses table not available:', error.message);
        setPredefinedResponses([]);
        return;
      }
      
      console.log('✅ Predefined responses loaded:', data?.length || 0, data);
      setPredefinedResponses(data || []);
    } catch (err) {
      console.error('Error fetching predefined responses:', err);
      setPredefinedResponses([]);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleAdminRespond = async () => {
    if (!responseMessage.trim() || !selectedTicket || !selectedAvatar) return;

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Prepare response data - only include avatar_id if it's not the default
      const responseData: any = {
        ticket_id: selectedTicket.id,
        user_id: user?.id,
        message: responseMessage,
        is_admin: true,
        created_at: new Date().toISOString(),
      };
      
      // Only add avatar_id if it exists in the database (not 'default')
      if (selectedAvatar.id !== 'default') {
        responseData.avatar_id = selectedAvatar.id;
      }
      
      const { data, error } = await supabase
        .from('ticket_responses')
        .insert(responseData)
        .select();

      if (error) {
        console.error('Error inserting ticket response:', error);
        throw new Error(error.message);
      }

      setResponseMessage('');
      setSelectedTicket((t) =>
        t && t.id === selectedTicket.id
          ? {
              ...t,
              ticket_responses: [...t.ticket_responses, data[0]],
            }
          : t
      );
      scrollToBottom();
      setToast({ message: 'Response sent successfully', type: 'success' });
    } catch (error: any) {
      console.error('Failed to submit response:', error);
      setToast({ message: error.message || 'Failed to submit response', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTicketSelect = (ticket: Ticket) => {
    setSelectedTicket(ticket);
  };

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ status: newStatus })
        .eq('id', ticketId);

      if (error) throw error;

      setTickets((prev) => prev.map((t) => (t.id === ticketId ? { ...t, status: newStatus } : t)));
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket((prev) => (prev ? { ...prev, status: newStatus } : prev));
      }
      setToast({ message: 'Status updated successfully', type: 'success' });
    } catch (error: any) {
      setToast({ message: error.message || 'Failed to update status', type: 'error' });
    }
  };

  const toggleSize = () => {
    setSize((prev) => {
      if (prev === 'initial') return 'half';
      if (prev === 'half') return 'fullscreen';
      return 'initial'; // fullscreen → initial
    });
  };

  const groupedTickets = statuses.reduce(
    (acc, status) => ({
      ...acc,
      [status]: tickets.filter((ticket) => ticket.status === status),
    }),
    {} as Record<string, Ticket[]>
  );

  const isWaitingForResponse = (ticket: Ticket) => {
    if (ticket.status === 'closed') return false;
    if (ticket.ticket_responses.length === 0) return true;
    const latestResponse = ticket.ticket_responses[ticket.ticket_responses.length - 1];
    return !latestResponse.is_admin;
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-green-100 text-green-800';
      case 'in progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'closed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getAvatarForResponse = (response: TicketResponse) => {
    if (!response.is_admin) return null;
    return avatars.find((a) => a.id === response.avatar_id) || avatars[0];
  };

  const usePredefinedResponse = (response: PredefinedResponse) => {
    setResponseMessage(response.text);
    inputRef.current?.focus();
  };

  if (!isOpen) return null;

  const getContainerClasses = () => {
    const baseClasses = 'fixed bg-white border border-slate-200 shadow-xl transition-all duration-300 ease-in-out flex flex-col overflow-hidden';
    
    switch (size) {
      case 'initial':
        return `${baseClasses} bottom-8 right-4 w-[400px] h-[750px] rounded-2xl`;
      case 'half':
        return `${baseClasses} bottom-0 right-0 w-full md:w-2/3 lg:w-1/2 h-screen md:h-5/6 md:bottom-4 md:right-4 md:rounded-2xl`;
      case 'fullscreen':
        return `${baseClasses} inset-0 w-full h-full rounded-none`;
      default:
        return baseClasses;
    }
  };

  const modalContent = (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[10000]"
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className={`${getContainerClasses()} z-[10001]`}>
        {/* Header */}
        <div className="flex justify-between items-center px-4 py-3 bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200 rounded-t-2xl shadow-sm">
          <div className="flex items-center gap-2">
            {selectedTicket && (
              <button
                onClick={() => setSelectedTicket(null)}
                className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
                aria-label="Back to list"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
            )}
            <button
              onClick={toggleSize}
              className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
            >
              {size === 'fullscreen' ? (
                <ArrowsPointingInIcon className="h-4 w-4" />
              ) : (
                <ArrowsPointingOutIcon className="h-4 w-4" />
              )}
            </button>
          </div>
          
          {/* Title - Two lines when ticket selected */}
          <div className="flex-1 flex flex-col items-center justify-center mx-4">
            {selectedTicket ? (
              <>
                {/* First line: "Ticket" + Status Badge as dropdown button */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-700">Ticket</span>
                  <Popover className="relative">
                    <Popover.Button className={`px-2 py-0.5 rounded-full text-xs font-medium transition-all duration-200 hover:ring-2 hover:ring-blue-300 ${getStatusBadgeClass(selectedTicket.status)}`}>
                      {selectedTicket.status}
                    </Popover.Button>
                    <Transition
                      enter="transition ease-out duration-200"
                      enterFrom="opacity-0 translate-y-1"
                      enterTo="opacity-100 translate-y-0"
                      leave="transition ease-in duration-150"
                      leaveFrom="opacity-100 translate-y-0"
                      leaveTo="opacity-0 translate-y-1"
                    >
                      <Popover.Panel className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-[10002]">
                        {({ close }) => (
                          <>
                            <button
                              onClick={() => {
                                handleStatusChange(selectedTicket.id, 'open');
                                close();
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                            >
                              {selectedTicket.status === 'open' && <Check className="h-4 w-4 text-blue-600" />}
                              <span className={selectedTicket.status === 'open' ? 'font-medium' : ''}>Open</span>
                            </button>
                            <button
                              onClick={() => {
                                handleStatusChange(selectedTicket.id, 'in_progress');
                                close();
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                            >
                              {selectedTicket.status === 'in_progress' && <Check className="h-4 w-4 text-blue-600" />}
                              <span className={selectedTicket.status === 'in_progress' ? 'font-medium' : ''}>In Progress</span>
                            </button>
                            <button
                              onClick={() => {
                                handleStatusChange(selectedTicket.id, 'closed');
                                close();
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                            >
                              {selectedTicket.status === 'closed' && <Check className="h-4 w-4 text-blue-600" />}
                              <span className={selectedTicket.status === 'closed' ? 'font-medium' : ''}>Closed</span>
                            </button>
                          </>
                        )}
                      </Popover.Panel>
                    </Transition>
                  </Popover>
                </div>
                {/* Second line: Ticket subject (smaller, lighter, centered) */}
                <h2 className="text-xs font-normal text-slate-500 truncate max-w-full mt-0.5">
                  {selectedTicket.subject}
                </h2>
              </>
            ) : (
              <h2 className="text-sm font-semibold text-slate-700">Ticket Management</h2>
            )}
          </div>
          
          {/* Right side: Close button only */}
          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-600 hover:text-red-600 hover:bg-red-50 transition-all duration-200"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedTicket ? (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
                <div className="max-w-3xl mx-auto space-y-4">
                {/* Initial message */}
                <div className="flex justify-end">
                  <div className="max-w-[85%]">
                    <Tooltip 
                      content={`${selectedTicket.full_name || 'Anonymous'}${selectedTicket.email ? ' • ' + selectedTicket.email : ''} • ${new Date(selectedTicket.created_at).toLocaleString()}`}
                    >
                      <div className="bg-slate-100 border border-slate-200 text-slate-800 rounded-2xl rounded-tr-sm shadow-sm px-4 py-3 cursor-help">
                        <div className="mb-1.5">
                          <span className="text-xs font-medium text-slate-600 truncate block">
                            {selectedTicket.full_name || 'Anonymous'}
                          </span>
                        </div>
                        <p className="text-sm leading-relaxed">{selectedTicket.message}</p>
                        <span className="text-xs text-slate-500 mt-1 block">
                          {new Date(selectedTicket.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </Tooltip>
                  </div>
                </div>

                {/* Responses */}
                {selectedTicket.ticket_responses.map((response) => {
                  const avatar = getAvatarForResponse(response);
                  const displayName = response.is_admin 
                    ? (avatar?.full_name || avatar?.title || 'Admin')
                    : (selectedTicket.full_name || 'Anonymous');
                  
                  return (
                    <div key={response.id} className={`flex ${response.is_admin ? 'justify-start' : 'justify-end'}`}>
                      <div className="max-w-[85%]">
                        <Tooltip 
                          content={`${displayName}${!response.is_admin && selectedTicket.email ? ' • ' + selectedTicket.email : ''} • ${new Date(response.created_at).toLocaleString()}`}
                        >
                          <div className={`${response.is_admin ? 'bg-blue-500 text-white rounded-2xl rounded-tl-sm' : 'bg-slate-100 border border-slate-200 text-slate-800 rounded-2xl rounded-tr-sm'} shadow-sm px-4 py-3 cursor-help`}>
                            <div className="mb-1.5">
                              <span className={`text-xs font-medium ${response.is_admin ? 'opacity-90' : 'text-slate-600'} truncate block`}>
                                {displayName}
                              </span>
                            </div>
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{response.message}</p>
                            <span className={`text-xs ${response.is_admin ? 'opacity-75' : 'text-slate-500'} mt-1 block`}>
                              {new Date(response.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </Tooltip>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Input Area */}
              <div className="p-4 bg-white border-t border-slate-200">
                <div className={`${size === 'fullscreen' || size === 'half' ? 'max-w-2xl mx-auto' : ''}`}>
                {/* Predefined Responses Badges - Horizontal Scroll (matching ChatWidget task badges) */}
                {predefinedResponses.length > 0 && (
                  <div className="mb-3 max-h-16 overflow-x-auto overflow-y-hidden" style={{
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
                        className="inline-flex items-center p-2 bg-slate-100 rounded-full text-slate-600 hover:bg-slate-200 transition-colors flex-shrink-0"
                        title="Add predefined response"
                      >
                        <PlusIcon className="h-5 w-5" />
                      </button>
                      {predefinedResponses
                        .filter(r => !searchQuery || r.subject.toLowerCase().includes(searchQuery.toLowerCase()) || r.text.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map((response) => (
                        <button
                          key={response.id}
                          onClick={() => usePredefinedResponse(response)}
                          className="flex-shrink-0 inline-flex items-center px-4 py-2 bg-slate-100 rounded-full text-sm font-medium text-slate-600 hover:bg-slate-200 transition-colors whitespace-nowrap"
                        >
                          {response.subject}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Message Input */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 focus-within:border-blue-300 focus-within:ring-4 focus-within:ring-blue-100 transition-all duration-200">
                  <div className="flex items-end gap-3">
                    <div className="flex-1 relative">
                      <textarea
                        ref={inputRef}
                        value={responseMessage}
                        onChange={(e) => setResponseMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleAdminRespond())}
                        placeholder="Type your message..."
                        className="w-full resize-none border-0 bg-transparent text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-0 text-base leading-relaxed min-h-[44px] max-h-[120px]"
                        rows={1}
                        disabled={isSubmitting}
                      />
                    </div>
                    <button
                      onClick={handleAdminRespond}
                      disabled={!responseMessage.trim() || isSubmitting}
                      className="flex items-center justify-center w-10 h-10 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-200 text-white rounded-xl shadow-sm hover:shadow-md disabled:shadow-none transition-all duration-200 disabled:cursor-not-allowed"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                      </svg>
                    </button>
                  </div>
                  
                  {/* Bottom row with search and avatar selector */}
                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-2 flex-1">
                      <button
                        onClick={() => {
                          setShowSearch(!showSearch);
                          if (showSearch) {
                            setSearchQuery('');
                          }
                        }}
                        className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 ${
                          showSearch 
                            ? 'text-blue-600 bg-blue-50 hover:bg-blue-100'
                            : 'text-slate-500 hover:text-blue-600 hover:bg-blue-50'
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
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search predefined responses..."
                            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                            autoFocus
                          />
                        </div>
                      )}
                    </div>

                    {/* Avatar Selector */}
                    {avatars.length > 1 && (
                      <Listbox value={selectedAvatar} onChange={setSelectedAvatar}>
                        <div className="relative">
                          <Listbox.Button className="flex items-center justify-center w-8 h-8 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200">
                            <UserCircleIcon className="h-5 w-5" />
                          </Listbox.Button>
                          <Transition
                            leave="transition ease-in duration-100"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                          >
                            <Listbox.Options className="absolute bottom-full right-0 mb-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 max-h-60 overflow-auto focus:outline-none text-sm z-50">
                              {avatars.map((avatar) => (
                                <Listbox.Option
                                  key={avatar.id}
                                  value={avatar}
                                  className={({ active }) =>
                                    `relative cursor-pointer select-none py-2 pl-3 pr-9 ${
                                      active ? 'bg-blue-50 text-blue-900' : 'text-slate-900'
                                    }`
                                  }
                                >
                                  {({ selected }) => (
                                    <>
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
                                    </>
                                  )}
                                </Listbox.Option>
                              ))}
                            </Listbox.Options>
                          </Transition>
                        </div>
                      </Listbox>
                    )}
                  </div>
                </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Ticket List */}
              <div className="flex-1 overflow-y-auto bg-slate-50">
                {groupedTickets[activeTab].length === 0 ? (
                  <div className="flex items-center justify-center h-full text-slate-400">
                    <p>No {activeTab} tickets</p>
                  </div>
                ) : (
                  <div className="p-4 space-y-2">
                    {groupedTickets[activeTab].map((ticket) => (
                      <button
                        key={ticket.id}
                        onClick={() => handleTicketSelect(ticket)}
                        className="w-full p-4 text-left bg-white border border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h3 className="font-medium text-slate-900 text-sm">{ticket.subject}</h3>
                            <p className="text-xs text-slate-600 mt-1">{ticket.full_name || 'Anonymous'}</p>
                          </div>
                          {isWaitingForResponse(ticket) && (
                            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500">
                          {new Date(ticket.created_at).toLocaleDateString()}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Bottom Tabs - Only show when no ticket selected */}
          {!selectedTicket && (
            <div className="flex justify-center px-2 py-2 bg-white border-t border-slate-200">
              <div className="relative bg-white/80 backdrop-blur-2xl p-1 rounded-2xl border border-gray-200/50 w-full">
                {/* Background slider */}
                <div 
                  className={`absolute top-1 h-[calc(100%-8px)] bg-white rounded-xl shadow-sm border border-gray-100 transition-all duration-150 ease-out ${
                    activeTab === 'in progress' 
                      ? 'left-1 w-[calc(33.333%-4px)]' 
                      : activeTab === 'open'
                      ? 'left-[calc(33.333%+1px)] w-[calc(33.333%-4px)]'
                      : 'left-[calc(66.666%+1px)] w-[calc(33.333%-4px)]'
                  }`}
                />
                
                <div className="relative flex">
                  {statuses.map((status) => {
                    const isActive = activeTab === status;
                    
                    return (
                      <button
                        key={status}
                        onClick={() => setActiveTab(status)}
                        className={`relative px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ease-out antialiased tracking-[-0.01em] flex-1 flex items-center justify-center ${
                          isActive
                            ? 'text-gray-900'
                            : 'text-gray-600 hover:text-gray-800'
                        }`}
                      >
                        <span className="capitalize">{status}</span>
                        <span className="ml-1 text-xs opacity-60">
                          ({groupedTickets[status].length})
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
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
