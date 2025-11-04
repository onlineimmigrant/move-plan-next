# Account Context Appearance Adjustments

## Overview
This document describes the visual adjustments made to model cards in the `/account/ai` page to provide consistent "Default" badge display and primary color borders for organization-provided models.

## Implementation Date
October 29, 2025

 

 

## What Was Changed

### 1. Badge Display - Context-Aware Logic

#### Before
- **Admin context**: System models showed "System" badge (purple), admin-role models showed "Admin" badge (blue)
- **Account context**: System models showed "System" badge (purple), default models had no badge

#### After
- **Admin context**: System models show "System" badge (purple), admin-role models show "Admin" badge (blue) *(unchanged)*
- **Account context**: **Both system AND default models show "Default" badge (blue)**

### Implementation

```tsx
{/* Context-aware badge display */}
{context === 'admin' ? (
  /* Admin context: Show System badge for system models, Admin badge for admin-role models */
  model.type === 'system' ? (
    <span style={{ backgroundColor: '#f3e8ff', color: '#6b21a8', borderColor: '#c084fc' }}>
      System
    </span>
  ) : model.user_role_to_access === 'admin' && (
    <span style={{ backgroundColor: '#dbeafe', color: '#1e40af', borderColor: '#93c5fd' }}>
      Admin
    </span>
  )
) : (
  /* Account context: Show "Default" badge for both system and default models */
  (model.type === 'system' || model.type === 'default') && (
    <span style={{ backgroundColor: '#dbeafe', color: '#1e40af', borderColor: '#93c5fd' }}>
      Default
    </span>
  )
)}
```

**Result:**
- Users see "Default" badge for all organization-provided models
- Clearer distinction between user's custom models (no badge) and organization models (Default badge)
- Consistent terminology: "Default" instead of mixing "System" and no badge

### 2. Border Styling - Primary Color for Default Models

#### Before
- **Admin context**: Only system models used primary color border
- **Account context**: Only system models used primary color border, default models used light border

#### After
- **Admin context**: Only system models use primary color border *(unchanged)*
- **Account context**: **Both system AND default models use primary color border**

### Implementation

```tsx
// Determine if this model should have primary border (stronger visual presence)
const usePrimaryBorder = context === 'admin' 
  ? model.type === 'system' // Admin: only system models get primary border
  : (model.type === 'system' || model.type === 'default'); // Account: both system and default get primary border

<li style={{ 
  border: `2px solid ${usePrimaryBorder ? primaryColors.base : primaryColors.lighter}`,
  boxShadow: usePrimaryBorder
    ? `0 2px 8px rgba(0,0,0,0.04), 0 0 0 1px ${primaryColors.base}`
    : `0 2px 8px rgba(0,0,0,0.04), 0 0 0 1px ${primaryColors.lighter}`,
}}>
```

**Result:**
- Default models now have the stronger primary color border (matching system models)
- Enhanced visual distinction between custom models (light border) and organization models (primary border)
- Better visual hierarchy: organization models stand out more

### 3. Role Badge - Disabled for Default Models

#### Before
- Role badge was only disabled for system models in account context

#### After
- Role badge is disabled for **both system AND default models** in account context

### Implementation

```tsx
<button
  onClick={(context === 'account' && (model.type === 'system' || model.type === 'default')) 
    ? undefined 
    : handleOpenRole}
  className={`${
    (context === 'account' && (model.type === 'system' || model.type === 'default')) 
      ? 'cursor-not-allowed opacity-75' 
      : 'hover:scale-105 cursor-pointer'
  }`}
  title={(context === 'account' && (model.type === 'system' || model.type === 'default')) 
    ? 'Default model role (read-only)' 
    : 'Click to edit role'}
  disabled={context === 'account' && (model.type === 'system' || model.type === 'default')}
>
```

**Result:**
- Users cannot edit roles for any organization-provided models
- Consistent read-only behavior for all default models
- Clear visual feedback (reduced opacity, no hover effects)

## Visual Comparison

### Account Page - Before

```
Custom Models (type='user'):
┌─────────────────────────────┐
│ [Icon] My Model            │ ← Light border, no badge
│                       [Edit]│
└─────────────────────────────┘

Org Default Models (type='default'):
┌─────────────────────────────┐
│ [Icon] Org Model           │ ← Light border, no badge
│                             │
└─────────────────────────────┘

System Models (type='system'):
┌═════════════════════════════┐
║ [Icon] System Model [System]║ ← Primary border, purple "System" badge
║                             ║
╚═════════════════════════════╝
```

### Account Page - After

```
Custom Models (type='user'):
┌─────────────────────────────┐
│ [Icon] My Model            │ ← Light border, no badge
│                       [Edit]│
└─────────────────────────────┘

Org Default Models (type='default'):
┌═════════════════════════════┐
║ [Icon] Org Model [Default] ║ ← Primary border, blue "Default" badge ✨
║                             ║
╚═════════════════════════════╝

System Models (type='system'):
┌═════════════════════════════┐
║ [Icon] System Model [Default]║ ← Primary border, blue "Default" badge ✨
║                             ║
╚═════════════════════════════╝
```

## Benefits

### 1. Consistent User Experience
- All organization-provided models display the same "Default" badge
- Users don't need to understand the difference between "System" and default models
- Clearer separation: "My models" vs "Organization models"

### 2. Simplified Terminology
- "Default" is more user-friendly than "System"
- "Default" better communicates "provided by default" from the organization
- Reduces confusion about technical terms like "System"

### 3. Enhanced Visual Hierarchy
- Primary color borders make default models more prominent
- Clear visual distinction from user's custom models
- Consistent styling between system and default models (both organization-provided)

### 4. Better Accessibility
- Stronger borders improve visibility
- Consistent badge placement aids scanning
- Clear read-only indicators on role badges

## Context-Specific Behavior

| Feature | Admin Context | Account Context |
|---------|--------------|-----------------|
| **System Model Badge** | "System" (purple) | "Default" (blue) ✨ |
| **Default Model Badge** | "Admin" (blue) if admin-role | "Default" (blue) ✨ |
| **User Model Badge** | None | None |
| **System Border** | Primary color | Primary color |
| **Default Border** | Light color | Primary color ✨ |
| **User Border** | Light color | Light color |
| **System Role Editable** | No (read-only) | No (read-only) |
| **Default Role Editable** | Yes | No (read-only) ✨ |
| **User Role Editable** | Yes | Yes |

## Files Modified

### Components
1. ✅ `src/components/ai/_shared/components/AIModelCard.tsx`
   - Added context-aware badge display logic
   - Updated `usePrimaryBorder` calculation for account context
   - Enhanced role badge disabled logic for account context
   - Updated hover effects and tooltips

## Code Changes Summary

### Badge Logic
```typescript
// Context-aware: Different badges for admin vs account
context === 'admin' 
  ? /* Show System/Admin badges */
  : /* Show Default badge for system AND default models */
```

### Border Logic
```typescript
// Context-aware: Different border rules for admin vs account
const usePrimaryBorder = context === 'admin' 
  ? model.type === 'system'
  : (model.type === 'system' || model.type === 'default');
```

### Role Badge Logic
```typescript
// Context-aware: Disable for all organization models in account
disabled={context === 'account' && (model.type === 'system' || model.type === 'default')}
```

## Testing Checklist

### Account Page Testing
- [ ] Navigate to `/account/ai`
- [ ] **Verify**: Custom models (type='user') have light border, no badge
- [ ] **Verify**: Default models (type='default') have primary border, "Default" badge
- [ ] **Verify**: System models (type='system') have primary border, "Default" badge
- [ ] Hover over default model
- [ ] **Verify**: Primary border hover effect works
- [ ] Click role badge on default model
- [ ] **Verify**: Nothing happens (disabled)
- [ ] **Verify**: Cursor shows "not-allowed"
- [ ] **Verify**: Tooltip shows "Default model role (read-only)"

### Admin Page Testing (Verify Unchanged)
- [ ] Navigate to `/admin/ai/management`
- [ ] **Verify**: System models still show purple "System" badge
- [ ] **Verify**: Admin-role models still show blue "Admin" badge
- [ ] **Verify**: System models have primary border
- [ ] **Verify**: Default models have light border (unchanged)

### Cross-Context Testing
- [ ] As user, view model list in `/account/ai`
- [ ] **Verify**: All org models show "Default" badge
- [ ] As admin, view same models in `/admin/ai/management`
- [ ] **Verify**: System models show "System" badge
- [ ] **Verify**: Admin-role models show "Admin" badge

## Summary

✅ **Completed:**
- Account context now shows "Default" badge for both system and default models
- Account context uses primary color borders for both system and default models
- Role badges disabled for all organization models in account context
- Context-aware logic maintains proper admin display (System/Admin badges)
- All TypeScript compilation successful

🎯 **Result:**
- Consistent user experience in account interface
- Clear visual distinction between custom and organization models
- Simplified terminology ("Default" instead of "System")
- Enhanced visual hierarchy with primary color borders
- Proper read-only indicators for all organization models

📝 **User Impact:**
- Users see unified "Default" badge for all organization-provided models
- Stronger visual presence of organization models with primary borders
- Clear distinction between editable (custom) and read-only (default) models
- Simplified mental model: "My models" vs "Organization's default models"
