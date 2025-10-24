import { useState, useRef, useCallback } from 'react';
import { LocalVideoTrack, Room } from 'twilio-video';

export type BackgroundMode = 'none' | 'blur' | 'color' | 'image';

export interface UseBackgroundProcessingReturn {
  // Background state
  backgroundMode: BackgroundMode;
  backgroundColor: string;
  backgroundImage: string | null;
  showBackgroundMenu: boolean;

  // Background actions
  setBackgroundMode: (mode: BackgroundMode) => void;
  setBackgroundColor: (color: string) => void;
  setBackgroundImage: (image: string | null) => void;
  setShowBackgroundMenu: (show: boolean) => void;

  // Background processing functions
  startBackgroundProcessing: () => Promise<void>;
  stopBackgroundProcessing: () => void;
  restoreOriginalVideoTrack: () => Promise<void>;
  applyBlurBackground: (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, video: HTMLVideoElement) => void;
  applyColorBackground: (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, video: HTMLVideoElement) => void;
  applyImageBackground: (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, video: HTMLVideoElement) => void;

  // Refs
  backgroundCanvasRef: React.RefObject<HTMLCanvasElement>;
  backgroundVideoRef: React.RefObject<HTMLVideoElement>;
  processedVideoRef: React.RefObject<HTMLVideoElement>;
  processedVideoSpotlightRef: React.RefObject<HTMLVideoElement>;
  processedVideoThumbnailRef: React.RefObject<HTMLVideoElement>;
  processedStreamRef: React.RefObject<MediaStream>;
  animationFrameRef: React.RefObject<number>;
  cachedBackgroundImageRef: React.RefObject<HTMLImageElement>;
  originalVideoTrackRef: React.RefObject<LocalVideoTrack>;
}

export const useBackgroundProcessing = (
  room: Room | null,
  localVideoTrack: LocalVideoTrack | null
): UseBackgroundProcessingReturn => {
  // Background state
  const [backgroundMode, setBackgroundMode] = useState<BackgroundMode>('none');
  const [backgroundColor, setBackgroundColor] = useState('#1f2937'); // Default gray
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [showBackgroundMenu, setShowBackgroundMenu] = useState(false);

  // Background processing refs
  const backgroundCanvasRef = useRef<HTMLCanvasElement>(null);
  const backgroundVideoRef = useRef<HTMLVideoElement>(null);
  const processedVideoRef = useRef<HTMLVideoElement>(null);
  const processedVideoSpotlightRef = useRef<HTMLVideoElement>(null);
  const processedVideoThumbnailRef = useRef<HTMLVideoElement>(null);
  const processedStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const cachedBackgroundImageRef = useRef<HTMLImageElement | null>(null);
  const originalVideoTrackRef = useRef<LocalVideoTrack | null>(null);

  // Background processing functions
  const startBackgroundProcessing = useCallback(async () => {
    console.log('🎬 Starting background processing...');
    if (!backgroundCanvasRef.current || !backgroundVideoRef.current || !localVideoTrack) {
      console.log('❌ Missing refs:', {
        canvas: !!backgroundCanvasRef.current,
        video: !!backgroundVideoRef.current,
        track: !!localVideoTrack
      });
      return;
    }

    const video = backgroundVideoRef.current;
    const canvas = backgroundCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('❌ Failed to get canvas context');
      return;
    }

    console.log('✅ Canvas context obtained');

    // Set initial canvas size
    canvas.width = 640;
    canvas.height = 480;

    // Store original track reference
    if (!originalVideoTrackRef.current) {
      originalVideoTrackRef.current = localVideoTrack;
    }

    // Create a stream from the local video track
    const originalStream = new MediaStream([localVideoTrack.mediaStreamTrack]);

    // Set video source - pause first to avoid interruption errors
    video.pause();
    video.srcObject = originalStream;

    // Wait for video to be ready before playing
    await new Promise((resolve) => {
      const onCanPlay = () => {
        video.removeEventListener('canplay', onCanPlay);
        resolve(void 0);
      };
      video.addEventListener('canplay', onCanPlay);

      // Fallback timeout in case canplay doesn't fire
      setTimeout(resolve, 100);
    });

    try {
      await video.play();
      console.log('✅ Background video playing');
    } catch (playError) {
      console.error('❌ Failed to play background video:', playError);
      return;
    }

    const processFrame = () => {
      if (!ctx || !video.videoWidth || !video.videoHeight) {
        console.log('🎬 Skipping frame: missing context or video not ready');
        return;
      }

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Apply background effect based on mode
      switch (backgroundMode) {
        case 'blur':
          applyBlurBackground(ctx, canvas, video);
          break;
        case 'color':
          applyColorBackground(ctx, canvas, video);
          break;
        case 'image':
          applyImageBackground(ctx, canvas, video);
          break;
        default:
          // No background effect, just draw video
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          break;
      }

      // Debug: Log frame processing (throttled)
      if (Math.random() < 0.01) { // Log ~1% of frames
        console.log('🎬 Frame processed for mode:', backgroundMode);
      }

      animationFrameRef.current = requestAnimationFrame(processFrame);
    };

    console.log('🎬 Starting frame processing loop');
    processFrame();
  }, [backgroundMode, localVideoTrack]);

  const stopBackgroundProcessing = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (processedStreamRef.current) {
      processedStreamRef.current.getTracks().forEach(track => track.stop());
      processedStreamRef.current = null;
    }
  }, []);

  const restoreOriginalVideoTrack = useCallback(async () => {
    if (!room || !originalVideoTrackRef.current) {
      console.log('❌ Cannot restore original track: room or original track not available');
      return;
    }

    try {
      // Stop any background processing
      stopBackgroundProcessing();

      // If we have a processed track published, unpublish it
      if (localVideoTrack && localVideoTrack !== originalVideoTrackRef.current) {
        console.log('🔄 Unpublishing processed track...');
        await room.localParticipant.unpublishTrack(localVideoTrack);
        console.log('🔄 Publishing original track...');
        await room.localParticipant.publishTrack(originalVideoTrackRef.current);
        // Note: The hook manages localVideoTrack, so we don't update it here
        console.log('✅ Restored original video track');
      } else {
        console.log('ℹ️ Already using original track');
      }
    } catch (error) {
      console.error('❌ Failed to restore original video track:', error);
    }
  }, [room, localVideoTrack, stopBackgroundProcessing]);

  const applyBlurBackground = useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, video: HTMLVideoElement) => {
    console.log('🎨 Applying simplified blur background effect');
    // Only draw if video is ready
    if (!video.videoWidth || !video.videoHeight || video.readyState < 2) {
      console.log('🎨 Video not ready for blur effect');
      return;
    }

    // Create a blurred version of the entire video
    ctx.save();
    ctx.filter = 'blur(10px) brightness(0.9)';
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.filter = 'none';
    ctx.restore();

    // Create a radial gradient mask to keep the center (person) sharper
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const maxRadius = Math.sqrt(centerX * centerX + centerY * centerY);

    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, maxRadius);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)'); // Center is mostly transparent (shows blurred)
    gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.4)'); // Middle transition
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0.1)'); // Edges are more opaque (shows more blur)

    // Apply the gradient as a mask
    ctx.globalCompositeOperation = 'destination-in';
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'source-over';

    // Draw the original video on top with reduced opacity in the center
    ctx.globalAlpha = 0.6;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1.0;

    console.log('✅ Simplified blur effect applied');
  }, []);

  const applyColorBackground = useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, video: HTMLVideoElement) => {
    console.log('🎨 Applying color background effect:', backgroundColor);
    // Only draw if video is ready
    if (!video.videoWidth || !video.videoHeight || video.readyState < 2) {
      console.log('🎨 Video not ready for color effect');
      // Still fill background even if video isn't ready
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      return;
    }

    // Fill background with selected color
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw the video on top
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    console.log('✅ Color background effect applied');
  }, [backgroundColor]);

  const applyImageBackground = useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, video: HTMLVideoElement) => {
    console.log('🎨 Applying image background effect');

    if (!backgroundImage) {
      console.log('❌ No background image set');
      // Fallback to color background
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      if (video.videoWidth && video.videoHeight && video.readyState >= 2) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      }
      return;
    }

    // Load and cache background image if not already cached
    if (!cachedBackgroundImageRef.current || cachedBackgroundImageRef.current.src !== backgroundImage) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        cachedBackgroundImageRef.current = img;
        console.log('✅ Background image loaded and cached');
      };
      img.onerror = () => {
        console.error('❌ Failed to load background image');
        // Fallback to color background
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      };
      img.src = backgroundImage;
    }

    // Use cached image if available
    if (cachedBackgroundImageRef.current) {
      // Draw background image (scaled to fit)
      const img = cachedBackgroundImageRef.current;
      const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
      const scaledWidth = img.width * scale;
      const scaledHeight = img.height * scale;
      const x = (canvas.width - scaledWidth) / 2;
      const y = (canvas.height - scaledHeight) / 2;

      ctx.drawImage(img, x, y, scaledWidth, scaledHeight);

      // Draw video on top
      if (video.videoWidth && video.videoHeight && video.readyState >= 2) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      }

      console.log('✅ Image background effect applied');
    } else {
      // Image not ready yet, use color background as fallback
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      if (video.videoWidth && video.videoHeight && video.readyState >= 2) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      }
    }
  }, [backgroundImage, backgroundColor]);

  return {
    // Background state
    backgroundMode,
    backgroundColor,
    backgroundImage,
    showBackgroundMenu,

    // Background actions
    setBackgroundMode,
    setBackgroundColor,
    setBackgroundImage,
    setShowBackgroundMenu,

    // Background processing functions
    startBackgroundProcessing,
    stopBackgroundProcessing,
    restoreOriginalVideoTrack,
    applyBlurBackground,
    applyColorBackground,
    applyImageBackground,

    // Refs
    backgroundCanvasRef,
    backgroundVideoRef,
    processedVideoRef,
    processedVideoSpotlightRef,
    processedVideoThumbnailRef,
    processedStreamRef,
    animationFrameRef,
    cachedBackgroundImageRef,
    originalVideoTrackRef,
  };
};