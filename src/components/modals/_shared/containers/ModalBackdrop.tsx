/**
 * ModalBackdrop Component
 * 
 * Backdrop overlay for modals with blur effect
 */

'use client';

import React from 'react';
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
 */
export const ModalBackdrop: React.FC<ModalBackdropProps> = ({
  isOpen,
  onClick,
  zIndex = MODAL_Z_INDEX.backdrop,
  className = '',
}) => {
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
