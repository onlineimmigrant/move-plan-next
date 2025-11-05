# AI Data Extraction Feature - Implementation Guide

## Overview

This feature enables AI agents to automatically extract structured user data from conversations/documents and store it in `ai_user_settings.default_settings` for personalized responses.

## How It Works

### 1. **Automatic Detection**
When a user interacts with an AI model that has a task named "Data for settings" (or system message contains "extract data from the current message"), the system automatically:
- Analyzes the user's message or uploaded document
- Extracts key-value pairs (name, skills, experience, etc.)
- Saves to `ai_user_settings.default_settings` JSONB field

### 2. **Data Flow**

```
User Message/Document
        ↓
AI Chat with "Data for settings" task
        ↓
Auto-extraction triggered
        ↓
AI analyzes content
        ↓
Extracted data saved to ai_user_settings.default_settings
        ↓
Future AI responses use this data for personalization
```

### 3. **Example Use Cases**

#### **CV/Resume Processing**
```
User: "Here's my CV: John Doe, 10 years experience in Python..."
AI Task: "Data for settings"
Extracted: {
  "Full Name": "John Doe",
  "Work Experience": "10 years in Python",
  "Skills": "Python, JavaScript, React",
  ...
}
```

#### **Project Details**
```
User: "Working on a Next.js project, deadline Dec 2025"
Extracted: {
  "Current Project": "Next.js application",
  "Project Deadline": "December 2025"
}
```

---

## Database Schema

### `ai_user_settings` table

```sql
CREATE TABLE public.ai_user_settings (
  id bigint PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  default_model_id bigint,
  user_model_id bigint,
  selected_model_type text,
  organization_id uuid,
  default_settings jsonb DEFAULT '{}'::jsonb,  -- <-- Stores extracted data
  files jsonb DEFAULT '[]'::jsonb
);
```

### `default_settings` JSONB structure

```json
{
  "Full Name": "John Doe",
  "Education": "BS Computer Science, MIT, 2015",
  "Skills": "Python, TypeScript, React, Next.js, PostgreSQL",
  "Work Experience": "Senior Developer at Tech Corp (2018-2024)",
  "Languages": "English, Spanish, French",
  "Certifications": "AWS Certified Solutions Architect",
  "Hobbies": "Tennis, Football, Photography",
  "Location": "San Francisco, CA",
  "LinkedIn": "https://linkedin.com/in/johndoe",
  "Driving Licence": "B, C"
}
```

---

## API Endpoints

### 1. **POST /api/chat/extract-data**

Extract structured data from content.

**Request:**
```json
{
  "content": "I'm John Doe, software engineer with 5 years experience in React and Node.js. I speak English and Spanish.",
  "existingSettings": { "Location": "New York" },
  "extractionHints": ["Full Name", "Skills", "Languages"]
}
```

**Response:**
```json
{
  "extracted": {
    "Full Name": "John Doe",
    "Skills": "React, Node.js",
    "Languages": "English, Spanish",
    "Work Experience": "5 years as software engineer"
  },
  "confidence": "high",
  "summary": "Extracted professional profile information"
}
```

### 2. **GET /api/chat/extract-data**

Get supported extraction fields.

**Response:**
```json
{
  "supportedFields": [
    "Full Name", "Education", "Skills", "Work Experience",
    "Languages", "Certifications", "Hobbies", "Location",
    "Email", "Phone", "LinkedIn", "GitHub", "Portfolio",
    "Driving Licence", "Nationality", ...
  ],
  "description": "Extract structured user data for personalized AI responses"
}
```

### 3. **POST /api/chat/settings**

Manually manage default_settings.

**Add/Update:**
```json
{
  "action": "add",
  "settingKey": "Skills",
  "settingValue": "Python, JavaScript, Docker"
}
```

**Delete:**
```json
{
  "action": "delete",
  "settingKey": "Skills"
}
```

---

## Setting Up Data Extraction

### Step 1: Create AI Model with Data Extraction Task

**Via Admin Panel** (`/admin/ai/management`):

1. Select or create an AI model (GPT-4, Grok, Claude recommended)
2. Click "Edit Tasks"
3. Add new task:
   - **Name:** `Data for settings`
   - **System Message:** `Extract structured data from the user's message or document. Focus on professional information like name, education, skills, experience, languages, certifications, and contact details. Output as key-value pairs.`
4. Save

**Via Database:**
```sql
UPDATE ai_models_default
SET task = jsonb_insert(
  COALESCE(task, '[]'::jsonb),
  '{-1}',
  '{
    "name": "Data for settings",
    "system_message": "Extract structured data from the user message or document for ai_user_settings.default_settings. Focus on: Full Name, Education, Skills, Work Experience, Languages, Certifications, Hobbies, Location, Contact Info."
  }'::jsonb
)
WHERE id = YOUR_MODEL_ID;
```

### Step 2: Test Data Extraction

1. Open chat widget
2. Select model with "Data for settings" task
3. Click task dropdown → Select "Data for settings"
4. Send message with personal/professional info:
   ```
   I'm Jane Smith, a senior full-stack developer with 8 years of experience. 
   I'm proficient in React, Node.js, PostgreSQL, and AWS. I speak English 
   and German fluently. I have a BS in Computer Science from Stanford (2015) 
   and AWS Solutions Architect certification.
   ```
5. AI extracts and auto-saves data to `default_settings`

### Step 3: Verify Extraction

**Via Database:**
```sql
SELECT 
  p.email,
  aus.default_settings
FROM ai_user_settings aus
JOIN profiles p ON p.id = aus.user_id
WHERE p.email = 'user@example.com';
```

**Via Settings Modal:**
- Chat widget → Dropdown → "Manage Settings"
- View extracted data
- Edit/delete as needed

---

## Auto-Extraction Logic

### Trigger Conditions

Auto-extraction activates when:
1. User sends message to AI
2. AI model has task matching:
   - Task name contains: `"data for settings"` (case-insensitive)
   - OR system_message contains: `"extract data from the current message"`

### Extraction Process

```typescript
// In /src/app/api/chat/route.ts

// 1. Check if task triggers extraction
const isDataExtractionTask = task && task.some((t: Task) => 
  t.name.toLowerCase().includes('data for settings') || 
  t.system_message.toLowerCase().includes('extract data from the current message')
);

// 2. After AI responds, trigger extraction
if (isDataExtractionTask && aiResponseContent) {
  await autoExtractAndSaveData(
    user.id, 
    userMessage, 
    existingSettings
  );
}

// 3. autoExtractAndSaveData function:
// - Calls extraction model (GPT/Grok/Claude)
// - Parses JSON response
// - Merges with existing settings
// - Saves to database
```

### Supported Extraction Fields

**Professional:**
- Full Name
- Education
- Work Experience
- Skills (comma-separated)
- Professional Summary

**Personal:**
- Languages
- Hobbies
- Location
- Nationality
- Date of Birth

**Contact:**
- Email
- Phone
- LinkedIn
- GitHub
- Portfolio

**Documents:**
- Certifications
- Driving Licence
- Publications
- Awards
- References

---

## Using Extracted Data in AI Responses

### Automatic Injection

When `useSettings: true` in chat request, `default_settings` automatically injected into system prompt:

```typescript
// System message construction
let fullSystemMessage = model.system_message;

if (useSettings && settings.default_settings) {
  const settingsText = Object.entries(settings.default_settings)
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n');
  fullSystemMessage += `\n${settingsText}`;
}

// AI receives:
// "You are a helpful assistant.
// Full Name: John Doe
// Skills: Python, JavaScript, React
// Experience: 5 years"
```

### Example Personalized Response

**Without extraction:**
```
User: "Create a CV for me"
AI: "Please provide your name, education, experience..."
```

**With extraction:**
```
User: "Create a CV for me"
AI: "Here's your CV:

JOHN DOE
Senior Software Engineer

SKILLS
Python, JavaScript, React, Node.js, PostgreSQL

EXPERIENCE
10 years in software development
..."
```

---

## UI Components

### ExtractedDataModal

Shows extracted data for user review before saving.

**Features:**
- ✅ View all extracted fields
- ✅ Edit values inline
- ✅ Delete unwanted fields
- ✅ Save/discard changes
- ✅ Dark mode support

**Usage:**
```tsx
import ExtractedDataModal from '@/components/modals/ChatWidget/ExtractedDataModal';

<ExtractedDataModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  extractedData={extractedData}
  onSave={async (data) => {
    await saveSettings(data);
  }}
  onDiscard={() => {
    setShowModal(false);
  }}
/>
```

### SettingsModal

Existing modal for manual settings management.

**Location:** `/src/components/modals/ChatWidget/SettingsModal.tsx`

---

## Common Practices & Patterns

### 1. **ChatGPT Memory Pattern**
OpenAI's approach: Implicit extraction, transparent to user.
- ✅ **Pros:** Seamless, no user action needed
- ❌ **Cons:** Privacy concerns, no control

**Our approach:** Explicit with optional review.

### 2. **CRM Enrichment Pattern**
Salesforce, HubSpot: Manual form + auto-enrichment.
- ✅ **Pros:** User control, accurate data
- ❌ **Cons:** Requires user input

**Our approach:** Auto-extract from natural conversation.

### 3. **Personal Assistant Pattern**
Apple Siri, Google Assistant: Context from usage.
- ✅ **Pros:** Learns preferences over time
- ❌ **Cons:** Implicit, hard to edit

**Our approach:** Explicit storage, easy to edit/delete.

---

## Best Practices

### For Administrators

1. **Use capable models for extraction:**
   - ✅ GPT-4, GPT-4o (best for structured output)
   - ✅ Grok-3, Grok-4 (fast, good quality)
   - ✅ Claude-3.5 Sonnet (excellent accuracy)
   - ❌ Avoid: Llama, Mixtral (less consistent)

2. **Clear task instructions:**
   ```
   Extract ONLY factual information from the user's message.
   Focus on: Name, Education, Skills, Experience, Languages.
   Use clear key names. Format lists as comma-separated values.
   ```

3. **Monitor extraction quality:**
   - Review extracted data periodically
   - Check for duplicates or inconsistencies
   - Update extraction prompts if needed

### For Users

1. **Provide clear information:**
   ```
   ✅ "I'm John Doe, software engineer with 5 years experience in React"
   ❌ "I work with computers and stuff"
   ```

2. **Use dedicated task:**
   - Select "Data for settings" task before sending profile info
   - Ensures extraction is triggered

3. **Review extracted data:**
   - Check Settings modal after extraction
   - Edit/delete incorrect fields
   - Add missing information manually

---

## Troubleshooting

### Problem: Data not extracted

**Causes:**
1. Task not configured correctly
2. Model doesn't support extraction
3. Content too vague

**Solutions:**
```sql
-- Check task configuration
SELECT name, task
FROM ai_models_default
WHERE id = YOUR_MODEL_ID;

-- Ensure task exists and named correctly
-- Task name should contain "data for settings"
```

### Problem: Incorrect data extracted

**Causes:**
1. Ambiguous content
2. Low-quality model
3. Poor extraction prompt

**Solutions:**
- Use clearer language in messages
- Switch to GPT-4 or Claude for extraction
- Update task system_message with better instructions

### Problem: Data not used in responses

**Causes:**
1. `useSettings` not enabled
2. `default_settings` empty
3. Model ignoring settings

**Solutions:**
```typescript
// Ensure useSettings is true in chat request
const response = await axios.post('/api/chat', {
  messages: [...],
  useSettings: true  // <-- Must be true
});

// Check if settings exist
SELECT default_settings FROM ai_user_settings WHERE user_id = 'xxx';
```

---

## Security & Privacy

### Data Protection

1. **RLS Policies:** Users can only access their own settings
2. **No cross-user leaks:** Extraction scoped to user_id
3. **Opt-out:** Users can delete all settings anytime

### GDPR Compliance

```sql
-- Delete user's extracted data (GDPR Right to Erasure)
UPDATE ai_user_settings
SET default_settings = '{}'::jsonb
WHERE user_id = 'user-uuid';

-- Export user's data (GDPR Right to Access)
SELECT default_settings
FROM ai_user_settings
WHERE user_id = 'user-uuid';
```

---

## Future Enhancements

### Planned Features

1. **Manual review UI:**
   - Show extracted data before auto-saving
   - User confirmation required

2. **Extraction confidence scoring:**
   - Low confidence → require review
   - High confidence → auto-save

3. **Field templates:**
   - Pre-defined schemas (CV, Project Info, etc.)
   - Custom extraction templates per organization

4. **Incremental updates:**
   - Track field history/versions
   - Undo incorrect extractions

5. **Smart merging:**
   - Detect conflicts (old vs new data)
   - Ask user which to keep

---

## Testing

### Manual Test Flow

1. Create test user
2. Configure model with "Data for settings" task
3. Send test message:
   ```
   Hi, I'm Test User. I'm a software developer with 3 years 
   experience in Python and JavaScript. I speak English and 
   French. I have a BS in Computer Science.
   ```
4. Check database:
   ```sql
   SELECT default_settings FROM ai_user_settings 
   WHERE user_id = 'test-user-id';
   ```
5. Expected result:
   ```json
   {
     "Full Name": "Test User",
     "Skills": "Python, JavaScript",
     "Languages": "English, French",
     "Work Experience": "3 years as software developer",
     "Education": "BS in Computer Science"
   }
   ```

### Automated Testing

```typescript
// Test extraction API
describe('POST /api/chat/extract-data', () => {
  it('should extract data from CV text', async () => {
    const response = await fetch('/api/chat/extract-data', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${testToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: "I'm John Doe, Python developer...",
      }),
    });
    
    const data = await response.json();
    expect(data.extracted).toHaveProperty('Full Name', 'John Doe');
    expect(data.extracted).toHaveProperty('Skills');
    expect(data.confidence).toBe('high');
  });
});
```

---

## Summary

✅ **Automatic extraction** from conversations/documents  
✅ **Structured storage** in JSONB field  
✅ **AI personalization** using extracted data  
✅ **User control** via settings modal  
✅ **Privacy-focused** with RLS policies  
✅ **Production-ready** with error handling  

**Key Files:**
- `/src/app/api/chat/extract-data/route.ts` - Extraction endpoint
- `/src/app/api/chat/route.ts` - Auto-extraction logic
- `/src/app/api/chat/settings/route.ts` - Manual settings management
- `/src/components/modals/ChatWidget/ExtractedDataModal.tsx` - Review UI

**Database:**
- `ai_user_settings.default_settings` - JSONB storage for extracted data

---

## Questions or Issues?

- Check logs: `logs/api.log`
- Review console: Browser DevTools → Console
- Database: Check `ai_user_settings` table
- Support: See troubleshooting section above
