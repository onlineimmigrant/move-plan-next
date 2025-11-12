/**
 * StandardModalContainer Component
 * 
 * Main modal container with glass morphism, responsive behavior, and drag/resize
 */

'use client';

import React, { useEffect } from 'react';
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
  // Focus management
  const { modalRef, restoreFocus } = useModalFocus(isOpen);

  // Keyboard handling
  useModalKeyboard(isOpen, onClose, closeOnEscape);

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

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
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

  // Render modal content
  if (typeof window === 'undefined') return null;

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
                  // Mobile: Fullscreen fixed modal with padding
                  <div
                    className="fixed inset-0 flex items-center justify-center p-4 z-[10001]"
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
                      onClick={(e) => e.stopPropagation()}
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
