'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useSettings } from '@/context/SettingsContext';
import Button from '@/ui/Button';
import Toast from '@/components/Toast';
import { Menu, X } from 'lucide-react';
import AccountTab from '@/components/AccountTab';

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

const statuses = ['open', 'in progress', 'closed'];

export default function CustomerTicketsPage() {
  const { settings } = useSettings();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [responseMessage, setResponseMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [activeTab, setActiveTab] = useState(statuses[0]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchTickets();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [selectedTicket]);

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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleRespond = async () => {
    if (!responseMessage.trim() || !selectedTicket) return;

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const response = await fetch('/api/tickets/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticket_id: selectedTicket.id,
          message: responseMessage,
          user_id: user?.id,
          organization_id: settings.organization_id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit response');
      }

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
                  is_admin: false,
                  created_at: new Date().toISOString(),
                },
              ],
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
    setIsSidebarOpen(false);
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
    return latestResponse.is_admin; // Customer should respond if Support sent last
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
    return null; // No circle for closed
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

  return (
    
    <div className="flex  py-4 pt-16 h-screen mx-auto max-w-5xl">
     
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
          <h2 className="text-xl font-semibold">My Tickets</h2>
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
                <div className="text-sm text-gray-500">This ticket is closed.</div>
              ) : (
                <>
                  <textarea
                    value={responseMessage}
                    onChange={(e) => setResponseMessage(e.target.value)}
                    rows={3}
                    placeholder="Type your response..."
                    className="w-full border border-gray-200 bg-white rounded p-2 text-sm mb-2"
                  />
                  <div className="flex justify-end mt-2">
                    <Button
                      onClick={handleRespond}
                      disabled={isSubmitting || !responseMessage.trim()}
                      variant="primary"
                    >
                      {isSubmitting ? 'Sending...' : 'Send Response'}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}