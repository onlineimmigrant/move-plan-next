'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useSettings } from '@/context/SettingsContext';
import Button from '@/ui/Button';
import Toast from '@/components/Toast';
import { Listbox } from '@headlessui/react';
import { Menu, X, ChevronDown, MoreHorizontal } from 'lucide-react';

interface TicketResponse {
  id: string;
  message: string;
  is_admin: boolean;
  created_at: string;
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

interface PredefinedResponse {
  id: string;
  order: number;
  subject: string;
  text: string;
}

const statuses = ['open', 'in progress', 'closed'];
const BADGES_PER_PAGE = 5;

export default function AdminTicketsPage() {
  const { settings } = useSettings();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [responseMessage, setResponseMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [activeTab, setActiveTab] = useState(statuses[0]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [predefinedResponses, setPredefinedResponses] = useState<PredefinedResponse[]>([]);
  const [visibleBadgesPage, setVisibleBadgesPage] = useState(1);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetchTickets();
    fetchPredefinedResponses();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [selectedTicket]);

  const fetchTickets = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: ticketsData, error } = await supabase
      .from('tickets')
      .select('*, ticket_responses(*)')
      .eq('organization_id', settings.organization_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error(error);
      setToast({ message: 'Failed to fetch tickets', type: 'error' });
    } else {
      setTickets(ticketsData || []);
    }
  };

  const fetchPredefinedResponses = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('tickets_predefined_responses')
      .select('id, order, subject, text')
      .eq('organization_id', settings.organization_id)
      .order('order', { ascending: true });

    if (error) {
      console.error(error);
      setToast({ message: 'Failed to fetch predefined responses', type: 'error' });
    } else {
      setPredefinedResponses(data || []);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleStatusChange = async (ticketId: string, status: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const res = await fetch('/api/tickets/status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ticket_id: ticketId,
        status,
        user_id: user.id,
        organization_id: settings.organization_id,
      }),
    });

    const result = await res.json();
    if (!res.ok) {
      return setToast({ message: result.error || 'Failed to update status', type: 'error' });
    }

    await fetchTickets();
    if (selectedTicket?.id === ticketId) {
      setSelectedTicket({ ...selectedTicket, status });
    }
    setToast({ message: 'Status updated', type: 'success' });
  };

  const handleRespond = async () => {
    if (!responseMessage.trim() || !selectedTicket) return;

    setIsSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();

    const res = await fetch('/api/tickets/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ticket_id: selectedTicket.id,
        message: responseMessage,
        user_id: user?.id,
        organization_id: settings.organization_id,
      }),
    });

    if (!res.ok) {
      const error = await res.json();
      setToast({ message: error.error || 'Failed to respond', type: 'error' });
    } else {
      setResponseMessage('');
      await fetchTickets();
      setSelectedTicket((t) =>
        t && t.id === selectedTicket.id
          ? {
              ...t,
              ticket_responses: [
                ...t.ticket_responses,
                {
                  id: crypto.randomUUID(),
                  message: responseMessage,
                  is_admin: true,
                  created_at: new Date().toISOString(),
                },
              ],
            }
          : t
      );
      scrollToBottom();
    }

    setIsSubmitting(false);
  };

  const handleTicketSelect = async (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setIsSidebarOpen(false);
    if (ticket.status === 'open') {
      await handleStatusChange(ticket.id, 'in progress');
    }
  };

  const handlePredefinedResponseClick = (text: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentValue = responseMessage;

    // Insert text at cursor or append if no selection
    const newValue =
      currentValue.slice(0, start) + text + currentValue.slice(end);

    setResponseMessage(newValue);

    // Move cursor to end of inserted text
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + text.length, start + text.length);
    }, 0);
  };

  const handleLoadMoreBadges = () => {
    setVisibleBadgesPage((prev) => prev + 1);
  };

  const groupedTickets = statuses.reduce(
    (acc, status) => ({
      ...acc,
      [status]: tickets.filter((ticket) => ticket.status === status),
    }),
    {} as Record<string, Ticket[]>
  );

  const isWaitingForResponse = (ticket: Ticket) => {
    if (ticket.ticket_responses.length === 0) return false;
    const latestResponse = ticket.ticket_responses[ticket.ticket_responses.length - 1];
    return !latestResponse.is_admin;
  };

  const getTabCount = (status: string) => {
    if (status === 'in progress') {
      const count = groupedTickets[status].filter(isWaitingForResponse).length;
      return count > 0 ? count : null;
    }
    if (status === 'open') {
      const count = groupedTickets[status].length;
      return count > 0 ? count : null;
    }
    return null;
  };

  const getTicketCount = (status: string) => {
    return groupedTickets[status].length;
  };

  const totalActiveTickets =
    groupedTickets['open'].length + groupedTickets['in progress'].filter(isWaitingForResponse).length;

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

  const getTabCircleClass = (status: string) => {
    switch (status) {
      case 'open':
        return 'outline outline-1 outline-red-500 text-red-500 bg-transparent';
      case 'in progress':
        return 'bg-red-600 text-white';
      case 'closed':
        return 'bg-gray-200 text-gray-800';
      default:
        return 'bg-gray-200 text-gray-800';
    }
  };

  const visibleBadges = predefinedResponses.slice(0, visibleBadgesPage * BADGES_PER_PAGE);
  const hasMoreBadges = predefinedResponses.length > visibleBadges.length;

  return (
    <div className="flex h-screen">
      {toast && <Toast {...toast} onClose={() => setToast(null)} duration={5000} />}
      <button
        className="md:hidden fixed top-4 left-4 z-50 w-10 h-10 bg-sky-600 text-white rounded-full flex items-center justify-center relative"
        onClick={() => setIsSidebarOpen(true)}
      >
        <Menu className="w-6 h-6" />
        {totalActiveTickets > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 text-xs font-semibold text-white bg-red-500 rounded-full flex items-center justify-center">
            {totalActiveTickets}
          </span>
        )}
      </button>
      <aside
        className={`sm:pr-8 fixed inset-y-0 left-0 w-full sm:w-120 z-51 bg-gray-50 border-r border-gray-200 overflow-y-auto p-4 transition-transform duration-300 md:static md:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0 z-40' : '-translate-x-full'
        }`}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Tickets</h2>
          <button
            className="md:hidden text-gray-500"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="flex border-b border-gray-200 mb-4">
          {statuses.map((status) => {
            const tabCount = getTabCount(status);
            return (
              <button
                key={status}
                className={`cursor-pointer flex-1 py-2 px-4 text-sm font-medium text-center flex items-center justify-center space-x-2 ${
                  activeTab === status
                    ? 'border-b-2 border-sky-600 text-sky-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab(status)}
              >
                <span className="text-gray-300">{getTicketCount(status)}</span>
                <span>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
                {tabCount !== null && (
                  <span
                    className={`inline-flex items-center justify-center w-5 h-5 text-xs font-semibold rounded-full ${getTabCircleClass(
                      status
                    )}`}
                  >
                    {tabCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {groupedTickets[activeTab].length === 0 ? (
          <p className="text-sm text-gray-500">No {activeTab} tickets found.</p>
        ) : (
          <ul className="space-y-2">
            {groupedTickets[activeTab].map((ticket) => (
              <li
                key={ticket.id}
                className={`p-3 rounded cursor-pointer hover:bg-blue-100 relative ${
                  selectedTicket?.id === ticket.id ? 'bg-blue-200' : 'bg-white'
                }`}
                onClick={() => handleTicketSelect(ticket)}
              >
                {isWaitingForResponse(ticket) && (
                  <span className="absolute top-1 right-1 text-xs italic text-sky-500">
                    Waiting for Response
                  </span>
                )}
                <div className="text-sm font-medium text-gray-800 mt-3">{ticket.subject}</div>
                <div className="text-xs text-gray-500">{ticket.email}</div>
                <span
                  className={`inline-block mt-1 px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(
                    ticket.status
                  )}`}
                >
                  {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                </span>
                <div className="text-[10px] text-gray-400 mt-1">ID: {ticket.id}</div>
              </li>
            ))}
          </ul>
        )}
      </aside>
      <main className="flex-1 flex flex-col">
        {!selectedTicket ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-500">Select a ticket to view details</p>
          </div>
        ) : (
          <>
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-600">{selectedTicket.subject}</h3>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-white">
              <div className="bg-gray-100 p-4 rounded shadow-sm text-sm">
                <div className="text-xs text-gray-500 mb-2">Initial message</div>
                {selectedTicket.message}
              </div>
              {selectedTicket.ticket_responses.map((res) => (
                <div
                  key={res.id}
                  className={`max-w-[75%] p-3 text-sm rounded-lg shadow ${
                    res.is_admin
                      ? 'ml-auto bg-blue-50 border border-blue-200'
                      : 'bg-gray-100 border border-gray-200'
                  }`}
                >
                  <div className="text-xs text-gray-500 mb-1">
                    {res.is_admin ? 'Support' : selectedTicket.email} •{' '}
                    {new Date(res.created_at).toLocaleString()}
                  </div>
                  <div>{res.message}</div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <div className="border-t border-gray-200 p-4 bg-gray-50">
              {selectedTicket.status === 'closed' ? (
                <div className="text-sm text-gray-500">
                  This ticket is closed. Change the status to "In Progress" to send a response.
                </div>
              ) : (
                <>
                  <textarea
                    ref={textareaRef}
                    value={responseMessage}
                    onChange={(e) => setResponseMessage(e.target.value)}
                    rows={3}
                    placeholder="Type your response..."
                    className="w-full border border-gray-200 bg-white rounded p-2 text-sm mb-2"
                  />
                  <div className="flex flex-wrap gap-2 mb-2">
                    {visibleBadges.map((response) => (
                      <button
                        key={response.id}
                        onClick={() => handlePredefinedResponseClick(response.text)}
                        className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-200 rounded-full hover:bg-gray-300 cursor-pointer"
                      >
                        {response.subject}
                      </button>
                    ))}
                    {hasMoreBadges && (
                      <button
                        onClick={handleLoadMoreBadges}
                        className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-200 rounded-full hover:bg-gray-300 cursor-pointer flex items-center"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </>
              )}
              <div className="flex justify-between mt-2">
                <Listbox
                  value={selectedTicket.status}
                  onChange={(status) => handleStatusChange(selectedTicket.id, status)}
                >
                  <div className="relative">
                    <Listbox.Button className="flex items-center px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300">
                      {selectedTicket.status}
                      <ChevronDown className="w-4 h-4 ml-2" />
                    </Listbox.Button>
                    <Listbox.Options className="absolute left-0 bottom-full mb-1 w-40 bg-white border border-gray-200 rounded shadow-lg text-sm">
                      {statuses.map((status) => (
                        <Listbox.Option
                          key={status}
                          value={status}
                          className={({ active }) =>
                            `px-4 py-2 cursor-pointer ${
                              active ? 'bg-blue-100 text-blue-900' : 'text-gray-900'
                            }`
                          }
                        >
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </Listbox.Option>
                      ))}
                    </Listbox.Options>
                  </div>
                </Listbox>
                <Button
                  onClick={handleRespond}
                  disabled={isSubmitting || selectedTicket.status === 'closed' || !responseMessage.trim()}
                  variant="primary"
                >
                  {isSubmitting ? 'Sending...' : 'Send Response'}
                </Button>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}