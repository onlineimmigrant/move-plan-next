// src/lib/localStorage.ts
import { fetchDismissedBanners, dismissBanner } from './supabase'; // Import missing functions

export const getDismissedBanners = (): string[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem('dismissedBanners');
  return stored ? JSON.parse(stored) : [];
};

export const setDismissedBanners = (banners: string[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('dismissedBanners', JSON.stringify(banners));
};

export const syncDismissedBanners = async (userId?: string) => {
  const localDismissed = getDismissedBanners();
  const supabaseDismissed = await fetchDismissedBanners(userId);

  // Merge local and Supabase dismissals
  const allDismissed = [...new Set([...localDismissed, ...supabaseDismissed])];

  // Update local storage
  setDismissedBanners(allDismissed);

  // Sync local dismissals to Supabase for anonymous users
  if (!userId) {
    for (const bannerId of localDismissed) {
      if (!supabaseDismissed.includes(bannerId)) {
        await dismissBanner(bannerId, undefined); // Global dismissal
      }
    }
  }

  return allDismissed;
};