'use client';
import { Banner } from '@/components/banners/types';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { fetchBanners, dismissBanner as supabaseDismissBanner } from '@/lib/supabase';
import { usePathname } from 'next/navigation';
import { useAuth } from './AuthContext';

const parseIntervalToMs = (interval: string | undefined): number => {
  if (!interval) return 60 * 1000;
  const match = interval.match(/^(\d+)\s*(minute|minutes|hour|hours|day|days|month|months|year|years)$/i);
  if (!match) return 60 * 1000;
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
      return value * 30 * 24 * 60 * 60 * 1000;
    case 'year':
    case 'years':
      return value * 365 * 24 * 60 * 60 * 1000;
    default:
      return 60 * 1000;
  }
};

type BannerContextType = {
  banners: Banner[];
  openBanner: (bannerId: string, openState: Banner['openState']) => void;
  closeBanner: (bannerId: string) => void;
  dismissBanner: (bannerId: string) => void;
  getFixedBannersHeight: () => number;
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
      const dismissed = localStorage.getItem('dismissedBannerIds');
      if (!dismissed) return [];
      const parsed = JSON.parse(dismissed) as { id: string; expiresAt: string }[];
      const now = new Date().getTime();
      const validDismissals = parsed.filter((d) => new Date(d.expiresAt).getTime() > now);
      if (validDismissals.length < parsed.length) {
        localStorage.setItem('dismissedBannerIds', JSON.stringify(validDismissals));
      }
      return validDismissals.map((d) => d.id);
    }
    return [];
  };

  const setDismissedBannerIds = (bannerId: string, dismissalDuration: string | undefined) => {
    if (!session?.user) {
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
    try {
      const fetchedBanners = await fetchBanners(pathname, session?.user?.id);
      console.log('Fetched banners in context:', JSON.stringify(fetchedBanners, null, 2));
      const dismissedBannerIds = getDismissedBannerIds();
      const mappedBanners: Banner[] = fetchedBanners.map((banner) => {
        const isFixed = banner.is_fixed_above_navbar;
        const mappedBanner: Banner = {
          ...banner,
          isOpen: banner.isOpen,
          isDismissed: dismissedBannerIds.includes(banner.id) || banner.isDismissed,
        //  isFixedAboveNavbar: isFixed,
          is_fixed_above_navbar: isFixed,
        };
        console.log(
          `Mapped banner ${banner.id}: is_fixed_above_navbar=${banner.is_fixed_above_navbar}, isFixedAboveNavbar=${isFixed}`,
          JSON.stringify(mappedBanner, null, 2)
        );
        return mappedBanner;
      });
      console.log('Final banners set in state:', JSON.stringify(mappedBanners, null, 2));
      setBanners(mappedBanners);
    } catch (error) {
      console.error('Error fetching banners:', error);
      setBanners([]);
    }
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
      await supabaseDismissBanner(bannerId, session.user.id, banner?.dismissal_duration);
    } else {
      setDismissedBannerIds(bannerId, banner?.dismissal_duration);
    }
    setBanners((prevBanners) =>
      prevBanners.map((banner) =>
        banner.id === bannerId ? { ...banner, isDismissed: true } : banner
      )
    );
  };

  const getFixedBannersHeight = useCallback(() => {
    const fixedBanners = banners.filter(
      (b) => b.isFixedAboveNavbar && !b.isDismissed && b.position === 'top'
    );
    const height = fixedBanners.length * 56; // 3rem = 48px
    console.log('Fixed banners for height calc:', JSON.stringify(fixedBanners, null, 2));
    console.log('Calculated fixed banners height:', height);
    return height;
  }, [banners]);

  return (
    <BannerContext.Provider value={{ banners, openBanner, closeBanner, dismissBanner, getFixedBannersHeight }}>
      {children}
    </BannerContext.Provider>
  );
};