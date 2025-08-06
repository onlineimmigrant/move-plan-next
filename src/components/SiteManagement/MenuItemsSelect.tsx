import React, { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, ChevronUpDownIcon } from '@heroicons/react/24/outline';

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

interface MenuItemsSelectProps {
  label: string;
  name: string;
  value: MenuItem[];
  onChange: (name: string, value: MenuItem[]) => void;
}

export const MenuItemsSelect: React.FC<MenuItemsSelectProps> = ({
  label,
  name,
  value = [],
  onChange
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<MenuItem>>({});

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

  const handleEdit = (index: number) => {
    setEditForm({ ...value[index] });
    setEditingIndex(index);
    setIsEditing(true);
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

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newValue = [...value];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (newIndex >= 0 && newIndex < newValue.length) {
      // Swap items
      [newValue[index], newValue[newIndex]] = [newValue[newIndex], newValue[index]];
      
      // Update order values
      newValue.forEach((item, i) => {
        item.order = i + 1;
      });
      
      onChange(name, newValue);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
        <button
          type="button"
          onClick={handleAdd}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-sky-600 bg-sky-50 border border-sky-200 rounded-md hover:bg-sky-100 transition-colors"
        >
          <PlusIcon className="h-4 w-4" />
          Add Menu Item
        </button>
      </div>

      {/* Menu Items List */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {value.map((item, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900 truncate">
                  {item.display_name}
                </span>
                <span className="text-xs text-gray-500">
                  /{item.url_name}
                </span>
                {!item.is_displayed && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                    Hidden
                  </span>
                )}
                {item.is_displayed_on_footer && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                    Footer
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Order: {item.order}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => moveItem(index, 'up')}
                disabled={index === 0}
                className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Move up"
              >
                <ChevronUpDownIcon className="h-4 w-4 rotate-180" />
              </button>
              <button
                type="button"
                onClick={() => moveItem(index, 'down')}
                disabled={index === value.length - 1}
                className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Move down"
              >
                <ChevronUpDownIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => handleEdit(index)}
                className="p-1 text-gray-400 hover:text-blue-600"
                title="Edit"
              >
                <PencilIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => handleDelete(index)}
                className="p-1 text-gray-400 hover:text-red-600"
                title="Delete"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
        
        {value.length === 0 && (
          <div className="text-center py-8 text-gray-500 text-sm">
            No menu items yet. Click "Add Menu Item" to get started.
          </div>
        )}
      </div>

      {/* Edit/Add Form */}
      {isEditing && (
        <div className="border border-gray-300 rounded-lg p-4 bg-white space-y-4">
          <h4 className="text-sm font-medium text-gray-900">
            {editingIndex !== null ? 'Edit Menu Item' : 'Add Menu Item'}
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
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
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
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
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
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                min="1"
              />
            </div>
            
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editForm.is_displayed || false}
                  onChange={(e) => setEditForm({ ...editForm, is_displayed: e.target.checked })}
                  className="w-4 h-4 text-sky-600 border-gray-300 rounded focus:ring-sky-500"
                />
                <span className="text-xs font-medium text-gray-700">Visible in Menu</span>
              </label>
              
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editForm.is_displayed_on_footer || false}
                  onChange={(e) => setEditForm({ ...editForm, is_displayed_on_footer: e.target.checked })}
                  className="w-4 h-4 text-sky-600 border-gray-300 rounded focus:ring-sky-500"
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
              className="px-3 py-2 text-xs font-medium text-white bg-sky-600 border border-transparent rounded-md hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {editingIndex !== null ? 'Update' : 'Add'} Menu Item
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
