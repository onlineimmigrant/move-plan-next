import { useState } from 'react';
import type { ServiceCapacity } from '@/types/orders';

export function useServiceCapacity() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAvailableSlots = async (params: {
    pricingplan_id: string;
    staff_id?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<ServiceCapacity[]> => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      queryParams.append('pricingplan_id', params.pricingplan_id);
      if (params.staff_id) queryParams.append('staff_id', params.staff_id);
      if (params.start_date) queryParams.append('start_date', params.start_date);
      if (params.end_date) queryParams.append('end_date', params.end_date);

      const response = await fetch(`/api/service-capacity/slots?${queryParams.toString()}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch time slots');
      }

      return data.slots || [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch time slots';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const reserveSlot = async (capacityId: string, durationMinutes: number = 10): Promise<string | undefined> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/service-capacity/slots', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          capacity_id: capacityId,
          duration_minutes: durationMinutes,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to reserve time slot');
      }

      return data.reserved_until;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reserve time slot';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const releaseReservation = async (capacityId: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/service-capacity/slots?capacity_id=${capacityId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to release reservation');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to release reservation';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    getAvailableSlots,
    reserveSlot,
    releaseReservation,
  };
}
