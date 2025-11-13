/**
 * MenuSection - Menu items management with drag-and-drop
 */

import React, { useState } from 'react';
import { MenuItem } from '../types';
import { DragDropContainer, MenuItemCard } from '../components';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useThemeColors } from '@/hooks/useThemeColors';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/Shared/ToastContainer';

interface MenuSectionProps {
  menuItems: MenuItem[];
  sensors: any;
  onDragEnd: (event: any) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, field: 'display_name' | 'description' | 'url_name', value: string) => void;
  onSubmenuEdit: (menuItemId: string, submenuId: string, field: 'name' | 'description' | 'url_name' | 'image', value: string) => void;
  onSubmenuToggle: (menuItemId: string, submenuId: string) => void;
  onSubmenuDelete: (menuItemId: string, submenuId: string) => void;
  onAddSubmenu: (menuItemId: string, name: string, urlName: string) => void;
  onSubmenuReorder: (menuItemId: string, submenuItems: any[]) => void;
  onAddMenuItem: (name: string) => Promise<void>;
}

export function MenuSection({
  menuItems,
  sensors,
  onDragEnd,
  onToggle,
  onDelete,
  onEdit,
  onSubmenuEdit,
  onSubmenuToggle,
  onSubmenuDelete,
  onAddSubmenu,
  onSubmenuReorder,
  onAddMenuItem
}: MenuSectionProps) {
  const [isAddingMenuItem, setIsAddingMenuItem] = useState(false);
  const [newMenuItemName, setNewMenuItemName] = useState('');
  const [newMenuItemUrl, setNewMenuItemUrl] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const themeColors = useThemeColors();
  const primary = themeColors.cssVars.primary;
  const toast = useToast();
  
  // Add submenu modal state
  const [addSubmenuState, setAddSubmenuState] = useState<{
    menuItemId: string | null;
    name: string;
    url: string;
  }>({ menuItemId: null, name: '', url: '' });
  
  // Inline edit state for menu items
  const [inlineEdit, setInlineEdit] = useState<{
    menuItemId: string | null;
    submenuId?: string | null;
    field: 'display_name' | 'url_name' | 'submenu_name' | 'submenu_url' | null;
    value: string;
  }>({ menuItemId: null, submenuId: null, field: null, value: '' });

  const handleAddMenuItem = async () => {
    if (!newMenuItemName.trim()) {
      toast.error('Menu item name is required');
      return;
    }
    
    try {
      await onAddMenuItem(newMenuItemName);
      // Clear form and close modal on success
      setNewMenuItemName('');
      setNewMenuItemUrl('');
      setIsAddingMenuItem(false);
    } catch (error) {
      console.error('Failed to add menu item:', error);
      toast.error('Failed to add menu item. Please try again.');
    }
  };

  /**
   * Opens inline edit modal for menu items or submenu items
   * Supports editing: display_name, url_name, submenu_name, submenu_url
   */
  // Inline edit handlers
  const handleInlineEditOpen = (menuItemId: string, field: 'display_name' | 'url_name' | 'submenu_name' | 'submenu_url', currentValue: string, submenuId?: string) => {
    setInlineEdit({ menuItemId, submenuId: submenuId || null, field, value: currentValue });
  };

  /**
   * Saves inline edit changes for menu items or submenu items
   * Handles URL slug sanitization (lowercase, hyphens, alphanumeric only)
   */
  const handleInlineEditSave = () => {
    if (!inlineEdit.menuItemId || !inlineEdit.field || !inlineEdit.value.trim()) {
      toast.error('Value cannot be empty');
      return;
    }
    
    try {
      if (inlineEdit.submenuId && (inlineEdit.field === 'submenu_name' || inlineEdit.field === 'submenu_url')) {
        // Handle submenu edit
        const field = inlineEdit.field === 'submenu_name' ? 'name' : 'url_name';
        const value = inlineEdit.field === 'submenu_url' 
          ? inlineEdit.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
          : inlineEdit.value.trim();
        onSubmenuEdit(inlineEdit.menuItemId, inlineEdit.submenuId, field as 'name' | 'url_name', value);
      } else if (inlineEdit.field === 'display_name' || inlineEdit.field === 'url_name') {
        // Handle menu item edit
        if (inlineEdit.field === 'url_name') {
          const cleanSlug = inlineEdit.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
          onEdit(inlineEdit.menuItemId, 'url_name', cleanSlug);
        } else {
          onEdit(inlineEdit.menuItemId, inlineEdit.field, inlineEdit.value.trim());
        }
      }
      setInlineEdit({ menuItemId: null, submenuId: null, field: null, value: '' });
    } catch (error) {
      console.error('Failed to save edit:', error);
      toast.error('Failed to save changes. Please try again.');
    }
  };

  const handleInlineEditCancel = () => {
    setInlineEdit({ menuItemId: null, submenuId: null, field: null, value: '' });
  };

  /**
   * Opens add submenu modal for a specific menu item
   */
  // Add submenu handlers
  const handleAddSubmenuOpen = (menuItemId: string) => {
    setAddSubmenuState({ menuItemId, name: '', url: '' });
  };

  /**
   * Creates a new submenu item with optional URL slug
   * Auto-generates slug from name if not provided
   */
  const handleAddSubmenuSave = async () => {
    if (!addSubmenuState.menuItemId || !addSubmenuState.name.trim()) {
      toast.error('Submenu name is required');
      return;
    }
    
    try {
      const cleanUrl = addSubmenuState.url.trim() ? addSubmenuState.url.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : '';
      await onAddSubmenu(addSubmenuState.menuItemId, addSubmenuState.name.trim(), cleanUrl);
      setAddSubmenuState({ menuItemId: null, name: '', url: '' });
    } catch (error) {
      console.error('Failed to add submenu:', error);
      toast.error('Failed to add submenu item. Please try again.');
    }
  };

  const handleAddSubmenuCancel = () => {
    setAddSubmenuState({ menuItemId: null, name: '', url: '' });
  };

  /**
   * Filter menu items based on visibility toggle
   * showInactive = true: only show items with is_displayed_on_footer === false
   * showInactive = false: show all items where is_displayed_on_footer !== false
   */
  // Filter menu items based on toggle
  const filteredMenuItems = showInactive 
    ? menuItems.filter(item => item.is_displayed_on_footer === false)
    : menuItems.filter(item => item.is_displayed_on_footer !== false);

  return (
    <div>
      <div className="mb-3">
        {/* Header row - responsive layout */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
              Items
              <span 
                className="px-2 py-0.5 text-xs font-medium rounded"
                style={{ 
                  backgroundColor: `${primary.base}15`, 
                  color: primary.base 
                }}
              >
                {filteredMenuItems.length} {filteredMenuItems.length === 1 ? 'item' : 'items'}
                {menuItems.reduce((total, item) => total + (item.submenu_items?.length || 0), 0) > 0 && (
                  <span className="ml-1">
                    · {menuItems.reduce((total, item) => total + (item.submenu_items?.length || 0), 0)} submenu
                  </span>
                )}
              </span>
            </label>
          </div>

          <div className="flex items-center gap-2">
            {/* Display Inactive Toggle - Icon Only */}
            <button
              onClick={() => setShowInactive(!showInactive)}
              className={cn(
                'p-1.5 rounded-lg transition-all border',
                showInactive
                  ? 'text-white border-transparent'
                  : 'border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              )}
              style={showInactive ? {
                backgroundColor: primary.base,
                borderColor: primary.base
              } : {}}
              onMouseEnter={(e) => {
                if (showInactive) {
                  e.currentTarget.style.backgroundColor = primary.hover;
                }
              }}
              onMouseLeave={(e) => {
                if (showInactive) {
                  e.currentTarget.style.backgroundColor = primary.base;
                }
              }}
              title={showInactive ? 'Showing inactive only (click to show active)' : 'Showing active (click to show inactive only)'}
            >
              {showInactive ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </button>

            <button
              onClick={() => setIsAddingMenuItem(true)}
              className="w-full sm:w-auto px-3 py-1.5 text-xs font-medium text-white rounded-lg transition-colors flex items-center justify-center gap-1.5"
              style={{ backgroundColor: primary.base }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = primary.hover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = primary.base;
              }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add item
            </button>
          </div>
        </div>
      </div>

      {filteredMenuItems.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <svg className="w-12 h-12 mx-auto mb-3 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <p className="text-sm font-medium">No menu items found</p>
          <p className="text-xs mt-1">{showInactive ? 'No inactive items' : 'Toggle to see inactive items'}</p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
        >
          <SortableContext
            items={filteredMenuItems.map((item) => item.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {filteredMenuItems.map((item) => (
                <MenuItemCard
                  key={item.id}
                  item={item}
                  onToggle={onToggle}
                  onDelete={onDelete}
                  onEdit={onEdit}
                  onSubmenuEdit={onSubmenuEdit}
                  onSubmenuToggle={onSubmenuToggle}
                  onSubmenuDelete={onSubmenuDelete}
                  onAddSubmenu={onAddSubmenu}
                  onSubmenuReorder={onSubmenuReorder}
                  onInlineEditOpen={handleInlineEditOpen}
                  onAddSubmenuOpen={handleAddSubmenuOpen}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Add Menu Item Modal (Hero-style) */}
      {isAddingMenuItem && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-[10003]" 
            onClick={() => { setNewMenuItemName(''); setNewMenuItemUrl(''); setIsAddingMenuItem(false); }}
            aria-hidden="true"
          />
          
          {/* Modal */}
          <div 
            className="fixed z-[10004] bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 p-4 w-[400px] max-w-[90vw] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-menu-item-title"
          >
            <div className="mb-3">
              <div className="flex items-center justify-between mb-3">
                <label id="add-menu-item-title" className="text-sm font-semibold text-gray-900 dark:text-white">
                  Add Menu Item
                </label>
                <button
                  onClick={() => { setNewMenuItemName(''); setNewMenuItemUrl(''); setIsAddingMenuItem(false); }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  aria-label="Close dialog"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label htmlFor="menu-item-name" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Menu Item Name
                  </label>
                  <input
                    id="menu-item-name"
                    type="text"
                    aria-required="true"
                    value={newMenuItemName}
                    onChange={(e) => setNewMenuItemName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newMenuItemName.trim()) {
                        document.getElementById('menu-item-url')?.focus();
                      }
                      if (e.key === 'Escape') { setNewMenuItemName(''); setNewMenuItemUrl(''); setIsAddingMenuItem(false); }
                    }}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    style={{
                      '--tw-ring-color': `${primary.base}30`
                    } as React.CSSProperties}
                    placeholder="Enter menu name"
                    autoFocus
                  />
                </div>
                
                <div>
                  <label htmlFor="menu-item-url" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    URL Slug
                  </label>
                  <input
                    id="menu-item-url"
                    type="text"
                    value={newMenuItemUrl}
                    onChange={(e) => setNewMenuItemUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newMenuItemName.trim()) handleAddMenuItem();
                      if (e.key === 'Escape') { setNewMenuItemName(''); setNewMenuItemUrl(''); setIsAddingMenuItem(false); }
                    }}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    style={{
                      '--tw-ring-color': `${primary.base}30`
                    } as React.CSSProperties}
                    placeholder="Enter URL slug (optional)"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setNewMenuItemName(''); setNewMenuItemUrl(''); setIsAddingMenuItem(false); }}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddMenuItem}
                disabled={!newMenuItemName.trim()}
                className="px-3 py-1.5 text-sm font-medium text-white rounded-lg transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                style={{ backgroundColor: newMenuItemName.trim() ? primary.base : undefined }}
                onMouseEnter={(e) => {
                  if (newMenuItemName.trim()) {
                    e.currentTarget.style.backgroundColor = primary.hover;
                  }
                }}
                onMouseLeave={(e) => {
                  if (newMenuItemName.trim()) {
                    e.currentTarget.style.backgroundColor = primary.base;
                  }
                }}
              >
                Create
              </button>
            </div>
          </div>
        </>
      )}

      {/* Inline Edit Popover (Hero-style) - Outside card wrappers */}
      {inlineEdit.field && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-[10003]" 
            onClick={handleInlineEditCancel}
            aria-hidden="true"
          />
          
          {/* Popover */}
          <div 
            className="fixed z-[10004] bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 p-4 w-[400px] max-w-[90vw] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            role="dialog"
            aria-modal="true"
            aria-labelledby="inline-edit-title"
          >
            <div className="mb-3">
              <div className="flex items-center justify-between mb-2">
                <label id="inline-edit-title" htmlFor="inline-edit-input" className="text-sm font-semibold text-gray-900 dark:text-white capitalize">
                  Edit {
                    inlineEdit.field === 'display_name' ? 'Name' :
                    inlineEdit.field === 'url_name' ? 'URL' :
                    inlineEdit.field === 'submenu_name' ? 'Submenu Name' :
                    'Submenu URL'
                  }
                </label>
                <button
                  onClick={handleInlineEditCancel}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  aria-label="Close dialog"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <input
                id="inline-edit-input"
                type="text"
                value={inlineEdit.value}
                onChange={(e) => setInlineEdit({ ...inlineEdit, value: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleInlineEditSave();
                  if (e.key === 'Escape') handleInlineEditCancel();
                }}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                style={{
                  '--tw-ring-color': `${primary.base}30`
                } as React.CSSProperties}
                placeholder={inlineEdit.field === 'display_name' ? 'Enter menu name' : 'Enter URL slug'}
                autoFocus
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={handleInlineEditCancel}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleInlineEditSave}
                className="px-3 py-1.5 text-sm font-medium text-white rounded-lg transition-colors"
                style={{ backgroundColor: primary.base }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = primary.hover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = primary.base;
                }}
              >
                Save
              </button>
            </div>
          </div>
        </>
      )}

      {/* Add Submenu Modal (Hero-style) - Outside card wrappers */}
      {addSubmenuState.menuItemId && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-[10005]" 
            onClick={handleAddSubmenuCancel}
            aria-hidden="true"
          />
          
          {/* Modal */}
          <div 
            className="fixed z-[10006] bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 p-4 w-[400px] max-w-[90vw] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-submenu-title"
          >
            <div className="mb-3">
              <div className="flex items-center justify-between mb-3">
                <label id="add-submenu-title" className="text-sm font-semibold text-gray-900 dark:text-white">
                  Add Submenu Item
                </label>
                <button
                  onClick={handleAddSubmenuCancel}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  aria-label="Close dialog"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label htmlFor="submenu-name" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Submenu Name
                  </label>
                  <input
                    id="submenu-name"
                    type="text"
                    aria-required="true"
                    value={addSubmenuState.name}
                    onChange={(e) => setAddSubmenuState({ ...addSubmenuState, name: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && addSubmenuState.name.trim()) {
                        document.getElementById('submenu-url')?.focus();
                      }
                      if (e.key === 'Escape') handleAddSubmenuCancel();
                    }}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    style={{
                      '--tw-ring-color': `${primary.base}30`
                    } as React.CSSProperties}
                    placeholder="Enter submenu name"
                    autoFocus
                  />
                </div>
                
                <div>
                  <label htmlFor="submenu-url" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    URL Slug
                  </label>
                  <input
                    id="submenu-url"
                    type="text"
                    value={addSubmenuState.url}
                    onChange={(e) => setAddSubmenuState({ ...addSubmenuState, url: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && addSubmenuState.name.trim()) handleAddSubmenuSave();
                      if (e.key === 'Escape') handleAddSubmenuCancel();
                    }}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    style={{
                      '--tw-ring-color': `${primary.base}30`
                    } as React.CSSProperties}
                    placeholder="Enter URL slug (optional)"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex gap-2 justify-end">
              <button
                onClick={handleAddSubmenuCancel}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddSubmenuSave}
                disabled={!addSubmenuState.name.trim()}
                className="px-3 py-1.5 text-sm font-medium text-white rounded-lg transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                style={{ backgroundColor: addSubmenuState.name.trim() ? primary.base : undefined }}
                onMouseEnter={(e) => {
                  if (addSubmenuState.name.trim()) {
                    e.currentTarget.style.backgroundColor = primary.hover;
                  }
                }}
                onMouseLeave={(e) => {
                  if (addSubmenuState.name.trim()) {
                    e.currentTarget.style.backgroundColor = primary.base;
                  }
                }}
              >
                Create
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
