import { useState } from 'react';

/**
 * Manages accordion open/close state for mobile footer sections
 * Uses a Set to track which accordion IDs are currently open
 */
export const useAccordionState = () => {
  const [openAccordions, setOpenAccordions] = useState<Set<string>>(new Set());
  
  const toggleAccordion = (id: string) => {
    setOpenAccordions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  return {
    openAccordions,
    toggleAccordion,
  };
};
