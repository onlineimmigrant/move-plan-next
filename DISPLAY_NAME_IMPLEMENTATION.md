# Display Name Field Implementation - Complete Guide

## Overview
Added `display_name` field to AI model tables to separate user-facing labels from technical model identifiers. This allows for more descriptive, role-based naming in the UI while maintaining the technical `name` field for API interactions.

## Database Changes

### Tables Modified
1. **`ai_models`** - User-created custom models
2. **`ai_models_default`** - Organization default models
3. **`ai_models_system`** - System-wide models (superadmin)

### Migration Script
Location: `/database/migrations/add_display_name_to_models.sql`

**What it does:**
- Adds `display_name` column (TEXT, NOT NULL) to all three tables
- Copies existing `name` values to `display_name` 
- Removes uniqueness constraint from `name` field
- Creates indexes on `display_name` for query performance

**To apply:**
```bash
# Run in Supabase SQL Editor or via CLI
psql -h your-db-host -U your-user -d your-db -f database/migrations/add_display_name_to_models.sql
```

## TypeScript Changes

### Type Definition
**File:** `/src/components/modals/ChatWidget/types.ts`

```typescript
export interface Model {
  id: number;
  name: string;           // Technical identifier (e.g., "gpt-4-turbo-2024-04-09")
  display_name: string;   // User-friendly label (e.g., "GPT-4 Turbo (Smart Assistant)")
  api_key: string | null;
  endpoint: string | null;
  max_tokens: number | null;
  system_message: string | null;
  icon: string | null;
  task: Task[] | null;
  type: 'default' | 'user';
  organization_id?: number;
}
```

## API Updates

### Chat API Route
**File:** `/src/app/api/chat/route.ts`

All database queries updated to include `display_name`:
- Model fetching for chat responses
- Auto-extraction model selection
- Fallback model queries
- User settings model queries

**Pattern:**
```typescript
// Before
.select('id, name, api_key, endpoint, max_tokens, system_message, icon, task')

// After
.select('id, name, display_name, api_key, endpoint, max_tokens, system_message, icon, task')
```

## UI Component Updates

### 1. ChatWidget
**File:** `/src/components/modals/ChatWidget/ChatWidget.tsx`

Updated all Supabase queries to fetch `display_name`:
- Default models fetch
- User models fetch
- Model settings queries
- Fallback model queries

### 2. ModelSelector
**File:** `/src/components/modals/ChatWidget/ModelSelector.tsx`

**Changes:**
- Dropdown list displays `model.display_name` instead of `model.name`
- Header shows `selectedModel.display_name` instead of `selectedModel.name`

**Before:**
```tsx
<div className="text-sm font-medium">{model.name}</div>
```

**After:**
```tsx
<div className="text-sm font-medium">{model.display_name}</div>
```

### 3. TaskManagerModal
**File:** `/src/components/modals/ChatWidget/TaskManagerModal.tsx`

Updated to display `model.display_name` in:
- Modal title
- Model subtitle

## Use Cases & Examples

### Example Data

| name | display_name | Purpose |
|------|-------------|---------|
| `gpt-4-turbo-2024-04-09` | `GPT-4 Turbo (Smart Assistant)` | General purpose chat |
| `gpt-4-turbo-2024-04-09` | `GPT-4 Turbo (Code Helper)` | Code generation & review |
| `grok-beta` | `Grok Beta (Data Extraction)` | Extract structured data |
| `claude-3-opus` | `Claude Opus (Long Documents)` | Document analysis |

**Key Benefit:** Multiple models with the same technical `name` can have different `display_name` values to indicate their configured role or purpose.

## Testing Checklist

### Database
- [ ] Run migration script
- [ ] Verify `display_name` column exists in all 3 tables
- [ ] Check that existing `name` values were copied
- [ ] Confirm uniqueness constraint removed from `name`
- [ ] Test creating models with duplicate `name` values

### Frontend
- [ ] Model selector dropdown shows `display_name`
- [ ] Header displays `display_name` for selected model
- [ ] Task manager modal shows `display_name`
- [ ] Settings modal displays models correctly
- [ ] No console errors when loading models

### API
- [ ] Chat API returns models with `display_name`
- [ ] Model selection works with new field
- [ ] Auto-extraction selects correct model
- [ ] Fallback logic includes `display_name`

## Backward Compatibility

### Handling Existing Data
The migration automatically:
1. Adds the column
2. Copies `name` → `display_name`
3. Sets NOT NULL constraint

**Result:** All existing models will have `display_name` = `name` initially.

### Frontend Fallback
If `display_name` is missing (shouldn't happen after migration):
```typescript
const displayText = model.display_name || model.name || 'AI Assistant';
```

## Future Enhancements

### Admin Interface
Consider adding:
- [ ] Bulk edit display names
- [ ] Template system for display name patterns
- [ ] Validation to prevent empty display names
- [ ] Display name localization (i18n)

### User Experience
- [ ] Show both `name` and `display_name` in tooltips
- [ ] Add search by both fields in model selector
- [ ] Group models by role/category in UI

## Rollback Instructions

If you need to revert:

```sql
-- Remove display_name column
ALTER TABLE ai_models DROP COLUMN IF EXISTS display_name;
ALTER TABLE ai_models_default DROP COLUMN IF EXISTS display_name;
ALTER TABLE ai_models_system DROP COLUMN IF EXISTS display_name;

-- Restore uniqueness constraint (if it existed)
ALTER TABLE ai_models ADD CONSTRAINT ai_models_name_key UNIQUE (name);
ALTER TABLE ai_models_default ADD CONSTRAINT ai_models_default_name_key UNIQUE (name);
ALTER TABLE ai_models_system ADD CONSTRAINT ai_models_system_name_key UNIQUE (name);
```

Then revert TypeScript changes:
1. Remove `display_name` from `Model` interface
2. Update all `select()` statements to remove `display_name`
3. Change UI to use `model.name` instead of `model.display_name`

## Files Modified

### Database
- ✅ `/database/migrations/add_display_name_to_models.sql` (created)

### TypeScript Types
- ✅ `/src/components/modals/ChatWidget/types.ts`

### API Routes
- ✅ `/src/app/api/chat/route.ts` (5+ queries updated)

### UI Components
- ✅ `/src/components/modals/ChatWidget/ChatWidget.tsx` (6+ queries updated)
- ✅ `/src/components/modals/ChatWidget/ModelSelector.tsx` (2 displays updated)
- ✅ `/src/components/modals/ChatWidget/TaskManagerModal.tsx` (2 displays updated)

## Notes

- `name` field remains for technical model identification (API calls, logging)
- `display_name` is for user-facing display only
- Both fields are required (NOT NULL)
- Removing uniqueness allows multiple models with same `name` but different roles
- Indexes added for performance on `display_name` lookups
