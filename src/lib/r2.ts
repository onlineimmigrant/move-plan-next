/**
 * Cloudflare R2 Storage Client
 * Uses Cloudflare API for file operations
 */

const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN!;
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME!;
const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL!;

/**
 * Upload a video file to Cloudflare R2
 */
export async function uploadVideoToR2(
  fileBuffer: Buffer,
  fileName: string,
  contentType: string,
  organizationId: string,
  folder: string = 'uncategorized'
): Promise<string> {
  // Sanitize folder name
  const sanitizedFolder = folder.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
  const objectKey = `${organizationId}/videos/${sanitizedFolder}/${fileName}`;
  
  // Upload using Cloudflare R2 API
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${R2_ACCOUNT_ID}/r2/buckets/${R2_BUCKET_NAME}/objects/${objectKey}`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        'Content-Type': contentType,
        'Content-Length': fileBuffer.length.toString(),
      },
      body: new Uint8Array(fileBuffer),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to upload to R2: ${response.status} ${error}`);
  }

  return `${R2_PUBLIC_URL}/${objectKey}`;
}

/**
 * Rename a video file in R2 (copy to new name, delete old)
 */
export async function renameVideoInR2(
  oldKey: string,
  newFileName: string,
  organizationId: string
): Promise<string> {
  // Extract folder from old key
  const parts = oldKey.split('/');
  const folder = parts.length >= 3 ? parts[2] : 'uncategorized';
  const newKey = `${organizationId}/videos/${folder}/${newFileName}`;

  // Note: R2 doesn't have native rename, so we'd need to copy then delete
  // For now, return the new key format - actual implementation needs copy operation
  // This is a placeholder that should be implemented with proper copy logic
  throw new Error('Rename not yet implemented - requires copy operation');
}

/**
 * Delete a video file from R2
 */
export async function deleteVideoFromR2(fileName: string): Promise<void> {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${R2_ACCOUNT_ID}/r2/buckets/${R2_BUCKET_NAME}/objects/${fileName}`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to delete from R2: ${response.status} ${error}`);
  }
}

/**
 * Extract filename from R2 public URL
 */
export function getFileNameFromR2Url(url: string): string {
  const urlObj = new URL(url);
  const pathParts = urlObj.pathname.split('/');
  return pathParts[pathParts.length - 1];
}

/**
 * Generic upload to R2 (for AI-generated videos, thumbnails, etc.)
 * Automatically handles organization isolation and folder structure
 */
export async function uploadToR2Generic(
  fileBuffer: Buffer,
  fileName: string,
  contentType: string,
  organizationId: string,
  subfolder: string = 'ai-generated'
): Promise<string> {
  // Sanitize subfolder name
  const sanitizedFolder = subfolder.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
  const objectKey = `${organizationId}/videos/${sanitizedFolder}/${fileName}`;
  
  console.log('[R2] Uploading to:', objectKey);
  
  // Upload using Cloudflare R2 API
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${R2_ACCOUNT_ID}/r2/buckets/${R2_BUCKET_NAME}/objects/${objectKey}`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        'Content-Type': contentType,
        'Content-Length': fileBuffer.length.toString(),
      },
      body: new Uint8Array(fileBuffer),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error('[R2] Upload failed:', error);
    throw new Error(`Failed to upload to R2: ${response.status} ${error}`);
  }

  const publicUrl = `${R2_PUBLIC_URL}/${objectKey}`;
  console.log('[R2] Upload successful:', publicUrl);
  
  return publicUrl;
}
