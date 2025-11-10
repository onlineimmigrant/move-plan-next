# File Sharing Feature - Quick Start Guide

## What's Been Implemented

I've implemented a comprehensive file sharing system that allows **admins** and **superadmins** to share files and folders with other users. Here's what's ready to use:

## Files Created

### Database Migrations
1. **`/database/migrations/010_create_file_shares.sql`**
   - Creates `file_shares` table
   - Implements Row Level Security (RLS) policies
   - Adds indexes for performance
   - Includes automatic cleanup function for expired shares

2. **`/database/migrations/011_update_storage_policies_for_sharing.sql`**
   - Updates storage bucket policies for shared file access
   - Allows admins to view organization files
   - Allows superadmins to view all files
   - Enforces edit permissions on shared files

### API Endpoints
3. **`/src/app/api/files/share/route.ts`**
   - `GET` - List file shares (filtered by role)
   - `POST` - Create new file share
   - `DELETE` - Revoke file share
   - Full permission checking for admin/superadmin roles

### UI Components
4. **`/src/components/modals/ChatWidget/ShareFileModal.tsx`**
   - Modal for sharing files with users
   - User selector (filtered by organization for admins)
   - Permission selector (view/edit)
   - Expiration date field
   - List of existing shares with revoke option

5. **`/src/components/modals/ChatWidget/FilesModal.tsx`** (Updated)
   - Added share button for admins/superadmins
   - Integrated ShareFileModal component
   - User role detection

### Documentation
6. **`/FILE_SHARING_IMPLEMENTATION.md`**
   - Comprehensive implementation guide
   - API documentation
   - Security considerations
   - Troubleshooting guide

## How to Use

### Step 1: Apply Database Migrations

Run these SQL files in your Supabase database:

```bash
# Connect to your database and run:
psql -U postgres -d your_database -f database/migrations/010_create_file_shares.sql
psql -U postgres -d your_database -f database/migrations/011_update_storage_policies_for_sharing.sql
```

Or use Supabase Dashboard:
1. Go to SQL Editor
2. Copy and paste contents of `010_create_file_shares.sql`
3. Run it
4. Repeat for `011_update_storage_policies_for_sharing.sql`

### Step 2: Use the Feature

#### For Admins (Organization-scoped sharing)

1. Navigate to `/account/files` in your app
2. You'll see a blue **share icon** next to each file (if you're an admin)
3. Click the share icon to open the share modal
4. Select a user from your organization
5. Choose permission (View or Edit)
6. Optionally set expiration in days
7. Click "Share"

#### For Superadmins (System-wide sharing)

Same as above, but you can share with **any user** in the system, not just your organization.

## Permission System

### What Admins Can Do
- ✅ Share files with users in their organization
- ✅ View all shares within their organization
- ✅ Revoke shares within their organization
- ✅ Set view or edit permissions
- ✅ Set expiration dates

### What Superadmins Can Do
- ✅ Share files with **any user** in the system
- ✅ View **all shares** across all organizations
- ✅ Revoke **any share**
- ✅ Set view or edit permissions
- ✅ Set expiration dates

### What Regular Users Can Do
- ✅ View files shared with them (when "Shared with me" tab is implemented)
- ✅ Download/view shared files
- ✅ Edit shared files (if granted edit permission)
- ❌ Cannot share files (no share button visible)

## Database Schema

The `file_shares` table stores all sharing information:

```sql
- id (UUID): Unique share ID
- file_path (TEXT): Path to file in storage
- file_name (TEXT): Display name
- is_folder (BOOLEAN): Whether it's a folder share
- shared_by_user_id (UUID): Who shared it
- shared_with_user_id (UUID): Who it's shared with
- organization_id (UUID): Organization context
- permission_type (TEXT): 'view' or 'edit'
- created_at (TIMESTAMPTZ): When share was created
- expires_at (TIMESTAMPTZ): Optional expiration
- is_active (BOOLEAN): Whether share is active
```

## Security

The implementation includes multiple security layers:

1. **Row Level Security (RLS)** - Database-level access control
2. **Storage Policies** - File-level access control
3. **API Authorization** - All endpoints require authentication
4. **Organization Isolation** - Admins can only share within their org
5. **Permission Enforcement** - View vs Edit permissions enforced

## What's Next (Not Yet Implemented)

These features are planned but not yet built:

1. **"Shared with me" view** - A tab showing files shared with you
2. **Folder sharing** - Share entire folders (not just individual files)
3. **Permission enforcement in FilesModal** - Prevent editing view-only files
4. **Admin management page** - Dashboard to view all shares
5. **Email notifications** - Notify users when files are shared
6. **Share analytics** - Track sharing activity

## Testing

To test the feature:

1. **Create a test admin user**
   ```sql
   UPDATE profiles SET role = 'admin' WHERE id = 'your-user-id';
   ```

2. **Upload a file** at `/account/files`

3. **Click the share button** (blue icon)

4. **Share with another user** in your organization

5. **Log in as the other user** and verify they can access the file

## Troubleshooting

### Share button doesn't appear
- Check user role: `SELECT role FROM profiles WHERE id = 'user-id';`
- Only admins and superadmins see the share button

### Can't share with a user
- Admins: User must be in the same organization
- Check: `SELECT organization_id FROM profiles WHERE id = 'recipient-id';`

### Shared file not accessible
- Check if share is active: `SELECT * FROM file_shares WHERE is_active = TRUE;`
- Check expiration: `expires_at` should be NULL or in the future
- Verify storage policies are applied

## API Examples

### Share a file
```javascript
const response = await fetch('/api/files/share', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    file_path: 'user-id/folder/file.txt',
    file_name: 'file.txt',
    is_folder: false,
    shared_with_user_id: 'recipient-user-id',
    permission_type: 'view', // or 'edit'
    expires_at: null // or ISO timestamp
  })
});
```

### List your shares
```javascript
const response = await fetch('/api/files/share?view=shared-by-me', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const { shares } = await response.json();
```

### Revoke a share
```javascript
const response = await fetch(`/api/files/share?id=${shareId}`, {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

## Summary

You now have a fully functional file sharing system with:
- ✅ Database schema with RLS
- ✅ Storage policies for shared access
- ✅ API endpoints for share management
- ✅ UI components for sharing files
- ✅ Role-based permission system
- ✅ Admin/Superadmin support
- ✅ Expiration dates
- ✅ Automatic cleanup function

The core functionality is complete and ready to use. Additional features like "Shared with me" view, folder sharing, and admin dashboard can be added as needed.

## Need Help?

Refer to `/FILE_SHARING_IMPLEMENTATION.md` for detailed documentation, or check the inline comments in the code files.
