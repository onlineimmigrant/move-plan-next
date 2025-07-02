// AiFlashcards.tsx
'use client';
import { useState, useEffect, useMemo } from 'react';
import { Disclosure, Transition } from '@headlessui/react';
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import Tooltip from '@/components/Tooltip';
import HelpModal from './HelpModal';
import FlashcardSearch from './AiFlashcardsComponents/FlashcardSearch';
import FlashcardList from './AiFlashcardsComponents/FlashcardList';
import FlashcardModal from './AiFlashcardsComponents/FlashcardModal';
import EditFlashcardModal from './AiFlashcardsComponents/EditFlashcardModal';
import { useFlashcards } from '../../lib/hooks/useFlashcards';
import { cn } from '../../utils/cn';

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

const FLASHCARDS_PER_PAGE = 4;

export default function AiFlashcards({ userId, onError }: AiFlashcardsProps) {
  const { flashcards, loading, error, topics, deleteFlashcard, updateFlashcardStatus, updateFlashcard } = useFlashcards(userId);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStatus, setActiveStatus] = useState<string>('status');
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (error) {
      onError(error);
    }
  }, [error, onError]);

  const filteredFlashcards = useMemo(() => {
    let result = flashcards;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((flashcard) =>
        (flashcard.name?.toLowerCase().includes(query) || flashcard.topic?.toLowerCase().includes(query))
      );
    }

    if (activeStatus !== 'status') {
      result = result.filter((flashcard) => flashcard.status === activeStatus);
    }

    if (activeTopic) {
      result = result.filter((flashcard) => flashcard.topic === activeTopic);
    }

    return result;
  }, [searchQuery, activeStatus, activeTopic, flashcards]);

  const hasMore = filteredFlashcards.length > page * FLASHCARDS_PER_PAGE;

  const getStatusLabel = (status: string): string => {
    const statusLabels: { [key: string]: string } = {
      learning: 'Learning',
      review: 'Review',
      mastered: 'Mastered',
      suspended: 'Suspended',
      lapsed: 'Lapsed',
      status: 'Status',
    };
    return statusLabels[status] || status;
  };

  const getNextStatus = (currentStatus: string | undefined): string => {
    const statusCycle: { [key: string]: string } = {
      learning: 'review',
      review: 'mastered',
      mastered: 'learning',
      suspended: 'learning',
      lapsed: 'learning',
    };
    return statusCycle[currentStatus || 'learning'] || 'learning';
  };

  const getStatusBgClass = (status?: string) => {
    switch (status) {
      case 'learning':
      case 'review':
      case 'mastered':
      case 'suspended':
      case 'lapsed':
        return 'bg-gray-100';
      default:
        return 'bg-gray-100';
    }
  };

  const getStatusBorderClass = (status?: string) => {
    switch (status) {
      case 'learning':
        return 'border-2 border-sky-100';
      case 'review':
        return 'border-2 border-yellow-100';
      case 'mastered':
        return 'border-2 border-teal-100';
      case 'suspended':
        return 'border-2 border-gray-100';
      case 'lapsed':
        return 'border-2 border-red-100';
      default:
        return 'border-2 border-gray-200';
    }
  };

  const getStatusBackgroundClass = (status?: string) => {
    switch (status) {
      case 'learning':
        return 'bg-sky-50';
      case 'review':
        return 'bg-yellow-50';
      case 'mastered':
        return 'bg-teal-50';
      case 'suspended':
        return 'bg-gray-50';
      case 'lapsed':
        return 'bg-red-50';
      default:
        return 'border-2 border-gray-200';
    }
  };

  const openCard = (index: number) => {
    if (editingCard) return;
    setSelectedCardIndex(index);
    setIsFlipped(false);
  };

  const closeCard = () => {
    setSelectedCardIndex(null);
    setIsFlipped(false);
  };

  const flipCard = () => {
    setIsFlipped((prev) => !prev);
  };

  const prevCard = () => {
    if (filteredFlashcards.length === 0) return;
    setSelectedCardIndex((prev) =>
      prev === null || prev === 0 ? filteredFlashcards.length - 1 : prev - 1
    );
    setIsFlipped(false);
  };

  const nextCard = () => {
    if (filteredFlashcards.length === 0) return;
    setSelectedCardIndex((prev) =>
      prev === null || prev === filteredFlashcards.length - 1 ? 0 : prev + 1
    );
    setIsFlipped(false);
  };

  const openEditModal = (flashcard: Flashcard) => {
    if (!flashcard.user_id) return;
    setEditingCard(flashcard);
  };

  const closeEditModal = () => {
    setEditingCard(null);
  };

  const handleStatusTransition = (flashcard: Flashcard) => {
    const nextStatus = getNextStatus(flashcard.status);
    updateFlashcardStatus(flashcard.id, !!flashcard.user_id, nextStatus);
  };

  return (
    <div className="relative">
      <Disclosure defaultOpen>
        {({ open }) => (
          <div>
            <div className="flex items-center justify-between">
              <Disclosure.Button
                className={cn(
                  'inline-flex items-center px-3 py-1 mb-2 text-sm font-medium text-gray-800 bg-gray-100 border border-gray-200 rounded-full shadow-sm hover:bg-gray-200 transition-colors'
                )}
              >
                <span>Flashcards</span>
                <span className="ml-2 font-bold text-sky-500">{open ? '−' : '+'}</span>
              </Disclosure.Button>
              <Tooltip content="Flashcard Help Guide">
                <button
                  onClick={() => setIsHelpModalOpen(true)}
                  className="p-2 mb-4 text-gray-400 rounded-full hover:bg-sky-600 transition-colors"
                >
                  <QuestionMarkCircleIcon className="w-5 h-5" />
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
              <Disclosure.Panel className="p-4 bg-gray-50 border-2 border-gray-200 rounded-xl">
<FlashcardSearch
  searchQuery={searchQuery}
  setSearchQuery={setSearchQuery}
  activeStatus={activeStatus}
  handleStatusSelect={setActiveStatus}
  activeTopic={activeTopic}
  handleTopicSelect={setActiveTopic}
  topics={topics}
  getStatusLabel={getStatusLabel}
/>
                {loading ? (
                  <div className="text-gray-700">Loading...</div>
                ) : filteredFlashcards.length === 0 ? (
                  <div className="text-gray-700">
                    {searchQuery ? `No flashcards found matching "${searchQuery}"` : 'No flashcards available'}
                  </div>
                ) : (
                  <FlashcardList
                    flashcards={filteredFlashcards}
                    openCard={openCard}
                    openEditModal={openEditModal}
                    deleteFlashcard={deleteFlashcard}
                    updateFlashcardStatus={updateFlashcardStatus}
                    getStatusLabel={getStatusLabel}
                    getStatusBgClass={getStatusBgClass}
                    getStatusBorderClass={getStatusBorderClass}
                    getStatusBackgroundClass={getStatusBackgroundClass}
                    page={page}
                    setPage={setPage}
                    hasMore={hasMore}
                    totalFlashcards={filteredFlashcards.length}
                  />
                )}
              </Disclosure.Panel>
            </Transition>
          </div>
        )}
      </Disclosure>

      {selectedCardIndex !== null && filteredFlashcards[selectedCardIndex] && (
        <FlashcardModal
          flashcard={filteredFlashcards[selectedCardIndex]}
          closeCard={closeCard}
          prevCard={prevCard}
          nextCard={nextCard}
          handleStatusTransition={handleStatusTransition}
          getStatusLabel={getStatusLabel}
          getNextStatus={getNextStatus}
          getStatusBackgroundClass={getStatusBackgroundClass}
          getStatusBorderClass={getStatusBorderClass}
          isFlipped={isFlipped}
          flipCard={flipCard}
          flashcards={filteredFlashcards}
        />
      )}

      {editingCard && (
        <EditFlashcardModal
          editingCard={editingCard}
          closeEditModal={closeEditModal}
          updateFlashcard={updateFlashcard}
          onError={onError}
        />
      )}
    </div>
  );
}