# System Model Card Styling & Restrictions

## Overview
This document describes the visual and functional adjustments made to system model cards to distinguish them from regular models and enforce read-only behavior.

## Implementation Date
October 29, 2025

## What Was Implemented

### 1. Visual Distinctions for System Models

#### Purple "System" Badge
- **Location**: Next to model name (replaces "Admin" badge for system models)
- **Colors**: 
  - Background: `#f3e8ff` (light purple)
  - Text: `#6b21a8` (dark purple)
  - Border: `#c084fc` (purple)
- **Priority**: System badge takes precedence over Admin badge

```tsx
{/* System Badge - Takes precedence over Admin badge */}
{model.type === 'system' ? (
  <span className="px-3 py-1.5 text-[10px] sm:text-xs font-bold rounded-xl shadow-sm border"
    style={{ 
      backgroundColor: '#f3e8ff',
      color: '#6b21a8',
      borderColor: '#c084fc'
    }}
  >
    System
  </span>
) : (
  /* Admin Badge - Only show if not system model */
  ...
)}
```

#### Primary Color Border
- **Regular models**: Use `primaryColors.lighter` border
- **System models**: Use `primaryColors.base` border (stronger, more prominent)
- **Hover effect**: Enhanced shadow for system models

```tsx
style={{ 
  border: `2px solid ${model.type === 'system' ? primaryColors.base : primaryColors.lighter}`,
  boxShadow: model.type === 'system' 
    ? `0 2px 8px rgba(0,0,0,0.04), 0 0 0 1px ${primaryColors.base}`
    : `0 2px 8px rgba(0,0,0,0.04), 0 0 0 1px ${primaryColors.lighter}`,
}}
```

### 2. Removed Action Buttons

#### Edit Button - Hidden for System Models
```tsx
{/* Edit Button - Hide for system models */}
{onEdit && model.type !== 'system' && (
  <button onClick={handleEdit} ...>
    <AIIcons.Pencil className="h-5 w-5" />
  </button>
)}
```

#### Delete Button - Hidden for System Models
```tsx
{/* Delete Button - Hide for system models */}
{onDelete && model.type !== 'system' && (
  <button onClick={handleDelete} ...>
    <AIIcons.Trash className="h-5 w-5" />
  </button>
)}
```

### 3. Task Management Restrictions

#### No "Add Task" Button for System Models
```tsx
{/* Add Task Button - Hide for system models */}
{onOpenTaskModal && model.type !== 'system' && ... && (
  <button onClick={(e) => handleOpenTask(e, 'add')} ...>
    <AIIcons.Plus className="h-4 w-4" />
  </button>
)}
```

**Behavior:**
- System models can display existing tasks
- System models cannot add new tasks
- Tasks are view-only for system models

### 4. Role Badge - Read-Only for System Models

#### Visual State
- **Regular models**: Hover effects enabled, cursor pointer
- **System models**: Hover effects disabled, cursor not-allowed, reduced opacity

```tsx
<button
  onClick={model.type === 'system' ? undefined : handleOpenRole}
  className={`... ${
    model.type === 'system' 
      ? 'cursor-not-allowed opacity-75' 
      : 'hover:scale-105 cursor-pointer'
  }`}
  title={model.type === 'system' 
    ? 'System model role (read-only)' 
    : 'Click to edit role'}
  disabled={model.type === 'system'}
>
  <span className="flex items-center gap-1">
    <AIIcons.User className="h-3 w-3" />
    {model.role}
  </span>
</button>
```

**Behavior:**
- Clicking role badge on system models does nothing
- Tooltip indicates read-only status
- Visual feedback shows it's disabled

### 5. Role Edit Modal - Enhanced Read-Only Mode

#### Permission Check Updated
```tsx
// Check if user can edit this model
// System models are read-only, default models are read-only for account users
const canEdit = context === 'admin' 
  ? selectedModel.type !== 'system' // Admin can edit all except system models
  : selectedModel.type === 'user'; // Account users can only edit their own models
```

#### System Model Notice
When role modal opens for a system model, shows purple notice:

```tsx
{!canEdit && (
  <div className="mt-4 p-3 rounded-xl border-2"
    style={{
      backgroundColor: selectedModel.type === 'system' ? '#f3e8ff' : '#fef3c7',
      borderColor: selectedModel.type === 'system' ? '#c084fc' : '#fbbf24'
    }}
  >
    <p className="font-bold">Read-only mode</p>
    <p className="text-xs mt-1">
      {selectedModel.type === 'system' 
        ? 'System models are managed by the superadmin and cannot be edited.'
        : 'You can only edit roles for your own custom models.'}
    </p>
  </div>
)}
```

**Features:**
- Purple notice for system models
- Yellow notice for default models (account context)
- Context-aware message
- All form fields disabled when `canEdit === false`

### 6. Type System Update

#### AIModel Interface
Added `type` property to the core AIModel interface:

```typescript
export interface AIModel {
  // ... existing properties
  type?: AIModelType; // Model type classification ('default' | 'user' | 'system')
}
```

## Visual Comparison

### Regular Model Card
```
┌─────────────────────────────────────────┐
│ [Icon] Model Name     [Admin]  [Role]  │ ← Light border
│        Active                           │
│                      [Edit] [Delete] [✓]│ ← Action buttons visible
├─────────────────────────────────────────┤
│ Tasks: [Task1] [Task2] [+]             │ ← Can add tasks
└─────────────────────────────────────────┘
```

### System Model Card
```
┌═════════════════════════════════════════┐
║ [Icon] Model Name  [System]  [Role]    ║ ← Primary color border (stronger)
║        Active                           ║
║                                         ║ ← No action buttons
╠═════════════════════════════════════════╣
║ Tasks: [Task1] [Task2]                 ║ ← No "+" button (read-only tasks)
╚═════════════════════════════════════════╝
```

## Behavior Summary

| Feature | Regular Model | System Model |
|---------|--------------|--------------|
| **Badge** | "Admin" or none | "System" (purple) |
| **Border** | Light color | Primary color |
| **Edit Button** | ✅ Visible | ❌ Hidden |
| **Delete Button** | ✅ Visible | ❌ Hidden |
| **Toggle Active** | ✅ Enabled | ✅ Enabled* |
| **Add Tasks** | ✅ Enabled | ❌ Hidden |
| **View Tasks** | ✅ Enabled | ✅ Enabled |
| **Role Badge Click** | ✅ Opens modal | ❌ Disabled |
| **Role Modal Edit** | ✅ Can edit | ❌ Read-only |

*Note: Toggle Active button should also be disabled for system models - this can be added if needed.

## Files Modified

### Components
1. ✅ `src/components/ai/_shared/components/AIModelCard.tsx`
   - Updated border styling (primary color for system models)
   - Added "System" badge with purple styling
   - Hidden Edit/Delete buttons for system models
   - Disabled task addition for system models
   - Made role badge non-clickable for system models

2. ✅ `src/components/ai/_shared/components/AIRoleEditModal.tsx`
   - Updated `canEdit` logic to handle system models
   - Added system model read-only notice (purple)
   - Context-aware permission messages

### Types
3. ✅ `src/components/ai/_shared/types/model.types.ts`
   - Added `type?: AIModelType` to AIModel interface

## Testing Checklist

### System Model Card Display
- [ ] Navigate to `/admin/ai/management`
- [ ] Click "System" filter to view system models
- [ ] **Verify**: System models have purple "System" badge
- [ ] **Verify**: System models have primary color border (stronger than regular)
- [ ] **Verify**: No Edit button appears
- [ ] **Verify**: No Delete button appears
- [ ] **Verify**: Toggle Active button appears
- [ ] **Verify**: Hover effect on border is enhanced

### Task Management
- [ ] System model with tasks shows task list
- [ ] **Verify**: No "+" button to add tasks
- [ ] **Verify**: No "Add task" button if no tasks exist
- [ ] Regular model shows "+" button (for comparison)

### Role Badge Interaction
- [ ] Click role badge on regular model
- [ ] **Verify**: Modal opens, can edit
- [ ] Click role badge on system model
- [ ] **Verify**: Nothing happens (disabled)
- [ ] **Verify**: Cursor shows "not-allowed"
- [ ] **Verify**: Badge has reduced opacity (75%)
- [ ] Hover over system model role badge
- [ ] **Verify**: Tooltip shows "System model role (read-only)"

### Role Edit Modal
- [ ] Open role modal for system model (if clickable from elsewhere)
- [ ] **Verify**: Purple notice appears at top
- [ ] **Verify**: Message says "System models are managed by the superadmin"
- [ ] **Verify**: All input fields are disabled
- [ ] **Verify**: "Save Changes" button is disabled or hidden
- [ ] Open role modal for default model (account context)
- [ ] **Verify**: Yellow notice appears (existing behavior)

### Account Context
- [ ] Navigate to `/account/ai`
- [ ] View system models in list
- [ ] **Verify**: Same system model styling applies
- [ ] **Verify**: Same restrictions apply (no edit/delete/tasks)

## Future Enhancements

### Priority: Low
1. **Disable Toggle Active for System Models**
   - System model active status should be managed by superadmin only
   - Hide or disable the toggle button

2. **Additional Visual Indicators**
   - Add lock icon overlay on system model cards
   - Subtle background pattern to distinguish system models
   - Tooltip on card hover explaining system model status

3. **Keyboard Accessibility**
   - Ensure disabled buttons are properly marked for screen readers
   - Add ARIA labels for system model status

## Summary

✅ **Completed:**
- System models display purple "System" badge
- Primary color border distinguishes system models visually
- Edit and Delete buttons hidden for system models
- Task addition disabled for system models
- Role badge non-functional for system models (read-only)
- Role edit modal shows appropriate read-only notice
- All TypeScript types updated

🎯 **Result:**
- System models are clearly visually distinct (purple badge + strong border)
- All editing capabilities disabled for system models
- Users receive clear feedback about read-only status
- Consistent behavior across admin and account contexts
- Enhanced user experience with visual hierarchy

📝 **User Impact:**
- Admins can easily identify system models at a glance
- Attempting to interact with system model controls provides clear feedback
- No confusion about which models can be edited
- Professional, polished appearance with color-coded badges
