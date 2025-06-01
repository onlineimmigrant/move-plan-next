// app/components/HomePage.tsx
"use client";

import React, { Suspense, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Lazy load components
const Hero = dynamic(() => import('@/components/HomePageSections/Hero'), { ssr: false });
const Brands = dynamic(() => import('@/components/HomePageSections/Brands'), { ssr: false });
const FAQSection = dynamic(() => import('@/components/HomePageSections/FAQSection'), { ssr: false });

interface HeroData {
  h1_title: string;
  h1_text_color: string; // Added
  is_h1_gradient_text?: boolean; // Added
  h1_text_color_gradient_from: string; // Added
  h1_text_color_gradient_via: string; // Added
  h1_text_color_gradient_to: string; // Added
  p_description: string;
  p_description_color: string;
  background_color_home_page?: string;
  is_bg_gradient?: boolean;
  h1_title_color_id?: string;
  h1_via_gradient_color_id?: string;
  h1_to_gradient_color_id?: string;
  image_url?: string;
  is_image_full_page?: boolean;
  is_seo_title?: boolean;
  seo_title?: string;
  h1_text_size_mobile?: string;
  h1_text_size?: string;
  title_alighnement?: string;
  title_block_width?: string;
  title_block_columns?: number;
  p_description_size?: string;
  p_description_size_mobile?: string;
  p_description_weight?: string;
  image_first?: boolean;
  organization_id: string | null;
}

interface Brand {
  id: string;
  web_storage_address: string;
  name: string;
  organization_id: string | null;
}

import { FAQ } from '@/types/faq';

interface HomePageData {
  hero: HeroData;
  brands: Brand[];
  faqs: FAQ[];
  brands_heading: string;
  labels_default?: {
    button_main_get_started?: { url: string; text: string };
    button_explore?: string;
  };
}

const HomePage: React.FC = () => {
  const [data, setData] = useState<HomePageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [heroResponse, brandsResponse, faqsResponse] = await Promise.all([
          fetch('/api/hero'),
          fetch('/api/brands'),
          fetch('/api/faqs'),
        ]);

        const heroData = await heroResponse.json();
        const brandsData = await brandsResponse.json();
        const faqsData = await faqsResponse.json();

        if (!heroResponse.ok) {
          throw new Error(heroData.error || 'Failed to fetch hero data');
        }
        if (!brandsResponse.ok) {
          throw new Error(brandsData.error || 'Failed to fetch brands data');
        }
        if (!faqsResponse.ok) {
          throw new Error(faqsData.error || 'Failed to fetch FAQs data');
        }

        setData({
          hero: {
            ...heroData,
            h1_title: heroData.h1_title || 'Welcome to Our Platform',
            h1_text_color: heroData.h1_text_color || 'gray-900', // Fallback
            is_h1_gradient_text: heroData.is_h1_gradient_text ?? false, // Fallback
            h1_text_color_gradient_from: heroData.h1_text_color_gradient_from || 'gray-900', // Fallback
            h1_text_color_gradient_via: heroData.h1_text_color_gradient_via || 'gray-700', // Fallback
            h1_text_color_gradient_to: heroData.h1_text_color_gradient_to || 'gray-500', // Fallback
            p_description: heroData.p_description || 'Discover our services.',
            p_description_color: heroData.p_description_color || '#000000',
            h1_title_color_id: heroData.h1_title_color_id || '',
            organization_id: heroData.organization_id || null,
          },
          brands: brandsData || [],
          faqs: faqsData || [],
          brands_heading: '',
          labels_default: {
            button_main_get_started: { url: '/products', text: 'Get Started' },
            button_explore: 'Explore',
          },
        });
      } catch (err: unknown) {
        console.error('Error fetching data:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch data. Please try again later.';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center py-12">{error}</div>;
  }

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