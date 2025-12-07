/**
 * ModalBackdrop Component
 * 
 * Backdrop overlay for modals with blur effect
 */

'use client';

import React, { useEffect, useState } from 'react';
import { BACKDROP_STYLES, MODAL_Z_INDEX } from '../utils/modalConstants';

interface ModalBackdropProps {
  /** Whether the backdrop is visible */
  isOpen: boolean;
  
  /** Click handler for backdrop */
  onClick?: () => void;
  
  /** Custom z-index */
  zIndex?: number;
  
  /** Custom className */
  className?: string;
}

/**
 * Backdrop component for modals
 * Renders a semi-transparent overlay with blur effect
 */
export const ModalBackdrop: React.FC<ModalBackdropProps> = ({
  isOpen,
  onClick,
  zIndex = MODAL_Z_INDEX.backdrop,
  className = '',
}) => {
  // Mount gating: server renders null; first client pass also null; prevents hydration mismatch
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted || !isOpen) return null;
  
  return (
    <div
      className={`fixed inset-0 ${BACKDROP_STYLES.base} ${BACKDROP_STYLES.animation} ${className} transition-opacity duration-200`}
      style={{ zIndex }}
      onClick={onClick}
      aria-hidden="true"
    />
  );
};
