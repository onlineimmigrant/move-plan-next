import React, { useState, useEffect } from 'react';
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
            {...listeners}
            className="p-1 text-gray-300 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-all duration-200 cursor-grab active:cursor-grabbing touch-none"
            aria-label="Drag to reorder submenu item"
            disabled={isDragDisabled}
          >
            <Bars3Icon className="h-3 w-3" />
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-normal text-gray-800 truncate">
                {submenuItem.name}
              </span>

              {!submenuItem.is_visible && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600 border border-red-200">
                  Hidden
                </span>
              )}
              {submenuItem.is_new_window && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-600 border border-blue-200">
                  New Window
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
                value={submenuEditForm.url || ''}
                onChange={(e) => setSubmenuEditForm({ ...submenuEditForm, url: e.target.value })}
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

  // Drag and drop sensors for submenu items
  const submenuSensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle submenu drag and drop reordering
  const handleSubmenuDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id && item.id) {
      const activeId = active.id.toString();
      const overId = over.id.toString();
      
      // Extract indices from the drag IDs
      const activeIndex = menuItemSubmenuItems.findIndex((_, idx) => 
        `submenu-${item.id}-${idx}` === activeId
      );
      const overIndex = menuItemSubmenuItems.findIndex((_, idx) => 
        `submenu-${item.id}-${idx}` === overId
      );

      if (activeIndex !== -1 && overIndex !== -1) {
        const reorderedItems = arrayMove(menuItemSubmenuItems, activeIndex, overIndex);
        
        // Update order values to match new positions
        const updatedItems = reorderedItems.map((submenuItem, idx) => ({
          ...submenuItem,
          order: idx + 1,
        }));

        onSubmenuReorder(item.id, updatedItems);
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

            
            {/* Submenu Items List */}
            <div className="space-y-2">
              <DndContext
                sensors={submenuSensors}
                collisionDetection={closestCenter}
                onDragEnd={handleSubmenuDragEnd}
              >
                <SortableContext
                  items={menuItemSubmenuItems.map((_, idx) => `submenu-${item.id}-${idx}`)}
                  strategy={verticalListSortingStrategy}
                >
                  {menuItemSubmenuItems.map((submenuItem, submenuIndex) => (
                    <SortableSubmenuItem
                      key={submenuItem.id || `submenu-${index}-${submenuIndex}`}
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
                        value={submenuEditForm.url || ''}
                        onChange={(e) => setSubmenuEditForm({ ...submenuEditForm, url: e.target.value })}
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
  url: string;
  description?: string;
  order: number;
  is_new_window?: boolean;
  is_visible?: boolean;
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
  
  // Submenu state
  const [isEditingSubmenu, setIsEditingSubmenu] = useState(false);
  const [editingSubmenuIndex, setEditingSubmenuIndex] = useState<number | null>(null);
  const [editingSubmenuForMenuItem, setEditingSubmenuForMenuItem] = useState<number | null>(null);
  const [submenuEditForm, setSubmenuEditForm] = useState<Partial<SubmenuItem>>({});
  
  // Menu item disclosure state
  const [expandedMenuItems, setExpandedMenuItems] = useState<Set<number>>(new Set());

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
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

  // Handle drag and drop reordering
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = value.findIndex(item => 
        (item.id?.toString() || `temp-${value.indexOf(item)}`) === active.id
      );
      const newIndex = value.findIndex(item => 
        (item.id?.toString() || `temp-${value.indexOf(item)}`) === over.id
      );

      if (oldIndex !== -1 && newIndex !== -1) {
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

  // Submenu handlers
  const getSubmenuItemsForMenuItem = (menuItemId: number) => {
    return submenuItems.filter(item => item.website_menuitem_id === menuItemId);
  };

  const handleAddSubmenu = (menuItemId: number) => {
    const currentSubmenuItems = getSubmenuItemsForMenuItem(menuItemId);
    setSubmenuEditForm({
      name: '',
      url: '',
      description: '',
      website_menuitem_id: menuItemId,
      is_visible: true,
      is_new_window: false,
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
    if (!submenuEditForm.name || !submenuEditForm.url || !onSubmenuChange) return;

    const newSubmenuItem: SubmenuItem = {
      ...submenuEditForm,
      name: submenuEditForm.name!,
      url: submenuEditForm.url!,
      website_menuitem_id: submenuEditForm.website_menuitem_id!,
      is_visible: submenuEditForm.is_visible !== false,
      is_new_window: submenuEditForm.is_new_window || false,
      order: submenuEditForm.order || 1,
      description: submenuEditForm.description || ''
    };

    let newSubmenuItems: SubmenuItem[];
    if (editingSubmenuIndex !== null) {
      // Editing existing submenu item
      newSubmenuItems = [...submenuItems];
      const actualIndex = submenuItems.findIndex((item, idx) => 
        item.website_menuitem_id === editingSubmenuForMenuItem && 
        getSubmenuItemsForMenuItem(editingSubmenuForMenuItem!)[editingSubmenuIndex] === item
      );
      if (actualIndex !== -1) {
        newSubmenuItems[actualIndex] = newSubmenuItem;
      }
    } else {
      // Adding new submenu item
      newSubmenuItems = [...submenuItems, newSubmenuItem];
    }

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
    const newSubmenuItems = submenuItems.filter(item => 
      !(item.website_menuitem_id === submenuItem.website_menuitem_id && 
        item.name === submenuItem.name && 
        item.url === submenuItem.url)
    );
    onSubmenuChange(newSubmenuItems);
  };

  // Submenu reordering handler
  const handleSubmenuReorder = (menuItemId: number, reorderedSubmenuItems: SubmenuItem[]) => {
    // Update the submenu items with new order
    const updatedSubmenuItems = submenuItems.map(submenuItem => {
      if (submenuItem.website_menuitem_id === menuItemId) {
        const newSubmenuItem = reorderedSubmenuItems.find(reordered => 
          reordered.id === submenuItem.id
        );
        return newSubmenuItem || submenuItem;
      }
      return submenuItem;
    });
    
    // Update state with reordered items
    if (onSubmenuChange) {
      onSubmenuChange(updatedSubmenuItems);
    }
  };

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
              
              return (
                <SortableMenuItem
                  key={item.id?.toString() || `temp-${index}`}
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
