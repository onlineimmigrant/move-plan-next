/**
 * Example: Simple Modal using Standardized System
 * 
 * This is a basic example showing how to use the new standardized modal components.
 * Use this as a reference when migrating existing modals.
 */

'use client';

import React, { useState } from 'react';
import { DocumentTextIcon } from '@heroicons/react/24/outline';
import {
  StandardModalContainer,
  StandardModalHeader,
  StandardModalBody,
  StandardModalFooter,
  useModalState,
  type ModalAction,
} from '@/components/modals/_shared';

/**
 * Simple Example Modal
 * 
 * Demonstrates:
 * - Basic modal structure
 * - Single action button
 * - Clean, simple content
 */
export const ExampleSimpleModal: React.FC = () => {
  const { isOpen, open, close } = useModalState();

  const handleSave = async () => {
    console.log('Saving...');
    // Simulate async operation
    await new Promise((resolve) => setTimeout(resolve, 1000));
    close();
  };

  const primaryAction: ModalAction = {
    label: 'Save',
    onClick: handleSave,
    variant: 'primary',
  };

  const secondaryAction: ModalAction = {
    label: 'Cancel',
    onClick: close,
    variant: 'secondary',
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={open}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        Open Simple Modal
      </button>

      {/* Modal */}
      <StandardModalContainer
        isOpen={isOpen}
        onClose={close}
        size="medium"
        enableDrag={true}
        enableResize={true}
        ariaLabel="Simple Example Modal"
      >
        <StandardModalHeader
          title="Simple Modal"
          subtitle="This is a basic example modal"
          icon={DocumentTextIcon}
          iconColor="text-blue-500"
          onClose={close}
        />

        <StandardModalBody>
          <div className="space-y-4">
            <p className="text-gray-700 dark:text-gray-300">
              This is a simple modal built with the new standardized modal system.
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              It features:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
              <li>Glass morphism design</li>
              <li>Draggable and resizable (desktop)</li>
              <li>Responsive mobile layout</li>
              <li>System font stack</li>
              <li>Dark mode support</li>
              <li>Keyboard shortcuts (Escape to close)</li>
            </ul>
          </div>
        </StandardModalBody>

        <StandardModalFooter
          primaryAction={primaryAction}
          secondaryAction={secondaryAction}
          align="right"
        />
      </StandardModalContainer>
    </>
  );
};
