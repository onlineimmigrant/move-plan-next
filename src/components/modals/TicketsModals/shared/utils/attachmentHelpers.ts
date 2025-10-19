import { getAttachmentUrl, isImageFile } from '@/lib/fileUpload';

/**
 * Load signed URLs for image attachments in ticket responses
 * 
 * This function iterates through all responses and their attachments,
 * generating signed URLs for image files only. Non-image files don't
 * need URLs as they're downloaded directly when clicked.
 * 
 * @param responses - Array of ticket responses with attachments
 * @returns Promise<Record<string, string>> - Map of attachment IDs to signed URLs
 * 
 * @example
 * const urls = await loadAttachmentUrls(ticket.ticket_responses);
 * setAttachmentUrls(prev => ({ ...prev, ...urls }));
 */
export async function loadAttachmentUrls(responses: any[]): Promise<Record<string, string>> {
  const urlsMap: Record<string, string> = {};
  
  for (const response of responses) {
    if (response.attachments && Array.isArray(response.attachments)) {
      for (const attachment of response.attachments) {
        // Only load URLs for image files
        if (isImageFile(attachment.file_type)) {
          try {
            const result = await getAttachmentUrl(attachment.file_path);
            if (result.url) {
              urlsMap[attachment.id] = result.url;
            }
          } catch (error) {
            console.error('Error loading attachment URL:', error);
          }
        }
      }
    }
  }
  
  return urlsMap;
}
