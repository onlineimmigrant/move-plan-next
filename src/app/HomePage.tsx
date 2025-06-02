// /app/HomePage.tsx
"use client";

import React, { Suspense, useEffect } from 'react';
import dynamic from 'next/dynamic';
import parse from 'html-react-parser';
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

      {/* Render Template Heading Sections */}
      {data.templateHeadingSections.length > 0 ? (
        <div className="mt-12 max-w-5xl mx-auto px-6">
          {data.templateHeadingSections.map((heading) => (
            <div
              key={heading.id}
              className="mb-12"
              style={{
                backgroundColor: heading.background_color || 'transparent',
                fontFamily: heading.font_family || 'inherit',
              }}
            >
              <div
                className={`grid grid-cols-1 gap-8 sm:grid-cols-${heading.image_first ? '2' : '1'} items-center`}
              >
                {heading.image && (
                  <div className={heading.image_first ? 'order-1' : 'order-2'}>
                    <img
                      src={heading.image}
                      alt={heading.name}
                      className="h-auto w-full max-w-md mx-auto object-contain"
                    />
                  </div>
                )}
                <div className={`text-${heading.is_text_link ? 'center' : 'left'} order-${heading.image_first ? '2' : '1'}`}>
                  <h2
                    className={`${heading.text_size_h1_mobile || 'text-3xl'} sm:${heading.text_size_h1 || 'text-4xl'} font-semibold`}
                    style={{
                      color: heading.h1_text_color || heading.text_color || data.hero.h1_text_color || 'gray-700',
                      fontWeight: heading.font_weight_1 || '600',
                    }}
                  >
                    {parse(heading.name)}{' '}
                    {heading.name_part_2 && (
                      <span
                        style={{
                          color: heading.h1_text_color || heading.text_color || data.hero.h1_text_color || 'gray-700',
                          fontWeight: heading.font_weight_1 || '600',
                        }}
                      >
                        {parse(heading.name_part_2)}
                      </span>
                    )}{' '}
                    {heading.name_part_3 && (
                      <span
                        style={{
                          color: heading.h1_text_color || heading.text_color || data.hero.h1_text_color || 'gray-700',
                          fontWeight: heading.font_weight_1 || '600',
                        }}
                      >
                        {parse(heading.name_part_3)}
                      </span>
                    )}
                  </h2>
                  <p
                    className={`mt-4 ${heading.text_size || 'text-lg'}`}
                    style={{
                      color: heading.text_color || data.hero.p_description_color || 'gray-600',
                      fontWeight: heading.font_weight || 'normal',
                    }}
                  >
                    {parse(heading.description_text)}
                  </p>
                  {heading.button_text && heading.url && (
                    <a
                      href={heading.url}
                      className="mt-6 inline-block rounded-full px-6 py-2 text-sm font-medium text-white shadow-sm hover:opacity-80"
                      style={{
                        backgroundColor: heading.button_color || data.hero.h1_text_color || 'gray-700',
                        color: heading.button_text_color || 'white',
                      }}
                    >
                      {heading.button_text}
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
""
      )}

      {/* Render Template Sections */}
      {data.templateSections.length > 0 ? (
        <div className="mt-12 max-w-5xl mx-auto px-6">
          {data.templateSections.map((section) => (
            <div
              key={section.id}
              className="mb-12"
              style={{
                backgroundColor: section.background_color || 'transparent',
                fontFamily: section.font_family || 'inherit',
              }}
            >
              <div
                className={`grid grid-cols-1 gap-8 sm:grid-cols-${section.grid_columns || 1} ${
                  section.is_full_width ? 'w-full' : 'max-w-5xl mx-auto'
                } ${section.is_section_title_aligned_center ? 'text-center' : section.is_section_title_aligned_right ? 'text-right' : 'text-left'}`}
              >
                <h2
                  className={`${section.section_title_size || 'text-2xl'} font-semibold`}
                  style={{
                    color: section.section_title_color || data.hero.h1_text_color || 'gray-700',
                    fontWeight: section.section_title_weight || '600',
                  }}
                >
                  {section.section_title}
                </h2>
                {section.section_description && (
                  <p
                    className={`${section.section_description_size || 'text-lg'}`}
                    style={{
                      color: section.section_description_color || data.hero.p_description_color || 'gray-600',
                      fontWeight: section.section_description_weight || 'normal',
                    }}
                  >
                    {section.section_description}
                  </p>
                )}
                {section.website_metric?.length > 0 && (
                  <ul className="mt-4 space-y-4">
                    {section.website_metric.map((metric: any, idx: number) => (
                      <li
                        key={idx}
                        className={`flex items-center gap-4 ${section.is_image_bottom ? 'flex-col' : 'flex-row'} ${
                          metric.is_card_type ? 'p-4 rounded-lg shadow-md' : ''
                        }`}
                        style={{
                          backgroundColor: metric.background_color || 'transparent',
                        }}
                      >
                        {metric.image && !section.is_image_bottom && (
                          <img
                            src={metric.image}
                            alt={metric.title}
                            className={`h-${section.image_metrics_height || '8'} w-${section.image_metrics_height || '8'} ${
                              metric.is_image_rounded_full ? 'rounded-full' : ''
                            }`}
                          />
                        )}
                        <div className="flex-1">
                          {metric.is_title_displayed && (
                            <span
                              className={`${section.metric_title_size || 'text-lg'} font-medium`}
                              style={{
                                color: section.metric_title_color || data.hero.h1_text_color || 'gray-700',
                                fontWeight: section.metric_title_weight || '500',
                              }}
                            >
                              {metric.title}
                            </span>
                          )}
                          {metric.is_title_displayed && metric.description && <span>: </span>}
                          <span
                            className={`${section.metric_description_size || 'text-base'}`}
                            style={{
                              color: section.metric_description_color || data.hero.p_description_color || 'gray-600',
                              fontWeight: section.metric_description_weight || 'normal',
                            }}
                          >
                            {metric.description}
                          </span>
                        </div>
                        {metric.image && section.is_image_bottom && (
                          <img
                            src={metric.image}
                            alt={metric.title}
                            className={`h-${section.image_metrics_height || '8'} w-${section.image_metrics_height || '8'} ${
                              metric.is_image_rounded_full ? 'rounded-full' : ''
                            }`}
                          />
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
""
      )}

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