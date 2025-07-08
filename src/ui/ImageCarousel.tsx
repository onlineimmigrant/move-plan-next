'use client';

import React, { useState } from 'react';
import Image from 'next/image';

interface ImageCarouselProps {
  className?: string;
  images: string; // JSON string of image URLs, e.g., '["/img1.jpg", "/img2.jpg"]'
}

const ImageCarousel: React.FC<ImageCarouselProps> = ({ className = '', images }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  let imageArray: string[] = [];

  try {
    imageArray = JSON.parse(images) as string[];
  } catch (error) {
    console.error('Error parsing images:', error);
    return <div className="text-red-500">Invalid image data</div>;
  }

  if (!imageArray.length) {
    return <div className="text-gray-500">No images provided</div>;
  }

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % imageArray.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + imageArray.length) % imageArray.length);
  };

  return (
    <div className={`relative w-full max-w-3xl mx-auto ${className}`}>
      <div className="overflow-hidden rounded-lg">
        <Image
          src={imageArray[currentIndex]}
          alt={`Carousel image ${currentIndex + 1}`}
          width={600}
          height={400}
          className="w-full h-auto object-cover"
        />
      </div>
      <button
        onClick={prevSlide}
        className="absolute left-0 top-1/2 transform -translate-y-1/2 sm:w-16 w-8 sm:h-16  h-8 flex items-center justify-center rounded-full bg-gray-200 text-white hover:bg-gray-400 transition-colors"
      >
        <span className="cursor-pointer sm:text-4xl text-lg font-light">←</span>
      </button>
      <button
        onClick={nextSlide}
           className="absolute right-0 top-1/2 transform -translate-y-1/2 w-16 h-16 flex items-center justify-center rounded-full bg-gray-200 text-white hover:bg-gray-400 transition-colors"
     >
        <span className="cursor-pointer sm:text-4xl text-lg font-light">→</span>
      </button>
      <div className="flex justify-center mt-2">
        {imageArray.map((_, index) => (
          <span
            key={index}
            className={`h-2 w-2 mx-1 rounded-full ${
              index === currentIndex ? 'bg-gray-500' : 'bg-gray-300'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default ImageCarousel;