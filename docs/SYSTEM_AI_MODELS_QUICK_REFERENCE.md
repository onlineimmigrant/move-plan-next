# System AI Models - Quick Reference

## 🗂️ File Structure

```
/database/migrations/
├── 001_create_ai_models_system.sql      ✅ Core system models table
├── 002_enhance_organizations_table.sql  ✅ Add pricing + quotas
├── 003_create_org_system_model_config.sql ✅ Admin controls
├── 004_create_ai_model_usage.sql        ✅ Usage tracking
├── 005_setup_rls_policies.sql           ✅ Security policies
├── 006_seed_system_models.sql           ✅ Sample data
└── README.md                            ✅ Full instructions

/docs/
├── SYSTEM_AI_MODELS_ARCHITECTURE.md     ✅ Complete design doc
├── SYSTEM_AI_MODELS_FOUNDATION_PLAN.md  ✅ 8-week roadmap
└── SYSTEM_AI_MODELS_PHASE1_COMPLETE.md  ✅ Phase 1 summary
```

## 🎯 Three-Tier Access Model

```
SUPERADMIN → Creates system models, manages all orgs
     ↓
ADMIN      → Enables/disables models, sets user limits
     ↓
USER       → Uses enabled models within quotas
```

## 📊 Key Tables

| Table | Purpose | Rows (typical) |
|-------|---------|----------------|
| `ai_models_system` | System model templates | 10-50 |
| `org_system_model_config` | Admin enable/disable | 100-500 |
| `ai_model_usage` | Usage tracking | Millions |
| `organizations` | Enhanced with quotas | Existing |

## 🔑 Important Fields

### ai_models_system
```sql
organization_types   TEXT[]  -- Empty = all types
required_plan        TEXT    -- free|starter|pro|enterprise
token_limit_amount   INT     -- NULL = unlimited
is_free             BOOLEAN  -- true = no counting
is_trial            BOOLEAN  -- true = trial model
```

### organizations (new columns)
```sql
pricing_plan         TEXT    -- Current plan level
token_quota_monthly  INT     -- Org-wide quota
token_usage_current  INT     -- Current usage
token_reset_date     TIMESTAMP -- When quota resets
```

## 🎨 Organization Types

```typescript
Available types (from organizations.type):
- immigration, solicitor, finance, education
- job, beauty, doctor, services
- realestate, construction, software, marketing
- consulting, automotive, hospitality, retail
- healthcare, transportation, technology
- general, platform
```

## 💰 Pricing Plan Hierarchy

```
free (0) < starter (1) < pro (2) < enterprise (3)

Model with required_plan='pro' is available to:
✅ pro orgs
✅ enterprise orgs
❌ free orgs
❌ starter orgs
```

## 🔒 RLS Policy Summary

### Superadmin
- ✅ Full access to everything
- ✅ Create/edit/delete system models
- ✅ View all orgs, all usage

### Admin
- ✅ Read system models (filtered by org type)
- ✅ Enable/disable models for their users
- ✅ Set per-user token limits
- ✅ View org-wide usage
- ❌ Cannot edit system models

### User
- ✅ Read enabled models only
- ✅ View own usage
- ✅ Record usage when using models
- ❌ Cannot see disabled models
- ❌ Cannot change limits

## 📈 Token Limit Enforcement

```
System Model Default (token_limit_amount)
    ↓
Admin Override (token_limit_per_user)
    ↓
Org Monthly Quota (token_quota_monthly)
    ↓
User Request
```

## 🚀 Quick Start

### 1. Deploy Migrations
```bash
# In Supabase SQL Editor, run in order:
1. 001_create_ai_models_system.sql
2. 002_enhance_organizations_table.sql
3. 003_create_org_system_model_config.sql
4. 004_create_ai_model_usage.sql
5. 005_setup_rls_policies.sql
6. 006_seed_system_models.sql
```

### 2. Verify Deployment
```sql
-- Should return 6
SELECT COUNT(*) FROM ai_models_system;

-- Should return 3
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_name IN ('ai_models_system', 'org_system_model_config', 'ai_model_usage');

-- Should show multiple policies
SELECT COUNT(*) FROM pg_policies;
```

### 3. Replace API Keys
```sql
UPDATE ai_models_system 
SET api_key = 'actual_api_key_here' 
WHERE api_key = 'PLACEHOLDER_API_KEY';
```

### 4. Set Org Plans
```sql
-- Example: Set an org to 'pro' plan
UPDATE organizations 
SET pricing_plan = 'pro',
    token_quota_monthly = 100000
WHERE id = 'your-org-id';
```

## 🔍 Common Queries

### Admin: View Available Models
```sql
SELECT m.name, m.role, m.required_plan, m.token_limit_amount
FROM ai_models_system m
WHERE m.is_active = true
  AND (m.organization_types = '{}' 
       OR 'your-org-type' = ANY(m.organization_types))
ORDER BY m.sort_order;
```

### Admin: Enable Model for Users
```sql
INSERT INTO org_system_model_config (
  organization_id, 
  system_model_id, 
  is_enabled_for_users
) VALUES (
  'your-org-id',
  123, -- model id
  true
);
```

### User: Check Own Usage
```sql
SELECT 
  model_name,
  SUM(tokens_used) as total_tokens,
  COUNT(*) as requests
FROM ai_model_usage
WHERE user_id = auth.uid()
  AND period_type = 'monthly'
  AND period_end > NOW()
GROUP BY model_name;
```

### Admin: View Org Usage
```sql
SELECT 
  u.model_name,
  COUNT(DISTINCT u.user_id) as active_users,
  SUM(u.tokens_used) as total_tokens
FROM ai_model_usage u
WHERE u.organization_id = 'your-org-id'
  AND u.period_start >= DATE_TRUNC('month', NOW())
GROUP BY u.model_name
ORDER BY total_tokens DESC;
```

## ⚠️ Before Production

- [ ] Replace all `PLACEHOLDER_API_KEY` values
- [ ] Adjust token limits based on costs
- [ ] Test RLS policies thoroughly
- [ ] Verify auth.jwt() claims match policies
- [ ] Set up monitoring for usage tracking
- [ ] Test quota enforcement logic
- [ ] Prepare rollback plan

## 🆘 Troubleshooting

**Issue**: Admin can't see models  
**Fix**: Check org type matches model's `organization_types`

**Issue**: User can't see models  
**Fix**: Admin must enable via `org_system_model_config`

**Issue**: RLS denies access  
**Fix**: Verify `auth.jwt()` contains `role` and `organization_id`

**Issue**: Can't update usage  
**Fix**: Usage records are insert-only (by design)

## 📞 Support

- Architecture: `SYSTEM_AI_MODELS_ARCHITECTURE.md`
- Full Plan: `SYSTEM_AI_MODELS_FOUNDATION_PLAN.md`
- Phase 1: `SYSTEM_AI_MODELS_PHASE1_COMPLETE.md`
- Migration Guide: `database/migrations/README.md`

---

**Status**: Phase 1 Complete ✅ | Ready for Phase 2 🚀
