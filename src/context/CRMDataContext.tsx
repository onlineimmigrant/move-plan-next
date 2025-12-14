'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import useSWR from 'swr';

interface CRMDataContextProps {
  profileId: string;
}

interface CRMDataContextValue {
  bookings: {
    data: any[];
    isLoading: boolean;
    error: any;
    mutate: () => void;
  };
  tickets: {
    data: any[];
    isLoading: boolean;
    error: any;
    mutate: () => void;
  };
  cases: {
    data: any[];
    isLoading: boolean;
    error: any;
    mutate: () => void;
  };
}

const CRMDataContext = createContext<CRMDataContextValue | null>(null);

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch');
  const data = await response.json();
  return data;
};

export function CRMDataProvider({ profileId, children }: { profileId: string; children: ReactNode }) {
  // Fetch all data with SWR - automatic caching, deduplication, revalidation
  const { data: bookingsData, error: bookingsError, isLoading: bookingsLoading, mutate: mutateBookings } = useSWR(
    `/api/crm/profiles/${profileId}/appointments`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 minute deduplication
      revalidateOnMount: true,
    }
  );

  const { data: ticketsData, error: ticketsError, isLoading: ticketsLoading, mutate: mutateTickets } = useSWR(
    `/api/crm/profiles/${profileId}/tickets`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
      revalidateOnMount: true,
    }
  );

  const { data: casesData, error: casesError, isLoading: casesLoading, mutate: mutateCases } = useSWR(
    `/api/crm/profiles/${profileId}/cases`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
      revalidateOnMount: true,
    }
  );

  const value: CRMDataContextValue = {
    bookings: {
      data: bookingsData?.bookings || [],
      isLoading: bookingsLoading,
      error: bookingsError,
      mutate: mutateBookings,
    },
    tickets: {
      data: ticketsData?.tickets || [],
      isLoading: ticketsLoading,
      error: ticketsError,
      mutate: mutateTickets,
    },
    cases: {
      data: casesData?.cases || [],
      isLoading: casesLoading,
      error: casesError,
      mutate: mutateCases,
    },
  };

  return <CRMDataContext.Provider value={value}>{children}</CRMDataContext.Provider>;
}

export function useCRMData() {
  const context = useContext(CRMDataContext);
  if (!context) {
    throw new Error('useCRMData must be used within CRMDataProvider');
  }
  return context;
}
