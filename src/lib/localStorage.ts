import { fetchDismissedBanners, dismissBanner } from './supabase';

// Interface for dismissed banner with expiration
interface DismissedBanner {
  id: string;
  expiresAt: string;
}

// Parse interval string to milliseconds (same as BannerContext.tsx)
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

export const getDismissedBanners = (): DismissedBanner[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem('dismissedBannerIds'); // Align with BannerContext.tsx
  if (!stored) return [];
  const parsed = JSON.parse(stored) as DismissedBanner[];
  const now = new Date().getTime();
  // Filter out expired dismissals
  const validDismissals = parsed.filter((d) => new Date(d.expiresAt).getTime() > now);
  // Update local storage
  if (validDismissals.length < parsed.length) {
    localStorage.setItem('dismissedBannerIds', JSON.stringify(validDismissals));
  }
  return validDismissals;
};

export const setDismissedBanners = (banners: DismissedBanner[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('dismissedBannerIds', JSON.stringify(banners));
};

export const syncDismissedBanners = async (userId?: string) => {
  const localDismissed = getDismissedBanners();
  const supabaseDismissed = await fetchDismissedBanners(userId);

  // Merge local and Supabase dismissals (by id, keeping local expiresAt)
  const localMap = new Map(localDismissed.map((d) => [d.id, d]));
  const allDismissed = [
    ...localDismissed,
    ...supabaseDismissed
      .filter((id) => !localMap.has(id))
      .map((id) => ({
        id,
        expiresAt: new Date(Date.now() + parseIntervalToMs('1 minute')).toISOString(), // Default for Supabase dismissals
      })),
  ];

  // Update local storage
  setDismissedBanners(allDismissed);

  // Sync local dismissals to Supabase for anonymous users
  if (!userId) {
    for (const { id: bannerId, expiresAt } of localDismissed) {
      if (!supabaseDismissed.includes(bannerId)) {
        // Use default 1-minute duration for global dismissals
        await dismissBanner(bannerId, 'anonymous', '1 minute'); // Use 'anonymous' as userId for global
      }
    }
  }

  return allDismissed.map((d) => d.id);
};