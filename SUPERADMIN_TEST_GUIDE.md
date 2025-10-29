# Quick Test Guide: Superadmin Cross-Tenant Access

**Goal**: Verify superadmin can access admin interface and has cross-tenant capabilities

---

## ✅ Step 1: Verify Your Database Status

Open Supabase SQL Editor and run:

```sql
-- 1. Check your role
SELECT 
  u.email,
  p.role,
  p.organization_id,
  o.name as org_name,
  o.type as org_type
FROM profiles p
JOIN auth.users u ON u.id = p.id
LEFT JOIN organizations o ON o.id = p.organization_id
WHERE u.email = 'YOUR_EMAIL@example.com';  -- Replace with your email
```

**Expected Result:**
```
email              | role       | organization_id | org_name  | org_type
-------------------|------------|-----------------|-----------|----------
your@email.com     | superadmin | uuid-here       | Your Org  | software
```

✅ If role shows `superadmin`, continue to Step 2  
❌ If role shows `admin` or `user`, promote yourself first:
```sql
SELECT * FROM promote_to_superadmin('YOUR_EMAIL@example.com');
```

---

## ✅ Step 2: Test Helper Functions

```sql
-- Should all return TRUE if you're superadmin
SELECT is_superadmin() as "Am I Superadmin?";
SELECT is_admin() as "Am I Admin?";
SELECT get_user_role() as "My Role";
```

**Expected Results:**
```
Am I Superadmin? | Am I Admin? | My Role
-----------------|-------------|----------
true             | true        | superadmin
```

---

## ✅ Step 3: Test Admin Interface Access

1. **Open your browser** to your app (e.g., `http://localhost:3000`)

2. **Navigate to admin page**: `http://localhost:3000/admin`

3. **Expected Behavior:**
   - ✅ You should see the admin interface (not redirected to login)
   - ✅ No errors in browser console
   - ✅ Page loads successfully

4. **Open browser console** (F12) and check logs:
   ```
   Profile fetched: {
     role: 'superadmin',
     organization_id: 'uuid-here',
     ...
   }
   ```

---

## ✅ Step 4: Verify Auth Context

### Option A: Using React DevTools

1. Install React DevTools extension (if not installed)
2. Open DevTools → Components tab
3. Find `AuthProvider` component
4. Check hooks → Context value:
   ```
   isAdmin: true          ✅
   isSuperadmin: true     ✅
   organizationId: "uuid-here"
   ```

### Option B: Using Console

In your admin page, add this temporarily:

```typescript
// In any admin page component
const auth = useAuth();

useEffect(() => {
  console.log('🔍 Auth Check:', {
    isAdmin: auth.isAdmin,
    isSuperadmin: auth.isSuperadmin,
    organizationId: auth.organizationId,
    role: 'Should see isAdmin=true AND isSuperadmin=true'
  });
}, [auth]);
```

**Expected Console Output:**
```
🔍 Auth Check: {
  isAdmin: true,           ✅
  isSuperadmin: true,      ✅
  organizationId: "uuid-here"
}
```

---

## ✅ Step 5: Test Cross-Tenant Query (Optional)

### Check How Many Organizations Exist

In Supabase SQL Editor:
```sql
-- List all organizations
SELECT id, name, type 
FROM organizations 
ORDER BY name;
```

### Test Cross-Tenant Access

If you have multiple organizations, test this:

```sql
-- As superadmin, you should see ALL records
-- (Regular admin would only see their own org's records)
SELECT 
  p.name,
  o.name as organization_name,
  p.organization_id
FROM products p
LEFT JOIN organizations o ON o.id = p.organization_id
ORDER BY o.name;
```

**Expected**: You see products from ALL organizations (not just yours)

---

## 🎉 Success Criteria

You've successfully implemented superadmin cross-tenant access if:

- [x] ✅ Database shows your role as `superadmin`
- [x] ✅ Helper functions return correct values
- [x] ✅ You can access `/admin` without redirect
- [x] ✅ AuthContext shows `isAdmin: true` AND `isSuperadmin: true`
- [x] ✅ No TypeScript errors in AuthContext.tsx
- [x] ✅ Browser console shows no auth errors

---

## 🚀 What You Can Do Now

### 1. Access Admin Interface
Navigate to any admin route:
- `/admin` - Main admin dashboard
- `/admin/products/management` - Product management
- `/admin/pricingplans/management` - Pricing plans
- `/admin/[table]` - Any dynamic table

### 2. System-Wide Queries (When You Build Them)
You can now build queries that see ALL organizations:

```typescript
// Example: Fetch all products across all orgs (superadmin only)
const { isSuperadmin } = useAuth();

if (isSuperadmin) {
  const { data } = await supabase
    .from('products')
    .select('*, organizations(name)')
    .order('created_at', { ascending: false });
  
  // data contains products from ALL organizations
}
```

### 3. Organization Switcher (To Build Next)
Create a component that lets you switch between organizations:

```typescript
function OrganizationSwitcher() {
  const { isSuperadmin } = useAuth();
  const [orgs, setOrgs] = useState([]);
  const [selected, setSelected] = useState('');

  useEffect(() => {
    if (isSuperadmin) {
      supabase
        .from('organizations')
        .select('id, name, type')
        .order('name')
        .then(({ data }) => setOrgs(data || []));
    }
  }, [isSuperadmin]);

  if (!isSuperadmin) return null;

  return (
    <div className="bg-purple-100 p-3 rounded-lg">
      <label className="font-medium">👑 View Organization:</label>
      <select 
        className="ml-2 p-2 border rounded"
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
      >
        <option value="">All Organizations</option>
        {orgs.map(org => (
          <option key={org.id} value={org.id}>
            {org.name} ({org.type})
          </option>
        ))}
      </select>
    </div>
  );
}
```

---

## 🐛 Troubleshooting

### Issue: Still redirected to login

**Check:**
1. Browser cookies enabled?
2. Session exists? `console.log(auth.session)`
3. Database role correct? Run Step 1 query again
4. Browser cache? Try hard refresh (Cmd+Shift+R)

**Solution:**
```bash
# Clear Next.js cache
rm -rf .next
npm run dev
```

### Issue: isAdmin is true but isSuperadmin is false

**Check:**
```sql
-- Verify your actual role in database
SELECT role FROM profiles WHERE id = auth.uid();
```

If it shows `admin`, promote yourself:
```sql
SELECT * FROM promote_to_superadmin('your-email@example.com');
```

Then log out and log back in.

### Issue: TypeScript errors in AuthContext

**Solution:**
```bash
# Restart TypeScript server in VS Code
# Command Palette (Cmd+Shift+P) → "TypeScript: Restart TS Server"
```

---

## 📝 Next Actions

After confirming everything works:

1. **Deploy Migration 005** (RLS Policies)
   ```sql
   -- In Supabase SQL Editor
   -- Copy/paste contents of: 
   -- database/migrations/005_setup_rls_policies.sql
   ```

2. **Deploy Migration 006** (Seed System Models)
   ```sql
   -- Copy/paste contents of:
   -- database/migrations/006_seed_system_models.sql
   ```

3. **Build Superadmin Features**
   - Organization switcher UI
   - Cross-tenant data tables
   - System models management interface
   - Usage analytics dashboard

4. **Review Documentation**
   - Read: `/docs/SUPERADMIN_CROSS_TENANT_ACCESS.md`
   - Study: `/src/components/admin/CrossTenantDataTable.example.tsx`
   - Reference: `/SUPERADMIN_IMPLEMENTATION.md`

---

## 📞 Report Back

Let me know your test results:
- ✅ "Step 1-5 all passed" → Ready for next phase!
- ⚠️ "Step X failed" → I'll help debug
- 💡 "Questions about Y" → Happy to clarify

---

**Good luck with testing! 🚀**
