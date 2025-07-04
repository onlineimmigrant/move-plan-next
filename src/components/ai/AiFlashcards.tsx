'use client';
import { useState, useEffect, useMemo, useContext } from 'react';
import { Disclosure, Transition } from '@headlessui/react';
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import Tooltip from '@/components/Tooltip';

import FlashcardSearch from './AiFlashcardsComponents/FlashcardSearch';
import FlashcardList from './AiFlashcardsComponents/FlashcardList';
import FlashcardModal from './AiFlashcardsComponents/FlashcardModal';
import EditFlashcardModal from './AiFlashcardsComponents/EditFlashcardModal';
import { useFlashcards } from '../../lib/hooks/useFlashcards';
import { cn } from '../../utils/cn';
import { PlannerContext } from '../../lib/context';
import { Flashcard } from '../../lib/types';
import Button from '@/ui/Button';
import DisclosureButton from '@/ui/DisclosureButton';

interface AiFlashcardsProps {
  userId: string | null;
  onError: (error: string) => void;
  onFilteredFlashcards: (flashcardIds: number[]) => void;
  setFlashcards: (flashcards: Flashcard[]) => void;
}

const FLASHCARDS_PER_PAGE = 4;

export default function AiFlashcards({
  userId,
  onError,
  onFilteredFlashcards,
  setFlashcards,
}: AiFlashcardsProps) {
  const { flashcards, loading, error, topics, deleteFlashcard, updateFlashcardStatus, updateFlashcard } = useFlashcards(userId);
  const { addFlashcardToPlanner, newPlanFlashcardIds } = useContext(PlannerContext);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStatus, setActiveStatus] = useState<string>('status');
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (flashcards) {
      console.log('Flashcards updated in AiFlashcards:', flashcards.length);
      setFlashcards(flashcards);
      onFilteredFlashcards(flashcards.map((f) => f.id));
    }
  }, [flashcards, setFlashcards, onFilteredFlashcards]);

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
        return 'bg-gray-200';
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

  const handleAddAllToPlanner = () => {
    const added: number[] = [];
    const skipped: string[] = [];
    filteredFlashcards.forEach((f) => {
      if (newPlanFlashcardIds.some((pf) => pf.id === f.id)) {
        skipped.push(f.name || `Flashcard ID: ${f.id}`);
      } else {
        addFlashcardToPlanner(f.id, !!f.user_id);
        added.push(f.id);
      }
    });
    if (skipped.length > 0) {
      onError(`Skipped ${skipped.length} duplicate flashcards: ${skipped.join(', ')}`);
    }
    if (added.length > 0) {
      console.log(`Added ${added.length} flashcards to planner:`, added);
    }
  };

  return (
    <div className="relative">
      <Disclosure defaultOpen>
        {({ open }) => (
          <div>
            <div className="flex justify-between space-x-2 items-center mb-4">
              <DisclosureButton>
                Flashcards
                <span className="ml-2 font-bold text-sky-500">{open ? '−' : '+'}</span>
              </DisclosureButton>
              <div className="flex items-center">
                {/* Removed "Add {filteredFlashcards.length} to Planner" button */}
              </div>
            </div>
            <Transition
              enter="transition ease-out duration-100"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Disclosure.Panel className="sm:p-4 sm:bg-gray-50 sm:border-2 sm:border-gray-200 rounded-xl">
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
                    handleAddAllToPlanner={handleAddAllToPlanner} // Pass function
                    filteredFlashcards={filteredFlashcards} // Pass filtered flashcards
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