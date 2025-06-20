'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useSettings } from '@/context/SettingsContext';
import Button from '@/ui/Button';
import Toast from '@/components/Toast';
import { Listbox, Popover, Transition } from '@headlessui/react';
import { Menu, X, ChevronDown, MoreHorizontal, Info, User, Users } from 'lucide-react';

interface TicketResponse {
  id: string;
  ticket_id: string;
  user_id: string;
  message: string;
  is_admin: boolean;
  created_at: string;
  avatar_id?: string;
  updated_at?: string;
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
  preferred_date?: string | null;
  preferred_time_range?: string | null;
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

const statuses = ['in progress', 'open', 'closed'];
const BADGES_PER_PAGE = 5;

// Default "Support" avatar
const defaultSupportAvatar = { id: 'default', title: 'Support', full_name: undefined, image: undefined };

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
  const [selectedAvatar, setSelectedAvatar] = useState<Avatar | null>(defaultSupportAvatar);
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetchTickets();
    fetchPredefinedResponses();
    fetchAvatars();
  }, [settings.organization_id]);

  useEffect(() => {
    if (selectedTicket) {
      console.log('Subscribing to channel:', `ticket_responses_${selectedTicket.id}`);
      const channel = supabase
        .channel(`ticket_responses_${selectedTicket.id}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'ticket_responses', filter: `ticket_id=eq.${selectedTicket.id}` },
          (payload) => {
            console.log('New message received:', payload.new);
            const newResponse = payload.new as TicketResponse; // Explicitly type the payload
            setSelectedTicket((prev) => {
            if (prev && prev.id === selectedTicket.id) {
                return { ...prev, ticket_responses: [...prev.ticket_responses, newResponse], _update: Date.now() };
            }
            return prev;
            });
            scrollToBottom();
          }
        )
        .subscribe((status) => {
          console.log('Channel subscription status:', status);
        });

      return () => {
        console.log('Unsubscribing from channel:', `ticket_responses_${selectedTicket.id}`);
        supabase.removeChannel(channel);
      };
    }
  }, [selectedTicket]);

  useEffect(() => {
    scrollToBottom();
  }, [selectedTicket?.ticket_responses]);

  const fetchTickets = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: ticketsData, error } = await supabase
      .from('tickets')
      .select(`
        id,
        subject,
        status,
        customer_id,
        created_at,
        message,
        preferred_contact_method,
        email,
        full_name,
        preferred_date,
        preferred_time_range,
        ticket_responses!inner (
          id,
          ticket_id,
          user_id,
          message,
          is_admin,
          created_at,
          avatar_id,
          updated_at
        )
      `)
      .eq('organization_id', settings.organization_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch tickets error:', error.message, error.details);
      setToast({ message: `Failed to fetch tickets: ${error.message}`, type: 'error' });
    } else {
      setTickets(ticketsData || []);
    }
  };

  const fetchAvatars = async () => {
    const { data, error } = await supabase
      .from('ticket_avatars')
      .select('id, title, full_name, image')
      .eq('organization_id', settings.organization_id)
      .order('title', { ascending: true });

    if (error) {
      console.error('Error fetching avatars:', error);
    } else {
      setAvatars([defaultSupportAvatar, ...data]);
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
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase.from('ticket_responses').insert({
        ticket_id: selectedTicket.id,
        user_id: user?.id,
        message: responseMessage,
        is_admin: true,
        created_at: new Date().toISOString(),
        avatar_id: selectedAvatar?.id === 'default' ? null : selectedAvatar?.id,
      }).select();

      if (error) throw new Error(error.message);

      setResponseMessage('');
      setSelectedTicket((prevTicket) =>
        prevTicket && prevTicket.id === selectedTicket.id
          ? {
              ...prevTicket,
              ticket_responses: [...prevTicket.ticket_responses, data[0]],
            }
          : prevTicket
      );
      scrollToBottom();
      setToast({ message: 'Response sent successfully', type: 'success' });
    } catch (error: any) {
      setToast({ message: error.message || 'Failed to respond', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
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

    const newValue = currentValue.slice(0, start) + text + currentValue.slice(end);

    setResponseMessage(newValue);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + text.length, start + text.length);
    }, 0);
  };

  const handleAvatarSelect = (avatar: Avatar) => {
    setSelectedAvatar(avatar);
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
    <div className="flex h-screen p-2">
      {toast && <Toast {...toast} onClose={() => setToast(null)} duration={5000} />}
      <button
        className="md:hidden absolute top-2 right-4 z-50 w-10 h-10 bg-sky-600 text-white rounded-full flex items-center justify-center"
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
        className={`p-4 sm:pr-8 fixed inset-y-0 left-0 w-full sm:w-128 z-51 bg-gray-50 border-r border-gray-200 transition-transform duration-300 md:static md:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0 z-40' : '-translate-x-full'
        }`}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Tickets</h2>
          <button className="md:hidden text-gray-500" onClick={() => setIsSidebarOpen(false)}>
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
        <div className="h-1/2 overflow-y-auto pr-8">
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
                    <span className="absolute top-1 right-4 text-xs italic text-sky-500">
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
                    {ticket.status === 'in progress'
                      ? 'In Progress'
                      : ticket.status === 'closed'
                      ? 'Closed'
                      : 'Open'}
                  </span>
                  <div className="text-[10px] text-gray-400 mt-1">ID: {ticket.id}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
      <main className="flex-1 flex flex-col">
        {!selectedTicket ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-500">Select a ticket to view details</p>
          </div>
        ) : (
          <>
            <div className="p-4 border-b border-gray-200 w-full">
              <h3 className="text-sm font-semibold text-gray-600">{selectedTicket.subject}</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-white w-full">
              <div className="bg-gray-100 p-4 rounded-lg shadow-sm text-sm mb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs text-gray-500">Initial message</div>
                  <Popover className="relative">
                    <Popover.Button className="text-gray-500 hover:text-gray-700">
                      <Info className="w-4 h-4" />
                    </Popover.Button>
                    <Popover.Panel className="absolute z-10 right-0 mt-2 w-64 bg-white border border-gray-200 rounded shadow-lg p-4 text-sm">
                      <div className="space-y-2">
                        <div>
                          <span className="font-medium">Subject:</span> {selectedTicket.subject}
                        </div>
                        <div>
                          <span className="font-medium">Full Name:</span> {selectedTicket.full_name || 'N/A'}
                        </div>
                        {selectedTicket.customer_id && (
                          <div>
                            <span className="font-medium">Customer ID:</span> {selectedTicket.customer_id}
                          </div>
                        )}
                        <div>
                          <span className="font-medium">Email:</span> {selectedTicket.email}
                        </div>
                        <div>
                          <span className="font-medium">Preferred Contact Method:</span>{' '}
                          {selectedTicket.preferred_contact_method || 'N/A'}
                        </div>
                        <div>
                          <span className="font-medium">Preferred Date:</span>{' '}
                          {selectedTicket.preferred_date || 'N/A'}
                        </div>
                        <div>
                          <span className="font-medium">Preferred Time Range:</span>{' '}
                          {selectedTicket.preferred_time_range || 'N/A'}
                        </div>
                      </div>
                    </Popover.Panel>
                  </Popover>
                </div>
                {selectedTicket.message}
              </div>
              {selectedTicket.ticket_responses.map((res) => {
                const avatar = res.avatar_id
                  ? avatars.find((a) => a.id === res.avatar_id)
                  : null;
                return (
                  <div
                    key={res.id}
                    className={`max-w-[75%] p-3 text-sm rounded-lg shadow ${
                      res.is_admin
                        ? 'ml-auto bg-blue-50 border border-blue-200'
                        : 'bg-gray-100 border border-gray-200'
                    }`}
                  >
                    <div className="text-xs text-gray-500 mb-1">
                      {res.is_admin && avatar ? `${avatar.title} • ` : res.is_admin ? 'Support • ' : 'Customer • '}
                      {new Date(res.created_at).toLocaleString()}
                    </div>
                    <div>{res.message}</div>
                    {res.is_admin && avatar && (
                      <div className="mt-2 flex items-center justify-end space-x-2">
                        {avatar.image ? (
                          <img
                            src={avatar.image || '/default-avatar.png'}
                            alt={avatar.title}
                            className="w-5 h-5 rounded-full"
                          />
                        ) : (
                          <User className="w-5 h-5 text-gray-400 rounded-full" />
                        )}
                        <div>
                          <p className="text-xs font-medium">{avatar.title}</p>
                          {avatar.full_name && <p className="text-xs text-gray-500">{avatar.full_name}</p>}
                        </div>
                      </div>
                    )}
                    {res.is_admin && !avatar && (
                      <div className="mt-2 flex items-center justify-end space-x-2">
                        <User className="w-5 h-5 text-gray-400 rounded-full" />
                        <p className="text-xs font-medium">Support</p>
                      </div>
                    )}
                    {!res.is_admin && (
                      <div className="mt-2 flex items-center justify-end space-x-2">
                        <Users className="w-5 h-5 text-green-500 rounded-full" />
                        <p className="text-xs font-medium">Customer</p>
                      </div>
                    )}
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
            <div className="border-t border-gray-200 p-4 bg-gray-50 w-full">
              <Listbox value={selectedAvatar} onChange={setSelectedAvatar}>
                <div className="relative mb-2">
                  <Listbox.Button className="w-full flex items-center justify-between px-3 py-2 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300">
                    <div className="flex items-center space-x-2">
                      {selectedAvatar?.image ? (
                        <img
                          src={selectedAvatar.image}
                          alt={selectedAvatar.title}
                          className="w-5 h-5 rounded-full"
                        />
                      ) : (
                        <User className="w-5 h-5 text-gray-400 rounded-full" />
                      )}
                      <span>
                        {selectedAvatar?.title} {selectedAvatar?.full_name && `(${selectedAvatar.full_name})`}
                      </span>
                    </div>
                    <ChevronDown className="w-4 h-4" />
                  </Listbox.Button>
                  <Transition
                    as={Listbox.Options}
                    className="absolute w-full mt-1 bg-white border border-gray-200 rounded shadow-lg text-sm z-10"
                    enter="transition duration-100 ease-out"
                    enterFrom="transform scale-95 opacity-0"
                    enterTo="transform scale-100 opacity-100"
                    leave="transition duration-75 ease-in"
                    leaveFrom="transform scale-100 opacity-100"
                    leaveTo="transform scale-95 opacity-0"
                  >
                    {avatars.map((avatar) => (
                      <Listbox.Option
                        key={avatar.id}
                        value={avatar}
                        className={({ active }) =>
                          `px-4 py-2 cursor-pointer flex items-center space-x-2 ${active ? 'bg-blue-100 text-blue-900' : 'text-gray-900'}`
                        }
                      >
                        {({ active }) => (
                          <>
                            {avatar.image ? (
                              <img
                                src={avatar.image}
                                alt={avatar.title}
                                className="w-5 h-5 rounded-full"
                              />
                            ) : (
                              <User className="w-5 h-5 text-gray-400 rounded-full" />
                            )}
                            <div>
                              <p className="text-sm font-medium">{avatar.title}</p>
                              {avatar.full_name && <p className="text-xs text-gray-500">{avatar.full_name}</p>}
                            </div>
                          </>
                        )}
                      </Listbox.Option>
                    ))}
                  </Transition>
                </div>
              </Listbox>
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
  placeholder="Type your response..."
  className="w-full border border-gray-200 bg-white rounded-lg p-2 text-sm mb-2"
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
                            `px-4 py-2 cursor-pointer ${active ? 'bg-blue-100 text-blue-900' : 'text-gray-900'}`
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