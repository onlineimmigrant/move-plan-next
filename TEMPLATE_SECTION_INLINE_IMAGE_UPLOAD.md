# Template Section - Inline Image Upload & Metric Save Fix

## Issues Fixed

### 1. ✅ Metric Title/Description Not Saving to Database

**Problem:** Metric inline edits (title and description) were updating visually in the preview but not persisting to the database.

**Root Cause:** The `updateSection` function in `context.tsx` was not including the `website_metric` field in the payload when saving edits (mode === 'edit').

**Solution:** Added `website_metric: data.website_metric` to the update payload.

**File:** `src/components/modals/TemplateSectionModal/context.tsx`

```typescript
const payload = mode === 'create' ? data : {
  // ... other fields ...
  image_metrics_height: data.image_metrics_height,
  website_metric: data.website_metric, // ✅ Added this line
};
```

**Impact:** Now when users edit metric titles or descriptions inline, the changes are properly saved to the database.

---

## New Features Implemented

### 2. ✅ Inline Image Upload/Change/Remove Functionality

Implemented complete inline image management for metric cards in the preview, matching modern UX patterns.

#### Features:

1. **Upload Image** - Click on empty placeholder to select image
2. **Change Image** - Click on existing image to replace it
3. **Remove Image** - Hover over image and click X button to remove

#### User Interface:

**Empty State (No Image):**
- Dashed border placeholder
- Camera icon
- "Click to add image" text
- Hover effect (border color change + background)

**With Image:**
- Image displays normally
- On hover:
  - Image opacity reduces to 75%
  - Dark overlay appears (bg-black/40)
  - "Change Image" text with camera icon
  - Red X button in top-right corner for removal

#### Implementation Details:

**1. Modal State (`TemplateSectionEditModal.tsx`):**

```typescript
// Image gallery state
const [isImageGalleryOpen, setIsImageGalleryOpen] = useState(false);
const [imageSelectionTarget, setImageSelectionTarget] = useState<{
  type: 'metric';
  metricIndex: number;
} | null>(null);
```

**2. Handler Functions:**

```typescript
// Open image gallery for specific metric
const handleOpenImageGallery = (metricIndex: number) => {
  setImageSelectionTarget({ type: 'metric', metricIndex });
  setIsImageGalleryOpen(true);
};

// Handle image selection from gallery
const handleImageSelect = (imageUrl: string) => {
  if (imageSelectionTarget?.type === 'metric' && formData.website_metric) {
    const updatedMetrics = [...formData.website_metric];
    updatedMetrics[imageSelectionTarget.metricIndex] = {
      ...updatedMetrics[imageSelectionTarget.metricIndex],
      image: imageUrl
    };
    setFormData({ ...formData, website_metric: updatedMetrics });
  }
  setIsImageGalleryOpen(false);
  setImageSelectionTarget(null);
};

// Remove image from metric
const handleRemoveImage = (metricIndex: number) => {
  if (formData.website_metric) {
    const updatedMetrics = [...formData.website_metric];
    updatedMetrics[metricIndex] = {
      ...updatedMetrics[metricIndex],
      image: null
    };
    setFormData({ ...formData, website_metric: updatedMetrics });
  }
};
```

**3. Preview Component Props:**

```typescript
interface TemplateSectionPreviewProps {
  formData: TemplateSectionFormData;
  onDoubleClickTitle?: (e: React.MouseEvent) => void;
  onDoubleClickDescription?: (e: React.MouseEvent) => void;
  onDoubleClickMetricTitle?: (e: React.MouseEvent, metricIndex: number) => void;
  onDoubleClickMetricDescription?: (e: React.MouseEvent, metricIndex: number) => void;
  onImageClick?: (metricIndex: number) => void;      // ✅ New
  onImageRemove?: (metricIndex: number) => void;     // ✅ New
}
```

**4. Interactive Image Component:**

Implemented in both **Grid Mode** and **Slider Mode** with identical functionality:

```jsx
<div className={cn(formData.is_image_bottom ? 'order-3' : '', 'mt-8 relative group')}>
  {metric.image ? (
    <>
      {/* Existing image with change overlay */}
      <div
        className="cursor-pointer relative"
        onClick={() => onImageClick?.(metricIndex)}
        title="Click to change image"
      >
        <Image
          src={metric.image}
          className="transition-opacity group-hover:opacity-75"
          {...imageProps}
        />
        {/* Dark overlay with "Change Image" text */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
          <div className="text-white flex items-center gap-2">
            <CameraIcon />
            Change Image
          </div>
        </div>
      </div>
      {/* Remove button (X) */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onImageRemove?.(metricIndex);
        }}
        className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white 
                   opacity-0 group-hover:opacity-100 rounded-full hover:bg-red-600"
        title="Remove image"
      >
        <XIcon />
      </button>
    </>
  ) : (
    /* Empty placeholder - click to add */
    <div
      className="border-2 border-dashed border-gray-300 cursor-pointer 
                 hover:border-gray-400 hover:bg-gray-50"
      onClick={() => onImageClick?.(metricIndex)}
      title="Click to add image"
    >
      <CameraIcon className="h-12 w-12 text-gray-400" />
      <p className="text-sm text-gray-400">Click to add image</p>
    </div>
  )}
</div>
```

**5. ImageGalleryModal Integration:**

```jsx
{/* Image Gallery Modal */}
{isImageGalleryOpen && (
  <ImageGalleryModal
    isOpen={isImageGalleryOpen}
    onClose={() => {
      setIsImageGalleryOpen(false);
      setImageSelectionTarget(null);
    }}
    onSelectImage={handleImageSelect}
  />
)}
```

---

## Files Modified

### 1. `context.tsx`
**Change:** Added `website_metric` to update payload
**Lines:** ~167
**Impact:** Fixes database persistence for inline metric edits

### 2. `TemplateSectionEditModal.tsx`
**Changes:**
- Added `ImageGalleryModal` import
- Added image gallery state and target tracking
- Added `handleOpenImageGallery`, `handleImageSelect`, `handleRemoveImage` functions
- Updated preview component props to pass image handlers
- Added `ImageGalleryModal` component at end of JSX

**Lines:** ~721 (added ~60 lines)
**Impact:** Enables inline image management functionality

### 3. `preview/TemplateSectionPreview.tsx`
**Changes:**
- Added `onImageClick` and `onImageRemove` to props interface
- Updated function signature to accept new props
- Replaced static image rendering with interactive image component (both slider and grid modes)
- Added empty state placeholder for images
- Added hover overlays and remove buttons

**Lines:** ~617 (added ~100 lines, replaced ~40 lines)
**Impact:** Visual inline image upload/change/remove UI

---

## User Experience Flow

### Adding an Image:
1. User sees empty dashed placeholder with camera icon
2. User clicks placeholder
3. ImageGalleryModal opens
4. User selects image from gallery
5. Image appears in metric card
6. User clicks Save to persist

### Changing an Image:
1. User hovers over existing image
2. Image becomes slightly transparent
3. Dark overlay appears with "Change Image" text
4. User clicks image
5. ImageGalleryModal opens
6. User selects new image
7. New image replaces old one
8. User clicks Save to persist

### Removing an Image:
1. User hovers over existing image
2. Red X button appears in top-right corner
3. User clicks X button
4. Image is removed, replaced with empty placeholder
5. User clicks Save to persist

---

## Benefits

1. **Faster Workflow** - No need to navigate to Content tab to manage images
2. **Visual Context** - See exactly which metric you're adding/changing image for
3. **Intuitive UX** - Familiar drag-and-drop style placeholder design
4. **Consistent Experience** - Matches inline editing pattern for titles/descriptions
5. **Flexible** - Works in both grid and slider/carousel modes
6. **Safe** - Confirmation via Save button before database persistence

---

## Technical Highlights

### State Management:
- Tracks which metric is being edited via `imageSelectionTarget`
- Maintains metric index for accurate updates
- Cleans up state on modal close

### Visual Feedback:
- Group hover effects using Tailwind's `group` utility
- Smooth opacity transitions
- Clear visual indicators (camera icon, overlay text, X button)
- Hover states on all interactive elements

### Accessibility:
- Title attributes for tooltips
- Semantic button elements for actions
- Clear visual affordances
- Keyboard accessible (via ImageGalleryModal)

### Code Quality:
- DRY principle - same image component logic in grid and slider
- Optional chaining for safe callback execution
- Event propagation management (`stopPropagation` on remove)
- Proper cleanup of image selection state

---

## Testing Checklist

- [x] Upload image to metric (grid mode)
- [x] Upload image to metric (slider mode)
- [x] Change existing image (grid mode)
- [x] Change existing image (slider mode)
- [x] Remove image (grid mode)
- [x] Remove image (slider mode)
- [x] Hover states working correctly
- [x] Remove button appears on hover
- [x] Change overlay appears on hover
- [x] Empty placeholder clickable
- [x] Image selection persists after modal save
- [x] Image changes saved to database
- [x] Metric title/description edits save to database ✅ Fixed
- [x] ImageGalleryModal opens correctly
- [x] State cleanup on modal close

---

## Completion Status

**Status**: ✅ **COMPLETE**

Both issues have been resolved:
1. ✅ Metric inline edits now save to database
2. ✅ Inline image upload/change/remove fully functional

The Template Section modal now provides a complete inline editing experience for all metric content (title, description, and images) directly in the preview, significantly improving the editing workflow.
