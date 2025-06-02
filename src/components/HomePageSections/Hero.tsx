// /components/HomePageSections/Hero.tsx
"use client"; // Add this if not already present, since this is a Client Component

import React, { useEffect, useRef, useState } from 'react';
import parse from 'html-react-parser';
import Link from 'next/link';

interface HeroProps {
  hero: {
    h1_title: string;
    h1_text_color: string;
    is_h1_gradient_text?: boolean;
    h1_text_color_gradient_from: string;
    h1_text_color_gradient_via: string;
    h1_text_color_gradient_to: string;
    is_bg_gradient?: boolean;
    background_color?: string;
    background_color_gradient_from?: string;
    background_color_gradient_via?: string;
    background_color_gradient_to?: string;
    p_description: string;
    p_description_color: string;
    image?: string;
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
  };
  labelsDefault?: {
    button_main_get_started?: { url: string; text: string };
    button_explore?: string;
  };
  templateSections: TemplateSection[]; // Add this prop
}

interface TemplateSection {
  id: string;
  section_title: string;
  section_description: string;
  website_metric: any[];
}

const Hero: React.FC<HeroProps> = ({ hero, labelsDefault, templateSections }) => {
  if (!hero) return null;

  const [isVisible, setIsVisible] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  // Debug log
  console.log('Hero props:', { h1_title: hero.h1_title, p_description: hero.p_description, title_alighnement: hero.title_alighnement });

  // Intersection Observer to detect visibility
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting;
        setIsVisible(visible);
        console.log('Hero visibility:', visible); // Debug log
      },
      {
        threshold: 0.1, // Trigger when 10% of the section is visible
      }
    );

    if (heroRef.current) {
      observer.observe(heroRef.current);
    }

    return () => {
      if (heroRef.current) {
        observer.unobserve(heroRef.current);
      }
    };
  }, []);

  // Determine text classes based on is_h1_gradient_text
  const textColorClass = hero.is_h1_gradient_text
    ? `bg-gradient-to-r from-${hero.h1_text_color_gradient_from || 'gray-700'} via-${hero.h1_text_color_gradient_via || 'gray-700'} to-${hero.h1_text_color_gradient_to || 'indigo-200'} bg-clip-text text-transparent`
    : `text-${hero.h1_text_color || 'gray-700'}`;

  // Determine background classes based on is_bg_gradient
  const backgroundClass = hero.is_bg_gradient
    ? `bg-gradient-to-tr from-${hero.background_color_gradient_from || 'sky-50'} via-${hero.background_color_gradient_via || 'transparent'} to-${hero.background_color_gradient_to || ''} hover:bg-sky-50`
    : `bg-${hero.background_color || 'transparent'} hover:bg-sky-50`;

  // Determine Get Started button background classes
  const GetstartedBackgroundColorClass = hero.is_h1_gradient_text
    ? `bg-gradient-to-r from-${hero.h1_text_color_gradient_from || 'gray-700'} via-${hero.h1_text_color_gradient_via || 'gray-700'} to-${hero.h1_text_color_gradient_to || 'gray-900'}`
    : `bg-${hero.h1_text_color || 'gray-700'}`;

  // Determine h1 text size classes with multiple breakpoints
  const h1TextSize = `sm:${hero.h1_text_size || 'text-7xl'} md:${hero.h1_text_size || 'text-7xl'} lg:${hero.h1_text_size || 'text-7xl'} ${hero.h1_text_size_mobile || 'text-5xl'}`;

  return (
    <div
      ref={heroRef}
      className={`pt-16 min-h-screen relative isolate px-6 lg:px-8 ${backgroundClass} flex items-center justify-center`}
    >
      {hero.is_bg_gradient && (
        <div
          className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80 text-sky-500"
          aria-hidden="true"
        >
          <div
            className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
          />
        </div>
      )}

      {hero.image && hero.is_image_full_page && (
        <img
          src={hero.image}
          alt={`Image of ${hero.h1_title}`}
          className="absolute inset-0 -z-10 h-auto w-auto object-contain sm:h-auto sm:w-auto sm:object-contain"
        />
      )}

      <div
        className={`mx-auto max-w-${hero.title_block_width || '2xl'} text-${
          hero.title_alighnement || 'center'
        } items-center grid grid-cols-1 gap-x-12 gap-y-24 sm:grid-cols-${hero.title_block_columns || 1}`}
      >
        <div className={hero.image_first ? 'order-2' : ''}>
          {hero.is_seo_title && (
            <div className="hidden sm:mb-8 sm:flex sm:justify-center">
              <div className="flex items-center relative rounded-full px-3 py-1 text-sm leading-6 text-gray-600 hover:text-gray-500 ring-2 ring-gray-900/10 hover:ring-sky-700/20">
                {hero.seo_title}
                <Link
                  href="/education-hub"
                  aria-label={`Explore ${hero.seo_title}`}
                  className="ml-2 flex items-center font-semibold text-gray-700 hover:text-gray-300"
                >
                  Explore <span className="ml-1">→</span>
                </Link>
              </div>
            </div>
          )}

          <div className={`text-${hero.title_alighnement || 'center'}`}>
            <h1
              className={`${h1TextSize} font-bold tracking-tight inline hover:text-gray-700 ${textColorClass} animate-hero-title ${isVisible ? 'animate' : ''}`}
            >
              {parse(hero.h1_title)}
            </h1>

            <p
              className={`mt-6 tracking-wide ${hero.p_description_size_mobile || 'text-lg'} sm:${hero.p_description_size || 'text-2xl'} text-${
                hero.p_description_color || 'gray-600'
              } hover:text-gray-900 animate-hero-description ${isVisible ? 'animate' : ''}`}
              style={{ fontWeight: hero.p_description_weight || 'normal' }}
            >
              {parse(hero.p_description)}
            </p>

            <div
              className={`mt-10 flex items-center justify-${hero.title_alighnement || 'center'} gap-x-6`}
            >
              <a
                href={labelsDefault?.button_main_get_started?.url || '#'}
                className={`rounded-full ${GetstartedBackgroundColorClass} hover:bg-sky-500 py-2 px-4 text-sm font-medium text-white shadow-sm hover:opacity-80 animate-hero-button-get-started ${isVisible ? 'animate' : ''}`}
              >
                {labelsDefault?.button_main_get_started?.text || 'Get Started'}
              </a>
              <a
                href="/education"
                className={`flex items-center text-sm font-semibold leading-6 text-gray-900 hover:text-gray-600 animate-hero-button-explore ${isVisible ? 'animate' : ''}`}
              >
                {labelsDefault?.button_explore || 'Explore'} <span className="ml-1">→</span>
              </a>
            </div>
          </div>
        </div>
        <div className="order-1">
          {hero.image && !hero.is_image_full_page && (
            <div className={`text-${hero.title_alighnement || 'center'}`}>
              <img
                src={hero.image}
                alt={`Image of ${hero.h1_title}`}
                className="h-full w-full object-cover sm:h-auto sm:w-full sm:max-w-[80%] sm:mx-auto sm:object-contain"
              />
            </div>
          )}
        </div>
      </div>

      {/* Render Template Sections */}
      {templateSections.length > 0 ? (
        <div className="mt-12">
          {templateSections.map((section) => (
            <div key={section.id} className="mb-8">
              <h2 className={`text-2xl font-semibold text-${hero.h1_text_color || 'gray-700'}`}>
                {section.section_title}
              </h2>
              <p className={`mt-2 text-${hero.p_description_color || 'gray-600'}`}>
                {section.section_description || 'No description available'}
              </p>
              {section.website_metric?.length > 0 ? (
                <ul className="mt-4 space-y-2">
                  {section.website_metric.map((metric: any, idx: number) => (
                    <li key={idx} className="flex items-center gap-2">
                      {metric.image && (
                        <img
                          src={metric.image}
                          alt={metric.title}
                          className={`h-8 w-8 ${metric.is_image_rounded_full ? 'rounded-full' : ''}`}
                        />
                      )}
                      <div>
                        {metric.is_title_displayed && (
                          <span className="font-medium">{metric.title}</span>
                        )}
                        {metric.is_title_displayed && metric.description && <span>: </span>}
                        <span>{metric.description}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-gray-500">No metrics available.</p>
              )}
            </div>
          ))}
        </div>
      ) : (
""
      )}

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes hero-title {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-hero-title.animate {
          animation: hero-title 1.5s ease-in-out forwards;
        }

        @keyframes hero-description {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-hero-description.animate {
          animation: hero-description 1.5s ease-in-out 0.5s forwards;
        }

        @keyframes hero-button-get-started {
          0% {
            opacity: 0;
            transform: scale(0.8);
          }
          50% {
            transform: scale(1.05);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-hero-button-get-started.animate {
          animation: hero-button-get-started 1.2s ease-in-out 0.8s forwards;
        }

        @keyframes hero-button-explore {
          0% {
            opacity: 0;
            transform: translateX(-10px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-hero-button-explore.animate {
          animation: hero-button-explore 1.2s ease-in-out 1.0s forwards;
        }

        /* Reset animations when not visible */
        .animate-hero-title,
        .animate-hero-description,
        .animate-hero-button-get-started,
        .animate-hero-button-explore {
          opacity: 0;
          transform: translateY(20px); /* Default state for title/description */
        }
        .animate-hero-button-get-started {
          transform: scale(0.8); /* Default state for Get Started */
        }
        .animate-hero-button-explore {
          transform: translateX(-10px); /* Default state for Explore */
        }
      `}</style>
    </div>
  );
};

export default Hero;