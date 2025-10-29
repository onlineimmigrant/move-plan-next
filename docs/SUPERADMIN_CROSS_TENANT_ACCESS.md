# Superadmin Cross-Tenant Access Architecture

**Date**: 2025-10-29  
**Status**: ✅ Implemented  
**Related Files**: AuthContext.tsx, lib/auth.ts, database/migrations/007_add_superadmin_role_support.sql

## Overview

The system implements a **three-tier role hierarchy** with cross-tenant admin capabilities:

```
superadmin (system-wide) → admin (organization-level) → user (basic access)
```

### Key Feature: Superadmin Cross-Tenant Access

**Superadmin users have admin-level access to ALL organizations (tenants)**, regardless of which organization they belong to. This enables:

- System-wide administration and monitoring
- Cross-organization support and troubleshooting  
- Central management of system resources
- Emergency access to any tenant's data

## Role Definitions

### 1. Superadmin (System-Wide)
- **Scope**: Access to ALL organizations/tenants
- **Capabilities**:
  - Full admin access to their own organization
  - Full admin access to ANY other organization
  - Manage system-wide AI models (`ai_models_system`)
  - View/edit data across all tenants
  - Promote/demote users to superadmin
  - Override any organizational boundaries

### 2. Admin (Organization-Level)
- **Scope**: Limited to their own organization
- **Capabilities**:
  - Full admin access to their organization only
  - Manage organization settings and users
  - Configure organization-specific AI models
  - Cannot access other organizations' data
  - Cannot promote users to superadmin

### 3. User (Basic Access)
- **Scope**: Limited to their organization with user permissions
- **Capabilities**:
  - Access features enabled by their admin
  - Use AI models configured for users
  - Cannot access admin interfaces
  - Cannot access other organizations

## Technical Implementation

### 1. Database Layer (PostgreSQL + RLS)

**Helper Functions** (from migration 007):
```sql
-- Check if current user is superadmin
CREATE FUNCTION is_superadmin() RETURNS BOOLEAN
-- Returns: true if auth.uid() has role='superadmin'

-- Check if current user is admin (includes superadmin!)
CREATE FUNCTION is_admin() RETURNS BOOLEAN  
-- Returns: true if role='admin' OR role='superadmin'

-- Get current user's role
CREATE FUNCTION get_user_role() RETURNS TEXT
-- Returns: 'superadmin' | 'admin' | 'user'

-- Get current user's organization
CREATE FUNCTION get_user_organization_id() RETURNS UUID
-- Returns: organization_id from profiles table
```

**Key Insight**: The `is_admin()` function **already includes superadmin**, so RLS policies written for admins automatically apply to superadmins!

### 2. Application Layer (React/Next.js)

**AuthContext** (`src/context/AuthContext.tsx`):
```typescript
interface AuthContextType {
  session: Session | null;
  isAdmin: boolean;           // true for both admin AND superadmin
  isSuperadmin: boolean;      // true ONLY for superadmin
  organizationId: string | null;  // Their "home" organization
  organizationType: string | null;
  // ... other fields
}
```

**Usage Pattern**:
```typescript
const { isAdmin, isSuperadmin, organizationId } = useAuth();

// Check if user can access admin features
if (!isAdmin) {
  return <Unauthorized />;
}

// Superadmin-only features (system-wide management)
if (isSuperadmin) {
  // Show system AI models management
  // Show cross-tenant analytics
  // Show all organizations list
}

// Regular admin features (own organization only)
if (isAdmin && !isSuperadmin) {
  // Restrict to organizationId
  // Show only own organization data
}
```

**Helper Functions** (`src/lib/auth.ts`):
```typescript
// Returns true for both admin and superadmin
export async function isAdminClient(): Promise<boolean>

// Returns true ONLY for superadmin  
export async function isSuperadminClient(): Promise<boolean>
```

### 3. Cross-Tenant Access Patterns

#### Pattern 1: Bypass Organization Filter for Superadmin

**Admin-only query** (restricted to own org):
```typescript
const { data, error } = await supabase
  .from('some_table')
  .select('*')
  .eq('organization_id', organizationId);  // Filtered by org
```

**Superadmin query** (access all orgs):
```typescript
const { data, error } = await supabase
  .from('some_table')
  .select('*');
  // No organization_id filter - sees all tenants!
```

**Smart query** (conditional):
```typescript
const { isAdmin, isSuperadmin, organizationId } = useAuth();

let query = supabase.from('some_table').select('*');

// Only filter by organization if NOT superadmin
if (isAdmin && !isSuperadmin) {
  query = query.eq('organization_id', organizationId);
}

const { data, error } = await query;
```

#### Pattern 2: UI Elements for Cross-Tenant Navigation

```typescript
function AdminHeader() {
  const { isSuperadmin, organizationId } = useAuth();
  const [selectedOrg, setSelectedOrg] = useState(organizationId);

  if (isSuperadmin) {
    return (
      <div>
        <OrganizationSelector 
          currentOrg={selectedOrg}
          onOrgChange={setSelectedOrg}
        />
        <Badge>Superadmin - Viewing: {selectedOrg}</Badge>
      </div>
    );
  }

  return <Badge>Organization: {organizationId}</Badge>;
}
```

#### Pattern 3: System-Wide Models Access

**Superadmin** can manage `ai_models_system`:
```typescript
if (isSuperadmin) {
  // Access system-wide models table
  const { data } = await supabase
    .from('ai_models_system')
    .select('*')
    .order('sort_order');
}
```

**Admin** can configure which system models their org uses:
```typescript
if (isAdmin && !isSuperadmin) {
  // Access org-specific configuration
  const { data } = await supabase
    .from('org_system_model_config')
    .select('*, ai_models_system(*)')
    .eq('organization_id', organizationId);
}
```

## RLS Policy Examples

### Example 1: Admin-Accessible Table

```sql
-- Policy for admins (includes superadmin via is_admin())
CREATE POLICY "Admin can read all records"
  ON some_table
  FOR SELECT
  TO authenticated
  USING (
    is_admin()  -- Returns true for BOTH admin and superadmin
  );
```

✅ **This automatically works for superadmin cross-tenant access!**

### Example 2: Organization-Scoped with Superadmin Override

```sql
-- Policy that filters by organization, but superadmin sees all
CREATE POLICY "Users see own org, superadmin sees all"
  ON some_table
  FOR SELECT
  TO authenticated
  USING (
    is_superadmin()  -- Superadmin sees everything
    OR 
    organization_id = get_user_organization_id()  -- Others see own org
  );
```

### Example 3: Superadmin-Only Operations

```sql
-- Only superadmin can insert system models
CREATE POLICY "Only superadmin can create system models"
  ON ai_models_system
  FOR INSERT
  TO authenticated
  WITH CHECK (
    is_superadmin()
  );
```

## Security Considerations

### 1. Audit Logging

All superadmin role changes are logged in `role_change_audit`:
```sql
SELECT * FROM role_change_audit 
WHERE new_role = 'superadmin' 
ORDER BY changed_at DESC;
```

### 2. Promotion Function

Only superadmins can promote others to superadmin:
```sql
-- This function checks caller is superadmin
SELECT * FROM promote_to_superadmin('user@example.com');
```

### 3. Demotion Safety

```sql
-- Demote a superadmin back to admin (must be called by another superadmin)
UPDATE profiles 
SET role = 'admin' 
WHERE id = 'user-uuid-here'
AND is_superadmin();  -- Caller must be superadmin
```

### 4. Preventing Lockout

**Always maintain at least one superadmin** in the system:
```sql
-- Check superadmin count before demotion
SELECT COUNT(*) FROM profiles WHERE role = 'superadmin';
-- If count = 1, DO NOT demote that user!
```

## UI Recommendations

### 1. Visual Indicators

Always show superadmin users which organization they're viewing:

```typescript
{isSuperadmin && (
  <Alert variant="info">
    <Crown className="h-4 w-4" />
    <span>Superadmin Mode - Currently viewing: {currentOrgName}</span>
  </Alert>
)}
```

### 2. Organization Switcher

Provide a dropdown for superadmins to switch between organizations:

```typescript
{isSuperadmin && (
  <Select value={currentOrgId} onValueChange={setCurrentOrgId}>
    <SelectTrigger>
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      {organizations.map(org => (
        <SelectItem key={org.id} value={org.id}>
          {org.name}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
)}
```

### 3. Dangerous Actions

Require additional confirmation for superadmin cross-tenant changes:

```typescript
if (isSuperadmin && targetOrgId !== organizationId) {
  // Editing another organization's data
  return (
    <ConfirmDialog
      title="Cross-Tenant Action"
      description={`You are about to modify data for ${targetOrgName}. Continue?`}
      onConfirm={handleAction}
    />
  );
}
```

## Testing Cross-Tenant Access

### 1. Setup Test Organizations

```sql
-- Create two test organizations
INSERT INTO organizations (name, type) VALUES 
  ('Test Org A', 'software'),
  ('Test Org B', 'marketing');
```

### 2. Create Test Users

```sql
-- Admin for Org A
INSERT INTO profiles (id, role, organization_id) VALUES 
  ('admin-a-uuid', 'admin', 'org-a-uuid');

-- Admin for Org B  
INSERT INTO profiles (id, role, organization_id) VALUES 
  ('admin-b-uuid', 'admin', 'org-b-uuid');

-- Superadmin (belongs to Org A but can access both)
INSERT INTO profiles (id, role, organization_id) VALUES 
  ('superadmin-uuid', 'superadmin', 'org-a-uuid');
```

### 3. Test Access Patterns

**Admin A** (should only see Org A data):
```sql
-- Login as admin-a-uuid
SELECT * FROM some_table;  
-- Should only return records with organization_id = 'org-a-uuid'
```

**Superadmin** (should see all data):
```sql
-- Login as superadmin-uuid
SELECT * FROM some_table;
-- Should return records from BOTH Org A and Org B
```

## Migration Checklist

When adding new tables/features, ensure superadmin cross-tenant access:

- [ ] RLS policies use `is_superadmin()` for bypass conditions
- [ ] RLS policies use `is_admin()` (not `role = 'admin'`) for admin checks
- [ ] Application queries conditionally filter by `organizationId` based on `isSuperadmin`
- [ ] UI shows which organization superadmin is viewing
- [ ] Dangerous cross-tenant actions require confirmation
- [ ] Audit logging for superadmin actions on other tenants

## Common Patterns Summary

### Query Pattern
```typescript
// Smart query builder
function buildQuery(table: string) {
  const { isSuperadmin, organizationId } = useAuth();
  let query = supabase.from(table).select('*');
  
  if (!isSuperadmin) {
    query = query.eq('organization_id', organizationId);
  }
  
  return query;
}
```

### RLS Pattern
```sql
-- Table policy template
CREATE POLICY "policy_name"
  ON table_name
  FOR operation
  TO authenticated
  USING (
    is_superadmin()  -- Superadmin bypass
    OR (
      is_admin() AND organization_id = get_user_organization_id()  -- Admin own org
    )
    OR (
      get_user_role() = 'user' AND organization_id = get_user_organization_id()  -- User own org
    )
  );
```

### UI Pattern
```typescript
function AdminFeature() {
  const { isAdmin, isSuperadmin, organizationId } = useAuth();
  
  if (!isAdmin) return <Unauthorized />;
  
  return (
    <div>
      {isSuperadmin && <SuperadminBanner currentOrg={organizationId} />}
      {/* Feature content */}
    </div>
  );
}
```

## Next Steps

1. ✅ Deploy migration 007 (superadmin role support)
2. ✅ Promote first superadmin via SQL
3. ✅ Update AuthContext with `isSuperadmin` flag
4. 📋 Deploy migration 005 (RLS policies with superadmin support)
5. 📋 Test superadmin cross-tenant access
6. 📋 Build superadmin portal UI with organization switcher
7. 📋 Implement audit logging for cross-tenant actions
8. 📋 Add system-wide analytics dashboard (superadmin only)

## References

- **Migration 007**: `/database/migrations/007_add_superadmin_role_support.sql`
- **AuthContext**: `/src/context/AuthContext.tsx`
- **Auth Helpers**: `/src/lib/auth.ts`
- **RLS Policies**: `/database/migrations/005_setup_rls_policies.sql`
