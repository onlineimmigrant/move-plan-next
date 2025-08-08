import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, Bars3Icon, ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Sortable Submenu Item Component
interface SortableSubmenuItemProps {
  submenuItem: SubmenuItem;
  submenuIndex: number;
  menuItemId: number;
  onEditSubmenu: (submenuIndex: number, submenuItem: SubmenuItem) => void;
  onDeleteSubmenu: (submenuItem: SubmenuItem) => void;
  isEditingSubmenu: boolean;
  editingSubmenuForMenuItem: number | null;
  editingSubmenuIndex: number | null;
  submenuEditForm: Partial<SubmenuItem>;
  setSubmenuEditForm: (form: Partial<SubmenuItem>) => void;
  handleSaveSubmenu: () => void;
  handleCancelSubmenu: () => void;
  isDragDisabled?: boolean;
}

function SortableSubmenuItem({
  submenuItem,
  submenuIndex,
  menuItemId,
  onEditSubmenu,
  onDeleteSubmenu,
  isEditingSubmenu,
  editingSubmenuForMenuItem,
  editingSubmenuIndex,
  submenuEditForm,
  setSubmenuEditForm,
  handleSaveSubmenu,
  handleCancelSubmenu,
  isDragDisabled = false,
}: SortableSubmenuItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: `submenu-${menuItemId}-${submenuIndex}`,
    disabled: isDragDisabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Enhanced listeners that prevent parent menu item drag interference
  const enhancedListeners = {
    ...listeners,
    onMouseDown: (e: React.MouseEvent) => {
      // Prevent event from bubbling to parent menu item
      e.stopPropagation();
      if (listeners?.onMouseDown) {
        listeners.onMouseDown(e as any);
      }
    },
    onTouchStart: (e: React.TouchEvent) => {
      // Prevent event from bubbling to parent menu item
      e.stopPropagation();
      if (listeners?.onTouchStart) {
        listeners.onTouchStart(e as any);
      }
    },
  };

  return (
    <div key={submenuIndex}>
      <div 
        ref={setNodeRef} 
        style={style}
        className={`flex items-center justify-between p-3 bg-white/80 backdrop-blur-sm border-2 border-gray-100/60 rounded-lg hover:bg-white/90 hover:shadow-sm transition-all duration-200 ${
          isDragging ? 'shadow-lg ring-2 ring-emerald-500/20' : ''
        }`}
      >
        <div className="flex items-center gap-2 flex-1">
          {/* Drag Handle for Submenu */}
          <button
            {...attributes}
            {...enhancedListeners}
            className="p-1 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-all duration-200 cursor-grab active:cursor-grabbing touch-none"
            aria-label="Drag to reorder submenu item"
            disabled={isDragDisabled}
            style={{ 
              backgroundColor: isDragging ? '#10b981' : 'transparent',
              color: isDragging ? 'white' : undefined 
            }}
          >
            <Bars3Icon className="h-3 w-3" />
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-normal text-gray-800 truncate">
                {submenuItem.name}
              </span>

              {!submenuItem.is_displayed && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600 border border-red-200">
                  Hidden
                </span>
              )}
            </div>
            {submenuItem.description && (
              <div className="text-xs text-gray-500 mt-1.5 truncate font-light">
                {submenuItem.description}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onEditSubmenu(submenuIndex, submenuItem)}
            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
            title="Edit submenu item"
          >
            <PencilIcon className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDeleteSubmenu(submenuItem)}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
            title="Delete submenu item"
          >
            <TrashIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      
      {/* Submenu Edit Form - Positioned right under the submenu item */}
      {isEditingSubmenu && editingSubmenuForMenuItem === menuItemId && editingSubmenuIndex === submenuIndex && (
        <div className="mt-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
          <h5 className="text-sm font-medium text-emerald-900 mb-2">
            Edit Submenu Item
          </h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Name *</label>
              <input
                type="text"
                value={submenuEditForm.name || ''}
                onChange={(e) => setSubmenuEditForm({ ...submenuEditForm, name: e.target.value })}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">URL *</label>
              <input
                type="text"
                value={submenuEditForm.url_name || ''}
                onChange={(e) => setSubmenuEditForm({ ...submenuEditForm, url_name: e.target.value })}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div className="md:col-span-2">
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCancelSubmenu}
                  className="px-2 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveSubmenu}
                  className="px-2 py-1 text-xs font-medium text-white bg-emerald-600 border border-transparent rounded hover:bg-emerald-700"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Sortable MenuItem Component
interface SortableMenuItemProps {
  item: MenuItem;
  index: number;
  menuItemSubmenuItems: SubmenuItem[];
  isExpanded: boolean;
  onToggleExpansion: (menuItemId: number) => void;
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
  onAddSubmenu: (menuItemId: number) => void;
  onEditSubmenu: (submenuIndex: number, submenuItem: SubmenuItem) => void;
  onDeleteSubmenu: (submenuItem: SubmenuItem) => void;
  onSubmenuReorder: (menuItemId: number, submenuItems: SubmenuItem[]) => void;
  isEditingSubmenu: boolean;
  editingSubmenuForMenuItem: number | null;
  editingSubmenuIndex: number | null;
  submenuEditForm: Partial<SubmenuItem>;
  setSubmenuEditForm: (form: Partial<SubmenuItem>) => void;
  handleSaveSubmenu: () => void;
  handleCancelSubmenu: () => void;
  submenuRenderKey: number;
  // Edit form props
  isEditing: boolean;
  editingIndex: number | null;
  editForm: Partial<MenuItem>;
  setEditForm: (form: Partial<MenuItem>) => void;
  handleSave: () => void;
  handleCancel: () => void;
  isDragDisabled?: boolean;
}

function SortableMenuItem({
  item,
  index,
  menuItemSubmenuItems,
  isExpanded,
  onToggleExpansion,
  onEdit,
  onDelete,
  onAddSubmenu,
  onEditSubmenu,
  onDeleteSubmenu,
  onSubmenuReorder,
  isEditingSubmenu,
  editingSubmenuForMenuItem,
  editingSubmenuIndex,
  submenuEditForm,
  setSubmenuEditForm,
  handleSaveSubmenu,
  handleCancelSubmenu,
  submenuRenderKey,
  // Edit form props
  isEditing,
  editingIndex,
  editForm,
  setEditForm,
  handleSave,
  handleCancel,
  isDragDisabled = false,
}: SortableMenuItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: item.id?.toString() || `temp-${index}`,
    disabled: isDragDisabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Drag and drop sensors for submenu items - isolated from parent menu drag
  const submenuSensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Slightly higher threshold to prevent accidental activation
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Reference to track if we've done manual DOM reordering
  const hasManuallyReordered = useRef(false);

  // Handle submenu drag and drop reordering with immediate DOM manipulation
  const handleSubmenuDragEnd = (event: DragEndEvent) => {
    console.log('🎯 Submenu drag end event:', event);
    const { active, over } = event;

    // CRITICAL: Stop event propagation to prevent parent menu item drag system interference
    if (event.activatorEvent?.stopPropagation) {
      event.activatorEvent.stopPropagation();
    }

    if (over && active.id !== over.id && item.id) {
      const activeId = active.id.toString();
      const overId = over.id.toString();
      
      console.log('🔄 Submenu reorder attempt:', { activeId, overId });
      
      // Parse the indices from the ID format: submenu-{menuItemId}-{index}
      const activeIdParts = activeId.split('-');
      const overIdParts = overId.split('-');
      
      // Validate that both IDs are submenu IDs (not menu item IDs)
      if (activeIdParts.length === 3 && overIdParts.length === 3 && 
          activeIdParts[0] === 'submenu' && overIdParts[0] === 'submenu') {
        
        const activeIndex = parseInt(activeIdParts[2]);
        const overIndex = parseInt(overIdParts[2]);
        const activeMenuItemId = parseInt(activeIdParts[1]);
        const overMenuItemId = parseInt(overIdParts[1]);

        // Ensure we're reordering within the same menu item
        if (activeMenuItemId === overMenuItemId && activeMenuItemId === item.id &&
            !isNaN(activeIndex) && !isNaN(overIndex) && 
            activeIndex >= 0 && overIndex >= 0 && 
            activeIndex < menuItemSubmenuItems.length && 
            overIndex < menuItemSubmenuItems.length) {
          
          console.log('✅ Valid submenu reorder:', { activeIndex, overIndex, menuItemId: item.id });
          
          // Set flag to prevent React from overriding our manual reordering
          hasManuallyReordered.current = true;
          
          // Create a copy of the current submenu items to avoid mutation
          const currentSubmenuItems = [...menuItemSubmenuItems];
          const reorderedItems = arrayMove(currentSubmenuItems, activeIndex, overIndex);
          
          // Update order values to match new positions
          const updatedItems = reorderedItems.map((submenuItem, idx) => ({
            ...submenuItem,
            order: idx + 1,
          }));

          console.log('🚀 Applying immediate DOM reorder');
          
          // Immediate DOM manipulation for instant visual feedback
          const submenuContainer = document.querySelector(`[data-submenu-container="${item.id}"] .sortable-context-container`);
          if (submenuContainer) {
            const submenuElements = Array.from(submenuContainer.children);
            const activeElement = submenuElements[activeIndex];
            const overElement = submenuElements[overIndex];
            
            if (activeElement && overElement) {
              // Create smooth transition
              (activeElement as HTMLElement).style.transition = 'transform 0.2s ease-out';
              
              // Remove and reinsert at new position
              activeElement.remove();
              
              if (activeIndex < overIndex) {
                overElement.insertAdjacentElement('afterend', activeElement as Element);
              } else {
                overElement.insertAdjacentElement('beforebegin', activeElement as Element);
              }
              
              // Remove transition after animation
              setTimeout(() => {
                (activeElement as HTMLElement).style.transition = '';
                hasManuallyReordered.current = false;
              }, 200);
            }
          }

          // Update React state after DOM manipulation
          setTimeout(() => {
            console.log('📊 Updating React state with reordered items');
            onSubmenuReorder(item.id!, updatedItems);
          }, 0);
        } else {
          console.log('❌ Invalid submenu reorder conditions');
        }
      } else {
        console.log('❌ Not a valid submenu drag operation');
      }
    }
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`bg-white/80 backdrop-blur-sm border border-gray-200/60 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 ${
        isDragging ? 'shadow-lg ring-2 ring-sky-500/20' : ''
      }`}
    >
      {/* Main Menu Item */}
      <div className="flex items-center justify-between p-4 hover:bg-gray-50/80 transition-colors rounded-t-xl">
        <div className="flex items-center gap-3 flex-1">
          {/* Drag Handle */}
          <button
            {...attributes}
            {...listeners}
            className="p-1.5 text-gray-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-all duration-200 cursor-grab active:cursor-grabbing touch-none"
            aria-label="Drag to reorder"
            disabled={isDragDisabled}
          >
            <Bars3Icon className="h-4 w-4" />
          </button>


          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-gray-900 truncate">
                {item.display_name}
              </span>


            </div>
          </div>






        </div>
        
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onEdit(index)}
            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
            title="Edit menu item"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(index)}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
            title="Delete menu item"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
                  {/* Disclosure Button */}
          {item.id && (
            <button
              type="button"
              onClick={() => onToggleExpansion(item.id!)}
              className="p-1.5 text-gray-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-all duration-200"
              aria-label={isExpanded ? 'Collapse submenu' : 'Expand submenu'}
            >
              {isExpanded ? (
                <ChevronDownIcon className="h-4 w-4" />
              ) : (
                <ChevronRightIcon className="h-4 w-4" />
              )}
            </button>
          )}
      </div>

      {/* Edit Form - Positioned right under the menu item */}
      {isEditing && editingIndex === index && (
        <div className="border-t border-gray-200/60 bg-emerald-50 p-4">
          <h4 className="text-sm font-medium text-emerald-900 mb-3">
            Edit Menu Item
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Display Name *
              </label>
              <input
                type="text"
                value={editForm.display_name || ''}
                onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="e.g., Home, About, Contact"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                URL Path *
              </label>
              <input
                type="text"
                value={editForm.url_name || ''}
                onChange={(e) => setEditForm({ ...editForm, url_name: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="e.g., home, about, contact"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Order
              </label>
              <input
                type="number"
                value={editForm.order || ''}
                onChange={(e) => setEditForm({ ...editForm, order: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                min="1"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Image URL
              </label>
              <input
                type="url"
                value={editForm.image || ''}
                onChange={(e) => setEditForm({ ...editForm, image: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="https://example.com/image.png"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                React Icon ID
              </label>
              <input
                type="number"
                value={editForm.react_icon_id || ''}
                onChange={(e) => setEditForm({ ...editForm, react_icon_id: parseInt(e.target.value) || undefined })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Icon ID from react_icons table"
              />
            </div>
            
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editForm.is_displayed || false}
                  onChange={(e) => setEditForm({ ...editForm, is_displayed: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                />
                <span className="text-xs font-medium text-gray-700">Visible in Menu</span>
              </label>
              
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editForm.is_displayed_on_footer || false}
                  onChange={(e) => setEditForm({ ...editForm, is_displayed_on_footer: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                />
                <span className="text-xs font-medium text-gray-700">Show in Footer</span>
              </label>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 mt-4">
            <button
              type="button"
              onClick={handleCancel}
              className="px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!editForm.display_name || !editForm.url_name}
              className="px-3 py-2 text-xs font-medium text-white bg-emerald-600 border border-transparent rounded-md hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Update Menu Item
            </button>
          </div>
        </div>
      )}

      {/* Submenu Items Section - Collapsible */}
      {item.id && isExpanded && !(isEditing && editingIndex === index) && (
        <div className="border-t border-gray-200/60 bg-gradient-to-br from-gray-25/50 to-gray-50/30">
          <div className="pl-8 pr-4 py-4">

            
            {/* Submenu Items List - Isolated drag context */}
            <div 
              className="space-y-2" 
              data-submenu-container={item.id}
              onClick={(e) => e.stopPropagation()} // Prevent menu item click events
              onMouseDown={(e) => e.stopPropagation()} // Prevent menu item drag activation
            >
              <DndContext
                sensors={submenuSensors}
                collisionDetection={closestCenter}
                onDragEnd={handleSubmenuDragEnd}
                id={`submenu-context-${item.id}`} // Unique context ID
              >
                <SortableContext
                  items={menuItemSubmenuItems.map((_, idx) => `submenu-${item.id}-${idx}`)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="sortable-context-container">
                  {menuItemSubmenuItems.map((submenuItem, submenuIndex) => (
                    <SortableSubmenuItem
                      key={`submenu-${item.id}-${submenuIndex}-${submenuItem.name}-${submenuItem.order}-${submenuRenderKey}`}
                      submenuItem={submenuItem}
                      submenuIndex={submenuIndex}
                      menuItemId={item.id!}
                      isEditingSubmenu={isEditingSubmenu}
                      editingSubmenuForMenuItem={editingSubmenuForMenuItem}
                      editingSubmenuIndex={editingSubmenuIndex}
                      submenuEditForm={submenuEditForm}
                      setSubmenuEditForm={setSubmenuEditForm}
                      handleSaveSubmenu={handleSaveSubmenu}
                      handleCancelSubmenu={handleCancelSubmenu}
                      onEditSubmenu={onEditSubmenu}
                      onDeleteSubmenu={onDeleteSubmenu}
                    />
                  ))}
                  </div>
                </SortableContext>
              </DndContext>
              {/* Add Submenu Form - Positioned under submenu items */}
              {isEditingSubmenu && editingSubmenuForMenuItem === item.id && editingSubmenuIndex === null && (
                <div className="mt-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <h5 className="text-sm font-medium text-emerald-900 mb-2">
                    Add Submenu Item
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Name *</label>
                      <input
                        type="text"
                        value={submenuEditForm.name || ''}
                        onChange={(e) => setSubmenuEditForm({ ...submenuEditForm, name: e.target.value })}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">URL *</label>
                      <input
                        type="text"
                        value={submenuEditForm.url_name || ''}
                        onChange={(e) => setSubmenuEditForm({ ...submenuEditForm, url_name: e.target.value })}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                      <input
                        type="text"
                        value={submenuEditForm.description || ''}
                        onChange={(e) => setSubmenuEditForm({ ...submenuEditForm, description: e.target.value })}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        placeholder="Optional description"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Order</label>
                      <input
                        type="number"
                        value={submenuEditForm.order || ''}
                        onChange={(e) => setSubmenuEditForm({ ...submenuEditForm, order: parseInt(e.target.value) || 1 })}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        min="1"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={submenuEditForm.is_displayed !== false}
                          onChange={(e) => setSubmenuEditForm({ ...submenuEditForm, is_displayed: e.target.checked })}
                          className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                        />
                        <span className="text-xs font-medium text-gray-700">Visible in Menu</span>
                      </label>
                    </div>
                    <div className="md:col-span-2">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={handleCancelSubmenu}
                          className="px-2 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveSubmenu}
                          className="px-2 py-1 text-xs font-medium text-white bg-emerald-600 border border-transparent rounded hover:bg-emerald-700"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {menuItemSubmenuItems.length === 0 && (
                <div className="text-center py-4 text-gray-400 text-sm">
                  No submenu items yet. Click "Add Submenu Item" to get started.
                </div>
              )}
            </div>

                        <div className="flex  items-center justify-between mt-4">
                                        {menuItemSubmenuItems.length > 0 && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">
                  {menuItemSubmenuItems.length} submenu{menuItemSubmenuItems.length !== 1 ? 's' : ''}
                </span>
              )}
              {!item.is_displayed && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200">
                  Hidden
                </span>
              )}
              <button
                type="button"
                onClick={() => onAddSubmenu(item.id!)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-emerald-600 bg-emerald-50/80 border border-emerald-200 rounded-lg hover:bg-emerald-100/80 hover:border-emerald-300 transition-all duration-200 shadow-sm"
              >
                <PlusIcon className="h-3.5 w-3.5" />
                Add Submenu Item
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface MenuItem {
  id?: number;
  display_name: string;
  display_name_translation?: Record<string, any>;
  url_name: string;
  is_displayed: boolean;
  is_displayed_on_footer: boolean;
  order: number;
  image?: string;
  react_icon_id?: number;
  organization_id?: string | null;
  description_translation?: Record<string, any>;
}

interface SubmenuItem {
  id?: number;
  website_menuitem_id: number;
  name: string;
  name_translation?: Record<string, any>;
  url_name: string;
  description?: string;
  description_translation?: Record<string, any>;
  order: number;
  is_displayed?: boolean;
  organization_id?: string | null;
}

interface MenuItemsSelectProps {
  label: string;
  name: string;
  value: MenuItem[];
  submenuItems?: SubmenuItem[];
  onChange: (name: string, value: MenuItem[]) => void;
  onSubmenuChange?: (submenuItems: SubmenuItem[]) => void;
}

export const MenuItemsSelect: React.FC<MenuItemsSelectProps> = ({
  label,
  name,
  value = [],
  submenuItems = [],
  onChange,
  onSubmenuChange
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<MenuItem>>({});
  
  // Local state for submenu items to enable immediate updates
  const [localSubmenuItems, setLocalSubmenuItems] = useState<SubmenuItem[]>(submenuItems);
  
  // Force re-render key for submenu items
  const [submenuRenderKey, setSubmenuRenderKey] = useState(0);
  
  // Sync local state when props change
  useEffect(() => {
    setLocalSubmenuItems(submenuItems);
    setSubmenuRenderKey(prev => prev + 1);
  }, [submenuItems]);
  
  // Submenu state
  const [isEditingSubmenu, setIsEditingSubmenu] = useState(false);
  const [editingSubmenuIndex, setEditingSubmenuIndex] = useState<number | null>(null);
  const [editingSubmenuForMenuItem, setEditingSubmenuForMenuItem] = useState<number | null>(null);
  const [submenuEditForm, setSubmenuEditForm] = useState<Partial<SubmenuItem>>({});
  
  // Menu item disclosure state
  const [expandedMenuItems, setExpandedMenuItems] = useState<Set<number>>(new Set());

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleAdd = () => {
    setEditForm({
      display_name: '',
      url_name: '',
      is_displayed: true,
      is_displayed_on_footer: false,
      order: (value.length || 0) + 1
    });
    setEditingIndex(null);
    setIsEditing(true);
  };

  // Listen for custom add menu item event
  useEffect(() => {
    const handleAddMenuItemEvent = () => {
      handleAdd();
    };
    
    window.addEventListener('addMenuItem', handleAddMenuItemEvent);
    
    return () => {
      window.removeEventListener('addMenuItem', handleAddMenuItemEvent);
    };
  }, [handleAdd]);

  const handleEdit = (index: number) => {
    setEditForm({ ...value[index] });
    setEditingIndex(index);
    setIsEditing(true);
    // Close all expanded menu items when editing starts
    setExpandedMenuItems(new Set());
  };

  const handleSave = () => {
    if (!editForm.display_name || !editForm.url_name) return;

    const newItem: MenuItem = {
      ...editForm,
      display_name: editForm.display_name!,
      url_name: editForm.url_name!,
      is_displayed: editForm.is_displayed || true,
      is_displayed_on_footer: editForm.is_displayed_on_footer || false,
      order: editForm.order || (value.length || 0) + 1
    };

    let newValue: MenuItem[];
    if (editingIndex !== null) {
      // Editing existing item
      newValue = [...value];
      newValue[editingIndex] = newItem;
    } else {
      // Adding new item
      newValue = [...value, newItem];
    }

    onChange(name, newValue);
    setIsEditing(false);
    setEditForm({});
    setEditingIndex(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditForm({});
    setEditingIndex(null);
  };

  const handleDelete = (index: number) => {
    const newValue = value.filter((_, i) => i !== index);
    onChange(name, newValue);
  };

  // Handle drag and drop reordering for menu items (not submenu items)
  const handleDragEnd = (event: DragEndEvent) => {
    console.log('🏠 Menu item drag end event:', event);
    const { active, over } = event;

    // Ignore submenu drag operations - only handle menu item drags
    if (active.id.toString().startsWith('submenu-') || over?.id.toString().startsWith('submenu-')) {
      console.log('🚫 Ignoring submenu drag in menu item handler');
      return;
    }

    if (over && active.id !== over.id) {
      const oldIndex = value.findIndex(item => 
        (item.id?.toString() || `temp-${value.indexOf(item)}`) === active.id
      );
      const newIndex = value.findIndex(item => 
        (item.id?.toString() || `temp-${value.indexOf(item)}`) === over.id
      );

      if (oldIndex !== -1 && newIndex !== -1) {
        console.log('✅ Valid menu item reorder:', { oldIndex, newIndex });
        const newValue = arrayMove(value, oldIndex, newIndex);
        
        // Update order values to match new positions
        const updatedValue = newValue.map((item, index) => ({
          ...item,
          order: index + 1,
        }));

        onChange(name, updatedValue);
      }
    }
  };

  // Toggle submenu disclosure for a menu item
  const toggleMenuItemExpansion = (menuItemId: number) => {
    setExpandedMenuItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(menuItemId)) {
        newSet.delete(menuItemId);
      } else {
        newSet.add(menuItemId);
      }
      return newSet;
    });
  };

  // Submenu handlers - direct function that forces re-evaluation
  const getSubmenuItemsForMenuItem = useCallback((menuItemId: number) => {
    const items = localSubmenuItems
      .filter(item => item.website_menuitem_id === menuItemId)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
    console.log(`getSubmenuItemsForMenuItem(${menuItemId}):`, items.map(s => ({ name: s.name, order: s.order })));
    return items;
  }, [localSubmenuItems, submenuRenderKey]);

  const handleAddSubmenu = (menuItemId: number) => {
    const currentSubmenuItems = getSubmenuItemsForMenuItem(menuItemId);
    setSubmenuEditForm({
      name: '',
      url_name: '',
      description: '',
      website_menuitem_id: menuItemId,
      is_displayed: true,
      order: currentSubmenuItems.length + 1
    });
    setEditingSubmenuForMenuItem(menuItemId);
    setEditingSubmenuIndex(null);
    setIsEditingSubmenu(true);
  };

  const handleEditSubmenu = (submenuIndex: number, submenuItem: SubmenuItem) => {
    setSubmenuEditForm({ ...submenuItem });
    setEditingSubmenuForMenuItem(submenuItem.website_menuitem_id);
    setEditingSubmenuIndex(submenuIndex);
    setIsEditingSubmenu(true);
  };

  const handleSaveSubmenu = () => {
    if (!submenuEditForm.name || !submenuEditForm.url_name || !onSubmenuChange) return;

    const newSubmenuItem: SubmenuItem = {
      ...submenuEditForm,
      name: submenuEditForm.name!,
      url_name: submenuEditForm.url_name!,
      website_menuitem_id: submenuEditForm.website_menuitem_id!,
      is_displayed: submenuEditForm.is_displayed !== false,
      order: submenuEditForm.order || 1,
      description: submenuEditForm.description || ''
    };

    let newSubmenuItems: SubmenuItem[];
    if (editingSubmenuIndex !== null) {
      // Editing existing submenu item
      newSubmenuItems = [...localSubmenuItems];
      const actualIndex = localSubmenuItems.findIndex((item, idx) => 
        item.website_menuitem_id === editingSubmenuForMenuItem && 
        getSubmenuItemsForMenuItem(editingSubmenuForMenuItem!)[editingSubmenuIndex] === item
      );
      if (actualIndex !== -1) {
        newSubmenuItems[actualIndex] = newSubmenuItem;
      }
    } else {
      // Adding new submenu item
      newSubmenuItems = [...localSubmenuItems, newSubmenuItem];
    }

    // Force immediate re-render
    setSubmenuRenderKey(prev => prev + 1);
    setLocalSubmenuItems(newSubmenuItems);
    
    // Update parent state
    onSubmenuChange(newSubmenuItems);
    setIsEditingSubmenu(false);
    setSubmenuEditForm({});
    setEditingSubmenuIndex(null);
    setEditingSubmenuForMenuItem(null);
  };

  const handleCancelSubmenu = () => {
    setIsEditingSubmenu(false);
    setSubmenuEditForm({});
    setEditingSubmenuIndex(null);
    setEditingSubmenuForMenuItem(null);
  };

  const handleDeleteSubmenu = (submenuItem: SubmenuItem) => {
    if (!onSubmenuChange) return;
    const newSubmenuItems = localSubmenuItems.filter(item => 
      !(item.website_menuitem_id === submenuItem.website_menuitem_id && 
        item.name === submenuItem.name && 
        item.url_name === submenuItem.url_name)
    );
    
    // Force immediate re-render
    setSubmenuRenderKey(prev => prev + 1);
    setLocalSubmenuItems(newSubmenuItems);
    
    // Update parent state
    onSubmenuChange(newSubmenuItems);
  };

  // Submenu reordering handler with auto-save
  const handleSubmenuReorder = useCallback(async (menuItemId: number, reorderedSubmenuItems: SubmenuItem[]) => {
    console.log('handleSubmenuReorder called:', { menuItemId, reorderedSubmenuItems: reorderedSubmenuItems.map(s => ({ name: s.name, order: s.order })) });
    
    // Create a new array with updated submenu items using local state
    const updatedSubmenuItems = localSubmenuItems.map(submenuItem => {
      if (submenuItem.website_menuitem_id === menuItemId) {
        const newSubmenuItem = reorderedSubmenuItems.find(reordered => 
          reordered.id === submenuItem.id || 
          (reordered.name === submenuItem.name && reordered.url_name === submenuItem.url_name)
        );
        return newSubmenuItem || submenuItem;
      }
      return submenuItem;
    });
    
    console.log('Updated submenu items:', updatedSubmenuItems.map(s => ({ name: s.name, order: s.order, menuItemId: s.website_menuitem_id })));
    
    // Force immediate re-render by updating both state and render key
    setSubmenuRenderKey(prev => prev + 1);
    setLocalSubmenuItems(updatedSubmenuItems);
    
    // Immediately update parent state for immediate persistence
    if (onSubmenuChange) {
      onSubmenuChange(updatedSubmenuItems);
      console.log('✅ Parent state updated immediately with reordered submenu items');
    }
    
    // Trigger auto-save immediately (without delay to prevent race conditions)
    const autoSaveEvent = new CustomEvent('autoSaveMenuChanges', { 
      detail: { 
        type: 'submenu_reorder',
        menuItemId,
        updatedSubmenuItems 
      }
    });
    window.dispatchEvent(autoSaveEvent);
    console.log('🚀 Auto-save event dispatched immediately for submenu reorder');
  }, [localSubmenuItems, onSubmenuChange]);

  return (
    <div className="space-y-4">
      {/* Menu Items List */}
      <div className="space-y-2 max-h-[48rem] overflow-y-auto">
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext 
            items={value.map(item => item.id?.toString() || `temp-${value.indexOf(item)}`)}
            strategy={verticalListSortingStrategy}
          >
            {value.map((item, index) => {
              const menuItemSubmenuItems = item.id ? getSubmenuItemsForMenuItem(item.id) : [];
              const isExpanded = item.id ? expandedMenuItems.has(item.id) : false;
              
              // Debug: log submenu items for this menu item
              if (item.id && menuItemSubmenuItems.length > 0) {
                console.log(`Menu item ${item.id} submenu items:`, menuItemSubmenuItems.map(s => ({ name: s.name, order: s.order })));
              }
              
              return (
                <SortableMenuItem
                  key={`${item.id?.toString() || `temp-${index}`}-${submenuRenderKey}-${menuItemSubmenuItems.length}-${menuItemSubmenuItems.map(s => `${s.name}-${s.order}`).join('|')}`}
                  item={item}
                  index={index}
                  menuItemSubmenuItems={menuItemSubmenuItems}
                  isExpanded={isExpanded}
                  onToggleExpansion={toggleMenuItemExpansion}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onAddSubmenu={handleAddSubmenu}
                  onEditSubmenu={handleEditSubmenu}
                  onDeleteSubmenu={handleDeleteSubmenu}
                  onSubmenuReorder={handleSubmenuReorder}
                  isEditingSubmenu={isEditingSubmenu}
                  editingSubmenuForMenuItem={editingSubmenuForMenuItem}
                  editingSubmenuIndex={editingSubmenuIndex}
                  submenuEditForm={submenuEditForm}
                  setSubmenuEditForm={setSubmenuEditForm}
                  handleSaveSubmenu={handleSaveSubmenu}
                  handleCancelSubmenu={handleCancelSubmenu}
                  submenuRenderKey={submenuRenderKey}
                  isEditing={isEditing}
                  editingIndex={editingIndex}
                  editForm={editForm}
                  setEditForm={setEditForm}
                  handleSave={handleSave}
                  handleCancel={handleCancel}
                  isDragDisabled={isEditing || isEditingSubmenu}
                />
              );
            })}
          </SortableContext>
        </DndContext>
        
        {value.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <div className="max-w-sm mx-auto">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <PlusIcon className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">No menu items yet</h3>
              <p className="text-xs text-gray-500">
                Click "Add Menu Item" to create your first navigation item.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Add Form - Only for adding new menu items */}
      {isEditing && editingIndex === null && (
        <div className="border border-emerald-300 rounded-lg p-4 bg-emerald-50 space-y-4">
          <h4 className="text-sm font-medium text-emerald-900">
            Add Menu Item
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Display Name *
              </label>
              <input
                type="text"
                value={editForm.display_name || ''}
                onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="e.g., Home, About, Contact"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                URL Path *
              </label>
              <input
                type="text"
                value={editForm.url_name || ''}
                onChange={(e) => setEditForm({ ...editForm, url_name: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="e.g., home, about, contact"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Order
              </label>
              <input
                type="number"
                value={editForm.order || ''}
                onChange={(e) => setEditForm({ ...editForm, order: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                min="1"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Image URL
              </label>
              <input
                type="url"
                value={editForm.image || ''}
                onChange={(e) => setEditForm({ ...editForm, image: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="https://example.com/image.png"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                React Icon ID
              </label>
              <input
                type="number"
                value={editForm.react_icon_id || ''}
                onChange={(e) => setEditForm({ ...editForm, react_icon_id: parseInt(e.target.value) || undefined })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Icon ID from react_icons table"
              />
            </div>
            
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editForm.is_displayed || false}
                  onChange={(e) => setEditForm({ ...editForm, is_displayed: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                />
                <span className="text-xs font-medium text-gray-700">Visible in Menu</span>
              </label>
              
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editForm.is_displayed_on_footer || false}
                  onChange={(e) => setEditForm({ ...editForm, is_displayed_on_footer: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                />
                <span className="text-xs font-medium text-gray-700">Show in Footer</span>
              </label>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleCancel}
              className="px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!editForm.display_name || !editForm.url_name}
              className="px-3 py-2 text-xs font-medium text-white bg-emerald-600 border border-transparent rounded-md hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Menu Item
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
