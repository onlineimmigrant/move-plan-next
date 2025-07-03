import { createContext } from 'react';
import { PlanFlashcard } from './types';

export const PlannerContext = createContext<{
  newPlanFlashcardIds: PlanFlashcard[];
  setNewPlanFlashcardIds: (ids: PlanFlashcard[]) => void;
  addFlashcardToPlanner: (flashcardId: number, isUserFlashcard: boolean) => void;
}>({
  newPlanFlashcardIds: [],
  setNewPlanFlashcardIds: () => {},
  addFlashcardToPlanner: () => {},
});