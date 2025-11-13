/**
 * useMenuOperations - Handles menu item and submenu CRUD operations
 */

import { useState } from 'react';
import { MenuItem, SubMenuItem, DeleteConfirmation } from '../types';
import { useToast } from '@/components/Shared/ToastContainer';

interface UseMenuOperationsProps {
  menuItems: MenuItem[];
  setMenuItems: (items: MenuItem[]) => void;
  organizationId: string;
  onRefetch: () => Promise<void>;
}

export function useMenuOperations({
  menuItems,
  setMenuItems,
  organizationId,
  onRefetch
}: UseMenuOperationsProps) {
  const toast = useToast();
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmation>({
    isOpen: false,
    type: null,
    itemId: null,
    itemName: '',
  });

  const handleToggleVisibility = async (itemId: string) => {
    const item = menuItems.find((m) => m.id === itemId);
    if (!item) return;

    try {
      const response = await fetch(`/api/menu-items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_displayed: !item.is_displayed })
      });

      if (!response.ok) throw new Error('Failed to toggle visibility');

      await onRefetch();
    } catch (error) {
      console.error('Failed to toggle visibility:', error);
      toast.error('Failed to update menu item visibility');
    }
  };

  const handleEdit = async (itemId: string, field: 'display_name' | 'description' | 'url_name', value: string) => {
    try {
      const response = await fetch(`/api/menu-items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value })
      });

      if (!response.ok) throw new Error(`Failed to update ${field}`);

      setMenuItems(menuItems.map(item => 
        item.id === itemId ? { ...item, [field]: value } : item
      ));
    } catch (error) {
      console.error('Failed to update menu item:', error);
      toast.error(`Failed to update ${field}`);
    }
  };

  const handleSubmenuEdit = async (
    menuItemId: string,
    submenuId: string,
    field: 'name' | 'description' | 'url_name' | 'image',
    value: string
  ) => {
    try {
      const response = await fetch(`/api/menu-items/${submenuId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value })
      });

      if (!response.ok) throw new Error(`Failed to update submenu ${field}`);

      await onRefetch();
    } catch (error) {
      console.error('Failed to update submenu item:', error);
      toast.error(`Failed to update submenu ${field}`);
    }
  };

  const handleSubmenuToggle = async (menuItemId: string, submenuId: string) => {
    const menuItem = menuItems.find(m => m.id === menuItemId);
    const submenu = menuItem?.submenu_items?.find(s => s.id === submenuId);
    if (!submenu) return;

    try {
      const response = await fetch(`/api/menu-items/${submenuId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_displayed: !(submenu.is_displayed !== false) })
      });

      if (!response.ok) throw new Error('Failed to toggle submenu visibility');

      await onRefetch();
    } catch (error) {
      console.error('Failed to toggle submenu visibility:', error);
      toast.error('Failed to update submenu visibility');
    }
  };

  const handleDelete = (itemId: string) => {
    const item = menuItems.find(i => i.id === itemId);
    if (item) {
      setDeleteConfirm({
        isOpen: true,
        type: 'menu',
        itemId: itemId,
        itemName: item.display_name
      });
    }
  };

  const handleDeleteSubmenuItem = (menuItemId: string, submenuId: string) => {
    const menuItem = menuItems.find(m => m.id === menuItemId);
    const submenuItem = menuItem?.submenu_items?.find(s => s.id === submenuId);
    
    if (submenuItem) {
      setDeleteConfirm({
        isOpen: true,
        type: 'submenu',
        itemId: submenuId,
        itemName: submenuItem.name,
        parentId: menuItemId
      });
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirm.itemId || !deleteConfirm.type) return;

    try {
      const endpoint = deleteConfirm.type === 'menu' 
        ? `/api/menu-items/${deleteConfirm.itemId}`
        : `/api/submenu-items/${deleteConfirm.itemId}`;

      const response = await fetch(endpoint, { method: 'DELETE' });

      if (!response.ok) throw new Error(`Failed to delete ${deleteConfirm.type} item`);

      toast.success(`${deleteConfirm.type === 'menu' ? 'Menu' : 'Submenu'} item "${deleteConfirm.itemName}" deleted successfully`);
      
      await onRefetch();
      setDeleteConfirm({ isOpen: false, type: null, itemId: null, itemName: '' });
    } catch (error) {
      console.error('Failed to delete item:', error);
      toast.error(`Failed to delete ${deleteConfirm.type} item`);
    }
  };

  const handleAddMenuItem = async (name: string) => {
    if (!name.trim()) return;

    try {
      const nextOrder = menuItems.length > 0 
        ? Math.max(...menuItems.map(item => item.order || 0)) + 10
        : 0;

      const newItem = {
        organization_id: organizationId,
        display_name: name.trim(),
        url_name: name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        order: nextOrder,
        is_displayed: true,
        is_displayed_on_footer: false
      };

      const response = await fetch('/api/menu-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem)
      });

      if (!response.ok) throw new Error('Failed to create menu item');

      toast.success(`Menu item "${name.trim()}" created successfully`);
      await onRefetch();
    } catch (error) {
      console.error('Failed to add menu item:', error);
      toast.error('Failed to add menu item. Please try again.');
    }
  };

  const handleAddSubmenuItem = async (menuItemId: string, name: string, urlName: string) => {
    if (!name.trim()) return;

    try {
      const menuItem = menuItems.find(m => m.id === menuItemId);
      const currentSubmenus = menuItem?.submenu_items || [];
      const nextOrder = currentSubmenus.length > 0
        ? Math.max(...currentSubmenus.map(sub => sub.order || 0)) + 10
        : 0;

      const newSubmenuItem = {
        menu_item_id: menuItemId,
        organization_id: organizationId,
        name: name,
        url_name: urlName || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        order: nextOrder,
        is_displayed: true,
        description: ''
      };

      const response = await fetch('/api/submenu-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSubmenuItem)
      });

      if (!response.ok) throw new Error('Failed to create submenu item');

      toast.success(`Submenu item "${name}" created successfully`);
      await onRefetch();
    } catch (error) {
      console.error('Failed to add submenu item:', error);
      toast.error('Failed to add submenu item. Please try again.');
    }
  };

  const handleSubmenuReorder = async (menuItemId: string, reorderedSubmenus: SubMenuItem[]) => {
    try {
      // Update local state immediately for smooth UI
      setMenuItems(menuItems.map(item =>
        item.id === menuItemId
          ? { ...item, submenu_items: reorderedSubmenus }
          : item
      ));

      // Save each submenu item's new order to the database
      const updatePromises = reorderedSubmenus.map(submenu =>
        fetch(`/api/menu-items/${submenu.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order: submenu.order })
        })
      );

      await Promise.all(updatePromises);
      
      toast.success('Submenu order updated successfully');
    } catch (error) {
      console.error('Failed to reorder submenu items:', error);
      toast.error('Failed to update submenu order');
      await onRefetch();
    }
  };

  return {
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
  };
}
