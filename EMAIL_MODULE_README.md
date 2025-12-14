# Email Module Implementation - Complete Plan

> **Status**: Phase 1 Complete - Foundation Ready
> **Database**: ✅ All 9 tables migrated ([email-module-migration-CORRECTED.sql](email-module-migration-CORRECTED.sql))
> **UI Shell**: ✅ Modal + 5 tabs + UnifiedMenu integration
> **Next**: Build out tab functionality (Weeks 2-6)

---

## ✅ PHASE 1: FOUNDATION (COMPLETED)

### Database Migration ✅
**File**: `email-module-migration-CORRECTED.sql`

**Tables Created**:
1. ✅ `email_accounts` - Gmail/Outlook/SES accounts
2. ✅ `email_threads` - Conversation grouping
3. ✅ `email_messages` - Individual emails
4. ✅ `email_attachments` - File attachments
5. ✅ `email_sent_log` - Delivery tracking
6. ✅ `email_campaigns` - Marketing campaigns
7. ✅ `email_lists` - Subscriber lists
8. ✅ `email_list_subscribers` - List members
9. ✅ `email_campaign_recipients` - Campaign targets

**Features**:
- ✅ RLS policies for org isolation
- ✅ Triggers for auto-updating counts
- ✅ `get_email_branding()` helper function
- ✅ Realtime subscriptions enabled
- ✅ `settings.email_branding` JSONB column

### EmailModal Components ✅
**Created Files**:
- ✅ `EmailModal.tsx` - Main modal with tab navigation
- ✅ `EmailModalManager.tsx` - Zustand state store
- ✅ `types.ts` - TypeScript definitions (all 9 table types)
- ✅ `context/EmailContext.tsx` - React context provider
- ✅ `components/InboxView/InboxView.tsx` - Placeholder
- ✅ `components/TransactionalView/TransactionalView.tsx` - Placeholder
- ✅ `components/MarketingView/MarketingView.tsx` - Placeholder
- ✅ `components/TemplatesView/TemplatesView.tsx` - Placeholder
- ✅ `components/SettingsView/SettingsView.tsx` - Basic display

### UnifiedMenu Integration ✅
- ✅ `hooks/useUnreadEmailCount.tsx` - Badge count with realtime
- ✅ Email menu item in admin menu (with badge)
- ✅ `menuItems.ts` updated with email item
- ✅ `UnifiedModalManager.tsx` wired to open EmailModal
- ✅ Modal opens on click (verified working)

---

## 📋 PHASE 2-6: IMPLEMENTATION PLAN

### 📅 WEEK 2: SETTINGS TAB (Priority: HIGH - Start Here)

**Goal**: Enable email account connections and branding customization

#### Components to Build

**1. SettingsView.tsx Enhancement**
```
📂 components/SettingsView/
├── SettingsView.tsx (main - enhance current)
├── ConnectedAccounts.tsx ⭐ NEW
├── SESConfiguration.tsx ⭐ NEW
├── 📅 WEEK 3: TRANSACTIONAL TAB (Priority: MEDIUM)

**Goal**: Monitor and manage transactional emails sent via SES

#### Components to Build

**2. TransactionalView.tsx Structure**
```
📂 components/TransactionalView/
├── TransactionalView.tsx (tabs: Queue | Logs | Templates)
├── EmailQueueView.tsx ⭐ NEW
├── EmailLogsView.tsx ⭐ NEW
└── EmailTemplatesList.tsx ⭐ NEW
```

**Actions**:
- [ ] **EmailQueueView.tsx**
  - Display emails pending in queue
  - Columns: Recipient, Subject, Template, Scheduled Time, Status
  - Actions: Cancel, Reschedule, View Details
  - Real-time updates when emails sent
  - Filter by status: pending, processing, failed
  - Retry failed emails button
  
- [ ] **EmailLogsView.tsx**
  - DataTable from `email_sent_log` table
  - Columns: Date, Recipient, Subject, Template, Status, Opens, Clicks
  - Filters:
    - Status dropdown (sent, delivered, bounced, complained, failed)
    - Date range picker (last 7d, 30d, 90d, custom)
    - Search by recipient email
    - Template type filter
  - Row click → opens EmailDetailModal
  - Export to CSV button
  - Pagination (50 per page)
  - Status badges with colors:
    - ✅ Delivered (green)
    - 📧 Sent (blue)
    - ⚠️ Bounced (yellow)
    - ❌ Failed (red)
    - 🚫 Complained (orange)
  
- [ ] **EmailTemplatesList.tsx**
  - List all transactional templates
  - Filter by type: welcome, reset_email, order_confirmation, etc.
  - Quick actions: Edit, Preview, Duplicate, Delete
  - Usage count for each template
  - Link to full template editor

#### Shared Components
```
📂 components/shared/
├── EmailDetailModal.tsx ⭐ NEW
│   ├── Full email preview (HTML render)
│   ├── Metadata: sent_at, opened_at, clicked_at
│   ├── Recipient info with link to CRM
│   ├── Delivery timeline visualization
│   └── Resend button
└── EmailPreview.tsx ⭐ NEW
    └── Iframe-based HTML email renderer
```

#### API Routes Needed
```
GET  /api/email/logs?status=&from=&to=&search=&page=
GET  /api/email/logs/:id
POST /api/email/logs/:id/resend
GET  /api/email/queue
DELETE /api/email/queue/:id
POST /api/email/queue/:id/retry
```

#### Hooks to Create
```
📂 hooks/
├── useEmailLogs.ts ⭐ NEW
│   └── fetch logs with filters, pagination
├── useEmailQueue.ts ⭐ NEW
│   📅 WEEK 4: MARKETING TAB (Priority: HIGH - Business Value)

**Goal**: Create and manage email marketing campaigns

#### Components to Build

**3. MarketingView.tsx Structure**
```
📂 components/MarketingView/
├── MarketingView.tsx (tabs: Campaigns | Lists | Analytics)
├── CampaignsList.tsx ⭐ NEW
├── CampaignBuilder.tsx ⭐ NEW
├── EmailListsView.tsx ⭐ NEW
├── EmailAnalytics.tsx ⭐ NEW
└── BulkSendQueue.tsx ⭐ NEW
```

**Actions**:
- [ ] **CampaignsList.tsx**
  - Card grid or table view of campaigns
  - Campaign card:
    - Name, subject line, scheduled date
    - Status badge (draft, scheduled, sending, sent, paused, cancelled)
    - Stats: sent/total, opens %, clicks %
    - Actions dropdown: Edit, Duplicate, Schedule, Send, Pause, Cancel, Delete
  - "Create Campaign" button → opens CampaignBuilder
  - Filter by status
  - Sort by: date created, scheduled date, name
  
- [ ] **CampaignBuilder.tsx** (Multi-step wizard)
  - **Step 1: Details**
    - Campaign name input
    - Subject line input (with emoji picker)
    - From email dropdown (connected accounts)
    - From name input
    - Reply-to email input
  - **Step 2: Content**
    - Select template dropdown (marketing templates only)
    - Preview selected template
    - Merge field hints: {subscriber_name}, {unsubscribe_link}
  - **Step 3: Recipients**
    - Multi-select email lists
    - Show total recipient count
    - Exclude unsubscribed/bounced automatically
  - **Step 4: Schedule**
    - Send now radio
    - Schedule radio → date/time picker
    - Timezone selector
  - **Step 5: Review**
    - Summary of all settings
    - Send test email button
    - Final preview
    - Confirm and send/schedule button
  
- [ ] **EmailListsView.tsx**
  - List cards showing:
    - List name, description
    - Subscriber count (active/total)
    - Created date
    - Actions: Edit, Export, Import, Delete
  - "Create List" button → opens ListEditModal
  - Click list → opens ListDetailView:
    - Subscriber table (email, name, status, subscribed date)
    - Search subscribers
    - Add subscriber manually
    - Import CSV button
    - Bulk actions: Remove, Unsubscribe
    - Export list to CSV
  
- [ ] **EmailAnalytics.tsx**
  - Overview cards:
    - Total campaigns sent
    - Average open rate
    - Average click rate
    - Total subscribers
  - Charts:
    - Campaign performance comparison (bar chart)
    - Open/click trends over time (line chart)
    - Top performing campaigns (table)
    - Geographic distribution (if available)
  - Date range selector
  - Export analytics report
  
- [ ] **BulkSendQueue.tsx**
  - Show campaigns currently sending
  - Progress bar: X of Y emails sent
  - Estimated completion time
  - Pause/resume button
  - Real-time updates via websocket

#### Shared Components
```📅 WEEK 5: TEMPLATES TAB (Priority: MEDIUM - Reuse Existing)

**Goal**: Centralized template management for all email types

#### Components to Build

**4. TemplatesView.tsx Structure**
```
📂 components/TemplatesView/
├── TemplatesView.tsx (tabs: All | Transactional | Marketing | System)
├── TemplateEditor.tsx ⭐ NEW
├── 📅 WEEK 6: INBOX TAB (Priority: HIGH - Most Complex)

**Goal**: Centralized inbox for Gmail/Outlook accounts

#### Components to Build

**5. InboxView.tsx Structure**
```
📂 components/InboxView/
├── InboxView.tsx (3-pane layout: Sidebar | List | Detail)
├── EmailList.tsx ⭐ NEW
├── EmailThread.tsx ⭐ NEW
├── EmailComposer.tsx ⭐ NEW
└── EmailFilters.tsx ⭐ NEW
```

**Actions**:
- [ ] **InboxView.tsx** (3-pane Gmail-style layout)
  - **Left Sidebar** (EmailFilters):
    - Account selector (all accounts or specific)
    - Folders:
      - 📥 Inbox (unread count badge)
      - ⭐ Starred
      - 📤 Sent
      - 📝 Drafts
      - 🗑️ Trash
      - 📁 Archived
    - Labels/Tags (future)
    - "Compose" button → opens EmailComposer
  - **Middle Panel** (EmailList):
    - Thread list with infinite scroll
    - Each row: sender avatar, sender name, subject, snippet, time, unread badge
    - Bulk actions toolbar: Mark read, Archive, Delete, Star
    - Search bar with filters
  - **Right Panel** (EmailThread):
    - Thread header: subject, participants count
    - Message list (chronological)
    - Each message: sender, timestamp, body (HTML), attachments
    - Reply/Reply All/Forward buttons
    - Link to Ticket/Booking buttons
    - Print/Download buttons
  
- [ ] **EmailList.tsx**
  - Virtualized list for performance (react-window)
  - Thread rows with:
    - Checkbox for bulk selection
    - Star icon (toggle)
    - Sender avatar (generated or from contact)
    - Sender name (bold if unread)
    - Subject line + snippet (gray)
    - Timestamp (relative: "2h ago", "Yesterday")
    - Unread badge (blue dot)
    - Attachment indicator (📎)
    - Label chips
  - Row actions (hover):
    - Archive icon
    - Delete icon
    - Snooze icon (future)
  - Loading skeleton while fetching
  - Empty state: "No emails in this folder"
  
- [ ] **EmailThread.tsx**
  - Thread conversation view
  - Collapsed older messages (expand button)
  - Each message card:
    - Sender info with avatar
    - Timestamp (full date on hover)
    - Body rendered as HTML (sanitized)
    - Attachments list with download buttons
    - Reply/Forward buttons
  - Quick reply box at bottom
  - Rich text editor for replies
  - Attachment uploader (drag-drop)
  - Send button with "Send & Archive" option
  
- [ ] **EmailComposer.tsx** (Modal or inline)
  - To: field with autocomplete (from contacts/CRM)
  - Cc/Bcc fields (expandable)
  - From: dropdown (connected accounts)
  - Subject: input
  - Rich text editor:
    - Bold, italic, underline
    - Lists (bullet, numbered)
    - Links, images
    - Text color, background color
  - Attachment uploader (max 25MB)
  - Template selector (quick insert)
  - Signature insertion (auto or manual)
  - Schedule send (future)
  - Save as draft (auto-save every 30s)
  - Send button
  
- [ ] **EmailFilters.tsx**
  - Advanced search modal:
    - From email/name
    - To email/name
    - Subject contains
    - Body contains
    - Has attachments checkbox
    - Date range picker
    - Read/unread filter
    - Starred filter
  - Quick filters (chips):
    - Unread only
    - Starred only
    - Has attachments
    - From customers (linked to CRM)
  - Save search (future)

#### Services to Build
```
📂 services/
├── GmailService.ts ⭐ NEW
│   ├── OAuth flow (Google API)
│   ├── Sync messages (incremental)
│   ├── Send message
│   ├── Mark read/unread
│   ├── Archive/delete
│   ├── Create draft
│   └── Download attachment
├── OutlookService.ts ⭐ NEW
│   ├── OAuth flow (Microsoft Graph API)
│   ├── Sync messages (incremental)
│   ├── Send message
│   ├── Mark read/unread
│   ├── Archive/delete
│   ├── Create draft
│   └── Download attachment
└── EmailSyncService.ts ⭐ NEW
    ├── Background sync scheduler
    ├── Thread grouping algorithm
    ├── Deduplication logic
    └── Conflict resolution
```

#### Shared Components
```
📂 components/shared/
├── EmailThreadModal.tsx ⭐ NEW
│   └── Full-screen thread viewer (alternative to 3-pane)
├── AttachmentUploader.tsx ⭐ NEW
│   ├── Drag-drop zone
│   ├── File size validation
│   ├── Progress bars
│   └── Preview thumbnails
---

## 📁 COMPLETE FILE STRUCTURE

```
src/components/modals/EmailModal/
├── EmailModal.tsx                    ✅ DONE - Main modal with tabs
├── EmailModalManager.tsx             ✅ DONE - Zustand state
├── types.ts                          ✅ DONE - All TypeScript types
├── index.ts                          ✅ DONE - Exports
│
├── context/
│   └── EmailContext.tsx              ✅ DONE - Provider with org data
│
├── components/
│   ├── InboxView/                    # Tab 1: INBOX
│   │   ├── InboxView.tsx             ✅ PLACEHOLDER
│   │   ├── EmailList.tsx             ⭐ WEEK 6
│   │   ├── EmailThread.tsx           ⭐ WEEK 6
│   │   ├── EmailComposer.tsx         ⭐ WEEK 6
│   │   └── EmailFilters.tsx          ⭐ WEEK 6
│   │
│   ├── TransactionalView/            # Tab 2: TRANSACTIONAL
│   │   ├── TransactionalView.tsx     ✅ PLACEHOLDER
│   │   ├── EmailQueueView.tsx        ⭐ WEEK 3
│   │   ├── EmailLogsView.tsx         ⭐ WEEK 3
│   │   └── EmailTemplatesList.tsx    ⭐ WEEK 3
│   │
│   ├── MarketingView/                # Tab 3: MARKETING
│   │   ├── MarketingView.tsx         ✅ PLACEHOLDER
│   │   ├── CampaignsList.tsx         ⭐ WEEK 4
│   │   ├── CampaignBuilder.tsx       ⭐ WEEK 4
│   │   ├── EmailListsView.tsx        ⭐ WEEK 4
│   │   ├── EmailAnalytics.tsx        ⭐ WEEK 4
│   │   └── BulkSendQueue.tsx         ⭐ WEEK 4
│   │
│   ├── TemplatesView/                # Tab 4: TEMPLATES
│   │   ├── TemplatesView.tsx         ✅ PLACEHOLDER
│   │   ├── TemplateEditor.tsx        ⭐ WEEK 5
│   │   ├── TemplatePreview.tsx       ⭐ WEEK 5
│   │   └── TemplateTester.tsx        ⭐ WEEK 5
│   │
│   ├── SettingsView/                 # Tab 5: SETTINGS
│   │   ├── SettingsView.tsx          ✅ BASIC DISPLAY
│   │   ├── ConnectedAccounts.tsx     ⭐ WEEK 2
│   │   ├── SESConfiguration.tsx      ⭐ WEEK 2
│   │   ├── BrandingEditor.tsx        ⭐ WEEK 2
│   │   ├── DomainSetup.tsx           ⭐ WEEK 2
│   │   └── SignatureEditor.tsx       ⭐ WEEK 2
│   │
│   └── shared/                       # SHARED COMPONENTS
│       ├── EmailPreview.tsx          ⭐ WEEK 3
│       ├── RecipientPicker.tsx       ⭐ WEEK 4
│       ├── AttachmentUploader.tsx    ⭐ WEEK 6
│       ├── EmailThreadModal.tsx      ⭐ WEEK 6
│       ├── EmailDetailModal.tsx      ⭐ WEEK 3
│       ├── TemplateEditModal.tsx     ⭐ WEEK 5
│       ├── CampaignEditModal.tsx     ⭐ WEEK 4
│       ├── ListEditModal.tsx         ⭐ WEEK 4
│       ├── SubscriberImportModal.tsx ⭐ WEEK 4
│       ├── MergeFieldPicker.tsx      ⭐ WEEK 5
│       └── RichTextEditor.tsx        ⭐ WEEK 6
│
├── hooks/
│   ├── useConnectedAccounts.ts       ⭐ WEEK 2
│   ├── useEmailBranding.ts           ⭐ WEEK 2
│   ├── useSESConfiguration.ts        ⭐ WEEK 2
│   ├── useEmailLogs.ts               ⭐ WEEK 3
│   ├── useEmailQueue.ts              ⭐ WEEK 3
│   ├── useEmailDetail.ts             ⭐ WEEK 3
│   ├── useEmailCampaigns.ts          ⭐ WEEK 4
│   ├── useEmailLists.ts              ⭐ WEEK 4
│   ├── useEmailAnalytics.ts          ⭐ WEEK 4
│   ├── useBulkSendProgress.ts        ⭐ WEEK 4
│   ├── useEmailTemplates.ts          ⭐ WEEK 5
│   ├── useTemplatePreview.ts         ⭐ WEEK 5
│   ├── useTemplateTester.ts          ⭐ WEEK 5
│   ├── useInboxData.ts               ⭐ WEEK 6
│   ├── useEmailThread.ts             ⭐ WEEK 6
│   ├── useEmailComposer.ts           ⭐ WEEK 6
│   ├── useEmailSync.ts               ⭐ WEEK 6
│   └── useEmailSearch.ts             ⭐ WEEK 6
│
├── services/
│   ├── GmailService.ts               ⭐ WEEK 6
│   ├── OutlookService.ts             ⭐ WEEK 6
│   ├── SESService.ts                 ⭐ WEEK 2
│   └── EmailSyncService.ts           ⭐ WEEK 6
│
└── utils/
    ├── emailValidation.ts            ⭐ WEEK 2
    ├── emailParsing.ts               ⭐ WEEK 6
    └── domainVerification.ts         ⭐ WEEK 2
```

---

## 🔧 API ENDPOINTS SUMMARYEW
    └── TinyMCE or Tiptap integration
```

#### API Routes Needed
```
GET    /api/email/threads?folder=&account=&page=
GET    /api/email/threads/:id
POST   /api/email/threads/:id/reply
POST   /api/email/threads/:id/forward
PATCH  /api/email/threads/:id (mark read, archive, etc.)
DELETE /api/email/threads/:id

GET    /api/email/messages/:id
GET    /api/email/messages/:id/attachment/:attachmentId
POST   /api/email/messages/compose
POST   /api/email/messages/draft
PUT    /api/email/messages/draft/:id
POST   /api/email/messages/send/:draftId

POST   /api/email/sync/:accountId
GET    /api/email/sync/:accountId/status

POST   /api/email/oauth/gmail/init
POST   /api/email/oauth/gmail/callback
POST   /api/email/oauth/outlook/init
POST   /api/email/oauth/outlook/callback
```

#### Hooks to Create
```
📂 hooks/
├── useInboxData.ts ⭐ NEW
│   └── fetch threads, pagination, filters
├── useEmailThread.ts ⭐ NEW
│   └── fetch single thread, messages, actions
├── useEmailComposer.ts ⭐ NEW
│   └── draft management, send, attachments
├── useEmailSync.ts ⭐ NEW
│   └── trigger sync, monitor progress
└── useEmailSearch.ts ⭐ NEW
    └── advanced search, save filters
```
  - "Create Template" button → opens TemplateEditor
  - Sort by: name, last modified, most used
  
- [ ] **TemplateEditor.tsx**
  - Template name input
  - Category selector (transactional, marketing, system)
  - Subject line input (with merge fields)
  - **Code Editor Mode**:
    - HTML code editor with syntax highlighting
    - Merge field autocomplete: {name}, {email}, {order_id}, etc.
    - CSS inliner option
  - **Visual Editor Mode** (future):
    - Drag-drop blocks (header, text, button, image, footer)
    - WYSIWYG editing
    - Responsive preview toggle (desktop/mobile)
  - Merge field documentation sidebar
  - Save as draft / Publish button
  - Version history (future)
  
- [ ] **TemplatePreview.tsx**
  - Iframe render of HTML template
  - Device toggle: Desktop / Tablet / Mobile
  - Test data input:
    - Fill merge fields with sample data
    - Randomize test data button
  - Dark mode toggle (if template supports)
  - Email client compatibility check
  
- [ ] **TemplateTester.tsx**
  - Send test email form:
    - Recipient email input (default: current user)
    - Multiple recipients (comma-separated)
    - Test merge field values
    - Send button
  - Test results:
    - Delivery status
    - Preview in Gmail/Outlook screenshot (future)
    - Spam score (future integration)

#### Reuse Existing Components
```
📂 Existing: /src/components/EmailTemplates/_shared/
├── types/emailTemplate.ts ✅ Already exists
│   └── EMAIL_TEMPLATE_TYPES, PLACEHOLDERS arrays
├── AdminEmailTemplateForm.tsx (adapt for modal use)
└── SuperadminEmailTemplateForm.tsx (adapt for modal use)
```

#### Shared Components
```
📂 components/shared/
├── TemplateEditModal.tsx ⭐ NEW
│   └── Full-screen template editor modal
├── MergeFieldPicker.tsx ⭐ NEW
│   └── Searchable merge field dropdown
└── TemplateVersionHistory.tsx ⭐ NEW (future)
    └── Git-style version history
```

#### API Routes Needed
```
GET    /api/email/templates
POST   /api/email/templates
PUT    /api/email/templates/:id
DELETE /api/email/templates/:id
POST   /api/email/templates/:id/duplicate
POST   /api/email/templates/:id/test
GET    /api/email/templates/:id/usage-stats
```

#### Hooks to Create
```
📂 hooks/
├── useEmailTemplates.ts ⭐ NEW
│   └── CRUD templates, filter, search
├── useTemplatePreview.ts ⭐ NEW
│   └── render preview, device toggle
└── useTemplateTester.ts ⭐ NEW
    └── send test emails, track results
```
│   └── Validation errors
└── RecipientPicker.tsx ⭐ NEW
    └── Multi-select lists with counts
```

#### API Routes Needed
```
GET    /api/email/campaigns
POST   /api/email/campaigns
PUT    /api/email/campaigns/:id
DELETE /api/email/campaigns/:id
POST   /api/email/campaigns/:id/schedule
POST   /api/email/campaigns/:id/send
POST   /api/email/campaigns/:id/pause
POST   /api/email/campaigns/:id/test

GET    /api/email/lists
POST   /api/email/lists
PUT    /api/email/lists/:id
DELETE /api/email/lists/:id
GET    /api/email/lists/:id/subscribers
POST   /api/email/lists/:id/subscribers
DELETE /api/email/lists/:id/subscribers/:subscriberId
POST   /api/email/lists/:id/import
GET    /api/email/lists/:id/export

GET    /api/email/analytics/overview
GET    /api/email/analytics/campaigns
GET    /api/email/analytics/trends
```

#### Hooks to Create
```
📂 hooks/
├── useEmailCampaigns.ts ⭐ NEW
│   └── CRUD campaigns, schedule, send
├── useEmailLists.ts ⭐ NEW
│   └── CRUD lists, manage subscribers
├── useEmailAnalytics.ts ⭐ NEW
│   └── fetch analytics, export reports
└── useBulkSendProgress.ts ⭐ NEW
    └── monitor sending progress, pause/resume
``` settings.seo_og_image)
  - Custom color picker (when toggle off)
  - Custom logo uploader (when toggle off)
  - Font family dropdown
  - Button border radius slider
  - Container max width input
  - **Live Preview** component showing sample email
  - Save button → updates `settings.email_branding` JSONB
  
- [ ] **DomainSetup.tsx**
  - Display SPF, DKIM, DMARC DNS records
  - Copy-to-clipboard buttons
  - Domain verification status check
  - Instructions for major DNS providers
  
- [ ] **SignatureEditor.tsx**
  - Rich text editor for email signature
  - Insert merge fields: {name}, {title}, {company}
  - Preview signature
  - Save per user or organization-wide
---

## 📊 IMPLEMENTATION METRICS

### Estimated Effort
- **Week 2** (Settings): ~20 hours - 5 components + 3 API routes
- **Week 3** (Transactional): ~15 hours - 3 components + 2 API routes
- **Week 4** (Marketing): ~25 hours - 5 components + 8 API routes
- **Week 5** (Templates): ~15 hours - 3 components + 2 API routes
- **Week 6** (Inbox): ~30 hours - 4 components + 3 services + 10 API routes
- **Total**: ~105 hours

### Component Count
- ✅ **Phase 1 Complete**: 10 files (modal shell, types, placeholders)
- ⭐ **Phase 2-6 To Build**: 63 files
  - 30 view/feature components
  - 12 shared components
  - 18 hooks
  - 4 services
  - 3 utils

### Database Status
- ✅ **9 tables** with full RLS
- ✅ **get_email_branding()** function
- ✅ **Triggers** for auto-counts
- ✅ **Realtime** subscriptions

---

## 📝 TECHNICAL NOTES

### Database
- SQL migration: `email-module-migration-CORRECTED.sql` ✅
- All tables use UUID primary keys except `email_template` (BIGINT)
- Foreign keys validated (BIGINT template_id in campaigns/logs)
- RLS policies: org-level isolation via `organization_id`
- Triggers auto-update: `message_count`, `subscriber_count`, `updated_at`

### Email Branding
- Stored in `settings.email_branding` JSONB column
- Defaults: use `settings.primary_color` and `settings.seo_og_image`
- Admins can override with custom values in Settings tab
- `get_email_branding(org_id)` function merges defaults with custom values

### Real-time Features
- Inbox badge updates via Supabase realtime subscriptions
- Email queue progress tracked via websockets
- Campaign sending status updates live
- Unread count refreshes automatically

### Security
- RLS policies enforce organization-level data isolation
- OAuth tokens encrypted at rest (production)
- Email content sanitized before rendering (XSS prevention)
- Rate limiting on email sending APIs
- DKIM/SPF/DMARC validation in domain setup

### Performance
- Virtualized lists for inbox (react-window)
- Lazy loading for heavy tab components
- Image optimization for attachments
- Debounced search queries
- Pagination (50 items per page)
- Incremental email sync (not full refresh)

---

## 🎯 QUICK START FOR WEEK 2

1. **Create Settings components**:
   ```bash
   touch src/components/modals/EmailModal/components/SettingsView/ConnectedAccounts.tsx
   touch src/components/modals/EmailModal/components/SettingsView/SESConfiguration.tsx
   touch src/components/modals/EmailModal/components/SettingsView/BrandingEditor.tsx
   ```

2. **Create hooks**:
   ```bash
   mkdir src/components/modals/EmailModal/hooks
   touch src/components/modals/EmailModal/hooks/useConnectedAccounts.ts
   touch src/components/modals/EmailModal/hooks/useEmailBranding.ts
   ```

3. **Create API routes**:
   ```bash
   mkdir -p src/app/api/email/accounts
   mkdir -p src/app/api/email/branding
   touch src/app/api/email/accounts/route.ts
   touch src/app/api/email/branding/route.ts
   ```

4. **Insert test data** (Supabase SQL Editor):
   ```sql
   -- See "Test Data Setup" section below
   ```

---
DELETE /api/email/accounts/:id
PUT  /api/email/branding
GET  /api/email/branding
POST /api/email/accounts/:id/test-connection
```

#### Hooks to Create
```
📂 hooks/
├── useConnectedAccounts.ts ⭐ NEW
│   └── fetch, add, remove, set primary
├── useEmailBranding.ts ⭐ NEW
│   └── fetch, update, preview
└── useSESConfiguration.ts ⭐ NEW
    └── test connection, verify domain
```

### Week 3: Transactional Tab
**Priority**: Leverage existing email_template system
- [ ] Email sent log table/list
  - Filter by status (sent, delivered, bounced, etc.)
  - Search by recipient email
  - Date range picker
  - Export to CSV
- [ ] Queue view for pending emails
- [ ] Resend failed emails
- [ ] Email preview/detail view

### Week 4: Marketing Tab
**Priority**: New functionality, high business value
- [ ] Campaign list/grid
  - Create new campaign
  - Edit draft campaigns
  - Schedule campaigns
  - View campaign stats (sent, opened, clicked, etc.)
- [ ] Email list management
  - Create/edit lists
  - Import subscribers (CSV)
  - Manual add/remove
  - Subscriber status management
- [ ] Campaign builder
  - Select template
  - Compose subject line
  - Preview email
  - Select target lists
  - Schedule or send immediately

### Week 5: Templates Tab
**Priority**: Reuse existing components
- [ ] Integrate existing EmailTemplates components
  - Reuse `/src/components/EmailTemplates/_shared/`
  - Filter by category (transactional, marketing, system)
- [ ] Template editor enhancements
  - Drag-drop blocks (if using visual editor)
  - Merge field picker with autocomplete
  - Mobile preview
- [ ] Template versioning/history

### Week 6: Inbox Tab
**Priority**: Most complex, requires external integrations
- [ ] Gmail integration
  - OAuth 2.0 flow
  - Sync messages to email_messages table
  - Thread grouping
  - Mark as read/unread
  - Reply functionality
- [ ] Outlook integration
  - OAuth 2.0 flow
  - Sync messages
  - Thread grouping
- [ ] Inbox UI
  - Thread list (Gmail-style)
  - Message composer
  - Attachments display/download
  - Link to tickets/bookings
  - Search and filters

## 🔧 API Endpoints Needed

### Email Accounts
- `POST /api/email/accounts/connect-gmail` - Initiate Gmail OAuth
- `POST /api/email/accounts/connect-outlook` - Initiate Outlook OAuth
- `GET /api/email/accounts` - List connected accounts
- `DELETE /api/email/accounts/:id` - Disconnect account
- `POST /api/email/accounts/:id/sync` - Trigger manual sync

### Email Messages (Inbox)
- `GET /api/email/threads` - List threads with pagination
- `GET /api/email/threads/:id` - Get thread details with messages
- `POST /api/email/messages` - Send new email
- `POST /api/email/messages/:id/reply` - Reply to message
- `PATCH /api/email/messages/:id` - Update (mark read, archive, etc.)

### Campaigns
- `GET /api/email/campaigns` - List campaigns
- `POST /api/email/campaigns` - Create campaign
- `PUT /api/email/campaigns/:id` - Update campaign
- `POST /api/email/campaigns/:id/schedule` - Schedule campaign
- `POST /api/email/campaigns/:id/send` - Send immediately
- `DELETE /api/email/campaigns/:id` - Delete campaign

### Lists & Subscribers
- `GET /api/email/lists` - List email lists
- `POST /api/email/lists` - Create list
- `GET /api/email/lists/:id/subscribers` - List subscribers
- `POST /api/email/lists/:id/subscribers` - Add subscriber(s)
- `DELETE /api/email/lists/:id/subscribers/:subscriberId` - Remove subscriber
- `POST /api/email/lists/:id/import` - Bulk import CSV

### Branding
- `GET /api/email/branding` - Get current branding (uses get_email_branding RPC)
- `PUT /api/email/branding` - Update branding settings

### Transactional Logs
- `GET /api/email/logs` - Get sent email logs with filters
- `GET /api/email/logs/:id` - Get individual log details

## 🎯 Quick Start Testing

Once you have test data, you can open the EmailModal:

```typescript
import { useEmailModalStore } from '@/components/modals/EmailModal';

// In your component
const { openEmailModal } = useEmailModalStore();

// Open to specific tab
openEmailModal('inbox');
openEmailModal('settings');
openEmailModal('marketing');
```

Or simply click the Email item in UnifiedMenu (admin users only).

## 📊 Test Data Setup

Run these in Supabase SQL Editor to create test data:

```sql
-- Insert test email branding (already has defaults from migration)
UPDATE settings 
SET email_branding = '{
  "use_primary_color": true,
  "use_seo_og_image_as_logo": true,
  "font_family": "Inter, sans-serif",
  "button_border_radius": 12,
  "container_max_width": 600
}'::jsonb
WHERE organization_id = 'YOUR_ORG_ID';

-- Insert test email account (SES for testing)
INSERT INTO email_accounts (organization_id, user_id, provider, email_address, display_name, is_primary, is_active, sync_status)
VALUES (
  'YOUR_ORG_ID',
  'YOUR_USER_ID',
  'ses',
  'noreply@yourdomain.com',
  'Your Company',
  true,
  true,
  'synced'
);

-- Insert test email list
INSERT INTO email_lists (organization_id, name, description, created_by)
VALUES (
  'YOUR_ORG_ID',
  'Newsletter Subscribers',
  'Monthly newsletter recipients',
  'YOUR_USER_ID'
);

-- Insert test subscribers
INSERT INTO email_list_subscribers (organization_id, list_id, email, name, status, source)
SELECT 
  'YOUR_ORG_ID',
  (SELECT id FROM email_lists WHERE name = 'Newsletter Subscribers' LIMIT 1),
  'test' || generate_series || '@example.com',
  'Test User ' || generate_series,
  'subscribed',
  'manual'
FROM generate_series(1, 10);
```

## 🔐 OAuth Configuration

### Gmail Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create OAuth 2.0 credentials
3. Add authorized redirect URI: `https://yourdomain.com/api/auth/gmail/callback`
4. Add scopes: `gmail.readonly`, `gmail.send`, `gmail.modify`
5. Store credentials in environment variables:
   ```
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   ```

### Outlook Setup
1. Go to [Azure Portal](https://portal.azure.com/)
2. Register app in Azure AD
3. Add redirect URI: `https://yourdomain.com/api/auth/outlook/callback`
4. Add permissions: `Mail.Read`, `Mail.Send`, `Mail.ReadWrite`
5. Store credentials in environment variables:
   ```
   MICROSOFT_CLIENT_ID=...
   MICROSOFT_CLIENT_SECRET=...
   ```

## 📁 File Structure

```
src/components/modals/EmailModal/
├── EmailModal.tsx                 # Main modal component
├── EmailModalManager.tsx          # Zustand store
├── types.ts                       # TypeScript definitions
├── index.ts                       # Exports
├── context/
│   └── EmailContext.tsx          # React context provider
├── components/
│   ├── InboxView/
│   │   └── InboxView.tsx         # Inbox tab (Gmail/Outlook)
│   ├── TransactionalView/
│   │   └── TransactionalView.tsx # Transactional logs tab
│   ├── MarketingView/
│   │   └── MarketingView.tsx     # Campaigns & lists tab
│   ├── TemplatesView/
│   │   └── TemplatesView.tsx     # Template management tab
│   └── SettingsView/
│       └── SettingsView.tsx      # Accounts & branding tab
└── services/                      # (To be created)
    ├── GmailService.ts
    ├── OutlookService.ts
    └── SESService.ts
```

## 🎨 Design Notes

- **Glass morphism**: Matches MeetingsModals/UnifiedMenu styling
- **Responsive**: Full-screen on mobile, 95vw on desktop
- **Tab navigation**: Keyboard accessible (Arrow keys, Tab)
- **Realtime updates**: Email threads update live via Supabase subscriptions
- **Loading states**: Skeleton loaders for async data fetching
- **Empty states**: Friendly messages with CTAs when no data

## 🚀 Deployment Checklist

Before deploying to production:

- [ ] Enable RLS on all email tables (already done in migration)
- [ ] Set up OAuth apps for Gmail and Outlook
- [ ] Configure AWS SES (already configured in settings table)
- [ ] Test email sending in staging
- [ ] Set up webhook endpoints for SES bounce/complaint notifications
- [ ] Add rate limiting to email sending APIs
- [ ] Set up monitoring for email queue
- [ ] Create admin alerts for high bounce rates
- [ ] Document email best practices for team
- [ ] Train team on campaign creation

## 📝 Notes

- Email branding defaults to using `settings.primary_color` and `settings.seo_og_image`
- Admins can override with custom values in Settings tab
- RLS policies ensure org-level data isolation
- Triggers automatically update thread/list counts
- Realtime subscriptions keep inbox badge updated
