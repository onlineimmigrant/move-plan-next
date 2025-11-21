/**
 * StandardModalContainer Component
 * 
 * Main modal container with glass morphism, responsive behavior, and drag/resize
 */

'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { StandardModalContainerProps } from '../types';
import { ModalBackdrop } from './ModalBackdrop';
import { ResponsiveWrapper } from './ResponsiveWrapper';
import { DraggableWrapper } from './DraggableWrapper';
import { useModalFocus } from '../hooks/useModalFocus';
import { useModalKeyboard } from '../hooks/useModalKeyboard';

import {
  MODAL_Z_INDEX,
  GLASS_MORPHISM_STYLES,
} from '../utils/modalConstants';
import {
  getDefaultPosition,
  getResponsiveDimensions,
  getModalSizeConfig,
} from '../utils/modalSizing';
import { modalVariants, mobileSlideVariants } from '../utils/modalAnimations';

/**
 * Standard Modal Container
 * 
 * Provides:
 * - Glass morphism design
 * - Responsive behavior (mobile fullscreen, desktop draggable)
 * - Drag and resize (desktop only)
 * - Focus trap and keyboard shortcuts
 * - Portal rendering
 * - Backdrop with blur
 */
export const StandardModalContainer: React.FC<StandardModalContainerProps> = ({
  isOpen,
  onClose,
  children,
  size = 'large',
  enableDrag = true,
  enableResize = true,
  defaultPosition,
  defaultSize,
  minSize,
  className = '',
  zIndex = MODAL_Z_INDEX.modal,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  ariaLabel,
  ariaLabelledBy,
}) => {
  const [isMounted, setIsMounted] = useState(false);

  // Focus management
  const { modalRef, restoreFocus } = useModalFocus(isOpen);

  // Keyboard handling
  useModalKeyboard(isOpen, onClose, closeOnEscape);

  // Track client-side mount to prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Handle close with focus restoration
  const handleClose = () => {
    restoreFocus();
    onClose();
  };

  const handleBackdropClick = () => {
    if (closeOnBackdropClick) {
      handleClose();
    }
  };

  // Lock body scroll when modal is open (without moving scroll position)
  useEffect(() => {
    if (isOpen) {
      // Simply prevent scrolling without changing position
      const originalOverflow = document.body.style.overflow;
      const originalPaddingRight = document.body.style.paddingRight;
      
      // Get scrollbar width to prevent layout shift
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollbarWidth}px`;
      
      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.paddingRight = originalPaddingRight;
      };
    }
  }, [isOpen]);

  // Get size configuration
  const sizeConfig = getModalSizeConfig(size);
  const finalSize = defaultSize || {
    width: sizeConfig.width,
    height: sizeConfig.height,
  };
  const finalMinSize = minSize || {
    width: sizeConfig.minWidth,
    height: sizeConfig.minHeight,
  };
  const finalPosition = defaultPosition || getDefaultPosition(size, finalSize);

  // Glass morphism classes
  const glassClasses = `
    ${GLASS_MORPHISM_STYLES.light}
    ${GLASS_MORPHISM_STYLES.dark}
    ${GLASS_MORPHISM_STYLES.border}
    ${GLASS_MORPHISM_STYLES.shadow}
    ${GLASS_MORPHISM_STYLES.rounded}
  `.trim();

  // Prevent hydration mismatch by only rendering on client
  if (!isMounted) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <ModalBackdrop
        isOpen={isOpen}
        onClick={handleBackdropClick}
        zIndex={zIndex - 1}
      />

      {/* Modal */}
      <ResponsiveWrapper>
        {(isMobile) => (
          <AnimatePresence>
            {isOpen && (
              <>
                {isMobile ? (
                  // Mobile: Modal positioned at current viewport (not scrolled to top)
                  <div
                    className="fixed top-0 left-0 right-0 bottom-0 flex items-center justify-center p-4 z-[10001]"
                    style={{ zIndex }}
                  >
                    <motion.div
                      ref={modalRef}
                      role="dialog"
                      aria-modal="true"
                      aria-label={ariaLabel}
                      aria-labelledby={ariaLabelledBy}
                      className={`w-full h-[90vh] ${glassClasses} ${className}`}
                      variants={mobileSlideVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      tabIndex={-1}
                      onClick={(e: React.MouseEvent) => e.stopPropagation()}
                    >
                      <div className="h-full overflow-hidden flex flex-col">
                        {children}
                      </div>
                    </motion.div>
                  </div>
                ) : (
                  // Desktop: Draggable/Resizable modal
                  <DraggableWrapper
                    enableDrag={enableDrag}
                    enableResize={enableResize}
                    defaultPosition={finalPosition}
                    defaultSize={finalSize}
                    minSize={finalMinSize}
                    zIndex={zIndex}
                  >
                    <motion.div
                      ref={modalRef}
                      role="dialog"
                      aria-modal="true"
                      aria-label={ariaLabel}
                      aria-labelledby={ariaLabelledBy}
                      className={`w-full h-full ${glassClasses} ${className}`}
                      variants={modalVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      tabIndex={-1}
                    >
                      <div className="h-full overflow-hidden flex flex-col">
                        {children}
                      </div>
                    </motion.div>
                  </DraggableWrapper>
                )}
              </>
            )}
          </AnimatePresence>
        )}
      </ResponsiveWrapper>
    </>,
    document.body
  );
};
