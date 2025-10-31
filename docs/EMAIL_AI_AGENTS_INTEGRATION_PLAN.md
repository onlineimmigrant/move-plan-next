# Email & AI Agents Integration - Comprehensive Implementation Plan

## Executive Summary

This document provides an **adjusted and corrected** implementation plan for integrating the **existing advanced AI Models system** with the **email infrastructure**, **tickets (support)**, and **meetings (appointments)** modules. The previous agent's analysis missed the sophisticated AI models system already in place.

---

## ✅ What Already Exists

### 1. Advanced AI Models System (ALREADY IMPLEMENTED)

The system has a **mature, production-ready AI models architecture** with three-tier structure:

#### **Database Tables:**

##### `ai_models_system` (System-wide models - Superadmin managed)
```sql
CREATE TABLE ai_models_system (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  task JSONB,
  system_message TEXT NOT NULL,
  api_key TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  max_tokens INTEGER DEFAULT 200,
  icon TEXT,
  organization_types TEXT[] DEFAULT '{}',
  required_plan TEXT DEFAULT 'free',
  token_limit_period TEXT, -- 'daily' | 'weekly' | 'monthly'
  token_limit_amount INTEGER,
  is_free BOOLEAN DEFAULT false,
  is_trial BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  description TEXT,
  tags TEXT[],
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

##### `org_system_model_config` (Organization-level configuration)
```sql
CREATE TABLE org_system_model_config (
  id BIGSERIAL PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  system_model_id BIGINT REFERENCES ai_models_system(id),
  is_enabled_for_users BOOLEAN DEFAULT true,
  token_limit_per_user INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, system_model_id)
);
```

##### `ai_model_usage` (Usage tracking & quota enforcement)
```sql
CREATE TABLE ai_model_usage (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  organization_id UUID REFERENCES organizations(id),
  model_id BIGINT NOT NULL,
  model_type TEXT NOT NULL, -- 'system' | 'org_default' | 'user'
  model_name TEXT,
  tokens_used INTEGER NOT NULL,
  requests_count INTEGER DEFAULT 1,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  period_type TEXT NOT NULL, -- 'daily' | 'weekly' | 'monthly'
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

##### `ai_models_default` (Organization default models - Admin managed)
- Existing table for org-specific AI models
- Referenced throughout the codebase

##### `ai_models` (User-specific models)
- Personal AI models per user
- Referenced in account context

#### **Key Features:**
- ✅ Multi-tier access control (Superadmin → Admin → User)
- ✅ Token usage tracking and quota enforcement
- ✅ Organization-type targeting (immigration, solicitor, education, etc.)
- ✅ Pricing plan gating (free, starter, pro, enterprise)
- ✅ Trial models with expiration
- ✅ Task-based AI workflows (JSONB task definitions)
- ✅ Comprehensive RLS policies
- ✅ UI components at `/admin/ai/management` and `/account/ai`
- ✅ Hooks: `useModelManagement`, `useComboboxFilters`
- ✅ Shared components library at `/components/ai/_shared/`

#### **UI Pages:**
- `/admin/ai/management/page.tsx` - Admin AI model management
- `/account/ai/page.tsx` - User AI model selection
- Includes filtering, search, CRUD operations

### 2. Email System (ALREADY IMPLEMENTED)

#### **Database Table:**
```sql
CREATE TABLE email_template (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255),
  description TEXT,
  html_code TEXT,
  organization_id UUID REFERENCES organizations(id),
  type TEXT, -- 'welcome', 'ticket_confirmation', 'meeting_invitation', etc.
  is_active BOOLEAN DEFAULT false,
  email_main_logo_image TEXT,
  subject TEXT,
  from_email_address_type TEXT CHECK (
    from_email_address_type IN (
      'transactional_email',
      'marketing_email',
      'transactional_email_2',
      'marketing_email_2'
    )
  )
);
```

#### **Key Features:**
- ✅ AWS SES integration for delivery
- ✅ Multi-org email templates
- ✅ Template placeholder system
- ✅ HTML + plain-text multipart emails
- ✅ Unsubscribe functionality
- ✅ Email types: welcome, tickets, meetings, newsletters

#### **Files:**
- `/src/app/api/send-email/route.ts` - Main email sending API
- `/src/emails/` - React Email templates

### 3. Tickets System (Support) (ALREADY IMPLEMENTED)

#### **Key Features:**
- ✅ Ticket creation, response, status tracking
- ✅ Email notifications via `/api/send-email`
- ✅ Admin and user interfaces
- ✅ File attachments support

#### **Files:**
- `/components/modals/TicketsModals/`
- `/app/api/tickets/` - CRUD operations

### 4. Meetings System (Appointments) (ALREADY IMPLEMENTED)

#### **Key Features:**
- ✅ Meeting bookings, instant meetings
- ✅ Waiting room functionality
- ✅ Email invitations
- ✅ Video call integration
- ✅ Meeting transcriptions (with AI model integration!)

#### **Files:**
- `/components/modals/MeetingsModals/`
- `/app/api/meetings/`
- `/database/migrations/create_meeting_transcriptions.sql`

**IMPORTANT:** The `meeting_transcriptions` table already references `ai_models_system`:
```sql
ai_model_id BIGINT REFERENCES ai_models_system(id) ON DELETE SET NULL
```

---

## ❌ What the Previous Agent Got Wrong

1. **Proposed creating `ai_agents` table** - Already exists as `ai_models_system` with superior features
2. **Proposed `ai_agent_conversations` table** - Task system in `ai_models_system.task` already handles this
3. **Proposed `ai_agent_integrations` table** - Model configuration already handles this
4. **Didn't recognize the existing three-tier AI system** (system/org_default/user models)
5. **Suggested adding dependencies already in package.json** (OpenAI already present)
6. **Overlooked the sophisticated token tracking** (`ai_model_usage` table)
7. **Missed the meeting transcriptions AI integration** already in place

---

## 🎯 Adjusted Implementation Plan

### Phase 0: Email Template Management UI (1-2 weeks) ⭐ **STARTING POINT**

**Goal:** Create superadmin and admin interfaces to manage the `email_template` table. This is the **foundation** that all email features build upon.

#### Current State:
- ✅ `email_template` table exists in database
- ✅ `/api/send-email` reads from this table
- ❌ **NO UI to create/edit/manage templates**
- ❌ Admins cannot customize email templates
- ❌ Defaults are hardcoded in `/api/send-email/route.ts`

#### 0.1 Database Migration (if needed)

**Check current schema and add missing columns:**
```sql
-- Ensure all necessary columns exist
ALTER TABLE email_template ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id);
ALTER TABLE email_template ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE email_template ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false;
ALTER TABLE email_template ADD COLUMN IF NOT EXISTS category TEXT; -- 'transactional', 'marketing', 'system'

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_email_template_org_type ON email_template(organization_id, type, is_active);
CREATE INDEX IF NOT EXISTS idx_email_template_category ON email_template(category);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_email_template_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_email_template_updated_at
  BEFORE UPDATE ON email_template
  FOR EACH ROW
  EXECUTE FUNCTION update_email_template_updated_at();

COMMENT ON TABLE email_template IS 'Email templates for transactional and marketing emails. Managed by superadmin and org admins.';
```

#### 0.2 API Endpoints for Template Management

**Create new API routes:**

**`/app/api/email-templates/route.ts`** (List & Create)
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/email-templates - List templates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organization_id = searchParams.get('organization_id');
    const type = searchParams.get('type');
    const category = searchParams.get('category');

    let query = supabase
      .from('email_template')
      .select('*')
      .order('created_at', { ascending: false });

    if (organization_id) {
      query = query.eq('organization_id', organization_id);
    }
    if (type) {
      query = query.eq('type', type);
    }
    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching email templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/email-templates - Create template
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      html_code,
      organization_id,
      type,
      subject,
      from_email_address_type,
      email_main_logo_image,
      category,
      created_by,
    } = body;

    // Validation
    if (!name || !html_code || !organization_id || !type || !subject) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('email_template')
      .insert({
        name,
        description,
        html_code,
        organization_id,
        type,
        subject,
        from_email_address_type: from_email_address_type || 'transactional_email',
        email_main_logo_image,
        category: category || 'transactional',
        is_active: false, // Default to inactive
        created_by,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    console.error('Error creating email template:', error);
    return NextResponse.json(
      { error: 'Failed to create template', details: error.message },
      { status: 500 }
    );
  }
}
```

**`/app/api/email-templates/[id]/route.ts`** (Update & Delete)
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/email-templates/[id] - Get single template
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { data, error } = await supabase
      .from('email_template')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch template', details: error.message },
      { status: 500 }
    );
  }
}

// PATCH /api/email-templates/[id] - Update template
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const { data, error } = await supabase
      .from('email_template')
      .update(body)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to update template', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/email-templates/[id] - Delete template
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { error } = await supabase
      .from('email_template')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to delete template', details: error.message },
      { status: 500 }
    );
  }
}
```

**`/app/api/email-templates/preview/route.ts`** (Preview with placeholders)
```typescript
import { NextRequest, NextResponse } from 'next/server';

// POST /api/email-templates/preview - Preview template with sample data
export async function POST(request: NextRequest) {
  try {
    const { html_code, sample_data } = await request.json();

    // Replace placeholders with sample data
    let previewHtml = html_code;
    Object.entries(sample_data || {}).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      previewHtml = previewHtml.replace(regex, String(value));
    });

    return NextResponse.json({ preview_html: previewHtml }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to generate preview', details: error.message },
      { status: 500 }
    );
  }
}
```

#### 0.3 Admin UI Component for Template Management

**Create: `/components/email/EmailTemplateManager.tsx`**

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useThemeColors } from '@/hooks/useThemeColors';
import Button from '@/ui/Button';

interface EmailTemplate {
  id: number;
  name: string;
  description: string;
  html_code: string;
  type: string;
  subject: string;
  is_active: boolean;
  from_email_address_type: string;
  email_main_logo_image: string;
  category: string;
}

export default function EmailTemplateManager({ organizationId }: { organizationId: string }) {
  const themeColors = useThemeColors();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Fetch templates
  useEffect(() => {
    fetchTemplates();
  }, [organizationId]);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/email-templates?organization_id=${organizationId}`);
      const data = await response.json();
      setTemplates(data);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    } finally {
      setLoading(false);
    }
  };

  // Template type options
  const templateTypes = [
    { value: 'welcome', label: 'Welcome Email' },
    { value: 'reset_email', label: 'Password Reset' },
    { value: 'email_confirmation', label: 'Email Confirmation' },
    { value: 'ticket_confirmation', label: 'Ticket Confirmation' },
    { value: 'ticket_response', label: 'Ticket Response' },
    { value: 'meeting_invitation', label: 'Meeting Invitation' },
    { value: 'newsletter', label: 'Newsletter' },
    { value: 'order_confirmation', label: 'Order Confirmation' },
  ];

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Email Template Manager</h1>
        <Button
          onClick={() => {
            setSelectedTemplate(null);
            setIsEditing(true);
          }}
          style={{ backgroundColor: themeColors.cssVars.primary.base }}
        >
          Create New Template
        </Button>
      </div>

      {/* Template List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div>Loading templates...</div>
        ) : (
          templates.map((template) => (
            <div
              key={template.id}
              className="bg-white rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg transition"
              onClick={() => {
                setSelectedTemplate(template);
                setIsEditing(false);
              }}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-lg">{template.name}</h3>
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    template.is_active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {template.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-2">{template.description}</p>
              <div className="flex gap-2 text-xs">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                  {template.type}
                </span>
                <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded">
                  {template.category}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Editor Modal - would include rich text editor, preview, etc. */}
      {isEditing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">
              {selectedTemplate ? 'Edit Template' : 'Create New Template'}
            </h2>
            {/* Template editor form would go here */}
            <Button onClick={() => setIsEditing(false)}>Close</Button>
          </div>
        </div>
      )}
    </div>
  );
}
```

#### 0.4 Admin Page Integration

**Create: `/app/[locale]/admin/email-templates/page.tsx`**

```typescript
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import EmailTemplateManager from '@/components/email/EmailTemplateManager';

export default function EmailTemplatesAdminPage() {
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchOrganization = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('organization_id')
          .eq('id', user.id)
          .single();
        
        if (profile?.organization_id) {
          setOrganizationId(profile.organization_id);
        }
      }
    };

    fetchOrganization();
  }, []);

  if (!organizationId) {
    return <div>Loading...</div>;
  }

  return <EmailTemplateManager organizationId={organizationId} />;
}
```

#### 0.5 Features to Include in UI

**Template Editor Features:**
1. **Rich HTML Editor** - Monaco Editor or TinyMCE
2. **Placeholder Helper** - List of available placeholders ({{name}}, {{site}}, etc.)
3. **Live Preview** - Preview with sample data
4. **Template Type Selector** - Dropdown for email type
5. **From Address Selector** - Choose transactional/marketing email
6. **Logo Upload** - Upload/select logo image
7. **Subject Line Editor** - With placeholder support
8. **Active/Inactive Toggle** - Enable/disable template
9. **Test Email** - Send test email with sample data
10. **Duplicate Template** - Clone existing template
11. **Version History** - Track template changes
12. **Import/Export** - Share templates across organizations

**Template Library Features:**
1. **Search & Filter** - By type, category, status
2. **Template Categories** - Transactional, Marketing, System
3. **Default Templates** - System-provided templates
4. **Custom Templates** - Organization-specific templates
5. **Template Analytics** - Usage statistics, open rates

#### 0.6 Superadmin Features

**Create: `/app/[locale]/superadmin/email-templates/page.tsx`**

Superadmin should be able to:
1. Create **global default templates** for all organizations
2. View templates across all organizations
3. Set templates as "system defaults"
4. Manage template permissions
5. Monitor template usage across platform

---

### Phase 1: Email Template AI Enhancement (1-2 weeks)

**Goal:** Integrate AI models with email template creation and personalization.

#### 1.1 AI-Powered Email Template Generator

**New Database Table:**
```sql
CREATE TABLE email_template_ai_config (
  id BIGSERIAL PRIMARY KEY,
  email_template_id BIGINT REFERENCES email_template(id) ON DELETE CASCADE,
  ai_model_id BIGINT REFERENCES ai_models_system(id) ON DELETE SET NULL,
  generation_prompt TEXT, -- Prompt template for generating content
  auto_personalize BOOLEAN DEFAULT false, -- Auto-personalize with AI
  personalization_fields JSONB, -- Fields to personalize: ['name', 'company', etc.]
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE email_template_ai_config IS 'Links email templates to AI models for intelligent content generation and personalization';
```

**New API Endpoint:**
```typescript
// /app/api/email/ai-generate/route.ts
export async function POST(request: Request) {
  const { template_id, recipient_data, ai_model_id } = await request.json();
  
  // 1. Fetch AI model from ai_models_system
  // 2. Fetch template configuration
  // 3. Generate personalized content using AI
  // 4. Return generated HTML + subject
}
```

**New UI Component:**
```typescript
// /components/email/AITemplateGenerator.tsx
// Features:
// - Select AI model from ai_models_system
// - Define generation prompts
// - Preview AI-generated content
// - Token usage tracking via ai_model_usage
```

#### 1.2 Email Content Optimization

**New Features:**
- AI-powered subject line optimization
- Content tone adjustment (formal, casual, urgent)
- A/B testing with AI-generated variants
- Smart send-time prediction

**Implementation:**
```typescript
// /lib/email/aiOptimizer.ts
export class EmailAIOptimizer {
  constructor(private modelId: bigint) {}
  
  async optimizeSubjectLine(content: string): Promise<string[]> {
    // Use ai_models_system to generate 5 subject line variants
  }
  
  async adjustTone(content: string, tone: 'formal' | 'casual'): Promise<string> {
    // Transform email content tone
  }
  
  async predictBestSendTime(recipient: Profile): Promise<Date> {
    // Analyze past engagement, predict optimal send time
  }
}
```

### Phase 2: Ticket AI Integration (2-3 weeks)

**Goal:** Enhance support tickets with AI-powered features using existing `ai_models_system`.

#### 2.1 AI Ticket Response Suggestions

**New Database Table:**
```sql
CREATE TABLE ticket_ai_suggestions (
  id BIGSERIAL PRIMARY KEY,
  ticket_id BIGINT REFERENCES tickets(id) ON DELETE CASCADE,
  ai_model_id BIGINT REFERENCES ai_models_system(id) ON DELETE SET NULL,
  suggested_response TEXT NOT NULL,
  confidence_score DECIMAL(3,2), -- 0.00 to 1.00
  used_by_admin BOOLEAN DEFAULT false,
  tokens_used INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ticket_ai_suggestions_ticket ON ticket_ai_suggestions(ticket_id);
CREATE INDEX idx_ticket_ai_suggestions_unused ON ticket_ai_suggestions(ticket_id, used_by_admin) 
  WHERE used_by_admin = false;
```

**New API Endpoint:**
```typescript
// /app/api/tickets/ai-suggest/route.ts
export async function POST(request: Request) {
  const { ticket_id, ai_model_id } = await request.json();
  
  // 1. Fetch ticket content and history
  // 2. Use specified AI model from ai_models_system
  // 3. Generate response suggestions
  // 4. Track usage in ai_model_usage
  // 5. Store suggestions in ticket_ai_suggestions
  
  return { suggestions: [...], confidence_scores: [...] };
}
```

#### 2.2 Automated Ticket Categorization

**Enhancement to existing tickets table:**
```sql
ALTER TABLE tickets ADD COLUMN ai_category TEXT;
ALTER TABLE tickets ADD COLUMN ai_priority TEXT CHECK (ai_priority IN ('low', 'medium', 'high', 'urgent'));
ALTER TABLE tickets ADD COLUMN ai_sentiment TEXT CHECK (ai_sentiment IN ('positive', 'neutral', 'negative'));

CREATE INDEX idx_tickets_ai_category ON tickets(ai_category);
CREATE INDEX idx_tickets_ai_priority ON tickets(ai_priority);
```

**Implementation:**
```typescript
// /lib/tickets/aiCategorizer.ts
export async function categorizeTicket(ticketId: bigint, modelId: bigint) {
  // 1. Fetch ticket content
  // 2. Use AI model to analyze:
  //    - Category (billing, technical, general, etc.)
  //    - Priority (low, medium, high, urgent)
  //    - Sentiment (positive, neutral, negative)
  // 3. Update tickets table
  // 4. Track token usage
}
```

#### 2.3 Smart Ticket Routing

**New Database Table:**
```sql
CREATE TABLE ticket_routing_rules (
  id BIGSERIAL PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  ai_model_id BIGINT REFERENCES ai_models_system(id),
  category TEXT,
  assigned_admin_id UUID REFERENCES profiles(id),
  auto_assign BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Phase 3: Meeting AI Integration (2-3 weeks)

**Goal:** Enhance meetings with AI scheduling, summaries, and follow-ups.

#### 3.1 AI Meeting Scheduler

**Enhancement to existing meetings:**
```sql
CREATE TABLE meeting_ai_scheduling (
  id BIGSERIAL PRIMARY KEY,
  meeting_id BIGINT REFERENCES meetings(id) ON DELETE CASCADE,
  ai_model_id BIGINT REFERENCES ai_models_system(id),
  scheduling_context JSONB, -- User preferences, constraints
  suggested_times JSONB, -- AI-suggested time slots
  reasoning TEXT, -- Why these times were suggested
  accepted_suggestion BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**New API Endpoint:**
```typescript
// /app/api/meetings/ai-schedule/route.ts
export async function POST(request: Request) {
  const { participants, duration, preferences, ai_model_id } = await request.json();
  
  // 1. Fetch participant calendars and availability
  // 2. Use AI to analyze patterns and preferences
  // 3. Suggest optimal meeting times
  // 4. Consider time zones, working hours, past behavior
  
  return { suggested_times: [...], reasoning: "..." };
}
```

#### 3.2 Enhanced Meeting Transcriptions (Building on existing)

**Note:** Meeting transcriptions already reference `ai_models_system(id)`.

**Enhancements:**
```sql
ALTER TABLE meeting_transcriptions ADD COLUMN ai_summary TEXT;
ALTER TABLE meeting_transcriptions ADD COLUMN ai_action_items JSONB;
ALTER TABLE meeting_transcriptions ADD COLUMN ai_key_decisions JSONB;
ALTER TABLE meeting_transcriptions ADD COLUMN ai_sentiment_analysis JSONB;
```

**Implementation:**
```typescript
// /lib/meetings/aiTranscriptionAnalyzer.ts
export async function analyzeMeetingTranscription(transcriptionId: bigint, modelId: bigint) {
  // 1. Fetch transcription text
  // 2. Use AI model to:
  //    - Generate executive summary
  //    - Extract action items with assignees
  //    - Identify key decisions
  //    - Analyze participant sentiment
  // 3. Update meeting_transcriptions table
  // 4. Send follow-up emails with AI summary
}
```

#### 3.3 AI Meeting Follow-Up Emails

**Integration with Email System:**
```typescript
// /lib/meetings/aiFollowUp.ts
export async function generateMeetingFollowUp(meetingId: bigint, aiModelId: bigint) {
  // 1. Fetch meeting details and transcription analysis
  // 2. Use AI to generate personalized follow-up email
  // 3. Include:
  //    - Meeting summary
  //    - Action items per participant
  //    - Next steps
  //    - Resource links
  // 4. Use email system to send via /api/send-email
}
```

### Phase 4: Cross-System AI Orchestration (2-3 weeks)

**Goal:** Create unified AI assistant that works across email, tickets, and meetings.

#### 4.1 Unified AI Context Manager

**New Database Table:**
```sql
CREATE TABLE ai_conversation_context (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  organization_id UUID REFERENCES organizations(id),
  context_type TEXT NOT NULL, -- 'email', 'ticket', 'meeting', 'general'
  context_data JSONB NOT NULL,
  related_email_ids BIGINT[],
  related_ticket_ids BIGINT[],
  related_meeting_ids BIGINT[],
  ai_model_id BIGINT REFERENCES ai_models_system(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_context_user ON ai_conversation_context(user_id, created_at DESC);
CREATE INDEX idx_ai_context_type ON ai_conversation_context(context_type);
```

**Purpose:** Track conversation context across all channels for intelligent assistance.

#### 4.2 AI Communication Hub Component

**New UI Component:**
```typescript
// /components/ai/AICommunicationHub.tsx
export function AICommunicationHub() {
  // Features:
  // - Unified chat interface
  // - Access to email templates, tickets, meetings
  // - Context-aware responses
  // - Quick actions: "Draft reply", "Schedule follow-up", "Create ticket"
  // - Uses ai_models_system for model selection
  // - Token usage tracking
}
```

#### 4.3 AI Workflow Automation

**New Database Table:**
```sql
CREATE TABLE ai_automation_workflows (
  id BIGSERIAL PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  name TEXT NOT NULL,
  description TEXT,
  ai_model_id BIGINT REFERENCES ai_models_system(id),
  trigger_type TEXT NOT NULL, -- 'new_ticket', 'meeting_end', 'email_received'
  trigger_conditions JSONB,
  actions JSONB NOT NULL, -- Array of actions to perform
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Example Workflows:**
1. **New ticket → AI categorize → Auto-assign → Suggest response**
2. **Meeting end → AI transcribe → Generate summary → Email participants**
3. **Email received → AI analyze sentiment → Create ticket if negative → Notify admin**

### Phase 5: Analytics & Optimization (1-2 weeks)

#### 5.1 AI Performance Dashboard

**New Database Table:**
```sql
CREATE TABLE ai_performance_metrics (
  id BIGSERIAL PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  ai_model_id BIGINT REFERENCES ai_models_system(id),
  metric_type TEXT NOT NULL, -- 'response_quality', 'token_efficiency', 'user_satisfaction'
  metric_value DECIMAL(10,2),
  context_type TEXT, -- 'email', 'ticket', 'meeting'
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_performance_org_model ON ai_performance_metrics(organization_id, ai_model_id, recorded_at DESC);
```

#### 5.2 Analytics UI Component

```typescript
// /components/ai/AIPerformanceDashboard.tsx
export function AIPerformanceDashboard() {
  // Display:
  // - Token usage trends per model
  // - Most used AI features
  // - Response quality scores
  // - Cost analysis
  // - Model comparison charts
}
```

---

## 🏗️ Technical Architecture

### Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     AI Models System (Core)                     │
│  ┌────────────────┐  ┌──────────────────┐  ┌────────────────┐  │
│  │ ai_models_     │  │ org_system_      │  │ ai_model_      │  │
│  │ system         │  │ model_config     │  │ usage          │  │
│  │ (Superadmin)   │─▶│ (Admin Control)  │─▶│ (Tracking)     │  │
│  └────────────────┘  └──────────────────┘  └────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Used by
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Communication Channels                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Email      │  │   Tickets    │  │   Meetings   │          │
│  │  Templates   │  │   Support    │  │  Scheduler   │          │
│  │              │  │              │  │              │          │
│  │ - Generate   │  │ - Suggest    │  │ - Schedule   │          │
│  │ - Personalize│  │ - Categorize │  │ - Transcribe │          │
│  │ - Optimize   │  │ - Route      │  │ - Summarize  │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Orchestrated by
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  AI Orchestration Layer                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │            AI Communication Hub Component                 │  │
│  │  - Unified chat interface                                 │  │
│  │  - Context management (ai_conversation_context)           │  │
│  │  - Cross-channel awareness                                │  │
│  │  - Automation workflows (ai_automation_workflows)         │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Monitored by
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Analytics & Reporting                        │
│  - Performance metrics (ai_performance_metrics)                 │
│  - Token usage tracking                                         │
│  - Model comparison                                             │
│  - Cost analysis                                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📋 Implementation Checklist

### Foundation (Already Complete ✅)
- [x] `ai_models_system` table with RLS
- [x] `org_system_model_config` table
- [x] `ai_model_usage` tracking
- [x] Admin UI at `/admin/ai/management`
- [x] Account UI at `/account/ai`
- [x] Email system with AWS SES
- [x] Tickets system with email notifications
- [x] Meetings system with transcriptions

### Phase 0: Email Template Management (To Do) ⭐ **START HERE**
- [ ] Add missing columns to `email_template` table (migration)
- [ ] Create `/api/email-templates` endpoint (GET, POST)
- [ ] Create `/api/email-templates/[id]` endpoint (GET, PATCH, DELETE)
- [ ] Create `/api/email-templates/preview` endpoint
- [ ] Build `EmailTemplateManager` component
- [ ] Add rich HTML editor (Monaco/TinyMCE)
- [ ] Implement placeholder helper UI
- [ ] Add live preview with sample data
- [ ] Create template type selector
- [ ] Add logo upload functionality
- [ ] Implement test email feature
- [ ] Create admin page at `/admin/email-templates`
- [ ] Add search and filtering
- [ ] Create superadmin page at `/superadmin/email-templates`
- [ ] Add template import/export
- [ ] Test template CRUD operations

### Phase 1: Email AI (To Do)
- [ ] Create `email_template_ai_config` table
- [ ] Build `/api/email/ai-generate` endpoint
- [ ] Create `AITemplateGenerator` component
- [ ] Implement `EmailAIOptimizer` class
- [ ] Add AI model selector to email template editor
- [ ] Test AI-generated email templates

### Phase 2: Ticket AI (To Do)
- [ ] Create `ticket_ai_suggestions` table
- [ ] Build `/api/tickets/ai-suggest` endpoint
- [ ] Create AI suggestion UI in admin ticket modal
- [ ] Implement automatic categorization
- [ ] Add sentiment analysis
- [ ] Create smart routing rules

### Phase 3: Meeting AI (To Do)
- [ ] Create `meeting_ai_scheduling` table
- [ ] Build `/api/meetings/ai-schedule` endpoint
- [ ] Enhance transcription analysis
- [ ] Add AI summary generation
- [ ] Implement action item extraction
- [ ] Create follow-up email automation

### Phase 4: Orchestration (To Do)
- [ ] Create `ai_conversation_context` table
- [ ] Create `ai_automation_workflows` table
- [ ] Build `AICommunicationHub` component
- [ ] Implement workflow automation engine
- [ ] Add cross-channel context tracking
- [ ] Create workflow builder UI

### Phase 5: Analytics (To Do)
- [ ] Create `ai_performance_metrics` table
- [ ] Build analytics API endpoints
- [ ] Create `AIPerformanceDashboard` component
- [ ] Add cost tracking and reporting
- [ ] Implement model comparison features

---

## 🔧 Key Differences from Previous Plan

| Previous Agent | Corrected Plan |
|----------------|----------------|
| Create new `ai_agents` table | ✅ Use existing `ai_models_system` |
| Create `ai_agent_conversations` | ✅ Use `ai_models_system.task` JSONB |
| Create `ai_agent_integrations` | ✅ Use `org_system_model_config` |
| Add OpenAI dependency | ✅ Already in package.json |
| Build model management from scratch | ✅ Already exists at `/admin/ai/management` |
| Create token tracking | ✅ Already exists as `ai_model_usage` |
| Build user interface | ✅ Already exists at `/account/ai` |
| Define model types | ✅ Already supports system/org_default/user |

---

## 💡 Key Advantages of This Approach

1. **Leverages Existing Infrastructure:** Builds on mature, battle-tested AI system
2. **No Duplicate Tables:** Avoids creating redundant structures
3. **Consistent Token Tracking:** Unified usage monitoring across all features
4. **Existing RLS Policies:** Security already handled
5. **UI Components Ready:** Admin and account interfaces already built
6. **Three-Tier Access:** Superadmin → Admin → User hierarchy in place
7. **Organization Targeting:** Models can target specific org types
8. **Pricing Plan Integration:** Built-in plan gating
9. **Trial Support:** Free and trial models already supported
10. **Task-Based Workflows:** JSONB task system for complex AI behaviors

---

## 🎯 Success Metrics

- **Email Open Rates:** Increase by 25% with AI-optimized subject lines
- **Ticket Resolution Time:** Reduce by 40% with AI suggestions
- **Meeting Scheduling:** Reduce back-and-forth by 60% with AI scheduler
- **Token Usage:** Stay within budget with efficient model selection
- **User Satisfaction:** Measure feedback on AI features
- **Admin Productivity:** Track time saved with AI assistance

---

## 🚀 Getting Started

### Step 1: Create Email Template Management (Phase 0)

This is your **immediate starting point**:

1. **Create the migration:**
   ```bash
   # Create file: database/migrations/008_enhance_email_template.sql
   # Add columns: created_by, updated_at, is_default, category
   # Add indexes and triggers
   ```

2. **Create API routes:**
   ```bash
   # /app/api/email-templates/route.ts (GET, POST)
   # /app/api/email-templates/[id]/route.ts (GET, PATCH, DELETE)
   # /app/api/email-templates/preview/route.ts (POST)
   ```

3. **Build the UI component:**
   ```bash
   # /components/email/EmailTemplateManager.tsx
   # /components/email/EmailTemplateEditor.tsx
   # /components/email/EmailTemplatePreview.tsx
   ```

4. **Create admin page:**
   ```bash
   # /app/[locale]/admin/email-templates/page.tsx
   ```

5. **Test with existing email types:**
   - welcome, ticket_confirmation, meeting_invitation, etc.
   - Ensure templates override defaults in `/api/send-email`

### Step 2: Review existing AI system
   ```bash
   # Check migrations
   ls -la database/migrations/*ai*
   
   # Review AI components
   ls -la src/components/ai/_shared/
   
   # Check admin UI
   open src/app/[locale]/admin/ai/management/page.tsx
   ```

2. **Start with Phase 1 (Email AI):**
   - Create `email_template_ai_config` migration
   - Build AI template generator API
   - Add AI model selector to email editor

3. **Test with existing models:**
   - Use seeded system models from `006_seed_system_models.sql`
   - Test token tracking with `ai_model_usage`

---

## 📚 Reference Documentation

- **Architecture:** `/docs/SYSTEM_AI_MODELS_ARCHITECTURE.md`
- **Phase 1 Complete:** `/docs/SYSTEM_AI_MODELS_PHASE1_COMPLETE.md`
- **Foundation Plan:** `/docs/SYSTEM_AI_MODELS_FOUNDATION_PLAN.md`
- **Meeting Transcriptions:** `/database/migrations/create_meeting_transcriptions.sql`

---

## 🎓 Conclusion

The existing AI models system (`ai_models_system`, `org_system_model_config`, `ai_model_usage`) provides a solid foundation. Instead of creating new agent tables, we should **extend and integrate** what already exists. This approach:

- ✅ Avoids duplicate infrastructure
- ✅ Maintains consistency across the platform
- ✅ Leverages existing security (RLS policies)
- ✅ Uses proven UI components and hooks
- ✅ Respects the three-tier architecture (system/org/user)
- ✅ Enables rapid development with existing building blocks

**The key insight:** You don't need an "AI agents" module—you already have an advanced AI models system. You just need to connect it to email, tickets, and meetings.
