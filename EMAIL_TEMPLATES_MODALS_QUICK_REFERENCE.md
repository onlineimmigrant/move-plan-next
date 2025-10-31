# Email Templates - Modal Quick Reference

## 🎯 Quick Access

### Files Location:
```
/src/components/EmailTemplates/_shared/components/
├── EmailTemplateEditModal.tsx
├── EmailTemplatePreviewModal.tsx
├── EmailTemplateTestSendModal.tsx
└── PlaceholderHelper.tsx
```

---

## 📝 Edit Modal

### Props:
```typescript
{
  isOpen: boolean;
  mode: 'add' | 'edit';
  template: EmailTemplateForm | null;
  organizationId: string | null;
  onClose: () => void;
  onSave: (template: EmailTemplateForm) => void;
  saving?: boolean;
}
```

### Example:
```tsx
<EmailTemplateEditModal
  isOpen={isOpen}
  mode="add"
  template={formData}
  organizationId={orgId}
  onClose={() => setIsOpen(false)}
  onSave={async (data) => {
    await createTemplate(data);
  }}
  saving={loading}
/>
```

---

## 👁️ Preview Modal

### Props:
```typescript
{
  isOpen: boolean;
  template: EmailTemplate | null;
  onClose: () => void;
  onTestSend?: (template: EmailTemplate) => void;
}
```

### Example:
```tsx
<EmailTemplatePreviewModal
  isOpen={previewOpen}
  template={selectedTemplate}
  onClose={() => setPreviewOpen(false)}
  onTestSend={(t) => {
    setPreviewOpen(false);
    setTestSendOpen(true);
  }}
/>
```

---

## 📧 Test Send Modal

### Props:
```typescript
{
  isOpen: boolean;
  template: EmailTemplate | null;
  onClose: () => void;
  onSend: (template: EmailTemplate, toEmail: string, placeholders: PlaceholderValues) => Promise<void>;
}
```

### Example:
```tsx
<EmailTemplateTestSendModal
  isOpen={testSendOpen}
  template={selectedTemplate}
  onClose={() => setTestSendOpen(false)}
  onSend={async (template, email, placeholders) => {
    await fetch('/api/send-email', {
      method: 'POST',
      body: JSON.stringify({
        to: email,
        templateId: template.id,
        placeholders
      })
    });
  }}
/>
```

---

## 🔤 Placeholder Helper

### Props:
```typescript
{
  value: string;
  onChange: (value: string) => void;
  onInsert?: (placeholder: string) => void;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  className?: string;
  disabled?: boolean;
}
```

### Examples:

#### Single Line (Subject):
```tsx
<PlaceholderHelper
  value={subject}
  onChange={setSubject}
  placeholder="Enter subject..."
/>
```

#### Multiline (HTML):
```tsx
<PlaceholderHelper
  value={htmlCode}
  onChange={setHtmlCode}
  placeholder="Enter HTML..."
  multiline={true}
  rows={12}
/>
```

---

## 🎨 Available Placeholders

### Standard:
- `{{user_name}}`, `{{user_email}}`, `{{user_phone}}`
- `{{company_name}}`, `{{support_email}}`, `{{current_year}}`

### Ticket:
- `{{ticket_id}}`, `{{ticket_subject}}`, `{{ticket_status}}`
- `{{ticket_message}}`, `{{response_message}}`, `{{responder_name}}`

### Meeting:
- `{{meeting_title}}`, `{{meeting_date}}`, `{{meeting_time}}`
- `{{meeting_link}}`, `{{host_name}}`, `{{duration_minutes}}`
- `{{meeting_notes}}`, `{{cancellation_reason}}`

### Auth:
- `{{verification_link}}`, `{{reset_link}}`

### Order:
- `{{order_id}}`, `{{order_total}}`, `{{order_items}}`

### Newsletter:
- `{{newsletter_title}}`, `{{newsletter_content}}`, `{{unsubscribe_link}}`
- `{{trial_end_date}}`

---

## 🔧 Utility Functions

### Extract Placeholders:
```typescript
import { extractPlaceholders } from '@/components/EmailTemplates/_shared/utils';

const placeholders = extractPlaceholders('Hello {{user_name}}!');
// Returns: ['user_name']
```

### Replace Placeholders:
```typescript
import { replacePlaceholders } from '@/components/EmailTemplates/_shared/utils';

const result = replacePlaceholders(
  'Hello {{user_name}}!',
  { user_name: 'John' }
);
// Returns: 'Hello John!'
```

### Validate Form:
```typescript
import { validateEmailTemplateForm } from '@/components/EmailTemplates/_shared/utils';

const { isValid, errors } = validateEmailTemplateForm(formData);
if (!isValid) {
  console.log(errors); // { subject: 'Subject is required', ... }
}
```

---

## 🚦 Common Patterns

### Opening Edit Modal:
```typescript
// Add new
const handleAdd = () => {
  openAddTemplateModal();
};

// Edit existing
const handleEdit = (template: EmailTemplate) => {
  selectTemplateForEdit(template);
};
```

### Chaining Modals:
```typescript
// Preview → Test Send
<EmailTemplatePreviewModal
  onTestSend={(template) => {
    setPreviewModalOpen(false);
    setSendTestModalOpen(true);
  }}
/>

// Edit → Preview
const handleSaveAndPreview = async (formData) => {
  await saveTemplate(formData);
  setEditModalOpen(false);
  setPreviewModalOpen(true);
};
```

### Form State Management:
```typescript
const [formData, setFormData] = useState<EmailTemplateForm>({
  organization_id: orgId,
  type: 'welcome',
  subject: '',
  html_code: '',
  name: '',
  description: '',
  email_main_logo_image: '',
  from_email_address_type: 'transactional_email',
  is_active: true,
  category: 'transactional',
});
```

---

## 🐛 Troubleshooting

### Modal Not Opening:
- ✅ Check `isOpen` state is true
- ✅ Verify modal is rendered in component
- ✅ Check z-index (should be 50+)

### Placeholder Not Detected:
- ✅ Use `{{placeholder_name}}` format (double braces)
- ✅ No spaces inside braces
- ✅ Use underscores not dashes

### Test Email Not Sending:
- ✅ Verify `/api/send-email` endpoint exists
- ✅ Check AWS SES configuration
- ✅ Ensure all placeholders have values
- ✅ Validate email format

### Save Not Working:
- ✅ Check all required fields filled
- ✅ Validate organization_id (admin context)
- ✅ Check API response for errors
- ✅ Verify handleSaveTemplate implementation

---

## 📊 State Flow

### Add Template Flow:
```
User clicks "Add" 
→ openAddTemplateModal() 
→ templateEditModalOpen = true 
→ templateEditMode = 'add'
→ User fills form
→ User clicks "Create"
→ onSave(formData)
→ handleFieldChange for each field
→ addTemplate()
→ API POST /api/email-templates
→ Success message
→ Modal closes
→ List refreshes
```

### Edit Template Flow:
```
User clicks "Edit" on card
→ selectTemplateForEdit(template)
→ selectedEditTemplate = template
→ templateEditModalOpen = true
→ templateEditMode = 'edit'
→ Form pre-fills with data
→ User modifies fields
→ User clicks "Save"
→ onSave(formData)
→ handleFieldChange for each field
→ updateTemplate()
→ API PUT /api/email-templates/[id]
→ Success message
→ Modal closes
→ List refreshes
```

### Preview Flow:
```
User clicks "Preview"
→ setPreviewModalOpen(true)
→ selectTemplateForEdit(template)
→ Modal shows template
→ User fills placeholders
→ Preview updates in real-time
→ replacePlaceholders() called
→ User toggles Rendered/HTML view
→ User clicks "Test Send" (optional)
→ Opens test send modal
→ User closes modal
```

### Test Send Flow:
```
User clicks "Test"
→ setSendTestModalOpen(true)
→ selectTemplateForEdit(template)
→ Modal shows form
→ User enters email
→ User fills placeholders
→ User clicks "Send"
→ Validates email format
→ Validates placeholders complete
→ onSend(template, email, placeholders)
→ POST /api/send-email
→ Success message
→ Auto-close after 2s
```

---

## 💡 Pro Tips

1. **Use Type Dropdown:** Automatically sets category and default subject
2. **Type `{{` in inputs:** Triggers placeholder autocomplete
3. **Preview Before Testing:** Verify HTML renders correctly
4. **Test Email to Yourself:** Easiest way to verify templates
5. **Reset Placeholders:** Use "Reset All" button in preview
6. **Browse All Placeholders:** Click "Browse All" to see full list
7. **Save Often:** No autosave, click save to persist changes

---

## 🎯 Best Practices

### Template Creation:
- ✅ Use descriptive names
- ✅ Add helpful descriptions
- ✅ Include all relevant placeholders
- ✅ Test before activating
- ✅ Keep HTML simple and email-safe

### Placeholder Usage:
- ✅ Use consistent naming (snake_case)
- ✅ Document required placeholders
- ✅ Provide fallback values
- ✅ Test with real data

### Testing:
- ✅ Test on multiple email clients
- ✅ Verify responsive design
- ✅ Check placeholder replacement
- ✅ Test all links work

---

## 📚 Related Files

### Type Definitions:
- `/src/components/EmailTemplates/_shared/types/emailTemplate.ts`

### Utilities:
- `/src/components/EmailTemplates/_shared/utils/emailTemplate.utils.ts`

### Hooks:
- `/src/components/EmailTemplates/_shared/hooks/useEmailTemplateManagement.ts`

### Pages:
- `/src/app/[locale]/admin/email-templates/page.tsx`
- `/src/app/[locale]/superadmin/email-templates/page.tsx`

---

## 🆘 Support

For issues or questions:
1. Check the main documentation: `EMAIL_TEMPLATES_ADVANCED_FEATURES_COMPLETE.md`
2. Review implementation details: `EMAIL_TEMPLATES_UI_IMPLEMENTATION_COMPLETE.md`
3. Check code comments in component files
4. Review console for error messages

