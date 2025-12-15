/**
 * Video Helper Utilities
 * 
 * Functions for detecting and converting video URLs to embed formats
 * Supports: YouTube, Vimeo, and direct video files
 */

/**
 * Check if URL is a video
 * @param url - URL to check
 * @returns true if URL is a video (YouTube, Vimeo, or direct video file)
 */
export function isVideoUrl(url: string | undefined): boolean {
  if (!url) return false;
  const urlLower = url.toLowerCase();
  
  // Check for video file extensions
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.wmv', '.flv', '.mkv'];
  const hasVideoExtension = videoExtensions.some(ext => urlLower.includes(ext));
  
  // Check for YouTube URLs
  const isYouTube = urlLower.includes('youtube.com') || urlLower.includes('youtu.be');
  
  // Check for Vimeo URLs
  const isVimeo = urlLower.includes('vimeo.com');
  
  return hasVideoExtension || isYouTube || isVimeo;
}

/**
 * Convert YouTube/Vimeo URLs to embed format
 * @param url - Original video URL
 * @returns Embed-ready URL
 */
export function getEmbedUrl(url: string): string {
  const urlLower = url.toLowerCase();
  
  // YouTube conversion
  if (urlLower.includes('youtube.com/watch')) {
    const urlObj = new URL(url);
    const videoId = urlObj.searchParams.get('v');
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  }
  if (urlLower.includes('youtu.be/')) {
    const videoId = url.split('youtu.be/')[1]?.split('?')[0];
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  }
  
  // Vimeo conversion
  if (urlLower.includes('vimeo.com/')) {
    const videoId = url.split('vimeo.com/')[1]?.split('?')[0];
    return videoId ? `https://player.vimeo.com/video/${videoId}` : url;
  }
  
  return url;
}

/**
 * Extract video ID from URL
 * @param url - Video URL
 * @returns Video ID or null
 */
export function getVideoId(url: string): string | null {
  const urlLower = url.toLowerCase();
  
  // YouTube
  if (urlLower.includes('youtube.com/watch')) {
    const urlObj = new URL(url);
    return urlObj.searchParams.get('v');
  }
  if (urlLower.includes('youtu.be/')) {
    return url.split('youtu.be/')[1]?.split('?')[0] || null;
  }
  
  // Vimeo
  if (urlLower.includes('vimeo.com/')) {
    return url.split('vimeo.com/')[1]?.split('?')[0] || null;
  }
  
  return null;
}

/**
 * Get video platform from URL
 * @param url - Video URL
 * @returns Platform name or 'direct'
 */
export function getVideoPlatform(url: string): 'youtube' | 'vimeo' | 'direct' {
  if (!url) return 'direct';
  const urlLower = url.toLowerCase();
  
  if (urlLower.includes('youtube.com') || urlLower.includes('youtu.be')) {
    return 'youtube';
  }
  if (urlLower.includes('vimeo.com')) {
    return 'vimeo';
  }
  
  return 'direct';
}
