'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useSettings } from '@/context/SettingsContext';
import Button from '@/ui/Button';
import Toast from '@/components/Toast';

// Interfaces for type safety
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

// Utility function to map status to Tailwind classes
const getStatusStyles = (status: string) => {
  switch (status) {
    case 'open':
      return 'bg-green-100 text-green-800';
    case 'in_progress':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-red-100 text-red-800';
  }
};

export default function CustomerTicketsPage() {
  const { settings } = useSettings();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [responseMessage, setResponseMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Fetch tickets on mount
  useEffect(() => {
    fetchTickets();
  }, []);

  // Fetch tickets from Supabase
  const fetchTickets = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setToast({ message: 'User not authenticated', type: 'error' });
        return;
      }

      const { data: ticketsData, error: ticketsError } = await supabase
        .from('tickets')
        .select('id, subject, status, customer_id, created_at, message, preferred_contact_method, email, full_name')
        .eq('organization_id', settings.organization_id)
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });

      if (ticketsError) {
        console.error('Error fetching tickets:', ticketsError);
        setToast({ message: 'Failed to load tickets', type: 'error' });
        return;
      }

      if (!ticketsData?.length) {
        setTickets([]);
        return;
      }

      const ticketIds = ticketsData.map((t) => t.id);
      const { data: responsesData, error: responsesError } = await supabase
        .from('ticket_responses')
        .select('id, ticket_id, message, is_admin, created_at')
        .in('ticket_id', ticketIds)
        .order('created_at', { ascending: true });

      if (responsesError) {
        console.error('Error fetching responses:', responsesError);
        setToast({ message: 'Failed to load responses', type: 'error' });
        return;
      }

      const ticketsWithResponses = ticketsData.map((ticket) => ({
        ...ticket,
        ticket_responses: responsesData?.filter((r) => r.ticket_id === ticket.id) || [],
      }));

      setTickets(ticketsWithResponses);
    } catch (error) {
      console.error('Unexpected error in fetchTickets:', error);
      setToast({ message: 'An unexpected error occurred', type: 'error' });
    }
  };

  // Handle ticket response submission
  const handleRespond = async (ticketId: string) => {
    if (!responseMessage.trim()) {
      setToast({ message: 'Response message is required', type: 'error' });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const response = await fetch('/api/tickets/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticket_id: ticketId,
          message: responseMessage,
          user_id: user?.id,
          organization_id: settings.organization_id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit response');
      }

      const newResponse: TicketResponse = {
        id: crypto.randomUUID(),
        message: responseMessage,
        is_admin: false,
        created_at: new Date().toISOString(),
      };

      setSelectedTicket((prev) =>
        prev
          ? {
              ...prev,
              ticket_responses: [...prev.ticket_responses, newResponse],
            }
          : prev
      );
      setResponseMessage('');
      setToast({ message: 'Response sent successfully', type: 'success' });
      await fetchTickets(); // Sync with server
    } catch (error: any) {
      setToast({ message: error.message || 'Failed to submit response', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
          duration={5000}
        />
      )}
      <h1 className="mb-6 text-3xl font-bold text-gray-900">My Support Tickets</h1>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Ticket List - 1/3 width on desktop */}
        <div className="space-y-4 lg:col-span-1">
          <h2 className="text-xl font-semibold text-gray-800">Your Tickets</h2>
          {tickets.length === 0 ? (
            <p className="text-gray-500">No tickets found.</p>
          ) : (
            <ul className="space-y-3">
              {tickets.map((ticket) => (
                <li
                  key={ticket.id}
                  className={`cursor-pointer rounded-lg border border-gray-200 p-3 transition-shadow hover:shadow-md ${
                    selectedTicket?.id === ticket.id ? 'bg-blue-50 shadow-md' : 'bg-white'
                  }`}
                  onClick={() => setSelectedTicket(ticket)}
                >
                  <span className="sm:text-right text-xs text-gray-500 block mb-2">ID: {ticket.id}</span>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-gray-900">
                      <span className="text-xs font-medium text-gray-500">Subject: </span>
                      {ticket.subject}
                    </h3>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${getStatusStyles(
                        ticket.status
                      )}`}
                    >
                      {ticket.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    <span className="font-medium">Created: </span>
                    {new Date(ticket.created_at).toLocaleDateString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Ticket Details - 2/3 width on desktop */}
        <div className="lg:col-span-2">
          {selectedTicket ? (
            <div className="flex h-[80vh] flex-col rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <span className="sm:text-right text-xs text-gray-500">ID: {selectedTicket.id}</span>
              {/* Fixed Top Section - Refined Design */}
              <div className="sticky top-0 z-10 bg-white border-b border-gray-200 pb-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-gray-900">
                    <span className="text-xs font-medium text-gray-500">Subject: </span>
                    {selectedTicket.subject}
                  </h2>
                </div>
                <p className="text-xs font-medium text-gray-500 mb-1">Initial Message:</p>
                <div className="rounded-md bg-gray-50 p-3">
                  <p className="text-sm text-gray-800">{selectedTicket.message}</p>
                </div>
              </div>

              {/* Scrollable Messages Section */}
              <div className="flex-1 space-y-3 overflow-y-auto py-4 px-2 sm:px-4">
                {selectedTicket.ticket_responses.map((response) => (
                  <div
                    key={response.id}
                    className={`rounded-md p-3 ${
                      response.is_admin
                        ? 'ml-auto bg-blue-50 text-right'
                        : 'bg-gray-50 text-left'
                    } max-w-[60%]`}
                  >
                    <p className="text-[10px] text-gray-500 mb-1">
                      {response.is_admin
                        ? 'Admin'
                        : `You: ${selectedTicket.email || selectedTicket.full_name || 'Unknown'}`}{' '}
                      • {new Date(response.created_at).toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-800">{response.message}</p>
                  </div>
                ))}
              </div>

              {/* Fixed Response Input Section */}
              <div className="sticky bottom-0 bg-white border-t border-gray-200 pt-4">
                <textarea
                  value={responseMessage}
                  onChange={(e) => setResponseMessage(e.target.value)}
                  placeholder="Type your response..."
                  rows={4}
                  className="mb-4 w-full resize-none rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Button
                  onClick={() => handleRespond(selectedTicket.id)}
                  variant="start"
                  disabled={isSubmitting}
                  className="w-full"
                >
                  {isSubmitting ? 'Sending...' : 'Send Response'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex h-[80vh] items-center justify-center rounded-lg border border-gray-200 bg-white p-6">
              <p className="text-gray-500">Select a ticket to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}