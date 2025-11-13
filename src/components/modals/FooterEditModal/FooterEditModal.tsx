/**
 * FooterEditModal - Refactored footer editing modal
 * Modern design with glassmorphism, mega menus, and live preview
 */

'use client';

import React, { useEffect, useState } from 'react';
import { 
  Cog6ToothIcon, 
  PaintBrushIcon, 
  Bars3Icon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import { useFooterEdit } from './context';
import { StandardModalContainer } from '../_shared/containers/StandardModalContainer';
import { StandardModalHeader } from '../_shared/layout/StandardModalHeader';
import { StandardModalBody } from '../_shared/layout/StandardModalBody';
import { StandardModalFooter } from '../_shared/layout/StandardModalFooter';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useSettings } from '@/context/SettingsContext';
import Button from '@/ui/Button';
import { MenuItem } from './types';
import { MenuSection, StyleSection } from './sections';
import { useMenuOperations, useDragDropHandlers } from './hooks';
import { FooterPreview } from './preview';

function FooterEditModal() {
  console.log('🎉 NEW FooterEditModal loaded! (Mega menu design)');
  
  const {
    isOpen,
    isLoading,
    isSaving,
    organizationId,
    footerStyle,
    footerStyleFull,
    menuItems,
    closeModal,
    fetchFooterData,
    saveFooterStyle,
    updateFooterStyleFull,
    updateMenuItems
  } = useFooterEdit();

  // Theme colors
  const themeColors = useThemeColors();
  const primary = themeColors.cssVars.primary;

  // Settings for company name
  const { settings } = useSettings();

  // UI state
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  const [previewRefreshing, setPreviewRefreshing] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  
  const [saveError, setSaveError] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState(footerStyleFull?.type || footerStyle || 'default');
  const [localMenuItems, setLocalMenuItems] = useState<MenuItem[]>([]);

  // Load data when modal opens
  useEffect(() => {
    if (isOpen && organizationId) {
      fetchFooterData(organizationId);
    }
  }, [isOpen, organizationId, fetchFooterData]);

  // Sync local state with context - prioritize footerStyleFull.type
  useEffect(() => {
    const actualStyle = footerStyleFull?.type || footerStyle || 'default';
    setSelectedStyle(actualStyle);
  }, [footerStyle, footerStyleFull]);

  useEffect(() => {
    setLocalMenuItems(menuItems);
    console.log('=== FooterEditModal Debug ===');
    console.log('menuItems prop received:', menuItems.length);
    console.log('menuItems data:', menuItems);
    console.log('Sample item:', menuItems[0]);
    console.log('============================');
  }, [menuItems]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + S to save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      // Esc to close mega menu
      if (e.key === 'Escape' && openMenu) {
        e.stopPropagation();
        setOpenMenu(null);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, openMenu]);

  // Trigger preview refresh animation when data changes
  useEffect(() => {
    if (isOpen) {
      setPreviewRefreshing(true);
      const timer = setTimeout(() => setPreviewRefreshing(false), 300);
      return () => clearTimeout(timer);
    }
  }, [localMenuItems, selectedStyle, isOpen]);

  // Drag-and-drop handlers
  const { sensors, handleDragEnd } = useDragDropHandlers({
    menuItems: localMenuItems,
    setMenuItems: setLocalMenuItems
  });

  // Menu operations
  const {
    handleToggleVisibility,
    handleEdit,
    handleSubmenuEdit,
    handleSubmenuToggle,
    handleDelete,
    handleDeleteSubmenuItem,
    confirmDelete,
    handleAddMenuItem,
    handleAddSubmenuItem,
    handleSubmenuReorder,
    deleteConfirm,
    setDeleteConfirm
  } = useMenuOperations({
    menuItems: localMenuItems,
    setMenuItems: setLocalMenuItems,
    organizationId: organizationId || '',
    onRefetch: async () => {
      if (organizationId) {
        await fetchFooterData(organizationId);
      }
    }
  });

  // Reset delete confirmation text when modal closes
  useEffect(() => {
    if (!deleteConfirm.isOpen) {
      setDeleteConfirmText('');
    }
  }, [deleteConfirm.isOpen]);

  const handleSave = async () => {
    if (!organizationId) return;

    setSaveError(null);
    try {
      // Save style if changed
      if (selectedStyle !== footerStyle) {
        await saveFooterStyle(organizationId, selectedStyle);
      }

      // Save menu items order
      await updateMenuItems(localMenuItems);

      closeModal();
    } catch (error) {
      console.error('Failed to save footer settings:', error);
      setSaveError('Failed to save footer settings. Please try again.');
    }
  };

  const handleCancel = () => {
    // Reset local state
    setSelectedStyle(footerStyle);
    setLocalMenuItems(menuItems);
    setSaveError(null);
    closeModal();
  };

  if (!isOpen) return null;

  return (
    <>
      <StandardModalContainer 
        isOpen={isOpen} 
        onClose={handleCancel}
        className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-2xl"
      >
        <StandardModalHeader
          title="Edit Footer"
          icon={Cog6ToothIcon}
          onClose={handleCancel}
          className="bg-white/30 dark:bg-gray-800/30 rounded-t-2xl"
        />

        {/* Menu Button Panel */}
        <div className="px-6 py-3 flex items-center border-b border-white/10 dark:border-gray-700/20 bg-white/30 dark:bg-gray-800/30 relative z-30">
          <div className="flex gap-2">
            {[
              { id: 'style', label: 'Style', icon: PaintBrushIcon },
              { id: 'menu', label: 'Menu Items', icon: Bars3Icon },
            ].map((menu) => (
              <div key={menu.id} className="relative">
                <button
                  onClick={() => setOpenMenu(openMenu === menu.id ? null : menu.id)}
                  onMouseEnter={() => setHoveredButton(menu.id)}
                  onMouseLeave={() => setHoveredButton(null)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all duration-300 shadow-sm"
                  style={
                    openMenu === menu.id
                      ? {
                          background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`,
                          color: 'white',
                          boxShadow: `0 4px 12px ${primary.base}40`,
                        }
                      : {
                          backgroundColor: 'transparent',
                          color: hoveredButton === menu.id ? primary.hover : primary.base,
                          borderWidth: '1px',
                          borderStyle: 'solid',
                          borderColor: hoveredButton === menu.id ? `${primary.base}80` : `${primary.base}40`,
                        }
                  }
                >
                  <menu.icon className="w-4 h-4" />
                  <span>{menu.label}</span>
                  <ChevronDownIcon className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <StandardModalBody className="p-0 bg-white/20 dark:bg-gray-900/20" noPadding>
          {isLoading ? (
            <div className="p-8 space-y-6 animate-pulse">
              {/* Privacy Settings Skeleton */}
              <div className="flex justify-center">
                <div className="h-10 w-48 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              </div>

              {/* Navigation Grid Skeleton */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="space-y-3">
                    {/* Column Header */}
                    <div className="h-5 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    {/* Links */}
                    <div className="space-y-2">
                      <div className="h-4 w-20 bg-gray-100 dark:bg-gray-800 rounded"></div>
                      <div className="h-4 w-16 bg-gray-100 dark:bg-gray-800 rounded"></div>
                      <div className="h-4 w-24 bg-gray-100 dark:bg-gray-800 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom Section Skeleton */}
              <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              </div>
            </div>
          ) : (
            <>
              {/* Mega Menu Dropdown */}
              {openMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setOpenMenu(null)}
                    aria-label="Close menu"
                  />
                  
                  <div 
                    className="absolute left-0 right-0 bg-white dark:bg-gray-800 shadow-2xl z-50 overflow-y-auto rounded-b-2xl"
                    style={{ top: '140px', bottom: 0 }}
                  >
                    <div className="max-w-7xl mx-auto px-6 py-6 h-full">
                      <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-100 dark:border-gray-700">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                          Settings
                        </h2>
                        <button
                          onClick={() => setOpenMenu(null)}
                          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                          style={{ color: hoveredButton === 'close-menu' ? primary.hover : undefined }}
                          onMouseEnter={() => setHoveredButton('close-menu')}
                          onMouseLeave={() => setHoveredButton(null)}
                        >
                          <kbd 
                            className="px-2 py-0.5 text-xs border rounded"
                            style={{
                              backgroundColor: hoveredButton === 'close-menu' ? `${primary.base}10` : undefined,
                              borderColor: hoveredButton === 'close-menu' ? `${primary.base}40` : undefined,
                              color: hoveredButton === 'close-menu' ? primary.base : undefined
                            }}
                          >
                            Esc
                          </kbd>
                          <span>to close</span>
                        </button>
                      </div>

                      {/* Settings Section */}
                      <div className="mb-8">
                        {openMenu === 'style' && (
                          <StyleSection
                            selectedStyle={selectedStyle}
                            footerStyleFull={footerStyleFull}
                            organizationId={organizationId || ''}
                            onStyleChange={setSelectedStyle}
                            onStyleFullChange={updateFooterStyleFull}
                          />
                        )}

                        {openMenu === 'menu' && (
                          <MenuSection
                            menuItems={localMenuItems}
                            sensors={sensors}
                            onDragEnd={handleDragEnd}
                            onToggle={handleToggleVisibility}
                            onDelete={handleDelete}
                            onEdit={handleEdit}
                            onSubmenuEdit={handleSubmenuEdit}
                            onSubmenuToggle={handleSubmenuToggle}
                            onSubmenuDelete={handleDeleteSubmenuItem}
                            onAddSubmenu={handleAddSubmenuItem}
                            onSubmenuReorder={handleSubmenuReorder}
                            onAddMenuItem={handleAddMenuItem}
                          />
                        )}
                      </div>

                      {/* Preview Section - Full Width Below */}
                      <div className="-mx-6 -mb-6">
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 px-6">Live Preview</h3>
                        <div className="relative">
                          {previewRefreshing && (
                            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg border"
                              style={{ borderColor: `${primary.base}40` }}
                            >
                              <div className="w-3 h-3 border-2 border-t-transparent rounded-full animate-spin"
                                style={{ borderColor: `${primary.base} transparent transparent transparent` }}
                              ></div>
                              <span className="text-xs font-medium text-gray-700">Updating preview...</span>
                            </div>
                          )}
                          <div className={`transition-opacity duration-300 ${previewRefreshing ? 'opacity-50' : 'opacity-100'}`}>
                            <FooterPreview
                              menuItems={localMenuItems}
                              footerStyle={selectedStyle}
                              footerStyleFull={footerStyleFull}
                              previewRefreshing={previewRefreshing}
                              siteName={settings?.site || 'Your Company'}
                              onMenuItemClick={(itemId, event) => {
                                console.log('Menu item clicked:', itemId);
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Full Width Footer Preview (when no menu is open) */}
              {!openMenu && (
                <div className="h-full overflow-y-auto relative">
                  {previewRefreshing && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg border"
                      style={{ borderColor: `${primary.base}40` }}
                    >
                      <div className="w-3 h-3 border-2 border-t-transparent rounded-full animate-spin"
                        style={{ borderColor: `${primary.base} transparent transparent transparent` }}
                      ></div>
                      <span className="text-xs font-medium text-gray-700">Updating preview...</span>
                    </div>
                  )}
                  <div className={`transition-opacity duration-300 ${previewRefreshing ? 'opacity-50' : 'opacity-100'}`}>
                    <FooterPreview
                      menuItems={localMenuItems}
                      footerStyle={selectedStyle}
                      footerStyleFull={footerStyleFull}
                      previewRefreshing={previewRefreshing}
                      siteName={settings?.site || 'Your Company'}
                      onMenuItemClick={(itemId, event) => {
                        console.log('Menu item clicked:', itemId);
                      }}
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </StandardModalBody>

        <StandardModalFooter className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm border-t border-white/10 dark:border-gray-700/20 rounded-b-2xl">
          <div className="w-full flex items-center justify-between">
            <div className="flex items-center gap-3">
              {saveError && (
                <p className="text-sm text-red-600 dark:text-red-400">{saveError}</p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                onClick={handleCancel}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSave}
                disabled={isSaving}
                loading={isSaving}
                title="Ctrl/Cmd + S to save"
              >
                Save
              </Button>
            </div>
          </div>
        </StandardModalFooter>
      </StandardModalContainer>

      {/* Delete Confirmation Modal */}
      {deleteConfirm.isOpen && (
        <div className="fixed inset-0 z-[10002] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteConfirm({ isOpen: false, type: null, itemId: null, itemName: '' })} />
          <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-md border border-gray-200 dark:border-gray-700">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Delete {deleteConfirm.type === 'menu' ? 'Menu' : 'Submenu'} Item
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Are you sure you want to delete &quot;{deleteConfirm.itemName}&quot;? This action cannot be undone.
                </p>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Type <span className="font-mono font-semibold">delete</span> to confirm
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="delete"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:text-white"
                    autoFocus
                  />
                </div>
                
                <div className="flex items-center justify-end gap-3">
                  <Button
                    variant="secondary"
                    onClick={() => setDeleteConfirm({ isOpen: false, type: null, itemId: null, itemName: '' })}
                    className="px-4 py-2 text-sm"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="danger"
                    onClick={confirmDelete}
                    disabled={deleteConfirmText.toLowerCase() !== 'delete'}
                    className="px-4 py-2 text-sm"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default FooterEditModal;
