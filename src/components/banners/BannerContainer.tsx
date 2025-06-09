import { usePathname } from 'next/navigation';
import { useBanner } from '@/context/BannerContext';
import { Banner } from './Banner';
import { hideNavbarFooterPrefixes } from '@/lib/hiddenRoutes';
import { BannerType } from './types';

interface BannerContainerProps {
  banners?: BannerType[];
}

export const BannerContainer = ({ banners }: BannerContainerProps) => {
  const { banners: contextBanners } = useBanner();
  const pathname = usePathname();
  const bannersToRender = banners || contextBanners;

  const shouldShowBanners = !hideNavbarFooterPrefixes.some((prefix) =>
    pathname.startsWith(prefix)
  );

  if (!shouldShowBanners) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[200]">
      {bannersToRender
        .filter((banner) => !banner.isDismissed)
        .map((banner, index) => (
          <Banner key={banner.id} banner={banner} index={index} />
        ))}
    </div>
  );
};

export default BannerContainer;