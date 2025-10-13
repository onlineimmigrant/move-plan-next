# Organizations API - Blog Post JSONB Migration Fix

**Date**: October 13, 2025  
**Status**: ✅ COMPLETE  
**Files Modified**: `/src/app/api/organizations/[id]/route.ts`

---

## Problem Summary

The `/api/organizations/[id]` endpoint (both GET and PUT methods) was using **OLD column names** for blog_post queries and updates, which would cause errors after the JSONB migration:

### Issues Found:

1. **GET Handler** - Query used old columns:
   - ❌ `order`, `display_this_post`, `display_as_blog_post`
   - ❌ Missing JSONB fields: `display_config`, `organization_config`, `media_config`

2. **PUT Handler** - Updates used old columns:
   - ❌ Direct fields: `order`, `display_this_post`, `display_as_blog_post`
   - ❌ Not writing to JSONB structure

3. **Both Handlers** - No transformation layer:
   - ❌ Response returned raw JSONB without flattening for backward compatibility

---

## Solution Implemented

### 1. Added `flattenBlogPost()` Helper Function

```typescript
function flattenBlogPost(post: any) {
  return {
    ...post,
    // Flatten display_config
    display_this_post: post.display_config?.display_this_post,
    display_as_blog_post: post.display_config?.display_as_blog_post,
    is_displayed_first_page: post.display_config?.is_displayed_first_page,
    is_help_center: post.display_config?.is_help_center,
    help_center_order: post.display_config?.help_center_order,
    // Flatten organization_config
    section_id: post.organization_config?.section_id,
    subsection: post.organization_config?.subsection,
    order: post.organization_config?.order,
    // Flatten media_config
    main_photo: post.media_config?.main_photo,
    // Keep JSONB fields for components that use them
    display_config: post.display_config,
    organization_config: post.organization_config,
    media_config: post.media_config,
  };
}
```

**Purpose**: Provides backward compatibility by returning both flat fields and JSONB fields.

---

### 2. Fixed GET Handler - Blog Post Query

**BEFORE**:
```typescript
const { data: blog_posts, error: blogPostsError } = await supabase
  .from('blog_post')
  .select(`
    id, title, slug, description, content, order,
    display_this_post, display_as_blog_post,
    organization_id, created_on, last_modified
  `)
  .eq('organization_id', orgId)
  .order('order', { ascending: true });
```

**AFTER**:
```typescript
const { data: blog_posts, error: blogPostsError } = await supabase
  .from('blog_post')
  .select(`
    id, title, slug, description, content,
    organization_id, created_on, last_modified,
    display_config, organization_config, media_config
  `)
  .eq('organization_id', orgId)
  .order('organization_config->order', { ascending: true });
```

**Changes**:
- ✅ Removed old columns: `order`, `display_this_post`, `display_as_blog_post`
- ✅ Added JSONB columns: `display_config`, `organization_config`, `media_config`
- ✅ Updated order clause to use JSONB: `organization_config->order`

---

### 3. Fixed GET Handler - Response Transformation

**BEFORE**:
```typescript
return NextResponse.json({
  // ... other fields
  blog_posts: blog_posts || [],
  // ...
});
```

**AFTER**:
```typescript
// Flatten blog_posts for backward compatibility
const flattenedBlogPosts = (blog_posts || []).map(flattenBlogPost);

return NextResponse.json({
  // ... other fields
  blog_posts: flattenedBlogPosts,
  // ...
});
```

**Changes**:
- ✅ Added flattening transformation before returning
- ✅ Response now includes both flat and JSONB fields

---

### 4. Fixed PUT Handler - Blog Post Updates

**BEFORE**:
```typescript
const blogPostsWithOrgId = validBlogPosts.map((post, index) => {
  const postData: any = {
    title: post.title.trim(),
    slug: post.slug.trim(),
    description: post.description || '',
    content: post.content || '',
    order: parseInt(String(post.order)) || index + 1,
    display_this_post: convertToBoolean(post.display_this_post),
    display_as_blog_post: convertToBoolean(post.display_as_blog_post),
    organization_id: orgId,
    created_on: post.created_on || new Date().toISOString(),
    last_modified: new Date().toISOString()
  };
  
  if (post.id) {
    postData.id = post.id;
  }
  
  return postData;
});
```

**AFTER**:
```typescript
const blogPostsWithOrgId = validBlogPosts.map((post, index) => {
  // Build JSONB configs from flat fields or existing JSONB
  const display_config = {
    display_this_post: convertToBoolean(post.display_this_post ?? post.display_config?.display_this_post),
    display_as_blog_post: convertToBoolean(post.display_as_blog_post ?? post.display_config?.display_as_blog_post),
    is_displayed_first_page: convertToBoolean(post.is_displayed_first_page ?? post.display_config?.is_displayed_first_page),
    is_help_center: convertToBoolean(post.is_help_center ?? post.display_config?.is_help_center),
    help_center_order: post.help_center_order ?? post.display_config?.help_center_order ?? null,
  };

  const organization_config = {
    section_id: post.section_id ?? post.organization_config?.section_id ?? null,
    subsection: post.subsection ?? post.organization_config?.subsection ?? null,
    order: parseInt(String(post.order ?? post.organization_config?.order)) || index + 1,
  };

  const media_config = {
    main_photo: post.main_photo ?? post.media_config?.main_photo ?? null,
  };

  const postData: any = {
    title: post.title.trim(),
    slug: post.slug.trim(),
    description: post.description || '',
    content: post.content || '',
    display_config,
    organization_config,
    media_config,
    organization_id: orgId,
    created_on: post.created_on || new Date().toISOString(),
    last_modified: new Date().toISOString()
  };
  
  if (post.id) {
    postData.id = post.id;
  }
  
  return postData;
});
```

**Changes**:
- ✅ Removed direct field assignments: `order`, `display_this_post`, `display_as_blog_post`
- ✅ Added JSONB config builders: `display_config`, `organization_config`, `media_config`
- ✅ Supports both input formats (flat or JSONB) using nullish coalescing (`??`)
- ✅ Writes to JSONB columns in database

---

### 5. Fixed PUT Handler - Response Transformation

**BEFORE**:
```typescript
return NextResponse.json({
  success: true,
  // ... other fields
  blog_posts: updatedBlogPosts || [],
  // ...
});
```

**AFTER**:
```typescript
// Flatten blog_posts for backward compatibility (same as GET)
const flattenedUpdatedBlogPosts = (updatedBlogPosts || []).map(flattenBlogPost);

return NextResponse.json({
  success: true,
  // ... other fields
  blog_posts: flattenedUpdatedBlogPosts,
  // ...
});
```

**Changes**:
- ✅ Added flattening transformation before returning
- ✅ Consistent with GET handler

---

## Impact Analysis

### ✅ Fixed Components:

1. **GlobalSettingsModal** (`/src/components/modals/GlobalSettingsModal/GlobalSettingsModal.tsx`)
   - Fetches blog_posts from `/api/organizations/${orgId}` (GET)
   - Saves updates to `/api/organizations/${orgId}` (PUT)
   - Now receives properly structured blog_post data

2. **SettingsFormFields** (`/src/components/SiteManagement/SettingsFormFields.tsx`)
   - Displays blog_posts count
   - Shows "Add Blog Post" button
   - Now works with correct data structure

### ✅ Consistency Achieved:

All blog_post API routes now use the same pattern:
- `/api/posts` ✅
- `/api/posts/[slug]` ✅
- `/api/posts/featured` ✅
- `/api/articles` ✅
- `/api/organizations/[id]` ✅ (NOW FIXED)

---

## Backward Compatibility

The transformation layer ensures compatibility with code expecting old field names:

### Frontend Can Use Either Format:

**Flat fields** (legacy code):
```typescript
post.display_this_post
post.display_as_blog_post
post.order
post.main_photo
```

**JSONB fields** (updated code):
```typescript
post.display_config?.display_this_post
post.organization_config?.order
post.media_config?.main_photo
```

Both work because the response includes **both formats**.

---

## Testing Checklist

Before proceeding to Phase 5 (dropping old columns), test:

### GlobalSettingsModal Tests:
- [ ] Open GlobalSettingsModal in admin interface
- [ ] Navigate to "Blog" section
- [ ] Verify blog posts count is correct
- [ ] Check blog posts are displayed properly
- [ ] Click "Add Blog Post" - verify PostEditModal opens
- [ ] Create a new blog post through GlobalSettingsModal
- [ ] Edit an existing blog post
- [ ] Delete a blog post
- [ ] Verify changes persist after save

### Complete Blog Functionality Tests:
- [ ] Homepage blog slider displays posts
- [ ] Help Center articles load correctly
- [ ] Post editing (PostEditModal) works
- [ ] Sitemap includes blog posts
- [ ] All blog API endpoints return data
- [ ] Blog post filtering/ordering works
- [ ] Blog post creation succeeds
- [ ] Blog post updates succeed
- [ ] Blog post deletion succeeds

---

## Phase 5 Preparation

### ⚠️ CRITICAL STEPS BEFORE PHASE 5:

1. **Complete Testing**:
   - Test ALL items in the checklist above
   - Test on multiple browsers
   - Test with different user roles
   - Test edge cases (empty data, special characters, etc.)

2. **Database Backup**:
   - Create a **FULL database backup**
   - Store backup in a safe location
   - Test backup restore procedure
   - Document backup timestamp

3. **Verify Migration Scripts**:
   - Review Phase 1 & 2 completion
   - Confirm all data migrated correctly
   - Run validation queries to check data integrity

4. **Get Approval**:
   - User approval required before Phase 5
   - Phase 5 is **IRREVERSIBLE** (drops columns)
   - No rollback possible without database restore

---

## Phase 5 - Column Removal (WHEN APPROVED)

**⚠️ DO NOT RUN WITHOUT BACKUP AND APPROVAL**

```sql
-- BACKUP DATABASE FIRST! THIS IS IRREVERSIBLE!

ALTER TABLE blog_post 
  DROP COLUMN display_this_post,
  DROP COLUMN display_as_blog_post,
  DROP COLUMN is_displayed_first_page,
  DROP COLUMN is_help_center,
  DROP COLUMN help_center_order,
  DROP COLUMN section_id,
  DROP COLUMN subsection,
  DROP COLUMN "order",
  DROP COLUMN cta_card_one_id,
  DROP COLUMN cta_card_two_id,
  DROP COLUMN cta_card_three_id,
  DROP COLUMN cta_card_four_id,
  DROP COLUMN is_with_author,
  DROP COLUMN is_company_author,
  DROP COLUMN author_id,
  DROP COLUMN product_1_id,
  DROP COLUMN product_2_id,
  DROP COLUMN main_photo;
```

**After Phase 5**:
- Storage reduced by ~50%
- Query performance improved (fewer columns to scan)
- Cleaner database schema
- Transformation layer can be removed in future if desired

---

## Summary

### What Was Fixed:
- ✅ GET handler now queries JSONB columns
- ✅ GET handler flattens response for backward compatibility
- ✅ PUT handler writes to JSONB columns
- ✅ PUT handler accepts both flat and JSONB input formats
- ✅ PUT handler flattens response for backward compatibility
- ✅ GlobalSettingsModal can now fetch and save blog_posts correctly
- ✅ Consistent with all other blog API routes

### Next Steps:
1. **Test thoroughly** using the checklist above
2. **Create database backup**
3. **Get user approval**
4. **Execute Phase 5** when ready (drop old columns)

### Files Modified:
- `/src/app/api/organizations/[id]/route.ts`
  - Added `flattenBlogPost()` helper function
  - Updated GET handler blog_post query
  - Updated GET handler response transformation
  - Updated PUT handler blog_post upsert logic
  - Updated PUT handler response transformation

---

**Status**: Ready for testing ✅
