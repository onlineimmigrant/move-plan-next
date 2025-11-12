/**
 * useDropdowns Hook
 * 
 * Manages all dropdown states
 */

import { useState } from 'react';

export function useDropdowns() {
  const [openDropdowns, setOpenDropdowns] = useState({
    titleSize: false,
    titleAlignment: false,
    titleBlockWidth: false,
    descriptionSize: false,
    imagePosition: false,
    animationElement: false,
  });

  const toggleDropdown = (key: keyof typeof openDropdowns) => {
    setOpenDropdowns(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const closeAllDropdowns = () => {
    setOpenDropdowns({
      titleSize: false,
      titleAlignment: false,
      titleBlockWidth: false,
      descriptionSize: false,
      imagePosition: false,
      animationElement: false,
    });
  };

  return {
    openDropdowns,
    toggleDropdown,
    closeAllDropdowns,
  };
}
