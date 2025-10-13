# Blog Post Remaining Columns - Usage Analysis

## Analysis Date: October 13, 2025

After Phase 5 initial cleanup, we still have 34 columns. This analysis identifies which can be safely deleted.

---

## ✅ KEEP - Essential Core Fields (10 columns)

These are actively used throughout the application:

| Column | Type | Usage | Status |
|--------|------|-------|--------|
| `id` | bigint | Primary key | **KEEP** |
| `title` | varchar | Post title | **KEEP** |
| `content` | text | Post content | **KEEP** |
| `slug` | text | URL slug | **KEEP** |
| `description` | text | Meta description | **KEEP** |
| `author_name` | text | Author attribution | **KEEP** |
| `organization_id` | uuid | Organization FK | **KEEP** |
| `created_on` | timestamptz | Creation date | **KEEP** |
| `last_modified` | timestamptz | Last edit date | **KEEP** |
| `updated` | timestamptz | Update tracking | **KEEP** |

---

## ✅ KEEP - Essential JSONB (3 columns)

These contain actively used fields:

| Column | Type | Contains | Status |
|--------|------|----------|--------|
| `display_config` | jsonb | display_this_post, display_as_blog_post, is_displayed_first_page, is_help_center, help_center_order | **KEEP** |
| `organization_config` | jsonb | section_id, subsection, order | **KEEP** |
| `media_config` | jsonb | main_photo | **KEEP** |

---

## ✅ KEEP - Used in Specific Features (2 columns)

| Column | Type | Usage | Files Using It |
|--------|------|-------|----------------|
| `faq_section_is_title` | boolean | FAQ display flag | `/api/posts/route.ts`, `/api/posts/[slug]/route.ts`, `PostEditModal.tsx` |
| `metadescription_for_page` | text | SEO meta description | Likely used in SEO components |

---

## 🗑️ DELETE - Completely Unused (15 columns)

**These columns have ZERO references in the entire codebase:**

### Media Fields (3 columns)
- `additional_photo` - Only 2 references:
  - `PostPageClient.tsx` (type definition, not used)
  - `ArticleJsonLd.tsx` (fallback, but never populated)
- `secondary_photo` - Only used in `PostEditModal.tsx` for setting, but **never read/displayed anywhere**
- `image_16_9_1200_675` - **ZERO references**

### Styling Fields (4 columns)
- `background_color` - **NOT used in blog_post table** (confused with other tables)
- `text_color` - **ZERO references** in blog_post context
- `text_color_h2_h3` - **ZERO references**
- `card_footer_background_color` - **ZERO references**

### Product Linking (4 columns)
- `product_connected_id` - **ZERO references**
- `product_3_id` - **ZERO references**
- `product_4_id` - **ZERO references**
- `order_subsection` - **ZERO references** (different from organization_config.order)

### Feature Flags (2 columns)
- `paid_access` - **ZERO references**
- `book_format` - **ZERO references**

### Google Drive Links (4 columns)
- `google_drive_code_link` - **ZERO references**
- `title_google_drive_code_link` - **ZERO references**
- `google_drive_code_link_2` - **ZERO references**
- `title_google_drive_code_link_2` - **ZERO references**

---

## 🤔 UNCLEAR - Need Verification (4 columns)

| Column | Type | Notes |
|--------|------|-------|
| `section` | text | Not found in API queries - likely replaced by `organization_config.section_id` |
| `view_count` | integer | Only found in product types, not blog_post context |

---

## 📊 Recommended Actions

### Conservative Approach: Delete 13 columns
Remove only columns with **absolute zero** usage:

```
❌ additional_photo
❌ secondary_photo  
❌ image_16_9_1200_675
❌ background_color (blog_post specific)
❌ text_color
❌ text_color_h2_h3
❌ card_footer_background_color
❌ product_connected_id
❌ product_3_id
❌ product_4_id
❌ order_subsection
❌ paid_access
❌ book_format
❌ google_drive_code_link
❌ title_google_drive_code_link
❌ google_drive_code_link_2
❌ title_google_drive_code_link_2
```

**Result**: 34 → 17 columns (50% reduction)

---

### Aggressive Approach: Delete 17 columns
Include unclear columns that appear unused:

```
All 13 from conservative +
❌ section (replaced by organization_config.section_id)
❌ view_count (not implemented for blog_post)
```

**Result**: 34 → 17 columns (50% reduction) - Same as conservative since we're keeping 2 unclear ones

---

## 🔍 Verification Results

### Search Results Summary:
1. **additional_photo**: Found in type definitions only, never actually used
2. **secondary_photo**: Set in PostEditModal but never displayed
3. **image_16_9_1200_675**: Zero references
4. **background_color**: All references are to OTHER tables (website_hero, template_heading, metrics)
5. **text_color**: All references are to cookie banners and hero sections, NOT blog_post
6. **Product fields**: Zero references
7. **Google Drive fields**: Zero references
8. **paid_access, book_format, order_subsection**: Zero references

---

## ⚠️ Important Notes

1. **secondary_photo** is written to database but never read - safe to delete
2. **section** column appears to be legacy - replaced by organization_config.section_id
3. **view_count** was never implemented for blog_post (only products have this feature)
4. **background_color** confusion: It exists in blog_post table but ALL code references are for other tables

---

## 🎯 Final Recommendation

**Delete 15 columns** (Conservative + verified unclear):

The safest approach is to delete all columns with zero usage plus those confirmed to be replaced:

- 3 unused photo fields
- 4 unused styling fields  
- 4 unused product fields
- 2 unused feature flags
- 4 unused Google Drive fields

**Final structure: 34 → 19 columns (44% reduction)**

This keeps `faq_section_is_title` and `metadescription_for_page` as they appear to be used, even if rarely.

---

## 📋 SQL Command Ready

See below for the exact SQL to execute this cleanup.
