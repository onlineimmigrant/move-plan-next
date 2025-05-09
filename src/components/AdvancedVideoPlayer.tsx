'use client'; // Client Component for Next.js App Router

import { useMemo, useRef, useEffect, useState } from 'react';
import { AdvancedVideo, lazyload } from '@cloudinary/react';
import { Cloudinary, CloudinaryVideo } from '@cloudinary/url-gen';
import { format, quality } from '@cloudinary/url-gen/actions/delivery';
import { auto } from '@cloudinary/url-gen/qualifiers/quality';
import { fill } from '@cloudinary/url-gen/actions/resize';
import { AutoFocus } from '@cloudinary/url-gen/qualifiers/autoFocus';
import { FocusOn } from '@cloudinary/url-gen/qualifiers/focusOn';
import { autoGravity } from '@cloudinary/url-gen/qualifiers/gravity';
import { Effect } from '@cloudinary/url-gen/actions/effect';

// Props interface
interface AdvancedVideoPlayerProps {
  src?: string; // External video URL (e.g., https://video.com/nice_video.mp4)
  publicId?: string; // Cloudinary public ID for Cloudinary-hosted videos
  className?: string; // Tailwind CSS classes for layout
  controls?: boolean; // Show video controls
  autoPlay?: boolean; // Autoplay video
  muted?: boolean; // Mute video
  loop?: boolean; // Loop video
  poster?: string; // Custom poster URL
  mode?: 'default' | 'optimized' | 'cropped-youtube' | 'cropped-mobile' | 'cropped-square' | 'preview'; // Video transformation mode
  thumbnailTime?: number; // Time (in seconds) to capture thumbnail (default: 1)
}

// Cloudinary instance (configured with demo for testing, update for production)
const cld = new Cloudinary({
  cloud: {
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'demo', // Fallback to demo for testing
  },
});

const AdvancedVideoPlayer: React.FC<AdvancedVideoPlayerProps> = ({
  src,
  publicId,
  className = '',
  controls = true,
  autoPlay = false,
  muted = false,
  loop = false,
  poster,
  mode = 'default',
  thumbnailTime = 1, // Default to capturing frame at 1s for better thumbnail quality
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [generatedPoster, setGeneratedPoster] = useState<string | undefined>(poster);
  const [cloudinaryPoster, setCloudinaryPoster] = useState<string | undefined>(poster);

  // Determine aspect ratio based on mode
  const aspectRatio = useMemo(() => {
    switch (mode) {
      case 'cropped-youtube':
        return '16/9';
      case 'cropped-mobile':
        return '9/16';
      case 'cropped-square':
        return '1/1';
      case 'preview':
      case 'optimized':
      case 'default':
      default:
        return '16/9'; // Default to 16:9 for consistency
    }
  }, [mode]);

  // Handle Cloudinary video configuration
  const cloudinaryVideo = useMemo(() => {
    if (!publicId) return null;

    let video = cld.video(publicId) as CloudinaryVideo;

    switch (mode) {
      case 'optimized':
        video = video.delivery(quality(auto())).format('auto');
        break;
      case 'cropped-youtube':
        video = video
          .resize(fill().width(400).aspectRatio('16:9').gravity(autoGravity().autoFocus(AutoFocus.focusOn(FocusOn.face()))))
          .delivery(quality(auto()))
          .format('auto');
        break;
      case 'cropped-mobile':
        video = video
          .resize(fill().width(400).aspectRatio('9:16').gravity(autoGravity().autoFocus(AutoFocus.focusOn(FocusOn.face()))))
          .delivery(quality(auto()))
          .format('auto');
        break;
      case 'cropped-square':
        video = video
          .resize(fill().width(400).aspectRatio('1:1').gravity(autoGravity().autoFocus(AutoFocus.focusOn(FocusOn.face()))))
          .delivery(quality(auto()))
          .format('auto');
        break;
      case 'preview':
        video = video
          // @ts-expect-error: Suppress TypeScript warning for string-based effect (expected error due to missing type definition)
          .effect('e_preview:duration_4') // Revert to string-based effect for preview
          .delivery(quality(auto()))
          .format('auto');
        break;
      default:
        // Default: no transformations
        break;
    }

    return video;
  }, [publicId, mode]);

  // Generate Cloudinary poster on the client side to avoid hydration mismatch
  useEffect(() => {
    if (poster || !publicId) {
      setCloudinaryPoster(poster);
      return;
    }
    const url = cld
      .image(publicId)
      .setAssetType('video')
      .delivery(quality(auto()))
      .format('auto:image')
      .toURL();
    setCloudinaryPoster(url);
  }, [publicId, poster]);

  // Client-side thumbnail generation for external videos
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src || poster || generatedPoster) return;

    const generateThumbnail = () => {
      video.currentTime = thumbnailTime; // Seek to specified time
    };

    const captureFrame = () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        try {
          const dataUrl = canvas.toDataURL('image/jpeg');
          setGeneratedPoster(dataUrl);
        } catch (error) {
          console.warn('Failed to generate thumbnail due to CORS restrictions:', error);
          // Fallback: Do not set a generated poster; rely on the video's default behavior or a provided poster
        }
      }
    };

    video.addEventListener('loadedmetadata', generateThumbnail);
    video.addEventListener('seeked', captureFrame);

    return () => {
      video.removeEventListener('loadedmetadata', generateThumbnail);
      video.removeEventListener('seeked', captureFrame);
    };
  }, [src, poster, thumbnailTime, generatedPoster]);

  // Render external video if src is provided
  if (src) {
    return (
      <div className={`relative w-full ${className}`}>
        <video
          ref={videoRef}
          controls={controls}
          autoPlay={autoPlay}
          muted={muted}
          loop={loop}
          poster={generatedPoster || poster}
          className="advanced-video-player"
          preload="metadata"
          style={{ aspectRatio }} // Apply aspect ratio via inline CSS
          crossOrigin="anonymous" // Attempt to load video with CORS (may not work if server doesn't support it)
        >
          <source src={src} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>
    );
  }

  // Render Cloudinary AdvancedVideo if publicId is provided
  if (cloudinaryVideo) {
    return (
      <div className={`relative w-full ${className}`}>
        <AdvancedVideo
          cldVid={cloudinaryVideo}
          plugins={[lazyload()]}
          controls={controls}
          autoPlay={autoPlay}
          muted={muted}
          loop={loop}
          poster={cloudinaryPoster}
          className="advanced-video-player"
          style={{ aspectRatio }} // Apply aspect ratio via inline CSS
        />
      </div>
    );
  }

  // Fallback if neither src nor publicId is provided
  return <div className={`text-red-500 ${className}`}>Error: Provide either a video URL (src) or Cloudinary publicId.</div>;
};

export default AdvancedVideoPlayer;