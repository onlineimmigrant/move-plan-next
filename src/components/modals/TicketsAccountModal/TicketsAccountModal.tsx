'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { XMarkIcon, ArrowsPointingOutIcon, ArrowsPointingInIcon } from '@heroicons/react/24/outline';
import { supabase } from '@/lib/supabase';
import { useSettings } from '@/context/SettingsContext';
import Button from '@/ui/Button';
import Toast from '@/components/Toast';
import Tooltip from '@/components/Tooltip';
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

interface TicketsAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type WidgetSize = 'initial' | 'half' | 'fullscreen';

const statuses = ['in progress', 'open', 'closed'];

export default function TicketsAccountModal({ isOpen, onClose }: TicketsAccountModalProps) {
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      fetchTickets();
      fetchAvatars();
    }
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

  const fetchTickets = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setToast({ message: 'User not authenticated', type: 'error' });
        return;
      }

      const { data: ticketsData, error: ticketsError } = await supabase
        .from('tickets')
        .select('id, subject, status, customer_id, created_at, message, preferred_contact_method, email, full_name, ticket_responses(*)')
        .eq('organization_id', settings.organization_id)
        .eq('customer_id', user.id)
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
        setAvatars([{ id: 'default', title: 'Support', full_name: undefined, image: undefined }]);
        return;
      }
      
      setAvatars([{ id: 'default', title: 'Support', full_name: undefined, image: undefined }, ...(data || [])]);
    } catch (err) {
      // Silently handle if table doesn't exist
      setAvatars([{ id: 'default', title: 'Support', full_name: undefined, image: undefined }]);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleRespond = async () => {
    if (!responseMessage.trim() || !selectedTicket) return;

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase.from('ticket_responses').insert({
        ticket_id: selectedTicket.id,
        user_id: user?.id,
        message: responseMessage,
        is_admin: false,
        created_at: new Date().toISOString(),
      }).select();

      if (error) throw new Error(error.message);

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
      setToast({ message: error.message || 'Failed to submit response', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTicketSelect = (ticket: Ticket) => {
    setSelectedTicket(ticket);
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
    if (ticket.ticket_responses.length === 0) return false;
    const latestResponse = ticket.ticket_responses[ticket.ticket_responses.length - 1];
    return latestResponse.is_admin;
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
                {/* First line: "Ticket" + Status Badge with tooltip */}
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-medium text-slate-600">Ticket</span>
                  <Tooltip content={new Date(selectedTicket.created_at).toLocaleString()}>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium cursor-help ${getStatusBadgeClass(selectedTicket.status)}`}>
                      {selectedTicket.status}
                    </span>
                  </Tooltip>
                </div>
                {/* Second line: Ticket subject */}
                <h2 className="text-sm font-semibold text-slate-700 truncate max-w-full">
                  {selectedTicket.subject}
                </h2>
              </>
            ) : (
              <h2 className="text-sm font-semibold text-slate-700">Support Tickets</h2>
            )}
          </div>
          
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
                <div className={`space-y-4 ${size === 'fullscreen' || size === 'half' ? 'max-w-2xl mx-auto' : ''}`}>
                {/* Initial message */}
                <div className="flex justify-end">
                  <div className="max-w-[85%] bg-blue-500 text-white rounded-2xl rounded-tr-sm shadow-sm px-4 py-3">
                    <p className="text-sm leading-relaxed">{selectedTicket.message}</p>
                    <span className="text-xs opacity-75 mt-1 block">
                      {new Date(selectedTicket.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                {/* Responses */}
                {selectedTicket.ticket_responses.map((response) => {
                  const avatar = getAvatarForResponse(response);
                  return (
                    <div key={response.id} className={`flex ${response.is_admin ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-[85%] ${response.is_admin ? 'bg-white border border-slate-200 text-slate-800 rounded-2xl rounded-tl-sm' : 'bg-blue-500 text-white rounded-2xl rounded-tr-sm'} shadow-sm px-4 py-3`}>
                        {response.is_admin && avatar && (
                          <div className="mb-1.5 flex items-center gap-2">
                            <span className="text-xs font-medium text-slate-600">{avatar.full_name || avatar.title}</span>
                          </div>
                        )}
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{response.message}</p>
                        <span className={`text-xs ${response.is_admin ? 'text-slate-500' : 'opacity-75'} mt-1 block`}>
                          {new Date(response.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
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
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 focus-within:border-blue-300 focus-within:ring-4 focus-within:ring-blue-100 transition-all duration-200">
                  <div className="flex items-end gap-3">
                    <div className="flex-1 relative">
                      <textarea
                        ref={inputRef}
                        value={responseMessage}
                        onChange={(e) => setResponseMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleRespond())}
                        placeholder="Type your message..."
                        className="w-full resize-none border-0 bg-transparent text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-0 text-base leading-relaxed min-h-[44px] max-h-[120px]"
                        rows={1}
                        disabled={isSubmitting}
                      />
                    </div>
                    <button
                      onClick={handleRespond}
                      disabled={!responseMessage.trim() || isSubmitting}
                      className="flex items-center justify-center w-10 h-10 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-200 text-white rounded-xl shadow-sm hover:shadow-md disabled:shadow-none transition-all duration-200 disabled:cursor-not-allowed"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                      </svg>
                    </button>
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
                          <h3 className="font-medium text-slate-900 text-sm">{ticket.subject}</h3>
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
