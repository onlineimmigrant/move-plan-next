# Site Management System

## Overview

This system allows authenticated users with site creation permissions to create and manage multiple organization sites. The system is designed with proper access controls and permission management.

## Database Setup

1. Run the migration script to set up the required database structure:
```sql
-- Execute the contents of database/migrations/001_site_management_setup.sql
```

This will:
- Add `is_site_creator` field to the `profiles` table
- Create `organization_memberships` table
- Set up proper RLS policies
- Create necessary indexes
- Create a default general organization
- Update existing admin users with site creation permissions

## System Architecture

### Database Tables

#### `organizations`
- `id` (UUID) - Primary key
- `name` (VARCHAR) - Organization name
- `type` (VARCHAR) - Organization type (general, immigration, solicitor, finance, education, job, beauty, doctor, services)
- `base_url` (VARCHAR) - Production URL (filled later by Vercel)
- `base_url_local` (VARCHAR) - Local development URL (auto-generated)
- `created_at` (TIMESTAMPTZ) - Creation timestamp

#### `organization_memberships`
- `id` (UUID) - Primary key
- `organization_id` (UUID) - Foreign key to organizations
- `user_id` (UUID) - Foreign key to auth.users
- `role` (VARCHAR) - User role in organization (admin, member, viewer)
- `status` (VARCHAR) - Membership status (active, inactive, pending)
- `created_at` / `updated_at` (TIMESTAMPTZ) - Timestamps

#### `profiles` (updated)
- Added `is_site_creator` (BOOLEAN) - Permission to create new sites

### Access Control Rules

1. **Site Creation Permissions:**
   - User must have `is_site_creator = true` in their profile
   - User must belong to an organization with `type = 'general'`
   - Admins can create unlimited sites
   - Non-admins are limited to creating one site

2. **Organization Types:**
   - `general` - Main organization that can create other sites
   - `immigration`, `solicitor`, `finance`, `education`, `job`, `beauty`, `doctor`, `services` - Specific business types

3. **User Roles:**
   - **Admin in General Org:** Can create unlimited sites, becomes admin of created sites
   - **User in General Org:** Can create one site if `is_site_creator = true`
   - **Admin in Business Org:** Full admin access to their specific organization
   - **Member/Viewer:** Limited access based on role

## API Endpoints

### `POST /api/organizations/create`
Creates a new organization.

**Headers:**
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Body:**
```json
{
  "name": "My Business",
  "type": "immigration"
}
```

**Response:**
```json
{
  "success": true,
  "organization": {
    "id": "uuid",
    "name": "My Business",
    "type": "immigration",
    "base_url_local": "http://localhost:3101",
    "base_url": null
  }
}
```

### `GET /api/organizations`
Retrieves user's organizations and permissions.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "organizations": [
    {
      "id": "uuid",
      "name": "My Business",
      "type": "immigration",
      "base_url": null,
      "base_url_local": "http://localhost:3101",
      "created_at": "2025-01-01T00:00:00Z",
      "user_role": "admin",
      "user_status": "active"
    }
  ],
  "canCreateMore": true,
  "profile": {
    "role": "admin",
    "is_site_creator": true,
    "current_organization_id": "general-org-uuid"
  }
}
```

## Frontend Components

### `SiteManagement` Component
Located at `/src/components/SiteManagement.tsx`

Features:
- Lists all user's organizations
- Create new organization modal
- Permission checking
- Responsive design
- Error handling

### Admin Page
Located at `/src/app/[locale]/admin/site-management/page.tsx`

Accessible via the admin navigation under Settings > Site Management.

## Local Development URLs

The system automatically assigns local development URLs:
- First site: `http://localhost:3100`
- Second site: `http://localhost:3101`
- And so on...

## Production Deployment

1. When deploying to Vercel, update the `base_url` field in the organizations table with the actual Vercel URL
2. Each organization should have its own Vercel deployment
3. The `base_url_local` remains for local development

## Usage Flow

1. **Admin Setup:**
   - Ensure there's a "general" organization in the database
   - Grant `is_site_creator = true` to users who should create sites
   - Assign users to the general organization

2. **Site Creation:**
   - User navigates to Admin > Settings > Site Management
   - Clicks "Create New Site"
   - Fills in organization name and type
   - System creates organization and assigns user as admin

3. **Multi-Organization Access:**
   - Users can belong to multiple organizations
   - Role in each organization is independent
   - Can switch between organizations if needed

## Security Features

- Row Level Security (RLS) policies on all tables
- Proper permission checking at API level
- Token-based authentication
- Organization isolation
- Role-based access control

## Error Handling

The system includes comprehensive error handling for:
- Invalid permissions
- Missing required fields
- Database errors
- Authentication issues
- Creation limits exceeded

## Extending the System

To add new organization types:
1. Update the CHECK constraint in the organizations table
2. Add the new type to the `organizationTypes` array in `SiteManagement.tsx`
3. Update the validation in the API routes
