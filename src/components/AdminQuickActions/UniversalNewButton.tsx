'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';
import { PlusIcon } from '@heroicons/react/24/outline';
import { isAdminClient } from '@/lib/auth';
import { useTemplateSectionEdit } from '@/components/modals/TemplateSectionModal/context';
import { useTemplateHeadingSectionEdit } from '@/components/modals/TemplateHeadingSectionModal/context';
import { usePageCreation } from '@/components/modals/PageCreationModal/context';
import { usePostEditModal } from '@/components/modals/PostEditModal/context';
import { useSiteMapModal } from '@/components/modals/SiteMapModal/context';
import { useGlobalSettingsModal } from '@/components/modals/GlobalSettingsModal/context';
import { useLayoutManager } from '@/components/modals/LayoutManagerModal/context';
import { useHeaderEdit } from '@/components/modals/HeaderEditModal/context';
import { useFooterEdit } from '@/components/modals/FooterEditModal/context';
import { getOrganizationId } from '@/lib/supabase';
import { getBaseUrl } from '@/lib/utils';

interface MenuItem {
  label: string;
  action: string;
  description?: string;
}

interface MenuCategory {
  label: string;
  items: MenuItem[];
}

interface UniversalNewButtonProps {
  inNavbar?: boolean; // When true, uses relative positioning for navbar integration
}

const UniversalNewButton: React.FC<UniversalNewButtonProps> = ({ inNavbar = false }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  
  const { openModal: openSectionModal } = useTemplateSectionEdit();
  const { openModal: openHeadingSectionModal } = useTemplateHeadingSectionEdit();
  const { openModal: openPageModal } = usePageCreation();
  const { openCreateModal } = usePostEditModal();
  const { openModal: openSiteMapModal } = useSiteMapModal();
  const { openModal: openGlobalSettingsModal } = useGlobalSettingsModal();
  const { openModal: openLayoutManagerModal } = useLayoutManager();
  const { openModal: openHeaderEditModal } = useHeaderEdit();
  const { openModal: openFooterEditModal } = useFooterEdit();

  // Check if mounted (for portal)
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Check admin status
  useEffect(() => {
    const checkAdmin = async () => {
      const adminStatus = await isAdminClient();
      setIsAdmin(adminStatus);
    };
    checkAdmin();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Don't render if not admin
  if (!isAdmin) return null;

  // Define menu structure with categories
  const menuCategories: MenuCategory[] = [
    {
      label: 'Content',
      items: [
                {
          label: 'Heading Section',
          action: 'heading',
          description: 'Add a heading with CTA',
        },
        {
          label: 'Section',
          action: 'section',
          description: 'Add a new content section',
        },

        {
          label: 'Hero Section',
          action: 'hero',
          description: 'Edit hero section settings',
        },
      ],
    },
    {
      label: 'Navigation',
      items: [
        {
          label: 'Header',
          action: 'header',
          description: 'Edit header style and menu',
        },
        {
          label: 'Footer',
          action: 'footer',
          description: 'Edit footer style and menu',
        },
        {
          label: 'Menu Item',
          action: 'menu',
          description: 'Add menu items',
        },
        {
          label: 'Submenu',
          action: 'submenu',
          description: 'Manage submenus',
        },
      ],
    },
    {
      label: 'Pages',
      items: [
        {
          label: 'Empty Page',
          action: 'page',
          description: 'Create template-based page',
        },
                {
          label: 'Blog Post',
          action: 'post',
          description: 'Write a new blog post',
        },
      ],
    },
        {
      label: 'Products',
      items: [
        {
          label: 'Product Page',
          action: 'product_page',
          description: 'Manage products',
        },
                {
          label: 'Pricing Plan',
          action: 'pricing_plan',
          description: 'Coming soon',
        },
      ],
    },
    {
      label: 'Interactive',
      items: [
        {
          label: 'FAQ',
          action: 'faq',
          description: 'Manage FAQ items',
        },
        {
          label: 'Feature',
          action: 'feature',
          description: 'Edit features section',
        },
                {
          label: 'Banner',
          action: 'banner',
          description: 'Manage banners',
        },

      ],
    },
    {
      label: 'General',
      items: [
        {
          label: 'Global Settings',
          action: 'global_settings',
          description: 'Configure site settings',
        },
        {
          label: 'Page Layout',
          action: 'page_layout',
          description: 'Manage page section order',
        },
        {
          label: 'Site Map',
          action: 'site_map',
          description: 'View site structure',
        },

      ],
    },
  ];

  // Handle action
  const handleAction = async (action: string) => {
    setIsOpen(false);
    
    switch (action) {
      case 'section':
        // Get current page from pathname
        openSectionModal(null, pathname);
        break;
      case 'heading':
        openHeadingSectionModal(undefined, pathname);
        break;
      case 'page':
        openPageModal();
        break;
      case 'post':
        // Open blog post creation modal
        openCreateModal(pathname);
        break;
      case 'site_map':
        // Open site map modal
        openSiteMapModal();
        break;
      case 'global_settings':
        // Open global settings modal
        openGlobalSettingsModal();
        break;
      case 'page_layout':
        // Open page layout manager modal
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
        break;
      case 'header':
        // Open header edit modal
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
          alert('Error opening header edit modal');
        }
        break;
      case 'footer':
        // Open footer edit modal
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
          alert('Error opening footer edit modal');
        }
        break;
      case 'hero':
        // Open global settings modal with hero section expanded
        openGlobalSettingsModal('hero');
        break;
      case 'faq':
        // Open global settings modal with FAQs section expanded
        openGlobalSettingsModal('faqs');
        break;
      case 'feature':
        // Open global settings modal with features section expanded
        openGlobalSettingsModal('features');
        break;
      case 'banner':
        // Open global settings modal with banners section expanded
        openGlobalSettingsModal('banners');
        break;
      case 'menu':
        // Open global settings modal with menu items section expanded
        openGlobalSettingsModal('menu');
        break;
      case 'submenu':
        // Open global settings modal with menu items section expanded (submenu is part of menu)
        openGlobalSettingsModal('menu');
        break;
      case 'product_page':
        // Open global settings modal with products section expanded
        openGlobalSettingsModal('products');
        break;
      case 'pricing_plan':
        // Placeholder for future implementations
        alert(`Creating ${action} - Coming soon!`);
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

  return (
    <div 
      ref={dropdownRef}
      className={inNavbar 
        ? "relative z-[51]" 
        : "fixed bottom-32 right-4 z-[55]"
      }
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Main Button - Neomorphic style matching "+ New" buttons */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative overflow-hidden font-medium text-gray-700 bg-gradient-to-br from-sky-50 via-white to-sky-50 
                   rounded-full shadow-[4px_4px_8px_rgba(125,211,252,0.3),-4px_-4px_8px_rgba(255,255,255,0.9)] 
                   hover:shadow-[2px_2px_4px_rgba(125,211,252,0.25),-2px_-2px_4px_rgba(255,255,255,0.95),inset_1px_1px_2px_rgba(125,211,252,0.12),inset_-1px_-1px_2px_rgba(255,255,255,0.9)] 
                   hover:text-sky-700 hover:-translate-y-0.5 
                   active:shadow-[inset_2px_2px_4px_rgba(125,211,252,0.3),inset_-2px_-2px_4px_rgba(255,255,255,0.8)] 
                   active:translate-y-0 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
                   focus:outline-none focus:ring-2 focus:ring-sky-300 focus:ring-offset-2 group ${
                     inNavbar ? 'p-2.5' : 'p-4'
                   }`}
        aria-label="Create new content"
      >
        <PlusIcon className={`transition-transform duration-200 ${isOpen ? 'rotate-45' : ''} ${
          inNavbar ? 'w-5 h-5' : 'w-6 h-6'
        }`} />
        
        {/* Glow overlay effect */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-sky-200/20 via-transparent to-transparent 
                       opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-out pointer-events-none" />
        
        {/* Tooltip - show on hover if dropdown not open */}
        {isHovered && !isOpen && (
          <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 
                         bg-sky-600 text-white text-sm px-3 py-2 rounded-lg 
                         whitespace-nowrap pointer-events-none shadow-lg">
            Create New
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 
                           w-2 h-2 bg-sky-600 rotate-45" />
          </div>
        )}
      </button>

      {/* Dropdown Menu - Sky theme, full page on mobile */}
      {/* Use portal on mobile to escape navbar container */}
      {isOpen && (() => {
        const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
        const shouldUsePortal = inNavbar && isMobile && isMounted;
        
        const dropdownContent = (
          <div 
            className={inNavbar
              ? "fixed inset-0 md:inset-auto md:absolute md:top-full md:left-0 md:mt-2 md:w-80 md:max-h-[calc(100vh-200px)] bg-gradient-to-br from-sky-50 via-white to-sky-50 border border-sky-200/60 md:rounded-2xl md:shadow-[8px_8px_16px_rgba(125,211,252,0.3),-8px_-8px_16px_rgba(255,255,255,0.9)] overflow-y-auto z-[9999] animate-in md:slide-in-from-top-4 fade-in duration-200"
              : "fixed md:absolute inset-0 md:inset-auto md:bottom-full md:right-0 md:mb-3 md:w-80 md:max-h-[calc(100vh-200px)] bg-gradient-to-br from-sky-50 via-white to-sky-50 border border-sky-200/60 md:rounded-2xl md:shadow-[8px_8px_16px_rgba(125,211,252,0.3),-8px_-8px_16px_rgba(255,255,255,0.9)] overflow-y-auto z-[56] animate-in md:slide-in-from-bottom-4 fade-in duration-200"
            }
          >
          {/* Header - Enhanced with sky theme */}
          <div className="sticky top-0 bg-gradient-to-br from-sky-50 via-white to-sky-50 
                         px-4 md:px-6 py-5 md:py-4 z-10 border-b border-sky-200/50
                         shadow-[inset_0_-1px_0_rgba(125,211,252,0.15),0_2px_8px_rgba(125,211,252,0.08)]">
            <div className="flex items-center justify-between">
              <div className="relative">
                {/* Decorative accent line - sky gradient */}
                <div className="absolute -left-2 top-0 bottom-0 w-1 bg-gradient-to-b from-sky-400 via-sky-500 to-sky-600 
                               rounded-full opacity-90 shadow-[0_0_8px_rgba(56,189,248,0.4)]" />
                
                <div className="pl-2">
                  {/* Main title with sky gradient text */}
                  <h3 className="font-bold text-xl md:text-lg bg-gradient-to-r from-sky-700 via-sky-600 to-sky-700 
                                bg-clip-text text-transparent mb-1 tracking-tight
                                relative inline-block">
                    Create New
                    {/* Subtle underline glow - sky color */}
                    <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-sky-400/40 to-transparent 
                                   rounded-full blur-sm" />
                  </h3>
                  
                  {/* Subtitle with icon */}
                  <div className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <p className="text-gray-600 text-sm md:text-xs font-medium">
                      Choose what to add to your site
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Close button on mobile with sky theme */}
              <button
                onClick={() => setIsOpen(false)}
                className="md:hidden p-2 rounded-full bg-gradient-to-br from-sky-100 to-sky-50
                         hover:from-sky-200 hover:to-sky-100 transition-all duration-200
                         shadow-[2px_2px_4px_rgba(125,211,252,0.25),-2px_-2px_4px_rgba(255,255,255,0.9)]
                         hover:shadow-[inset_2px_2px_4px_rgba(125,211,252,0.25)]
                         active:scale-95"
                aria-label="Close menu"
              >
                <PlusIcon className="w-6 h-6 rotate-45 text-sky-600" />
              </button>
            </div>
          </div>

          {/* Menu Categories */}
          <div className="py-2 md:py-2 px-2 md:px-0">
            {menuCategories.map((category, categoryIndex) => (
              <div key={category.label}>
                {/* Category Label */}
                <div className="px-4 py-3 md:py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {category.label}
                </div>

                {/* Category Items */}
                {category.items.map((item) => {
                  const isComingSoon = item.description === 'Coming soon';
                  
                  return (
                    <button
                      key={item.action}
                      onClick={() => !isComingSoon && handleAction(item.action)}
                      disabled={isComingSoon}
                      className={`w-full text-left px-4 py-4 md:py-3 transition-all duration-200
                                ${isComingSoon 
                                  ? 'opacity-40 cursor-not-allowed' 
                                  : 'hover:bg-gradient-to-r hover:from-sky-100/50 hover:to-transparent cursor-pointer active:bg-sky-100/60'
                                }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className={`font-medium text-base md:text-sm flex items-center gap-2
                                        ${isComingSoon ? 'text-gray-400' : 'text-gray-800'}`}>
                            {item.label}
                            {isComingSoon && (
                              <span className="text-xs text-gray-400 font-normal">
                                (Soon)
                              </span>
                            )}
                          </div>
                          {item.description && !isComingSoon && (
                            <div className="text-sm md:text-xs text-gray-500 mt-1">
                              {item.description}
                            </div>
                          )}
                        </div>
                        {!isComingSoon && (
                          <div className="text-gray-400">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}

                {/* Divider between categories (except last) */}
                {categoryIndex < menuCategories.length - 1 && (
                  <div className="my-2 mx-4 border-t border-sky-200/50 
                                 shadow-[0_1px_0_rgba(255,255,255,0.9)]" />
                )}
              </div>
            ))}
          </div>

          {/* Footer Hint - Desktop only with sky theme */}
          <div className="hidden md:block sticky bottom-0 bg-gradient-to-br from-sky-50 via-white to-sky-50 
                         px-4 py-2 border-t border-sky-200/50 shadow-[inset_0_1px_0_rgba(125,211,252,0.15)]">
            <p className="text-xs text-gray-500 text-center">
              Click outside to close
            </p>
          </div>
        </div>
        );

        // Use portal on mobile to escape navbar stacking context, regular render otherwise
        return shouldUsePortal && typeof document !== 'undefined' 
          ? createPortal(dropdownContent, document.body)
          : dropdownContent;
      })()}
    </div>
  );
};

export default UniversalNewButton;
