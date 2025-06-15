// src/components/ProductDetailMediaDisplay.tsx
'use client';

import { useState, useMemo } from 'react';
import Slider from 'react-slick';
import dynamic from 'next/dynamic';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

const ReactPlayer = dynamic(() => import('react-player'), { ssr: false });

interface MediaItem {
  id: number;
  product_id: number;
  order: number;
  is_video: boolean;
  video_url?: string;
  video_player?: 'youtube' | 'vimeo';
  image_url?: string;
  thumbnail_url?: string | null;
}

interface ProductDetailMediaDisplayProps {
  mediaItems: MediaItem[];
}

const ProductDetailMediaDisplay: React.FC<ProductDetailMediaDisplayProps> = ({ mediaItems }) => {
  // Sort mediaItems by 'order' field
  const sortedMediaItems = useMemo(
    () => [...mediaItems].sort((a, b) => a.order - b.order),
    [mediaItems]
  );

  const [activeMedia, setActiveMedia] = useState<MediaItem | null>(
    sortedMediaItems.length > 0 ? sortedMediaItems[0] : null
  );

  const renderMedia = (media: MediaItem) => {
    if (media.is_video && media.video_url && media.video_player) {
      const videoUrl =
        media.video_player === 'youtube'
          ? `https://www.youtube.com/watch?v=${media.video_url}`
          : `https://vimeo.com/${media.video_url}`;
      return (
        <div className="w-full aspect-video max-h-72 md:max-h-96">
          <ReactPlayer
            url={videoUrl}
            width="100%"
            height="100%"
            controls
            playing={false}
            config={{
              youtube: { playerVars: { modestbranding: 1 } },
              vimeo: { playerOptions: { background: false } },
            }}
          />
        </div>
      );
    } else if (media.image_url) {
      return (
        <div className="flex justify-center items-center w-full max-h-72 md:max-h-96">
          <img
            src={media.image_url}
            alt="Product"
            className="max-h-72 md:max-h-96 w-full object-contain rounded-lg"
          />
        </div>
      );
    }
    return (
      <div className="w-full h-72 bg-gray-100 flex items-center justify-center rounded-lg">
        <span className="text-gray-400">No media</span>
      </div>
    );
  };

  // Slider settings for main media (mobile only)
  const mainSliderSettings = useMemo(
    () => ({
      dots: sortedMediaItems.length > 1,
      infinite: sortedMediaItems.length > 1,
      slidesToShow: 1,
      slidesToScroll: 1,
      arrows: false,
      speed: 300,
      swipeToSlide: true,
      afterChange: (index: number) => setActiveMedia(sortedMediaItems[index]),
    }),
    [sortedMediaItems]
  );

  // Slider settings for thumbnails (desktop/tablet only)
  const thumbnailSliderSettings = useMemo(
    () => ({
      dots: sortedMediaItems.length > 1,
      focusOnSelect: true,
      infinite: sortedMediaItems.length > 2,
      centerMode: false,
      slidesToShow: Math.min(2, sortedMediaItems.length),
      slidesToScroll: 1,
      arrows: false,
      speed: 300,
      responsive: [
        {
          breakpoint: 1024,
          settings: {
            slidesToShow: Math.min(2, sortedMediaItems.length),
            slidesToScroll: 1,
            arrows: false,
            dots: sortedMediaItems.length > 1,
          },
        },
        {
          breakpoint: 768,
          settings: {
            slidesToShow: Math.min(2, sortedMediaItems.length),
            slidesToScroll: 1,
            arrows: false,
            dots: sortedMediaItems.length > 1,
          },
        },
      ],
    }),
    [sortedMediaItems.length]
  );

  if (!sortedMediaItems.length || !activeMedia) {
    return null; // Trigger fallback in parent
  }

  return (
    <div className="relative z-10 w-full">
      {/* Mobile: Main media slider with touch navigation */}
      <div className="md:hidden">
        <Slider {...mainSliderSettings} className="w-full">
          {sortedMediaItems.map((media) => (
            <div key={media.id} className="px-1">
              {renderMedia(media)}
            </div>
          ))}
        </Slider>
      </div>

      {/* Desktop/Tablet: Main media with thumbnail carousel */}
      <div className="hidden md:block">
        <div className="w-full">{renderMedia(activeMedia)}</div>
        {sortedMediaItems.length > 1 && (
          <div className="mt-12 relative">
            <Slider
              {...thumbnailSliderSettings}
              className="w-full"
              customPaging={() => (
                <div className="w-2 h-2 bg-gray-400 rounded-full mx-1 transition-colors duration-300 hover:bg-blue-500 data-[slick-active]:bg-blue-500" />
              )}
            >
              {sortedMediaItems.map((media) => (
                <div
                  key={media.id}
                  onMouseEnter={() => setActiveMedia(media)}
                  onClick={() => setActiveMedia(media)}
                  className="cursor-pointer px-1"
                >
                  <div className="bg-gray-100 hover:bg-gray-200 rounded-lg h-36 flex items-center justify-center p-2 transition-colors">
                    {media.is_video && media.video_url && media.video_player ? (
                      <ReactPlayer
                        url={
                          media.video_player === 'youtube'
                            ? `https://www.youtube.com/watch?v=${media.video_url}`
                            : `https://vimeo.com/${media.video_url}`
                        }
                        width="100%"
                        height="144px"
                        light={true}
                        playIcon={
                          <button className="bg-black/70 text-white rounded-full w-8 h-8 flex items-center justify-center text-xl">
                            ▶
                          </button>
                        }
                      />
                    ) : (
                      media.image_url && (
                        <img
                          src={
                            media.thumbnail_url && media.thumbnail_url !== null
                              ? media.thumbnail_url
                              : media.image_url
                          }
                          alt="Thumbnail"
                          className="h-32 w-full object-contain rounded"
                        />
                      )
                    )}
                  </div>
                </div>
              ))}
            </Slider>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetailMediaDisplay;