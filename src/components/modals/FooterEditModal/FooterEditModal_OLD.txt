'use client';

import React, { useEffect, useState } from 'react';
import { useFooterEdit } from './context';
import { BaseModal } from '../_shared/BaseModal';
import { cn } from '@/lib/utils';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface MenuItem {
  id: string;
  display_name: string;
  url_name: string;
  is_displayed: boolean;
  is_displayed_on_footer: boolean;
  menu_items_are_text: boolean;
  react_icon_id?: string;
  order: number;
  organization_id: string;
}

interface SortableItemProps {
  item: MenuItem;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

function SortableItem({ item, onToggle, onDelete }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-4 bg-white border rounded-lg ${
        isDragging ? 'shadow-lg' : 'shadow-sm'
      }`}
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
        aria-label="Drag to reorder"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 8h16M4 16h16"
          />
        </svg>
      </button>

      {/* Menu Item Info */}
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900">{item.display_name}</span>
          {item.is_displayed_on_footer ? (
            <span className="px-2 py-0.5 text-xs font-medium rounded-md border bg-green-100 text-green-700 border-green-200">
              Visible
            </span>
          ) : (
            <span className="px-2 py-0.5 text-xs font-medium rounded-md border bg-gray-100 text-gray-600 border-gray-200">
              Hidden
            </span>
          )}
        </div>
        <div className="text-sm text-gray-500">{item.url_name}</div>
      </div>

      {/* Visibility Toggle Button */}
      <button
        onClick={() => onToggle(item.id)}
        className={cn(
          'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
          item.is_displayed_on_footer
            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            : 'bg-sky-600 text-white hover:bg-sky-700'
        )}
        aria-label={item.is_displayed_on_footer ? 'Hide menu item' : 'Show menu item'}
      >
        {item.is_displayed_on_footer ? 'Hide' : 'Show'}
      </button>

      {/* Delete Button */}
      <button
        onClick={() => onDelete(item.id)}
        className="p-2 text-red-600 hover:bg-red-50 rounded"
        aria-label="Delete menu item"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
      </button>
    </div>
  );
}

function FooterEditModal() {
  const {
    isOpen,
    isLoading,
    isSaving,
    organizationId,
    footerStyle,
    menuItems,
    closeModal,
    fetchFooterData,
    saveFooterStyle,
    updateMenuItems,
    updateMenuItem
  } = useFooterEdit();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState(footerStyle);
  const [localMenuItems, setLocalMenuItems] = useState<MenuItem[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  // Load data when modal opens
  useEffect(() => {
    if (isOpen && organizationId) {
      fetchFooterData(organizationId);
    }
  }, [isOpen, organizationId, fetchFooterData]);

  // Sync local state with context
  useEffect(() => {
    setSelectedStyle(footerStyle);
  }, [footerStyle]);

  useEffect(() => {
    setLocalMenuItems(menuItems);
  }, [menuItems]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setLocalMenuItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleToggleVisibility = async (itemId: string) => {
    const item = localMenuItems.find((m) => m.id === itemId);
    if (!item) return;

    try {
      // Update via API
      await updateMenuItem(itemId, { is_displayed_on_footer: !item.is_displayed_on_footer });
      
      // Refetch data to ensure UI is in sync
      if (organizationId) {
        await fetchFooterData(organizationId);
      }
    } catch (error) {
      console.error('Failed to toggle visibility:', error);
      setSaveError('Failed to update menu item visibility');
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this menu item?')) return;

    try {
      await updateMenuItem(itemId, { is_displayed_on_footer: false });
      
      // Refetch data to ensure UI is in sync
      if (organizationId) {
        await fetchFooterData(organizationId);
      }
    } catch (error) {
      console.error('Failed to delete menu item:', error);
      setSaveError('Failed to delete menu item');
    }
  };

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

  // Modal title with badge
  const modalTitle = (
    <div className="flex items-center gap-2.5">
      <span>Edit Footer</span>
      <span className="px-2 py-0.5 text-xs font-medium rounded-md border bg-amber-100 text-amber-700 border-amber-200">
        Edit
      </span>
    </div>
  );

  return (
    <BaseModal 
      isOpen={isOpen} 
      onClose={handleCancel} 
      title={modalTitle}
      size="xl"
      fullscreen={isFullscreen}
      onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
      showFullscreenButton={true}
      draggable={true}
      resizable={false}
      noPadding={true}
    >
      <div className="flex flex-col h-full">
        {/* Content Area - Scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mb-4"></div>
              <p className="text-sm text-gray-500">Loading footer settings...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Footer Style Selector */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Footer Style
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {['default', 'compact', 'grid'].map((style) => (
                    <button
                      key={style}
                      onClick={() => setSelectedStyle(style)}
                      className={cn(
                        'p-4 border-2 rounded-xl text-center transition-all',
                        selectedStyle === style
                          ? 'border-sky-600 bg-sky-50 shadow-md'
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                      )}
                    >
                      <div className="font-semibold text-sm capitalize">
                        {style}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Menu Items */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Menu Items
                  <span className="ml-2 text-xs font-normal text-gray-500">(drag to reorder)</span>
                </label>
                {localMenuItems.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
                    <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                    <p className="text-sm font-medium">No menu items found</p>
                    <p className="text-xs mt-1">Add menu items to display them in the footer</p>
                  </div>
                ) : (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={localMenuItems.map((item) => item.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-2">
                        {localMenuItems.map((item) => (
                          <SortableItem
                            key={item.id}
                            item={item}
                            onToggle={handleToggleVisibility}
                            onDelete={handleDelete}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                )}
              </div>
            </div>
          )}

          {/* Information Card - Above Footer */}
          <div className="mt-6 rounded-xl border border-sky-200 bg-gradient-to-br from-sky-50 to-white px-4 py-3">
            <p className="text-sm text-sky-900 font-medium mb-1">
              💡 Customize your website footer
            </p>
            <p className="text-xs text-sky-800">
              Choose a footer style and manage menu items visibility and order. Drag items to reorder them.
            </p>
          </div>

          {/* Error Display */}
          {saveError && (
            <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {saveError}
            </div>
          )}
        </div>

        {/* Fixed Footer with Action Buttons */}
        <div className="flex-shrink-0 border-t border-gray-200 bg-gray-50 px-6 py-4">
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-sky-500 to-sky-600 rounded-lg hover:from-sky-600 hover:to-sky-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Save</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </BaseModal>
  );
}

export default FooterEditModal;
