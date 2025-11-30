# Question Library Visibility Control - Implementation Complete ✅

## Overview
Added `visible_for_others` field to question library, allowing questions to be either:
- **Shared** (visible to all forms in organization)
- **Private** (only visible to the form that created it)

**UX Design**: Library management integrated into Forms dropdown menu with tabs (Forms | Library), keeping the main editor clean and focused.

## Database Changes

### Migration: `add_visible_for_others_to_question_library.sql`
- ✅ Added `visible_for_others BOOLEAN DEFAULT true` column
- ✅ Created index for efficient filtering
- ✅ Updated `form_questions_complete` view to include visibility status
- ✅ Set all existing questions to `visible_for_others = true` (backward compatible)

**To apply:**
```sql
-- Run this migration after create_question_library_system.sql
\i database/migrations/add_visible_for_others_to_question_library.sql
```

## API Updates

### `/api/question-library` (GET)
- ✅ Added `formId` query parameter
- ✅ When `formId` provided: filters to only show `visible_for_others = true` questions
- ✅ When no `formId`: shows all questions (for library management view)

**Example:**
```typescript
// For autocomplete (shows only public questions)
fetch('/api/question-library?search=email&formId=abc123')

// For library management (shows all)
fetch('/api/question-library')
```

### `/api/question-library` (POST)
- ✅ Added `visible_for_others` field (defaults to `true`)

### `/api/question-library/[id]` (PATCH)
- ✅ Added support for updating `visible_for_others` field

### `/api/question-library/[id]` (DELETE)
- ✅ Soft deletes from library (preserves questions in forms)

## Frontend Components

### New: `LibraryManagementTab` Component
Location: `src/components/modals/TemplateSectionModal/components/forms/components/LibraryManagementTab.tsx`

**Features:**
- Lists all library questions used in current form
- Toggle visibility button:
  - 🟢 **Shared** - Available to all forms
  - ⚪ **Private** - Only this form
- Remove from library button (keeps question in form)
- Shows usage count per question
- Loading states and optimistic updates

### Updated: `FormsTab` Component
- ✅ Added tab navigation (Questions | Library)
- ✅ Shows question count in each tab
- ✅ Integrates LibraryManagementTab
- ✅ Passes `formId` to all child components

### Updated: `QuestionLibrarySuggestions` Component
- ✅ Added `formId` prop
- ✅ Filters autocomplete to only show public questions (`visible_for_others = true`)

### Updated: `QuestionEditor` Component
- ✅ Passes `formId` to suggestions component

## TypeScript Types

### Updated: `QuestionLibraryItem` Interface
```typescript
export interface QuestionLibraryItem {
  id: string;
  organization_id: string;
  type: string;
  label: string;
  // ... other fields
  visible_for_others?: boolean; // NEW
  usage_count?: number;
  created_at?: string;
  updated_at?: string;
}
```

## User Workflow

### Accessing Library Management
1. Click the floating **Forms** button (left side)
2. Click **Library** tab (next to Forms tab)
3. See **ALL** questions in the organization's library

### Making a Question Private
1. In Library tab, find the question
2. Click **Shared** button → Changes to **Private**
3. Question hidden from autocomplete (but still in library)

### Making a Question Shared Again
1. In Library tab, find the question
2. Click **Private** button → Changes to **Shared**
3. Question now appears in autocomplete for all forms

### Removing from Library
1. In Library tab, find the question
2. Click **Remove** button
3. Confirm deletion
4. Question permanently deleted from library (but preserved in any forms using it)

## Benefits

### 1. **Reduced Autocomplete Clutter**
- Forms only see relevant, shared questions
- Private/experimental questions don't pollute suggestions

### 2. **Form-Specific Questions**
- Questions unique to one form can stay private
- Prevents accidental reuse of context-specific questions

### 3. **Gradual Sharing**
- Create question as private first
- Test it in one form
- Share with others when ready

### 4. **Library Cleanup**
- Remove one-off questions from library
- Keeps library focused on reusable templates

## Database Schema

```sql
-- question_library table
CREATE TABLE question_library (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL,
  type TEXT NOT NULL,
  label TEXT NOT NULL,
  -- ... other fields
  visible_for_others BOOLEAN DEFAULT true, -- NEW
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

-- Index for visibility filtering
CREATE INDEX idx_question_library_visible_for_others 
  ON question_library(organization_id, visible_for_others) 
  WHERE visible_for_others = true AND deleted_at IS NULL;
```

## Implementation Files

### Database
- ✅ `database/migrations/add_visible_for_others_to_question_library.sql`

### API Routes
- ✅ `src/app/api/question-library/route.ts`
- ✅ `src/app/api/question-library/[id]/route.ts`

### Components
- ✅ `src/components/modals/TemplateSectionModal/components/forms/components/LibraryManagementTab.tsx` (NEW)
- ✅ `src/components/modals/TemplateSectionModal/components/FormsTab.tsx`
- ✅ `src/components/modals/TemplateSectionModal/components/forms/components/QuestionLibrarySuggestions.tsx`
- ✅ `src/components/modals/TemplateSectionModal/components/forms/components/QuestionEditor.tsx`

### Types
- ✅ `src/components/modals/TemplateSectionModal/components/forms/types.ts`

## Testing Checklist

- [ ] Run migration on development database
- [ ] Create a new question in form A
- [ ] Verify it appears in Library tab
- [ ] Toggle visibility to Private
- [ ] Open form B → verify question doesn't appear in autocomplete
- [ ] Toggle back to Shared
- [ ] Verify question now appears in form B autocomplete
- [ ] Test Remove from library
- [ ] Verify question stays in original form
- [ ] Verify question removed from autocomplete

## Next Steps

1. **Apply Migration**: Run `add_visible_for_others_to_question_library.sql`
2. **Test in Development**: Verify all functionality works
3. **User Documentation**: Add help text/tooltips if needed
4. **Production Deployment**: Apply migration in production

---

**Status**: ✅ Complete - Ready for testing
**Date**: 2025-11-30
