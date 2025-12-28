/**
 * Image Conversion API Endpoint
 * 
 * Converts and optimizes images to WebP format with configurable options
 * Supports resizing, quality adjustment, and thumbnail generation
 */

import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { ImageConversionOptions, ConversionResult } from '@/types/image-conversion';

/**
 * Convert and optimize an image
 * 
 * @example
 * POST /api/convert-image
 * Content-Type: multipart/form-data
 * {
 *   file: <image-file>,
 *   format: 'webp',
 *   quality: 85,
 *   maxWidth: 1920,
 *   maxHeight: 1920
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Parse options from form data
    const options: ImageConversionOptions = {
      format: (formData.get('format') as any) || 'webp',
      quality: parseInt(formData.get('quality') as string) || 85,
      maxWidth: formData.get('maxWidth') ? parseInt(formData.get('maxWidth') as string) : undefined,
      maxHeight: formData.get('maxHeight') ? parseInt(formData.get('maxHeight') as string) : undefined,
      resizeMode: (formData.get('resizeMode') as any) || 'inside',
      preserveMetadata: formData.get('preserveMetadata') === 'true',
      generateThumbnail: formData.get('generateThumbnail') !== 'false',
      thumbnailSize: parseInt(formData.get('thumbnailSize') as string) || 300,
    };

    // Get file buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Get original image metadata
    const metadata = await sharp(buffer).metadata();
    const originalSize = buffer.length;

    // Convert and optimize image
    const result = await convertImage(buffer, options);

    // Calculate compression ratio
    const compressionRatio = ((originalSize - result.size) / originalSize) * 100;

    return NextResponse.json({
      success: true,
      original: {
        size: originalSize,
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
      },
      converted: {
        size: result.size,
        width: result.width,
        height: result.height,
        format: result.format,
        thumbnailSize: result.thumbnailSize,
      },
      compressionRatio: Math.round(compressionRatio * 100) / 100,
      // Return base64 encoded images for preview/download
      image: result.buffer.toString('base64'),
      thumbnail: result.thumbnail?.toString('base64'),
    });

  } catch (error) {
    console.error('Image conversion error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to convert image',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Convert image with Sharp
 */
async function convertImage(
  buffer: Buffer,
  options: ImageConversionOptions
): Promise<ConversionResult> {
  let pipeline = sharp(buffer);

  // Remove metadata unless explicitly preserved (for privacy)
  if (!options.preserveMetadata) {
    pipeline = pipeline.rotate(); // Auto-rotate based on EXIF, then strips EXIF
  }

  // Resize if dimensions specified
  if (options.maxWidth || options.maxHeight) {
    pipeline = pipeline.resize({
      width: options.maxWidth,
      height: options.maxHeight,
      fit: options.resizeMode || 'inside',
      withoutEnlargement: true, // Don't upscale images
    });
  }

  // Convert to target format
  switch (options.format) {
    case 'webp':
      pipeline = pipeline.webp({ 
        quality: options.quality || 85,
        effort: 6, // Balance between compression and speed (0-6)
      });
      break;
    case 'jpeg':
      pipeline = pipeline.jpeg({ 
        quality: options.quality || 85,
        mozjpeg: true, // Use mozjpeg for better compression
      });
      break;
    case 'png':
      pipeline = pipeline.png({ 
        quality: options.quality || 85,
        compressionLevel: 9,
      });
      break;
    case 'avif':
      pipeline = pipeline.avif({ 
        quality: options.quality || 85,
        effort: 6,
      });
      break;
  }

  // Execute conversion
  const convertedBuffer = await pipeline.toBuffer({ resolveWithObject: true });

  const result: ConversionResult = {
    buffer: convertedBuffer.data,
    size: convertedBuffer.info.size,
    width: convertedBuffer.info.width,
    height: convertedBuffer.info.height,
    format: convertedBuffer.info.format,
  };

  // Generate thumbnail if requested
  if (options.generateThumbnail) {
    const thumbnailSize = options.thumbnailSize || 300;
    const thumbnailBuffer = await sharp(buffer)
      .rotate() // Strip EXIF
      .resize({
        width: thumbnailSize,
        height: thumbnailSize,
        fit: 'cover',
        position: 'center',
      })
      .webp({ quality: 80 })
      .toBuffer({ resolveWithObject: true });

    result.thumbnail = thumbnailBuffer.data;
    result.thumbnailSize = thumbnailBuffer.info.size;
  }

  return result;
}
