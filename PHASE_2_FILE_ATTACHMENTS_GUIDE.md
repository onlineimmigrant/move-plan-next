# Phase 2: File Attachments Implementation Guide

## Overview
Add file upload/download capabilities to the ticket system, allowing customers and admins to attach images, PDFs, and documents to their messages.

## Database Setup

### Step 1: Create ticket_attachments Table
Run the migration file: `add_file_attachments_to_tickets.sql`

This creates:
- ✅ `ticket_attachments` table with metadata columns
- ✅ Indexes for performance (ticket_id, response_id, uploaded_by)
- ✅ RLS policies for secure access
- ✅ Automatic updated_at timestamp trigger

### Step 2: Create Supabase Storage Bucket

**Option A: Via Supabase Dashboard (Recommended)**
1. Go to Storage in Supabase Dashboard
2. Click "Create New Bucket"
3. Settings:
   - Name: `ticket-attachments`
   - Public: **OFF** (private bucket)
   - File size limit: `10485760` (10MB)
   - Allowed MIME types:
     ```
     image/*
     application/pdf
     application/msword
     application/vnd.openxmlformats-officedocument.*
     application/vnd.ms-excel
     application/vnd.openxmlformats-officedocument.spreadsheetml.*
     text/plain
     text/csv
     ```
4. After creation, run `setup_storage_bucket_for_attachments.sql` for RLS policies

**Option B: Programmatically**
```typescript
const { data, error } = await supabase.storage.createBucket('ticket-attachments', {
  public: false,
  fileSizeLimit: 10485760,
  allowedMimeTypes: ['image/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.*', 'text/plain']
});
```

## File Upload Flow

### Architecture
```
User selects file(s)
  ↓
Validate file (size, type)
  ↓
Upload to Supabase Storage: ticket-attachments/{ticket_id}/{response_id}/{filename}
  ↓
Save metadata to ticket_attachments table
  ↓
Display attachment in UI with preview/download
```

### File Path Structure
```
ticket-attachments/
  ├── {ticket_id}/
      ├── {response_id}/
          ├── {timestamp}_{filename}
```

## UI Components Needed

### 1. File Upload Zone (Both Modals)
- Drag-and-drop area
- File input button
- Multiple file selection
- Visual feedback during drag

### 2. File Preview Before Upload
- Show selected files with:
  - Thumbnail (for images)
  - File name
  - File size
  - Remove button

### 3. Upload Progress
- Progress bar for each file
- Cancel upload button
- Error handling

### 4. Attachment Display in Messages
- Small preview thumbnails for images
- Icons for PDFs/docs
- File name and size
- Download button
- Delete button (own files only)

### 5. File Preview Modal
- Full-size image viewer
- PDF viewer (iframe or new tab)
- Document download

## TypeScript Interfaces

```typescript
interface TicketAttachment {
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

interface FileUploadProgress {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  attachmentId?: string;
}
```

## Implementation Steps

### Step 1: Update TicketResponse Interface
```typescript
interface TicketResponse {
  // ... existing fields
  attachments?: TicketAttachment[];
}
```

### Step 2: Create File Upload Utility Functions
```typescript
// src/lib/fileUpload.ts
export const validateFile = (file: File): { valid: boolean; error?: string } => {
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_TYPES = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ];

  if (file.size > MAX_SIZE) {
    return { valid: false, error: 'File size exceeds 10MB limit' };
  }

  if (!ALLOWED_TYPES.some(type => file.type.match(type))) {
    return { valid: false, error: 'File type not allowed' };
  }

  return { valid: true };
};

export const uploadFileToStorage = async (
  file: File,
  ticketId: string,
  responseId: string,
  onProgress?: (progress: number) => void
): Promise<{ path: string; error?: string }> => {
  const timestamp = Date.now();
  const fileName = `${timestamp}_${file.name}`;
  const filePath = `${ticketId}/${responseId}/${fileName}`;

  const { data, error } = await supabase.storage
    .from('ticket-attachments')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    return { path: '', error: error.message };
  }

  return { path: filePath };
};

export const saveAttachmentMetadata = async (
  ticketId: string,
  responseId: string,
  file: File,
  filePath: string
): Promise<{ data: TicketAttachment | null; error?: string }> => {
  const { data: user } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from('ticket_attachments')
    .insert({
      ticket_id: ticketId,
      response_id: responseId,
      file_name: file.name,
      file_path: filePath,
      file_size: file.size,
      file_type: file.type,
      uploaded_by: user?.user?.id
    })
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data };
};
```

### Step 3: Add File Upload to Message Sending
Update `handleAdminRespond` and customer response functions to:
1. Accept array of files
2. Upload files to storage
3. Save metadata to database
4. Include attachment IDs in response

### Step 4: Fetch Attachments with Messages
Update the ticket response query to include attachments:
```typescript
const { data: responses } = await supabase
  .from('ticket_responses')
  .select(`
    *,
    attachments:ticket_attachments(*)
  `)
  .eq('ticket_id', ticketId)
  .order('created_at', { ascending: true });
```

### Step 5: Display Attachments in UI
- Render attachment thumbnails/icons below each message
- Add click handlers for preview/download
- Show loading state during upload

### Step 6: Implement File Download
```typescript
export const downloadAttachment = async (filePath: string, fileName: string) => {
  const { data, error } = await supabase.storage
    .from('ticket-attachments')
    .download(filePath);

  if (error) {
    console.error('Error downloading file:', error);
    return;
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
};
```

### Step 7: Implement File Preview
- Images: Display in modal with full size
- PDFs: Use iframe or open in new tab
- Docs: Download only

## Security Considerations

✅ **File Size Limits**: 10MB per file (enforced in validation)
✅ **File Type Validation**: Only allow specific MIME types
✅ **RLS Policies**: Users can only access their own ticket files
✅ **Private Storage**: Bucket is not public
✅ **Authentication**: All operations require auth.uid()
✅ **Sanitization**: Timestamp prefix prevents filename conflicts

## Features to Implement

### MVP (Minimum Viable Product)
- [ ] File upload button
- [ ] Single file upload
- [ ] Image thumbnail preview
- [ ] File download
- [ ] File size/type validation
- [ ] Basic error handling

### Enhanced Features
- [ ] Drag-and-drop upload
- [ ] Multiple file upload
- [ ] Upload progress indicator
- [ ] Image preview modal (full size)
- [ ] PDF preview (iframe)
- [ ] Delete attachments
- [ ] File compression (images)
- [ ] Thumbnail generation

### Future Enhancements
- [ ] Copy/paste images from clipboard
- [ ] Image editing (crop, resize)
- [ ] Video file support
- [ ] Archive file support (.zip)
- [ ] Virus scanning integration
- [ ] CDN integration for faster downloads

## Testing Checklist

- [ ] Upload image file < 10MB
- [ ] Upload PDF file < 10MB
- [ ] Try uploading file > 10MB (should fail)
- [ ] Try uploading .exe file (should fail)
- [ ] Upload multiple files at once
- [ ] Download uploaded file
- [ ] Preview image attachment
- [ ] Delete own attachment
- [ ] Verify RLS: User cannot access other user's files
- [ ] Verify RLS: Admin can access all files
- [ ] Test drag-and-drop upload
- [ ] Test upload progress indicator
- [ ] Test error handling (network failure, storage quota)

## Next Steps

1. ✅ Create database migration
2. ✅ Create storage bucket setup SQL
3. ⏭️ Run database migration
4. ⏭️ Create storage bucket in Supabase
5. ⏭️ Create file upload utilities
6. ⏭️ Add file upload UI to customer modal
7. ⏭️ Add file upload UI to admin modal
8. ⏭️ Implement file display in messages
9. ⏭️ Add file download functionality
10. ⏭️ Add file preview modal
11. ⏭️ Test thoroughly
12. ⏭️ Document for users
