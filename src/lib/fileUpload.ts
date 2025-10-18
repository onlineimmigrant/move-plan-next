import { supabase } from './supabase';

// TypeScript Interfaces
export interface TicketAttachment {
  id: string;
  ticket_id: string;
  response_id?: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  uploaded_by: string;
  uploaded_at: string;
  created_at: string;
  updated_at: string;
}

export interface FileUploadProgress {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  attachmentId?: string;
  previewUrl?: string;
}

// Constants
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'text/plain',
  'text/csv',
];

/**
 * Validate a file before upload
 */
export const validateFile = (file: File): { valid: boolean; error?: string } => {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return { 
      valid: false, 
      error: `File size exceeds 10MB limit (${(file.size / 1024 / 1024).toFixed(2)}MB)` 
    };
  }

  // Check file type
  const isAllowedType = ALLOWED_MIME_TYPES.some(type => {
    if (type.endsWith('/*')) {
      const prefix = type.split('/')[0];
      return file.type.startsWith(prefix + '/');
    }
    return file.type === type;
  });

  if (!isAllowedType) {
    return { 
      valid: false, 
      error: `File type not allowed: ${file.type}. Allowed types: images, PDFs, Word docs, Excel files, text files` 
    };
  }

  return { valid: true };
};

/**
 * Upload a file to Supabase Storage
 */
export const uploadFileToStorage = async (
  file: File,
  ticketId: string,
  responseId: string
): Promise<{ path: string; error?: string }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { path: '', error: 'User not authenticated' };
    }

    // Create unique filename with timestamp
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileName = `${timestamp}_${sanitizedFileName}`;
    
    // File path: {user_id}/{ticket_id}/{timestamp}_{filename}
    const filePath = `${user.id}/${ticketId}/${fileName}`;

    console.log('📤 Uploading file:', filePath);

    const { data, error } = await supabase.storage
      .from('ticket-attachments')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('❌ Upload error:', error);
      return { path: '', error: error.message };
    }

    console.log('✅ File uploaded successfully:', data.path);
    return { path: data.path };
  } catch (err: any) {
    console.error('❌ Unexpected upload error:', err);
    return { path: '', error: err.message || 'Upload failed' };
  }
};

/**
 * Save attachment metadata to database
 */
export const saveAttachmentMetadata = async (
  ticketId: string,
  responseId: string,
  file: File,
  filePath: string
): Promise<{ data: TicketAttachment | null; error?: string }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { data: null, error: 'User not authenticated' };
    }

    console.log('💾 Saving attachment metadata...');

    const { data, error } = await supabase
      .from('ticket_attachments')
      .insert({
        ticket_id: ticketId,
        response_id: responseId,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        file_type: file.type,
        uploaded_by: user.id
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error saving metadata:', error);
      return { data: null, error: error.message };
    }

    console.log('✅ Metadata saved:', data.id);
    return { data };
  } catch (err: any) {
    console.error('❌ Unexpected error saving metadata:', err);
    return { data: null, error: err.message || 'Failed to save metadata' };
  }
};

/**
 * Upload file and save metadata in one operation
 */
export const uploadAttachment = async (
  file: File,
  ticketId: string,
  responseId: string
): Promise<{ attachment: TicketAttachment | null; error?: string }> => {
  // Validate file first
  const validation = validateFile(file);
  if (!validation.valid) {
    return { attachment: null, error: validation.error };
  }

  // Upload to storage
  const uploadResult = await uploadFileToStorage(file, ticketId, responseId);
  if (uploadResult.error || !uploadResult.path) {
    return { attachment: null, error: uploadResult.error || 'Upload failed' };
  }

  // Save metadata
  const metadataResult = await saveAttachmentMetadata(ticketId, responseId, file, uploadResult.path);
  if (metadataResult.error || !metadataResult.data) {
    // Try to delete the uploaded file since metadata save failed
    await deleteFileFromStorage(uploadResult.path);
    return { attachment: null, error: metadataResult.error || 'Failed to save metadata' };
  }

  return { attachment: metadataResult.data };
};

/**
 * Download an attachment from storage
 */
export const downloadAttachment = async (
  filePath: string,
  fileName: string
): Promise<{ error?: string }> => {
  try {
    console.log('📥 Downloading file:', filePath);

    const { data, error } = await supabase.storage
      .from('ticket-attachments')
      .download(filePath);

    if (error) {
      console.error('❌ Download error:', error);
      return { error: error.message };
    }

    // Create blob URL and trigger download
    const url = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log('✅ File downloaded successfully');
    return {};
  } catch (err: any) {
    console.error('❌ Unexpected download error:', err);
    return { error: err.message || 'Download failed' };
  }
};

/**
 * Get a public URL for an attachment (for preview)
 */
export const getAttachmentUrl = async (
  filePath: string
): Promise<{ url: string | null; error?: string }> => {
  try {
    const { data } = supabase.storage
      .from('ticket-attachments')
      .getPublicUrl(filePath);

    // Note: For private buckets, we need to create a signed URL instead
    const { data: signedData, error } = await supabase.storage
      .from('ticket-attachments')
      .createSignedUrl(filePath, 3600); // 1 hour expiry

    if (error) {
      console.error('❌ Error creating signed URL:', error);
      return { url: null, error: error.message };
    }

    return { url: signedData.signedUrl };
  } catch (err: any) {
    console.error('❌ Unexpected error creating URL:', err);
    return { url: null, error: err.message || 'Failed to create URL' };
  }
};

/**
 * Delete a file from storage
 */
export const deleteFileFromStorage = async (
  filePath: string
): Promise<{ error?: string }> => {
  try {
    console.log('🗑️ Deleting file:', filePath);

    const { error } = await supabase.storage
      .from('ticket-attachments')
      .remove([filePath]);

    if (error) {
      console.error('❌ Delete error:', error);
      return { error: error.message };
    }

    console.log('✅ File deleted from storage');
    return {};
  } catch (err: any) {
    console.error('❌ Unexpected delete error:', err);
    return { error: err.message || 'Delete failed' };
  }
};

/**
 * Delete an attachment (both storage and database)
 */
export const deleteAttachment = async (
  attachmentId: string,
  filePath: string
): Promise<{ error?: string }> => {
  try {
    // Delete from database first
    const { error: dbError } = await supabase
      .from('ticket_attachments')
      .delete()
      .eq('id', attachmentId);

    if (dbError) {
      console.error('❌ Error deleting from database:', dbError);
      return { error: dbError.message };
    }

    // Then delete from storage
    const storageResult = await deleteFileFromStorage(filePath);
    if (storageResult.error) {
      console.warn('⚠️ File deleted from DB but storage deletion failed:', storageResult.error);
      // Don't return error - DB deletion succeeded which is more important
    }

    console.log('✅ Attachment deleted successfully');
    return {};
  } catch (err: any) {
    console.error('❌ Unexpected error deleting attachment:', err);
    return { error: err.message || 'Delete failed' };
  }
};

/**
 * Fetch attachments for a ticket response
 */
export const fetchAttachments = async (
  responseId: string
): Promise<{ attachments: TicketAttachment[]; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from('ticket_attachments')
      .select('*')
      .eq('response_id', responseId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('❌ Error fetching attachments:', error);
      return { attachments: [], error: error.message };
    }

    return { attachments: data || [] };
  } catch (err: any) {
    console.error('❌ Unexpected error fetching attachments:', err);
    return { attachments: [], error: err.message || 'Failed to fetch attachments' };
  }
};

/**
 * Check if file is an image
 */
export const isImageFile = (fileType: string): boolean => {
  return fileType.startsWith('image/');
};

/**
 * Check if file is a PDF
 */
export const isPdfFile = (fileType: string): boolean => {
  return fileType === 'application/pdf';
};

/**
 * Get file icon based on type
 */
export const getFileIcon = (fileType: string): string => {
  if (isImageFile(fileType)) return '🖼️';
  if (isPdfFile(fileType)) return '📄';
  if (fileType.includes('word')) return '📝';
  if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊';
  if (fileType.includes('text')) return '📃';
  return '📎';
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Create a preview URL for a local file (before upload)
 */
export const createLocalPreviewUrl = (file: File): string | null => {
  if (!isImageFile(file.type)) return null;
  return URL.createObjectURL(file);
};
