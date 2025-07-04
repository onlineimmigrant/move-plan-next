'use client';
import { useBanner } from '@/context/BannerContext';
import { Banner } from '@/components/banners/Banner';
import { useMemo } from 'react';

export default function BannerDisplay() {
  const { banners } = useBanner();

  console.log('BannerDisplay rendering with banners:', banners);

  const fixedBanners = useMemo(
    () => banners.filter((banner) => banner.isFixedAboveNavbar && !banner.isOpen && !banner.isDismissed && banner.position === 'top'),
    [banners]
  );
  const nonFixedBanners = useMemo(
    () => banners.filter((banner) => !banner.isFixedAboveNavbar || banner.isOpen || banner.position !== 'top'),
    [banners]
  );

  if (!banners.length) {
    console.log('No banners to display');
    return null;
  }

  return (
    <>
      {fixedBanners.map((banner, index) => (
        <Banner key={banner.id} banner={banner} index={index} />
      ))}
      {nonFixedBanners.map((banner, index) => (
        <Banner key={banner.id} banner={banner} index={index} />
      ))}
    </>
  );
}