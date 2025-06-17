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
    case 'in progress':
      return 'bg-yellow-100 text-yellow-800';
    case 'closed':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

// Modern toggle button component
const StatusToggle = ({ status, onChange, currentStatus }: { status: string; onChange: (status: string) => void; currentStatus: string }) => {
  const isActive = currentStatus === status;
  return (
    <button
      type="button"
      onClick={() => onChange(status)}
      className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
        isActive
          ? 'bg-blue-600 text-white shadow-md'
          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
      }`}
    >
      {status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}
    </button>
  );
};

export default function AdminTicketsPage() {
  const { settings } = useSettings();
  const organizationId = settings.organization_id;
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
        .eq('organization_id', organizationId)
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
          organization_id: organizationId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit response');
      }

      const newResponse: TicketResponse = {
        id: crypto.randomUUID(),
        message: responseMessage,
        is_admin: true, // Admin response
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

  // Handle status change
  const handleStatusChange = async (ticketId: string, status: string) => {
    try {
      // Only proceed if status is different to avoid unnecessary updates
      if (!selectedTicket || selectedTicket.status === status) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) {
        console.error('No authenticated user ID found');
        setToast({ message: 'Unauthorized: No user ID', type: 'error' });
        return;
      }

      console.log(`Attempting to update ticket ${ticketId} from ${selectedTicket.status} to ${status}`);
      const payload = {
        ticket_id: ticketId,
        status,
        organization_id: organizationId,
        user_id: user.id,
      };
      console.log('Request payload:', payload); // Debug the payload
      const response = await fetch('/api/tickets/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      console.log('API response:', result);

      if (!response.ok) {
        console.error('API error:', result.error);
        setToast({ message: `Failed to update status: ${result.error || 'Unknown error'}`, type: 'error' });
        return;
      }

      // Update local state with the confirmed data from the server
      const updatedTicket = result.data;
      setTickets((prevTickets) =>
        prevTickets.map((ticket) =>
          ticket.id === ticketId ? { ...ticket, status: updatedTicket.status } : ticket
        )
      );
      setSelectedTicket((prev) =>
        prev && prev.id === ticketId ? { ...prev, status: updatedTicket.status } : prev
      );

      setToast({ message: `Ticket status updated to ${updatedTicket.status}`, type: 'success' });
      await fetchTickets(); // Final sync to ensure consistency
    } catch (error: any) {
      setToast({ message: `Failed to update status: ${error.message}`, type: 'error' });
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
      <h1 className="mb-6 text-3xl font-bold text-gray-900">Ticket Management</h1>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Ticket List - 1/3 width on desktop */}
        <div className="space-y-4 lg:col-span-1">
          <h2 className="text-xl font-semibold text-gray-800">Tickets</h2>
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
                  <span className="text-xs text-gray-500 block mb-1">
                    Customer: {ticket.email || ticket.full_name || 'Unknown'}
                  </span>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <span className="text-xs text-gray-500 block mb-1">ID: {ticket.id}</span>
                      <h3 className="text-sm font-semibold text-gray-900">
                        <span className="text-xs font-medium text-gray-500">Subject: </span>
                        {ticket.subject}
                      </h3>
                    </div>
                    <span
                      className={`ml-2 rounded-full px-2 py-0.5 text-xs font-semibold ${getStatusStyles(
                        ticket.status
                      )}`}
                    >
                      {ticket.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
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
              {/* Fixed Top Section - Refined Design */}
              <div className="sticky top-0 z-10 bg-white border-b border-gray-200 pb-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-xs text-gray-500 block mb-1">ID: {selectedTicket.id}</span>
                    <h2 className="text-sm font-semibold text-gray-900">
                      <span className="text-xs font-medium text-gray-500">Subject: </span>
                      {selectedTicket.subject}
                    </h2>
                  </div>
                  <div className="flex space-x-2">
                    <StatusToggle
                      status="open"
                      onChange={(status) => handleStatusChange(selectedTicket.id, status)}
                      currentStatus={selectedTicket.status}
                    />
                    <StatusToggle
                      status="in progress"
                      onChange={(status) => handleStatusChange(selectedTicket.id, status)}
                      currentStatus={selectedTicket.status}
                    />
                    <StatusToggle
                      status="closed"
                      onChange={(status) => handleStatusChange(selectedTicket.id, status)}
                      currentStatus={selectedTicket.status}
                    />
                  </div>
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
                      response.is_admin ? 'ml-auto bg-blue-50 text-right' : 'bg-gray-50 text-left'
                    } max-w-[60%] flex items-center`}
                  >
                    <div className="w-full">
                      <p className="text-[10px] text-gray-500 mb-1">
                        {response.is_admin ? 'Admin' : `Customer: ${selectedTicket.email || selectedTicket.full_name || 'Unknown'}`}{' '}
                        • {new Date(response.created_at).toISOString().split('T')[0]}{' '}
                        {new Date(response.created_at).toTimeString().split(' ')[0]}
                      </p>
                      <p className="text-sm text-gray-800">{response.message}</p>
                    </div>
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