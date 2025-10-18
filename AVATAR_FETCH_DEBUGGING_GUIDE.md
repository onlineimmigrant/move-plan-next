# Avatar Management Modal - Debugging Guide

## Issue
Avatars are not being fetched and displayed in the "Manage Avatars" modal.

## Debug Steps

### 1. Open Browser Console
1. Open your browser's Developer Tools (F12)
2. Go to the Console tab
3. Clear the console
4. Open the Ticket Management modal
5. Click the settings icon (cog) in the header
6. Click "Manage Avatars"

### 2. Check Console Logs

You should see logs in this order:

```
AvatarManagementModal render: { 
  isOpen: true, 
  settings: {...}, 
  hasSettings: true,
  organizationId: "your-org-id",
  avatarsCount: 0,
  isLoading: false
}

AvatarManagementModal opened {
  hasOrganizationId: true,
  organizationId: "your-org-id",
  startInCreateMode: false
}

Starting to fetch avatars for organization: your-org-id

Supabase response: { 
  data: [...], 
  error: null, 
  count: X 
}

Successfully fetched avatars: X avatars
```

### 3. Possible Issues & Solutions

#### Issue A: `settings` is undefined
**Console shows**: `hasSettings: false` or `organizationId: undefined`

**Solution**: Settings context not loaded. Check:
- Is SettingsProvider wrapping the app?
- Is settings being fetched correctly in SettingsContext?

#### Issue B: Supabase error
**Console shows**: `ticket_avatars table error (might not exist yet): ...`

**Solution**: Run the database migration
```sql
-- Run this in your Supabase SQL Editor
-- File: create_ticket_avatars_table.sql
```

#### Issue C: No data returned
**Console shows**: `Successfully fetched avatars: 0 avatars`

**Possible causes**:
1. No avatars created yet (expected)
2. Wrong organization_id (avatars belong to different org)
3. RLS policies blocking access

**Check RLS**:
```sql
-- Check if you're authenticated
SELECT auth.uid();

-- Check your role
SELECT id, email, role, organization_id 
FROM profiles 
WHERE id = auth.uid();

-- Check avatars for your org
SELECT * FROM ticket_avatars 
WHERE organization_id = (
  SELECT organization_id 
  FROM profiles 
  WHERE id = auth.uid()
);
```

#### Issue D: Settings loaded but avatars not displaying
**Console shows**: `Successfully fetched avatars: X avatars` but UI shows empty

**Check**:
- Is `avatars` state being updated?
- Add breakpoint in the component to inspect `avatars` state
- Check if modal is re-rendering after fetch

### 4. Manual Test

Try creating an avatar directly via SQL to test if fetching works:

```sql
-- Insert test avatar (replace YOUR_ORG_ID)
INSERT INTO ticket_avatars (organization_id, title, full_name, image)
VALUES (
  'YOUR_ORG_ID', 
  'Test Avatar', 
  'Test User',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=test'
);

-- Verify it was created
SELECT * FROM ticket_avatars WHERE organization_id = 'YOUR_ORG_ID';
```

Then refresh the page and open Manage Avatars modal.

### 5. Common Fixes

#### Fix 1: Clear State on Open
If avatars are cached, add:
```typescript
useEffect(() => {
  if (isOpen) {
    setAvatars([]); // Clear before fetching
    if (settings?.organization_id) {
      fetchAvatars();
    }
  }
}, [isOpen, settings?.organization_id]);
```

#### Fix 2: Force Refresh on Every Open
Add a key to force remount:
```typescript
<AvatarManagementModal
  key={showAvatarManagement ? 'open' : 'closed'}
  isOpen={showAvatarManagement}
  // ... other props
/>
```

#### Fix 3: Check Modal Visibility
Ensure modal is actually visible:
```typescript
// In AvatarManagementModal
if (!isOpen) return null;

// Before rendering anything
console.log('Modal IS VISIBLE');
```

### 6. Quick Validation

Run this in browser console when modal is open:

```javascript
// Check if component is rendered
document.querySelector('[data-modal="avatar-management"]')

// Check avatars state (if you add a ref)
// This would require adding: const avatarsRef = useRef(avatars);
```

### 7. Network Tab Check

1. Open Network tab in DevTools
2. Filter by "ticket_avatars"
3. Open Manage Avatars modal
4. Check if request is made
5. Inspect request/response

**Expected request**:
```
URL: /rest/v1/ticket_avatars?organization_id=eq.YOUR_ORG_ID&order=created_at.desc
Method: GET
Status: 200
```

**If no request**: Effect not firing
**If 401/403**: Auth or RLS issue
**If 404**: Table doesn't exist

---

## Expected Behavior

1. Modal opens
2. Shows "Loading avatars..." briefly
3. Fetches avatars from database
4. Shows list of avatars OR "No avatars yet"
5. Console logs confirm successful fetch

## Actual Behavior (Report)

Please report what you see:
- [ ] Console logs shown?
- [ ] What organization_id is logged?
- [ ] Are avatars in database for that org?
- [ ] What does Supabase response show?
- [ ] Does Network tab show the request?
- [ ] What UI state is shown (loading/empty/list)?

---

*Created: October 18, 2025*
*Issue: Avatar Management Modal - Fetch Debugging*
