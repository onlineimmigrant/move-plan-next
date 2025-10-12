# Header & Footer Settings Consolidation - Implementation Plan

## 📋 Overview

**Goal**: Move header/footer specific settings from the `settings` table to the `website_menuitem` table for better data model organization and logical grouping.

## 🎯 Fields to Migrate

### From `settings` table → To `website_menuitem` table:

1. **`header_style`** (string)
   - Current: Global setting in `settings` table
   - New: Per-organization setting in `website_menuitem` metadata
   - Values: `'default'`, `'modern'`, `'minimal'`, etc.

2. **`footer_color`** (string)
   - Current: Global setting in `settings` table
   - New: Per-organization setting in `website_menuitem` metadata
   - Values: `'gray-800'`, `'neutral-900'`, etc.

3. **`menu_items_are_text`** (boolean)
   - Current: Global setting in `settings` table
   - New: Per-organization setting in `website_menuitem` metadata
   - Values: `true` / `false`

## 💡 Why This Makes Sense

### Current Issues:
- ❌ Header/footer settings mixed with unrelated settings (SEO, billing, etc.)
- ❌ Settings table becoming bloated
- ❌ Logical disconnect: menu styling separated from menu items
- ❌ Harder to understand data relationships

### Benefits:
- ✅ **Better Data Model**: Menu styling lives with menu items
- ✅ **Cleaner Settings Table**: Only true "global" settings remain
- ✅ **Logical Grouping**: All menu-related data in one place
- ✅ **Easier to Understand**: Clear relationship between menu items and their presentation
- ✅ **Future Flexibility**: Easier to add per-menu-item customization later

## 🗄️ Database Migration Strategy

### Option A: Add Columns Directly to `website_menuitem` ✅ (RECOMMENDED)

**Pros**:
- Simple, direct approach
- Easy to query
- Type-safe with database schema
- No JSON parsing overhead

**Cons**:
- Adds 3 columns to table
- Per-row storage (but only active for one "settings" row per org)

```sql
ALTER TABLE website_menuitem 
ADD COLUMN header_style VARCHAR(50),
ADD COLUMN footer_color VARCHAR(50),
ADD COLUMN menu_items_are_text BOOLEAN DEFAULT false;

-- Add indexes for performance
CREATE INDEX idx_website_menuitem_org_settings 
ON website_menuitem(organization_id) 
WHERE header_style IS NOT NULL;
```

### Option B: Create Separate `menu_settings` Table

**Pros**:
- Completely separate settings from items
- Can add unlimited settings without altering schema
- Clean separation of concerns

**Cons**:
- Requires JOIN operations
- Additional table to manage
- More complex queries

```sql
CREATE TABLE menu_settings (
  id SERIAL PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  header_style VARCHAR(50) DEFAULT 'default',
  footer_color VARCHAR(50) DEFAULT 'gray-800',
  menu_items_are_text BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(organization_id)
);
```

### Option C: Add JSONB Column to `website_menuitem`

**Pros**:
- Flexible schema
- Can add settings without migrations
- Single column addition

**Cons**:
- No type safety at database level
- JSON parsing overhead
- Harder to query/index

```sql
ALTER TABLE website_menuitem 
ADD COLUMN menu_settings JSONB DEFAULT '{}'::jsonb;

-- Add GIN index for JSONB queries
CREATE INDEX idx_website_menuitem_menu_settings 
ON website_menuitem USING GIN (menu_settings);
```

## ✅ Recommended Approach: **Option A** (Direct Columns)

**Reasoning**:
1. **Simplicity**: Easiest to implement and understand
2. **Performance**: No JOIN overhead, direct column access
3. **Type Safety**: PostgreSQL enforces types
4. **Clarity**: Explicit schema, self-documenting
5. **Compatibility**: Works with existing RLS policies

## 📝 Implementation Plan

### Phase 1: Database Migration

#### Step 1.1: Create Migration File
```sql
-- Migration: consolidate_header_footer_settings.sql
-- Description: Move header/footer settings from settings table to website_menuitem table

-- Add new columns to website_menuitem
ALTER TABLE website_menuitem 
ADD COLUMN IF NOT EXISTS header_style VARCHAR(50),
ADD COLUMN IF NOT EXISTS footer_color VARCHAR(50),
ADD COLUMN IF NOT EXISTS menu_items_are_text BOOLEAN DEFAULT false;

-- Migrate existing data from settings table
-- Strategy: Create/update a special "settings" menu item per organization
WITH org_settings AS (
  SELECT 
    organization_id,
    header_style,
    footer_color,
    menu_items_are_text
  FROM settings
  WHERE organization_id IS NOT NULL
)
UPDATE website_menuitem wm
SET 
  header_style = os.header_style,
  footer_color = os.footer_color,
  menu_items_are_text = os.menu_items_are_text
FROM org_settings os
WHERE wm.organization_id = os.organization_id
  AND wm.id = (
    -- Update the first menu item for each org (or create logic below)
    SELECT id 
    FROM website_menuitem 
    WHERE organization_id = os.organization_id 
    ORDER BY "order" 
    LIMIT 1
  );

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_website_menuitem_org_settings 
ON website_menuitem(organization_id) 
WHERE header_style IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN website_menuitem.header_style IS 'Header style preference for the organization';
COMMENT ON COLUMN website_menuitem.footer_color IS 'Footer color preference for the organization';
COMMENT ON COLUMN website_menuitem.menu_items_are_text IS 'Whether menu items should display as text only (no icons)';
```

#### Step 1.2: Rollback Script (Safety)
```sql
-- Rollback: remove new columns if needed
ALTER TABLE website_menuitem 
DROP COLUMN IF EXISTS header_style,
DROP COLUMN IF EXISTS footer_color,
DROP COLUMN IF EXISTS menu_items_are_text;

DROP INDEX IF EXISTS idx_website_menuitem_org_settings;
```

### Phase 2: Update Data Access Layer

#### Step 2.1: Update `getSettings.ts`
**File**: `src/lib/getSettings.ts`

**Changes**:
1. Remove `header_style`, `footer_color`, `menu_items_are_text` from settings query
2. Keep these in Settings interface for backward compatibility (populated from menu items)
3. Add fallback values

```typescript
// Before:
const { data, error } = await supabase
  .from('settings')
  .select(`
    id,
    site,
    // ... other fields
    menu_items_are_text,  // REMOVE
    footer_color,         // REMOVE
    // header_style not queried currently
  `)

// After:
const { data, error } = await supabase
  .from('settings')
  .select(`
    id,
    site,
    // ... other fields (without the 3 migrated fields)
  `)

// Add separate query for menu settings
const { data: menuSettings } = await supabase
  .from('website_menuitem')
  .select('header_style, footer_color, menu_items_are_text')
  .eq('organization_id', organizationId)
  .not('header_style', 'is', null)
  .single();

// Merge into settings object
const settings: Settings = {
  ...data,
  header_style: menuSettings?.header_style || 'default',
  footer_color: menuSettings?.footer_color || 'gray-800',
  menu_items_are_text: menuSettings?.menu_items_are_text || false,
};
```

#### Step 2.2: Update Menu API Route
**File**: `src/app/api/menu/route.ts`

**Changes**:
1. Include new fields in SELECT query
2. Return settings as part of response metadata

```typescript
// Update query
const { data, error } = await supabase
  .from('website_menuitem')
  .select(`
    id,
    display_name,
    // ... existing fields
    header_style,
    footer_color,
    menu_items_are_text,
    // ... rest
  `)
  .or(`organization_id.eq.${organizationId},organization_id.is.null`)
  .order('order', { ascending: true });

// Extract settings from first item with settings
const menuSettings = data?.find(item => 
  item.header_style !== null
);

// Return with metadata
return NextResponse.json({
  menuItems: data,
  settings: menuSettings ? {
    header_style: menuSettings.header_style,
    footer_color: menuSettings.footer_color,
    menu_items_are_text: menuSettings.menu_items_are_text
  } : null
}, {
  headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate' },
});
```

### Phase 3: Update Components

#### Step 3.1: Update `Header.tsx`
**File**: `src/components/Header.tsx`

**Changes**:
- Already uses `settings?.menu_items_are_text` from context
- No changes needed (settings context will provide value)

```typescript
// Current (line 223, 399):
{settings?.menu_items_are_text ? (
  // text only
) : (
  // with icons
)}

// Remains the same - context handles data source change
```

#### Step 3.2: Update `Footer.tsx`
**File**: `src/components/Footer.tsx`

**Changes**:
- Already uses `settings?.footer_color` from context
- No changes needed (settings context will provide value)

```typescript
// Current (line 200):
const footerBackground = settings?.footer_color || 'neutral-900';

// Remains the same - context handles data source change
```

### Phase 4: Update Site Management Components

#### Step 4.1: Update `fieldConfig.tsx`
**File**: `src/components/SiteManagement/fieldConfig.tsx`

**Changes**:
Move fields from "Header Settings" and "Footer Settings" to "Menu Items" section

```typescript
// Before:
{
  title: 'Header Settings',
  key: 'header-settings',
  columns: 2,
  fields: [
    { name: 'header_style', label: 'Header Style', type: 'select', options: headerStyleOptions },
    { name: 'menu_width', label: 'Menu Width', type: 'select', options: menuWidthOptions },
    { name: 'menu_items_are_text', label: 'Text-only Menu Items', type: 'checkbox' }
  ]
},
{
  title: 'Menu Items',
  key: 'menu-items',
  columns: 1,
  fields: [
    { name: 'menu_items', label: '', type: 'menu-items', span: 'full' }
  ]
},
{
  title: 'Footer Settings',
  key: 'footer-settings',
  columns: 1,
  fields: [
    { name: 'footer_color', label: 'Footer Color', type: 'color' }
  ]
}

// After:
{
  title: 'Menu & Navigation',
  key: 'menu-navigation',
  subsections: [
    {
      title: 'Display Settings',
      key: 'display-settings',
      columns: 3,
      fields: [
        { name: 'header_style', label: 'Header Style', type: 'select', options: headerStyleOptions },
        { name: 'footer_color', label: 'Footer Color', type: 'color' },
        { name: 'menu_items_are_text', label: 'Text-only Menu Items', type: 'checkbox' }
      ]
    },
    {
      title: 'Menu Items',
      key: 'menu-items',
      columns: 1,
      fields: [
        { name: 'menu_items', label: '', type: 'menu-items', span: 'full' }
      ]
    }
  ]
}
// Note: menu_width stays in header settings as it's a general layout property
```

#### Step 4.2: Update `SiteManagement.tsx`
**File**: `src/components/SiteManagement/SiteManagement.tsx`

**Changes**:
Update data loading and saving logic

```typescript
// Loading (lines ~983-985):
// Before:
header_style: data.settings?.header_style || 'default',
footer_color: data.settings?.footer_color || 'gray',
menu_items_are_text: data.settings?.menu_items_are_text || false,

// After:
header_style: data.menu_items?.[0]?.header_style || 'default',
footer_color: data.menu_items?.[0]?.footer_color || 'gray',
menu_items_are_text: data.menu_items?.[0]?.menu_items_are_text || false,

// Saving:
// These fields will now be included in menu_items array
// and saved via the menu items endpoint
```

#### Step 4.3: Update Organization API Route
**File**: `src/app/api/organizations/[id]/route.ts`

**Changes**:
Update PUT handler to save menu settings

```typescript
// When saving menu items (around line 1063+):
const menuItemsWithOrgId = menuItems.map((item, index) => {
  return {
    display_name: item.display_name,
    // ... existing fields
    
    // Add new settings fields (only for first item or special settings item)
    ...(index === 0 ? {
      header_style: item.header_style,
      footer_color: item.footer_color,
      menu_items_are_text: item.menu_items_are_text
    } : {}),
    
    order: item.order || index + 1,
    organization_id: orgId
  };
});
```

### Phase 5: Update Types

#### Step 5.1: Update Menu Types
**File**: `src/types/menu.ts`

```typescript
export interface MenuItem {
  id: number;
  display_name: string;
  display_name_translation?: Record<string, string>;
  url_name: string;
  // ... existing fields
  
  // Add new settings fields (optional, only present on "settings" menu item)
  header_style?: string;
  footer_color?: string;
  menu_items_are_text?: boolean;
  
  // ... rest of fields
}
```

### Phase 6: Data Migration & Cleanup

#### Step 6.1: Run Migration
```bash
# Apply migration
psql $DATABASE_URL -f consolidate_header_footer_settings.sql

# Verify data migrated correctly
psql $DATABASE_URL -c "
SELECT 
  wm.organization_id,
  wm.header_style,
  wm.footer_color,
  wm.menu_items_are_text,
  s.header_style as old_header_style,
  s.footer_color as old_footer_color,
  s.menu_items_are_text as old_menu_items_are_text
FROM website_menuitem wm
JOIN settings s ON s.organization_id = wm.organization_id
WHERE wm.header_style IS NOT NULL
LIMIT 10;
"
```

#### Step 6.2: Remove Old Columns (AFTER VERIFICATION)
```sql
-- ONLY RUN AFTER CONFIRMING EVERYTHING WORKS IN PRODUCTION

-- Remove columns from settings table
ALTER TABLE settings 
DROP COLUMN IF EXISTS header_style,
DROP COLUMN IF EXISTS footer_color,
DROP COLUMN IF EXISTS menu_items_are_text;

-- Update RLS policies if needed
-- (current policies likely don't reference these columns)
```

## 🧪 Testing Checklist

### Unit Tests
- [ ] Settings context returns menu-based settings
- [ ] Menu API includes settings in response
- [ ] Header component receives correct menu_items_are_text value
- [ ] Footer component receives correct footer_color value

### Integration Tests
- [ ] Site Management saves menu settings correctly
- [ ] Settings persist across page reloads
- [ ] Menu items display correctly with text-only mode
- [ ] Footer color applies correctly

### Manual Testing
- [ ] Create new organization → settings have defaults
- [ ] Edit menu settings → changes persist
- [ ] Toggle text-only menu items → header updates
- [ ] Change footer color → footer updates
- [ ] Clone organization → settings copied correctly
- [ ] Delete organization → settings deleted (CASCADE)

## 🔄 Migration Risks & Mitigation

### Risk 1: Data Loss During Migration
**Mitigation**:
- Backup database before migration
- Test on staging environment first
- Keep old columns until verified
- Implement rollback script

### Risk 2: Broken Existing Sites
**Mitigation**:
- Maintain backward compatibility in code
- Default values for missing settings
- Gradual rollout (feature flag if needed)

### Risk 3: RLS Policy Issues
**Mitigation**:
- Review all RLS policies on website_menuitem
- Ensure settings columns accessible
- Test with different user roles

### Risk 4: Performance Impact
**Mitigation**:
- Add proper indexes
- Cache menu settings in context
- Monitor query performance
- Use connection pooling

## 📊 Alternative: Store Settings in First Menu Item

**Strategy**: Use the first menu item (order = 1) of each organization to store settings

**Implementation**:
```typescript
// When fetching settings:
const firstMenuItem = menuItems.find(item => item.order === 1);
const menuSettings = {
  header_style: firstMenuItem?.header_style || 'default',
  footer_color: firstMenuItem?.footer_color || 'gray-800',
  menu_items_are_text: firstMenuItem?.menu_items_are_text || false
};

// When saving:
menuItems[0] = {
  ...menuItems[0],
  header_style: settings.header_style,
  footer_color: settings.footer_color,
  menu_items_are_text: settings.menu_items_are_text
};
```

**Pros**:
- No special "settings" row needed
- Settings always with menu items
- Simpler queries

**Cons**:
- Settings attached to actual menu item (feels awkward)
- Must ensure first menu item always exists
- Harder to understand intent

## 🎯 Rollout Strategy

### Stage 1: Preparation (Week 1)
- [ ] Review plan with team
- [ ] Create database backup
- [ ] Set up staging environment
- [ ] Write migration scripts

### Stage 2: Implementation (Week 2)
- [ ] Apply database migration to staging
- [ ] Update code (data access layer)
- [ ] Update components
- [ ] Test thoroughly on staging

### Stage 3: Deployment (Week 3)
- [ ] Deploy to production (off-peak hours)
- [ ] Monitor for errors
- [ ] Verify data integrity
- [ ] Confirm no performance degradation

### Stage 4: Cleanup (Week 4+)
- [ ] Monitor for 2 weeks
- [ ] Remove old columns from settings table
- [ ] Update documentation
- [ ] Archive migration scripts

## 📚 Documentation Updates Needed

1. **Database Schema Docs**
   - Update website_menuitem table description
   - Document new columns and their purpose
   - Update ER diagrams

2. **API Documentation**
   - Update menu API response structure
   - Document settings in menu items
   - Update examples

3. **Developer Guide**
   - Update data model explanation
   - Add migration guide
   - Update best practices

## ✅ Success Criteria

1. **Functionality**
   - All header/footer settings work as before
   - No broken UI or missing data
   - Performance maintained or improved

2. **Code Quality**
   - Cleaner data model
   - Better organized code
   - Easier to understand relationships

3. **Maintenance**
   - Easier to add new menu-related settings
   - Less cognitive load for developers
   - Clear separation of concerns

## 🤔 Questions to Consider

1. **Should we store settings in every menu item or just one special row?**
   - Recommendation: First menu item (order = 1)
   - Cleaner and simpler to implement

2. **What happens to organizations with no menu items?**
   - Create default menu item with settings
   - Or store in separate menu_settings table

3. **Should we version the migration?**
   - Yes, use timestamp-based versioning
   - Example: `20251012_consolidate_header_footer_settings.sql`

4. **Do we need a feature flag for gradual rollout?**
   - Recommended for production safety
   - Can enable/disable new behavior per organization

## 📞 Next Steps After Approval

1. **Confirm chosen approach** (Option A, B, or C)
2. **Review and refine migration SQL**
3. **Set up staging environment for testing**
4. **Create detailed task list with estimates**
5. **Schedule migration window**
6. **Begin implementation**

---

**Status**: ⏳ Awaiting Approval
**Estimated Effort**: 2-3 days (including testing)
**Risk Level**: 🟡 Medium (database changes always carry risk, but mitigated with proper testing)
