// src/components/PostPage/ProductCard.tsx
'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import Slider from 'react-slick';
import { useSettings } from '@/context/SettingsContext';

const ReactPlayer = dynamic(() => import('react-player'), { ssr: false });

import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

interface ProductCardProps {
  product: {
    product_name: string;
    absolute_url: string;
    media_items: {
      is_video: boolean;
      image_url?: string;
      video_url?: string;
      video_player?: string;
      thumbnail_url?: string;
    }[];
  };
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { settings } = useSettings();
  const [activeMedia, setActiveMedia] = useState(product?.media_items?.[0] || null);

  if (!product) return null;

  console.log('Product:', product);
  console.log('Product Media:', product.media_items);

  const renderMedia = (media: any) => {
    if (media.is_video) {
      const videoUrl = media.video_player === 'youtube'
        ? `https://www.youtube.com/watch?v=${media.video_url}`
        : `https://vimeo.com/${media.video_url}`;
      return (
        <ReactPlayer
          url={videoUrl}
          width="100%"
          height="288px"
          controls
          playing={false}
        />
      );
    } else {
      return (
        <div className="flex justify-center">
          <img src={media.image_url} alt="Product" className="max-h-72 rounded-lg" />
        </div>
      );
    }
  };

  // Slider settings
  const sliderSettings = {
    dots: true,
    focusOnSelect: true,
    infinite: false,
    centerMode: false,
    slidesToShow: 2,
    slidesToScroll: 1,
    arrows: true,
    responsive: [
      {
        breakpoint: 768,
        settings: {
          arrows: false,
          slidesToShow: 2,
          slidesToScroll: 1,
        },
      },
      {
        breakpoint: 480,
        settings: {
          arrows: false,
          slidesToShow: 2,
          slidesToScroll: 1,
        },
      },
    ],
  };

  // Use settings for text size, font weight, and colors with default values

  const fontTextWeight =  'font-medium';

  const textColorHover = 'gray-400';

  return (
    <div className="flex justify-center w-full">
      <div className="p-6 max-w-[360px] lg:max-w-full rounded hover:opacity-80">
        {/* Active media display */}
        <div className="w-full mb-6">{activeMedia && renderMedia(activeMedia)}</div>

        {/* Media slider */}
        <div className="w-full mb-8">
          <Slider {...sliderSettings}>
            {product.media_items.map((media: any, index: number) => (
              <div
                key={index}
                onMouseEnter={() => setActiveMedia(media)}
                className="cursor-pointer px-1"
              >
                <div className="bg-gray-100 hover:bg-gray-200 rounded h-36 flex items-center justify-center p-2">
                  {media.is_video ? (
                    <ReactPlayer
                      url={
                        media.video_player === 'youtube'
                          ? `https://www.youtube.com/watch?v=${media.video_url}`
                          : `https://vimeo.com/${media.video_url}`
                      }
                      width="100%"
                      height="144px"
                      light={true}
                      playIcon={<button className="play-button">▶</button>}
                    />
                  ) : (
                    <img
                      src={media.thumbnail_url || media.image_url}
                      alt="Thumbnail"
                      className="h-32 w-auto object-cover rounded"
                    />
                  )}
                </div>
              </div>
            ))}
          </Slider>
        </div>

        {/* Link to product detail page */}
        <a
          href={product.absolute_url}
          className={`text-center text-${textColorHover} ${fontTextWeight} hover:underline tracking-wider my-8 text-sm`}
        >
          Browse {product.product_name}
        </a>
      </div>
    </div>
  );
};

export default ProductCard;