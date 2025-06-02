"use client";

import React, { Suspense, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { HomePageData } from '@/types/home_page_data';

// Lazy load components
const Hero = dynamic(() => import('@/components/HomePageSections/Hero'), { ssr: false });
const Brands = dynamic(() => import('@/components/HomePageSections/Brands'), { ssr: false });
const FAQSection = dynamic(() => import('@/components/HomePageSections/FAQSection'), { ssr: false });

interface HomePageProps {
  data: HomePageData;
}

const HomePage: React.FC<HomePageProps> = ({ data }) => {
  useEffect(() => {
    console.log('HomePage data:', data);
  }, [data]);

  if (!data || !data.hero) {
    return <div className="text-red-500 text-center py-12">Error: Hero data is missing.</div>;
  }

  return (
    <div>
      <Suspense fallback={<div>Loading Hero...</div>}>
        <Hero hero={data.hero} labelsDefault={data.labels_default} />
      </Suspense>

      <Suspense fallback={<div>Loading Brands...</div>}>
        <Brands brands={data.brands || []} textContent={{ brands_heading: data.brands_heading || '' }} />
      </Suspense>

      <Suspense fallback={<div>Loading FAQs...</div>}>
        <div className="">
          <FAQSection faqs={data.faqs || []} />
        </div>
      </Suspense>
    </div>
  );
};

export default HomePage;