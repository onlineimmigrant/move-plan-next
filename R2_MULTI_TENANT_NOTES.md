# R2 Multi-Tenant Access Notes

## Overview
R2 video storage is now properly isolated per organization using base_url-based organization resolution:

### Organization Resolution Method
**Before:** Used `profile.organization_id` (user's personal org assignment)
**Now:** Uses `getOrganizationId(base_url)` which looks up organization by:
- `base_url` field in production
- `base_url_local` field in development
- Falls back to `NEXT_PUBLIC_TENANT_ID` if no match found

This ensures each site (identified by its domain/base_url) accesses only its own R2 storage folder.

## Endpoints

### 1. `/api/r2-videos` (Generic Listing)
Lists videos for the current site's organization (determined by base_url).

**Authorization:**
- Regular users: Can only see videos for the organization matching the current site's base_url
- `owner` role (superadmin): May supply `?organization_id=<uuid>` query param to inspect other organizations' folders

**Usage:** Generic "My Org" gallery contexts tied to the current site

### 2. `/api/products/[id]/r2-videos` (Product-Scoped Listing)
Lists videos for the organization that owns the specified product.

**Authorization:**
- Access allowed if product's organization matches current site's base_url organization, OR
- User has `owner` role (superadmin cross-org access)
- `admin` role does NOT grant cross-org access

**Usage:** Product editing/viewing contexts

### 3. `/api/upload-video` (Upload)
Uploads videos to the organization folder determined by base_url.

**Authorization:**
- Requires `admin` or `owner` role
- Videos stored in folder: `{organizationId}/videos/`
- Organization ID derived from current site's base_url, NOT user's profile

### 4. `/api/delete-r2-video` (Delete)
Deletes videos from the organization folder determined by base_url.

**Authorization:**
- Validates object key prefix matches current site's organization
- Prevents cross-org deletion regardless of role

## Component Behavior (`R2VideoUpload`)

**Updated Logic:**
- Removed client-side `profile.organization_id` filtering
- Relies entirely on API endpoints for organization scoping
- If `productId` provided: calls product-scoped endpoint
- If `productId` absent: calls generic endpoint
- Fetches `product_media` metadata only for videos returned by API (for thumbnails)

## Security Model

### Multi-Tenant Isolation
- Each organization's videos stored in separate R2 folder: `{orgId}/videos/`
- Organization determined server-side from base_url, never from client
- No organization_id parameter accepted from client (except owner override)
- CodedHarmony videos only accessible when site is accessed via CodedHarmony's base_url

### Role-Based Access
| Role | Generic Listing | Product Listing | Upload | Delete | Cross-Org Override |
|------|----------------|-----------------|--------|--------|--------------------|
| User | Current site org | No access | No | No | No |
| Admin | Current site org | Current site org | Yes (to own org) | Yes (own org only) | No |
| Owner (Superadmin) | Current site org + override param | Any org | Yes (to own org) | Yes (own org only) | Yes (via ?organization_id) |

### Key Security Features
1. ✅ Base_url-based organization resolution prevents user profile spoofing
2. ✅ Admin role restricted to own site's organization (no cross-org access)
3. ✅ Owner role can inspect but cannot modify other orgs (read-only override)
4. ✅ Upload/delete operations always scoped to current site's organization
5. ✅ Client-side organization filtering removed (API is single source of truth)

## Testing Checklist
- [ ] CodedHarmony videos only visible when accessing CodedHarmony's base_url
- [ ] Other org's admin users cannot see CodedHarmony videos
- [ ] Owner role can list videos from other orgs via ?organization_id param
- [ ] Upload creates videos in correct org folder based on base_url
- [ ] Delete prevents removing videos from other org folders
- [ ] Product endpoint respects base_url organization matching

## Future Enhancements (Optional)
- Add audit logging for owner cross-org access
- Implement signed URLs for video access with expiration
- Add video usage quotas per organization
- Support video sharing across organizations with explicit permissions

