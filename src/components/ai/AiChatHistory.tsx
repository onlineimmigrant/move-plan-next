'use client';
import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  MagnifyingGlassIcon,
  TrashIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  PencilIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/react/24/outline';
import { Disclosure, Transition } from '@headlessui/react';
import { format } from 'date-fns';
import Tooltip from '@/components/Tooltip';
import HelpModal from './HelpModal';

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
}

interface AiChatHistoryProps {
  userId: string | null;
  onError: (error: string) => void;
}

export default function AiChatHistory({ userId, onError }: AiChatHistoryProps) {
  const [chatHistories, setChatHistories] = useState<ChatHistory[]>([]);
  const [filteredHistories, setFilteredHistories] = useState<ChatHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalHistories, setTotalHistories] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFixed, setIsFixed] = useState(false);
  const [searchHeight, setSearchHeight] = useState(0);
  const [selectedHistoryIndex, setSelectedHistoryIndex] = useState<number | null>(null);
  const [editingHistory, setEditingHistory] = useState<ChatHistory | null>(null);
  const [editForm, setEditForm] = useState({ name: '' });
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const historiesPerPage = 3;
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!userId) {
        setLoading(false);
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
        setTotalHistories(count || 0);

        const { data: histories, error: historiesError } = await supabase
          .from('ai_chat_histories')
          .select('id, user_id, name, messages, created_at, updated_at')
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

        setChatHistories(validHistories);
        setHasMore(page * historiesPerPage < (count || 0));
      } catch (error: any) {
        onError(error.message || 'Failed to load chat histories.');
        console.error('Fetch error:', error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userId]);

  useEffect(() => {
    let result = chatHistories;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((history) => {
        const historyName = history.name ?? '';
        return historyName.toLowerCase().includes(query);
      });
    }
    setFilteredHistories(result);
    setPage(1);
    setHasMore(result.length > historiesPerPage);
    if (selectedHistoryIndex !== null && (selectedHistoryIndex >= result.length || result.length === 0)) {
      setSelectedHistoryIndex(null);
    }
  }, [searchQuery, chatHistories]);

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
      setTotalHistories((prev) => prev - 1);
      setSelectedHistoryIndex(null);
    } catch (error: any) {
      onError(error.message || 'Failed to delete chat history.');
      console.error('Delete error:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateChatHistory = async (historyId: number, updatedData: { name: string }) => {
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
            ? { ...h, name: updatedData.name.trim() }
            : h
        )
      );
      setEditingHistory(null);
      setEditForm({ name: '' });
    } catch (error: any) {
      onError(error.message || 'Failed to update chat history.');
      console.error('Update error:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (history: ChatHistory) => {
    setEditingHistory(history);
    setEditForm({ name: history.name || '' });
  };

  const closeEditModal = () => {
    setEditingHistory(null);
    setEditForm({ name: '' });
  };

  const handleEditSubmit = () => {
    if (editingHistory) {
      updateChatHistory(editingHistory.id, editForm);
    }
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      setPage((prev) => prev + 1);
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
    <div className="relative">
      <Disclosure defaultOpen>
        {({ open }) => (
          <div>
            <div className="flex justify-between items-center">
              <Disclosure.Button className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 border border-gray-200 text-sm font-medium text-gray-800 hover:bg-gray-200 transition-colors shadow-sm mb-2 cursor-pointer">
                <span>Chat Histories</span>
                <span className="ml-2 text-sky-500 font-bold">{open ? '−' : '+'}</span>
              </Disclosure.Button>
              <Tooltip content="Chat History Help Guide">
                <button
                  onClick={() => setIsHelpModalOpen(true)}
                  className="mb-4 cursor-pointer text-gray-400 p-2 rounded-full hover:bg-sky-600 transition-colors"
                >
                  <QuestionMarkCircleIcon className="h-5 w-5" />
                </button>
              </Tooltip>
              <HelpModal isOpen={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} />
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
                <div
                  ref={searchRef}
                  className="relative w-full md:w-80 px-4 md:px-0 transition-all duration-200 mb-4"
                >
                  <span className="absolute inset-y-0 left-2 md:left-0 flex items-center pl-6 md:pl-3">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  </span>
                  <input
                    type="text"
                    placeholder="Search chat histories..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 text-base font-light border bg-white border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
                {isFixed && <div style={{ height: searchHeight ? `${searchHeight}px` : '60px' }} className="md:hidden" />}
                {loading ? (
                  <div className="text-gray-700">Loading...</div>
                ) : filteredHistories.length === 0 ? (
                  <div className="text-gray-700">
                    {searchQuery ? `No chat histories found matching "${searchQuery}"` : 'No chat histories available'}
                  </div>
                ) : (
                  <div>
                    <ul className="bg-white rounded-md ring-2 ring-gray-200 p-2 grid grid-cols-1 gap-y-2">
                      {filteredHistories.slice(0, page * historiesPerPage).map((history, index) => (
                        <li
                          key={history.id}
                          className="my-1 rounded group cursor-pointer border-2 border-gray-200"
                          onClick={() => openHistory(index)}
                        >
                          <div className="flex flex-col py-2 px-4 hover:bg-sky-50 hover:text-sky-900 min-h-[80px]">
                            <div className="flex justify-between items-center gap-2">
                              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-gray-50 text-gray-900">
                                Updated
                              </span>
                              <span className="text-xs font-thin text-gray-600">
                                {history.updated_at
                                  ? format(new Date(history.updated_at), 'HH:mm:ss, dd MMMM yyyy')
                                  : 'N/A'}
                              </span>
                            </div>
                            <span className="text-sm font-semibold text-gray-900 truncate mt-1">{history.name || 'Untitled'}</span>
                            <div className="flex justify-end items-center gap-2 mt-2">
                              <Tooltip content="Edit Chat History">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openEditModal(history);
                                  }}
                                  className="cursor-pointer bg-gray-100 text-gray-600 p-2 rounded-full disabled:bg-gray-200 hover:bg-gray-200 transition-colors"
                                >
                                  <PencilIcon className="h-5 w-5" />
                                </button>
                              </Tooltip>
                              <Tooltip content="Delete Chat History">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteChatHistory(history.id);
                                  }}
                                  className="cursor-pointer bg-gray-100 text-gray-600 p-2 rounded-full disabled:bg-gray-200 hover:bg-red-200 transition-colors"
                                >
                                  <TrashIcon className="h-5 w-5" />
                                </button>
                              </Tooltip>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-4 flex justify-center gap-4">
                      <button
                        onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                        disabled={page === 1}
                        className="px-4 py-2 rounded-full bg-sky-500 text-white text-sm font-medium hover:bg-sky-600 transition-colors disabled:bg-gray-300 shadow-md cursor-pointer"
                      >
                        Previous
                      </button>
                      <button
                        onClick={loadMore}
                        disabled={!hasMore || loading}
                        className="px-4 py-2 rounded-full bg-sky-500 text-white text-sm font-medium hover:bg-sky-600 transition-colors disabled:bg-gray-300 shadow-md cursor-pointer"
                      >
                        {loading ? 'Loading...' : 'Load More'}
                      </button>
                    </div>
                  </div>
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
              className="absolute top-4 right-2 p-2 rounded-full bg-transparent text-gray-800 hover:bg-gray-100 cursor-pointer"
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
              className="absolute top-4 right-4 p-2 rounded-full bg-transparent text-gray-800 hover:bg-gray-100 cursor-pointer"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}