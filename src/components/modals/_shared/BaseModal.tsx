// BaseModal.tsx - Pre-configured modal with common patterns
'use client';

import React, { ReactNode } from 'react';
import {
  Modal,
  ModalContent,
  ModalBackdrop,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from '@/ui/Modal';
import Button from '@/ui/Button';

export interface BaseModalProps {
  // Modal state
  isOpen: boolean;
  onClose: () => void;
  
  // Header props
  title: string | ReactNode;
  subtitle?: string;
  
  // Content
  children: ReactNode;
  
  // Footer actions
  footer?: ReactNode;
  showFooter?: boolean;
  
  // Primary action button
  primaryAction?: {
    label: string;
    onClick: () => void;
    loading?: boolean;
    disabled?: boolean;
    variant?: 'primary' | 'danger';
  };
  
  // Secondary action button
  secondaryAction?: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
  };
  
  // Modal behavior
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
  
  // Styling
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  draggable?: boolean;
  resizable?: boolean;
  fullscreen?: boolean;
  
  // Header customization
  showCloseButton?: boolean;
  showFullscreenButton?: boolean;
  onToggleFullscreen?: () => void;
  
  // Body customization
  noPadding?: boolean;
  scrollable?: boolean;
  
  // Footer alignment
  footerAlign?: 'left' | 'center' | 'right' | 'between';
  
  // Custom classes
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
  footerClassName?: string;
}

/**
 * BaseModal - A pre-configured modal with common patterns
 * 
 * This component wraps the primitive Modal components and provides
 * a more convenient API for common modal use cases.
 * 
 * @example
 * // Simple confirmation modal
 * <BaseModal
 *   isOpen={isOpen}
 *   onClose={handleClose}
 *   title="Confirm Action"
 *   primaryAction={{ label: "Confirm", onClick: handleConfirm }}
 *   secondaryAction={{ label: "Cancel", onClick: handleClose }}
 * >
 *   <p>Are you sure?</p>
 * </BaseModal>
 * 
 * @example
 * // Form modal
 * <BaseModal
 *   isOpen={isOpen}
 *   onClose={handleClose}
 *   title="Create Item"
 *   size="lg"
 *   primaryAction={{ label: "Create", onClick: handleSubmit, loading: isSubmitting }}
 * >
 *   <form>{fields}</form>
 * </BaseModal>
 */
export const BaseModal: React.FC<BaseModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  showFooter = true,
  primaryAction,
  secondaryAction,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  size = 'lg',
  draggable = false,
  resizable = false,
  fullscreen = false,
  showCloseButton = true,
  showFullscreenButton = false,
  onToggleFullscreen,
  noPadding = false,
  scrollable = true,
  footerAlign = 'right',
  className,
  headerClassName,
  bodyClassName,
  footerClassName,
}) => {
  const handleBackdropClick = closeOnBackdropClick ? onClose : undefined;

  // Render default footer with action buttons if no custom footer provided
  const renderFooter = () => {
    if (footer) return footer;
    
    if (!primaryAction && !secondaryAction) return null;

    return (
      <>
        {secondaryAction && (
          <Button
            variant="outline"
            onClick={secondaryAction.onClick}
            disabled={secondaryAction.disabled}
          >
            {secondaryAction.label}
          </Button>
        )}
        {primaryAction && (
          <Button
            variant={primaryAction.variant || 'primary'}
            onClick={primaryAction.onClick}
            disabled={primaryAction.disabled || primaryAction.loading}
          >
            {primaryAction.loading ? 'Loading...' : primaryAction.label}
          </Button>
        )}
      </>
    );
  };

  const hasFooterContent = footer || primaryAction || secondaryAction;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      closeOnBackdropClick={closeOnBackdropClick}
      closeOnEscape={closeOnEscape}
    >
      <ModalBackdrop onClick={handleBackdropClick} />
      <ModalContent
        size={size}
        draggable={draggable}
        resizable={resizable}
        fullscreen={fullscreen}
        className={className}
      >
        {/* Wrap header in drag handle if draggable */}
        {draggable && !fullscreen ? (
          <div className="modal-drag-handle cursor-move">
            <ModalHeader
              title={title}
              subtitle={subtitle}
              onClose={onClose}
              onToggleFullscreen={onToggleFullscreen}
              isFullscreen={fullscreen}
              showCloseButton={showCloseButton}
              showFullscreenButton={showFullscreenButton}
              className={headerClassName}
            />
          </div>
        ) : (
          <ModalHeader
            title={title}
            subtitle={subtitle}
            onClose={onClose}
            onToggleFullscreen={onToggleFullscreen}
            isFullscreen={fullscreen}
            showCloseButton={showCloseButton}
            showFullscreenButton={showFullscreenButton}
            className={headerClassName}
          />
        )}

        <ModalBody
          noPadding={noPadding}
          scrollable={scrollable}
          className={bodyClassName}
        >
          {children}
        </ModalBody>

        {showFooter && hasFooterContent && (
          <ModalFooter align={footerAlign} className={footerClassName}>
            {renderFooter()}
          </ModalFooter>
        )}
      </ModalContent>
    </Modal>
  );
};
