import React, { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, ChevronUpDownIcon } from '@heroicons/react/24/outline';

interface SubmenuItem {
  id?: number;
  menu_item_id: number;
  name: string;
  name_translation?: Record<string, any>;
  url_name: string;
  order: number;
  description?: string;
  description_translation?: Record<string, any>;
  is_displayed?: boolean;
  organization_id?: string | null;
}

interface SubmenuItemsSelectProps {
  label: string;
  name: string;
  value: SubmenuItem[];
  menuItemId: number;
  onChange: (name: string, value: SubmenuItem[]) => void;
}

export const SubmenuItemsSelect: React.FC<SubmenuItemsSelectProps> = ({
  label,
  name,
  value = [],
  menuItemId,
  onChange
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<SubmenuItem>>({});

  const handleAdd = () => {
    setEditForm({
      name: '',
      url_name: '',
      is_displayed: true,
      menu_item_id: menuItemId,
      order: (value.length || 0) + 1,
      description: ''
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
    if (!editForm.name || !editForm.url_name) return;

    const newItem: SubmenuItem = {
      ...editForm,
      name: editForm.name!,
      url_name: editForm.url_name!,
      menu_item_id: editForm.menu_item_id || menuItemId,
      is_displayed: editForm.is_displayed !== false,
      order: editForm.order || (value.length || 0) + 1,
      description: editForm.description || ''
    };

    let newValue: SubmenuItem[];
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
    <div className="pl-8 space-y-4">
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
          Add Submenu Item
        </button>
      </div>

      {/* Submenu Items List */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {value.map((item, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900 truncate">
                  {item.name}
                </span>
                <span className="text-xs text-gray-500">
                  /{item.url_name}
                </span>
                {item.is_displayed === false && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                    Hidden
                  </span>
                )}
              </div>
              {item.description && (
                <div className="text-xs text-gray-500 mt-1">
                  {item.description}
                </div>
              )}
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
            No submenu items yet. Click "Add Submenu Item" to get started.
          </div>
        )}
      </div>

      {/* Edit/Add Form */}
      {isEditing && (
        <div className="border border-gray-300 rounded-lg p-4 bg-white space-y-4">
          <h4 className="text-sm font-medium text-gray-900">
            {editingIndex !== null ? 'Edit Submenu Item' : 'Add Submenu Item'}
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                value={editForm.name || ''}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                placeholder="e.g., Products, Services, Solutions"
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
                placeholder="e.g., products, services, solutions"
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
            
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editForm.is_displayed !== false}
                  onChange={(e) => setEditForm({ ...editForm, is_displayed: e.target.checked })}
                  className="w-4 h-4 text-sky-600 border-gray-300 rounded focus:ring-sky-500"
                />
                <span className="text-xs font-medium text-gray-700">Visible in Menu</span>
              </label>
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={editForm.description || ''}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              placeholder="Optional description for this submenu item"
              rows={2}
            />
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
              disabled={!editForm.name || !editForm.url_name}
              className="px-3 py-2 text-xs font-medium text-white bg-sky-600 border border-transparent rounded-md hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {editingIndex !== null ? 'Update' : 'Add'} Submenu Item
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
