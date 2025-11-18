# R2 Video Folder Organization - Implementation Summary

## ✅ Completed Features

### 1. Folder Support
**Structure:** `{organizationId}/videos/{folderName}/{filename.mp4}`

- Videos organized into folders for better management
- Default "uncategorized" folder for backward compatibility
- Folder names sanitized (only alphanumeric, dash, underscore)

### 2. Backend Enhancements

#### Updated Endpoints:
- **`POST /api/upload-video`**
  - Accepts optional `folder` form field
  - Stores videos in `{orgId}/videos/{folder}/{filename}`
  - Returns folder in response
  
- **`GET /api/r2-videos`**
  - Optional `?folder=name` query parameter for filtering
  - Returns `folders` array with all available folders
  - Each video includes `folder` and `fullKey` properties
  
- **`POST /api/rename-r2-video`**
  - Renames videos via copy + delete (R2 limitation)
  - Preserves folder structure
  - Updates `product_media` references automatically
  
- **`GET /api/products/[id]/r2-videos`**
  - Enhanced with folder information
  - Returns folders list and folder property per video

#### Updated Utility:
- **`src/lib/r2.ts`**
  - `uploadVideoToR2()` accepts optional `folder` parameter
  - Folder name sanitization built-in

### 3. New Compact UI Component
**File:** `src/components/modals/ImageGalleryModal/R2VideoUploadCompact.tsx`

#### Features:
- **Compact Upload Area** - Small, single-line drag-and-drop zone
- **Folder Management:**
  - Create new folders inline
  - Filter videos by folder
  - Display video count per folder
  - "All Folders" view
  
- **Video Grid:**
  - 3-column compact layout
  - Video thumbnails with hover preview
  - Smaller video cards (aspect-video)
  - Max height with scroll for large libraries
  
- **Rename Functionality:**
  - Inline rename with pencil icon
  - Preserves file extension
  - Enter to save, Escape to cancel
  
- **Delete:**
  - Trash icon on hover
  - Confirmation dialog
  - Updates UI immediately
  
- **Visual Indicators:**
  - Selected video highlighted with blue border + ring
  - Hover effects on all interactive elements
  - Loading states
  - Error messages

### 4. Backward Compatibility
- Existing videos without folder structure treated as "uncategorized"
- Old upload code still works (defaults to "uncategorized")
- Database schema unchanged (folder info stored in R2 keys)

## Usage

### Replace Old Component
```tsx
// Instead of:
import R2VideoUpload from '@/components/modals/ImageGalleryModal/R2VideoUpload';

// Use:
import R2VideoUploadCompact from '@/components/modals/ImageGalleryModal/R2VideoUploadCompact';

// Same props:
<R2VideoUploadCompact 
  onSelectVideo={handleSelect}
  productId={productId} // optional
/>
```

### Upload with Folder
```typescript
const formData = new FormData();
formData.append('file', videoFile);
formData.append('folder', 'product-demos'); // optional

await fetch('/api/upload-video', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData,
});
```

### List Specific Folder
```typescript
const response = await fetch('/api/r2-videos?folder=tutorials', {
  headers: { 'Authorization': `Bearer ${token}` },
});
// Returns only videos in "tutorials" folder
```

### Rename Video
```typescript
await fetch('/api/rename-r2-video', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}` 
  },
  body: JSON.stringify({
    oldKey: 'orgId/videos/folder/old-name.mp4',
    newFileName: 'new-name.mp4'
  }),
});
```

## File Structure
```
{organizationId}/
  videos/
    uncategorized/
      video1.mp4
      video2.webm
    product-demos/
      demo1.mp4
      demo2.mp4
    tutorials/
      tutorial1.mp4
```

## Next Steps (Optional)

### Phase 2: Image Support
1. Create `/api/upload-image` endpoint
2. Add `/api/r2-images` listing with folders
3. Support multiple formats (JPG, PNG, WebP, AVIF)
4. Auto-generate thumbnails/responsive variants
5. Build `R2ImageUploadCompact` component
6. Integrate with existing image pickers

### Suggested Image Structure:
```
{organizationId}/
  images/
    products/
      image1.jpg
      image1-thumb.jpg (auto-generated)
      image1-webp.webp (auto-generated)
    posts/
      hero1.png
      hero1-thumb.jpg
    logos/
      logo.svg
```

## Benefits
✅ Better organization for large video libraries  
✅ Faster filtering and browsing  
✅ Cleaner UI with compact cards  
✅ Inline rename without leaving modal  
✅ Visual folder structure  
✅ Proper multi-tenant isolation maintained  
✅ Ready for image expansion

## Testing Checklist
- [ ] Upload video to new folder
- [ ] Upload video to existing folder  
- [ ] Create new folder inline
- [ ] Filter by folder
- [ ] Rename video
- [ ] Delete video
- [ ] Multi-tenant isolation (different orgs see different folders)
- [ ] Product auto-attach still works
- [ ] Backward compatibility with old videos
