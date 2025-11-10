'use client';

import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import {
  DocumentPlusIcon,
  DocumentTextIcon,
  NewspaperIcon,
  GlobeAltIcon,
  Cog6ToothIcon,
  RectangleGroupIcon,
  MapIcon,
} from '@heroicons/react/24/outline';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useTemplateSectionEdit } from '@/components/modals/TemplateSectionModal/context';
import { useTemplateHeadingSectionEdit } from '@/components/modals/TemplateHeadingSectionModal/context';
import { usePageCreation } from '@/components/modals/PageCreationModal/context';
import { usePostEditModal } from '@/components/modals/PostEditModal/context';
import { useSiteMapModal } from '@/components/modals/SiteMapModal/context';
import { useGlobalSettingsModal } from '@/components/modals/GlobalSettingsModal/context';
import { useLayoutManager } from '@/components/modals/LayoutManagerModal/context';
import { getOrganizationId } from '@/lib/supabase';
import { getBaseUrl } from '@/lib/utils';
import { usePathname } from 'next/navigation';

interface SiteActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  action: () => void;
}

export function SiteActionsModal({ isOpen, onClose }: SiteActionsModalProps) {
  const themeColors = useThemeColors();
  const primary = themeColors.cssVars.primary;
  const pathname = usePathname();

  const { openModal: openSectionModal } = useTemplateSectionEdit();
  const { openModal: openHeadingSectionModal } = useTemplateHeadingSectionEdit();
  const { openModal: openPageModal } = usePageCreation();
  const { openCreateModal } = usePostEditModal();
  const { openModal: openSiteMapModal } = useSiteMapModal();
  const { openModal: openGlobalSettingsModal } = useGlobalSettingsModal();
  const { openModal: openLayoutManagerModal } = useLayoutManager();

  const quickActions: QuickAction[] = [
    {
      id: 'section',
      label: 'New Section',
      description: 'Add content section',
      icon: DocumentPlusIcon,
      action: () => {
        onClose();
        openSectionModal(null, pathname);
      },
    },
    {
      id: 'heading',
      label: 'New Heading',
      description: 'Add heading section',
      icon: DocumentTextIcon,
      action: () => {
        onClose();
        openHeadingSectionModal(undefined, pathname);
      },
    },
    {
      id: 'page',
      label: 'New Page',
      description: 'Create new page',
      icon: GlobeAltIcon,
      action: () => {
        onClose();
        openPageModal();
      },
    },
    {
      id: 'post',
      label: 'New Blog Post',
      description: 'Create blog post',
      icon: NewspaperIcon,
      action: () => {
        onClose();
        openCreateModal(pathname);
      },
    },
    {
      id: 'site_map',
      label: 'Site Map',
      description: 'View site structure',
      icon: MapIcon,
      action: () => {
        onClose();
        openSiteMapModal();
      },
    },
    {
      id: 'global_settings',
      label: 'Global Settings',
      description: 'Configure site settings',
      icon: Cog6ToothIcon,
      action: () => {
        onClose();
        openGlobalSettingsModal();
      },
    },
    {
      id: 'page_layout',
      label: 'Page Layout',
      description: 'Manage section order',
      icon: RectangleGroupIcon,
      action: async () => {
        onClose();
        try {
          const baseUrl = getBaseUrl();
          const orgId = await getOrganizationId(baseUrl);
          if (orgId) {
            openLayoutManagerModal(orgId);
          } else {
            alert('Unable to determine organization ID');
          }
        } catch (error) {
          console.error('Error getting organization ID:', error);
          alert('Error opening page layout manager');
        }
      },
    },
  ];

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[9999] animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="fixed z-[10000] bg-white/30 dark:bg-gray-900/30 backdrop-blur-3xl border border-white/10 dark:border-gray-700/10 shadow-2xl rounded-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200"
        style={{
          bottom: '80px',
          right: '16px',
          width: '280px',
          maxHeight: '70vh',
        }}
        role="dialog"
        aria-label="Site quick actions"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 dark:border-gray-700/10">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Site Actions
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Close"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Actions Grid */}
        <div className="p-3 overflow-y-auto max-h-[calc(70vh-60px)]">
          {quickActions.map((action) => (
            <button
              key={action.id}
              onClick={action.action}
              className="w-full flex items-start gap-3 p-3 mb-2 rounded-lg bg-white/20 dark:bg-gray-800/20 backdrop-blur-xl hover:bg-white/30 dark:hover:bg-gray-800/30 active:bg-white/40 dark:active:bg-gray-800/40 transition-all duration-200 group"
            >
              {/* Icon */}
              <div
                className="flex-shrink-0 transition-transform duration-200 group-hover:scale-110"
                style={{ color: primary.base }}
              >
                <action.icon className="w-6 h-6" />
              </div>

              {/* Content */}
              <div className="flex-1 text-left">
                <div
                  className="text-sm font-medium text-gray-900 dark:text-white mb-0.5"
                  style={{ color: primary.base }}
                >
                  {action.label}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {action.description}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
