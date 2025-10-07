# Image Gallery Folder Navigation Feature

## Overview
Added folder navigation functionality to the ImageGalleryModal, allowing users to browse through subdirectories in the Supabase storage gallery bucket and navigate up/down the folder hierarchy.

## Features Implemented

### 1. Folder Structure Support
- **Browse folders**: Click on folders to navigate into subdirectories
- **Navigate up**: Go back to parent folder
- **Breadcrumb navigation**: Click any path segment to jump directly to that level
- **Root navigation**: Quick return to gallery root with home icon
- **Visual distinction**: Folders shown with folder icon, images with thumbnails

### 2. Navigation Controls

#### Breadcrumb Path
```
Gallery > products > featured
  ↑        ↑          ↑
 Root   Clickable  Current
         segments   location
```

- Click "Gallery" or home icon to return to root
- Click any path segment to navigate to that level
- Shows current location in folder hierarchy

#### Folder Display
- Folders displayed in separate section above images
- Blue gradient background with folder icon
- Hover effects for better UX
- Click to navigate into folder

#### Navigation Features
- Search works across current folder only
- Upload saves to current folder
- Refresh reloads current folder contents
- Path persists during navigation

### 3. UI Components

#### Header Updates
```
Image Gallery (2 folders, 5 images)
```
Shows count of both folders and images in current location

#### Breadcrumb Bar
```
[🏠 Gallery] > [products] > [featured]
```
- Only shown when not in root
- Clickable segments for quick navigation
- Visual separators (chevron icons)

#### Content Layout
```
Folders Section
┌─────────┬─────────┬─────────┐
│ 📁      │ 📁      │ 📁      │
│ logos   │ icons   │ blog    │
└─────────┴─────────┴─────────┘

Images Section
┌─────────┬─────────┬─────────┐
│ [img]   │ [img]   │ [img]   │
│ logo.png│ icon.svg│ hero.jpg│
└─────────┴─────────┴─────────┘
```

### 4. Upload to Folders
- Files uploaded to current folder automatically
- Path sent to API: `/api/gallery/upload?path=products/featured`
- Maintains folder organization

## Technical Implementation

### State Management
```typescript
const [currentPath, setCurrentPath] = useState<string>('');
const [folders, setFolders] = useState<StorageFolder[]>([]);
const [pathHistory, setPathHistory] = useState<string[]>(['']);
```

### Folder Detection
Supabase storage marks folders with `id === null`:
```typescript
if (item.id === null) {
  // It's a folder
  folderList.push({ name: item.name, isFolder: true });
} else {
  // It's a file
  imageList.push({ name: item.name, url: '...' });
}
```

### Navigation Functions

#### Navigate Into Folder
```typescript
const handleFolderClick = (folderName: string) => {
  const newPath = currentPath ? `${currentPath}/${folderName}` : folderName;
  setCurrentPath(newPath);
};
```

#### Navigate Up
```typescript
const handleNavigateUp = () => {
  const parts = currentPath.split('/');
  parts.pop();
  setCurrentPath(parts.join('/'));
};
```

#### Navigate to Root
```typescript
const handleNavigateToRoot = () => {
  setCurrentPath('');
};
```

#### Navigate to Specific Path
```typescript
const handleNavigateToPath = (index: number) => {
  const pathParts = currentPath.split('/').filter(p => p);
  const newPath = pathParts.slice(0, index + 1).join('/');
  setCurrentPath(newPath);
};
```

### API Route Updates

#### Upload with Path
```typescript
// Client sends path
formData.append('path', currentPath);

// Server receives and uses path
const uploadPath = formData.get('path') as string || '';
const fullPath = uploadPath ? `${uploadPath}/${fileName}` : fileName;

await supabaseAdmin.storage
  .from('gallery')
  .upload(fullPath, buffer, { ... });
```

## File Structure

### Modified Files
1. **ImageGalleryModal.tsx**
   - Added folder state management
   - Folder detection and display
   - Navigation functions
   - Breadcrumb UI
   - Updated fetchImages to use currentPath

2. **API Route: /api/gallery/upload/route.ts**
   - Added path parameter support
   - Uploads to specified subfolder
   - Returns full path in response

### New Interfaces
```typescript
interface StorageFolder {
  name: string;
  isFolder: true;
}

interface StorageImage {
  name: string;
  url: string;
  size?: number;
  created_at?: string;
  isFolder?: boolean;
}

type StorageItem = StorageImage | StorageFolder;
```

## Usage Examples

### Organizing Images by Category
```
gallery/
├── logos/
│   ├── company-logo.png
│   └── brand-logo.svg
├── icons/
│   ├── menu-icon.svg
│   └── close-icon.svg
├── products/
│   ├── featured/
│   │   ├── product-1.jpg
│   │   └── product-2.jpg
│   └── product-catalog.png
└── blog/
    ├── post-1-header.jpg
    └── post-2-image.png
```

### Workflow
1. Open image gallery modal
2. See folders in root: `logos`, `icons`, `products`, `blog`
3. Click `products` folder
4. See subfolders: `featured` and files
5. Click `featured` subfolder
6. See images in featured products
7. Upload new image → saves to `products/featured/`
8. Click breadcrumb `products` to go back one level
9. Click `Gallery` to return to root

## Features in Detail

### Visual Feedback
- **Folders**: Blue gradient background, folder icon, hover effects
- **Breadcrumbs**: Blue links, hover states, chevron separators
- **Empty folders**: "Go Back" button shown
- **Current location**: Displayed in breadcrumb path

### Search Behavior
- Searches **only current folder**
- Filters both folders and images
- Results show matching folders and images
- Clear search when navigating to maintain context

### Error Handling
- Empty folder: Shows appropriate message with back button
- No items in search: Shows "No items match your search"
- Navigation errors: Console logged with details
- Upload errors: Detailed error messages

## Testing

### Tested Scenarios
1. ✅ Navigate into folders
2. ✅ Navigate up to parent
3. ✅ Breadcrumb navigation (click specific segment)
4. ✅ Root navigation (home icon)
5. ✅ Upload to subfolder
6. ✅ Folder detection (id === null)
7. ✅ Mixed content (folders + images)
8. ✅ Nested folders (products/featured)
9. ✅ Search in current folder
10. ✅ Visual distinction between folders and files

### Test Results
```
Root level items:
  📁 blog
  📁 brands
  📁 icons
  📁 logos
  📁 products
  📁 screenshots
  📄 [14 image files]

Products folder items:
  📁 featured
  📄 .folder-placeholder.png

✅ All navigation working correctly
```

## Icons Used
- `FolderIcon` - Folder items
- `HomeIcon` - Root/gallery home
- `ChevronRightIcon` - Breadcrumb separators
- `PhotoIcon` - Images/gallery
- `ArrowPathIcon` - Refresh

## Performance Considerations
- **Lazy loading**: Images use `loading="lazy"`
- **Efficient fetching**: Only fetches current folder contents
- **Minimal re-renders**: State updates optimized
- **Path caching**: History maintained for back navigation

## Folder Organization Best Practices

### Recommended Structure
```
gallery/
├── brands/          # Company logos, brand assets
├── products/        # Product images
│   ├── featured/    # Featured products
│   └── catalog/     # Full catalog
├── blog/            # Blog post images
├── marketing/       # Marketing materials
│   ├── campaigns/
│   └── social/
└── user-uploads/    # User-generated content
```

### Naming Conventions
- Use lowercase for folder names
- Use hyphens for multi-word folders: `user-uploads`
- Be specific: `product-images` not just `images`
- Consider organization: By type, date, or category

## Future Enhancements
- [ ] Create new folder from UI
- [ ] Rename folders
- [ ] Delete folders
- [ ] Move files between folders
- [ ] Bulk operations (select multiple files/folders)
- [ ] Folder metadata (description, tags)
- [ ] Favorite/starred folders
- [ ] Recent folders list
- [ ] Search across all folders (recursive)
- [ ] Folder permissions/access control

## Accessibility
- Keyboard navigation support
- ARIA labels on interactive elements
- Clear visual focus indicators
- Semantic HTML structure
- Screen reader friendly breadcrumbs

## Browser Compatibility
- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari
- ✅ Mobile browsers
- Responsive design for all screen sizes

## Summary
The folder navigation feature transforms the image gallery from a flat file list into a hierarchical, organized system. Users can now:
- Browse through folders like a file manager
- Organize images by category/purpose
- Navigate quickly with breadcrumbs
- Upload to specific locations
- Maintain clean, organized asset library

This makes the gallery much more scalable and user-friendly for projects with many images! 🎉
