# Email Templates Management - Quick Reference

## 🚀 Quick Start

### Access the UI

**Admin Interface**
```
URL: /admin/email-templates
Access: Requires admin role
Scope: Organization templates + defaults (read-only)
```

**Superadmin Interface**
```
URL: /superadmin/email-templates
Access: Requires superadmin role
Scope: All templates across all organizations
```

## 📝 Creating a New Template

### Via UI (when modal is implemented)
1. Click "Add Template" button
2. Select template type (e.g., "Welcome Email")
3. Choose category (Transactional/Notification/Marketing)
4. Enter subject (use {{placeholders}} as needed)
5. Write HTML body
6. (Optional) Write plain text version
7. Select from email type (no-reply/support/info/custom)
8. Save

### Via API
```typescript
POST /api/email-templates
Body: {
  organization_id: "org-uuid",  // or null for superadmin defaults
  type: "welcome",
  subject: "Welcome to {{company_name}}!",
  html_body: "<html>...</html>",
  plain_body: "Welcome...",
  from_email_address_type: "no-reply",
  custom_from_email: null,
  is_active: true,
  category: "transactional"
}
```

## 🔍 Available Placeholders

### Standard (always available)
- `{{user_name}}` - Full name of recipient
- `{{user_email}}` - Email address
- `{{company_name}}` - Organization name
- `{{support_email}}` - Support contact
- `{{current_year}}` - Current year (auto-populated)

### Ticket-specific
- `{{ticket_id}}` - Ticket identifier
- `{{ticket_subject}}` - Ticket subject line
- `{{ticket_status}}` - Open/Closed/etc.
- `{{response_message}}` - Support response text
- `{{responder_name}}` - Agent name

### Meeting-specific
- `{{meeting_title}}` - Meeting name
- `{{meeting_date}}` - Formatted date
- `{{meeting_time}}` - Formatted time
- `{{meeting_link}}` - Video call URL
- `{{host_name}}` - Meeting host
- `{{duration_minutes}}` - Duration

### Auth-specific
- `{{verification_link}}` - Email verification URL
- `{{reset_link}}` - Password reset URL

[See EMAIL_TEMPLATE_PLACEHOLDERS.md for complete list]

## 🎯 Template Types

### Transactional Emails
- `welcome` - New user signup
- `reset_email` - Password reset request
- `email_confirmation` - Email verification
- `order_confirmation` - Purchase confirmation
- `free_trial_registration` - Trial signup

### Notification Emails
- `ticket_confirmation` - Support ticket created
- `ticket_response` - Support response received
- `meeting_invitation` - Video meeting invite
- `meeting_reminder` - Meeting reminder
- `meeting_cancellation` - Meeting cancelled

### Marketing Emails
- `newsletter` - Marketing newsletters

## 🔐 From Email Types

| Type | Example | Use Case |
|------|---------|----------|
| `no-reply` | noreply@domain.com | Automated emails |
| `support` | support@domain.com | Support-related |
| `info` | info@domain.com | General information |
| `custom` | custom@domain.com | User-specified |

## 🛠️ Common Operations

### Search Templates
```typescript
// In the UI
<EmailSearchInput 
  value={search} 
  onChange={setSearch} 
/>

// Searches: subject, type, category, body content
```

### Filter Templates
```typescript
// Category
setFilterCategory('transactional' | 'notification' | 'marketing' | 'all')

// Type
setFilterType('welcome' | 'reset_email' | ... | 'all')

// Status
setFilterActive('active' | 'inactive' | 'all')
```

### Sort Templates
```typescript
// Sort by
setSortBy('created' | 'subject' | 'type' | 'category')

// Order
setSortOrder('asc' | 'desc')
```

### Toggle Active Status
```typescript
toggleTemplateActive(templateId, currentActiveStatus)
```

### Delete Template
```typescript
// Only non-default templates
deleteTemplate(templateId)

// Default templates → Returns 403 error
```

## 📊 Statistics Display

### Admin View
- Total Templates
- Active Templates
- Inactive Templates
- Default Templates (read-only)

### Superadmin View
- Total Templates (all orgs)
- Default Templates
- Org Templates
- Active Templates
- Inactive Templates

## 🎨 UI Components

### EmailTemplateCard
Shows template with:
- Subject line (bold, 18px)
- Type badge (colored pill)
- Category badge (colored pill)
- Status badge (Active/Inactive)
- Default indicator (purple)
- Body preview (truncated, 150 chars)
- Action buttons (Preview, Test, Edit, Toggle, Delete)
- Footer metadata (from address, creator, updated time)

### EmailFilterBar
5-column grid with dropdowns:
1. Category filter
2. Type filter
3. Status filter
4. Sort by selector
5. Sort order selector

### EmailSearchInput
- Magnifying glass icon
- Debounced search
- Placeholder text

## 🔗 API Reference

### List Templates
```http
GET /api/email-templates?organization_id={id}
```
Returns array of templates (admin: filtered by org, superadmin: all)

### Get Single Template
```http
GET /api/email-templates/:id
```
Returns single template with creator profile data

### Create Template
```http
POST /api/email-templates
Body: EmailTemplateForm
```
Returns created template with id

### Update Template
```http
PUT /api/email-templates/:id
Body: Partial<EmailTemplateForm>
```
Returns updated template

### Delete Template
```http
DELETE /api/email-templates/:id
```
Returns success message (blocks default templates)

### Preview Template
```http
POST /api/email-templates/preview
Body: {
  template_id?: number,
  html_body?: string,
  plain_body?: string,
  placeholders?: Record<string, string>
}
```
Returns preview with replaced placeholders

### Send Test Email
```http
POST /api/email-templates/test
Body: {
  template_id: number,
  test_email: string,
  placeholders?: Record<string, string>
}
```
Sends test email via AWS SES

## 🚨 Error Handling

### Common Errors
- **403 Forbidden** - Trying to delete/edit default template
- **404 Not Found** - Template ID doesn't exist
- **400 Bad Request** - Validation errors (missing subject, invalid email, etc.)
- **500 Server Error** - Database or AWS SES issues

### Error Display
- Red notification bar at top of page
- Auto-dismisses after 7 seconds
- Can be manually dismissed with X button

### Success Messages
- Green notification bar
- Auto-dismisses after 5 seconds
- Shows operation result (created, updated, deleted)

## 🔒 Permissions

### Admin Users
- ✅ View org templates + defaults
- ✅ Create new templates for their org
- ✅ Edit own org templates
- ✅ Delete own org templates
- ✅ Toggle active status (own templates)
- ✅ Preview any template
- ✅ Send test emails
- ❌ Edit default templates
- ❌ Delete default templates

### Superadmin Users
- ✅ View all templates (all orgs)
- ✅ Create templates for any org
- ✅ Edit any template
- ✅ Delete any non-default template
- ✅ Toggle active status (any template)
- ✅ Preview any template
- ✅ Send test emails
- ❌ Delete default templates (protection)

## 📦 Code Integration

### Import Hook
```typescript
import { useEmailTemplateManagement } from '@/components/EmailTemplates/_shared';

const {
  templates,
  loading,
  error,
  addTemplate,
  updateTemplate,
  deleteTemplate,
  toggleTemplateActive,
} = useEmailTemplateManagement({
  organizationId: 'your-org-id',
  context: 'admin' // or 'superadmin'
});
```

### Import Components
```typescript
import {
  EmailTemplateList,
  EmailTemplateCard,
  EmailFilterBar,
  EmailSearchInput,
  EmailNotification,
  EmailLoadingSkeleton,
} from '@/components/EmailTemplates/_shared';
```

### Import Types
```typescript
import type {
  EmailTemplate,
  EmailTemplateForm,
  EmailTemplateType,
  FilterCategoryType,
} from '@/components/EmailTemplates/_shared';
```

### Import Utils
```typescript
import {
  validateEmailTemplateForm,
  replacePlaceholders,
  extractPlaceholders,
  getAvailablePlaceholders,
} from '@/components/EmailTemplates/_shared';
```

## 🎯 Next Steps (TODOs)

1. **Implement Edit Modal** - Full form with rich text editor
2. **Implement Preview Modal** - HTML/Plain text split view
3. **Implement Test Send Modal** - Email input and send functionality
4. **Add Placeholder Helper** - Autocomplete dropdown
5. **Template Duplication** - Clone existing templates
6. **Move to Phase 1** - AI agent integration

## 📚 Related Files

- Main Plan: `EMAIL_AI_AGENTS_INTEGRATION_PLAN.md`
- Phase 0 Specs: `PHASE0_EMAIL_TEMPLATE_MANAGEMENT.md`
- Placeholders: `EMAIL_TEMPLATE_PLACEHOLDERS.md`
- Implementation: `EMAIL_TEMPLATES_UI_IMPLEMENTATION_COMPLETE.md`

---

## 🎉 Status: Phase 0 Core Complete

All API endpoints ✅  
All shared components ✅  
Admin page ✅  
Superadmin page ✅  
No compile errors ✅  

**Ready for modal implementation and Phase 1!**
