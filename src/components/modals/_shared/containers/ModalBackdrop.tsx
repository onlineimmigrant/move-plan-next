/**
 * ModalBackdrop Component
 * 
 * Backdrop overlay for modals with blur effect
 */

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BACKDROP_STYLES, MODAL_Z_INDEX } from '../utils/modalConstants';
import { backdropVariants } from '../utils/modalAnimations';

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
 * Uses client-side only rendering to prevent hydration issues
 */
export const ModalBackdrop: React.FC<ModalBackdropProps> = ({
  isOpen,
  onClick,
  zIndex = MODAL_Z_INDEX.backdrop,
  className = '',
}) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Don't render on server to avoid hydration mismatch
  if (!isMounted) {
    return null;
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={`fixed inset-0 ${BACKDROP_STYLES.base} ${BACKDROP_STYLES.animation} ${className}`}
          style={{ zIndex }}
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={onClick}
          aria-hidden="true"
        />
      )}
    </AnimatePresence>
  );
};
