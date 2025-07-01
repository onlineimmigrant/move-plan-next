'use client';
import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  MagnifyingGlassIcon,
  TrashIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  ArrowPathIcon,
  PencilIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/react/24/outline';
import { Disclosure, Transition } from '@headlessui/react';
import Tooltip from '@/components/Tooltip';
import HelpModal from './HelpModal';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Flashcard {
  id: number;
  name: string;
  messages: { role: string; content: string }[];
  created_at: string;
  updated_at: string;
  topic: string;
  section: string;
  user_id?: string;
  organization_id?: string;
  status?: string;
}

interface AiFlashcardsProps {
  userId: string | null;
  onError: (error: string) => void;
}

export default function AiFlashcards({ userId, onError }: AiFlashcardsProps) {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [filteredFlashcards, setFilteredFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalFlashcards, setTotalFlashcards] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStatus, setActiveStatus] = useState<string>('all');
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const [topics, setTopics] = useState<string[]>([]);
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);
  const [editForm, setEditForm] = useState({ name: '', topic: '', section: '' });
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);
  const [isTopicMenuOpen, setIsTopicMenuOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const flashcardsPerPage = 5;
  const searchRef = useRef<HTMLDivElement>(null);
  const [isFixed, setIsFixed] = useState(false);
  const [searchHeight, setSearchHeight] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const { data: userFlashcards, error: userError } = await supabase
          .from('ai_user_flashcards')
          .select('id, name, messages, created_at, updated_at, topic, section, user_id')
          .eq('user_id', userId);

        if (userError) throw new Error('Failed to load user flashcards: ' + userError.message);

        const { data: defaultFlashcards, error: defaultError } = await supabase
          .from('ai_default_flashcards')
          .select('id, name, messages, created_at, updated_at, topic, section, organization_id');

        if (defaultError) throw new Error('Failed to load default flashcards: ' + defaultError.message);

        const { data: statuses, error: statusError } = await supabase
          .from('ai_flashcard_status')
          .select('ai_user_flashcards_id, ai_default_flashcards_id, status')
          .eq('user_id', userId);

        if (statusError) throw new Error('Failed to load flashcard statuses: ' + statusError.message);

        const userFlashcardsWithStatus = (userFlashcards || []).map((fc) => ({
          ...fc,
          status: statuses?.find((s) => s.ai_user_flashcards_id === fc.id)?.status || 'learning',
          messages: fc.messages || [],
        }));

        const defaultFlashcardsWithStatus = (defaultFlashcards || []).map((fc) => ({
          ...fc,
          status: statuses?.find((s) => s.ai_default_flashcards_id === fc.id)?.status || 'learning',
          messages: fc.messages || [],
        }));

        const allFlashcards = [...userFlashcardsWithStatus, ...defaultFlashcardsWithStatus];
        setFlashcards(allFlashcards);
        setTotalFlashcards(allFlashcards.length);

        const uniqueTopics = Array.from(
          new Set([...(userFlashcards || []), ...(defaultFlashcards || [])].map((fc) => fc.topic).filter(Boolean))
        );
        setTopics(uniqueTopics);
      } catch (error: any) {
        onError(error.message || 'Failed to load flashcards.');
        console.error('Fetch error:', error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userId]);

  useEffect(() => {
    let result = flashcards;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((flashcard) => {
        const flashcardName = flashcard.name ?? '';
        return flashcardName.toLowerCase().includes(query);
      });
    }

    if (activeStatus !== 'all') {
      result = result.filter((flashcard) => flashcard.status === activeStatus);
    }

    if (activeTopic) {
      result = result.filter((flashcard) => flashcard.topic === activeTopic);
    }

    setFilteredFlashcards(result);
    setPage(1);
    setHasMore(result.length > flashcardsPerPage);
    if (selectedCardIndex !== null && (selectedCardIndex >= result.length || result.length === 0)) {
      setSelectedCardIndex(null);
      setIsFlipped(false);
    }
  }, [searchQuery, activeStatus, activeTopic, flashcards]);

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

  const deleteFlashcard = async (flashcardId: number) => {
    if (!confirm('Are you sure you want to delete this flashcard?')) return;

    setLoading(true);
    try {
      const { error: deleteError } = await supabase
        .from('ai_user_flashcards')
        .delete()
        .eq('id', flashcardId)
        .eq('user_id', userId);

      if (deleteError) {
        throw new Error('Failed to delete flashcard: ' + deleteError.message);
      }

      setFlashcards(flashcards.filter((fc) => fc.id !== flashcardId || fc.user_id !== userId));
      setTotalFlashcards((prev) => prev - 1);
      setSelectedCardIndex(null);
    } catch (error: any) {
      onError(error.message || 'Failed to delete flashcard.');
      console.error('Delete error:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateFlashcardStatus = async (flashcardId: number, isUserFlashcard: boolean, newStatus: string) => {
    try {
      console.log(`Updating status for flashcard ID: ${flashcardId}, isUserFlashcard: ${isUserFlashcard}, newStatus: ${newStatus}`);
      const table = isUserFlashcard ? 'ai_user_flashcards_id' : 'ai_default_flashcards_id';
      const { data: existingStatus, error: selectError } = await supabase
        .from('ai_flashcard_status')
        .select('id, status')
        .eq(table, flashcardId)
        .eq('user_id', userId)
        .single();

      if (selectError && selectError.code !== 'PGRST116') {
        console.error('Select error:', selectError);
        throw new Error('Failed to check existing status: ' + selectError.message);
      }

      if (existingStatus) {
        console.log(`Existing status found: ${existingStatus.status}, updating to ${newStatus}`);
        const { error: updateError } = await supabase
          .from('ai_flashcard_status')
          .update({
            status: newStatus,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingStatus.id);

        if (updateError) {
          console.error('Update error:', updateError);
          throw new Error('Failed to update flashcard status: ' + updateError.message);
        }
      } else {
        console.log('No existing status, inserting new status');
        const { error: insertError } = await supabase
          .from('ai_flashcard_status')
          .insert({
            [table]: flashcardId,
            user_id: userId,
            status: newStatus,
            updated_at: new Date().toISOString(),
          });

        if (insertError) {
          console.error('Insert error:', insertError);
          throw new Error('Failed to insert flashcard status: ' + insertError.message);
        }
      }

      console.log(`Updating flashcard state with new status: ${newStatus}`);
      setFlashcards((prevFlashcards) =>
        prevFlashcards.map((fc) =>
          fc.id === flashcardId && (isUserFlashcard ? fc.user_id === userId : fc.organization_id)
            ? { ...fc, status: newStatus }
            : fc
        )
      );
    } catch (error: any) {
      console.error('Status update error:', error);
      onError(error.message || 'Failed to update flashcard status.');
    }
  };

  const getNextStatus = (currentStatus: string | undefined): string => {
    switch (currentStatus) {
      case 'learning':
        return 'review';
      case 'review':
        return 'mastered';
      case 'mastered':
      case 'suspended':
      case 'lapsed':
        return 'learning';
      default:
        return 'learning';
    }
  };

  const handleStatusTransition = (flashcard: Flashcard) => {
    const nextStatus = getNextStatus(flashcard.status);
    updateFlashcardStatus(flashcard.id, !!flashcard.user_id, nextStatus);
  };

  const updateFlashcard = async (flashcardId: number, updatedData: { name: string; topic: string; section: string }) => {
    if (!updatedData.name.trim()) {
      onError('Flashcard name cannot be empty.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('ai_user_flashcards')
        .update({
          name: updatedData.name.trim(),
          topic: updatedData.topic.trim() || null,
          section: updatedData.section.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', flashcardId)
        .eq('user_id', userId);

      if (error) {
        throw new Error('Failed to update flashcard: ' + error.message);
      }

      setFlashcards(
        flashcards.map((fc) =>
          fc.id === flashcardId && fc.user_id === userId
            ? { ...fc, name: updatedData.name.trim(), topic: updatedData.topic.trim() || '', section: updatedData.section.trim() || '' }
            : fc
        )
      );
      setEditingCard(null);
      setEditForm({ name: '', topic: '', section: '' });
    } catch (error: any) {
      onError(error.message || 'Failed to update flashcard.');
      console.error('Update error:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (flashcard: Flashcard) => {
    if (!flashcard.user_id) return; // Only allow editing for user cards
    setEditingCard(flashcard);
    setEditForm({
      name: flashcard.name || '',
      topic: flashcard.topic || '',
      section: flashcard.section || '',
    });
  };

  const closeEditModal = () => {
    setEditingCard(null);
    setEditForm({ name: '', topic: '', section: '' });
  };

  const handleEditSubmit = () => {
    if (editingCard) {
      updateFlashcard(editingCard.id, editForm);
    }
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      setPage((prev) => prev + 1);
    }
  };

  const openCard = (index: number) => {
    if (editingCard) return; // Prevent opening card while editing
    setSelectedCardIndex(index);
    setIsFlipped(false);
  };

  const closeCard = () => {
    setSelectedCardIndex(null);
    setIsFlipped(false);
  };

  const flipCard = () => {
    setIsFlipped(!isFlipped);
  };

  const prevCard = () => {
    if (filteredFlashcards.length === 0) return;
    setSelectedCardIndex((prev) => {
      if (prev === null || prev === 0) return filteredFlashcards.length - 1;
      return prev - 1;
    });
    setIsFlipped(false);
  };

  const nextCard = () => {
    if (filteredFlashcards.length === 0) return;
    setSelectedCardIndex((prev) => {
      if (prev === null || prev === filteredFlashcards.length - 1) return 0;
      return prev + 1;
    });
    setIsFlipped(false);
  };

  const getStatusBgClass = (status?: string) => {
    switch (status) {
      case 'learning': return 'bg-gray-100';
      case 'review': return 'bg-gray-100';
      case 'mastered': return 'bg-gray-100';
      case 'suspended': return 'bg-gray-100';
      case 'lapsed': return 'bg-gray-100';
      default: return 'bg-gray-100';
    }
  };

  const getStatusBorderClass = (status?: string) => {
    switch (status) {
      case 'learning': return 'border-2 border-sky-100';
      case 'review': return 'border-2 border-yellow-100';
      case 'mastered': return 'border-2 border-teal-100';
      case 'suspended': return 'border-2 border-gray-100';
      case 'lapsed': return 'border-2 border-red-100';
      default: return 'border-2 border-gray-200';
    }
  };

  const getStatusTextClass = (status?: string) => {
    switch (status) {
      case 'learning': return 'text-sky-100';
      case 'review': return 'text-yellow-100';
      case 'mastered': return 'text-teal-100';
      case 'suspended': return 'text-gray-100';
      case 'lapsed': return 'text-red-100';
      default: return 'text-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'learning': return 'Learning';
      case 'review': return 'Review';
      case 'mastered': return 'Mastered';
      case 'suspended': return 'Suspended';
      case 'lapsed': return 'Lapsed';
      case 'all': return 'All';
      default: return status;
    }
  };

  const toggleStatusMenu = () => {
    setIsStatusMenuOpen(!isStatusMenuOpen);
    setIsTopicMenuOpen(false); // Close topic menu if open
  };

  const toggleTopicMenu = () => {
    setIsTopicMenuOpen(!isTopicMenuOpen);
    setIsStatusMenuOpen(false); // Close status menu if open
  };

  const handleStatusSelect = (status: string) => {
    setActiveStatus(status);
    setIsStatusMenuOpen(false);
  };

  const handleTopicSelect = (topic: string | null) => {
    setActiveTopic(topic);
    setIsTopicMenuOpen(false);
  };

  return (
    <div className="relative">
      <Disclosure defaultOpen>
        {({ open }) => (
          <div>
            <div className="flex justify-between items-center">
              <Disclosure.Button className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 border border-gray-200 text-sm font-medium text-gray-800 hover:bg-gray-200 transition-colors shadow-sm mb-2 cursor-pointer">
                <span>Flashcards</span>
                <span className="ml-2 text-sky-500 font-bold">{open ? '−' : '+'}</span>
              </Disclosure.Button>
              <Tooltip content="Flashcard Help Guide">
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
                <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                  <div
                    ref={searchRef}
                    className="relative w-full md:w-80 px-4 md:px-0 transition-all duration-200"
                  >
                    <span className="absolute inset-y-0 left-2 md:left-0 flex items-center pl-6 md:pl-3">
                      <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                    </span>
                    <input
                      type="text"
                      placeholder="Search flashcards..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 text-base font-light border bg-white border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                  <div className="flex items-center gap-2 px-4 md:px-0">
                    <div className="relative">
                      <Tooltip content="Edit Status">
                        <button
                          onClick={toggleStatusMenu}
                          className={`flex items-center px-3 py-1 rounded-full text-sm font-medium cursor-pointer ${
                            activeStatus === 'all' ? 'bg-gray-100 text-gray-800' : 'bg-gray-500 text-gray-100'
                          } hover:bg-gray-200 transition-colors`}
                        >
                          <span className="mr-2 cursor-pointer bg-gray-50 text-gray-600 p-2 rounded-full disabled:bg-gray-200 hover:bg-gray-200 transition-colors">
                            <PencilIcon className="h-4 w-4" />
                          </span>
                          <span>{getStatusLabel(activeStatus)}</span>
                        </button>
                      </Tooltip>
                      {isStatusMenuOpen && (
                        <div className="absolute z-10 mt-2 w-36 bg-white border border-gray-200 rounded-lg shadow-lg">
                          {['all', 'learning', 'review', 'mastered', 'suspended', 'lapsed'].map((status) => (
                            <button
                              key={status}
                              onClick={() => handleStatusSelect(status)}
                              className={`w-full px-3 py-1 text-sm text-left hover:bg-gray-100 ${
                                activeStatus === status ? 'bg-gray-500 text-gray-100' : 'text-gray-800'
                              }`}
                            >
                              {getStatusLabel(status)}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="relative">
                      <Tooltip content="Edit Topic">
                        <button
                          onClick={toggleTopicMenu}
                          className={`flex items-center px-3 py-1 rounded-full text-sm font-medium cursor-pointer ${
                            activeTopic === null ? 'bg-sky-100 text-sky-600' : 'bg-sky-100 text-sky-600'
                          } hover:bg-gray-200 transition-colors`}
                        >
                          <span className="mr-2 cursor-pointer bg-gray-50 text-gray-600 p-2 rounded-full disabled:bg-gray-200 hover:bg-gray-200 transition-colors">
                            <PencilIcon className="h-4 w-4" />
                          </span>
                          <span>{activeTopic || 'All Topics'}</span>
                        </button>
                      </Tooltip>
                      {isTopicMenuOpen && (
                        <div className="absolute z-10 mt-2 w-36 bg-white border border-gray-200 rounded-lg shadow-lg">
                          <button
                            onClick={() => handleTopicSelect(null)}
                            className={`w-full px-3 py-1 text-sm text-left hover:bg-gray-100 ${
                              activeTopic === null ? 'bg-sky-100 text-sky-600' : 'text-gray-800'
                            }`}
                          >
                            All Topics
                          </button>
                          {topics.map((topic) => (
                            <button
                              key={topic}
                              onClick={() => handleTopicSelect(topic)}
                              className={`w-full px-3 py-1 text-sm text-left hover:bg-gray-100 ${
                                activeTopic === topic ? 'bg-sky-100 text-sky-600' : 'text-gray-800'
                              }`}
                            >
                              {topic}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {isFixed && <div style={{ height: searchHeight ? `${searchHeight}px` : '60px' }} className="md:hidden" />}
                {loading ? (
                  <div className="text-gray-700">Loading...</div>
                ) : filteredFlashcards.length === 0 ? (
                  <div className="text-gray-700">
                    {searchQuery ? `No flashcards found matching "${searchQuery}"` : 'No flashcards available'}
                  </div>
                ) : (
                  <div>
                    <ul className="bg-white rounded-md ring-2 ring-gray-200 p-2 grid grid-cols-1 gap-y-2">
                      {filteredFlashcards.slice(0, page * flashcardsPerPage).map((flashcard, index) => (
                        <li
                          key={flashcard.id}
                          className={`my-1 rounded group cursor-pointer ${getStatusBorderClass(flashcard.status)}`}
                          onClick={() => openCard(index)}
                        >
                          <div className="flex flex-col py-2 px-4 hover:bg-sky-50 hover:text-sky-900 min-h-[80px]">
                            <div className="flex justify-between items-center gap-2">
                              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-gray-50 text-gray-900">
                                {getStatusLabel(flashcard.status || 'learning')}
                              </span>
                              <span className="text-xs font-thin text-gray-600">{flashcard.topic || ''}</span>
                            </div>
                            <span className="text-sm font-semibold text-gray-900 truncate mt-1">{flashcard.name || 'Untitled'}</span>
                            <div className="flex justify-between items-center gap-2 mt-2">
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {['learning', 'review', 'mastered', 'suspended', 'lapsed']
                                  .filter((status) => status !== flashcard.status)
                                  .map((status) => (
                                    <Tooltip key={status} content="Change status">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          updateFlashcardStatus(flashcard.id, !!flashcard.user_id, status);
                                        }}
                                        className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium cursor-pointer ${getStatusBgClass(
                                          status
                                        )} text-gray-800 hover:bg-gray-200`}
                                      >
                                        {getStatusLabel(status)}
                                      </button>
                                    </Tooltip>
                                  ))}
                              </div>
                              <div className="flex items-center gap-1">
                                {flashcard.user_id ? (
                                  <>
                                    <Tooltip content="Edit Flashcard">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          openEditModal(flashcard);
                                        }}
                                        className="cursor-pointer bg-gray-100 text-gray-600 p-2 rounded-full disabled:bg-gray-200 hover:bg-gray-200 transition-colors"
                                      >
                                        <PencilIcon className="h-5 w-5" />
                                      </button>
                                    </Tooltip>
                                    <Tooltip content="Delete Flashcard">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          deleteFlashcard(flashcard.id);
                                        }}
                                        className="cursor-pointer bg-gray-100 text-gray-600 p-2 rounded-full disabled:bg-gray-200 hover:bg-red-200 transition-colors"
                                      >
                                        <TrashIcon className="h-5 w-5" />
                                      </button>
                                    </Tooltip>
                                  </>
                                ) : (
                                  <div className="h-7 w-14" /> // Placeholder for consistent height
                                )}
                              </div>
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

      {selectedCardIndex !== null && filteredFlashcards[selectedCardIndex] && (
        <div
          className="fixed inset-0 z-70 flex items-center justify-center bg-gray-200 bg-opacity-50"
          onClick={closeCard}
        >
          <div
            className={`relative w-full md:w-[48rem] h-full md:h-[48rem] md:bg-white rounded-lg shadow-lg transform transition-all duration-300 ${getStatusBorderClass(filteredFlashcards[selectedCardIndex].status)} ${
              isFlipped ? 'rotate-y-180' : ''
            }`}
            style={{ transformStyle: 'preserve-3d' }}
            onClick={(e) => e.stopPropagation()}
            onDoubleClick={flipCard}
          >
            <div className="absolute inset-0 flex flex-col p-6 py-16 overflow-y-auto bg-gray-50">
              {!isFlipped ? (
                <div className="flex flex-col items-center justify-center flex-grow text-center">
                  <p className="px-3 py-1 rounded-full text-sm font-medium bg-teal-100 text-teal-600 my-2 mb-16">
                    {filteredFlashcards[selectedCardIndex].topic || ''}
                  </p>
                  <p className="text-sm text-gray-600">{filteredFlashcards[selectedCardIndex].section || ''}</p>
                  <h2 className="text-2xl font-semibold text-gray-800 whitespace-normal">
                    {filteredFlashcards[selectedCardIndex].name || 'Untitled'}
                  </h2>
                  <div className="mt-4">
                    <Tooltip
                      content={
                        filteredFlashcards[selectedCardIndex].status === 'learning'
                          ? 'Change to Review'
                          : filteredFlashcards[selectedCardIndex].status === 'review'
                          ? 'Change to Mastered'
                          : 'Change to Learning'
                      }
                    >
                      <button
                        onClick={() => handleStatusTransition(filteredFlashcards[selectedCardIndex])}
                        className="p-2 rounded-full text-sky-600 hover:bg-gray-100 cursor-pointer"
                      >
                        {['suspended', 'lapsed', 'mastered'].includes(
                          filteredFlashcards[selectedCardIndex].status || ''
                        ) ? (
                          <span className="text-sm font-medium">
                            Change to Learning
                          </span>
                        ) : (
                          <span className="text-sm font-medium">
                            Change to {getStatusLabel(getNextStatus(filteredFlashcards[selectedCardIndex].status))}
                          </span>
                        )}
                      </button>
                    </Tooltip>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-start flex-grow text-center overflow-y-auto transform rotate-y-180">
                  <div className="space-y-2 w-full">
                    {(filteredFlashcards[selectedCardIndex].messages || []).map((msg, index) => (
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
              )}
              <button
                onClick={closeCard}
                className="absolute top-4 right-2 p-2 rounded-full bg-transparent text-gray-800 hover:bg-gray-100 cursor-pointer"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
              <button
                onClick={flipCard}
                className="absolute top-4 left-2 p-2 rounded-full bg-transparent text-gray-800 hover:bg-gray-100 cursor-pointer"
              >
                <ArrowPathIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
              <button
                onClick={prevCard}
                className="p-2 rounded-full text-sky-500 text-sm font-medium hover:shadow-sm disabled:bg-gray-300 transition-colors cursor-pointer"
                disabled={filteredFlashcards.length <= 1}
              >
                <ChevronLeftIcon className="h-6 w-6" />
              </button>
              <button
                onClick={nextCard}
                className="p-2 rounded-full text-sky-500 text-sm font-medium hover:shadow-sm disabled:bg-gray-300 transition-colors cursor-pointer"
                disabled={filteredFlashcards.length <= 1}
              >
                <ChevronRightIcon className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      )}

      {editingCard && (
        <div
          className="fixed inset-0 z-80 flex items-center justify-center bg-gray-200 bg-opacity-50"
          onClick={closeEditModal}
        >
          <div
            className="relative w-full max-w-md bg-white rounded-lg shadow-lg p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Edit Flashcard</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="Enter flashcard name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Topic</label>
                <input
                  type="text"
                  value={editForm.topic}
                  onChange={(e) => setEditForm({ ...editForm, topic: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="Enter topic"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Section</label>
                <input
                  type="text"
                  value={editForm.section}
                  onChange={(e) => setEditForm({ ...editForm, section: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="Enter section"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Content</label>
                <div
                  className="w-full h-32 md:max-w-[48rem] md:max-h-[48rem] px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 text-gray-600 overflow-y-auto space-y-2 resize"
                >
                  {(editingCard.messages || []).map((msg, index) => (
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
                  {(!editingCard.messages || editingCard.messages.length === 0) && (
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