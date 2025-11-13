/**
 * HeaderPreview Component
 * 
 * Exact mirror of Header.tsx for live preview
 * Matches real header height (64px), spacing, fonts, and mega menu styling
 */

'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { MenuItem, SubMenuItem } from '../types';
import { getColorValue } from '@/components/Shared/ColorPaletteDropdown';
import { cn } from '@/lib/utils';

// Dynamic import for ModernLanguageSwitcher (matching Footer pattern)
const ModernLanguageSwitcher = dynamic(() => import('@/components/ModernLanguageSwitcher'), {
  ssr: false,
  loading: () => <div className="text-sm">🌐</div>
});

interface HeaderPreviewProps {
  menuItems: MenuItem[];
  headerStyle: string;
  headerStyleFull: any;
  previewRefreshing?: boolean;
  previewMode?: 'desktop' | 'mobile';
  siteName?: string;
  logoImageUrl?: string | null;
  onMenuItemClick?: (itemId: string, event: React.MouseEvent) => void;
}

export const HeaderPreview: React.FC<HeaderPreviewProps> = ({
  menuItems,
  headerStyle,
  headerStyleFull,
  previewRefreshing = false,
  previewMode = 'desktop',
  siteName = 'Your Company',
  logoImageUrl = null,
  onMenuItemClick,
}) => {
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [previewHeaderRef, setPreviewHeaderRef] = useState<HTMLElement | null>(null);

  // Get styles from headerStyleFull (matching Header.tsx structure)
  const headerStyles = {
    type: headerStyleFull?.type || headerStyle || 'default',
    background: headerStyleFull?.background || 'white',
    color: headerStyleFull?.color || 'gray-700',
    colorHover: headerStyleFull?.color_hover || 'gray-900',
    is_gradient: headerStyleFull?.is_gradient || false,
    gradient: headerStyleFull?.gradient || undefined,
    logo: headerStyleFull?.logo || { url: '/', position: 'left', size: 'md' },
    menuWidth: headerStyleFull?.menu_width || '7xl'
  };

  // Get actual color values
  const backgroundColor = getColorValue(headerStyles.background);
  const textColor = getColorValue(headerStyles.color);
  const hoverColor = getColorValue(headerStyles.colorHover);
  const menuWidth = headerStyles.menuWidth;
  
  // Logo configuration (matching Header.tsx)
  const logoPosition = headerStyles.logo.position || 'left';
  const logoSize = headerStyles.logo.size || 'md';
  const logoHeightClass = logoSize === 'sm' ? 'h-8' : logoSize === 'lg' ? 'h-12' : 'h-10';
  
  // Filter visible menu items
  const visibleMenuItems = menuItems.filter(item => item.is_displayed !== false);
  
  // Background style (matching Header.tsx)
  const backgroundStyle = headerStyles.is_gradient && headerStyles.gradient
    ? {
        background: `linear-gradient(to right, ${getColorValue(headerStyles.gradient.from || headerStyles.background)}, ${getColorValue(headerStyles.gradient.to || headerStyles.background)})`,
      }
    : {
        backgroundColor: backgroundColor,
      };

  // Show message if no items
  if (visibleMenuItems.length === 0) {
    return (
      <nav
        className="w-full border-b border-gray-200 transition-all duration-300"
        style={backgroundStyle}
      >
        <div className="mx-auto max-w-7xl py-2 px-4 pl-8 sm:px-6 flex justify-between items-center h-[64px]">
          <div className="text-center w-full py-8">
            <p className="text-base font-medium mb-1" style={{ color: textColor }}>No menu items</p>
            <p className="text-sm opacity-75" style={{ color: textColor }}>
              Toggle items in Menu Items section
            </p>
          </div>
        </div>
      </nav>
    );
  }

  // Mobile Preview Mode
  if (previewMode === 'mobile') {
    return (
      <div className="max-w-[375px] mx-auto border-x border-gray-300 shadow-lg" style={{ minHeight: '667px' }}>
        <nav
          className="w-full border-b border-gray-200"
          style={backgroundStyle}
        >
          <div className="flex justify-between items-center h-[56px] px-4">
            {/* Logo */}
            <div className="flex items-center flex-shrink-0">
              {logoImageUrl ? (
                <img
                  src={logoImageUrl}
                  alt={siteName}
                  className="h-8 w-auto"
                />
              ) : (
                <span 
                  className="text-lg font-bold truncate max-w-[180px]"
                  style={{ color: textColor }}
                >
                  {siteName}
                </span>
              )}
            </div>

            {/* Hamburger Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 transition-colors"
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: textColor }}>
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          {/* Mobile Menu Dropdown */}
          {mobileMenuOpen && (
            <div className="border-t border-gray-200 bg-white animate-in slide-in-from-top duration-200">
              {visibleMenuItems.map((item) => {
                const hasSubmenu = item.submenu_items && item.submenu_items.length > 0;
                const visibleSubmenus = hasSubmenu 
                  ? item.submenu_items!.filter(sub => sub.is_displayed !== false)
                  : [];
                const isExpanded = hoveredItemId === item.id;

                return (
                  <div key={item.id} className="border-b border-gray-100">
                    <button
                      onClick={() => setHoveredItemId(isExpanded ? null : item.id)}
                      className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                      style={{ color: textColor }}
                    >
                      <span className="font-medium">{item.display_name}</span>
                      {hasSubmenu && (
                        <svg 
                          className={`w-5 h-5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      )}
                    </button>

                    {/* Submenu Items */}
                    {hasSubmenu && isExpanded && visibleSubmenus.length > 0 && (
                      <div className="bg-gray-50 border-t border-gray-100">
                        {visibleSubmenus.map((submenu) => (
                          <a
                            key={submenu.id}
                            href={`/${submenu.url_name}`}
                            className="block px-6 py-2.5 text-sm hover:bg-gray-100 transition-colors"
                            style={{ color: getColorValue(headerStyles.color) }}
                            onClick={(e) => e.preventDefault()}
                          >
                            <div className="flex items-center gap-3">
                              {submenu.image && (
                                <img src={submenu.image} alt={submenu.name} className="w-8 h-8 object-contain" />
                              )}
                              <div className="flex-1">
                                <div className="font-medium">{submenu.name}</div>
                                {submenu.description && (
                                  <div className="text-xs text-gray-500 line-clamp-1">{submenu.description}</div>
                                )}
                              </div>
                            </div>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </nav>
      </div>
    );
  }

  // Desktop Preview Mode
  return (
    <div className="relative w-full overflow-visible border-2 border-transparent hover:border-gray-200 rounded-lg transition-all duration-300" style={{ minHeight: '64px' }}>
      <nav
        ref={setPreviewHeaderRef}
        className="w-full border-b border-gray-200 z-50 transition-all duration-300"
        style={backgroundStyle}
      >
      <div 
        className={cn(
          `mx-auto max-w-${menuWidth} py-2 px-2 sm:px-6 lg:pl-8 flex justify-between items-center h-[64px]`,
          headerStyles.type === 'ring_card_mini' && 'border border-gray-200 rounded-full shadow-sm',
          headerStyles.type === 'mini' && ''
        )}
        style={(headerStyles.type === 'ring_card_mini' || headerStyles.type === 'mini') ? backgroundStyle : undefined}
      >
        {/* Logo Section */}
        <div 
          className={cn(
            'flex items-center flex-shrink-0',
            logoPosition === 'center' && 'flex-1',
            logoPosition === 'right' && 'order-2'
          )}
        >
          {logoImageUrl ? (
            <img
              src={logoImageUrl}
              alt={siteName}
              className={cn(logoHeightClass, 'w-auto max-w-[120px] sm:max-w-none')}
            />
          ) : (
            <span 
              className="tracking-tight text-base sm:text-xl font-extrabold truncate max-w-[120px] sm:max-w-none"
              style={{ color: textColor }}
            >
              {siteName}
            </span>
          )}
        </div>

        {/* Navigation Section */}
        <div 
          className={cn(
            'hidden md:flex items-center',
            logoPosition === 'center' ? 'flex-1 justify-center' : 'justify-center flex-1 ml-4 lg:ml-8 mr-4 lg:mr-8',
            logoPosition === 'right' && 'order-1 flex-1',
            'relative'
          )}
          style={{ position: 'relative' }}
        >
          {/* Menu Items */}
          <div className="flex items-center justify-center space-x-4 lg:space-x-8 text-sm">
            {visibleMenuItems.map((item) => {
              const hasSubmenu = item.submenu_items && item.submenu_items.length > 0;
              const visibleSubmenus = hasSubmenu 
                ? item.submenu_items!.filter(sub => sub.is_displayed !== false)
                : [];
              const isHovered = hoveredItemId === item.id;

              return (
                <div
                  key={item.id}
                  className="relative"
                  onMouseEnter={() => setHoveredItemId(item.id)}
                  onMouseLeave={() => setHoveredItemId(null)}
                >
                  {/* Menu Item Button */}
                  <button
                    type="button"
                    className={cn(
                      "group cursor-pointer flex items-center justify-center px-2 lg:px-4 py-2.5 rounded-xl focus:outline-none transition-all duration-200",
                      isHovered && "bg-gray-50 shadow-sm"
                    )}
                    style={{ color: getColorValue(headerStyles.color) }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = getColorValue(headerStyles.colorHover);
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = getColorValue(headerStyles.color);
                    }}
                  >
                    <span 
                      className="text-sm lg:text-[15px] font-medium transition-colors duration-200"
                      style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}
                    >
                      {item.display_name}
                    </span>
                    {hasSubmenu && (
                      <svg className="ml-1 lg:ml-1.5 h-3 lg:h-4 w-3 lg:w-4 text-gray-400 group-hover:text-gray-600 transition-all duration-300 group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </button>

                  {/* Mega Menu Dropdown (2+ items) - Fixed positioning for full width */}
                  {hasSubmenu && isHovered && visibleSubmenus.length >= 2 && (() => {
                    // Calculate dynamic position based on preview header
                    const megaMenuTop = previewHeaderRef?.getBoundingClientRect().bottom || 140;
                    
                    return (
                      <div
                        className="fixed inset-x-0 bg-white border-t border-gray-200 shadow-2xl z-[9999] animate-in slide-in-from-top duration-200"
                        style={{
                          top: `${megaMenuTop}px`,
                          maxHeight: `calc(100vh - ${megaMenuTop}px)`,
                          overflowY: 'auto',
                        }}
                        onMouseEnter={() => setHoveredItemId(item.id)}
                        onMouseLeave={() => setHoveredItemId(null)}
                      >
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
                        <h3 
                          className="text-sm sm:text-base font-semibold text-gray-900 mb-3 sm:mb-4" 
                          style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}
                        >
                          {item.display_name}
                        </h3>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                          {visibleSubmenus.map((submenu, index) => (
                            <a
                              key={submenu.id}
                              href={`/${submenu.url_name}`}
                              className="group/item block bg-white hover:bg-gray-50 rounded-lg transition-all duration-200 hover:shadow-md hover:scale-105 border border-transparent hover:border-gray-200"
                              style={{
                                animationDelay: `${index * 30}ms`,
                                animation: 'fadeIn 0.3s ease-in-out forwards'
                              }}
                              onClick={(e) => e.preventDefault()} // Prevent navigation in preview
                            >
                              {/* Image on top - full width */}
                              <div className="relative w-full h-24 sm:h-32">
                                {submenu.image ? (
                                  <img
                                    src={submenu.image}
                                    alt={submenu.name}
                                    className="w-full h-full object-contain rounded-t-lg p-2 transition-transform duration-200 group-hover/item:scale-110"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-t-lg">
                                    <svg className="w-6 sm:w-8 h-6 sm:h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                  </div>
                                )}
                              </div>
                              
                              {/* Content below image */}
                              <div className="p-2 sm:p-3">
                                <h4 
                                  className="text-xs sm:text-sm font-semibold text-gray-900 mb-1 group-hover/item:text-gray-700 transition-colors duration-200" 
                                  style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}
                                >
                                  {submenu.name}
                                </h4>
                                {submenu.description && (
                                  <p 
                                    className="text-xs text-gray-500 line-clamp-2" 
                                    style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}
                                  >
                                    {submenu.description}
                                  </p>
                                )}
                              </div>
                            </a>
                          ))}
                        </div>
                      </div>
                    </div>
                    );
                  })()}

                  {/* Simple Dropdown for < 2 items */}
                  {hasSubmenu && isHovered && visibleSubmenus.length === 1 && (
                    <div
                      className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-[60] transition-all duration-200 opacity-100 visible"
                      style={{
                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
                      }}
                      onMouseEnter={() => setHoveredItemId(item.id)}
                      onMouseLeave={() => setHoveredItemId(null)}
                    >
                      <div className="p-2">
                        {visibleSubmenus.map((submenu) => (
                          <a
                            key={submenu.id}
                            href={`/${submenu.url_name}`}
                            className="block px-4 py-3 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700 hover:text-gray-900"
                            onClick={(e) => e.preventDefault()}
                          >
                            {submenu.name}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Action Items - Right Side Group (matching Header.tsx) */}
          {logoPosition !== 'right' && (
            <div className="flex items-center space-x-2 lg:space-x-3">
              {/* Language Switcher - Using ModernLanguageSwitcher like Footer */}
              {headerStyles.type !== 'ring_card_mini' && headerStyles.type !== 'mini' && (
                <div className="hidden lg:block">
                  <ModernLanguageSwitcher />
                </div>
              )}
              
              {/* Profile/Login Icon */}
              {headerStyles.type !== 'ring_card_mini' && headerStyles.type !== 'mini' && (
                <button
                  type="button"
                  className="p-2 lg:p-3"
                  aria-label="Profile"
                >
                  <svg className="h-5 w-5 lg:h-6 lg:w-6 text-gray-600 hover:text-gray-800 transition-colors duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
    </div>
  );
};
