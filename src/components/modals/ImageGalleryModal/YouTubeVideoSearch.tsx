'use client';

import React, { useState } from 'react';
import { MagnifyingGlassIcon, PlayIcon } from '@heroicons/react/24/outline';

interface YouTubeVideo {
  id: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  publishedAt: string;
}

interface YouTubeVideoSearchProps {
  onSelectVideo: (videoId: string, videoData: YouTubeVideo) => void;
}

export default function YouTubeVideoSearch({ onSelectVideo }: YouTubeVideoSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

  const searchYouTube = async () => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/youtube/search?q=${encodeURIComponent(searchQuery)}&maxResults=12`);
      
      if (!response.ok) {
        throw new Error('Failed to search YouTube videos');
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      const formattedVideos: YouTubeVideo[] = data.items.map((item: any) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails.medium.url,
        channelTitle: item.snippet.channelTitle,
        publishedAt: item.snippet.publishedAt,
      }));

      setVideos(formattedVideos);
    } catch (err: any) {
      console.error('YouTube search error:', err);
      setError(err.message || 'Failed to search videos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchYouTube();
    }
  };

  const handleSelect = (video: YouTubeVideo) => {
    setSelectedVideo(video.id);
    onSelectVideo(video.id, video);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search Bar */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search YouTube videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>
          <button
            onClick={searchYouTube}
            disabled={isLoading || !searchQuery.trim()}
            className="px-6 py-3 bg-sky-600 text-white rounded-lg hover:bg-sky-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isLoading ? 'Searching...' : 'Search'}
          </button>
        </div>
        {error && (
          <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>

      {/* Results Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        {videos.length === 0 && !isLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <PlayIcon className="w-16 h-16 mb-4 opacity-50" />
            <p className="text-lg font-medium">Search for YouTube videos</p>
            <p className="text-sm mt-2">Enter a search query to find videos</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {videos.map((video) => (
              <div
                key={video.id}
                onClick={() => handleSelect(video)}
                className={`
                  group cursor-pointer rounded-lg overflow-hidden border-2 transition-all
                  ${selectedVideo === video.id
                    ? 'border-sky-500 shadow-lg scale-105'
                    : 'border-gray-200 dark:border-gray-700 hover:border-sky-300 hover:shadow-md'
                  }
                `}
              >
                <div className="relative aspect-video bg-gray-100 dark:bg-gray-800">
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">
                      <PlayIcon className="w-6 h-6 text-white ml-1" />
                    </div>
                  </div>
                  {selectedVideo === video.id && (
                    <div className="absolute top-2 right-2">
                      <div className="w-6 h-6 bg-sky-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-3 bg-white dark:bg-gray-900">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2 mb-1">
                    {video.title}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                    {video.channelTitle}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
