'use client';

import React, { useState } from 'react';

interface VideoCarouselProps {
  className?: string;
  videos: string; // JSON string of video URLs (local MP4 or YouTube)
}

const VideoCarousel: React.FC<VideoCarouselProps> = ({ className = '', videos }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  let videoArray: string[] = [];

  try {
    videoArray = JSON.parse(videos) as string[];
    if (!Array.isArray(videoArray) || videoArray.some(url => typeof url !== 'string' || !url)) {
      throw new Error('Invalid video URLs');
    }
  } catch (error) {
    console.error('Error parsing videos:', error);
    return <div className="text-red-500 text-center">Invalid or empty video data</div>;
  }

  if (!videoArray.length) {
    return <div className="text-gray-500 text-center">No videos provided</div>;
  }

  const isYouTubeUrl = (url: string) => {
    return url.includes('youtube.com') || url.includes('youtu.be');
  };

  const getYouTubeEmbedUrl = (url: string) => {
    const videoId = url.match(/(?:youtube\.com\/.*v=|youtu\.be\/)([^&?]+)/)?.[1];
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % videoArray.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + videoArray.length) % videoArray.length);
  };

  const currentVideo = videoArray[currentIndex];

  return (
    <div className={`relative w-full max-w-2xl mx-auto ${className}`}>
      <div className="overflow-hidden rounded-lg">
        {isYouTubeUrl(currentVideo) ? (
          <iframe
            src={getYouTubeEmbedUrl(currentVideo) || ''}
            title={`Video ${currentIndex + 1}`}
            width="600"
            height="400"
            className="w-full h-auto"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <video
            src={currentVideo}
            controls
            className="w-full h-auto"
            style={{ maxHeight: '400px' }}
            onError={() => console.error(`Failed to load video: ${currentVideo}`)}
          />
        )}
      </div>
      <button
        onClick={prevSlide}
        className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white p-2 rounded-full hover:bg-gray-700"
      >
        ←
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white p-2 rounded-full hover:bg-gray-700"
      >
        →
      </button>
      <div className="flex justify-center mt-2">
        {videoArray.map((_, index) => (
          <span
            key={index}
            className={`h-2 w-2 mx-1 rounded-full ${
              index === currentIndex ? 'bg-blue-500' : 'bg-gray-300'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default VideoCarousel;