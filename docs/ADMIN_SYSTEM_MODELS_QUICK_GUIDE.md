# System Models Quick Reference

## Admin Access to System Models

### Location
Navigate to: **Admin Panel → AI Management → System Tab**

### What Are System Models?

System models are AI models created by platform superadmins that organizations can enable for their users. Unlike custom models (which you create yourself), system models:
- Are pre-configured and maintained by the platform
- Include enterprise-grade models with specific features
- Are filtered based on your organization type and pricing plan
- Can be enabled/disabled with one click

### How to Enable a System Model

1. Go to **AI Management**
2. Click the **System** tab (sparkles icon ✨)
3. Find the model you want to enable
4. Click **"Enable for Users"** button
5. The model is now available to your organization's users

**Visual Feedback:**
- Enabled models have a **green border** and **"Enabled" badge**
- Disabled models have a gray border

### How to Disable a System Model

1. Find the enabled model (green border)
2. Click **"Disable for Users"** button (red)
3. The model is now hidden from your users

### Bulk Actions

**Enable All:**
- Enables all visible system models at once
- Useful when setting up a new organization
- Button disabled if all models already enabled

**Disable All:**
- Disables all visible system models at once
- Useful for restricting access temporarily
- Button disabled if all models already disabled

### Filtering & Search

**Search Box:**
Type to filter models by:
- Model name
- Description text

**Status Filter:**
- **All**: Show both enabled and disabled models
- **Enabled Only**: Show only models currently enabled
- **Disabled Only**: Show only models currently disabled

**Plan Filter:**
- **All**: Show models for all plan levels
- **Free/Starter/Pro/Enterprise**: Show only models for that plan

### Understanding Model Information

Each model card shows:

**Header:**
- **Icon & Name**: Model identifier
- **Status Badge**: 
  - 🟢 **Enabled** - Available to your users
  - ⭐ **Featured** - Recommended by platform
  - 🆓 **Free** - No usage limits
  - ⏰ **Trial** - Limited trial period

**Details:**
- **Role**: User, Admin, or System level access
- **Required Plan**: Minimum plan needed to use this model
- **Max Tokens**: Maximum response length
- **Token Limit**: Usage limit (per day/week/month)
- **Tasks**: Number of pre-configured tasks
- **Trial Period**: Days available in trial mode (if applicable)

**Tags:**
Model categories and features (up to 5 shown, "+X more" if additional)

### How Filtering Works

You only see models that match **both** criteria:

#### 1. Organization Type Match
If your organization is type "healthcare", you'll see:
- Models with empty organization types (available to all)
- Models that include "healthcare" in their types

You **won't** see:
- Models specifically for "education" or "legal" (unless they also include "healthcare")

#### 2. Pricing Plan Match
Your plan level must meet or exceed the model's requirement:

| Your Plan | Can Access |
|-----------|------------|
| Free | Free models only |
| Starter | Free + Starter models |
| Pro | Free + Starter + Pro models |
| Enterprise | All models |

**Example:**
- If you have a **Pro** plan, you can see Free, Starter, and Pro models
- You **cannot** see Enterprise-only models
- To access Enterprise models, upgrade your plan

### Info Panel

At the top of the System Models tab:

```
System AI Models
Enable system-wide AI models for your organization users. Models are 
filtered based on your organization type (healthcare) and plan (pro).

Available: 12  |  Enabled: 5  |  Disabled: 7
```

**Counts:**
- **Available**: Total models visible to you (after filtering)
- **Enabled**: Models currently accessible to your users
- **Disabled**: Models you can enable but haven't yet

### Common Scenarios

#### Setting Up for the First Time
1. Click **System** tab
2. Review available models
3. Click **"Enable All"** to make all available
4. Or selectively enable specific models you want
5. Users can now access enabled models

#### Restricting Access Temporarily
1. Click **System** tab
2. Click **"Disable All"** button
3. All models hidden from users
4. Re-enable when ready

#### Finding Models for Specific Use Cases
1. Use **Search** box (e.g., "content generation")
2. Review model descriptions and task counts
3. Enable models that match your needs
4. Test with users and adjust as needed

#### After Plan Upgrade
1. Navigate to **System** tab
2. You'll see new models that weren't visible before
3. Enable the new higher-tier models
4. Notify your team about new capabilities

### What Users See

When you enable a system model:
- It appears in your users' AI model selection dropdown
- Users can select it for their tasks
- Usage counts toward your organization limits
- Token limits are enforced automatically

When you disable a system model:
- It disappears from users' model selection
- Existing tasks using that model may fail
- Users get notification to select different model

### Best Practices

**DO:**
- ✅ Enable models relevant to your use case
- ✅ Review model descriptions before enabling
- ✅ Check token limits for your expected usage
- ✅ Test new models before rolling out to all users
- ✅ Disable unused models to keep interface clean

**DON'T:**
- ❌ Enable all models "just because"
- ❌ Disable models without notifying users
- ❌ Forget to check plan requirements before expecting access
- ❌ Ignore token limits (may cause unexpected usage blocks)

### Troubleshooting

**Q: I don't see many models. Why?**

A: Models are filtered by your organization type and pricing plan. Check:
1. Your organization type in settings
2. Your current pricing plan
3. Contact support if you believe you should see more

**Q: I can't enable a specific model I need.**

A: The model might require:
1. A higher pricing plan (check "Required Plan" field)
2. A different organization type
3. Contact support to discuss custom access

**Q: What happens if I disable a model users are actively using?**

A: Users will see an error when trying to use that model. They'll need to:
1. Select a different enabled model
2. Update their preferences
3. Contact you if they need that specific model

**Q: Can I customize the models?**

A: System models are managed by platform admins and cannot be customized. However, you can:
1. Create custom models in the "Models" tab
2. Request features through support
3. Set custom token limits (future feature)

**Q: How do token limits work?**

A: Each model has:
- **Max Tokens**: Maximum single response length
- **Token Limit**: Total usage allowed per period
  - Example: "10,000/day" means 10k tokens per day
  - Resets automatically at period end

### Need Help?

- **Documentation**: See full implementation details in `/docs/ADMIN_SYSTEM_MODELS_IMPLEMENTATION.md`
- **Database Schema**: Check `/docs/SYSTEM_MODELS_DATABASE_SCHEMA.md`
- **Support**: Contact platform support for access issues or custom requirements

---

**Feature Status:** ✅ Live and Production-Ready  
**Last Updated:** 2024
