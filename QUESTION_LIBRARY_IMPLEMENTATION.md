# Question Library Migration - Implementation Summary

## Overview
Successfully transformed the form questions system to support reusable question templates across multiple forms, similar to a component library pattern.

## Database Changes

### 1. New Tables

#### `question_library`
Stores reusable question templates that can be shared across forms:
- **Fields**: type, label, description, placeholder, options, validation
- **Metadata**: tags, category, usage_count, organization_id
- **Features**: Auto-categorization, usage tracking, soft delete

#### `form_questions` (Restructured)
Links forms to question library with optional overrides:
- **New Fields**: 
  - `question_library_id` - links to reusable template (NULL = custom question)
  - `label_override`, `description_override`, etc. - form-specific customizations
- **Preserved Fields**: required, logic_show_if, logic_value, order_index

### 2. Database View

#### `form_questions_complete`
Automatically merges library data with form-specific overrides:
- Combines library defaults with override values using COALESCE
- Includes metadata flags: `is_from_library`, `has_overrides`
- Used by frontend to display complete question data

### 3. Migration Files

#### `create_question_library_system.sql`
- Creates question_library table
- Restructures form_questions table
- Creates form_questions_complete view
- Adds RLS policies for multi-tenant security
- Implements usage count tracking triggers
- Includes helper functions for duplicating questions

#### `migrate_backup_questions_to_library.sql`
- Backs up existing form_questions to form_questions_backup_20251130
- Migrates unique questions to question_library (deduplicated)
- Restores form_questions with library references
- Handles custom one-off questions (library_id = NULL)
- Verifies migration integrity
- Generates detailed migration report

## API Changes

### Updated Endpoints

#### `GET /api/forms/[id]`
- Now fetches from `form_questions_complete` view
- Returns merged library + override data automatically

#### `PATCH /api/forms/[id]`
- Updated to handle `question_library_id` field
- Intelligently saves only overrides for library-linked questions
- Stores all data in overrides for custom questions

### New Endpoints

#### `GET /api/question-library`
Query params: `category`, `type`, `search`
- Fetches all question library items for organization
- Supports filtering and search
- Orders by usage count

#### `POST /api/question-library`
- Creates new question library template

#### `GET /api/question-library/[id]`
- Fetches specific question library item

#### `PATCH /api/question-library/[id]`
- Updates question library template

#### `DELETE /api/question-library/[id]`
- Soft deletes question library item

## TypeScript Types

### Updated: `Question` interface
```typescript
interface Question {
  // Existing fields...
  id: string;
  type: string;
  label: string;
  required: boolean;
  // ... etc
  
  // New fields
  question_library_id?: string | null;
  label_override?: string | null;
  description_override?: string | null;
  placeholder_override?: string | null;
  options_override?: string[] | null;
  validation_override?: Record<string, any> | null;
  
  // Read-only metadata from view
  library_tags?: string[];
  library_category?: string;
  is_from_library?: boolean;
  has_overrides?: boolean;
}
```

### New: `QuestionLibraryItem` interface
```typescript
interface QuestionLibraryItem {
  id: string;
  organization_id: string;
  type: string;
  label: string;
  description?: string;
  placeholder?: string;
  options?: string[];
  validation?: Record<string, any>;
  tags?: string[];
  category?: string;
  usage_count?: number;
  created_at?: string;
  updated_at?: string;
}
```

## Usage Patterns

### Creating a Form with Library Questions

1. **Fetch available library questions**:
```typescript
const response = await fetch('/api/question-library?category=Contact Information');
const { questions } = await response.json();
```

2. **Add library question to form**:
```typescript
const newQuestion = {
  id: crypto.randomUUID(),
  question_library_id: libraryQuestion.id, // Link to library
  required: true,
  order_index: 0,
  // Only add overrides if customizing
  label_override: 'Custom label for this form'
};
```

3. **Add custom question (not from library)**:
```typescript
const customQuestion = {
  id: crypto.randomUUID(),
  question_library_id: null, // No library link
  label_override: 'My custom question',
  description_override: 'Custom description',
  options_override: ['Option 1', 'Option 2'],
  required: true,
  order_index: 1
};
```

### Benefits

1. **Reusability**: Create once, use everywhere
2. **Consistency**: Standard questions across forms
3. **Flexibility**: Override specific fields per form
4. **Maintainability**: Update library question affects all forms (unless overridden)
5. **Analytics**: Track which questions are most popular (usage_count)
6. **Organization**: Categorize and tag questions for easy discovery

## Next Steps

1. ✅ Database schema updated
2. ✅ Migration scripts created
3. ✅ API endpoints updated
4. ✅ TypeScript types defined
5. ⏳ Update frontend UI to show question library picker
6. ⏳ Add question library management interface
7. ⏳ Implement drag-and-drop from library to form

## Files Modified/Created

- ✅ `database/migrations/create_question_library_system.sql`
- ✅ `database/migrations/migrate_backup_questions_to_library.sql`
- ✅ `src/app/api/forms/[id]/route.ts`
- ✅ `src/app/api/question-library/route.ts`
- ✅ `src/app/api/question-library/[id]/route.ts`
- ✅ `src/components/modals/TemplateSectionModal/components/forms/types.ts`
