# Phase 0: Email Template Management - Implementation Guide

## 🎯 Objective

Create a comprehensive UI for superadmins and admins to manage email templates stored in the `email_template` table. This is the **foundation** for all email functionality.

---

## 📊 Current State Analysis

### What Exists ✅
- `email_template` table in database
- `/api/send-email` reads templates from this table
- Fallback to hardcoded templates if none found
- Email sending works via AWS SES

### What's Missing ❌
- **No UI to create/edit templates**
- **No API endpoints for CRUD operations**
- Admins must manually insert templates via SQL
- No template preview capability
- No placeholder documentation
- No template testing features

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Email Template System                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Database Layer                          │
│  ┌────────────────────────────────────────────────────┐    │
│  │  email_template                                     │    │
│  │  - id, name, description                           │    │
│  │  - html_code, subject, type                        │    │
│  │  - organization_id, is_active                      │    │
│  │  - from_email_address_type                         │    │
│  │  - email_main_logo_image                           │    │
│  │  - created_by, created_at, updated_at              │    │
│  │  - category (transactional/marketing/system)       │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Layer                              │
│  ┌──────────────────────────────────────────────────┐      │
│  │  /api/email-templates (GET, POST)                │      │
│  │  /api/email-templates/[id] (GET, PATCH, DELETE)  │      │
│  │  /api/email-templates/preview (POST)             │      │
│  │  /api/email-templates/test (POST)                │      │
│  └──────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Component Layer                           │
│  ┌──────────────────────────────────────────────────┐      │
│  │  EmailTemplateManager (Main Container)           │      │
│  │  ├── EmailTemplateList                           │      │
│  │  ├── EmailTemplateEditor                         │      │
│  │  ├── EmailTemplatePreview                        │      │
│  │  ├── PlaceholderHelper                           │      │
│  │  └── TestEmailDialog                             │      │
│  └──────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      UI Pages                               │
│  /admin/email-templates         (Organization admin)       │
│  /superadmin/email-templates    (Platform superadmin)      │
└─────────────────────────────────────────────────────────────┘
```

---

## 📝 Implementation Steps

### Step 1: Database Migration

**File:** `database/migrations/008_enhance_email_template.sql`

```sql
-- ============================================================================
-- Migration: Enhance email_template table
-- Description: Add missing columns for template management UI
-- Date: 2025-10-30
-- ============================================================================

-- Add new columns if they don't exist
ALTER TABLE email_template 
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE email_template 
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE email_template 
  ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false;

ALTER TABLE email_template 
  ADD COLUMN IF NOT EXISTS category TEXT CHECK (category IN ('transactional', 'marketing', 'system'));

-- Set default category for existing rows
UPDATE email_template 
SET category = 'transactional' 
WHERE category IS NULL;

-- Add helpful indexes
CREATE INDEX IF NOT EXISTS idx_email_template_org_type 
  ON email_template(organization_id, type, is_active);

CREATE INDEX IF NOT EXISTS idx_email_template_category 
  ON email_template(category);

CREATE INDEX IF NOT EXISTS idx_email_template_created_by 
  ON email_template(created_by);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_email_template_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_email_template_updated_at ON email_template;

CREATE TRIGGER trigger_email_template_updated_at
  BEFORE UPDATE ON email_template
  FOR EACH ROW
  EXECUTE FUNCTION update_email_template_updated_at();

-- Add helpful comments
COMMENT ON TABLE email_template IS 'Email templates for transactional and marketing emails. Managed by superadmin and org admins.';
COMMENT ON COLUMN email_template.created_by IS 'Profile ID of user who created this template';
COMMENT ON COLUMN email_template.is_default IS 'If true, this is a system default template provided by the platform';
COMMENT ON COLUMN email_template.category IS 'Template category: transactional (automated), marketing (campaigns), system (platform emails)';
COMMENT ON COLUMN email_template.from_email_address_type IS 'Which email address to use from settings table';

-- Insert some default templates for common email types
DO $$
BEGIN
  -- Only insert if table is empty or has no defaults
  IF NOT EXISTS (SELECT 1 FROM email_template WHERE is_default = true) THEN
    
    -- Get default organization ID (you may need to adjust this)
    INSERT INTO email_template (
      name, 
      description, 
      type, 
      subject, 
      html_code,
      organization_id,
      from_email_address_type,
      category,
      is_default,
      is_active
    ) VALUES 
    (
      'Welcome Email (Default)',
      'Default welcome email sent to new users',
      'welcome',
      'Welcome to {{site}}!',
      '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="text-align: center; padding: 20px; background: #4F46E5; color: white; border-radius: 8px 8px 0 0;">
      <img src="{{email_main_logo_image}}" alt="{{site}}" style="max-width: 150px; height: auto;">
    </div>
    <div style="padding: 30px; background: white; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
      <h1 style="color: #4F46E5;">Welcome, {{name}}!</h1>
      <p>Thank you for joining {{site}}. We''re excited to have you on board!</p>
      <p>Get started by exploring your account:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{emailDomainRedirection}}" style="display: inline-block; padding: 12px 24px; background: #4F46E5; color: white; text-decoration: none; border-radius: 5px;">Get Started</a>
      </div>
      <p style="color: #6B7280; font-size: 14px;">If you have any questions, feel free to reach out to our support team.</p>
    </div>
    <div style="text-align: center; padding: 20px; color: #6B7280; font-size: 12px;">
      <p>&copy; 2025 {{site}}. All rights reserved.</p>
      <p>{{address}}</p>
      <p><a href="{{privacyPolicyUrl}}" style="color: #4F46E5;">Privacy Policy</a> | <a href="{{unsubscribeUrl}}" style="color: #4F46E5;">Unsubscribe</a></p>
    </div>
  </div>
</body>
</html>',
      (SELECT id FROM organizations LIMIT 1), -- Adjust as needed
      'transactional_email',
      'transactional',
      true,
      false -- Inactive by default, admin must activate
    );
    
    RAISE NOTICE 'Inserted default email template';
  END IF;
END $$;
```

**Run the migration:**
```bash
# In Supabase SQL Editor or via CLI
psql -d your_database -f database/migrations/008_enhance_email_template.sql
```

---

### Step 2: API Endpoints

#### 2.1 List & Create Templates

**File:** `src/app/api/email-templates/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * GET /api/email-templates
 * List all email templates for an organization
 * Query params: organization_id, type, category, is_active
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organization_id = searchParams.get('organization_id');
    const type = searchParams.get('type');
    const category = searchParams.get('category');
    const is_active = searchParams.get('is_active');

    // Validate organization_id is provided
    if (!organization_id) {
      return NextResponse.json(
        { error: 'organization_id is required' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('email_template')
      .select(`
        *,
        created_by_profile:profiles!email_template_created_by_fkey(full_name, email)
      `)
      .eq('organization_id', organization_id)
      .order('created_at', { ascending: false });

    if (type) {
      query = query.eq('type', type);
    }
    if (category) {
      query = query.eq('category', category);
    }
    if (is_active) {
      query = query.eq('is_active', is_active === 'true');
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching email templates:', error);
      throw error;
    }

    return NextResponse.json(data || [], { status: 200 });
  } catch (error: any) {
    console.error('Error in GET /api/email-templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/email-templates
 * Create a new email template
 */
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
      is_active,
    } = body;

    // Validation
    if (!name || !html_code || !organization_id || !type || !subject) {
      return NextResponse.json(
        { error: 'Missing required fields: name, html_code, organization_id, type, subject' },
        { status: 400 }
      );
    }

    // Validate from_email_address_type
    const validFromTypes = ['transactional_email', 'marketing_email', 'transactional_email_2', 'marketing_email_2'];
    if (from_email_address_type && !validFromTypes.includes(from_email_address_type)) {
      return NextResponse.json(
        { error: 'Invalid from_email_address_type' },
        { status: 400 }
      );
    }

    // Validate category
    const validCategories = ['transactional', 'marketing', 'system'];
    if (category && !validCategories.includes(category)) {
      return NextResponse.json(
        { error: 'Invalid category. Must be: transactional, marketing, or system' },
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
        email_main_logo_image: email_main_logo_image || null,
        category: category || 'transactional',
        is_active: is_active !== undefined ? is_active : false,
        is_default: false, // User-created templates are never defaults
        created_by,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating email template:', error);
      throw error;
    }

    console.log('Successfully created email template:', data.id);
    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/email-templates:', error);
    return NextResponse.json(
      { error: 'Failed to create template', details: error.message },
      { status: 500 }
    );
  }
}
```

#### 2.2 Get, Update & Delete Single Template

**File:** `src/app/api/email-templates/[id]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * GET /api/email-templates/[id]
 * Get a single email template by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const { data, error } = await supabase
      .from('email_template')
      .select(`
        *,
        created_by_profile:profiles!email_template_created_by_fkey(full_name, email)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching email template:', error);
      throw error;
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error('Error in GET /api/email-templates/[id]:', error);
    return NextResponse.json(
      { error: 'Failed to fetch template', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/email-templates/[id]
 * Update an email template
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Remove fields that shouldn't be updated
    delete body.id;
    delete body.created_at;
    delete body.created_by;
    delete body.is_default; // Defaults can't be changed via API

    const { data, error } = await supabase
      .from('email_template')
      .update(body)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating email template:', error);
      throw error;
    }

    console.log('Successfully updated email template:', id);
    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error('Error in PATCH /api/email-templates/[id]:', error);
    return NextResponse.json(
      { error: 'Failed to update template', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/email-templates/[id]
 * Delete an email template
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if it's a default template (can't be deleted)
    const { data: template } = await supabase
      .from('email_template')
      .select('is_default')
      .eq('id', id)
      .single();

    if (template?.is_default) {
      return NextResponse.json(
        { error: 'Cannot delete default templates' },
        { status: 403 }
      );
    }

    const { error } = await supabase
      .from('email_template')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting email template:', error);
      throw error;
    }

    console.log('Successfully deleted email template:', id);
    return NextResponse.json({ success: true, message: 'Template deleted' }, { status: 200 });
  } catch (error: any) {
    console.error('Error in DELETE /api/email-templates/[id]:', error);
    return NextResponse.json(
      { error: 'Failed to delete template', details: error.message },
      { status: 500 }
    );
  }
}
```

#### 2.3 Preview Template

**File:** `src/app/api/email-templates/preview/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/email-templates/preview
 * Preview an email template with sample data
 */
export async function POST(request: NextRequest) {
  try {
    const { html_code, sample_data, subject } = await request.json();

    if (!html_code) {
      return NextResponse.json(
        { error: 'html_code is required' },
        { status: 400 }
      );
    }

    // Default sample data if none provided
    const defaultSampleData = {
      name: 'John Doe',
      site: 'Your Platform',
      emailDomainRedirection: 'https://example.com/account',
      privacyPolicyUrl: 'https://example.com/privacy',
      unsubscribeUrl: 'https://example.com/unsubscribe',
      address: '123 Main St, City, State 12345',
      email_main_logo_image: 'https://via.placeholder.com/150x50?text=Logo',
    };

    const mergedSampleData = { ...defaultSampleData, ...sample_data };

    // Replace placeholders with sample data
    let previewHtml = html_code;
    let previewSubject = subject || '';

    Object.entries(mergedSampleData).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      previewHtml = previewHtml.replace(regex, String(value));
      previewSubject = previewSubject.replace(regex, String(value));
    });

    return NextResponse.json({
      preview_html: previewHtml,
      preview_subject: previewSubject,
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error in POST /api/email-templates/preview:', error);
    return NextResponse.json(
      { error: 'Failed to generate preview', details: error.message },
      { status: 500 }
    );
  }
}
```

#### 2.4 Send Test Email

**File:** `src/app/api/email-templates/test/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/email-templates/test
 * Send a test email using a template
 */
export async function POST(request: NextRequest) {
  try {
    const { template_id, test_email, sample_data, organization_id } = await request.json();

    if (!test_email || !organization_id) {
      return NextResponse.json(
        { error: 'test_email and organization_id are required' },
        { status: 400 }
      );
    }

    // Call the existing send-email API
    const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'test', // Special type for test emails
        to: test_email,
        organization_id,
        name: sample_data?.name || 'Test User',
        emailDomainRedirection: sample_data?.emailDomainRedirection || 'https://example.com',
        placeholders: sample_data || {},
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json();
      throw new Error(errorData.error || 'Failed to send test email');
    }

    return NextResponse.json({ success: true, message: 'Test email sent' }, { status: 200 });
  } catch (error: any) {
    console.error('Error in POST /api/email-templates/test:', error);
    return NextResponse.json(
      { error: 'Failed to send test email', details: error.message },
      { status: 500 }
    );
  }
}
```

---

### Step 3: UI Components

#### 3.1 Main Template Manager Component

**File:** `src/components/email/EmailTemplateManager.tsx`

This is a large component, so I'll provide a simplified version with key features:

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useThemeColors } from '@/hooks/useThemeColors';
import Button from '@/ui/Button';
import EmailTemplateEditor from './EmailTemplateEditor';
import EmailTemplatePreview from './EmailTemplatePreview';

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
  created_at: string;
  updated_at: string;
  is_default: boolean;
}

interface Props {
  organizationId: string;
  userId: string;
}

export default function EmailTemplateManager({ organizationId, userId }: Props) {
  const themeColors = useThemeColors();
  const primary = themeColors.cssVars.primary;

  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [filter, setFilter] = useState({ type: '', category: '', is_active: '' });

  useEffect(() => {
    fetchTemplates();
  }, [organizationId, filter]);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        organization_id: organizationId,
        ...Object.fromEntries(Object.entries(filter).filter(([_, v]) => v !== '')),
      });

      const response = await fetch(`/api/email-templates?${queryParams}`);
      if (!response.ok) throw new Error('Failed to fetch templates');
      
      const data = await response.json();
      setTemplates(data);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setSelectedTemplate(null);
    setIsEditing(true);
  };

  const handleEdit = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setIsEditing(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const response = await fetch(`/api/email-templates/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete template');
      
      fetchTemplates(); // Refresh list
    } catch (error) {
      console.error('Failed to delete template:', error);
      alert('Failed to delete template');
    }
  };

  const handleToggleActive = async (template: EmailTemplate) => {
    try {
      const response = await fetch(`/api/email-templates/${template.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !template.is_active }),
      });

      if (!response.ok) throw new Error('Failed to update template');
      
      fetchTemplates(); // Refresh list
    } catch (error) {
      console.error('Failed to toggle template:', error);
    }
  };

  const handleSave = async (templateData: Partial<EmailTemplate>) => {
    try {
      const url = selectedTemplate
        ? `/api/email-templates/${selectedTemplate.id}`
        : '/api/email-templates';
      
      const method = selectedTemplate ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...templateData,
          organization_id: organizationId,
          created_by: userId,
        }),
      });

      if (!response.ok) throw new Error('Failed to save template');
      
      setIsEditing(false);
      fetchTemplates(); // Refresh list
    } catch (error) {
      console.error('Failed to save template:', error);
      alert('Failed to save template');
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Email Templates</h1>
        <Button
          onClick={handleCreateNew}
          style={{ backgroundColor: primary.base }}
        >
          + Create New Template
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-4">
        <select
          value={filter.type}
          onChange={(e) => setFilter({ ...filter, type: e.target.value })}
          className="border rounded px-3 py-2"
        >
          <option value="">All Types</option>
          <option value="welcome">Welcome</option>
          <option value="ticket_confirmation">Ticket Confirmation</option>
          <option value="meeting_invitation">Meeting Invitation</option>
          <option value="newsletter">Newsletter</option>
        </select>

        <select
          value={filter.category}
          onChange={(e) => setFilter({ ...filter, category: e.target.value })}
          className="border rounded px-3 py-2"
        >
          <option value="">All Categories</option>
          <option value="transactional">Transactional</option>
          <option value="marketing">Marketing</option>
          <option value="system">System</option>
        </select>

        <select
          value={filter.is_active}
          onChange={(e) => setFilter({ ...filter, is_active: e.target.value })}
          className="border rounded px-3 py-2"
        >
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>

      {/* Template List */}
      {loading ? (
        <div className="text-center py-12">Loading templates...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <div
              key={template.id}
              className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-lg">{template.name}</h3>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    template.is_active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {template.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {template.description}
              </p>

              <div className="flex flex-wrap gap-2 mb-3">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                  {template.type}
                </span>
                <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                  {template.category}
                </span>
                {template.is_default && (
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">
                    Default
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(template)}
                  className="flex-1 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleToggleActive(template)}
                  className="flex-1 px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
                >
                  {template.is_active ? 'Deactivate' : 'Activate'}
                </button>
                {!template.is_default && (
                  <button
                    onClick={() => handleDelete(template.id)}
                    className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}

          {templates.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500">
              No templates found. Create your first template to get started!
            </div>
          )}
        </div>
      )}

      {/* Editor Modal */}
      {isEditing && (
        <EmailTemplateEditor
          template={selectedTemplate}
          onSave={handleSave}
          onCancel={() => setIsEditing(false)}
          organizationId={organizationId}
        />
      )}
    </div>
  );
}
```

---

### Step 4: Admin Page

**File:** `src/app/[locale]/admin/email-templates/page.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import EmailTemplateManager from '@/components/email/EmailTemplateManager';

export default function EmailTemplatesAdminPage() {
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        setUserId(user.id);
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('organization_id, role')
          .eq('id', user.id)
          .single();
        
        if (profile?.organization_id) {
          setOrganizationId(profile.organization_id);
        }
      }
      
      setLoading(false);
    };

    fetchUserData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!organizationId || !userId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-red-500">
          Error: Unable to load organization data
        </div>
      </div>
    );
  }

  return <EmailTemplateManager organizationId={organizationId} userId={userId} />;
}
```

---

## 🎨 Key Features Summary

### Template Management
- ✅ Create, read, update, delete templates
- ✅ Activate/deactivate templates
- ✅ Filter by type, category, status
- ✅ Default system templates

### Template Editor
- 📝 HTML code editor (Monaco/TinyMCE recommended)
- 👁️ Live preview with sample data
- 🏷️ Placeholder helper/documentation
- 📧 Test email functionality
- 🎨 Logo upload
- 📋 Subject line editor

### Organization Features
- 🏢 Organization-specific templates
- 👤 Track template creators
- 📊 Template usage analytics (future)
- 🔒 Permission management

### Superadmin Features
- 🌐 Global default templates
- 👥 View all organization templates
- 🔧 System template management

---

## ✅ Testing Checklist

- [ ] Create a new template via UI
- [ ] Edit existing template
- [ ] Delete non-default template
- [ ] Cannot delete default template
- [ ] Activate/deactivate template
- [ ] Preview template with placeholders
- [ ] Send test email
- [ ] Filter templates by type
- [ ] Filter templates by category
- [ ] Template appears in `/api/send-email` when active
- [ ] Fallback to default when no custom template

---

## 🚀 Next Steps After Phase 0

Once email template management is complete:

1. **Phase 1:** Add AI template generation
2. **Phase 2:** Integrate with ticket system
3. **Phase 3:** Enhance meetings integration
4. **Phase 4:** Build automation workflows
5. **Phase 5:** Add analytics dashboard

---

## 📚 Reference Files

- Database: `database/migrations/008_enhance_email_template.sql`
- API: `src/app/api/email-templates/`
- Components: `src/components/email/`
- Admin Page: `src/app/[locale]/admin/email-templates/`
- Existing Email API: `src/app/api/send-email/route.ts`
