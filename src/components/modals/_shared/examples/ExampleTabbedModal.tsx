/**
 * Example: Tabbed Modal using Standardized System
 * 
 * This example shows how to use tabs with badges in the new standardized modal.
 */

'use client';

import React, { useState } from 'react';
import { Cog6ToothIcon, BellIcon, UserIcon } from '@heroicons/react/24/outline';
import {
  StandardModalContainer,
  StandardModalHeader,
  StandardModalBody,
  StandardModalFooter,
  useModalState,
  type ModalTab,
  type ModalBadge,
  type ModalAction,
} from '@/components/modals/_shared';

/**
 * Tabbed Example Modal
 * 
 * Demonstrates:
 * - Tab navigation
 * - Badges on tabs
 * - Tab-specific content
 */
export const ExampleTabbedModal: React.FC = () => {
  const { isOpen, open, close } = useModalState();
  const [currentTab, setCurrentTab] = useState('settings');

  const tabs: ModalTab[] = [
    {
      id: 'settings',
      label: 'Settings',
      icon: Cog6ToothIcon,
      badge: undefined,
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: BellIcon,
      badge: 5,
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: UserIcon,
      badge: undefined,
    },
  ];

  const badges: ModalBadge[] = [
    {
      id: 'notifications',
      count: 5,
      color: 'bg-red-500',
      animate: true,
    },
  ];

  const renderTabContent = () => {
    switch (currentTab) {
      case 'settings':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Settings
            </h3>
            <p className="text-gray-700 dark:text-gray-300">
              Configure your application settings here.
            </p>
          </div>
        );
      case 'notifications':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Notifications (5)
            </h3>
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg"
                >
                  Notification {i}
                </div>
              ))}
            </div>
          </div>
        );
      case 'profile':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Profile
            </h3>
            <p className="text-gray-700 dark:text-gray-300">
              Manage your profile information.
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  const primaryAction: ModalAction = {
    label: 'Save Changes',
    onClick: close,
    variant: 'primary',
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={open}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        Open Tabbed Modal
      </button>

      {/* Modal */}
      <StandardModalContainer
        isOpen={isOpen}
        onClose={close}
        size="large"
        enableDrag={true}
        enableResize={true}
        ariaLabel="Tabbed Example Modal"
      >
        <StandardModalHeader
          title="Modal with Tabs"
          subtitle="Navigate between different sections"
          icon={Cog6ToothIcon}
          iconColor="text-purple-500"
          tabs={tabs}
          currentTab={currentTab}
          onTabChange={setCurrentTab}
          badges={badges}
          onClose={close}
        />

        <StandardModalBody>
          {renderTabContent()}
        </StandardModalBody>

        <StandardModalFooter
          primaryAction={primaryAction}
          align="right"
        />
      </StandardModalContainer>
    </>
  );
};
