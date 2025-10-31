# Email Template Placeholders - Quick Reference

## 📋 Standard Placeholders (Available in All Templates)

These placeholders are automatically replaced by the `/api/send-email` system:

| Placeholder | Description | Example Value |
|------------|-------------|---------------|
| `{{name}}` | Recipient's full name | "John Doe" |
| `{{site}}` | Organization/site name | "Metexam" |
| `{{email_main_logo_image}}` | Logo image URL | "https://cdn.example.com/logo.png" |
| `{{emailDomainRedirection}}` | Action/redirect URL | "https://example.com/account" |
| `{{privacyPolicyUrl}}` | Privacy policy page | "https://example.com/privacy-policy" |
| `{{unsubscribeUrl}}` | Unsubscribe link | "https://example.com/unsubscribe?user_id=..." |
| `{{address}}` | Organization address | "123 Main St, City, State 12345" |
| `{{subject}}` | Email subject | "Welcome to Metexam!" |

---

## 🎫 Ticket-Specific Placeholders

Available when email `type` is `ticket_confirmation` or `ticket_response`:

| Placeholder | Description | Example Value |
|------------|-------------|---------------|
| `{{ticket_id}}` | Ticket ID number | "12345" |
| `{{ticket_subject}}` | Ticket subject line | "Login Issues" |
| `{{ticket_message}}` | Ticket message content | "I cannot log into my account..." |
| `{{preferred_contact_method}}` | Contact preference | "email" |
| `{{preferred_date}}` | Preferred contact date | "2025-11-01" |
| `{{preferred_time_range}}` | Preferred time range | "Morning (9am-12pm)" |
| `{{response_message}}` | Admin's response | "We're investigating your issue..." |

---

## 📅 Meeting-Specific Placeholders

Available when email `type` is `meeting_invitation`:

| Placeholder | Description | Example Value |
|------------|-------------|---------------|
| `{{meeting_title}}` | Meeting name/title | "Consultation Call" |
| `{{host_name}}` | Meeting host's name | "Dr. Smith" |
| `{{meeting_time}}` | Meeting date/time | "Nov 1, 2025 at 2:00 PM EST" |
| `{{duration_minutes}}` | Meeting duration | "30" |
| `{{meeting_notes}}` | Meeting notes (plain text) | "Bring relevant documents" |
| `{{meeting_notes_html}}` | Meeting notes (HTML formatted) | `<div>Bring documents</div>` |

---

## 🔑 Authentication Placeholders

Available when email `type` is `reset_email` or `email_confirmation`:

| Placeholder | Description | Example Value |
|------------|-------------|---------------|
| `{{reset_link}}` | Password reset URL | "https://example.com/reset?token=..." |
| `{{confirmation_link}}` | Email confirmation URL | "https://example.com/confirm?token=..." |
| `{{token}}` | Verification token | "abc123def456" |

---

## 🛒 Order-Specific Placeholders

Available when email `type` is `order_confirmation`:

| Placeholder | Description | Example Value |
|------------|-------------|---------------|
| `{{order_id}}` | Order ID number | "ORD-12345" |
| `{{order_total}}` | Total order amount | "$99.99" |
| `{{order_date}}` | Order date | "Nov 1, 2025" |
| `{{items_list}}` | List of ordered items | "Item 1, Item 2" |

---

## 📰 Newsletter Placeholders

Available when email `type` is `newsletter`:

| Placeholder | Description | Example Value |
|------------|-------------|---------------|
| `{{newsletter_title}}` | Newsletter title | "October 2025 Updates" |
| `{{newsletter_content}}` | Main newsletter content | HTML content |
| `{{unsubscribe_link}}` | Newsletter unsubscribe | "https://example.com/newsletter/unsubscribe" |

---

## 🎨 HTML Template Example with Placeholders

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{subject}}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0;">
  <div style="max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    
    <!-- Header with Logo -->
    <div style="background-color: #4F46E5; padding: 30px 20px; text-align: center;">
      <img src="{{email_main_logo_image}}" alt="{{site}} Logo" style="max-width: 150px; height: auto;">
    </div>
    
    <!-- Content -->
    <div style="padding: 30px 20px;">
      <h1 style="color: #4F46E5; margin-top: 0;">Hi {{name}}!</h1>
      
      <p>Welcome to {{site}}. We're excited to have you on board!</p>
      
      <!-- Call to Action Button -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{emailDomainRedirection}}" 
           style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: #ffffff; text-decoration: none; border-radius: 5px;">
          Get Started
        </a>
      </div>
      
      <p style="color: #6B7280; font-size: 14px;">
        If you have any questions, feel free to reply to this email.
      </p>
    </div>
    
    <!-- Footer -->
    <div style="background-color: #F9FAFB; padding: 20px; text-align: center; font-size: 12px; color: #6B7280;">
      <p>&copy; 2025 {{site}}. All rights reserved.</p>
      <p>{{address}}</p>
      <p>
        <a href="{{privacyPolicyUrl}}" style="color: #4F46E5; text-decoration: none;">Privacy Policy</a> | 
        <a href="{{unsubscribeUrl}}" style="color: #4F46E5; text-decoration: none;">Unsubscribe</a>
      </p>
    </div>
    
  </div>
</body>
</html>
```

---

## 🔧 Custom Placeholder Usage

### Adding Custom Placeholders

When calling `/api/send-email`, you can pass custom placeholders via the `placeholders` object:

```typescript
await fetch('/api/send-email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'custom_email',
    to: 'user@example.com',
    organization_id: 'your-org-id',
    name: 'John Doe',
    emailDomainRedirection: 'https://example.com',
    placeholders: {
      custom_field_1: 'Custom Value 1',
      custom_field_2: 'Custom Value 2',
      appointment_time: '2:00 PM EST',
      // Add any custom fields here
    },
  }),
});
```

Then use them in your template:
```html
<p>Your appointment is scheduled for {{appointment_time}}</p>
<p>Custom info: {{custom_field_1}}</p>
```

---

## 📚 Template Type Reference

### Email Type → Required Placeholders

| Email Type | Required Placeholders | Optional Placeholders |
|-----------|----------------------|----------------------|
| `welcome` | `{{name}}`, `{{site}}`, `{{emailDomainRedirection}}` | - |
| `reset_email` | `{{name}}`, `{{emailDomainRedirection}}` | `{{reset_link}}` |
| `email_confirmation` | `{{name}}`, `{{emailDomainRedirection}}` | `{{confirmation_link}}` |
| `ticket_confirmation` | `{{name}}`, `{{ticket_id}}`, `{{ticket_subject}}` | All ticket placeholders |
| `ticket_response` | `{{name}}`, `{{ticket_id}}`, `{{response_message}}` | All ticket placeholders |
| `meeting_invitation` | `{{name}}`, `{{meeting_title}}`, `{{emailDomainRedirection}}` | All meeting placeholders |
| `newsletter` | `{{name}}`, `{{site}}` | `{{newsletter_title}}`, `{{newsletter_content}}` |
| `order_confirmation` | `{{name}}`, `{{order_id}}`, `{{order_total}}` | All order placeholders |

---

## 🎯 Best Practices

### 1. Always Include Fallbacks
```html
<!-- Good: Provides fallback -->
<p>Hello {{name}}!</p>

<!-- Better: Handles missing data -->
<p>Hello {{name}} <!-- fallback handled by system -->!</p>
```

### 2. Use Conditional Placeholders
Some placeholders may not always be available. The system replaces missing placeholders with 'N/A':

```html
<!-- This will show "N/A" if meeting_notes is not provided -->
<p>Notes: {{meeting_notes}}</p>

<!-- Better: Only show when available (requires custom logic) -->
{{meeting_notes_html}}
```

### 3. Escape HTML in User Content
User-provided content (like `{{ticket_message}}`) should be displayed in a way that prevents HTML injection:

```html
<!-- Safe: Display as plain text -->
<pre style="white-space: pre-wrap;">{{ticket_message}}</pre>

<!-- Or use a div with proper styling -->
<div style="word-wrap: break-word;">{{ticket_message}}</div>
```

### 4. Test with Sample Data
Always preview templates with realistic sample data before activating:

```typescript
const sampleData = {
  name: 'John Doe',
  site: 'Your Platform',
  ticket_id: '12345',
  ticket_subject: 'Test Subject',
  meeting_time: 'Nov 1, 2025 at 2:00 PM',
  // ... all relevant placeholders
};
```

---

## 🔍 Debugging Placeholder Issues

### Common Issues

1. **Placeholder not replaced**
   - Check spelling: `{{name}}` not `{{Name}}`
   - Ensure placeholder is passed in API call
   - Verify template type matches available placeholders

2. **Shows "N/A" instead of value**
   - Placeholder not provided in API request
   - Check `placeholders` object in API call
   - Verify data exists in source (e.g., ticket has that field)

3. **HTML not rendering**
   - Check if using plain text placeholder instead of HTML version
   - Example: Use `{{meeting_notes_html}}` instead of `{{meeting_notes}}`

4. **Special characters broken**
   - Ensure proper HTML encoding
   - Check character set in email header (UTF-8)

---

## 📖 Additional Resources

- **Email Template Management:** `/docs/PHASE0_EMAIL_TEMPLATE_MANAGEMENT.md`
- **Send Email API:** `/src/app/api/send-email/route.ts`
- **AI Integration Plan:** `/docs/EMAIL_AI_AGENTS_INTEGRATION_PLAN.md`

---

## 🆘 Support

For questions about placeholders:
1. Check this reference guide
2. Review `/api/send-email/route.ts` for implementation
3. Test with preview API: `/api/email-templates/preview`
4. Contact platform support for custom placeholder requests
