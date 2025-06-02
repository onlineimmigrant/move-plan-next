// /app/HomePage.tsx
"use client";

import React, { Suspense, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { FAQ } from '@/types/faq';

// Lazy load components
const Hero = dynamic(() => import('@/components/HomePageSections/Hero'), { ssr: false });
const Brands = dynamic(() => import('@/components/HomePageSections/Brands'), { ssr: false });
const FAQSection = dynamic(() => import('@/components/HomePageSections/FAQSection'), { ssr: false });

interface HeroData {
  h1_title: string;
  h1_text_color: string;
  is_h1_gradient_text?: boolean;
  h1_text_color_gradient_from: string;
  h1_text_color_gradient_via: string;
  h1_text_color_gradient_to: string;
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

interface TemplateSection {
  id: string;
  section_title: string;
  section_description: string;
  website_metric: any[];
}

interface HomePageData {
  hero: HeroData;
  brands: Brand[];
  faqs: FAQ[];
  templateSections: TemplateSection[];
  brands_heading: string;
  labels_default?: {
    button_main_get_started?: { url: string; text: string };
    button_explore?: string;
  };
}

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
        <Hero hero={data.hero} labelsDefault={data.labels_default} templateSections={data.templateSections} />
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