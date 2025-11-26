# Forms Tab Mirroring Implementation Plan

## Overview
Transform the Forms tab editor to mirror the actual form experience while maintaining editing capabilities. This creates a true WYSIWYG editor where users edit questions in the context of how they'll actually appear.

## Current State (Backup Created)
- **Backup File**: `src/components/modals/TemplateSectionModal/components/FormsTab.backup.tsx`
- **Current Features**:
  - List view showing all questions with inline editing
  - Preview mode toggle for stepped view
  - Design settings (Large/Compact, Classic/Card, Company Logo, Column Layout)
  - Logic preview capability
  - Slash commands for question types
  - Drag & drop reordering

## Target State
Replace list view with stepped preview as the PRIMARY editing interface:
- Show ONE question at a time (like actual form)
- Edit directly in the stepped view
- Navigation between questions with Back/Next
- Question management controls overlay on hover
- Maintain all current functionality (logic, options, slash commands, etc.)

## Implementation Plan

### Phase 1: UI Structure Changes
**Goal**: Replace list view with stepped view as primary interface

1. **Remove the conditional toggle** between list/preview
   - Make stepped view the default and only view
   - Remove `showSteppedPreview` state
   - Remove Preview button from footer

2. **Question Navigation**
   - Keep `currentStep` state for tracking current question
   - Add permanent Back/Next navigation at bottom
   - Add question counter: "Question 1 of 5"
   - Add keyboard shortcuts: Arrow keys for navigation

3. **Question Management Overlay**
   - Show controls on hover over question area:
     - Delete question (trash icon)
     - Add question after (plus icon)
     - Duplicate question (copy icon)
     - Reorder (drag handle)
     - Question type selector
     - Required toggle
     - Logic conditions (gear icon)

### Phase 2: Make Fields Editable
**Goal**: Transform preview fields into editable inputs

1. **Question Label & Description**
   - Make label directly editable (large text input)
   - Add description toggle and editable textarea
   - Style to match preview appearance

2. **Question Type Selector**
   - Add dropdown/selector for question type
   - Position: Top-right corner or in hover overlay
   - Update preview instantly on type change

3. **Options Management** (for multiple choice, checkboxes, dropdown)
   - Make each option editable inline
   - Add/remove option buttons
   - Drag to reorder options
   - Keep preview styling

4. **Other Field Types**
   - Show input field styled like preview
   - Make placeholder/settings editable via settings panel
   - Rating: Make number of stars configurable

### Phase 3: Advanced Features Integration

1. **Logic Conditions**
   - Show logic indicator when question has conditions
   - Click to open logic editor panel (side or modal)
   - Visual indicator when question is hidden by logic

2. **Slash Commands**
   - Keep slash command functionality
   - Trigger from question label field
   - Quick insert question after current

3. **Settings Panel**
   - Keep existing floating settings button
   - Settings apply to whole form (design style, type, logo, columns)

### Phase 4: Question List Navigation
**Goal**: Add quick navigation to any question

1. **Question List Sidebar** (optional, toggle-able)
   - Mini sidebar showing all questions (collapsed)
   - Click to jump to any question
   - Drag to reorder
   - Show/hide with keyboard shortcut

2. **Question Breadcrumb**
   - Show current question title in header
   - Click to open question list dropdown

### Phase 5: Additional Enhancements

1. **Empty State**
   - Show "Add your first question" when no questions
   - Large button to add question
   - Example templates/question types

2. **Bulk Operations**
   - Multi-select mode (Shift+Click)
   - Delete multiple, reorder multiple
   - Duplicate section

3. **Undo/Redo**
   - Command+Z / Command+Shift+Z
   - Track question history

## Technical Architecture

### Component Structure
```
FormsTab
├── Header (Published/Draft badge)
├── Company Logo (if enabled)
├── Stepped Question Editor
│   ├── Question Counter
│   ├── Question Content (editable)
│   │   ├── Label Input
│   │   ├── Description Textarea
│   │   ├── Field Preview/Editor
│   │   └── Options Editor (for choice types)
│   ├── Hover Overlay Controls
│   │   ├── Type Selector
│   │   ├── Add/Delete/Duplicate
│   │   ├── Logic Editor
│   │   └── Required Toggle
│   └── Navigation (Back/Next)
├── Settings Button (floating)
├── Settings Menu (when open)
└── Footer (Forms button, Save button)
```

### State Management
```typescript
// Keep existing states
const [questions, setQuestions] = useState<Question[]>([]);
const [currentStep, setCurrentStep] = useState(0);
const [designStyle, setDesignStyle] = useState<'large' | 'compact'>('large');
const [designType, setDesignType] = useState<'classic' | 'card'>('classic');
const [showCompanyLogo, setShowCompanyLogo] = useState(false);

// Remove
// const [showSteppedPreview, setShowSteppedPreview] = useState(false);

// Add new
const [showQuestionList, setShowQuestionList] = useState(false); // For sidebar
const [editingField, setEditingField] = useState<string | null>(null); // Track what's being edited
const [showControlsOverlay, setShowControlsOverlay] = useState(false); // Hover state
```

### Key Functions to Preserve
- `addQuestion(type)` - Add new question
- `updateQuestion(id, updates)` - Update question data
- `deleteQuestion(id)` - Remove question
- `addQuestionAfter(id)` - Insert after specific question
- `saveForm()` - Save to database
- Logic evaluation functions
- Slash command handlers

## Implementation Steps

### Step 1: Simplify to Stepped View Only
- Remove `showSteppedPreview` conditional
- Remove Preview toggle button
- Set stepped view as default

### Step 2: Make Current Question Editable
- Replace static preview with editable inputs
- Keep same styling/size as preview
- Add onChange handlers

### Step 3: Add Hover Controls
- Overlay with question management buttons
- Positioned at top-right of question area
- Fade in/out on mouse enter/leave

### Step 4: Integrate Existing Features
- Slash commands in label field
- Logic editor panel
- Options management for choice fields

### Step 5: Polish & Test
- Keyboard shortcuts
- Smooth transitions
- Error handling
- Autosave integration

## Benefits of This Approach

1. **True WYSIWYG**: Edit exactly as it will appear
2. **Better Focus**: One question at a time reduces cognitive load
3. **Faster Preview**: No mode switching needed
4. **Cleaner UI**: Less clutter, more white space
5. **Better Mobile Experience**: Easier to navigate on smaller screens
6. **Matches User Experience**: Editor mirrors actual form flow

## Migration Strategy

1. Create backup (✅ Done)
2. Implement in phases with feature flags if needed
3. Keep backup file for reference
4. Test thoroughly before removing old code
5. Update any documentation

## Rollback Plan

If issues arise:
1. Restore from `FormsTab.backup.tsx`
2. Revert recent commits
3. File has all current functionality intact

## Next Steps

1. Review and approve plan
2. Begin Phase 1: UI Structure Changes
3. Implement incrementally with testing
4. Gather user feedback
5. Iterate and refine

---
**Status**: Phase 2 Complete - Full WYSIWYG Editor Implemented
**Backup**: FormsTab.backup.tsx (Created: 2025-11-26)
**Last Updated**: 2025-11-26

## ✅ Completed Phases

### Phase 1: UI Structure Changes ✅
- ✅ Removed `showSteppedPreview` state
- ✅ Made stepped view the default and only view
- ✅ Removed Preview button from footer
- ✅ Removed entire list view (465 lines removed)
- ✅ File reduced from 1791 to 1326 lines

### Phase 2: Make Fields Editable ✅
**Implemented Features:**
- ✅ **Editable Question Labels** - Direct input, styled to match preview
- ✅ **Editable Descriptions** - Toggle to add/remove, textarea for editing
- ✅ **Question Type Selector** - Dropdown in controls overlay (11 types)
- ✅ **Required Toggle** - Visual indicator (red for required, gray for optional)
- ✅ **Question Management Controls** - Hover overlay with:
  - Add question after (automatically navigates to new question)
  - Duplicate question (creates copy and navigates to it)
  - Delete question (with confirmation, adjusts step)
- ✅ **Editable Options** - For multiple choice, checkboxes, dropdown:
  - Inline editing of each option
  - Add/remove options with visual feedback
  - Delete button appears on hover
  - Dashed "Add option" button
- ✅ **Keyboard Navigation** - Arrow keys (← →) to navigate between questions
- ✅ **Question Number Badge** - Shows current question number (desktop only)
- ✅ **Improved Empty State** - Purple gradient button to add first question
- ✅ **Mobile-Friendly Controls** - Always visible on mobile, hover on desktop
- ✅ **Keyboard Shortcut Hints** - Shows "or press ←/→" below nav buttons

**Technical Details:**
- All fields update question state via `updateQuestion()`
- Auto-saves on changes (sets dirty flag)
- Navigation automatically adjusts after add/delete operations
- Controls overlay: Semi-transparent backdrop, shadow, border
- Options management: Prevents deleting last option
- Field preview: Maintains visual fidelity to actual form

### Phase 3: Advanced Features Integration
**Status**: Ready to implement
- Logic Conditions editor
- Slash commands for quick question insertion
- Settings panel integration

### Phase 4: Question List Navigation
**Status**: Optional enhancement
- Mini sidebar for quick navigation
- Question breadcrumb in header

### Phase 5: Additional Enhancements
**Status**: Future improvements
- Undo/Redo functionality
- Multi-select mode
- Bulk operations
