// src/components/BannerDisplay.tsx
'use client';
import { useBanner } from '@/context/BannerContext';
import {Banner} from '@/components/banners/Banner';

export default function BannerDisplay() {
  const { banners } = useBanner();

  console.log('BannerDisplay rendering with banners:', banners);

  if (!banners.length) {
    console.log('No banners to display');
    return null;
  }

  return (
    <>
      {banners.map((banner) => (
        <Banner key={banner.id} banner={banner} />
      ))}
    </>
  );
}