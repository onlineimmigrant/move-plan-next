'use client';
import { Banner } from '@/components/banners/types';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { fetchBanners, dismissBanner as supabaseDismissBanner } from '@/lib/supabase'; // Alias to avoid conflicts
import { usePathname } from 'next/navigation';
import { useAuth } from './AuthContext';

// Parse interval string to milliseconds
const parseIntervalToMs = (interval: string | undefined): number => {
  if (!interval) return 60 * 1000; // Default: 1 minute
  const match = interval.match(/^(\d+)\s*(minute|minutes|hour|hours|day|days|month|months|year|years)$/i);
  if (!match) return 60 * 1000; // Fallback: 1 minute
  const value = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();
  switch (unit) {
    case 'minute':
    case 'minutes':
      return value * 60 * 1000;
    case 'hour':
    case 'hours':
      return value * 60 * 60 * 1000;
    case 'day':
    case 'days':
      return value * 24 * 60 * 60 * 1000;
    case 'month':
    case 'months':
      return value * 30 * 24 * 60 * 60 * 1000; // Approximate
    case 'year':
    case 'years':
      return value * 365 * 24 * 60 * 60 * 1000; // Approximate
    default:
      return 60 * 1000; // Fallback
  }
};

type BannerContextType = {
  banners: Banner[];
  openBanner: (bannerId: string, openState: Banner['openState']) => void;
  closeBanner: (bannerId: string) => void;
  dismissBanner: (bannerId: string) => void;
};

const BannerContext = createContext<BannerContextType | undefined>(undefined);

export const useBanner = () => {
  const context = useContext(BannerContext);
  if (!context) {
    throw new Error('useBanner must be used within a BannerProvider');
  }
  return context;
};

export const BannerProvider = ({ children }: { children: React.ReactNode }) => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const pathname = usePathname();
  const { session } = useAuth();

  const getDismissedBannerIds = () => {
    if (!session?.user) {
      // For anonymous users, use local storage with expiration
      const dismissed = localStorage.getItem('dismissedBannerIds');
      if (!dismissed) return [];
      const parsed = JSON.parse(dismissed) as { id: string; expiresAt: string }[];
      const now = new Date().getTime();
      // Filter out expired dismissals
      const validDismissals = parsed.filter((d) => new Date(d.expiresAt).getTime() > now);
      // Update local storage if expired dismissals were removed
      if (validDismissals.length < parsed.length) {
        localStorage.setItem('dismissedBannerIds', JSON.stringify(validDismissals));
      }
      return validDismissals.map((d) => d.id);
    }
    return []; // For authenticated users, dismissals are fetched from Supabase
  };

  const setDismissedBannerIds = (bannerId: string, dismissalDuration: string | undefined) => {
    if (!session?.user) {
      // For anonymous users, update local storage with expiration
      const dismissed = localStorage.getItem('dismissedBannerIds');
      const currentDismissals = dismissed ? JSON.parse(dismissed) : [];
      const expiresAt = new Date(Date.now() + parseIntervalToMs(dismissalDuration));
      const updatedDismissals = [
        ...currentDismissals.filter((d: { id: string }) => d.id !== bannerId),
        { id: bannerId, expiresAt: expiresAt.toISOString() },
      ];
      localStorage.setItem('dismissedBannerIds', JSON.stringify(updatedDismissals));
    }
  };

  const fetchAndSetBanners = useCallback(async () => {
    const fetchedBanners = await fetchBanners(pathname, session?.user?.id);
    const dismissedBannerIds = getDismissedBannerIds();
    setBanners(
      fetchedBanners.map((banner) => ({
        ...banner,
        isOpen: false,
        isDismissed: dismissedBannerIds.includes(banner.id) || banner.isDismissed,
      }))
    );
  }, [pathname, session]);

  useEffect(() => {
    fetchAndSetBanners();
  }, [fetchAndSetBanners]);

  const openBanner = (bannerId: string, openState: Banner['openState']) => {
    setBanners((prevBanners) =>
      prevBanners.map((banner) =>
        banner.id === bannerId ? { ...banner, isOpen: true, openState } : banner
      )
    );
  };

  const closeBanner = (bannerId: string) => {
    setBanners((prevBanners) =>
      prevBanners.map((banner) =>
        banner.id === bannerId ? { ...banner, isOpen: false } : banner
      )
    );
  };

  const dismissBanner = async (bannerId: string) => {
    const banner = banners.find((b) => b.id === bannerId);
    if (session?.user?.id) {
      // For authenticated users, use Supabase
      await supabaseDismissBanner(bannerId, session.user.id, banner?.dismissal_duration);
    } else {
      // For anonymous users, update local storage
      setDismissedBannerIds(bannerId, banner?.dismissal_duration);
    }
    setBanners((prevBanners) =>
      prevBanners.map((banner) =>
        banner.id === bannerId ? { ...banner, isDismissed: true } : banner
      )
    );
  };

  return (
    <BannerContext.Provider value={{ banners, openBanner, closeBanner, dismissBanner }}>
      {children}
    </BannerContext.Provider>
  );
};