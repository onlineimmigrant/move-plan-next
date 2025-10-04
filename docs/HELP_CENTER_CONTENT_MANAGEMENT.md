# Help Center Content Management

## Overview

The Help Center now supports selective display of articles and FAQs using two new database fields:
- `is_help_center`: Boolean flag to mark items for Help Center display
- `help_center_order`: Integer for custom sorting (lower numbers appear first)

## Database Changes

### Migration Applied
The following fields were added to both `blog_post` and `faq` tables:

```sql
-- blog_post table
is_help_center BOOLEAN DEFAULT false
help_center_order INTEGER DEFAULT 0

-- faq table
is_help_center BOOLEAN DEFAULT false
help_center_order INTEGER DEFAULT 0
```

Indexes were created for optimal query performance:
- `idx_blog_post_help_center` on (is_help_center, help_center_order)
- `idx_faq_help_center` on (is_help_center, help_center_order)

## How It Works

### 1. API Endpoints

Both `/api/articles` and `/api/faq` now support a `helpCenterOnly` query parameter:

```typescript
// Fetch only Help Center articles
GET /api/articles?organizationId=xxx&helpCenterOnly=true

// Fetch only Help Center FAQs
GET /api/faq?organizationId=xxx&helpCenterOnly=true

// Fetch all articles (default behavior)
GET /api/articles?organizationId=xxx
```

### 2. Hooks

The `useArticles` and `useFAQs` hooks accept an optional parameter:

```typescript
// In WelcomeTab - show only Help Center items
const { articles } = useArticles(true);
const { faqs } = useFAQs(true);

// In other components - show all items
const { articles } = useArticles(false);
const { faqs } = useFAQs(false);
```

### 3. WelcomeTab Integration

The Help Center landing page now automatically displays only items marked with `is_help_center = true`, sorted by `help_center_order`.

## Managing Help Center Content

### Method 1: Interactive Script (Recommended)

Run the management script:

```bash
node scripts/mark-help-center-content.js
```

Features:
- View all available articles and FAQs
- Mark/unmark items for Help Center
- Set display order
- View current Help Center content

### Method 2: Direct SQL

Mark an article for Help Center:

```sql
UPDATE blog_post 
SET 
  is_help_center = true,
  help_center_order = 1
WHERE id = YOUR_ARTICLE_ID;
```

Mark a FAQ for Help Center:

```sql
UPDATE faq 
SET 
  is_help_center = true,
  help_center_order = 1
WHERE id = YOUR_FAQ_ID;
```

### Method 3: Supabase Dashboard

1. Navigate to Table Editor
2. Select `blog_post` or `faq` table
3. Find the row you want to feature
4. Set:
   - `is_help_center` = `true`
   - `help_center_order` = desired number (e.g., 1, 2, 3)

## Best Practices

### Display Order
- Use increments of 10 (10, 20, 30) to allow easy reordering
- Lower numbers appear first
- Items with the same order are sorted by `created_on` (articles) or `order` (FAQs)

### Content Selection
- Feature 6-10 most helpful articles
- Include 8-12 most frequently asked FAQs
- Regularly update based on user feedback

## Search Behavior

The search functionality remains unchanged:
- Searches across **all** articles and FAQs (not just Help Center items)
- Users can still find any content via search
- `is_help_center` only affects the initial display

## Examples

### Example 1: Add Top 5 Articles

```sql
-- Mark your best articles for Help Center
UPDATE blog_post 
SET 
  is_help_center = true,
  help_center_order = 10
WHERE slug IN ('getting-started-guide');

UPDATE blog_post 
SET 
  is_help_center = true,
  help_center_order = 20
WHERE slug IN ('account-setup');
```

### Example 2: Feature Top FAQs

```sql
-- Mark most common questions
UPDATE faq 
SET 
  is_help_center = true,
  help_center_order = 10
WHERE question LIKE '%How do I%'
LIMIT 5;
```

## TypeScript Types

Updated types include the new fields:

```typescript
// FAQ Type
interface FAQ {
  id: number;
  question: string;
  answer: string;
  // ... other fields
  is_help_center?: boolean;
  help_center_order?: number;
}

// Article Type
interface Article {
  id: number;
  title: string;
  // ... other fields
  is_help_center?: boolean;
  help_center_order?: number;
}
```

## Troubleshooting

### Items not appearing in Help Center
1. Check `is_help_center` is set to `true`
2. Verify `organization_id` matches
3. For articles: check `display_this_post = true`
4. Check console for API errors

### Wrong display order
1. Verify `help_center_order` values
2. Remember: lower numbers appear first
3. Check if multiple items have the same order

## Future Enhancements

Potential improvements:
- Admin UI for managing Help Center items
- Analytics on which items are most helpful
- A/B testing for content effectiveness
- Automatic suggestions based on user behavior

## Rollback

To remove Help Center fields (if needed):

```sql
ALTER TABLE blog_post 
DROP COLUMN IF EXISTS is_help_center,
DROP COLUMN IF EXISTS help_center_order;

ALTER TABLE faq 
DROP COLUMN IF EXISTS is_help_center,
DROP COLUMN IF EXISTS help_center_order;

DROP INDEX IF EXISTS idx_blog_post_help_center;
DROP INDEX IF EXISTS idx_faq_help_center;
```
