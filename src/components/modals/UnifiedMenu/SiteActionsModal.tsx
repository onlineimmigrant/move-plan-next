'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  DocumentPlusIcon,
  DocumentTextIcon,
  NewspaperIcon,
  GlobeAltIcon,
  Cog6ToothIcon,
  RectangleGroupIcon,
  MapIcon,
  Bars3Icon,
  RectangleStackIcon,
  CubeIcon,
  QuestionMarkCircleIcon,
  SparklesIcon,
  MegaphoneIcon,
  ChevronDownIcon,
  Square3Stack3DIcon,
  CurrencyDollarIcon,
  PhotoIcon,
  ListBulletIcon,
  Squares2X2Icon,
} from '@heroicons/react/24/outline';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useTemplateSectionEdit } from '@/components/modals/TemplateSectionModal/context';
import { useTemplateHeadingSectionEdit } from '@/components/modals/TemplateHeadingSectionModal/context';
import { usePageCreation } from '@/components/modals/PageCreationModal/context';
import { usePostEditModal } from '@/components/modals/PostEditModal/context';
import { useSiteMapModal } from '@/components/modals/SiteMapModal/context';
import { useGlobalSettingsModal } from '@/components/modals/GlobalSettingsModal/context';
import { useLayoutManager } from '@/components/modals/LayoutManagerModal/context';
import { useHeaderEdit } from '@/components/modals/HeaderEditModal/context';
import { useFooterEdit } from '@/components/modals/FooterEditModal/context';
import { useProductModal } from '@/components/modals/ProductModals/ProductCreditEditModal';
import { getOrganizationId } from '@/lib/supabase';
import { getBaseUrl } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import { MenuPosition } from './types';

interface SiteActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  position?: MenuPosition;
}

interface QuickAction {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  action: () => void;
  shortcut?: string;
}

export function SiteActionsModal({ isOpen, onClose, position = 'bottom-right' }: SiteActionsModalProps) {
  const themeColors = useThemeColors();
  const primary = themeColors.cssVars.primary;
  const pathname = usePathname();
  const [clickedItemId, setClickedItemId] = React.useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const modalRef = useRef<HTMLDivElement>(null);
  
  // Detect platform for keyboard shortcuts
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modifierKey = isMac ? '⌘' : 'Ctrl+';

  const { openModal: openSectionModal } = useTemplateSectionEdit();
  const { openModal: openHeadingSectionModal } = useTemplateHeadingSectionEdit();
  const { openModal: openPageModal } = usePageCreation();
  const { openCreateModal } = usePostEditModal();
  const { openModal: openSiteMapModal } = useSiteMapModal();
  const { openModal: openGlobalSettingsModal } = useGlobalSettingsModal();
  const { openModal: openLayoutManagerModal } = useLayoutManager();
  const { openModal: openHeaderEditModal } = useHeaderEdit();
  const { openModal: openFooterEditModal } = useFooterEdit();
  const { openModal: openProductModal } = useProductModal();

  const quickActions: QuickAction[] = [
    // Navigation Section - MOVED TO TOP (most common actions)
    {
      id: 'header',
      label: 'Header',
      icon: Bars3Icon,
      shortcut: `${modifierKey}1`,
      action: async () => {
        onClose();
        try {
          const baseUrl = getBaseUrl();
          const orgId = await getOrganizationId(baseUrl);
          if (orgId) {
            openHeaderEditModal(orgId);
          } else {
            alert('Unable to determine organization ID');
          }
        } catch (error) {
          console.error('Error getting organization ID:', error);
          alert('Error opening header editor');
        }
      },
    },
    {
      id: 'footer',
      label: 'Footer',
      icon: RectangleStackIcon,
      shortcut: `${modifierKey}2`,
      action: async () => {
        onClose();
        try {
          const baseUrl = getBaseUrl();
          const orgId = await getOrganizationId(baseUrl);
          if (orgId) {
            openFooterEditModal(orgId);
          } else {
            alert('Unable to determine organization ID');
          }
        } catch (error) {
          console.error('Error getting organization ID:', error);
          alert('Error opening footer editor');
        }
      },
    },
    // Content Section
    {
      id: 'heading',
      label: 'Heading',
      icon: DocumentTextIcon,
      shortcut: `${modifierKey}3`,
      action: () => {
        onClose();
        openHeadingSectionModal(undefined, pathname);
      },
    },
    {
      id: 'section',
      label: 'Section',
      icon: DocumentPlusIcon,
      shortcut: `${modifierKey}4`,
      action: () => {
        onClose();
        openSectionModal(null, pathname);
      },
    },
    // Pages Section
    {
      id: 'page',
      label: 'Page',
      icon: GlobeAltIcon,
      shortcut: `${modifierKey}5`,
      action: () => {
        onClose();
        openPageModal();
      },
    },
    {
      id: 'post',
      label: 'Post',
      icon: NewspaperIcon,
      shortcut: `${modifierKey}6`,
      action: () => {
        onClose();
        openCreateModal(pathname);
      },
    },
    // Products Section
    {
      id: 'product_page',
      label: 'Product',
      icon: CubeIcon,
      shortcut: `${modifierKey}7`,
      action: () => {
        onClose();
        openProductModal();
      },
    },
    // General Section
    {
      id: 'page_layout',
      label: 'Layout',
      icon: RectangleGroupIcon,
      shortcut: `${modifierKey}8`,
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
    // Fixed Bottom - Global Settings and Map (no shortcuts)
    {
      id: 'site_map',
      label: 'Map',
      icon: MapIcon,
      action: () => {
        onClose();
        openSiteMapModal();
      },
    },
    {
      id: 'global_settings',
      label: 'Global',
      icon: Cog6ToothIcon,
      action: () => {
        onClose();
        openGlobalSettingsModal();
      },
    },
  ];

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Close on Escape
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      // Command/Ctrl + Number keys 1-8 for shortcuts
      if ((e.metaKey || e.ctrlKey) && e.key >= '1' && e.key <= '8') {
        const action = quickActions.find(a => a.shortcut?.includes(e.key));
        if (action) {
          e.preventDefault();
          handleActionClick(action);
        }
        return;
      }

      // Arrow navigation
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % quickActions.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + quickActions.length) % quickActions.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleActionClick(quickActions[selectedIndex]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, quickActions, modifierKey]);

  // Focus modal when opened
  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus();
      setSelectedIndex(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleActionClick = (action: QuickAction) => {
    // Visual feedback - flash the clicked item
    setClickedItemId(action.id);
    setTimeout(() => setClickedItemId(null), 200);
    
    // Execute the action
    action.action();
  };

  // Position styles based on menu button location
  const positionStyles = position === 'top-left' 
    ? {
        top: '72px',    // Below navbar (navbar is 64px + 8px gap)
        left: '8px',    // Align with button on left
      }
    : position === 'top-right'
    ? {
        top: '72px',    // Below navbar
        right: '8px',   // Align with button on right
      }
    : {
        bottom: '80px',
        right: '16px',
      };

  const animationClass = position === 'bottom-right'
    ? 'animate-in fade-in slide-in-from-bottom-4 duration-200'
    : 'animate-in fade-in slide-in-from-top-4 duration-200';

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
        ref={modalRef}
        tabIndex={-1}
        className={`fixed z-[10000] bg-white/30 dark:bg-gray-900/30 backdrop-blur-3xl border border-white/10 dark:border-gray-700/10 shadow-2xl rounded-3xl overflow-hidden ${animationClass}
                   max-md:w-[90vw] max-md:max-h-[80vh] max-md:left-1/2 max-md:-translate-x-1/2 max-md:bottom-4`}
        style={{
          ...positionStyles,
          width: '280px',
        }}
        role="dialog"
        aria-label="Site quick actions"
      >
        {/* Regular Actions List (excluding last 2) */}
        <div className="flex flex-col gap-2 p-3 max-md:gap-1 max-md:p-2">
          {quickActions.slice(0, -2).map((action, index) => (
            <button
              key={action.id}
              onClick={() => handleActionClick(action)}
              className={`
                w-full flex items-center gap-4 px-5 py-4 max-md:px-4 max-md:py-3
                hover:bg-white/10 dark:hover:bg-gray-800/10
                active:bg-white/20 dark:active:bg-gray-800/20
                transition-all duration-200
                group
                relative
                rounded-xl
                ${selectedIndex === index ? 'bg-white/10 dark:bg-gray-800/10' : ''}
                ${clickedItemId === action.id ? 'scale-[0.98] bg-white/15 dark:bg-gray-800/15' : ''}
              `}
            >
              {/* Icon */}
              <div className="flex-shrink-0 transition-all duration-200 group-hover:scale-110">
                <action.icon 
                  className="w-6 h-6 text-gray-900 dark:text-white transition-colors duration-200"
                  style={{
                    color: 'inherit',
                  }}
                />
              </div>

              {/* Label */}
              <div
                className="flex-1 text-left text-[17px] font-medium text-gray-900 dark:text-white transition-colors duration-200"
                style={{
                  fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
                }}
              >
                {action.label}
              </div>

              {/* Keyboard Shortcut */}
              {action.shortcut && (
                <div
                  className="flex-shrink-0 text-[12px] font-light opacity-50"
                  style={{
                    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
                  }}
                >
                  {action.shortcut}
                </div>
              )}

              {/* Hover effect */}
              <style jsx>{`
                button:hover {
                  color: ${primary.base} !important;
                }
                button:hover * {
                  color: ${primary.base} !important;
                }
              `}</style>
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t border-white/10 dark:border-gray-700/10 mx-3" />

        {/* Bottom Row - Map and Global side by side */}
        <div className="flex gap-2 p-3 pt-2 max-md:p-2 max-md:pt-1">
          {quickActions.slice(-2).map((action, index) => {
            const actualIndex = quickActions.length - 2 + index;
            return (
              <button
                key={action.id}
                onClick={() => handleActionClick(action)}
                className={`
                  flex-1 flex flex-col items-center justify-center gap-1.5 px-3 py-4
                  hover:bg-white/10 dark:hover:bg-gray-800/10
                  active:bg-white/20 dark:active:bg-gray-800/20
                  transition-all duration-200
                  group
                  relative
                  ${index === 0 ? 'rounded-bl-3xl rounded-br-md' : 'rounded-br-3xl rounded-bl-md'}
                  ${selectedIndex === actualIndex ? 'bg-white/10 dark:bg-gray-800/10' : ''}
                  ${clickedItemId === action.id ? 'scale-[0.98] bg-white/15 dark:bg-gray-800/15' : ''}
                `}
              >
                {/* Icon */}
                <div className="flex-shrink-0 transition-all duration-200 group-hover:scale-110">
                  <action.icon 
                    className="w-6 h-6 text-gray-900 dark:text-white transition-colors duration-200"
                    style={{
                      color: 'inherit',
                    }}
                  />
                </div>

                {/* Label */}
                <div
                  className="text-[14px] font-semibold text-gray-900 dark:text-white text-center leading-tight tracking-wide transition-colors duration-200"
                  style={{
                    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
                  }}
                >
                  {action.label}
                </div>

                {/* Hover effect */}
                <style jsx>{`
                  button:hover {
                    color: ${primary.base} !important;
                  }
                  button:hover * {
                    color: ${primary.base} !important;
                  }
                `}</style>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
