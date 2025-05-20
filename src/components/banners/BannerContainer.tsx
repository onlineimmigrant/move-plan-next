// components/banners/BannerContainer.tsx
import { usePathname } from 'next/navigation';
import { useBanner } from '../../context/BannerContext';
import { Banner } from './Banner';
import { hideNavbarFooterPrefixes } from '../../lib/hiddenRoutes';

export const BannerContainer = () => {
  const { banners } = useBanner();
  const pathname = usePathname();

  const shouldShowBanners = !hideNavbarFooterPrefixes.some((prefix) =>
    pathname.startsWith(prefix)
  );

  if (!shouldShowBanners) return null;

  return (
    <>
      {banners.map((banner) => (
        <Banner key={banner.id} banner={banner} />
      ))}
    </>
  );
};