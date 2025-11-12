/**
 * usePartToggles Hook
 * 
 * Manages show/hide state for optional title parts
 */

import { useState, useEffect } from 'react';

export function usePartToggles(namePart2?: string, namePart3?: string) {
  const [showPart2, setShowPart2] = useState(!!namePart2);
  const [showPart3, setShowPart3] = useState(!!namePart3);

  // Update when form data changes
  useEffect(() => {
    setShowPart2(!!namePart2);
    setShowPart3(!!namePart3);
  }, [namePart2, namePart3]);

  return {
    showPart2,
    showPart3,
    setShowPart2,
    setShowPart3,
  };
}
