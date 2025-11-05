# AI Data Extraction - Quick Start Guide

## What is it?

AI automatically extracts and remembers information about you from your conversations (name, skills, experience, etc.) and uses it to personalize future responses.

## Quick Setup (3 steps)

### 1. Create Data Extraction Task

**Admin Panel** → **AI Management** → Select Model → **Edit Tasks**:

```
Task Name: Data for settings
System Message: Extract structured data from the user's message or document. Focus on professional information like name, education, skills, experience, languages, and certifications. Output as key-value pairs.
```

### 2. Use the Task

**Chat Widget** → **Select Task Dropdown** → Choose **"Data for settings"**

### 3. Share Your Info

Send a message with your information:

```
Hi! I'm John Doe, a senior full-stack developer with 8 years of experience. 
I specialize in React, Node.js, TypeScript, and PostgreSQL. 
I speak English and Spanish fluently.
I have a BS in Computer Science from Stanford (2015).
```

**Done!** The AI extracted and saved your information.

---

## How It Works

```
You → "I'm Jane, Python developer with 5 years experience"
    ↓
AI extracts → { "Full Name": "Jane", "Skills": "Python", "Experience": "5 years" }
    ↓
Saved to your profile
    ↓
Future AI chats automatically use this info
```

---

## Example Use Cases

### 📄 **CV/Resume Builder**
```
You: "Create my CV"
AI: "Here's your CV using your profile:

JOHN DOE
Senior Full-Stack Developer

SKILLS
React, Node.js, TypeScript, PostgreSQL

EXPERIENCE
8 years in software development
..."
```

### 📧 **Personalized Email**
```
You: "Write a professional introduction email"
AI: "Hi, I'm John Doe, a senior full-stack developer with 8 years 
of experience specializing in React and Node.js..."
```

### 📝 **Cover Letter**
```
You: "Generate a cover letter for a React position"
AI: Uses your: Name, Experience, Skills, Education automatically
```

---

## What Gets Extracted?

**Professional:**
- ✅ Full Name
- ✅ Education (degree, university, year)
- ✅ Skills (programming languages, tools)
- ✅ Work Experience (years, role, company)
- ✅ Certifications (AWS, Google, etc.)

**Personal:**
- ✅ Languages spoken
- ✅ Hobbies & Interests
- ✅ Location

**Contact:**
- ✅ LinkedIn profile
- ✅ GitHub username
- ✅ Portfolio website

---

## Managing Your Data

### View Extracted Data

**Chat Widget** → **Model Dropdown** → **"Manage Settings"**

### Edit Data

1. Open Settings modal
2. Click ✏️ (Edit) next to any field
3. Update value
4. Click ✅ (Save)

### Delete Data

1. Open Settings modal
2. Click 🗑️ (Delete) next to field
3. Or click "Clear All"

### Add Manual Entry

1. Open Settings modal
2. Click "+ Add Setting"
3. Enter key (e.g., "Portfolio") and value (e.g., "https://mysite.com")
4. Save

---

## API Usage (For Developers)

### Extract Data from Text

```typescript
const response = await fetch('/api/chat/extract-data', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    content: "I'm Jane Doe, React developer...",
  }),
});

const { extracted, confidence } = await response.json();
// extracted = { "Full Name": "Jane Doe", "Skills": "React", ... }
```

### Save Extracted Data

```typescript
const response = await fetch('/api/chat/settings', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    action: 'add',
    settingKey: 'Skills',
    settingValue: 'Python, JavaScript, Docker',
  }),
});
```

### Use in Chat Requests

```typescript
const response = await axios.post('/api/chat', {
  messages: [{ role: 'user', content: 'Create my CV' }],
  useSettings: true, // <-- Injects your default_settings into AI context
}, {
  headers: { Authorization: `Bearer ${accessToken}` }
});
```

---

## Tips for Best Results

### ✅ **Do:**
- Be specific: "I'm a senior React developer with 5 years experience"
- Use clear formatting: "Skills: Python, JavaScript, Docker"
- Provide complete info: Name, role, years, technologies

### ❌ **Don't:**
- Be vague: "I work with computers"
- Use slang: "I'm a JS ninja" → Use "JavaScript developer"
- Mix facts and opinions: Stick to factual info

---

## Privacy & Security

### Your Data is Safe

- ✅ **Private:** Only you can see your extracted data
- ✅ **Controlled:** Edit/delete anytime
- ✅ **Transparent:** See exactly what's stored
- ✅ **Scoped:** Used only for YOUR AI conversations

### GDPR Compliance

- **Right to Access:** View all your data in Settings modal
- **Right to Erasure:** Delete all data with one click
- **Right to Rectification:** Edit incorrect data anytime

---

## Troubleshooting

### Data Not Extracted?

**Check:**
1. Did you select "Data for settings" task?
2. Is your message clear and factual?
3. Is the AI model capable (GPT-4, Grok, Claude)?

**Solution:**
- Try again with clearer language
- Use bullet points for structured info

### Wrong Data Extracted?

**Fix:**
1. Open Settings modal
2. Edit incorrect fields
3. Delete unwanted fields

### Data Not Used in Responses?

**Check:**
1. Is `useSettings` enabled in your chat?
2. Does AI model support settings injection?

**Solution:**
- Ensure "Use Settings" is checked in chat options
- Verify Settings modal has data

---

## Examples

### Example 1: Professional Profile

**Input:**
```
I'm Sarah Johnson, a UX/UI designer with 6 years of experience. 
I specialize in Figma, Adobe XD, and user research. 
I have a Master's in Human-Computer Interaction from CMU (2017).
I speak English, Japanese, and Korean.
LinkedIn: linkedin.com/in/sarahjohnson
```

**Extracted:**
```json
{
  "Full Name": "Sarah Johnson",
  "Work Experience": "6 years as UX/UI designer",
  "Skills": "Figma, Adobe XD, User Research",
  "Education": "Master's in Human-Computer Interaction, CMU, 2017",
  "Languages": "English, Japanese, Korean",
  "LinkedIn": "linkedin.com/in/sarahjohnson"
}
```

### Example 2: Student Profile

**Input:**
```
Hi, I'm Alex Chen, currently studying Computer Science at Berkeley (graduating 2025). 
I know Python, Java, and C++. I've done internships at Google and Microsoft.
I'm interested in machine learning and AI.
```

**Extracted:**
```json
{
  "Full Name": "Alex Chen",
  "Education": "BS Computer Science, Berkeley, 2025 (expected)",
  "Skills": "Python, Java, C++",
  "Work Experience": "Internships at Google and Microsoft",
  "Interests": "Machine Learning, AI"
}
```

---

## Advanced: Extraction from Documents

### Upload CV/Resume

1. Chat Widget → 📎 (Paperclip) → Upload CV (PDF/DOCX)
2. Select "Data for settings" task
3. Send message: "Extract my information from this CV"
4. AI parses document and extracts all relevant data

### Supported File Types

- ✅ PDF (parsed text)
- ✅ DOCX (Word documents)
- ✅ TXT (plain text)
- ✅ MD (Markdown)

---

## Next Steps

1. ✅ Set up "Data for settings" task (if not done)
2. ✅ Share your professional info with AI
3. ✅ Review extracted data in Settings
4. ✅ Try: "Create my CV" or "Write my bio"
5. ✅ Enjoy personalized AI responses!

---

## Need Help?

- **Documentation:** See `AI_DATA_EXTRACTION_FEATURE.md` for complete guide
- **Admin Support:** Contact your organization admin
- **Technical Issues:** Check browser console for errors
- **Database:** Admins can query `ai_user_settings.default_settings`

---

## Summary

✅ **Automatic extraction** from conversations/documents  
✅ **Secure storage** in your profile  
✅ **Personalized AI** responses  
✅ **Full control** - view/edit/delete anytime  
✅ **Privacy-focused** - your data stays yours  

**Start using it now:** Select "Data for settings" task and share your info!
