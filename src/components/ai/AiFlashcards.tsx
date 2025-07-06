'use client';
import { useState, useEffect, useMemo, useContext } from 'react';
import { Disclosure, Transition } from '@headlessui/react';
import FlashcardSearch from './AiFlashcardsComponents/FlashcardSearch';
import FlashcardList from './AiFlashcardsComponents/FlashcardList';
import EditFlashcardModal from './AiFlashcardsComponents/EditFlashcardModal';
import FlashcardModal from './AiFlashcardsComponents/FlashcardModal';
import { useFlashcards } from '../../lib/hooks/useFlashcards';
import { cn } from '../../utils/cn';
import { PlannerContext } from '../../lib/context';
import { Flashcard } from '../../lib/types';
import DisclosureButton from '@/ui/DisclosureButton';

interface AiFlashcardsProps {
  userId: string | null;
  onError: (error: string) => void;
  onFilteredFlashcards: (flashcardIds: number[]) => void;
  setFlashcards: (flashcards: Flashcard[]) => void;
  openCardById: (flashcardId: number) => void;
  closeCard: () => void;
  prevCard: () => Promise<void>;
  nextCard: () => Promise<void>;
  flipCard: () => void;
  getStatusLabel: (status: string) => string;
  getNextStatus: (currentStatus: string | undefined) => string;
  getStatusBackgroundClass: (status?: string) => string;
  getStatusBorderClass: (status?: string) => string;
  handleStatusTransition: (flashcard: Flashcard) => Promise<void>;
}

const FLASHCARDS_PER_PAGE = 4;

export default function AiFlashcards({
  userId,
  onError,
  onFilteredFlashcards,
  setFlashcards,
  openCardById,
  closeCard,
  prevCard,
  nextCard,
  flipCard,
  getStatusLabel,
  getNextStatus,
  getStatusBackgroundClass,
  getStatusBorderClass,
  handleStatusTransition,
}: AiFlashcardsProps) {
  const { flashcards, loading, error, topics, deleteFlashcard, updateFlashcardStatus, updateFlashcard } = useFlashcards(userId);
  const { addFlashcardToPlanner, newPlanFlashcardIds } = useContext(PlannerContext);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStatus, setActiveStatus] = useState<string>('status');
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);
  const [page, setPage] = useState(1);
  const [selectedFlashcardId, setSelectedFlashcardId] = useState<number | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);

  const filteredFlashcards = useMemo(() => {
    console.log('Recomputing filteredFlashcards, flashcards:', flashcards.map(f => ({ id: f.id, name: f.name })));
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

    console.log('Filtered flashcards:', result.map(f => ({ id: f.id, name: f.name })));
    return result;
  }, [searchQuery, activeStatus, activeTopic, flashcards]);

  useEffect(() => {
    if (flashcards) {
      console.log('Flashcards updated in AiFlashcards:', flashcards.map(f => ({ id: f.id, name: f.name })));
      setFlashcards(flashcards);
    }
  }, [flashcards, setFlashcards]);

  useEffect(() => {
    console.log('Calling onFilteredFlashcards with:', filteredFlashcards.map(f => ({ id: f.id, name: f.name })));
    onFilteredFlashcards(filteredFlashcards.map((f) => f.id));
  }, [filteredFlashcards, onFilteredFlashcards]);

  useEffect(() => {
    if (error) {
      onError(error);
    }
  }, [error, onError]);

  const hasMore = filteredFlashcards.length > page * FLASHCARDS_PER_PAGE;

  const openEditModal = (flashcard: Flashcard) => {
    if (!flashcard.user_id) return;
    setEditingCard(flashcard);
  };

  const closeEditModal = () => {
    setEditingCard(null);
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

  const handleOpenCard = (flashcardId: number) => {
    const isValidId = filteredFlashcards.some((f) => f.id === flashcardId);
    const firstFilteredId = filteredFlashcards[0]?.id;
    if (isValidId) {
      console.log('Opening flashcard ID:', flashcardId, 'from filteredFlashcards:', filteredFlashcards.map(f => ({ id: f.id, name: f.name })));
      setSelectedFlashcardId(flashcardId);
      setIsFlipped(false);
      openCardById(flashcardId);
    } else if (firstFilteredId) {
      console.log('Flashcard ID', flashcardId, 'not in filtered set, opening first filtered flashcard:', firstFilteredId);
      setSelectedFlashcardId(firstFilteredId);
      setIsFlipped(false);
      openCardById(firstFilteredId);
    } else {
      console.log('No filtered flashcards available, not opening modal');
      onError('No flashcards match the current filters');
      setSelectedFlashcardId(null);
    }
  };

  const handleCloseCard = () => {
    console.log('Closing modal, setting selectedFlashcardId to null');
    setSelectedFlashcardId(null);
    setIsFlipped(false);
    closeCard();
  };

  const handleFlipCard = () => {
    console.log('Flipping card, current isFlipped:', isFlipped);
    setIsFlipped((prev) => !prev);
  };

  return (
    <div className="-mt-2 sm:mt-0 relative">
      <Disclosure defaultOpen>
        {({ open }) => (
          <div>
            <div className="flex justify-between space-x-2 items-center mb-4">
              <DisclosureButton className="w-full sm:w-auto">
                Flashcards
                <span className="ml-2 font-bold text-sky-500">{open ? '−' : '+'}</span>
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
              <Disclosure.Panel className="py-2 sm:p-4 sm:bg-gray-50 sm:border-2 sm:border-gray-200 rounded-xl">
                <FlashcardSearch
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  activeStatus={activeStatus}
                  handleStatusSelect={setActiveStatus}
                  activeTopic={activeTopic}
                  handleTopicSelect={setActiveTopic}
                  topics={topics}
                  getStatusLabel={getStatusLabel}
                  filteredFlashcards={filteredFlashcards}
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
                    openCard={handleOpenCard}
                    openEditModal={openEditModal}
                    deleteFlashcard={deleteFlashcard}
                    updateFlashcardStatus={updateFlashcardStatus}
                    getStatusLabel={getStatusLabel}
                    getStatusBgClass={getStatusBackgroundClass}
                    getStatusBorderClass={getStatusBorderClass}
                    getStatusBackgroundClass={getStatusBackgroundClass}
                    page={page}
                    setPage={setPage}
                    hasMore={hasMore}
                    totalFlashcards={filteredFlashcards.length}
                    handleAddAllToPlanner={handleAddAllToPlanner}
                    filteredFlashcards={filteredFlashcards}
                    onError={onError}
                    setFlashcards={setFlashcards}
                  />
                )}
              </Disclosure.Panel>
            </Transition>
          </div>
        )}
      </Disclosure>

      {editingCard && (
        <EditFlashcardModal
          editingCard={editingCard}
          closeEditModal={closeEditModal}
          updateFlashcard={updateFlashcard}
          onError={onError}
        />
      )}

      {selectedFlashcardId && filteredFlashcards.length > 0 && (
        <FlashcardModal
          flashcard={filteredFlashcards.find((f) => f.id === selectedFlashcardId) || filteredFlashcards[0]}
          closeCard={handleCloseCard}
          prevCard={prevCard}
          nextCard={nextCard}
          handleStatusTransition={handleStatusTransition}
          getStatusLabel={getStatusLabel}
          getNextStatus={getNextStatus}
          getStatusBackgroundClass={getStatusBackgroundClass}
          getStatusBorderClass={getStatusBorderClass}
          isFlipped={isFlipped}
          flipCard={handleFlipCard}
          flashcards={flashcards}
          currentPlanId={null}
          filteredFlashcards={filteredFlashcards}
          activeTopic={activeTopic}
          updateFlashcardStatus={updateFlashcardStatus}
        />
      )}
    </div>
  );
}