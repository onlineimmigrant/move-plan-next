'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { ChevronLeftIcon, ChevronRightIcon, XMarkIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import { Disclosure, Transition } from '@headlessui/react';
import { format, subDays, isAfter, startOfWeek, endOfWeek, startOfDay } from 'date-fns';
import Tooltip from '@/components/Tooltip';
import HelpModal from './HelpModal';
import ChatHistoryList from './AiChatHistoryComponents/ChatHistoryList';
import ChatHistorySearch from './AiChatHistoryComponents/ChatHistorySearch';
import Button from '@/ui/Button';
import DisclosureButton from '@/ui/DisclosureButton';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface ChatHistory {
  id: number;
  user_id: string;
  name: string;
  messages: { role: string; content: string }[];
  created_at: string;
  updated_at: string;
  is_default_flashcard: boolean;
}

interface NewMessages {
  historyId: number;
  messages: { role: string; content: string }[];
}

interface AiChatHistoryProps {
  userId: string | null;
  onError: (error: string) => void;
  onFlashcardCreated?: () => void;
  onNewMessages?: (data: NewMessages) => void;
}

export default function AiChatHistory({ userId, onError, onFlashcardCreated, onNewMessages }: AiChatHistoryProps) {
  const [chatHistories, setChatHistories] = useState<ChatHistory[]>([]);
  const [filteredHistories, setFilteredHistories] = useState<ChatHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingFlashcard, setCreatingFlashcard] = useState(false);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalHistories, setTotalHistories] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDateRange, setSelectedDateRange] = useState<string>('all');
  const [isFixed, setIsFixed] = useState(false);
  const [searchHeight, setSearchHeight] = useState(0);
  const [selectedHistoryIndex, setSelectedHistoryIndex] = useState<number | null>(null);
  const [editingHistory, setEditingHistory] = useState<ChatHistory | null>(null);
  const [editForm, setEditForm] = useState({ name: '', is_default_flashcard: false });
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Memoize onNewMessages to prevent recreation
  const memoizedOnNewMessages = useCallback(
    (data: NewMessages) => {
      if (onNewMessages) {
        onNewMessages(data);
      }
    },
    [onNewMessages]
  );

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('chat-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'ai_chat_histories',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setChatHistories((prev) => {
            const updatedHistories = prev.map((h) =>
              h.id === payload.new.id
                ? { ...h, messages: payload.new.messages, updated_at: payload.new.updated_at }
                : h
            );
            return updatedHistories.sort(
              (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
            );
          });
          memoizedOnNewMessages({
            historyId: payload.new.id,
            messages: payload.new.messages.slice(-1),
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, memoizedOnNewMessages]);

  useEffect(() => {
    let isMounted = true;

    const fetchRole = async () => {
      if (!userId || !isMounted) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', userId)
          .single();
        if (error) {
          throw new Error('Failed to fetch user role: ' + error.message);
        }
        if (isMounted) {
          setRole(data?.role || null);
        }
      } catch (error: any) {
        if (isMounted) {
          onError(error.message || 'Failed to fetch user role.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    fetchRole();

    return () => {
      isMounted = false;
    };
  }, [userId, onError]);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      if (!userId || !isMounted) {
        if (isMounted) setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const { count, error: countError } = await supabase
          .from('ai_chat_histories')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId);

        if (countError) {
          throw new Error('Failed to count chat histories: ' + countError.message);
        }
        if (isMounted) {
          setTotalHistories(count || 0);
        }

        const { data: histories, error: historiesError } = await supabase
          .from('ai_chat_histories')
          .select('id, user_id, name, messages, created_at, updated_at, is_default_flashcard')
          .eq('user_id', userId)
          .order('updated_at', { ascending: false });

        if (historiesError) {
          throw new Error('Failed to load chat histories: ' + historiesError.message);
        }

        const validHistories = (histories || []).filter((history) => {
          const isValid =
            history &&
            typeof history.id === 'number' &&
            typeof history.user_id === 'string' &&
            typeof history.name === 'string' &&
            Array.isArray(history.messages) &&
            history.messages.every(
              (msg) => typeof msg.role === 'string' && typeof msg.content === 'string'
            ) &&
            typeof history.created_at === 'string' &&
            typeof history.updated_at === 'string';
          if (!isValid) {
            console.warn('Invalid history data:', history);
          }
          return isValid;
        });

        if (isMounted) {
          setChatHistories(validHistories);
          setHasMore(page * 3 < (count || 0));
        }
      } catch (error: any) {
        if (isMounted) {
          onError(error.message || 'Failed to load chat histories.');
          console.error('Fetch error:', error.message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    fetchData();

    return () => {
      isMounted = false;
    };
  }, [userId, onError]);

  useEffect(() => {
    let result = chatHistories;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((history) => {
        const historyName = history.name ?? '';
        return historyName.toLowerCase().includes(query);
      });
    }
    if (selectedDateRange !== 'all') {
      const now = new Date();
      let startDate: Date;
      let endDate: Date | undefined;
      switch (selectedDateRange) {
        case 'today':
          startDate = startOfDay(now);
          break;
        case 'yesterday':
          startDate = startOfDay(subDays(now, 1));
          endDate = startOfDay(now);
          break;
        case 'thisweek':
          startDate = startOfWeek(now, { weekStartsOn: 1 });
          break;
        case 'lastweek':
          startDate = startOfWeek(subDays(now, 7), { weekStartsOn: 1 });
          endDate = endOfWeek(subDays(now, 7), { weekStartsOn: 1 });
          break;
        case '7days':
          startDate = subDays(now, 7);
          break;
        case '30days':
          startDate = subDays(now, 30);
          break;
        default:
          startDate = new Date(0);
      }
      result = result.filter((history) => {
        const updatedAt = new Date(history.updated_at);
        return isAfter(updatedAt, startDate) && (!endDate || updatedAt <= endDate);
      });
    }
    setFilteredHistories(result);
    setPage(1);
    setHasMore(result.length > 3);
    if (selectedHistoryIndex !== null && (selectedHistoryIndex >= result.length || result.length === 0)) {
      setSelectedHistoryIndex(null);
    }
  }, [searchQuery, selectedDateRange, chatHistories]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const threshold = 30;
      setIsFixed(scrollY > threshold);
    };

    const measureSearchHeight = () => {
      if (searchRef.current) {
        setSearchHeight(searchRef.current.offsetHeight);
      } else {
        setSearchHeight(60);
      }
    };

    measureSearchHeight();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', measureSearchHeight);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', measureSearchHeight);
    };
  }, []);

  const deleteChatHistory = async (historyId: number) => {
    if (!confirm('Are you sure you want to delete this chat history?')) return;

    setLoading(true);
    try {
      const { error: deleteError } = await supabase
        .from('ai_chat_histories')
        .delete()
        .eq('id', historyId)
        .eq('user_id', userId);

      if (deleteError) {
        throw new Error('Failed to delete chat history: ' + deleteError.message);
      }

      setChatHistories(chatHistories.filter((history) => history.id !== historyId));
      setHasMore(page * 3 < totalHistories - 1);
    } catch (error: any) {
      onError(error.message || 'Failed to delete chat history.');
      console.error('Delete error:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateChatHistory = async (historyId: number, updatedData: { name: string; is_default_flashcard: boolean }) => {
    if (!updatedData.name.trim()) {
      onError('Chat history name cannot be empty.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('ai_chat_histories')
        .update({
          name: updatedData.name.trim(),
          is_default_flashcard: role === 'admin' ? updatedData.is_default_flashcard : false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', historyId)
        .eq('user_id', userId);

      if (error) {
        throw new Error('Failed to update chat history: ' + error.message);
      }

      setChatHistories(
        chatHistories.map((h) =>
          h.id === historyId && h.user_id === userId
            ? { ...h, name: updatedData.name.trim(), is_default_flashcard: role === 'admin' ? updatedData.is_default_flashcard : false }
            : h
        )
      );
      setEditingHistory(null);
      setEditForm({ name: '', is_default_flashcard: false });
      onError(`Chat history "${updatedData.name.trim()}" updated successfully.`);
    } catch (error: any) {
      onError(error.message || 'Failed to update chat history.');
      console.error('Update error:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const createFlashcard = async (historyId: number) => {
    setCreatingFlashcard(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        onError('User not authenticated.');
        return;
      }

      const history = chatHistories.find((h) => h.id === historyId);
      if (!history) {
        onError('Chat history not found.');
        return;
      }

      const response = await fetch('/api/flashcards/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          chat_history_id: historyId,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        console.error('Flashcard creation failed:', result.error, { chat_history_id: historyId });
        throw new Error(result.error || 'Failed to create flashcard');
      }

      onError(`Flashcard successfully created from the chat: "${history.name}"`);
      if (onFlashcardCreated) {
        onFlashcardCreated();
      }
    } catch (error: any) {
      onError(error.message || 'Failed to create flashcard.');
      console.error('Flashcard creation error:', error.message);
    } finally {
      setCreatingFlashcard(false);
    }
  };

  const openEditModal = (history: ChatHistory) => {
    setEditingHistory(history);
    setEditForm({ name: history.name || '', is_default_flashcard: history.is_default_flashcard || false });
  };

  const closeEditModal = () => {
    setEditingHistory(null);
    setEditForm({ name: '', is_default_flashcard: false });
  };

  const handleEditSubmit = () => {
    if (editingHistory) {
      updateChatHistory(editingHistory.id, editForm);
    }
  };

  const openHistory = (index: number) => {
    if (editingHistory) return;
    setSelectedHistoryIndex(index);
  };

  const closeHistory = () => {
    setSelectedHistoryIndex(null);
  };

  const prevHistory = () => {
    if (filteredHistories.length === 0) return;
    setSelectedHistoryIndex((prev) => {
      if (prev === null || prev === 0) return filteredHistories.length - 1;
      return prev - 1;
    });
  };

  const nextHistory = () => {
    if (filteredHistories.length === 0) return;
    setSelectedHistoryIndex((prev) => {
      if (prev === null || prev === filteredHistories.length - 1) return 0;
      return prev + 1;
    });
  };

  return (
    <div className="relative pb-24 ">
      <Disclosure defaultOpen>
        {({ open }) => (
          <div>
            <div className="mt-1 flex justify-between items-center mb-4 ">
              <DisclosureButton >
                        
                <span>Chats</span>
                <span className="ml-2 text-sky-500 font-bold">{open ? '−' : '+'}</span>
               
              </DisclosureButton>

            </div>
            <Transition
              enter="transition ease-out duration-100"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Disclosure.Panel className="border-2 border-gray-200 rounded-xl py-4 px-4 bg-gray-50">
                <ChatHistorySearch
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  selectedDateRange={selectedDateRange}
                  setSelectedDateRange={setSelectedDateRange}
                  searchRef={searchRef}
                />
                {isFixed && <div style={{ height: searchHeight ? `${searchHeight}px` : '60px' }} className="md:hidden" />}
                {filteredHistories.length === 0 ? (
                  <div className="text-gray-700">
                    {searchQuery || selectedDateRange !== 'all'
                      ? `No chat histories found matching the current filters`
                      : 'No chat histories available'}
                  </div>
                ) : (
                  <ChatHistoryList
                    histories={filteredHistories}
                    openHistory={openHistory}
                    openEditModal={openEditModal}
                    deleteChatHistory={deleteChatHistory}
                    createFlashcard={createFlashcard}
                    page={page}
                    setPage={setPage}
                    hasMore={hasMore}
                    totalHistories={totalHistories}
                    loading={loading}
                    creatingFlashcard={creatingFlashcard}
                  />
                )}
              </Disclosure.Panel>
            </Transition>
          </div>
        )}
      </Disclosure>

      {selectedHistoryIndex !== null && filteredHistories[selectedHistoryIndex] && (
        <div
          className="fixed inset-0 z-70 flex items-center justify-center bg-gray-200 bg-opacity-50"
          onClick={closeHistory}
        >
          <div
            className="relative w-full md:w-[48rem] h-full md:h-[48rem] md:bg-white rounded-lg shadow-lg border-2 border-gray-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute inset-0 flex flex-col p-6 py-16 overflow-y-auto bg-gray-50">
              <div className="flex flex-col items-center justify-center flex-grow text-center">
                <p className="px-3 py-1 rounded-full text-sm font-medium bg-teal-100 text-teal-600 my-2 mb-16">
                  Chat History
                </p>
                <p className="text-sm text-gray-600">
                  {filteredHistories[selectedHistoryIndex].updated_at
                    ? format(new Date(filteredHistories[selectedHistoryIndex].updated_at), 'HH:mm:ss, dd MMMM yyyy')
                    : 'N/A'}
                </p>
                <h2 className="text-2xl font-semibold text-gray-800 whitespace-normal">
                  {filteredHistories[selectedHistoryIndex].name || 'Untitled'}
                </h2>
                <div className="mt-4 space-y-2 w-full">
                  {(filteredHistories[selectedHistoryIndex].messages || []).map((msg, index) => (
                    <div
                      key={index}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <span
                        className={`inline-block p-4 rounded max-w-[80%] ${
                          msg.role === 'user' ? 'bg-sky-100 text-gray-800' : 'bg-gray-100 text-gray-800'
                        }`}
                        dangerouslySetInnerHTML={{
                          __html: msg.content.replace(/\n/g, '<br>'),
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <button
              onClick={closeHistory}
              className="absolute top-4 right-2 p-2 rounded-full bg-transparent text-gray-800 hover:bg-gray-200 cursor-pointer"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
              <button
                onClick={prevHistory}
                className="p-2 rounded-full text-sky-500 text-sm font-medium hover:shadow-sm disabled:bg-gray-300 transition-colors cursor-pointer"
                disabled={filteredHistories.length <= 1}
              >
                <ChevronLeftIcon className="h-6 w-6" />
              </button>
              <button
                onClick={nextHistory}
                className="p-2 rounded-full text-sky-500 text-sm font-medium hover:shadow-sm disabled:bg-gray-300 transition-colors cursor-pointer"
                disabled={filteredHistories.length <= 1}
              >
                <ChevronRightIcon className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      )}

      {editingHistory && (
        <div
          className="fixed inset-0 z-80 flex items-center justify-center bg-gray-200 bg-opacity-50"
          onClick={closeEditModal}
        >
          <div
            className="relative w-full max-w-md bg-white rounded-lg shadow-lg p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Edit Chat History</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="Enter chat history name"
                />
              </div>
              {role === 'admin' && (
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editForm.is_default_flashcard}
                      onChange={(e) => setEditForm({ ...editForm, is_default_flashcard: e.target.checked })}
                      className="mr-2"
                    />
                    Save as Default Flashcard (Organization-wide)
                  </label>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700">Content</label>
                <div
                  className="w-full h-32 md:max-w-[48rem] md:max-h-[48rem] px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 text-gray-600 overflow-y-auto space-y-2 resize"
                >
                  {(editingHistory.messages || []).map((msg, index) => (
                    <div
                      key={index}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <span
                        className={`inline-block p-4 rounded max-w-[80%] ${
                          msg.role === 'user' ? 'bg-sky-100 text-gray-800' : 'bg-gray-100 text-gray-800'
                        }`}
                        dangerouslySetInnerHTML={{
                          __html: msg.content.replace(/\n/g, '<br>'),
                        }}
                      />
                    </div>
                  ))}
                  {(!editingHistory.messages || editingHistory.messages.length === 0) && (
                    <p className="text-gray-500">No content available</p>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={closeEditModal}
                className="px-4 py-2 rounded-full bg-gray-200 text-gray-800 text-sm font-medium hover:bg-gray-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSubmit}
                className="px-4 py-2 rounded-full bg-sky-500 text-white text-sm font-medium hover:bg-sky-600 cursor-pointer"
              >
                Save
              </button>
            </div>
            <button
              onClick={closeEditModal}
              className="absolute top-4 right-4 p-2 rounded-full bg-transparent text-gray-800 hover:bg-gray-200 cursor-pointer"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}