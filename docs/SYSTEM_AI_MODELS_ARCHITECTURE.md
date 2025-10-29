# System AI Models Architecture
## Multi-Tenant SaaS with Tiered Access Control & Cross-Tenant Superadmin

**Document Version:** 2.0  
**Date:** October 29, 2025  
**Status:** ✅ Database Foundation Implemented

---

## 🎯 Vision & Overview

Build an enterprise-level multi-tenant SaaS platform where:
- **Superadmin** creates system-wide AI model templates with **cross-tenant access**
- **Superadmins have admin privileges to ALL organizations**, regardless of their home tenant
- **Models are targeted** by business vertical and pricing plan
- **Token/usage limits** are enforced per tenant and user
- **Admins control** which system models their users can access (within their own organization)
- **Users receive** curated AI models based on their organization's context

---

## 🔐 Three-Tier Role Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│                         SUPERADMIN                               │
│  • System-wide access to ALL organizations                      │
│  • Can view/edit any tenant's data                              │
│  • Manages ai_models_system table (global templates)            │
│  • Cross-tenant admin privileges                                │
│  • Belongs to an organization but not limited by it             │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                     ADMIN (Organization-Level)                   │
│  • Admin access limited to THEIR organization only               │
│  • Manages org_system_model_config (enable/disable models)      │
│  • Cannot access other organizations                             │
│  • Cannot promote users to superadmin                            │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      USER (Basic Access)                         │
│  • Access features enabled by their admin                        │
│  • Use AI models configured for users in their org              │
│  • Cannot access admin interfaces                                │
└─────────────────────────────────────────────────────────────────┘
```

**Key Innovation**: Superadmin can act as admin for ANY organization, enabling:
- System-wide monitoring and support
- Emergency access to any tenant
- Cross-organization analytics
- Centralized troubleshooting

See: `/docs/SUPERADMIN_CROSS_TENANT_ACCESS.md` for implementation details

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    SUPERADMIN CONTROL PANEL                      │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Cross-Tenant Capabilities:                                  │ │
│  │ • Switch between ANY organization                           │ │
│  │ • View/edit data across all tenants                         │ │
│  │ • System-wide analytics dashboard                           │ │
│  │                                                             │ │
│  │ System AI Models Management:                                │ │
│  │ • Create role-based model templates                         │ │
│  │ • Define business-vertical-specific models                  │ │
│  │   (e-commerce, healthcare, education, etc.)                 │ │
│  │ • Set token limits per model per period                     │ │
│  │ • Configure pricing plan requirements                       │ │
│  │ • Enable/disable models per tenant type                     │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              TENANT (Organization) - Based on Plan               │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Tenant Attributes:                                          │ │
│  │ • business_type: 'e-commerce' | 'healthcare' | 'education' │ │
│  │ • pricing_plan: 'free' | 'starter' | 'pro' | 'enterprise' │ │
│  │ • token_limits: per_month/per_user quotas                  │ │
│  │                                                             │ │
│  │ Available System Models:                                    │ │
│  │ ✅ Filtered by business_type                               │ │
│  │ ✅ Filtered by pricing_plan                                │ │
│  │ ✅ Token limits enforced                                   │ │
│  │ ✅ Accessible by superadmin from any tenant                │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    ADMIN (Org Administrator)                     │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ System Tab (NEW):                                           │ │
│  │ • Views system models available to their org               │ │
│  │ • Can enable/disable for their users                       │ │
│  │ • Can set user-level token limits                          │ │
│  │ • Cannot edit/delete system models                         │ │
│  │                                                             │ │
│  │ Models Tab:                                                 │ │
│  │ • Create custom org models                                 │ │
│  │ • Full CRUD on org models                                  │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                         USER (End User)                          │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Default Tab:                                                │ │
│  │ • Active system models (enabled by admin)                  │ │
│  │ • Token usage tracking                                     │ │
│  │ • Quota warnings                                           │ │
│  │                                                             │ │
│  │ My Models Tab:                                              │ │
│  │ • Personal models (within limits)                          │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Database Schema

### **ai_models_system** (Superadmin managed)
System-wide AI model templates created and managed by superadmin.

```sql
CREATE TABLE ai_models_system (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  task JSONB,
  system_message TEXT,
  api_key TEXT,
  endpoint TEXT,
  max_tokens INTEGER,
  icon TEXT,
  
  -- Business vertical targeting
  business_types TEXT[] DEFAULT '{}', 
  -- ['e-commerce', 'healthcare', 'education', 'finance', 'legal', 'real-estate']
  -- Empty array = available to all business types
  
  -- Pricing plan requirements
  required_plan TEXT DEFAULT 'free', 
  -- 'free' | 'starter' | 'pro' | 'enterprise'
  -- Model only available to orgs with this plan or higher
  
  -- Token/Usage limits
  token_limit_period TEXT, -- 'daily' | 'weekly' | 'monthly' | null (unlimited)
  token_limit_amount INTEGER, -- null = unlimited
  
  -- Features
  is_free BOOLEAN DEFAULT false, -- Free model (no token counting)
  is_trial BOOLEAN DEFAULT false, -- Trial model
  trial_expires_days INTEGER, -- null = no expiration
  
  -- Status
  is_active BOOLEAN DEFAULT true, -- System-wide active status
  is_featured BOOLEAN DEFAULT false, -- Show in featured section
  
  -- Metadata
  description TEXT,
  tags TEXT[], -- For categorization/search
  sort_order INTEGER DEFAULT 0, -- Display order
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_ai_models_system_active ON ai_models_system(is_active);
CREATE INDEX idx_ai_models_system_business_types ON ai_models_system USING GIN(business_types);
CREATE INDEX idx_ai_models_system_required_plan ON ai_models_system(required_plan);
CREATE INDEX idx_ai_models_system_featured ON ai_models_system(is_featured) WHERE is_featured = true;
```

### **organizations** (Enhanced)
Organization/tenant configuration with business context and limits.

```sql
-- Assuming organizations table exists, add these columns:
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS business_type TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS pricing_plan TEXT DEFAULT 'free';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS token_quota_monthly INTEGER;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS token_usage_current INTEGER DEFAULT 0;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS token_reset_date TIMESTAMPTZ;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS can_create_custom_models BOOLEAN DEFAULT true;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS max_custom_models INTEGER DEFAULT 10;

-- Indexes
CREATE INDEX idx_organizations_business_type ON organizations(business_type);
CREATE INDEX idx_organizations_pricing_plan ON organizations(pricing_plan);
```

### **org_system_model_config** (Admin control)
Admin configuration for system models within their organization.

```sql
CREATE TABLE org_system_model_config (
  id BIGSERIAL PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  system_model_id BIGINT NOT NULL REFERENCES ai_models_system(id) ON DELETE CASCADE,
  
  -- Admin controls
  is_enabled_for_users BOOLEAN DEFAULT true, -- Admin can hide from users
  
  -- Per-user limits (overrides system defaults)
  token_limit_per_user INTEGER, -- null = use system default
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(organization_id, system_model_id)
);

-- Indexes
CREATE INDEX idx_org_system_model_config_org ON org_system_model_config(organization_id);
CREATE INDEX idx_org_system_model_config_model ON org_system_model_config(system_model_id);
CREATE INDEX idx_org_system_model_config_enabled ON org_system_model_config(is_enabled_for_users) 
  WHERE is_enabled_for_users = true;
```

### **ai_model_usage** (Usage tracking)
Track token usage per user per model for quota enforcement.

```sql
CREATE TABLE ai_model_usage (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Model reference (polymorphic)
  model_id BIGINT NOT NULL,
  model_type TEXT NOT NULL, -- 'system' | 'org_default' | 'user'
  model_name TEXT, -- Denormalized for reporting
  
  -- Usage metrics
  tokens_used INTEGER NOT NULL,
  requests_count INTEGER DEFAULT 1,
  
  -- Time period
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  period_type TEXT NOT NULL, -- 'daily' | 'weekly' | 'monthly'
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_ai_model_usage_user ON ai_model_usage(user_id, period_start);
CREATE INDEX idx_ai_model_usage_org ON ai_model_usage(organization_id, period_start);
CREATE INDEX idx_ai_model_usage_model ON ai_model_usage(model_id, model_type);
CREATE INDEX idx_ai_model_usage_period ON ai_model_usage(period_start, period_end);
```

---

## 🔒 Row-Level Security (RLS) Policies

### **ai_models_system**
```sql
-- Enable RLS
ALTER TABLE ai_models_system ENABLE ROW LEVEL SECURITY;

-- Superadmin: Full access
CREATE POLICY "Superadmin full access" ON ai_models_system
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'superadmin');

-- Admin: Read only, filtered by org's business_type and plan
CREATE POLICY "Admin read filtered models" ON ai_models_system
  FOR SELECT
  TO authenticated
  USING (
    is_active = true
    AND (
      business_types = '{}' 
      OR EXISTS (
        SELECT 1 FROM organizations 
        WHERE id = (auth.jwt() ->> 'organization_id')::uuid
        AND business_type = ANY(ai_models_system.business_types)
      )
    )
  );

-- User: Read only, filtered by org + admin enabled
CREATE POLICY "User read enabled models" ON ai_models_system
  FOR SELECT
  TO authenticated
  USING (
    is_active = true
    AND EXISTS (
      SELECT 1 FROM org_system_model_config
      WHERE system_model_id = ai_models_system.id
      AND organization_id = (auth.jwt() ->> 'organization_id')::uuid
      AND is_enabled_for_users = true
    )
  );
```

### **org_system_model_config**
```sql
-- Enable RLS
ALTER TABLE org_system_model_config ENABLE ROW LEVEL SECURITY;

-- Admin: Full access for their org
CREATE POLICY "Admin manage org config" ON org_system_model_config
  FOR ALL
  TO authenticated
  USING (organization_id = (auth.jwt() ->> 'organization_id')::uuid)
  WITH CHECK (organization_id = (auth.jwt() ->> 'organization_id')::uuid);

-- User: Read only for their org
CREATE POLICY "User read org config" ON org_system_model_config
  FOR SELECT
  TO authenticated
  USING (organization_id = (auth.jwt() ->> 'organization_id')::uuid);
```

### **ai_model_usage**
```sql
-- Enable RLS
ALTER TABLE ai_model_usage ENABLE ROW LEVEL SECURITY;

-- User: Read own usage
CREATE POLICY "User read own usage" ON ai_model_usage
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Admin: Read org usage
CREATE POLICY "Admin read org usage" ON ai_model_usage
  FOR SELECT
  TO authenticated
  USING (organization_id = (auth.jwt() ->> 'organization_id')::uuid);

-- System: Insert usage (service role)
CREATE POLICY "System insert usage" ON ai_model_usage
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
```

---

## 🎛️ Filtering Logic

### **System Models Available to Tenant**
```typescript
async function getAvailableSystemModels(organizationId: string) {
  const org = await getOrganization(organizationId);
  
  return supabase
    .from('ai_models_system')
    .select('*')
    .eq('is_active', true)
    .or(`business_types.cs.{${org.business_type}},business_types.eq.{}`)
    .lte('required_plan', getPlanLevel(org.pricing_plan))
    .order('sort_order', { ascending: true });
}

// Plan hierarchy
function getPlanLevel(plan: string): number {
  const levels = { free: 0, starter: 1, pro: 2, enterprise: 3 };
  return levels[plan] || 0;
}
```

### **Admin View: Enabled System Models**
```typescript
async function getAdminSystemModels(organizationId: string) {
  return supabase
    .from('ai_models_system')
    .select(`
      *,
      org_system_model_config!inner(
        is_enabled_for_users,
        token_limit_per_user
      )
    `)
    .eq('org_system_model_config.organization_id', organizationId);
}
```

### **User View: Active System Models**
```typescript
async function getUserSystemModels(organizationId: string) {
  return supabase
    .from('ai_models_system')
    .select('*')
    .eq('is_active', true)
    .eq('org_system_model_config.organization_id', organizationId)
    .eq('org_system_model_config.is_enabled_for_users', true);
}
```

---

## 🚀 Tab Structure

### **Admin Interface**
```
/admin/ai/management
  ├── Models Tab (existing)
  │   └── Org-specific models (full CRUD)
  │
  └── System Tab (NEW)
      └── System models (view + enable/disable + set limits)
```

### **User Interface**
```
/account/ai
  ├── My Models Tab (existing)
  │   └── User's personal models (full CRUD within limits)
  │
  └── Templates Tab (NEW)
      ├── System Models (enabled by admin)
      └── Org Models (created by admin)
```

### **Superadmin Portal** (NEW)
```
/superadmin
  ├── /system-models
  │   ├── List all system models
  │   ├── Create new system model
  │   ├── Edit system model
  │   └── Delete system model
  │
  ├── /tenants
  │   ├── List all organizations
  │   ├── View tenant details
  │   ├── Override tenant settings
  │   └── Monitor usage
  │
  ├── /analytics
  │   ├── Token usage across platform
  │   ├── Model popularity
  │   ├── Cost analysis
  │   └── Tenant activity
  │
  └── /settings
      ├── Business types management
      ├── Pricing plans configuration
      └── System defaults
```

---

## 🔑 Key Features

### **For Superadmin:**
- ✅ Create system-wide AI model templates
- ✅ Target models by business vertical
- ✅ Set pricing plan requirements
- ✅ Configure token limits (daily/weekly/monthly)
- ✅ Enable trial models with expiration
- ✅ Mark models as free (no token counting)
- ✅ Feature models for promotion
- ✅ Monitor usage across all tenants

### **For Admin:**
- ✅ View system models relevant to their business
- ✅ Enable/disable system models for their users
- ✅ Set per-user token limits (override defaults)
- ✅ Monitor org-wide token usage
- ✅ Create custom org-specific models
- ✅ Cannot modify system models themselves

### **For Users:**
- ✅ Access curated system models (admin-enabled)
- ✅ See token usage and quota status
- ✅ Get warnings when approaching limits
- ✅ Create personal models (within org limits)
- ✅ Use org-provided models

---

## 📈 Token Limit Enforcement

### **Hierarchy:**
```
System Model Default Limit
    ↓
Admin Override (per-user limit)
    ↓
Org-wide Monthly Quota
    ↓
User Request
```

### **Enforcement Logic:**
```typescript
async function canUserUseModel(
  userId: string,
  modelId: number,
  tokensRequested: number
): Promise<{ allowed: boolean; reason?: string }> {
  
  // 1. Check if model is free
  const model = await getSystemModel(modelId);
  if (model.is_free) return { allowed: true };
  
  // 2. Get user's org
  const org = await getUserOrganization(userId);
  
  // 3. Check org-wide monthly quota
  if (org.token_quota_monthly) {
    if (org.token_usage_current + tokensRequested > org.token_quota_monthly) {
      return { allowed: false, reason: 'Organization monthly quota exceeded' };
    }
  }
  
  // 4. Check per-user limit for this model
  const config = await getOrgModelConfig(org.id, modelId);
  const userLimit = config.token_limit_per_user || model.token_limit_amount;
  
  if (userLimit) {
    const usage = await getUserUsage(userId, modelId, model.token_limit_period);
    if (usage.tokens_used + tokensRequested > userLimit) {
      return { allowed: false, reason: `${model.token_limit_period} limit exceeded` };
    }
  }
  
  return { allowed: true };
}
```

---

## 🎨 UI/UX Considerations

### **System Model Card (Admin View)**
```
┌─────────────────────────────────────┐
│  [Icon] Blog Content Writer         │
│  Role: blog_content_writer          │
│  ────────────────────────────────   │
│  📊 Limit: 10K tokens/month         │
│  🏢 Plan: Pro+                      │
│  📋 Tasks: 5 predefined             │
│  ────────────────────────────────   │
│  [✓ Enabled for Users]              │
│  [⚙️ Set User Limit]                │
│  [📈 View Usage]                    │
└─────────────────────────────────────┘
```

### **System Model Card (User View)**
```
┌─────────────────────────────────────┐
│  [Icon] Blog Content Writer         │
│  Role: blog_content_writer          │
│  ────────────────────────────────   │
│  📊 Used: 2.5K / 10K tokens         │
│  ⏰ Resets: 15 days                 │
│  📋 Tasks: 5 available              │
│  ────────────────────────────────   │
│  [Use Model →]                      │
└─────────────────────────────────────┘
```

---

## ⚠️ Important Considerations

### **Security:**
- Superadmin role must be strictly controlled
- API keys in system models should be encrypted
- Usage tracking should be tamper-proof
- RLS policies must be thorough

### **Performance:**
- Cache system models (infrequently change)
- Index heavily on filtering columns
- Consider materialized views for usage stats
- Denormalize for reporting queries

### **Scalability:**
- Usage tracking can grow large (partition by date)
- Consider separate analytics database
- Implement background jobs for quota resets
- Use Redis for real-time quota checking

### **Business Logic:**
- Plan upgrade paths (what happens to limits?)
- Trial expiration handling
- Token quota reset schedules
- Model deprecation strategy

---

## 📝 Migration Path

### **From Current System:**
```
ai_models_default (existing)
    ↓
Keep for backward compatibility as "org models"
    ↓
New: ai_models_system (system-wide templates)
    ↓
Admin can choose: use system model OR create custom org model
```

### **Data Model Relationships:**
```
ai_models_system (1) ←→ (N) org_system_model_config
org_system_model_config (N) → (1) organizations
ai_models_default (N) → (1) organizations [existing org models]
ai_models (N) → (1) users [existing user models]
```

---

## 🎯 Success Metrics

- **For Platform:** Number of system models created and used
- **For Tenants:** Token usage efficiency, model adoption rate
- **For Users:** Time-to-first-use, model satisfaction
- **For Business:** Revenue from plan upgrades, cost per token

---

## 📚 Related Documentation

- [AI Management Implementation Summary](./IMPLEMENTATION_SUMMARY.md)
- [Meetings Architecture](./MEETINGS_ARCHITECTURE.md)
- [Orders System Implementation](./ORDERS_SYSTEM_IMPLEMENTATION.md)

---

**Next Steps:** See [SYSTEM_AI_MODELS_FOUNDATION_PLAN.md](./SYSTEM_AI_MODELS_FOUNDATION_PLAN.md)
