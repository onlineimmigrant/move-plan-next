'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useSettings } from '@/context/SettingsContext';
import Button from '@/ui/Button';
import Toast from '@/components/Toast';

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
  ticket_responses: TicketResponse[];
  email: string;
}

export default function AdminTicketsPage() {
  const { settings } = useSettings();
  const organizationId = settings.organization_id;
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [responseMessage, setResponseMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const { data: ticketsData, error: ticketsError } = await supabase
        .from('tickets')
        .select('id, subject, status, customer_id, created_at, message, preferred_contact_method, email')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (ticketsError) {
        console.error('Error fetching tickets:', ticketsError);
        setShowToast({ message: 'Failed to load tickets', type: 'error' });
        return;
      }

      if (!ticketsData || ticketsData.length === 0) {
        setTickets([]);
        return;
      }

      const ticketIds = ticketsData.map((t) => t.id);
      console.log('Fetched Ticket IDs:', ticketIds); // Debug log

      const { data: responsesData, error: responsesError, count } = await supabase
        .from('ticket_responses')
        .select('id, ticket_id, message, is_admin, created_at', { count: 'exact' })
        .in('ticket_id', ticketIds)
        .order('created_at', { ascending: true });

      if (responsesError) {
        console.error('Error fetching responses:', responsesError);
        setShowToast({ message: 'Failed to load responses', type: 'error' });
        return;
      }

      console.log('Responses Data:', responsesData, 'Total Count:', count); // Enhanced debug log
      if (responsesData) {
        console.log('Responses by Ticket ID:', responsesData.reduce((acc, r) => {
          acc[r.ticket_id] = acc[r.ticket_id] || [];
          acc[r.ticket_id].push(r);
          return acc;
        }, {} as { [key: string]: TicketResponse[] }));
      }

      const ticketsWithResponses = ticketsData.map((ticket) => ({
        ...ticket,
        ticket_responses: responsesData?.filter((r) => r.ticket_id === ticket.id) || [],
      }));

      setTickets(ticketsWithResponses);
    } catch (error) {
      console.error('Unexpected error in fetchTickets:', error);
      setShowToast({ message: 'An unexpected error occurred', type: 'error' });
    }
  };

  const handleRespond = async (ticketId: string) => {
    if (!responseMessage.trim()) {
      setShowToast({ message: 'Response message is required', type: 'error' });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      const response = await fetch('/api/tickets/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticket_id: ticketId,
          message: responseMessage,
          user_id: user.user?.id,
          organization_id: organizationId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit response');
      }

      setResponseMessage('');
      setShowToast({ message: 'Response submitted successfully', type: 'success' });
      await fetchTickets();
      if (selectedTicket?.id === ticketId) {
        const updatedTicket = tickets.find((t) => t.id === ticketId);
        setSelectedTicket(updatedTicket || null);
      }
    } catch (error: any) {
      setShowToast({ message: error.message || 'Failed to submit response', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (ticketId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ status })
        .eq('id', ticketId)
        .eq('organization_id', organizationId);

      if (error) throw error;

      setShowToast({ message: `Ticket status updated to ${status}`, type: 'success' });
      await fetchTickets();
    } catch (error: any) {
      setShowToast({ message: 'Failed to update status', type: 'error' });
    }
  };

  return (
    <div className="container mx-auto p-6">
      {showToast && (
        <Toast
          message={showToast.message}
          type={showToast.type}
          onClose={() => setShowToast(null)}
          duration={5000}
        />
      )}
      <h1 className="text-2xl font-bold mb-6">Ticket Management</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <h2 className="text-lg font-semibold mb-4">Tickets</h2>
          <ul className="space-y-2">
            {tickets.map((ticket) => (
              <li
                key={ticket.id}
                className={`p-4 border rounded-md cursor-pointer ${
                  selectedTicket?.id === ticket.id ? 'bg-sky-100' : 'bg-white'
                }`}
                onClick={() => setSelectedTicket(ticket)}
              >
                <div className="flex justify-between">
                  <span className="font-medium">
                    {ticket.subject} (ID: {ticket.id})
                  </span>
                  <span
                    className={`text-sm ${
                      ticket.status === 'open'
                        ? 'text-green-500'
                        : ticket.status === 'in progress'
                        ? 'text-yellow-500'
                        : 'text-red-500'
                    }`}
                  >
                    {ticket.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{new Date(ticket.created_at).toLocaleDateString()}</p>
              </li>
            ))}
          </ul>
        </div>
        <div className="md:col-span-2">
          {selectedTicket && (
            <div className="p-6 bg-white border rounded-md">
              <h2 className="text-lg font-semibold mb-4">
                {selectedTicket.subject} (ID: {selectedTicket.id})
              </h2>
              <p className="text-sm text-gray-600 mb-2">
                Created: {new Date(selectedTicket.created_at).toLocaleString()}
              </p>
              <p className="text-sm text-gray-600 mb-4">
                Preferred Contact: {selectedTicket.preferred_contact_method || 'Not specified'}
              </p>
              <div className="mb-4">
                <h3 className="font-medium">Initial Message</h3>
                <p className="text-gray-700">{selectedTicket.message}</p>
              </div>
              <div className="space-y-4">
                {selectedTicket.ticket_responses.map((response) => (
                  <div
                    key={response.id}
                    className={`p-4 rounded-md ${response.is_admin ? 'bg-sky-50' : 'bg-gray-50'}`}
                  >
                    <p className="text-sm text-gray-600">
                      {response.is_admin ? 'Admin' : 'Customer'} •{' '}
                      {new Date(response.created_at).toLocaleString()}
                    </p>
                    <p className="text-gray-700">{response.message}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6">
                <select
                  value={selectedTicket.status}
                  onChange={(e) => handleStatusChange(selectedTicket.id, e.target.value)}
                  className="border rounded-md px-4 py-2 mb-4"
                >
                  <option value="open">Open</option>
                  <option value="in progress">In Progress</option>
                  <option value="closed">Closed</option>
                </select>
                <textarea
                  value={responseMessage}
                  onChange={(e) => setResponseMessage(e.target.value)}
                  placeholder="Type your response..."
                  rows={4}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 mb-4"
                />
                <Button
                  onClick={() => handleRespond(selectedTicket.id)}
                  variant="start"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Send Response'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}