# AI Model Management - Complete Guide

Welcome to the heart of Coded Harmony Business OS—the AI Model Management system. This comprehensive guide will help you understand, configure, and master the three-tier AI architecture that powers your intelligent business operations.

**What You'll Learn:**
- How the three-tier AI system works
- Selecting and enabling AI models
- Creating custom AI agents for your business
- Building task-based workflows
- Managing tokens and quotas
- Analyzing AI usage and performance

**Estimated Reading Time**: 30-40 minutes  
**Skill Level**: Beginner to Advanced

---

## Table of Contents

1. [Understanding the AI System](#understanding-the-ai-system)
2. [System Models (Tier 1)](#system-models-tier-1)
3. [Organization Models (Tier 2)](#organization-models-tier-2)
4. [User Models (Tier 3)](#user-models-tier-3)
5. [Selecting AI Models](#selecting-ai-models)
6. [Creating Custom AI Agents](#creating-custom-ai-agents)
7. [Task-Based Workflows](#task-based-workflows)
8. [Token Management & Quotas](#token-management--quotas)
9. [AI Usage Analytics](#ai-usage-analytics)
10. [Best Practices & Tips](#best-practices--tips)
11. [Troubleshooting](#troubleshooting)

---

## Understanding the AI System

### The Big Picture: Why Three Tiers?

Coded Harmony's AI system is designed like a well-organized company: there's global infrastructure (System Models), department-specific tools (Organization Models), and personal productivity aids (User Models). This architecture ensures:

- **Governance**: Control who can access which AI capabilities
- **Flexibility**: Customize AI for your specific needs
- **Cost Control**: Manage usage with quotas and limits
- **Scalability**: Add new models without disrupting existing workflows
- **Security**: Maintain compliance and data protection

### The Three-Tier Architecture Explained

```
┌─────────────────────────────────────────────────────────────┐
│  TIER 1: SYSTEM MODELS                                      │
│  Managed by: Platform Superadmins (Coded Harmony)           │
│  Purpose: Production-ready AI models for all organizations  │
│  Examples: GPT-4, Claude 3, Grok, Gemini, DeepSeek         │
│  Count: 28+ pre-configured models                           │
│  Configuration: Global settings, pricing tiers              │
└──────────────────────────┬──────────────────────────────────┘
                           │
          Organizations enable and customize
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  TIER 2: ORGANIZATION MODELS                                │
│  Managed by: Organization Admins                            │
│  Purpose: Custom AI agents for your business                │
│  Examples: Brand voice AI, workflow agents, specialists     │
│  Configuration: Custom instructions, access control         │
└──────────────────────────┬──────────────────────────────────┘
                           │
              Users access and personalize
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  TIER 3: USER MODELS                                        │
│  Managed by: Individual Users                               │
│  Purpose: Personal AI assistants and favorites              │
│  Examples: My writing style, my research helper             │
│  Configuration: Personal preferences, private chats         │
└─────────────────────────────────────────────────────────────┘
```

### How the Tiers Work Together

**Real-World Example: Creating a Client Welcome Email**

1. **System Model (Tier 1)**: 
   - "Email Composer AI" (GPT-4 based)
   - Trained on professional email writing
   - Available to all organizations on Pro plan

2. **Organization Model (Tier 2)**:
   - Law firm admin enables "Email Composer AI"
   - Adds custom instructions: "Use our firm's formal tone, mention free consultation"
   - Creates task: "New Client Welcome Email" with required fields

3. **User Model (Tier 3)**:
   - Attorney Sarah personalizes with: "Add my direct phone number and scheduling link"
   - Saves favorite prompts for quick access
   - Tracks her personal token usage

4. **Result**: 
   - Sarah gets branded, compliant, personalized emails in seconds
   - Firm maintains quality and consistency
   - Platform provides the AI infrastructure

### Key Concepts to Understand

#### What is an AI Model?

An AI model is a trained algorithm that can understand and generate human-like text. Think of it as a specialized employee:

- **Content Writer AI**: Like hiring a professional writer
- **Support Agent AI**: Like having a 24/7 customer service rep
- **Legal Document AI**: Like having a paralegal assistant
- **Course Creator AI**: Like having an instructional designer

#### What are Tokens?

Tokens are the "currency" of AI usage. Roughly:
- **1 token ≈ 0.75 words** (or about 4 characters)
- **100 tokens ≈ 75 words** (a paragraph)
- **1,000 tokens ≈ 750 words** (a short article)

Both input (your prompt) and output (AI's response) consume tokens.

**Example:**
```
Your prompt: "Write a 200-word product description for noise-canceling headphones"
Tokens used: ~40 (prompt) + ~270 (200-word response) = ~310 tokens total
```

#### What are AI Tasks?

Tasks are predefined workflows that structure AI interactions:

**Without Tasks:**
```
You: "Write an email to John about the meeting"
AI: Generates generic email
Problem: Inconsistent, missing key info
```

**With Tasks:**
```
Task: "Client Meeting Confirmation"
Required Fields: [client_name], [date], [time], [location], [agenda]
You: Fill in the fields
AI: Generates consistent, complete email every time
```

Tasks ensure quality, consistency, and speed.

---

## System Models (Tier 1)

System Models are the foundation of Coded Harmony's AI capabilities—professionally configured, production-ready AI models that you can enable instantly.

### Accessing System Models

1. **Navigate to AI Management**
   - Go to: **Admin → AI → Management**
   - Click the **"System"** tab

2. **What You'll See**
   - List of all available system models
   - Filtered by your organization type
   - Filtered by your pricing plan
   - Each model shows:
     - Name and description
     - Icon representation
     - Required pricing tier
     - Token limits
     - Organization type compatibility
     - Tags (content, support, specialized, etc.)

### Categories of System Models

#### 1. Content Creation Models

**Blog Writer AI** (GPT-4)
- **Purpose**: Generate blog posts, articles, web content
- **Best For**: Content marketers, publishers, bloggers
- **Token Limit**: 2,000 tokens/response
- **Pricing Tier**: Starter+
- **Example Prompt**: "Write a 500-word article about the benefits of remote work"

**Product Description AI** (Claude 3 Sonnet)
- **Purpose**: Create compelling product copy
- **Best For**: E-commerce, retail, catalogs
- **Token Limit**: 500 tokens/response
- **Pricing Tier**: Starter+
- **Example Prompt**: "Describe wireless earbuds with 30-hour battery, waterproof, premium sound"

**SEO Content Optimizer AI** (GPT-4)
- **Purpose**: Optimize content for search engines
- **Best For**: SEO specialists, content managers
- **Token Limit**: 1,500 tokens/response
- **Pricing Tier**: Pro+
- **Example Prompt**: "Optimize this article for keyword 'small business accounting'"

**Social Media AI** (Grok-3-mini)
- **Purpose**: Create social media posts
- **Best For**: Marketing teams, social media managers
- **Token Limit**: 300 tokens/response
- **Pricing Tier**: Starter+
- **Example Prompt**: "Write 5 LinkedIn posts about AI in healthcare"

**Email Composer AI** (Claude 3 Haiku)
- **Purpose**: Draft professional emails
- **Best For**: Business professionals, support teams
- **Token Limit**: 800 tokens/response
- **Pricing Tier**: Free+
- **Example Prompt**: "Write a follow-up email after client meeting discussing contract terms"

#### 2. Customer Support Models

**Support Agent AI** (GPT-4o-mini)
- **Purpose**: Answer customer questions 24/7
- **Best For**: Help centers, live chat, FAQs
- **Token Limit**: 1,000 tokens/response
- **Pricing Tier**: Free+
- **Example Prompt**: "How do I reset my password?"

**Ticket Responder AI** (Claude 3 Sonnet)
- **Purpose**: Generate responses to support tickets
- **Best For**: Customer support teams
- **Token Limit**: 1,200 tokens/response
- **Pricing Tier**: Starter+
- **Example Prompt**: "Customer reports shipping delay, order #12345"

**FAQ Generator AI** (GPT-4)
- **Purpose**: Create FAQ content from documentation
- **Best For**: Knowledge base managers
- **Token Limit**: 2,000 tokens/response
- **Pricing Tier**: Pro+
- **Example Prompt**: "Generate 10 FAQs from our terms of service"

**Sentiment Analyzer AI** (Gemini 1.5 Flash)
- **Purpose**: Analyze customer feedback tone
- **Best For**: Customer success, product teams
- **Token Limit**: 500 tokens/response
- **Pricing Tier**: Pro+
- **Example Prompt**: "Analyze sentiment: 'Your app crashes every time I try to export'"

#### 3. Specialized Industry Models

**Legal Document AI** (GPT-4) *For Law Firms*
- **Purpose**: Assist with legal drafting and research
- **Best For**: Attorneys, paralegals, legal admins
- **Token Limit**: 3,000 tokens/response
- **Pricing Tier**: Pro+
- **Organization Type**: Solicitor/Legal only
- **Example Prompt**: "Draft a non-disclosure agreement for technology consulting"

**Course Creator AI** (Claude 3 Opus) *For Education*
- **Purpose**: Generate lesson plans and course content
- **Best For**: Teachers, instructional designers
- **Token Limit**: 2,500 tokens/response
- **Pricing Tier**: Pro+
- **Organization Type**: Education only
- **Example Prompt**: "Create a 5-lesson unit on the water cycle for 5th graders"

**Immigration Document AI** (GPT-4) *For Immigration Services*
- **Purpose**: Assist with visa applications and documentation
- **Best For**: Immigration consultants, case managers
- **Token Limit**: 2,500 tokens/response
- **Pricing Tier**: Pro+
- **Organization Type**: Immigration only
- **Example Prompt**: "Checklist for UK Tier 2 visa application"

**Patient Communication AI** (Claude 3 Sonnet) *For Healthcare*
- **Purpose**: Draft patient communications
- **Best For**: Medical practices, health services
- **Token Limit**: 1,200 tokens/response
- **Pricing Tier**: Pro+
- **Organization Type**: Healthcare only
- **Example Prompt**: "Explain post-surgery care instructions for knee replacement"

#### 4. Business Intelligence Models

**Data Analyzer AI** (Gemini 1.5 Pro)
- **Purpose**: Analyze data and generate insights
- **Best For**: Business analysts, executives
- **Token Limit**: 2,000 tokens/response
- **Pricing Tier**: Pro+
- **Example Prompt**: "Analyze sales trends: Q1 $100K, Q2 $120K, Q3 $95K, Q4 $140K"

**Report Generator AI** (GPT-4)
- **Purpose**: Create business reports and summaries
- **Best For**: Managers, executives, analysts
- **Token Limit**: 3,000 tokens/response
- **Pricing Tier**: Pro+
- **Example Prompt**: "Summarize this month's customer feedback into executive report"

**Meeting Summarizer AI** (Claude 3 Sonnet)
- **Purpose**: Generate meeting notes and action items
- **Best For**: Project managers, team leads
- **Token Limit**: 2,500 tokens/response
- **Pricing Tier**: Starter+
- **Example Prompt**: "Summarize this meeting transcript and list action items"

#### 5. Creative & Marketing Models

**Ad Copy Writer AI** (GPT-4)
- **Purpose**: Create advertising copy
- **Best For**: Marketing teams, agencies
- **Token Limit**: 800 tokens/response
- **Pricing Tier**: Pro+
- **Example Prompt**: "Write 5 Google Ads headlines for online accounting software"

**Brand Voice AI** (Claude 3 Opus)
- **Purpose**: Match your brand's tone and style
- **Best For**: Brand managers, content teams
- **Token Limit**: 1,500 tokens/response
- **Pricing Tier**: Pro+
- **Example Prompt**: "Rewrite this in our friendly, conversational brand voice: [text]"

**Video Script AI** (GPT-4)
- **Purpose**: Write video scripts and storyboards
- **Best For**: Video producers, content creators
- **Token Limit**: 2,000 tokens/response
- **Pricing Tier**: Pro+
- **Example Prompt**: "Write a 2-minute explainer video script for project management software"

### Enabling System Models

#### Step-by-Step: Enable a System Model

1. **Browse Available Models**
   - Go to: Admin → AI → Management → System tab
   - Use filters:
     - **By Category**: Content, Support, Specialized, Business
     - **By Plan**: Shows only models available on your tier
     - **By Status**: Available, Trial, Featured

2. **Select a Model**
   - Click on any model card to see details
   - Review:
     - Full description and use cases
     - Example prompts
     - Token limits and pricing
     - Organization type compatibility
     - User reviews and ratings (if applicable)

3. **Enable the Model**
   - Click **"Enable for Organization"** button
   - Configure settings:
     ```
     ┌─────────────────────────────────────────┐
     │  Enable System Model                    │
     ├─────────────────────────────────────────┤
     │  Model: Blog Writer AI (GPT-4)          │
     │                                         │
     │  ☑ Enable for all users                │
     │  ☐ Admins only                          │
     │  ☐ Specific roles: [Select]            │
     │                                         │
     │  Token Quota per User:                  │
     │  ○ Use system default (10,000/month)   │
     │  ● Custom limit: [5000] tokens/month   │
     │                                         │
     │  ☑ Allow users to exceed quota with    │
     │     admin approval                      │
     │                                         │
     │  [Cancel]  [Enable Model]               │
     └─────────────────────────────────────────┘
     ```

4. **Confirm and Test**
   - Model appears in "Models" tab (enabled models)
   - Status shows "Active" with green indicator
   - Click "Test Model" to try it immediately

#### Bulk Enable Multiple Models

For quick setup, enable multiple models at once:

1. **Use Quick Enable Wizard**
   - Click **"Quick Setup"** button in System tab
   - Select your use case:
     - Content Publishing
     - Customer Support
     - E-commerce Business
     - Professional Services
     - Educational Institution

2. **Review Recommendations**
   - System recommends 5-8 models for your use case
   - Shows total token budget required
   - Explains why each model is recommended

3. **Customize and Enable**
   - Check/uncheck specific models
   - Set organization-wide token budget
   - Click "Enable All Selected"

**Example: "Customer Support" Quick Setup**
```
Recommended Models:
✓ Support Agent AI (answering questions)
✓ Ticket Responder AI (drafting responses)
✓ FAQ Generator AI (creating help content)
✓ Sentiment Analyzer AI (understanding customer mood)
✓ Email Composer AI (professional communications)

Total Monthly Token Budget: ~50,000 tokens
Perfect for teams of 5-10 support agents
```

### System Model Features

#### Trial Models

Some advanced models offer trial periods:

**How Trials Work:**
- Free access for 14-30 days
- Limited token quota during trial
- No credit card required
- Upgrade prompt when trial ends

**Available Trial Models:**
- GPT-4 Turbo (14-day trial, 5,000 tokens)
- Claude 3 Opus (30-day trial, 10,000 tokens)
- Gemini 1.5 Pro (14-day trial, 8,000 tokens)

**To Start a Trial:**
1. Find model with "Trial Available" badge
2. Click "Start Trial"
3. Confirm trial terms
4. Begin using immediately
5. Receive reminders at 50%, 80%, 100% usage

#### Featured Models

Platform-highlighted models with special benefits:

- **Editor's Choice**: Recommended by Coded Harmony team
- **Most Popular**: Used by 70%+ of organizations
- **New & Trending**: Recently added models
- **Industry Best**: Top-rated for specific industries

Featured models often include:
- Extended trial periods
- Bonus token credits
- Priority support
- Advanced training resources

#### Model Versioning

System models are regularly updated:

**Version Updates:**
- **Minor Updates** (automatic): Bug fixes, performance improvements
- **Major Updates** (opt-in): New capabilities, breaking changes

**Update Notifications:**
- Email alert when new version available
- In-app notification in AI Management
- Changelog shows what's new
- Test new version before switching

**Example:**
```
📢 Blog Writer AI v2.1 Available

What's New:
✓ 40% faster response times
✓ Better SEO keyword integration
✓ Improved tone consistency
✓ Support for 15 new languages

Action Required: None (auto-update in 7 days)
Or: Update Now | Learn More
```

---

## Organization Models (Tier 2)

Organization Models are where you customize AI for your specific business needs. Create AI agents that understand your brand, your processes, and your customers.

### When to Create Organization Models

**You Should Create Custom Models When:**
- ✅ You need AI to match your specific brand voice
- ✅ You have unique workflows or processes
- ✅ System models don't fit your exact needs
- ✅ You want to combine multiple AI capabilities
- ✅ You need industry-specific compliance rules
- ✅ You're automating repetitive tasks

**You Can Use System Models When:**
- ✅ Generic responses are acceptable
- ✅ You're just getting started with AI
- ✅ Your needs match standard use cases
- ✅ You want quick setup without configuration

### Accessing Organization Models

1. **Navigate to Models Page**
   - Go to: Admin → AI → Management
   - Click **"Models"** tab (shows enabled models)
   - Click **"Add Model"** tab to create new

2. **What You'll See**
   - List of all enabled system models
   - Your custom organization models
   - Quick actions: Test, Edit, Disable, Delete
   - Usage stats for each model

### Creating Your First Custom Model

Let's walk through creating a custom model step-by-step.

#### Example Scenario: Law Firm Client Intake Assistant

**Business Need**: 
Your law firm wants an AI that helps potential clients understand services, gather initial information, and schedule consultations—all while maintaining your firm's professional yet approachable tone.

#### Step 1: Access Model Creator

1. Go to: Admin → AI → Management → Add Model
2. Choose starting point:
   - **Start from Scratch**: Build completely custom model
   - **Clone System Model**: Use system model as base
   - **Import Template**: Load pre-built template

For this example: **Clone System Model** (Support Agent AI)

#### Step 2: Basic Configuration

```
┌──────────────────────────────────────────────────────┐
│  Create Custom AI Model                              │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Model Name *                                        │
│  ┌──────────────────────────────────────────────┐   │
│  │ Acme Legal Client Intake Assistant           │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  Role (What this AI does) *                          │
│  ┌──────────────────────────────────────────────┐   │
│  │ Client intake specialist for family and      │   │
│  │ estate planning law firm                     │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  Icon                                                │
│  [Scale Icon ⚖️] [Change Icon]                       │
│                                                      │
│  Description (Internal notes)                        │
│  ┌──────────────────────────────────────────────┐   │
│  │ Helps potential clients understand our       │   │
│  │ services, answers common questions,          │   │
│  │ and guides them to schedule consultation     │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
└──────────────────────────────────────────────────────┘
```

#### Step 3: AI Engine Configuration

```
┌──────────────────────────────────────────────────────┐
│  AI Engine Settings                                  │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Base AI Model *                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │ [▼] GPT-4o (OpenAI)                          │   │
│  │                                              │   │
│  │ Alternatives:                                │   │
│  │ • Claude 3 Sonnet (Anthropic)                │   │
│  │ • Grok-3 (xAI)                               │   │
│  │ • Gemini 1.5 Pro (Google)                    │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  API Configuration                                   │
│  ○ Use shared organization API key                  │
│  ● Use dedicated API key (advanced)                 │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │ sk-proj-abc123...                            │   │
│  └──────────────────────────────────────────────┘   │
│  [Test Connection]                                   │
│                                                      │
│  API Endpoint (Advanced)                             │
│  ┌──────────────────────────────────────────────┐   │
│  │ https://api.openai.com/v1/chat/completions  │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**💡 Tip**: Use shared organization API key for simplicity. Dedicated keys are useful for:
- Separate billing tracking
- Different rate limits
- Isolation for compliance

#### Step 4: System Message (The Most Important Part)

The system message defines your AI's personality, knowledge, and behavior.

```
┌──────────────────────────────────────────────────────┐
│  System Message                                      │
│  This instructs the AI on how to behave             │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │ You are a client intake specialist for Acme │   │
│  │ Legal Services, a boutique law firm         │   │
│  │ specializing in family law and estate        │   │
│  │ planning based in Seattle, Washington.       │   │
│  │                                              │   │
│  │ Your Role:                                   │   │
│  │ - Help potential clients understand our     │   │
│  │   services and expertise                     │   │
│  │ - Answer common questions about family law  │   │
│  │   and estate planning                        │   │
│  │ - Gather initial information about their    │   │
│  │   situation                                  │   │
│  │ - Guide them to schedule a free 30-minute   │   │
│  │   consultation                               │   │
│  │                                              │   │
│  │ Our Services:                                │   │
│  │ 1. Divorce & Separation (contested and      │   │
│  │    uncontested)                              │   │
│  │ 2. Child Custody & Support                  │   │
│  │ 3. Estate Planning (wills, trusts, POAs)    │   │
│  │ 4. Probate & Estate Administration          │   │
│  │                                              │   │
│  │ Our Attorneys:                               │   │
│  │ - Sarah Johnson (Managing Partner, 20 years)│   │
│  │ - Michael Chen (Family Law, 12 years)       │   │
│  │ - Emily Rodriguez (Estate Planning, 8 years)│   │
│  │                                              │   │
│  │ Tone & Style:                                │   │
│  │ - Professional yet warm and approachable    │   │
│  │ - Empathetic (many clients are in difficult │   │
│  │   situations)                                │   │
│  │ - Clear and jargon-free language            │   │
│  │ - Patient and thorough                       │   │
│  │                                              │   │
│  │ Important Guidelines:                        │   │
│  │ - DO NOT provide specific legal advice      │   │
│  │   (that requires consultation)               │   │
│  │ - DO explain general legal concepts and     │   │
│  │   processes                                  │   │
│  │ - ALWAYS mention our free 30-minute         │   │
│  │   consultation when appropriate              │   │
│  │ - If question is outside our practice areas,│   │
│  │   politely say so and suggest they consult  │   │
│  │   a specialist                               │   │
│  │ - For complex situations, recommend booking │   │
│  │   consultation rather than trying to answer │   │
│  │   via chat                                   │   │
│  │                                              │   │
│  │ Office Hours: Mon-Fri 9am-5pm Pacific       │   │
│  │ Phone: (206) 555-0123                       │   │
│  │ Email: info@acmelegal.com                   │   │
│  │ Booking: [link to scheduler]                │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  [Preview] [Use Template] [AI Suggestions]           │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**System Message Best Practices:**

1. **Be Specific About Identity**
   - Who is this AI? (role, company, expertise)
   - What context should it know?

2. **Define Clear Responsibilities**
   - What SHOULD this AI do?
   - What should it NOT do?

3. **Set Tone and Style**
   - Formal or casual?
   - Brief or detailed?
   - Technical or simple language?

4. **Provide Necessary Context**
   - Company information
   - Services/products
   - Common scenarios
   - Key policies

5. **Set Boundaries**
   - What topics to avoid
   - When to escalate to humans
   - Compliance requirements

#### Step 5: Model Parameters

Fine-tune AI behavior with advanced settings:

```
┌──────────────────────────────────────────────────────┐
│  Model Parameters                                    │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Max Tokens (Response Length)                        │
│  ├────────┬────────┬────────┬────────┬────────┤     │
│  100    500    1000    2000    4000                  │
│         ●━━━━━━━━━━━━━━○                             │
│         1200 tokens (~900 words)                     │
│                                                      │
│  Temperature (Creativity)                            │
│  ├────────┬────────┬────────┬────────┬────────┤     │
│  0.0    0.3    0.5    0.7    1.0                     │
│         ●━━━━━━○                                     │
│         0.5 (Balanced)                               │
│                                                      │
│  Focused (0.0-0.3): Consistent, predictable          │
│  Balanced (0.4-0.6): Good mix of consistency and     │
│                      creativity                      │
│  Creative (0.7-1.0): More varied, imaginative        │
│                                                      │
│  Top P (Nucleus Sampling)                            │
│  ┌──────────────────────────────────────────────┐   │
│  │ 0.9 (Recommended)                            │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  Frequency Penalty (Reduce Repetition)               │
│  ┌──────────────────────────────────────────────┐   │
│  │ 0.3 (Slight reduction)                       │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  Presence Penalty (Encourage New Topics)             │
│  ┌──────────────────────────────────────────────┐   │
│  │ 0.2 (Slight encouragement)                   │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  [Reset to Defaults]                                 │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**Parameter Recommendations by Use Case:**

| Use Case | Max Tokens | Temperature | Why |
|----------|-----------|-------------|-----|
| Customer Support | 500-1000 | 0.3-0.5 | Clear, consistent answers |
| Creative Writing | 1500-3000 | 0.7-0.9 | Varied, imaginative content |
| Technical Documentation | 1000-2000 | 0.2-0.4 | Accurate, focused content |
| Marketing Copy | 500-1000 | 0.6-0.8 | Engaging, persuasive |
| Legal/Medical | 1000-2000 | 0.1-0.3 | Precise, compliant |
| Email Responses | 300-800 | 0.4-0.6 | Professional, balanced |

#### Step 6: Access Control

Determine who can use this model:

```
┌──────────────────────────────────────────────────────┐
│  Access Control                                      │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Who can use this model?                             │
│  ○ All users in organization                         │
│  ● Specific roles only                               │
│  ○ Individual users (select below)                   │
│                                                      │
│  Select Roles:                                       │
│  ☑ Admins                                            │
│  ☑ Support Agents                                    │
│  ☑ Content Managers                                  │
│  ☐ Standard Users                                    │
│                                                      │
│  Token Quota                                         │
│  Per User Per Month:                                 │
│  ┌──────────────────────────────────────────────┐   │
│  │ 10,000 tokens                                │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  ☑ Allow users to request quota increase            │
│  ☑ Notify admin when user reaches 80% of quota      │
│  ☐ Hard limit (block when exceeded)                 │
│  ☑ Soft limit (allow overage with notification)     │
│                                                      │
│  Organization-Wide Monthly Budget:                   │
│  ┌──────────────────────────────────────────────┐   │
│  │ 100,000 tokens                               │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
└──────────────────────────────────────────────────────┘
```

#### Step 7: Test Your Model

Before deploying, thoroughly test the model:

```
┌──────────────────────────────────────────────────────┐
│  Test Model                                          │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Test Prompt:                                        │
│  ┌──────────────────────────────────────────────┐   │
│  │ Hi, I'm going through a divorce and need    │   │
│  │ help with child custody arrangements. Can    │   │
│  │ you help me?                                 │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  [Send] [Clear] [Load Example Prompts]               │
│                                                      │
│  AI Response:                                        │
│  ┌──────────────────────────────────────────────┐   │
│  │ Hello! I'm here to help you understand      │   │
│  │ your options. Child custody is one of our   │   │
│  │ firm's key practice areas.                  │   │
│  │                                              │   │
│  │ Child custody arrangements typically involve:│   │
│  │ • Physical custody (where the child lives)  │   │
│  │ • Legal custody (decision-making authority) │   │
│  │ • Visitation schedules                       │   │
│  │ • Support obligations                        │   │
│  │                                              │   │
│  │ Every situation is unique, and Washington   │   │
│  │ courts prioritize the child's best interests│   │
│  │ above all else.                              │   │
│  │                                              │   │
│  │ I'd recommend scheduling a free 30-minute   │   │
│  │ consultation with Michael Chen, our family  │   │
│  │ law specialist. He can review your specific │   │
│  │ situation and provide tailored guidance.     │   │
│  │                                              │   │
│  │ Would you like me to help you schedule that?│   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  Tokens Used: 247 (prompt: 27, response: 220)       │
│  Response Time: 2.3 seconds                          │
│                                                      │
│  [Test Another Prompt] [Adjust Parameters]           │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**Testing Checklist:**

- ✅ Test with typical user questions
- ✅ Test edge cases and unusual requests
- ✅ Verify tone and style match expectations
- ✅ Confirm it stays within defined boundaries
- ✅ Check it doesn't provide information it shouldn't
- ✅ Test with different user roles (if role-based access)
- ✅ Verify it escalates appropriately
- ✅ Check response times are acceptable

#### Step 8: Save and Deploy

```
┌──────────────────────────────────────────────────────┐
│  Save Model                                          │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Model Status:                                       │
│  ○ Draft (Save but don't activate)                  │
│  ● Active (Make available immediately)               │
│                                                      │
│  Deployment Options:                                 │
│  ☑ Add to Help Center chat widget                   │
│  ☑ Make available in AI models list                 │
│  ☐ Set as default model for support tickets         │
│  ☑ Include in mobile app                            │
│                                                      │
│  Notifications:                                      │
│  ☑ Notify team members about new model              │
│  ☑ Send usage guide to selected roles               │
│                                                      │
│  [Cancel]  [Save as Draft]  [Save & Activate]        │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## User Models (Tier 3)

User Models empower individual team members to create personal AI assistants tailored to their specific work style and needs.

### Understanding User Models

**What are User Models?**
Personal AI configurations that individual users create for their own productivity. They:
- Inherit from system and organization models
- Add personal preferences and instructions
- Remain private to the user
- Don't consume organization model quota (separate allocation)

**Example Scenarios:**

**Attorney Sarah's Personal Models:**
- "My Writing Style AI": Knows Sarah prefers concise, bullet-pointed emails
- "Case Research Assistant": Configured for Sarah's practice areas
- "Client Communication AI": Uses Sarah's preferred tone and phrases

**Content Manager Mike's Personal Models:**
- "SEO Optimizer": Set to Mike's keyword targets and strategy
- "Social Media Scheduler": Knows Mike's posting schedule and preferred hashtags
- "Blog Editor": Trained on Mike's editorial guidelines

### Creating User Models

#### Access Personal AI Workspace

1. **Navigate to Account AI**
   - Go to: **Account → AI Models** (user-level, not admin)
   - Or click profile icon → **My AI Models**

2. **What You'll See**
   - Available system models (enabled by admin)
   - Available organization models
   - Your personal models
   - Favorites and recent conversations

#### Create Personal AI Model

1. **Click "Create Personal Model"**

2. **Choose Base**
   ```
   Start from:
   ○ System Model: Email Composer AI
   ○ Organization Model: Client Communication AI
   ○ From Scratch: Build completely custom
   
   [Continue]
   ```

3. **Add Personal Instructions**
   ```
   ┌─────────────────────────────────────────────┐
   │  Personal Model Configuration               │
   ├─────────────────────────────────────────────┤
   │                                             │
   │  Name: My Email Style                       │
   │                                             │
   │  Personal Instructions:                     │
   │  ┌───────────────────────────────────────┐  │
   │  │ Add to the base model:                │  │
   │  │                                       │  │
   │  │ - Use my name: Sarah Johnson         │  │
   │  │ - My title: Family Law Attorney      │  │
   │  │ - Keep emails under 150 words        │  │
   │  │ - Use bullet points when listing     │  │
   │  │   multiple items                     │  │
   │  │ - End with: "Best regards, Sarah"    │  │
   │  │ - Include my phone: (206) 555-0145   │  │
   │  │ - Add my Calendly link for meetings  │  │
   │  └───────────────────────────────────────┘  │
   │                                             │
   │  Privacy:                                   │
   │  ● Private to me only                       │
   │  ○ Share with my team                       │
   │                                             │
   │  [Save]  [Cancel]                           │
   └─────────────────────────────────────────────┘
   ```

4. **Test and Use**
   - Test with sample prompts
   - Add to favorites for quick access
   - Use across all Coded Harmony features

### Personal AI Features

#### Favorite Models

Mark frequently used models for quick access:
- Star icon on any model card
- Favorites appear at top of model list
- Keyboard shortcut: `Cmd/Ctrl + <number>` for top 9 favorites

#### Conversation History

All your AI interactions are saved:
- Browse past conversations
- Continue previous conversations
- Search conversation history
- Export conversations for reference

#### Personal Prompt Library

Save frequently used prompts:

```
My Saved Prompts:

1. "Weekly Status Email"
   Model: My Email Style
   Prompt: "Write weekly status email covering..."
   Last used: 2 days ago

2. "Blog Post Outline"
   Model: Blog Writer AI
   Prompt: "Create outline for blog post about..."
   Last used: 5 days ago

3. "Social Media Posts"
   Model: Social Media AI
   Prompt: "Create 5 posts promoting..."
   Last used: 1 week ago
```

---

## Selecting AI Models

Now that you understand the three tiers, let's explore how to select the right model for your task.

### Model Selection Criteria

#### 1. Task Type

**Content Creation:**
- Blog Writer AI → Long-form articles
- Product Description AI → E-commerce copy
- Social Media AI → Short-form posts
- Email Composer AI → Professional communications

**Customer Support:**
- Support Agent AI → General inquiries
- Ticket Responder AI → Detailed responses
- FAQ Generator AI → Knowledge base content

**Specialized:**
- Legal Document AI → Legal firms only
- Course Creator AI → Educational institutions
- Immigration Document AI → Immigration services

#### 2. Response Quality Needed

**When Accuracy is Critical:**
- Use GPT-4, Claude 3 Opus, Gemini 1.5 Pro
- Lower temperature (0.1-0.3)
- Examples: Legal, medical, financial content

**When Creativity is Valued:**
- Use GPT-4, Claude 3 Sonnet
- Higher temperature (0.7-0.9)
- Examples: Marketing, storytelling, brainstorming

**When Speed Matters:**
- Use GPT-4o-mini, Grok-3-mini, Claude 3 Haiku
- Shorter max tokens
- Examples: Quick responses, chat support, social media

#### 3. Token Budget

**Cost Considerations:**
```
Model Costs (approximate per 1K tokens):

High-End Models:
• GPT-4: $0.03 input, $0.06 output
• Claude 3 Opus: $0.015 input, $0.075 output
• Gemini 1.5 Pro: $0.0035 input, $0.0105 output

Mid-Range Models:
• GPT-4o: $0.005 input, $0.015 output
• Claude 3 Sonnet: $0.003 input, $0.015 output
• Grok-3: $0.002 input, $0.010 output

Budget Models:
• GPT-4o-mini: $0.00015 input, $0.0006 output
• Claude 3 Haiku: $0.00025 input, $0.00125 output
• Gemini 1.5 Flash: $0.000075 input, $0.0003 output
```

**Budget Strategy:**
- Use budget models for routine tasks (80% of usage)
- Reserve premium models for complex/important tasks (20%)
- Monitor usage and adjust based on value delivered

#### 4. Response Time

**Model Speed Comparison:**

| Model | Avg Response Time | Best For |
|-------|------------------|----------|
| GPT-4o-mini | 0.5-1.5 sec | Real-time chat |
| Grok-3-mini | 0.8-2 sec | Live support |
| Claude 3 Haiku | 1-2 sec | Quick responses |
| GPT-4o | 2-4 sec | Standard content |
| Claude 3 Sonnet | 3-5 sec | Quality content |
| GPT-4 | 5-10 sec | Complex tasks |
| Claude 3 Opus | 8-15 sec | Premium content |
| Gemini 1.5 Pro | 6-12 sec | Analysis tasks |

### Model Selection Wizard

Coded Harmony includes an intelligent model selector:

```
┌─────────────────────────────────────────────────────┐
│  AI Model Selector                                  │
├─────────────────────────────────────────────────────┤
│                                                     │
│  What do you want to do?                            │
│                                                     │
│  ○ Write blog post or article                      │
│  ● Answer customer question                         │
│  ○ Create product description                      │
│  ○ Draft email or letter                           │
│  ○ Generate social media posts                     │
│  ○ Other                                           │
│                                                     │
│  [Continue]                                         │
│                                                     │
└─────────────────────────────────────────────────────┘

↓ (After selection)

┌─────────────────────────────────────────────────────┐
│  Recommended Models for: Answer Customer Question   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ⭐ BEST MATCH                                       │
│  Support Agent AI (GPT-4o-mini)                     │
│  • Optimized for customer support                  │
│  • Fast responses (~1 second)                       │
│  • Cost-effective                                   │
│  • Your quota: 8,500 / 10,000 tokens remaining     │
│  [Use This Model]                                   │
│                                                     │
│  ALTERNATIVES                                       │
│                                                     │
│  Ticket Responder AI (Claude 3 Sonnet)             │
│  • More detailed responses                         │
│  • Better for complex issues                       │
│  • Slower (~3 seconds)                             │
│  [Use This Model]                                   │
│                                                     │
│  Custom: Client Communication AI                    │
│  • Your organization's custom model                │
│  • Includes brand-specific information             │
│  [Use This Model]                                   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Quick Reference: Model Selection

```
QUICK DECISION TREE:

Need immediate response?
└─ Yes → GPT-4o-mini, Grok-3-mini, Claude 3 Haiku
└─ No  → Continue

Need maximum accuracy?
└─ Yes → GPT-4, Claude 3 Opus
└─ No  → Continue

Need creative/varied content?
└─ Yes → GPT-4, Claude 3 Sonnet (temp 0.7-0.9)
└─ No  → Continue

Budget conscious?
└─ Yes → GPT-4o-mini, Gemini 1.5 Flash
└─ No  → GPT-4o, Claude 3 Sonnet

DEFAULT SAFE CHOICE: GPT-4o (balanced speed/quality/cost)
```

---

## Creating Custom AI Agents

*(This section continues with Task-Based Workflows...)*

**[Content continues in next response due to length limit]**

---

*This is Part 1 of the AI Model Management Guide. Continue to Part 2 for Task-Based Workflows, Token Management, Analytics, and Best Practices.*

*Coded Harmony Business OS - Master the AI That Powers Your Business*

*Last Updated: November 2025*
