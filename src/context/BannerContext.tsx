'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Banner, BannerOpenState } from '../components/banners/types';
import { fetchBanners, fetchDismissedBanners, dismissBanner as supabaseDismissBanner } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface BannerContextType {
  banners: Banner[];
  openBanner: (id: string, openState: BannerOpenState) => void;
  closeBanner: (id: string) => void;
  dismissBanner: (id: string) => void;
}

const BannerContext = createContext<BannerContextType | undefined>(undefined);

export const BannerProvider = ({ children }: { children: React.ReactNode }) => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const pathname = usePathname();
  const { session } = useAuth();
  const userId = session?.user?.id;

  useEffect(() => {
    async function loadBanners() {
      const fetchedBanners = await fetchBanners(pathname, userId);
      const dismissedIds = await fetchDismissedBanners(userId);
      setBanners(
        fetchedBanners.map((banner) => ({
          ...banner,
          isDismissed: dismissedIds.includes(banner.id),
        }))
      );
    }
    loadBanners();
  }, [pathname, userId]);

  const openBanner = (id: string, openState: BannerOpenState) => {
    if (openState === 'absent') return;
    setBanners((prev) =>
      prev.map((banner) =>
        banner.id === id ? { ...banner, isOpen: true, openState } : banner
      )
    );
  };

  const closeBanner = (id: string) => {
    setBanners((prev) =>
      prev.map((banner) =>
        banner.id === id ? { ...banner, isOpen: false } : banner
      )
    );
  };

  const dismissBanner = async (id: string) => {
    setBanners((prev) =>
      prev.map((banner) =>
        banner.id === id ? { ...banner, isDismissed: true } : banner
      )
    );
    await supabaseDismissBanner(id, userId);
  };

  return (
    <BannerContext.Provider value={{ banners, openBanner, closeBanner, dismissBanner }}>
      {children}
    </BannerContext.Provider>
  );
};

export const useBanner = () => {
  const context = useContext(BannerContext);
  if (!context) throw new Error('useBanner must be used within BannerProvider');
  return context;
};