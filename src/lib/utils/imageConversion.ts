/**
 * Image Conversion Utilities
 * 
 * Helper functions for converting and uploading images
 */

import { ImageConversionOptions, CONVERSION_PRESETS } from '@/types/image-conversion';

/**
 * Convert an image file and upload to R2
 * 
 * @param file - Image file to convert
 * @param options - Conversion options or preset name
 * @param organizationId - Organization ID for R2 upload
 * @param folder - Optional folder path in R2
 * @returns URLs of uploaded image and thumbnail
 */
export async function convertAndUploadImage(
  file: File,
  options: ImageConversionOptions | string,
  organizationId: string,
  folder?: string,
  sessionToken?: string
): Promise<{
  imageUrl: string;
  thumbnailUrl?: string;
  originalSize: number;
  convertedSize: number;
  compressionRatio: number;
}> {
  // Resolve options from preset if string provided
  const conversionOptions = typeof options === 'string'
    ? CONVERSION_PRESETS[options]?.options || CONVERSION_PRESETS['web-optimized'].options
    : options;

  // Step 1: Convert image
  const formData = new FormData();
  formData.append('file', file);
  formData.append('format', conversionOptions.format || 'webp');
  formData.append('quality', String(conversionOptions.quality || 85));
  if (conversionOptions.maxWidth) formData.append('maxWidth', String(conversionOptions.maxWidth));
  if (conversionOptions.maxHeight) formData.append('maxHeight', String(conversionOptions.maxHeight));
  if (conversionOptions.resizeMode) formData.append('resizeMode', conversionOptions.resizeMode);
  if (conversionOptions.generateThumbnail !== undefined) {
    formData.append('generateThumbnail', String(conversionOptions.generateThumbnail));
  }
  if (conversionOptions.thumbnailSize) {
    formData.append('thumbnailSize', String(conversionOptions.thumbnailSize));
  }

  const convertResponse = await fetch('/api/convert-image', {
    method: 'POST',
    body: formData,
  });

  if (!convertResponse.ok) {
    const error = await convertResponse.json();
    throw new Error(error.error || 'Conversion failed');
  }

  const conversionResult = await convertResponse.json();

  // Step 2: Upload converted image to R2
  const imageBlob = base64ToBlob(conversionResult.image, `image/${conversionOptions.format || 'webp'}`);
  const imageName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${conversionOptions.format || 'webp'}`;
  
  const uploadFormData = new FormData();
  uploadFormData.append('file', imageBlob, imageName);
  uploadFormData.append('organizationId', organizationId);
  if (folder) uploadFormData.append('folder', folder);

  const uploadResponse = await fetch('/api/upload-image-r2', {
    method: 'POST',
    headers: sessionToken ? { 'Authorization': `Bearer ${sessionToken}` } : {},
    body: uploadFormData,
  });

  if (!uploadResponse.ok) {
    const error = await uploadResponse.json();
    throw new Error(error.error || 'Upload failed');
  }

  const uploadResult = await uploadResponse.json();

  // Step 3: Upload thumbnail if generated
  let thumbnailUrl: string | undefined;
  if (conversionResult.thumbnail) {
    const thumbnailBlob = base64ToBlob(conversionResult.thumbnail, 'image/webp');
    const thumbnailName = `thumb_${imageName}`;
    
    const thumbFormData = new FormData();
    thumbFormData.append('file', thumbnailBlob, thumbnailName);
    thumbFormData.append('organizationId', organizationId);
    if (folder) thumbFormData.append('folder', `${folder}/thumbnails`);

    const thumbResponse = await fetch('/api/upload-image-r2', {
      method: 'POST',
      headers: sessionToken ? { 'Authorization': `Bearer ${sessionToken}` } : {},
      body: thumbFormData,
    });

    if (thumbResponse.ok) {
      const thumbResult = await thumbResponse.json();
      thumbnailUrl = thumbResult.url;
    }
  }

  return {
    imageUrl: uploadResult.url,
    thumbnailUrl,
    originalSize: conversionResult.original.size,
    convertedSize: conversionResult.converted.size,
    compressionRatio: conversionResult.compressionRatio,
  };
}

/**
 * Convert base64 string to Blob
 */
function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

/**
 * Get optimal conversion preset based on image dimensions and file size
 */
export function getOptimalPreset(
  width: number,
  height: number,
  fileSize: number
): string {
  const pixels = width * height;
  const megapixels = pixels / 1000000;

  // Large high-res image
  if (megapixels > 12 || fileSize > 5 * 1024 * 1024) {
    return 'web-optimized';
  }

  // Medium image
  if (megapixels > 2) {
    return 'high-quality';
  }

  // Small image or already small file
  if (pixels < 500 * 500 || fileSize < 200 * 1024) {
    return 'thumbnail';
  }

  return 'web-optimized';
}

/**
 * Estimate file size reduction for a preset
 */
export function estimateCompression(
  originalSize: number,
  preset: string
): { estimatedSize: number; estimatedSavings: number } {
  // Rough estimates based on typical compression ratios
  const compressionRatios: Record<string, number> = {
    'web-optimized': 0.35, // ~65% reduction
    'high-quality': 0.50,  // ~50% reduction
    'thumbnail': 0.20,     // ~80% reduction
    'mobile': 0.30,        // ~70% reduction
    'social-media': 0.35,  // ~65% reduction
  };

  const ratio = compressionRatios[preset] || 0.35;
  const estimatedSize = Math.round(originalSize * ratio);
  const estimatedSavings = Math.round(((originalSize - estimatedSize) / originalSize) * 100);

  return { estimatedSize, estimatedSavings };
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
