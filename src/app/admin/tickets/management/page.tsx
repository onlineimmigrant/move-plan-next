'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useSettings } from '@/context/SettingsContext';
import Button from '@/ui/Button';
import Toast from '@/components/Toast';
import { Listbox } from '@headlessui/react';
import { Menu, X, ChevronDown } from 'lucide-react';

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

export default function AdminTicketsPage() {
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

  const groupedTickets = statuses.reduce(
    (acc, status) => ({
      ...acc,
      [status]: tickets.filter((ticket) => ticket.status === status),
    }),
    {} as Record<string, Ticket[]>
  );

  return (
    <div className="flex h-screen">
      {toast && <Toast {...toast} onClose={() => setToast(null)} duration={5000} />}

      {/* Mobile Sidebar Toggle Button */}
      <button
        className="md:hidden fixed top-4 left-2 z-50 w-10 h-10 bg-sky-600 text-white rounded-full flex items-center justify-center"
        onClick={() => setIsSidebarOpen(true)}
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 w-full sm:w-80 z-51 bg-gray-50 border-r border-gray-200 overflow-y-auto p-4 transition-transform duration-300 md:static md:translate-x-0 ${
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

        {/* Tabs for Statuses */}
        <div className="flex border-b border-gray-200 mb-4">
          {statuses.map((status) => (
            <button
              key={status}
              className={`flex-1 py-2 px-4 text-sm font-medium text-center ${
                activeTab === status
                  ? 'border-b-2 border-sky-600 text-sky-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab(status)}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {groupedTickets[activeTab].length === 0 ? (
          <p className="text-sm text-gray-500">No {activeTab} tickets found.</p>
        ) : (
          <ul className="space-y-2">
            {groupedTickets[activeTab].map((ticket) => (
              <li
                key={ticket.id}
                className={`p-3 rounded cursor-pointer hover:bg-blue-100 ${
                  selectedTicket?.id === ticket.id ? 'bg-blue-200' : 'bg-white'
                }`}
                onClick={() => {
                  setSelectedTicket(ticket);
                  setIsSidebarOpen(false); // Close sidebar on mobile after selection
                }}
              >
                <div className="text-sm font-medium text-gray-800">{ticket.subject}</div>
                <div className="text-xs text-gray-500">{ticket.email}</div>
                <div className="text-xs text-gray-400">{ticket.status}</div>
                <div className="text-[10px] text-gray-400 mt-1">ID: {ticket.id}</div>
              </li>
            ))}
          </ul>
        )}
      </aside>

      {/* Main Panel */}
      <main className="flex-1 flex flex-col">
        {!selectedTicket ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-500">Select a ticket to view details</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{selectedTicket.subject}</h3>
                           {/* <p className="text-sm text-gray-600">{selectedTicket.email}</p>*/} 
              </div>
              <Listbox
                value={selectedTicket.status}
                onChange={(status) => handleStatusChange(selectedTicket.id, status)}
              >
                <div className="relative">
                  <Listbox.Button className="flex items-center px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300">
                    {selectedTicket.status}
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Listbox.Button>
                  <Listbox.Options className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded shadow-lg text-sm">
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
            </div>

            {/* Messages */}
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
                    {res.is_admin ? 'Admin' : selectedTicket.email} •{' '}
                    {new Date(res.created_at).toLocaleString()}
                  </div>
                  <div>{res.message}</div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 p-4 bg-gray-50">
              <textarea
                value={responseMessage}
                onChange={(e) => setResponseMessage(e.target.value)}
                rows={3}
                placeholder="Type your response..."
                className="w-full border border-gray-200 bg-white rounded p-2 text-sm mb-2"
              />
              <div className="flex justify-between">
           <Listbox
                value={selectedTicket.status}
                onChange={(status) => handleStatusChange(selectedTicket.id, status)}
              >
                <div className="relative">
                  <Listbox.Button className="flex items-center px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300">
                    {selectedTicket.status}
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Listbox.Button>
                  <Listbox.Options className="absolute left-0 mt-1 w-40 bg-white border border-gray-200 rounded shadow-lg text-sm">
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
                  disabled={isSubmitting}
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