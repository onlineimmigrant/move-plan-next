/**
 * Generate a thumbnail from a video file or URL
 * @param videoSource - File object or URL string
 * @param timestamp - Time in seconds to capture (default: 1 second or 10% of duration)
 * @returns Promise<Blob> - JPEG image blob
 */
export async function generateVideoThumbnail(
  videoSource: File | string,
  timestamp?: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    
    // Only set crossOrigin if loading from external URL
    if (typeof videoSource === 'string' && !videoSource.startsWith('blob:')) {
      video.crossOrigin = 'anonymous';
    }
    
    video.preload = 'metadata';
    
    // Set video source
    if (videoSource instanceof File) {
      video.src = URL.createObjectURL(videoSource);
    } else {
      video.src = videoSource;
    }

    const cleanup = () => {
      if (videoSource instanceof File) {
        URL.revokeObjectURL(video.src);
      }
      video.remove();
    };

    video.addEventListener('loadedmetadata', () => {
      // Calculate timestamp: use provided, or 0.3 seconds, or 10% of duration (whichever is smallest)
      const captureTime = timestamp ?? Math.min(0.3, video.duration * 0.1);
      video.currentTime = captureTime;
    });

    video.addEventListener('seeked', () => {
      try {
        const canvas = document.createElement('canvas');
        
        // Set canvas dimensions to video dimensions
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          cleanup();
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Draw video frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert canvas to blob
        canvas.toBlob(
          (blob) => {
            cleanup();
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to generate thumbnail blob'));
            }
          },
          'image/jpeg',
          0.85 // Quality: 85%
        );
      } catch (error) {
        cleanup();
        reject(error);
      }
    });

    video.addEventListener('error', (e) => {
      cleanup();
      reject(new Error(`Video load error: ${video.error?.message || 'Unknown error'}`));
    });

    // Timeout after 30 seconds
    setTimeout(() => {
      cleanup();
      reject(new Error('Thumbnail generation timeout'));
    }, 30000);
  });
}

/**
 * Generate thumbnail and upload to R2
 * @param videoUrl - The R2 video URL
 * @param fileName - Original video filename (for naming thumbnail)
 * @param accessToken - Supabase auth token
 * @returns Promise<string> - Uploaded thumbnail URL
 */
export async function generateAndUploadThumbnail(
  videoUrl: string,
  fileName: string,
  accessToken: string
): Promise<string> {
  try {
    console.log('[Thumbnail] Starting generation for:', fileName);
    
    // Fetch video as blob to avoid CORS issues
    console.log('[Thumbnail] Fetching video from:', videoUrl);
    const videoResponse = await fetch(videoUrl);
    if (!videoResponse.ok) {
      throw new Error(`Failed to fetch video: ${videoResponse.status}`);
    }
    
    const videoBlob = await videoResponse.blob();
    console.log('[Thumbnail] Video blob size:', videoBlob.size, 'bytes');
    
    // Create blob URL for the video
    const blobUrl = URL.createObjectURL(videoBlob);
    console.log('[Thumbnail] Created blob URL:', blobUrl);
    
    // Generate thumbnail blob from blob URL (avoids CORS)
    console.log('[Thumbnail] Generating thumbnail from blob...');
    const thumbnailBlob = await generateVideoThumbnail(blobUrl);
    console.log('[Thumbnail] Thumbnail blob size:', thumbnailBlob.size, 'bytes');
    
    // Clean up blob URL
    URL.revokeObjectURL(blobUrl);
    
    // Create form data
    const formData = new FormData();
    const thumbnailFileName = fileName.replace(/\.[^/.]+$/, '.jpg'); // Replace extension with .jpg
    formData.append('file', thumbnailBlob, thumbnailFileName);
    formData.append('folder', 'thumbnails');
    
    console.log('[Thumbnail] Uploading to R2:', thumbnailFileName);
    
    // Upload to R2
    const uploadResponse = await fetch('/api/upload-image-r2', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
      body: formData,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(`Upload failed: ${uploadResponse.status} - ${errorText}`);
    }

    const result = await uploadResponse.json();
    console.log('[Thumbnail] Upload successful:', result.imageUrl);
    return result.imageUrl;
  } catch (error) {
    console.error('[Thumbnail] Generation failed:', error);
    throw error;
  }
}
