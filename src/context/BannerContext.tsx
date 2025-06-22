// src/context/BannerContext.tsx
'use client';

import { Banner, BannerContent, BannerOpenState, BannerPosition } from '@/components/banners/types';
import { createContext, useCallback, useContext, useEffect, useState, useMemo } from 'react';
import { fetchBanners, dismissBanner as supabaseDismissBanner } from '@/lib/supabase';
import { usePathname } from 'next/navigation';
import { useAuth } from './AuthContext';
import { debounce } from 'lodash';

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
  const cache = useMemo(() => new Map<string, Banner[]>(), []);

  const getDismissedBannerIds = useCallback(() => {
    if (!session?.user) {
      const dismissed = localStorage.getItem('dismissedBannerIds');
      if (!dismissed) return [];
      const parsed = JSON.parse(dismissed) as { id: string; expiresAt: string }[];
      const now = Date.now();
      const validDismissals = parsed.filter((d) => new Date(d.expiresAt).getTime() > now);
      if (validDismissals.length < parsed.length) {
        localStorage.setItem('dismissedBannerIds', JSON.stringify(validDismissals));
      }
      return validDismissals.map((d) => d.id);
    }
    return [];
  }, [session]);

  const setDismissedBannerIds = useCallback((bannerId: string, dismissalDuration: string | undefined) => {
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
  }, [session]);

  const fetchAndSetBanners = useCallback(
    debounce(async () => {
      try {
        const cacheKey = `${pathname}-${session?.user?.id || 'anonymous'}`;
        if (cache.has(cacheKey)) {
          setBanners(cache.get(cacheKey)!);
          console.log('Using cached banners for:', cacheKey);
          return;
        }

        const start = Date.now();
        const fetchedBanners = await fetchBanners(pathname, session?.user?.id);
        console.log('Banners fetch duration:', Date.now() - start, 'ms');
        console.log('Fetched banners in context:', JSON.stringify(fetchedBanners, null, 2));
        const dismissedBannerIds = getDismissedBannerIds();
        console.log('Dismissed Banner IDs in context:', dismissedBannerIds);
        const mappedBanners: Banner[] = fetchedBanners.map((banner) => {
          const isFixed = Boolean(banner.is_fixed_above_navbar ?? false);
          const content: BannerContent = banner.content ?? { text: '' };
          const mappedBanner: Banner = {
            id: banner.id,
            position: banner.position ?? 'top',
            type: banner.type ?? 'permanent',
            is_enabled: banner.is_enabled ?? true,
            content,
            landing_content: (banner as any).landing_content ?? null, // Kept as requested
            openState: banner.openState ?? 'full',
            dismissal_duration: banner.dismissal_duration,
            page_paths: banner.page_paths ?? null,
            isOpen: banner.isOpen ?? false,
            isDismissed: dismissedBannerIds.includes(banner.id) || banner.isDismissed || false,
            isFixedAboveNavbar: isFixed,
            is_fixed_above_navbar: isFixed,
          };
          console.log(
            `Mapped banner ${banner.id}: isFixedAboveNavbar=${isFixed}, isDismissed=${mappedBanner.isDismissed}`,
            JSON.stringify(mappedBanner, null, 2)
          );
          return mappedBanner;
        });
        console.log('Final banners set in state:', JSON.stringify(mappedBanners, null, 2));
        cache.set(cacheKey, mappedBanners);
        setBanners((prev) => {
          if (JSON.stringify(prev) !== JSON.stringify(mappedBanners)) {
            return mappedBanners;
          }
          return prev;
        });
      } catch (error) {
        console.error('Error fetching banners:', error);
        setBanners([]);
      }
    }, 1000),
    [pathname, session, cache, getDismissedBannerIds]
  );

  useEffect(() => {
    fetchAndSetBanners();
    return () => fetchAndSetBanners.cancel();
  }, [fetchAndSetBanners]);

  const openBanner = useCallback((bannerId: string, openState: Banner['openState']) => {
    setBanners((prevBanners) =>
      prevBanners.map((banner) =>
        banner.id === bannerId ? { ...banner, isOpen: true, openState } : banner
      )
    );
  }, []);

  const closeBanner = useCallback((bannerId: string) => {
    setBanners((prevBanners) =>
      prevBanners.map((banner) =>
        banner.id === bannerId ? { ...banner, isOpen: false } : banner
      )
    );
  }, []);

  const dismissBanner = useCallback(async (bannerId: string) => {
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
  }, [banners, session, setDismissedBannerIds]);

  const getFixedBannersHeight = useCallback(() => {
    const fixedBanners = banners.filter(
      (b) => b.isFixedAboveNavbar && !b.isDismissed && b.position === 'top' && b.is_enabled
    );
    const height = fixedBanners.length * 56; // Matches Banner's top-[${index * 3}rem]
    console.log('Fixed banners for height calc:', JSON.stringify(fixedBanners, null, 2));
    console.log('Calculated fixed banners height:', height);
    return height;
  }, [banners]);

  const contextValue = useMemo(
    () => ({
      banners,
      openBanner,
      closeBanner,
      dismissBanner,
      getFixedBannersHeight,
    }),
    [banners, openBanner, closeBanner, dismissBanner, getFixedBannersHeight]
  );

  return (
    <BannerContext.Provider value={contextValue}>
      {children}
    </BannerContext.Provider>
  );
};