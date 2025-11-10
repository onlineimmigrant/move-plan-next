# File Sharing Feature Implementation Guide

## Overview

This feature enables admins and superadmins to share files and folders with other users in the system. The implementation includes database schema, API endpoints, UI components, and proper permission controls.

## Features

### For Admins (Organization-scoped)
- Share files/folders with users in their organization
- View all shares within their organization
- Revoke shares within their organization
- Set view or edit permissions
- Set expiration dates on shares

### For Superadmins (System-wide)
- Share files/folders with any user in the system
- View all shares across all organizations
- Revoke any share
- Set view or edit permissions
- Set expiration dates on shares

### For Regular Users
- View files shared with them
- Access shared files based on granted permissions (view/edit)
- Cannot share files (unless admin/superadmin)

## Database Schema

### Table: `file_shares`

```sql
CREATE TABLE public.file_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  is_folder BOOLEAN DEFAULT FALSE,
  shared_by_user_id UUID NOT NULL REFERENCES auth.users(id),
  shared_with_user_id UUID NOT NULL REFERENCES auth.users(id),
  organization_id UUID REFERENCES public.organizations(id),
  permission_type TEXT CHECK (permission_type IN ('view', 'edit')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE
);
```

### Indexes
- `idx_file_shares_shared_with` - Fast lookup for files shared with a user
- `idx_file_shares_shared_by` - Fast lookup for files shared by a user
- `idx_file_shares_organization` - Fast lookup for organization shares
- `idx_file_shares_file_path` - Fast lookup by file path
- `idx_file_shares_active` - Fast lookup for active shares

### Row Level Security (RLS)

The table has comprehensive RLS policies:

1. **Users can view their shared files** - Users can see files they've shared
2. **Users can view files shared with them** - Users can see files shared to them
3. **Admins can view organization shares** - Admins see all shares in their org
4. **Superadmins see all shares** - Superadmins have global visibility
5. **Users can create shares** - Users can share their own files
6. **Admins can create shares for their organization** - Admins can share files within their org
7. **Superadmins can create shares globally** - Superadmins can share to anyone
8. **Users can manage their shares** - Users can update/delete shares they created
9. **Admins can manage organization shares** - Admins can manage shares in their org
10. **Superadmins can manage all shares** - Superadmins have full control

## Storage Policies

The `chat-files` bucket has been updated with policies to support file sharing:

1. **Users can view own and shared files** - Access to files owned or shared with them
2. **Admins can view organization files** - Admins see files of users in their org
3. **Users can update shared files with edit permission** - Edit permission allows modifications
4. **Admins can manage organization files** - Full control over org files
5. **Superadmins have full access** - Global file access

## API Endpoints

### GET `/api/files/share`

Retrieve file shares.

**Query Parameters:**
- `view` (optional): Filter by view type
  - `shared-by-me` - Files/folders you've shared
  - `shared-with-me` - Files/folders shared with you
  - `all` - All shares (admin/superadmin only)
  - Default: Both shared by and shared with

**Headers:**
- `Authorization: Bearer <token>`

**Response:**
```json
{
  "shares": [
    {
      "id": "uuid",
      "file_path": "user-id/folder/file.txt",
      "file_name": "file.txt",
      "is_folder": false,
      "shared_by_user_id": "uuid",
      "shared_with_user_id": "uuid",
      "organization_id": "uuid",
      "permission_type": "view|edit",
      "created_at": "timestamp",
      "expires_at": "timestamp|null",
      "is_active": true,
      "shared_by": { "id": "uuid", "email": "...", "profiles": {...} },
      "shared_with": { "id": "uuid", "email": "...", "profiles": {...} }
    }
  ]
}
```

### POST `/api/files/share`

Create a new file share.

**Headers:**
- `Authorization: Bearer <token>`
- `Content-Type: application/json`

**Body:**
```json
{
  "file_path": "user-id/folder/file.txt",
  "file_name": "file.txt",
  "is_folder": false,
  "shared_with_user_id": "uuid",
  "permission_type": "view|edit",
  "expires_at": "timestamp|null"
}
```

**Permission Rules:**
- Regular users: Can share their own files only
- Admins: Can share files with users in their organization
- Superadmins: Can share files with any user

**Response:**
```json
{
  "share": {
    "id": "uuid",
    "file_path": "...",
    "file_name": "...",
    // ... full share object
  }
}
```

**Error Responses:**
- `400` - Missing required fields or invalid permission_type
- `401` - Unauthorized
- `403` - Insufficient permissions
- `404` - User or recipient not found
- `409` - File already shared with this user
- `500` - Server error

### DELETE `/api/files/share?id=<share_id>`

Revoke a file share (soft delete).

**Headers:**
- `Authorization: Bearer <token>`

**Query Parameters:**
- `id` (required): Share ID to revoke

**Permission Rules:**
- Owner of the share can revoke
- Admins can revoke shares in their organization
- Superadmins can revoke any share

**Response:**
```json
{
  "message": "Share revoked successfully"
}
```

## UI Components

### ShareFileModal

Component for sharing files with other users.

**Location:** `/src/components/modals/ChatWidget/ShareFileModal.tsx`

**Props:**
```typescript
interface ShareFileModalProps {
  isOpen: boolean;
  onClose: () => void;
  filePath: string;
  fileName: string;
  isFolder?: boolean;
  userId: string | null;
}
```

**Features:**
- User selector (filtered by organization for admins)
- Permission dropdown (view/edit)
- Optional expiration date (in days)
- List of existing shares
- Revoke share functionality

### FilesModal Integration

The existing FilesModal has been updated with:

1. **Share button** - Visible only to admins and superadmins
2. **User role detection** - Fetches current user's role
3. **ShareFileModal integration** - Opens modal when share button is clicked

**Location:** `/src/components/modals/ChatWidget/FilesModal.tsx`

## Usage Example

### For Admins

1. Open Files page (`/account/files`)
2. Locate the file you want to share
3. Click the share icon (blue button)
4. Select a user from your organization
5. Choose permission type (view or edit)
6. Optionally set expiration in days
7. Click "Share"

### For Superadmins

Same as admins, but can see and select users from all organizations.

### For Regular Users

- Shared files will appear in the "Shared with me" tab (when implemented)
- Users can view/edit based on granted permissions
- No ability to share files

## Permission Matrix

| Action | Regular User | Admin | Superadmin |
|--------|--------------|-------|------------|
| Share own files | ❌ | ✅ (within org) | ✅ (all users) |
| View shared files | ✅ (shared with them) | ✅ (org files) | ✅ (all files) |
| Edit shared files | ✅ (if edit permission) | ✅ (org files) | ✅ (all files) |
| Revoke own shares | ✅ | ✅ | ✅ |
| Revoke other's shares | ❌ | ✅ (within org) | ✅ (all shares) |
| View all shares | ❌ | ✅ (within org) | ✅ (all shares) |

## Security Considerations

1. **Row Level Security** - All database access is protected by RLS policies
2. **Storage Policies** - File access is controlled at the storage level
3. **API Authorization** - All endpoints require authentication
4. **Organization Isolation** - Admins can only share within their organization
5. **Expired Shares** - Automatic cleanup function available
6. **Soft Deletes** - Shares are marked inactive, not deleted

## Migrations

Run these migrations in order:

1. `010_create_file_shares.sql` - Creates the file_shares table and policies
2. `011_update_storage_policies_for_sharing.sql` - Updates storage bucket policies

```bash
# Apply migrations
psql -U postgres -d your_database -f database/migrations/010_create_file_shares.sql
psql -U postgres -d your_database -f database/migrations/011_update_storage_policies_for_sharing.sql
```

## Automatic Cleanup

A cleanup function is provided to deactivate expired shares:

```sql
-- Manual cleanup
SELECT public.cleanup_expired_shares();

-- Optional: Schedule with pg_cron (if available)
SELECT cron.schedule(
  'cleanup-expired-shares',
  '0 * * * *',  -- Every hour
  'SELECT public.cleanup_expired_shares()'
);
```

## Future Enhancements

### Planned Features (Not Yet Implemented)

1. **Shared with me view** - Dedicated tab showing files shared with the user
2. **Folder sharing** - Share entire folders with all contained files
3. **Share management page** - Admin dashboard for viewing/managing shares
4. **Notifications** - Email notifications when files are shared
5. **Share links** - Generate public share links with tokens
6. **Bulk sharing** - Share multiple files at once
7. **Share statistics** - Analytics on file sharing activity
8. **Share history** - Audit log of share actions

### Implementation Notes

When implementing these features:

- **Shared with me view**: Add a new tab in FilesModal that queries `/api/files/share?view=shared-with-me`
- **Folder sharing**: Update ShareFileModal to handle `is_folder=true` and create shares for all files in the folder
- **Share management**: Create a new admin page at `/admin/file-shares` with table view and filters
- **Notifications**: Add email trigger on INSERT to file_shares table
- **Share links**: Create new table `file_share_links` with tokens and use them for public access

## Troubleshooting

### Users can't see shared files

1. Check if RLS policies are enabled: `SELECT * FROM pg_policies WHERE tablename = 'file_shares';`
2. Verify storage policies: Check Supabase Storage dashboard
3. Check share is active: `SELECT * FROM file_shares WHERE is_active = TRUE;`
4. Verify expiration: Check `expires_at` is NULL or in the future

### Admins can't share files

1. Verify user's role in profiles table: `SELECT role FROM profiles WHERE id = 'user-id';`
2. Check organization membership: `SELECT organization_id FROM profiles WHERE id = 'user-id';`
3. Verify recipient is in same organization (for admins)

### Share creation fails

1. Check for duplicate shares: The table has a unique constraint on `(file_path, shared_by_user_id, shared_with_user_id)`
2. Verify file_path format: Should be `user-id/folder/file.txt` or `user-id/file.txt`
3. Check permission_type: Must be 'view' or 'edit'

## Testing

### Test Scenarios

1. **Admin shares file with org user** - Should succeed
2. **Admin shares file with non-org user** - Should fail
3. **Superadmin shares file with any user** - Should succeed
4. **Regular user shares file** - Should fail
5. **User accesses shared file** - Should succeed if active and not expired
6. **User edits view-only shared file** - Should fail
7. **User edits edit-permission shared file** - Should succeed
8. **Revoke share** - File should no longer be accessible
9. **Expired share** - Should not grant access

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the RLS policies in the database
3. Check the API endpoint logs
4. Verify user roles and organization membership
