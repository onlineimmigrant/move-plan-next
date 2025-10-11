# Hero Section Color Routes & Data Flow

## 📋 Summary

The Hero Section uses **JSONB columns** to store styling data including colors for title, background, and button. Here's the complete data flow:

---

## 🛣️ API Routes

### **PUT /api/hero-section/[id]**
**File:** `/src/app/api/hero-section/[id]/route.ts`

**Purpose:** Update existing hero section

**Request Body Structure:**
```json
{
  "title": "string",
  "description": "string",
  "button": "string",
  "image": "string",
  "animation_element": "string",
  "title_translation": {},
  "description_translation": {},
  "button_translation": {},
  "title_style": {
    "color": "string",
    "gradient": {
      "from": "string",
      "via": "string",
      "to": "string"
    },
    "size": { "desktop": "string", "mobile": "string" },
    "alignment": "string",
    "blockWidth": "string",
    "blockColumns": 1
  },
  "description_style": {
    "color": "string",
    "size": { "desktop": "string", "mobile": "string" },
    "weight": "string"
  },
  "image_style": {
    "position": "string",
    "fullPage": false,
    "height": 0,
    "width": 0
  },
  "background_style": {
    "color": "string",
    "gradient": {
      "from": "string",
      "via": "string",
      "to": "string"
    },
    "seo_title": "string",
    "column": 1
  },
  "button_style": {
    "aboveDescription": false,
    "isVideo": false,
    "url": "string",
    "color": "string",
    "gradient": {
      "from": "string",
      "via": "string",
      "to": "string"
    }
  }
}
```

---

## 📊 Database Schema

**Table:** `website_hero`

### JSONB Columns (from `hero_jsonb_migration.sql`):

1. **`title_style`** - JSONB
   - Stores: `color`, `gradient`, `size`, `alignment`, `blockWidth`, `blockColumns`
   - Index: `idx_website_hero_title_style` (GIN)

2. **`description_style`** - JSONB
   - Stores: `color`, `size`, `weight`
   - Index: `idx_website_hero_description_style` (GIN)

3. **`image_style`** - JSONB
   - Stores: `position`, `fullPage`, `height`, `width`
   - Index: `idx_website_hero_image_style` (GIN)

4. **`background_style`** - JSONB
   - Stores: `color`, `gradient`, `seo_title`, `column`
   - Index: `idx_website_hero_background_style` (GIN)

5. **`button_style`** - JSONB
   - Stores: `aboveDescription`, `isVideo`, `url`, `color`, `gradient`
   - Index: `idx_website_hero_button_style` (GIN)

---

## 🎨 Color Storage Structure

### **Title Colors:**
```typescript
title_style: {
  color?: string;              // Single color (e.g., "gray-800")
  gradient?: {                 // Gradient colors
    from: string;
    via?: string;
    to: string;
  }
}
```

### **Background Colors:**
```typescript
background_style: {
  color?: string;              // Single color
  gradient?: {                 // Gradient colors
    from: string;
    via?: string;
    to: string;
  }
}
```

### **Button Colors:**
```typescript
button_style: {
  color?: string;              // Single color
  gradient?: {                 // Gradient colors
    from: string;
    via?: string;
    to: string;
  }
}
```

### **Description Color:**
```typescript
description_style: {
  color?: string;              // Single color only
}
```

---

## 🔄 Data Flow

### **Frontend → Backend:**

1. **User edits colors** in `HeroSectionEditModal.tsx`
   - Updates `formData` state with new color values
   - Color pickers use `ColorPaletteDropdown` component

2. **User clicks Save**
   - `handleSave()` calls `updateSection(formData)`

3. **Context handles save** in `context.tsx`
   - Merges formData with existing section data
   - Filters out undefined values
   - Sends PUT request to `/api/hero-section/[id]`

4. **API processes request** in `route.ts`
   - Extracts JSONB fields from request body
   - Updates database using Supabase Admin client
   - Returns updated record

### **Backend → Frontend:**

1. **Data fetched** via GET `/api/hero-section/[id]`
2. **JSONB fields parsed** automatically by Supabase
3. **Modal populates** formData with nested color values
4. **Color pickers display** current colors from JSONB

---

## ✅ Current Implementation Status

### **Working:**
- ✅ Title color (single + gradient)
- ✅ Background color (single + gradient)
- ✅ Button color (single + gradient)
- ✅ Description color (single)
- ✅ Image style controls (position, fullPage, height, width)

### **Modal UI Features:**
- ✅ 5 categorized dropdown menus (Image Gallery, Image Style, Layout, Title, Description, Button)
- ✅ Mobile-responsive (icon-only buttons, full-screen dropdowns)
- ✅ Color pickers with z-index layering (z-[9999])
- ✅ Click-outside-to-close functionality
- ✅ Gradient toggles and multiple color pickers per style

---

## 🔧 Key Files

1. **API Route:**
   - `/src/app/api/hero-section/[id]/route.ts`

2. **Modal Component:**
   - `/src/components/modals/HeroSectionModal/HeroSectionEditModal.tsx`

3. **Context (Save Logic):**
   - `/src/components/modals/HeroSectionModal/context.tsx`

4. **Type Definitions:**
   - `/src/types/hero_data.ts`

5. **Database Migration:**
   - `/hero_jsonb_migration.sql`

---

## 📝 Notes

- All color data is stored as JSONB in PostgreSQL
- GIN indexes optimize JSONB query performance
- Color values are stored as Tailwind class strings (e.g., "gray-800")
- Gradient support requires 3 color pickers (from, via, to)
- `is_gradient` flag in formData determines if gradient is active
- Modal form data includes `is_gradient` for UI state, but API only stores `gradient` object

---

**Last Updated:** October 11, 2025
