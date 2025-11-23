/**
 * useInventory Hook
 * 
 * Manages inventory data and operations
 * Similar to useFeatures hook architecture
 */

import { useState, useCallback } from 'react';

interface Inventory {
  id: string;
  created_at: string;
  quantity: number;
  minimum_threshold: number;
  status: string;
  pricing_plan_id: string;
  permanent_presence: boolean;
  planned_delivery_quantity: number | null;
  earliest_planned_delivery_date: string | null;
  description: string | null;
}

interface InventoryFormData {
  quantity: number;
  minimum_threshold: number;
  status: string;
  pricing_plan_id: string;
  permanent_presence: boolean;
  planned_delivery_quantity: number | null;
  earliest_planned_delivery_date: string | null;
  description: string;
}

interface UseInventoryProps {
  organizationId: string | null;
  onToast: (message: string, type: 'success' | 'error') => void;
}

export function useInventory({ organizationId, onToast }: UseInventoryProps) {
  const [inventories, setInventories] = useState<Inventory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all inventories
  const fetchInventories = useCallback(async () => {
    if (!organizationId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/inventory?organization_id=${organizationId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch inventories');
      }

      const data = await response.json();
      setInventories(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(message);
      onToast(message, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, onToast]);

  // Create inventory
  const createInventory = useCallback(async (formData: InventoryFormData) => {
    if (!organizationId) {
      onToast('Organization ID is required', 'error');
      return;
    }

    try {
      const response = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          organization_id: organizationId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create inventory');
      }

      const newInventory = await response.json();
      setInventories(prev => [...prev, newInventory]);
      onToast('Inventory created successfully', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error occurred';
      onToast(message, 'error');
      throw err;
    }
  }, [organizationId, onToast]);

  // Update inventory
  const updateInventory = useCallback(async (id: string, updates: Partial<InventoryFormData>) => {
    try {
      const response = await fetch('/api/inventory', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      });

      if (!response.ok) {
        throw new Error('Failed to update inventory');
      }

      const updatedInventory = await response.json();
      setInventories(prev => prev.map(inv => inv.id === id ? updatedInventory : inv));
      onToast('Inventory updated successfully', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error occurred';
      onToast(message, 'error');
      throw err;
    }
  }, [onToast]);

  // Delete inventory
  const deleteInventory = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/inventory?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete inventory');
      }

      setInventories(prev => prev.filter(inv => inv.id !== id));
      onToast('Inventory deleted successfully', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error occurred';
      onToast(message, 'error');
      throw err;
    }
  }, [onToast]);

  return {
    inventories,
    isLoading,
    error,
    fetchInventories,
    createInventory,
    updateInventory,
    deleteInventory,
  };
}
