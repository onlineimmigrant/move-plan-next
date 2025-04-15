import React, { useEffect, useState } from 'react';
import parse from 'html-react-parser';

interface HeroProps {
  hero: {
    h1_title: string;
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
    is_h1_gradient_text?: boolean;
    title_alighnement?: string;
    title_block_width?: string;
    title_block_columns?: number;
    p_description_size?: string;
    p_description_size_mobile?: string;
    p_description_weight?: string;
    image_first?: boolean;
  };
  labelsDefault?: {
    button_main_get_started?: { url: string; text: string };
    button_explore?: string;
  };
}



const Hero: React.FC<HeroProps> = ({ hero, labelsDefault }) => {
  const [heroData, setHeroData] = useState({ h1_title: hero.h1_title, p_description: hero.p_description });

  useEffect(() => {
    const fetchHeroData = async () => {
      try {
        const response = await fetch('/api/hero');
        const data = await response.json();
        if (data) {
          setHeroData({ h1_title: data.h1_title, p_description: data.p_description });
        }
      } catch (error) {
        console.error('Error fetching hero data:', error);
      }
    };

    fetchHeroData();
  }, []);

  if (!hero) return null;

  return (
    <div className={`pt-16 min-h-screen relative isolate px-6 lg:px-8 bg-transparent hover:bg-sky-50`}>
      {hero.is_bg_gradient && (
        <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80 text-sky-500" aria-hidden="true">
          <div
            className={`relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg]
              bg-gradient-to-tr
              from-${hero.h1_title_color_id || 'sky-700'}
              via-${hero.h1_via_gradient_color_id || 'transparent'}
              to-${hero.h1_to_gradient_color_id || 'sky-500'}
              opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]`}
            style={{
              clipPath:
                'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
            }}
          />
        </div>
      )}

      {hero.image_url && hero.is_image_full_page && (
        <img src={hero.image_url} alt={`Image of ${hero.h1_title}`} className="absolute inset-0 -z-10 h-full w-full object-cover" />
      )}

      <div
        className={`mx-auto max-w-${hero.title_block_width || '2xl'} text-${hero.title_alighnement || 'center'} items-center py-24 grid grid-cols-1 gap-x-12 gap-y-24 sm:grid-cols-${hero.title_block_columns || 1}`}
      >
        <div className={hero.image_first ? 'order-2' : ''}>
          {hero.is_seo_title && (
            <div className="hidden sm:mb-8 sm:flex sm:justify-center">
              <div className="flex items-center relative rounded-full px-3 py-1 text-sm leading-6 text-gray-600 hover:text-gray-500 ring-2 ring-gray-900/10 hover:ring-sky-700/20">
                {hero.seo_title}
                <a
                  href="/education-hub"
                  alt={`Explore ${hero.seo_title}`}
                  className="ml-2 flex items-center font-semibold text-gray-700 hover:text-gray-300"
                >
                  Explore <span className="ml-1">→</span>
                </a>
              </div>
            </div>
          )}

          <div className={`text-${hero.title_alighnement || 'center'}`}>
            <h1
              className={`${hero.h1_text_size_mobile || 'text-4xl'} sm:${hero.h1_text_size || 'text-5xl'} font-bold tracking-tight inline text-${hero.h1_title_color_id || 'gray-900'} hover:text-gray-700 
              
                  bg-gradient-to-r from-${hero.h1_title_color_id} via-${hero.h1_via_gradient_color_id} to-indigo-200 bg-clip-text text-transparent`}
                 
            
            >
              {parse(heroData.h1_title)}
            </h1>

            <p
              className={`mt-6 tracking-wide ${hero.p_description_size_mobile || 'text-lg'} sm:${hero.p_description_size || 'text-xl'} text-${hero.p_description_color || 'gray-600' } hover:text-gray-900`}
              style={{ fontWeight: hero.p_description_weight || 'normal' }}
            >
              {parse(heroData.p_description)}
            </p>

            <div className={`mt-10 flex items-center justify-${hero.title_alighnement || 'center'} gap-x-6`}>
              <a
                href={labelsDefault?.button_main_get_started?.url || '#'}
                className={`rounded-full bg-gradient-to-r from-${hero.h1_title_color_id || 'gray-700'} via-${hero.h1_via_gradient_color_id || 'gray-500'} to-${hero.h1_to_gradient_color_id || 'gray-900'} hover:bg-sky-500 py-2 px-4 text-sm font-medium text-white shadow-sm hover:opacity-80`}
              >
                {labelsDefault?.button_main_get_started?.text || 'Get Started'}
              </a>
              <a
                href="/education-hub"
                className="flex items-center text-sm font-semibold leading-6 text-gray-900 hover:text-gray-600"
              >
                {labelsDefault?.button_explore || 'Explore'} <span className="ml-1">→</span>
              </a>
            </div>
          </div>
        </div>
        <div className="order-1">
          {hero.image_url && !hero.is_image_full_page && (
            <div className={`text-${hero.title_alighnement || 'center'}`}>
              <img src={hero.image_url} alt={`Image of ${hero.h1_title}`} className="h-auto w-auto" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Hero;