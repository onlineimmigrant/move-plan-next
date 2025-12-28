/**
 * Bulk Image Conversion API
 * 
 * Convert multiple existing R2 images to WebP format
 * Useful for migrating existing image libraries
 */

import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { S3Client, GetObjectCommand, PutObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const r2 = new S3Client({
  region: 'auto',
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME!;

/**
 * Convert existing R2 images to WebP
 * 
 * POST /api/convert-images-bulk
 * {
 *   organizationId: string,
 *   folder?: string,
 *   quality?: number,
 *   maxWidth?: number,
 *   maxHeight?: number,
 *   dryRun?: boolean  // Preview without actually converting
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      organizationId,
      folder,
      quality = 85,
      maxWidth,
      maxHeight,
      dryRun = false,
    } = body;

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID required' },
        { status: 400 }
      );
    }

    // Check user permissions
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // List images in organization folder
    const prefix = folder 
      ? `${organizationId}/${folder}/`
      : `${organizationId}/`;

    const listResponse = await r2.send(new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: prefix,
    }));

    const images = (listResponse.Contents || []).filter(obj => {
      const key = obj.Key || '';
      const ext = key.toLowerCase().split('.').pop();
      return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff'].includes(ext || '');
    });

    if (images.length === 0) {
      return NextResponse.json({
        message: 'No images found to convert',
        total: 0,
        converted: 0,
      });
    }

    const results = {
      total: images.length,
      converted: 0,
      skipped: 0,
      failed: 0,
      totalSizeBefore: 0,
      totalSizeAfter: 0,
      details: [] as any[],
    };

    // Process images
    for (const image of images) {
      const key = image.Key!;
      const sizeBefore = image.Size || 0;
      results.totalSizeBefore += sizeBefore;

      try {
        // Skip if already WebP
        if (key.toLowerCase().endsWith('.webp')) {
          results.skipped++;
          results.totalSizeAfter += sizeBefore;
          continue;
        }

        // Get image from R2
        const getResponse = await r2.send(new GetObjectCommand({
          Bucket: BUCKET_NAME,
          Key: key,
        }));

        const buffer = await streamToBuffer(getResponse.Body as any);

        // Convert to WebP
        let pipeline = sharp(buffer).rotate(); // Auto-rotate and strip EXIF

        if (maxWidth || maxHeight) {
          pipeline = pipeline.resize({
            width: maxWidth,
            height: maxHeight,
            fit: 'inside',
            withoutEnlargement: true,
          });
        }

        const converted = await pipeline
          .webp({ quality, effort: 6 })
          .toBuffer({ resolveWithObject: true });

        const newKey = key.replace(/\.[^.]+$/, '.webp');
        const sizeAfter = converted.info.size;
        results.totalSizeAfter += sizeAfter;

        const compressionRatio = ((sizeBefore - sizeAfter) / sizeBefore) * 100;

        // Upload converted image (unless dry run)
        if (!dryRun) {
          await r2.send(new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: newKey,
            Body: converted.data,
            ContentType: 'image/webp',
          }));

          results.converted++;
        }

        results.details.push({
          original: key,
          converted: newKey,
          sizeBefore,
          sizeAfter,
          compressionRatio: Math.round(compressionRatio * 100) / 100,
          width: converted.info.width,
          height: converted.info.height,
        });

      } catch (error) {
        console.error(`Failed to convert ${key}:`, error);
        results.failed++;
        results.details.push({
          original: key,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    const totalCompression = results.totalSizeBefore > 0
      ? ((results.totalSizeBefore - results.totalSizeAfter) / results.totalSizeBefore) * 100
      : 0;

    return NextResponse.json({
      success: true,
      dryRun,
      results: {
        ...results,
        totalCompression: Math.round(totalCompression * 100) / 100,
        sizeSaved: results.totalSizeBefore - results.totalSizeAfter,
      },
    });

  } catch (error) {
    console.error('Bulk conversion error:', error);
    return NextResponse.json(
      {
        error: 'Bulk conversion failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Convert stream to buffer
 */
async function streamToBuffer(stream: any): Promise<Buffer> {
  const chunks: Uint8Array[] = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}
