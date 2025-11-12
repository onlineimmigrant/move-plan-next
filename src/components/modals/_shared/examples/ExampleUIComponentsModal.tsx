/**
 * Example: UI Components Showcase
 * 
 * Demonstrates all UI components (badges, buttons, states)
 */

'use client';

import React from 'react';
import {
  DocumentTextIcon,
  BellIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import {
  StandardModalContainer,
  StandardModalHeader,
  StandardModalBody,
  StandardModalFooter,
  useModalState,
  CountBadge,
  StatusBadge,
  ModalButton,
  IconButton,
  LoadingState,
  ErrorState,
  EmptyState,
} from '@/components/modals/_shared';

/**
 * UI Components Showcase Modal
 */
export const ExampleUIComponentsModal: React.FC = () => {
  const { isOpen, open, close } = useModalState();

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={open}
        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
      >
        Open UI Components Showcase
      </button>

      {/* Modal */}
      <StandardModalContainer
        isOpen={isOpen}
        onClose={close}
        size="large"
        ariaLabel="UI Components Showcase"
      >
        <StandardModalHeader
          title="UI Components Showcase"
          subtitle="All Phase 2 components in action"
          icon={DocumentTextIcon}
          iconColor="text-purple-500"
          onClose={close}
        />

        <StandardModalBody>
          <div className="space-y-8">
            {/* Badges Section */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Badges
              </h3>
              
              <div className="space-y-4">
                {/* Count Badges */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Count Badges
                  </h4>
                  <div className="flex items-center gap-3 flex-wrap">
                    <CountBadge count={5} variant="danger" size="sm" />
                    <CountBadge count={12} variant="primary" size="md" />
                    <CountBadge count={99} variant="success" size="lg" />
                    <CountBadge count={150} variant="warning" max={99} />
                    <CountBadge count={3} variant="danger" animate={true} />
                    <CountBadge count={0} dot={true} variant="danger" />
                  </div>
                </div>

                {/* Status Badges */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Status Badges
                  </h4>
                  <div className="flex items-center gap-3 flex-wrap">
                    <StatusBadge text="Active" variant="success" dot={true} />
                    <StatusBadge text="Pending" variant="warning" dot={true} />
                    <StatusBadge text="Error" variant="danger" dot={true} />
                    <StatusBadge text="Info" variant="info" icon={BellIcon} />
                    <StatusBadge text="Completed" variant="success" icon={CheckCircleIcon} size="lg" />
                  </div>
                </div>
              </div>
            </section>

            {/* Buttons Section */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Buttons
              </h3>
              
              <div className="space-y-4">
                {/* Modal Buttons */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Modal Buttons
                  </h4>
                  <div className="flex items-center gap-3 flex-wrap">
                    <ModalButton variant="primary">Primary</ModalButton>
                    <ModalButton variant="secondary">Secondary</ModalButton>
                    <ModalButton variant="danger">Danger</ModalButton>
                    <ModalButton variant="success">Success</ModalButton>
                    <ModalButton variant="ghost">Ghost</ModalButton>
                    <ModalButton variant="link">Link</ModalButton>
                  </div>
                </div>

                {/* With Icons */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    With Icons
                  </h4>
                  <div className="flex items-center gap-3 flex-wrap">
                    <ModalButton variant="primary" icon={CheckCircleIcon}>
                      Save
                    </ModalButton>
                    <ModalButton variant="danger" icon={ExclamationTriangleIcon}>
                      Delete
                    </ModalButton>
                    <ModalButton variant="secondary" loading={true}>
                      Loading
                    </ModalButton>
                  </div>
                </div>

                {/* Icon Buttons */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Icon Buttons
                  </h4>
                  <div className="flex items-center gap-3">
                    <IconButton icon={BellIcon} ariaLabel="Notifications" size="sm" />
                    <IconButton icon={DocumentTextIcon} ariaLabel="Documents" size="md" />
                    <IconButton icon={CheckCircleIcon} ariaLabel="Confirm" size="lg" variant="primary" />
                    <IconButton icon={ExclamationTriangleIcon} ariaLabel="Delete" variant="danger" />
                  </div>
                </div>
              </div>
            </section>

            {/* States Section */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                States
              </h3>
              
              <div className="space-y-6">
                {/* Loading State */}
                <div className="p-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                    Loading State
                  </h4>
                  <LoadingState message="Loading data..." />
                </div>

                {/* Error State */}
                <div className="p-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                    Error State
                  </h4>
                  <ErrorState
                    title="Failed to Load"
                    message="Unable to fetch data. Please try again."
                    onRetry={() => console.log('Retry clicked')}
                  />
                </div>

                {/* Empty State */}
                <div className="p-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                    Empty State
                  </h4>
                  <EmptyState
                    title="No Items Found"
                    message="Get started by creating your first item."
                    actionText="Create Item"
                    onAction={() => console.log('Create clicked')}
                  />
                </div>
              </div>
            </section>
          </div>
        </StandardModalBody>

        <StandardModalFooter
          primaryAction={{
            label: 'Close',
            onClick: close,
            variant: 'primary',
          }}
          align="right"
        />
      </StandardModalContainer>
    </>
  );
};
