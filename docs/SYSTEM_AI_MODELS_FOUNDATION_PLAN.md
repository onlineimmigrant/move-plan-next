# System AI Models - Foundation Building Plan
## Phased Implementation Roadmap

**Document Version:** 1.0  
**Date:** October 29, 2025  
**Estimated Timeline:** 6-8 weeks  
**Status:** Ready to Start

---

## 🎯 Goals

Build the foundation for a multi-tenant AI model management system with:
1. System-wide model templates (superadmin-managed)
2. Business-type and pricing-plan-based filtering
3. Token usage tracking and enforcement
4. Admin controls for enabling/disabling models
5. User access to curated, quota-limited models

---

## 📋 Phase 1: Database Foundation (Week 1)

### **Objectives:**
- Create new database tables
- Set up proper indexes
- Implement RLS policies
- Test data isolation

### **Tasks:**

#### 1.1 Create Migration Files
**Location:** `/database/migrations/`

**Files to create:**
```
001_create_ai_models_system.sql
002_enhance_organizations_table.sql
003_create_org_system_model_config.sql
004_create_ai_model_usage.sql
005_create_indexes.sql
006_setup_rls_policies.sql
```

**Priority:** 🔴 Critical

#### 1.2 Create `ai_models_system` Table
```sql
-- See SYSTEM_AI_MODELS_ARCHITECTURE.md for full schema
-- Key features:
-- - business_types array for targeting
-- - required_plan for plan gating
-- - token limits (period + amount)
-- - is_free, is_trial flags
-- - is_active, is_featured status
```

**Acceptance Criteria:**
- ✅ Table created with all columns
- ✅ Constraints and defaults applied
- ✅ Can insert sample system models
- ✅ Indexes created for performance

#### 1.3 Enhance `organizations` Table
```sql
ALTER TABLE organizations ADD COLUMN:
- business_type TEXT
- pricing_plan TEXT DEFAULT 'free'
- token_quota_monthly INTEGER
- token_usage_current INTEGER DEFAULT 0
- token_reset_date TIMESTAMPTZ
- can_create_custom_models BOOLEAN DEFAULT true
- max_custom_models INTEGER DEFAULT 10
```

**Acceptance Criteria:**
- ✅ Existing orgs unaffected (backward compatible)
- ✅ New columns have sensible defaults
- ✅ Indexes created

#### 1.4 Create `org_system_model_config` Table
```sql
-- Junction table for admin control
-- Links: organization + system_model
-- Stores: is_enabled_for_users, token_limit_per_user
```

**Acceptance Criteria:**
- ✅ Foreign keys properly constrained
- ✅ Unique constraint on (org_id, model_id)
- ✅ Cascade delete when org or model deleted

#### 1.5 Create `ai_model_usage` Table
```sql
-- Usage tracking for quota enforcement
-- Tracks: tokens_used, requests_count
-- Per: user, model, time period
```

**Acceptance Criteria:**
- ✅ Efficient indexes for querying
- ✅ Can aggregate usage by period
- ✅ Supports multiple period types

#### 1.6 Implement RLS Policies
```sql
-- ai_models_system: superadmin full, admin/user filtered
-- org_system_model_config: admin CRUD, user read
-- ai_model_usage: user own, admin org, system insert
```

**Acceptance Criteria:**
- ✅ Superadmin can access all system models
- ✅ Admin can only see models for their business type
- ✅ Users can only see admin-enabled models
- ✅ Usage data properly isolated

#### 1.7 Seed Initial Data
```sql
-- Create sample business types
-- Create sample system models
-- Create test organizations with different plans
```

**Acceptance Criteria:**
- ✅ 3-5 sample system models created
- ✅ Multiple business types represented
- ✅ Different pricing plans covered
- ✅ Can test filtering logic

**Deliverables:**
- [ ] Migration scripts (6 files)
- [ ] Seed data script
- [ ] RLS policy tests
- [ ] Database schema documentation

**Estimated Time:** 5 days

---

## 📋 Phase 2: Type Definitions & Core Logic (Week 2)

### **Objectives:**
- Define TypeScript types
- Create utility functions
- Implement filtering logic
- Set up API endpoints

### **Tasks:**

#### 2.1 Create Type Definitions
**Location:** `/src/types/systemModels.ts`

```typescript
export interface SystemModel {
  id: number;
  name: string;
  role: string;
  task: TaskItem[] | null;
  system_message: string;
  api_key: string;
  endpoint: string;
  max_tokens: number;
  icon: string | null;
  business_types: string[];
  required_plan: 'free' | 'starter' | 'pro' | 'enterprise';
  token_limit_period: 'daily' | 'weekly' | 'monthly' | null;
  token_limit_amount: number | null;
  is_free: boolean;
  is_trial: boolean;
  trial_expires_days: number | null;
  is_active: boolean;
  is_featured: boolean;
  description: string | null;
  tags: string[];
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface OrgSystemModelConfig {
  id: number;
  organization_id: string;
  system_model_id: number;
  is_enabled_for_users: boolean;
  token_limit_per_user: number | null;
  created_at: string;
  updated_at: string;
}

export interface ModelUsage {
  id: number;
  user_id: string;
  organization_id: string;
  model_id: number;
  model_type: 'system' | 'org_default' | 'user';
  model_name: string;
  tokens_used: number;
  requests_count: number;
  period_start: string;
  period_end: string;
  period_type: 'daily' | 'weekly' | 'monthly';
  created_at: string;
}

export interface OrganizationEnhanced {
  id: string;
  name: string;
  business_type: string;
  pricing_plan: 'free' | 'starter' | 'pro' | 'enterprise';
  token_quota_monthly: number | null;
  token_usage_current: number;
  token_reset_date: string;
  can_create_custom_models: boolean;
  max_custom_models: number;
}

export interface TokenQuotaCheck {
  allowed: boolean;
  reason?: string;
  current_usage?: number;
  limit?: number;
  resets_at?: string;
}
```

**Deliverables:**
- [ ] Type definitions file
- [ ] Validation schemas (Zod)
- [ ] Type documentation

#### 2.2 Create Utility Functions
**Location:** `/src/lib/systemModels/`

```typescript
// utils.ts
export function getPlanLevel(plan: string): number;
export function canAccessModel(userPlan: string, requiredPlan: string): boolean;
export function matchesBusinessType(modelTypes: string[], orgType: string): boolean;

// filtering.ts
export async function getAvailableSystemModels(organizationId: string);
export async function getEnabledSystemModelsForUser(organizationId: string);
export async function getSystemModelsForAdmin(organizationId: string);

// quotas.ts
export async function checkTokenQuota(userId: string, modelId: number, tokens: number);
export async function recordUsage(userId: string, modelId: number, tokens: number);
export async function getUserUsage(userId: string, modelId: number, period: string);
export async function resetMonthlyQuotas();

// config.ts
export async function enableModelForOrg(orgId: string, modelId: number);
export async function disableModelForOrg(orgId: string, modelId: number);
export async function setUserTokenLimit(orgId: string, modelId: number, limit: number);
```

**Deliverables:**
- [ ] Utility functions library
- [ ] Unit tests for each function
- [ ] JSDoc documentation

#### 2.3 Create API Routes
**Location:** `/src/app/api/system-models/`

```
/api/system-models
  GET  / (list with filters)
  GET  /:id (single model)
  POST / (superadmin only)
  PUT  /:id (superadmin only)
  DELETE /:id (superadmin only)

/api/system-models/:id/enable (admin)
  POST / (enable for org)

/api/system-models/:id/disable (admin)
  POST / (disable for org)

/api/system-models/:id/set-limit (admin)
  POST / (set user token limit)

/api/system-models/:id/usage (user/admin)
  GET / (get usage stats)
```

**Deliverables:**
- [ ] API route handlers
- [ ] Middleware for auth checks
- [ ] Error handling
- [ ] API tests

#### 2.4 Create Supabase Service Functions
**Location:** `/src/lib/supabase/systemModels.ts`

```typescript
export const systemModelsService = {
  // Superadmin operations
  createSystemModel(data: CreateSystemModelInput),
  updateSystemModel(id: number, data: UpdateSystemModelInput),
  deleteSystemModel(id: number),
  listAllSystemModels(filters?: SystemModelFilters),
  
  // Admin operations
  getAvailableModels(organizationId: string),
  enableForUsers(orgId: string, modelId: number),
  disableForUsers(orgId: string, modelId: number),
  setUserLimit(orgId: string, modelId: number, limit: number),
  getOrgConfig(orgId: string, modelId: number),
  
  // User operations
  getEnabledModels(organizationId: string),
  checkAccess(userId: string, modelId: number),
  
  // Usage tracking
  recordUsage(userId: string, modelId: number, tokens: number),
  getUserUsage(userId: string, modelId: number, period: string),
  getOrgUsage(organizationId: string, period: string),
};
```

**Deliverables:**
- [ ] Supabase service layer
- [ ] Integration tests
- [ ] Service documentation

**Estimated Time:** 6-7 days

---

## 📋 Phase 3: Superadmin Portal - Core (Week 3)

### **Objectives:**
- Create superadmin authentication
- Build system model CRUD interface
- Implement model configuration UI
- Add validation and error handling

### **Tasks:**

#### 3.1 Superadmin Authentication
**Location:** `/src/app/[locale]/superadmin/`

```typescript
// Middleware to check superadmin role
// Redirect unauthorized users
// Separate layout from tenant pages
```

**Acceptance Criteria:**
- ✅ Only users with `role: 'superadmin'` can access
- ✅ Session validation on each request
- ✅ Proper redirect for unauthorized access

#### 3.2 Create Superadmin Layout
**Location:** `/src/app/[locale]/superadmin/layout.tsx`

```tsx
// Separate nav from tenant interface
// Links: System Models, Tenants, Analytics, Settings
// Breadcrumb navigation
// User info with logout
```

#### 3.3 System Models List Page
**Location:** `/src/app/[locale]/superadmin/system-models/page.tsx`

**Features:**
- Table view of all system models
- Filters: business type, pricing plan, active status
- Search by name, role, tags
- Sort by: name, created date, sort_order
- Quick actions: activate/deactivate, feature/unfeature
- "Create New Model" button

**Deliverables:**
- [ ] List page component
- [ ] Filter bar component
- [ ] Model table component
- [ ] Quick action buttons

#### 3.4 Create System Model Form
**Location:** `/src/app/[locale]/superadmin/system-models/create/page.tsx`

**Form Fields:**
- Basic: name, role, description, icon
- API: api_key, endpoint, max_tokens
- System: system_message
- Tasks: predefined tasks (JSON builder)
- Targeting: business_types (multi-select), required_plan (select)
- Limits: token_limit_period, token_limit_amount
- Features: is_free, is_trial, trial_expires_days, is_featured
- Metadata: tags, sort_order

**Validation:**
- Required fields
- Valid JSON for tasks
- Positive numbers for limits
- Valid plan hierarchy

**Deliverables:**
- [ ] Create form component
- [ ] Form validation logic
- [ ] Success/error handling
- [ ] Draft saving (optional)

#### 3.5 Edit System Model Page
**Location:** `/src/app/[locale]/superadmin/system-models/[id]/edit/page.tsx`

**Features:**
- Pre-populated form
- Change tracking
- Confirm before saving
- Preview changes
- Rollback option (future)

#### 3.6 System Model Detail/Preview
**Location:** `/src/app/[locale]/superadmin/system-models/[id]/page.tsx`

**Features:**
- View all model details
- Preview how it appears to different roles
- See which orgs have enabled it
- Usage statistics across platform
- Edit/Delete actions

**Deliverables:**
- [ ] Detail view component
- [ ] Stats dashboard
- [ ] Tenant list (using this model)

**Estimated Time:** 7 days

---

## 📋 Phase 4: Admin Interface Updates (Week 4)

### **Objectives:**
- Add "System" tab to admin page
- Show available system models
- Implement enable/disable toggle
- Add user token limit configuration

### **Tasks:**

#### 4.1 Add "System" Tab to Admin
**Location:** `/src/app/[locale]/admin/ai/management/page.tsx`

**Update tab structure:**
```tsx
const tabs = [
  { id: 'models', label: 'Models' },      // Existing
  { id: 'system', label: 'System' },      // NEW
  { id: 'add', label: 'Add Model' }       // Existing
];
```

#### 4.2 Create System Models Tab Component
**Location:** `/src/components/ai/admin/SystemModelsTab.tsx`

**Features:**
- Grid view of available system models
- Filter by business type, plan level
- Search functionality
- Shows: model details, limits, current status

**Card Layout:**
```
┌────────────────────────────────────────┐
│  [Icon] Blog Content Writer            │
│  ────────────────────────────────────  │
│  📝 Role: blog_content_writer          │
│  📊 Limit: 10K tokens/month            │
│  🏢 Plan Required: Pro                 │
│  📋 Tasks: 5 predefined                │
│  🏷️ Tags: blog, content, writing       │
│  ────────────────────────────────────  │
│  [✓ Enabled for Users]                 │
│  [⚙️ Configure Limits]  [📈 View Usage]│
└────────────────────────────────────────┘
```

#### 4.3 Enable/Disable Toggle
**Functionality:**
- Toggle switch on each model card
- Confirms before disabling (if users currently using)
- Updates `org_system_model_config` table
- Shows toast notification on success/error

#### 4.4 Configure User Limits Modal
**Modal Features:**
- Opens when clicking "Configure Limits"
- Shows system default limit
- Input for custom per-user limit
- Option to "Use System Default"
- Save/Cancel buttons

**Validation:**
- Cannot exceed org monthly quota
- Must be positive number
- Shows impact estimate (users affected)

#### 4.5 Usage Statistics View
**Features:**
- Modal or expandable section
- Shows: total tokens used, requests count, active users
- Period selector: last 7 days, last 30 days, all time
- Chart: usage over time
- Top users by usage

**Deliverables:**
- [ ] System tab component
- [ ] Model card component
- [ ] Toggle functionality
- [ ] Limits configuration modal
- [ ] Usage stats view

**Estimated Time:** 6 days

---

## 📋 Phase 5: User Interface Updates (Week 5)

### **Objectives:**
- Add "Templates" tab to user page
- Show enabled system models
- Display token usage and limits
- Implement quota warnings

### **Tasks:**

#### 5.1 Add "Templates" Tab to User
**Location:** `/src/app/[locale]/account/ai/page.tsx`

**Update tab structure:**
```tsx
const tabs = [
  { id: 'my-models', label: 'My Models' },    // Renamed from 'models'
  { id: 'templates', label: 'Templates' },    // NEW
  { id: 'add', label: 'Add Model' }           // Existing
];
```

#### 5.2 Create Templates Tab Component
**Location:** `/src/components/ai/account/TemplatesTab.tsx`

**Features:**
- Shows system models + org models
- Visual distinction between system and org
- Read-only cards (no edit/delete)
- Token usage indicators
- "Use Model" button

**Card Layout:**
```
┌────────────────────────────────────────┐
│  [Icon] Blog Content Writer     [SYSTEM]│
│  ────────────────────────────────────  │
│  📝 Role: blog_content_writer          │
│  📋 Tasks: 5 available                 │
│  ────────────────────────────────────  │
│  📊 Used: 2,500 / 10,000 tokens        │
│  ⏰ Resets in 15 days                  │
│  ████████░░░░░░ 25%                    │
│  ────────────────────────────────────  │
│  [Use Model →]                         │
└────────────────────────────────────────┘
```

#### 5.3 Token Usage Display
**Features:**
- Progress bar showing usage vs limit
- Color coding: green (0-50%), yellow (50-80%), red (80-100%)
- Countdown to reset
- Tooltip with detailed breakdown

#### 5.4 Quota Warning System
**Triggers:**
- At 80%: Yellow badge + warning message
- At 90%: Orange badge + stronger warning
- At 100%: Red badge + "Limit Reached"

**Warning Messages:**
```
⚠️ 80%: "Approaching token limit (8K/10K used)"
🚨 90%: "Almost at limit! (9K/10K used)"
🔒 100%: "Monthly limit reached. Resets in X days."
```

#### 5.5 Model Preview/Details
**Modal Features:**
- Full model information
- All available tasks
- Token limit details
- Usage history (last 30 days)
- "Start Using" button

**Deliverables:**
- [ ] Templates tab component
- [ ] System model card component
- [ ] Usage indicator component
- [ ] Quota warning system
- [ ] Model preview modal

**Estimated Time:** 5 days

---

## 📋 Phase 6: Usage Tracking & Enforcement (Week 6)

### **Objectives:**
- Implement token counting
- Create usage recording system
- Build quota enforcement logic
- Set up automated resets

### **Tasks:**

#### 6.1 Token Counting Middleware
**Location:** `/src/middleware/tokenCounter.ts`

**Functionality:**
- Intercepts AI model API calls
- Counts tokens in request/response
- Records to `ai_model_usage` table
- Updates org token counter

#### 6.2 Usage Recording Service
**Location:** `/src/lib/services/usageTracking.ts`

```typescript
export async function recordUsage(params: {
  userId: string;
  organizationId: string;
  modelId: number;
  modelType: 'system' | 'org_default' | 'user';
  tokensUsed: number;
  periodType: 'daily' | 'weekly' | 'monthly';
}): Promise<void>;

export async function getUserPeriodUsage(
  userId: string,
  modelId: number,
  periodType: string
): Promise<number>;

export async function getOrgPeriodUsage(
  organizationId: string,
  periodType: string
): Promise<number>;
```

#### 6.3 Quota Check Function
**Location:** `/src/lib/services/quotaEnforcement.ts`

```typescript
export async function checkQuotaBeforeUse(
  userId: string,
  modelId: number,
  tokensRequested: number
): Promise<TokenQuotaCheck>;
```

**Check Order:**
1. Is model free? → Allow
2. Org monthly quota exceeded? → Deny
3. User model limit exceeded? → Deny
4. All checks pass → Allow

#### 6.4 Automated Quota Reset Job
**Location:** `/src/jobs/resetQuotas.ts`

**Cron Jobs:**
- Daily reset: runs at 00:00 UTC
- Weekly reset: runs Monday 00:00 UTC
- Monthly reset: runs 1st of month 00:00 UTC

**Actions:**
- Archive old usage data
- Reset period counters
- Update org `token_reset_date`
- Send notification emails (optional)

#### 6.5 Usage Analytics Dashboard
**Location:** `/src/app/[locale]/admin/ai/usage/page.tsx`

**Features:**
- Org-wide usage overview
- Per-model breakdown
- Per-user breakdown
- Cost estimates
- Export to CSV

**Charts:**
- Usage over time (line chart)
- Top models by usage (bar chart)
- Top users by usage (table)
- Cost breakdown by model (pie chart)

**Deliverables:**
- [ ] Token counting middleware
- [ ] Usage recording service
- [ ] Quota enforcement logic
- [ ] Automated reset jobs
- [ ] Usage analytics dashboard

**Estimated Time:** 7 days

---

## 📋 Phase 7: Testing & Polish (Week 7)

### **Objectives:**
- Comprehensive testing
- Bug fixes
- Performance optimization
- Documentation

### **Tasks:**

#### 7.1 Unit Testing
**Coverage:**
- Utility functions (filtering, quotas)
- Service layer functions
- API route handlers
- Type validation

**Target:** 80%+ code coverage

#### 7.2 Integration Testing
**Scenarios:**
- System model CRUD flow
- Admin enable/disable flow
- User access with quotas
- Usage tracking accuracy
- Quota enforcement

#### 7.3 End-to-End Testing
**User Flows:**
1. Superadmin creates system model
2. Admin sees and enables it
3. User accesses and uses model
4. Quota limit is hit
5. Usage resets on schedule

#### 7.4 Performance Testing
**Metrics:**
- Query performance (<100ms)
- API response times (<500ms)
- Page load times (<2s)
- Database index efficiency

**Optimization:**
- Add missing indexes
- Cache frequently accessed data
- Optimize RLS policies
- Add pagination

#### 7.5 Security Audit
**Checks:**
- RLS policies complete
- API authentication
- Input validation
- SQL injection prevention
- XSS prevention

#### 7.6 Documentation
**Documents to create:**
- [ ] User guide (Templates tab)
- [ ] Admin guide (System tab)
- [ ] Superadmin guide (Portal usage)
- [ ] API documentation
- [ ] Database schema diagram
- [ ] Deployment guide

**Deliverables:**
- [ ] Test suite (unit, integration, e2e)
- [ ] Performance benchmarks
- [ ] Security audit report
- [ ] Complete documentation set

**Estimated Time:** 7 days

---

## 📋 Phase 8: Deployment & Monitoring (Week 8)

### **Objectives:**
- Deploy to production
- Set up monitoring
- Create rollback plan
- Launch communication

### **Tasks:**

#### 8.1 Staging Deployment
- Deploy to staging environment
- Run full test suite
- Manual QA testing
- Performance testing

#### 8.2 Production Deployment
**Checklist:**
- [ ] Database migrations applied
- [ ] Environment variables set
- [ ] RLS policies enabled
- [ ] Cron jobs scheduled
- [ ] Monitoring configured
- [ ] Backup plan ready

#### 8.3 Monitoring Setup
**Metrics to track:**
- API error rates
- Database query performance
- Token usage trends
- User adoption rates
- System model usage
- Quota violations

**Tools:**
- Supabase Dashboard
- Vercel Analytics
- Custom logs
- Error tracking (Sentry)

#### 8.4 Rollback Plan
**If issues occur:**
1. Disable system models tab
2. Revert to previous version
3. Keep database intact
4. Investigate and fix
5. Redeploy when ready

#### 8.5 Launch Communication
**Internal:**
- Notify admin users of new features
- Provide training materials
- Set up support channels

**External (if applicable):**
- Blog post announcement
- Email to users
- Feature highlight videos

**Deliverables:**
- [ ] Production deployment
- [ ] Monitoring dashboard
- [ ] Rollback procedures
- [ ] Launch materials

**Estimated Time:** 5 days

---

## 🎯 Success Criteria

### **Phase 1 Complete When:**
- ✅ All database tables created
- ✅ RLS policies tested and working
- ✅ Sample data seeded
- ✅ Can query system models with filters

### **Phase 2 Complete When:**
- ✅ Type definitions comprehensive
- ✅ All utility functions working
- ✅ API endpoints functional
- ✅ Unit tests passing

### **Phase 3 Complete When:**
- ✅ Superadmin can create system models
- ✅ All form fields working
- ✅ Validation prevents bad data
- ✅ Models appear in list

### **Phase 4 Complete When:**
- ✅ Admin can see system models
- ✅ Enable/disable toggle works
- ✅ User limits can be set
- ✅ Changes persist correctly

### **Phase 5 Complete When:**
- ✅ Users see enabled models
- ✅ Token usage displays correctly
- ✅ Quota warnings appear
- ✅ Cannot use over-limit models

### **Phase 6 Complete When:**
- ✅ Token usage recorded accurately
- ✅ Quota enforcement prevents overuse
- ✅ Automated resets working
- ✅ Analytics show correct data

### **Phase 7 Complete When:**
- ✅ 80%+ test coverage
- ✅ All critical bugs fixed
- ✅ Performance benchmarks met
- ✅ Documentation complete

### **Phase 8 Complete When:**
- ✅ Deployed to production
- ✅ Monitoring active
- ✅ Users notified
- ✅ No critical issues

---

## 📊 Risk Management

### **High-Risk Areas:**
| Risk | Impact | Mitigation |
|------|--------|------------|
| RLS policy gaps | High | Thorough testing, security audit |
| Performance issues | Medium | Early benchmarking, optimization |
| Data migration | Medium | Test on copy, have rollback |
| User adoption | Low | Good UX, clear documentation |

### **Dependencies:**
- Supabase (database) - stable
- Next.js (framework) - stable
- Current AI model system - must remain functional

### **Blockers:**
- None identified currently
- Need superadmin access decisions

---

## 💰 Resource Requirements

### **Development:**
- 1 Full-stack developer (6-8 weeks)
- OR: 2 developers (3-4 weeks)

### **Infrastructure:**
- Supabase: existing (minimal additional cost)
- Storage: +50MB for new tables
- Compute: +5% for usage tracking

### **Optional:**
- Designer for superadmin portal UI
- QA engineer for testing phase
- Technical writer for documentation

---

## 🚦 Go/No-Go Decision Points

### **After Phase 1:**
- Is database schema suitable?
- Are RLS policies working correctly?
- Can we filter models as expected?

### **After Phase 3:**
- Is superadmin interface usable?
- Can we create system models?
- Is data validated properly?

### **After Phase 5:**
- Do users understand the interface?
- Is quota display clear?
- Are warnings helpful?

---

## 📝 Next Actions

### **Immediate (This Week):**
1. [ ] Review this plan with team
2. [ ] Make architectural decisions
3. [ ] Set up project tracking
4. [ ] Create Phase 1 tasks in detail

### **Before Starting:**
1. [ ] Approve database schema
2. [ ] Decide on business types list
3. [ ] Define pricing plan hierarchy
4. [ ] Choose monitoring tools

### **Phase 1 Kickoff:**
1. [ ] Create migration branch
2. [ ] Set up local test database
3. [ ] Begin database migrations
4. [ ] Write RLS policies

---

## 📚 References

- [Architecture Documentation](./SYSTEM_AI_MODELS_ARCHITECTURE.md)
- [Current AI System](./IMPLEMENTATION_SUMMARY.md)
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js App Router](https://nextjs.org/docs/app)

---

**Ready to start?** Let's begin with Phase 1: Database Foundation! 🚀
